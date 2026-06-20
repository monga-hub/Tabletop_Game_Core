// tests/fishing — 0033: la Pesca dei pesci. Nessuna scelta, un solo evento
// derivato dal sacchetto. Tutti i pesci vanno nell'area condivisa (Stoccaggio).
import { Session } from "../packages/session/session";
import { PescariaFishingSystem } from "../examples/pescaria/fishing-system";
import { FISH_SPECIES, standardBag } from "../examples/pescaria/model/fish";

let f = 0; const ok = (c: boolean, m: string) => { if (c) console.log(`  ✓ ${m}`); else { console.error(`  ✗ ${m}`); f++; } };
console.log("TEST — Fishing (0033: pesca nell'area condivisa)\n");

const systems = [PescariaFishingSystem];

// --- 1) pesca base: 3 giocatori -> 18 pesci, tutti nello stoccaggio ---
const s = new Session({ systems, seed: 11 });
s.submit({ type: "pescaria.fishing.draw", agentId: "h", payload: { players: ["a", "b", "c"] } });

const stoccaggio = s.getState().entities["__stoccaggio__"] as Record<string, number>;
const bag = s.getState().entities["__bag__"] as Record<string, number>;
const totalDrawn = FISH_SPECIES.reduce((sum, sp) => sum + stoccaggio[sp], 0);
const totalBagLeft = FISH_SPECIES.reduce((sum, sp) => sum + bag[sp], 0);

ok(totalDrawn === 18, "3 giocatori x 6 = 18 pesci pescati, tutti nell'area condivisa");
ok(totalBagLeft === 100 - 18, "il sacchetto si riduce esattamente di quanto pescato");
ok(FISH_SPECIES.every((sp) => stoccaggio[sp] + bag[sp] === 20), "ogni specie: pescato + rimasto = 20 (conservazione)");

// --- 2) determinismo: stesso seed -> stesso risultato ---
const s2 = new Session({ systems, seed: 11 });
s2.submit({ type: "pescaria.fishing.draw", agentId: "h", payload: { players: ["a", "b", "c"] } });
ok(JSON.stringify(s2.getState()) === JSON.stringify(s.getState()), "stesso seed -> stesso risultato (determinismo)");

// --- 3) replay == stato ---
const a = JSON.stringify(s.getState());
const b = JSON.stringify(Session.replay(s.getLog(), systems, 11));
ok(a === b, "replay == stato (la pesca è ricostruibile dal log)");

// --- 4) rifiuto: non c'è abbastanza pesce nel sacchetto ---
const s3 = new Session({ systems, seed: 5 });
const r3 = s3.submit({ type: "pescaria.fishing.draw", agentId: "h", payload: { players: Array.from({ length: 20 }, (_, i) => `p${i}`) } }); // 20*6=120 > 100
ok(!r3.accepted, "20 giocatori (120 pesci richiesti) rifiutato: il sacchetto ne ha solo 100");

// --- 5) nessuna scelta del giocatore: nessun legalIntents esposto ---
ok(PescariaFishingSystem.legalIntents === undefined, "nessun legalIntents: la pesca non è una decisione di un agente");

console.log("");
if (f === 0) { console.log("VERDE. Pesca dei pesci: area condivisa, nessuna scelta, un solo evento."); process.exit(0); } else process.exit(1);
