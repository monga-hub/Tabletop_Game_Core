// tests/contracts-s0 — il contratto S0 è una funzione pura, "stupida":
// 3 Sardine -> consumate -> 15 punti. Nessuna scelta, nessun evento nuovo.
import { Session } from "../packages/session/session";
import { PescariaDraftSystem } from "../examples/pescaria/draft-system";
import { PescariaDraftPickSystem } from "../examples/pescaria/draft-pick-system";
import { evaluateContractsS0 } from "../examples/pescaria/contracts-s0";
import { Card } from "../examples/pescaria/model/card";

let f = 0; const ok = (c: boolean, m: string) => { if (c) console.log(`  ✓ ${m}`); else { console.error(`  ✗ ${m}`); f++; } };
console.log("TEST — Contracts S0 (3 Sardine -> 15 punti, consuma le carte)\n");

// --- 1) la funzione pura, isolata dal motore ---
const registry: Card[] = [
  { id: "s1", species: "sardina", stars: 1, auctionValue: 1 },
  { id: "s2", species: "sardina", stars: 2, auctionValue: 1 },
  { id: "s3", species: "sardina", stars: 3, auctionValue: 1 },
  { id: "s4", species: "sardina", stars: 4, auctionValue: 1 },
  { id: "t1", species: "tonno", stars: 1, auctionValue: 1 },
];
const r1 = evaluateContractsS0({ a: ["s1", "s2", "s3", "t1"], b: ["s1", "t1"] }, registry);
ok(r1.scores["a"] === 15, "3 sardine in mano -> 15 punti");
ok(r1.hands["a"].length === 1 && r1.hands["a"][0] === "t1", "le 3 sardine vengono rimosse, il resto resta");
ok(r1.scores["b"] === 0, "meno di 3 sardine -> 0 punti, mano invariata");
ok(r1.hands["b"].length === 2, "mano senza contratto completato resta intatta");

const r2 = evaluateContractsS0({ c: ["s1", "s2", "s3", "s4"] }, registry);
ok(r2.hands["c"].length === 1 && r2.hands["c"][0] === "s4", "con 4 sardine: solo 3 vengono consumate (al massimo una volta)");
ok(r2.scores["c"] === 15, "il completamento resta singolo: 15 punti, non di più");

// --- 2) integrazione: draft.completed -> hands -> contracts, nello stesso passo ---
const deck: Card[] = [
  { id: "A", species: "sardina", stars: 1, auctionValue: 1 },
  { id: "B", species: "sardina", stars: 2, auctionValue: 1 },
  { id: "C", species: "sardina", stars: 3, auctionValue: 1 },
  { id: "D", species: "tonno", stars: 1, auctionValue: 1 },
  { id: "E", species: "branzino", stars: 1, auctionValue: 1 },
  { id: "F", species: "orata", stars: 1, auctionValue: 1 },
];
const systems = [PescariaDraftSystem, PescariaDraftPickSystem];
const s = new Session({ systems, seed: 7 });
s.submit({ type: "pescaria.draft.start", agentId: "h", payload: { players: ["p1", "p2"], cards: deck, cardsPerPlayer: 3 } });
const order = (s.getState().entities["__draft__"] as { order: string[] }).order;
const [p0, p1] = order;
// p0 prende le 3 sardine (A,B,C); p1 prende il resto (D,E,F)
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p0, cardId: "A" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p1, cardId: "D" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p0, cardId: "B" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p1, cardId: "E" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p0, cardId: "C" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p1, cardId: "F" } });

const hands = s.getState().entities["__hands__"] as Record<string, string[]>;
const scores = s.getState().entities["__scores__"] as Record<string, number>;
ok(hands[p0].length === 0, "p0 (3 sardine) ha la mano svuotata dal contratto");
ok(scores[p0] === 15, "p0 ottiene 15 punti");
ok(hands[p1].length === 3 && scores[p1] === 0, "p1 (nessuna sardina x3) resta invariato, 0 punti");
ok(!hands[p0].includes("A") && !hands[p0].includes("B") && !hands[p0].includes("C"), "le 3 sardine specifiche sono state consumate");

// nessun nuovo evento: il log non contiene nulla oltre a draft.* e phase.changed
const types = new Set(s.getLog().map((e) => e.type));
ok(![...types].some((t) => t.includes("contract")), "nessun evento nuovo introdotto: contracts è una funzione pura, non un System");

const a = JSON.stringify(s.getState());
const b = JSON.stringify(Session.replay(s.getLog(), systems, 7));
ok(a === b, "replay == stato (il contratto è deterministico, niente stato extra nel log)");

console.log("");
if (f === 0) { console.log("VERDE. Contratto S0: sorgente di valore contestuale, nessuna astrazione anticipata."); process.exit(0); } else process.exit(1);
