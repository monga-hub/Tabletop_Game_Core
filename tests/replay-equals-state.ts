// ============================================================
// tests/replay-equals-state — IL TEST FONDANTE
// Deve essere verde ogni giorno del progetto. Se un giorno fallisce,
// uno dei due principi fondanti è stato violato senza accorgersene:
//   - il log è la verità
//   - apply è puramente deterministico
//
// Cosa fa:
//   1. crea una Session, sottomette degli Intent
//   2. serializza lo stato risultante (StateA)
//   3. ricostruisce lo stato da zero rigiocando il log (StateB)
//   4. asserisce StateA == StateB, byte per byte
// ============================================================
import { Session } from "../packages/session/session";
import { CounterProjection } from "../packages/core/counter-projection";
import { CoinSystem } from "../examples/coin-game/coin-system";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) {
    console.log(`  ✓ ${msg}`);
  } else {
    console.error(`  ✗ FALLITO: ${msg}`);
    failures++;
  }
}

console.log("TEST FONDANTE — Replay == Stato\n");

// --- 1. costruisci una partita ---
const counter = new CounterProjection();
const session = new Session({
  systems: [CoinSystem],
  projections: [counter],
  seed: 12345,
});

session.submit({ type: "coin.give", agentId: "agentA", payload: { player: "alice" } });
session.submit({ type: "coin.give", agentId: "agentA", payload: { player: "bob" } });
session.submit({ type: "coin.give", agentId: "agentB", payload: { player: "alice" } });
// un intent non valido: deve essere rifiutato e finire nel log come rejected
const bad = session.submit({ type: "coin.give", agentId: "agentB", payload: { player: "" } });

// --- 2. verifiche di base sul comportamento ---
assert(bad.accepted === false, "un intent non valido viene rifiutato");
assert(
  (session.getState().entities["alice"] as { wallet: number }).wallet === 2,
  "alice ha 2 monete (due give valide)"
);
assert(
  (session.getState().entities["bob"] as { wallet: number }).wallet === 1,
  "bob ha 1 moneta"
);
assert(counter.view() > 0, "la projection ha osservato eventi");

// il log contiene anche il rifiuto: ogni fatto è storia
const rejected = session.getLog().filter((e) => e.type === "core.intent.rejected");
assert(rejected.length === 1, "il rifiuto è registrato nel log");

// ogni evento ha id strettamente crescente (invariante di monotonìa)
const ids = session.getLog().map((e) => e.id);
const monotone = ids.every((id, i) => i === 0 || id > ids[i - 1]);
assert(monotone, "gli id degli eventi sono strettamente crescenti");

// ogni causedBy punta a un evento esistente (integrità causale)
const idSet = new Set(ids);
const causalOk = session.getLog().every(
  (e) => e.causedBy === null || idSet.has(e.causedBy)
);
assert(causalOk, "ogni causedBy punta a un evento esistente");

// --- 3. IL CUORE: serializza, ricostruisci dal log, confronta ---
const stateA = session.getState();
const serializedA = JSON.stringify(stateA);

const stateB = Session.replay(session.getLog(), [CoinSystem], 12345);
const serializedB = JSON.stringify(stateB);

assert(
  serializedA === serializedB,
  "lo stato ricostruito dal log è IDENTICO allo stato corrente (byte per byte)"
);

// --- 4. doppio replay: ricostruire due volte dà lo stesso risultato (determinismo) ---
const stateC = Session.replay(session.getLog(), [CoinSystem], 12345);
assert(
  JSON.stringify(stateC) === serializedB,
  "rigiocare il log due volte produce stati identici (determinismo)"
);

console.log("");
if (failures === 0) {
  console.log("VERDE. Il cuore del framework regge: log = verità, apply deterministico.");
  process.exit(0);
} else {
  console.error(`ROSSO. ${failures} asserzioni fallite. Un principio fondante è violato.`);
  process.exit(1);
}
