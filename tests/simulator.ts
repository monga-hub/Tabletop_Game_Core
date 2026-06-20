// ============================================================
// tests/simulator — il simulatore cieco gioca partite intere di draft
// Verifica: agenti che NON conoscono le regole completano un draft usando
// solo legalIntents. Mille partite → nessuna esplode → segnale forte.
// ============================================================
import { Session } from "../packages/session/session";
import { PescariaDraftSystem } from "../examples/pescaria/draft-system";
import { PescariaDraftPickSystem } from "../examples/pescaria/draft-pick-system";
import { RandomAgent } from "../packages/sim/agent";
import { runGame } from "../packages/sim/simulator";
import { asCards } from "../examples/pescaria/model/test-cards";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else { console.error(`  ✗ FALLITO: ${msg}`); failures++; }
}

console.log("TEST — Simulatore cieco (agenti che non conoscono le regole)\n");

// RNG deterministico per il test
function makeRng(seed: number) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }

const systems = [PescariaDraftSystem, PescariaDraftPickSystem];

// una partita: 3 giocatori, 2 carte a testa, pool di 6
const s = new Session({ systems, seed: 1 });
s.submit({ type: "pescaria.draft.start", agentId: "host",
  payload: { players: ["alice", "bob", "carla"], cards: asCards(["A","B","C","D","E","F"]), cardsPerPlayer: 2 } });

const agents = [
  new RandomAgent("alice", makeRng(11)),
  new RandomAgent("bob", makeRng(22)),
  new RandomAgent("carla", makeRng(33)),
];
const result = runGame(s, agents);

assert(result.finished, "la partita finisce da sola (agenti senza mosse legali)");
assert(s.getLog().some((e) => e.type === "pescaria.draft.completed"), "il draft.completed emerge da agenti ciechi");
const game = s.getState().entities["__game__"] as { phase: string };
assert(game.phase === "post-draft", "la fase è transitata a post-draft");

// ogni giocatore ha esattamente 2 carte
const d = s.getState().entities["__draft__"] as { pickedCards: Record<string, string[]> };
assert(["alice","bob","carla"].every((p) => d.pickedCards[p].length === 2), "ogni agente ha pescato esattamente 2 carte");

// replay == stato anche su una partita generata dal simulatore
const a = JSON.stringify(s.getState());
const b = JSON.stringify(Session.replay(s.getLog(), systems, 1));
assert(a === b, "replay == stato (partita simulata)");

// MILLE PARTITE: nessuna deve esplodere o restare bloccata
let completed = 0;
for (let i = 0; i < 1000; i++) {
  const sim = new Session({ systems, seed: i });
  sim.submit({ type: "pescaria.draft.start", agentId: "host",
    payload: { players: ["p1","p2","p3"], cards: asCards(["A","B","C","D","E","F"]), cardsPerPlayer: 2 } });
  const r = runGame(sim, [
    new RandomAgent("p1", makeRng(i*3+1)),
    new RandomAgent("p2", makeRng(i*3+2)),
    new RandomAgent("p3", makeRng(i*3+3)),
  ]);
  if (r.finished && sim.getLog().some((e) => e.type === "pescaria.draft.completed")) completed++;
}
assert(completed === 1000, `tutte le 1000 partite completano il draft (${completed}/1000)`);

console.log("");
if (failures === 0) { console.log("VERDE. Il simulatore cieco gioca 1000 draft completi con legalIntents."); process.exit(0); }
else { console.error(`ROSSO. ${failures} asserzioni fallite.`); process.exit(1); }
