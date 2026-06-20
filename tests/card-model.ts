// ============================================================
// tests/card-model — le carte diventano distinguibili → il simulatore
// passa da esecutore a strumento di analisi del design.
// ============================================================
import { Session } from "../packages/session/session";
import { PescariaDraftSystem } from "../examples/pescaria/draft-system";
import { PescariaDraftPickSystem } from "../examples/pescaria/draft-pick-system";
import { GreedyAgent } from "../examples/pescaria/greedy-agent";
import { sampleDeck, Card } from "../examples/pescaria/model/card";
import { runGame } from "../packages/sim/simulator";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else { console.error(`  ✗ FALLITO: ${msg}`); failures++; }
}

console.log("TEST — CardModel: carte distinguibili e comportamento\n");

const systems = [PescariaDraftSystem, PescariaDraftPickSystem];
const deck = sampleDeck(); // 16 carte, 4 specie × 4 stelle

// una partita con agenti GREEDY (preferiscono le stelle alte)
const s = new Session({ systems, seed: 1 });
s.submit({ type: "pescaria.draft.start", agentId: "host",
  payload: { players: ["alice", "bob", "carla"], cards: deck, cardsPerPlayer: 2 } });

const agents = [
  new GreedyAgent("alice", () => s.getState()),
  new GreedyAgent("bob", () => s.getState()),
  new GreedyAgent("carla", () => s.getState()),
];
runGame(s, agents);

const d = s.getState().entities["__draft__"] as { pickedCards: Record<string, string[]>; registry: Card[] };
const starsOf = (id: string) => d.registry.find((c) => c.id === id)!.stars;

// gli agenti greedy hanno preso carte ad alte stelle: la media dei picked > media del mazzo
const pickedIds = Object.values(d.pickedCards).flat();
const avgPicked = pickedIds.reduce((a, id) => a + starsOf(id), 0) / pickedIds.length;
const avgDeck = deck.reduce((a, c) => a + c.stars, 0) / deck.length;
assert(avgPicked > avgDeck, `i greedy prendono carte sopra la media (picked ${avgPicked.toFixed(2)} > mazzo ${avgDeck.toFixed(2)})`);

// il primo a scegliere ha preso la carta da 4 stelle (comportamento, non caso)
const firstPlayer = (s.getState().entities["__game__"] as { order: string[] }).order[0];
const firstPick = d.pickedCards[firstPlayer][0];
assert(starsOf(firstPick) === 4, "il primo greedy prende una carta da 4 stelle (comportamento)");

// replay == stato con il registry nel log
const a = JSON.stringify(s.getState());
const b = JSON.stringify(Session.replay(s.getLog(), systems, 1));
assert(a === b, "replay == stato (registry delle carte nel log)");

// --- ANALISI DI DESIGN: 200 partite, quali carte restano non scelte? ---
// (3 giocatori × 2 carte = 6 prese su 16 → 10 restano. quali?)
const neverPicked = new Set(deck.map((c) => c.id));
for (let i = 0; i < 200; i++) {
  const sim = new Session({ systems, seed: i });
  sim.submit({ type: "pescaria.draft.start", agentId: "h", payload: { players: ["p1","p2","p3"], cards: sampleDeck(), cardsPerPlayer: 2 } });
  const ags = ["p1","p2","p3"].map((p) => new GreedyAgent(p, () => sim.getState()));
  runGame(sim, ags);
  const dd = sim.getState().entities["__draft__"] as { pickedCards: Record<string, string[]> };
  for (const id of Object.values(dd.pickedCards).flat()) neverPicked.delete(id);
}
// con agenti greedy, le carte a 1 stella dovrebbero non essere MAI prese (domanda di design!)
const lowStarsNeverPicked = [...neverPicked].filter((id) => starsOf(id) === 1).length;
console.log(`  [design] carte mai scelte in 200 partite greedy: ${neverPicked.size}/16`);
console.log(`  [design] di cui a 1 stella: ${lowStarsNeverPicked}`);
assert(neverPicked.size > 0, "alcune carte non vengono MAI scelte da agenti greedy (prima domanda di design)");

console.log("");
if (failures === 0) { console.log("VERDE. Le carte sono distinguibili: il simulatore ora analizza il design, non solo le regole."); process.exit(0); }
else { console.error(`ROSSO. ${failures} asserzioni fallite.`); process.exit(1); }
