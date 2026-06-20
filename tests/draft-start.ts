// ============================================================
// tests/draft-start — il primo concetto di Pescaria: la nascita di una fase
// Verifica:
//  - draft.start produce una CATENA di 3 eventi (non uno solo)
//  - l'ordine giocatori è generato deterministicamente dallo stato
//  - replay == stato regge con una catena multi-evento
//  - la PhaseProjection ricostruisce fase+ordine dal solo log
//  - due Session con lo stesso seed producono lo STESSO ordine (determinismo)
// ============================================================
import { Session } from "../packages/session/session";
import { PescariaDraftSystem } from "../examples/pescaria/draft-system";
import { PhaseProjection } from "../examples/pescaria/phase-projection";
import { AuditProjection } from "../packages/core/audit-projection";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else { console.error(`  ✗ FALLITO: ${msg}`); failures++; }
}

console.log("TEST — pescaria.draft.start (nascita di una fase)\n");

const phase = new PhaseProjection();
const audit = new AuditProjection();
const s = new Session({ systems: [PescariaDraftSystem], projections: [phase, audit], seed: 42 });

const r = s.submit({ type: "pescaria.draft.start", agentId: "host", payload: { players: ["alice", "bob", "carol", "dave"], cards: ["A","B","C","D"], cardsPerPlayer: 1 } });

// 1. la catena: 1 intent radice + 3 conseguenze = 4 eventi
assert(r.accepted === true, "draft.start è accettato");
assert(r.emitted.length === 4, "draft.start produce una catena di 4 eventi (1 intent + 3 conseguenze)");
const types = r.emitted.map((e) => e.type);
assert(types.includes("pescaria.phase.changed"), "  ...include phase.changed");
assert(types.includes("pescaria.draft.created"), "  ...include draft.created");
assert(types.includes("pescaria.draft.order.decided"), "  ...include player.order.generated");

// 2. ogni conseguenza è causata dall'intent (catena causale)
const consequences = r.emitted.filter((e) => e.type !== "pescaria.draft.start");
const intentId = r.emitted.find((e) => e.type === "pescaria.draft.start")!.id;
assert(consequences.every((e) => e.causedBy === intentId), "ogni conseguenza punta all'intent come causa");

// 3. la fase è cambiata
assert(phase.view().phase === "draft", "la projection vede la fase 'draft'");
assert(phase.view().order.length === 4, "l'ordine contiene 4 giocatori");
assert(
  [...phase.view().order].sort().join() === ["alice","bob","carol","dave"].sort().join(),
  "l'ordine è una permutazione degli stessi giocatori"
);

// 4. non puoi iniziare un secondo draft mentre uno è attivo
const r2 = s.submit({ type: "pescaria.draft.start", agentId: "host", payload: { players: ["x","y"], cards: ["A"], cardsPerPlayer: 1 } });
assert(r2.accepted === false, "non puoi iniziare un draft se una fase è già attiva");

// 5. replay == stato, con una catena multi-evento e l'RNG avanzato
const stateA = JSON.stringify(s.getState());
const stateB = JSON.stringify(Session.replay(s.getLog(), [PescariaDraftSystem], 42));
assert(stateA === stateB, "replay == stato regge con catena multi-evento e RNG avanzato");

// 6. DETERMINISMO: stesso seed → stesso ordine
const s2 = new Session({ systems: [PescariaDraftSystem], seed: 42 });
s2.submit({ type: "pescaria.draft.start", agentId: "host", payload: { players: ["alice", "bob", "carol", "dave"], cards: ["A","B","C","D"], cardsPerPlayer: 1 } });
const order1 = (s.getState().entities["__game__"] as { order: string[] }).order;
const order2 = (s2.getState().entities["__game__"] as { order: string[] }).order;
assert(order1.join() === order2.join(), `stesso seed → stesso ordine (${order1.join(",")})`);

// 7. seed diverso → (probabilmente) ordine diverso, comunque valido
const s3 = new Session({ systems: [PescariaDraftSystem], seed: 999 });
s3.submit({ type: "pescaria.draft.start", agentId: "host", payload: { players: ["alice", "bob", "carol", "dave"], cards: ["A","B","C","D"], cardsPerPlayer: 1 } });
const order3 = (s3.getState().entities["__game__"] as { order: string[] }).order;
assert(order3.length === 4 && new Set(order3).size === 4, "seed diverso: ordine valido (4 giocatori distinti)");

console.log("");
if (failures === 0) { console.log("VERDE. Il framework rappresenta la nascita di una fase, con catena di eventi deterministica."); process.exit(0); }
else { console.error(`ROSSO. ${failures} asserzioni fallite.`); process.exit(1); }
