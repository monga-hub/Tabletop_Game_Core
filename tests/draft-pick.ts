// ============================================================
// tests/draft-pick — il TEMPO: una sequenza ordinata di scelte
// Il draft nasce da draft.start (un EVENTO), non da stato iniettato.
// Così tutto vive nel log e il replay ricostruisce la partita intera.
// (Questo è ciò che ha corretto il primo bug serio.)
// ============================================================
import { Session } from "../packages/session/session";
import { PescariaDraftSystem } from "../examples/pescaria/draft-system";
import { PescariaDraftPickSystem } from "../examples/pescaria/draft-pick-system";
import { CurrentTurnProjection } from "../examples/pescaria/current-turn-projection";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else { console.error(`  ✗ FALLITO: ${msg}`); failures++; }
}

console.log("TEST — draft.pick (turno del draft; il draft nasce dal log)\n");

const turn = new CurrentTurnProjection();
// due System collaborano: uno crea il draft (start), l'altro lo fa avanzare (pick)
const systems = [PescariaDraftSystem, PescariaDraftPickSystem];
const s = new Session({ systems, projections: [turn], seed: 5 });

// il draft nasce da un evento, con carte anonime nel payload
const start = s.submit({ type: "pescaria.draft.start", agentId: "host",
  payload: { players: ["alice", "bob", "carla"], cards: ["A", "B", "C", "D"], cardsPerPlayer: 1 } });
assert(start.accepted, "draft.start crea il draft (ordine + carte) via evento");

const d0 = s.getState().entities["__draft__"] as { order: string[] };
const first = d0.order[0]; // chi è primo dipende dallo shuffle deterministico col seed
console.log(`  (ordine deciso: ${d0.order.join(" → ")})`);

// il primo dell'ordine prende A
assert(s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: first, cardId: "A" } }).accepted, `${first} (primo) prende A`);
assert(turn.view() === d0.order[1], `ora tocca a ${d0.order[1]}`);

// rifiuto: non è il turno del terzo giocatore
const wrong = s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: d0.order[2], cardId: "B" } });
assert(wrong.accepted === false, "rifiutato: turno sbagliato");

// completiamo il giro
assert(s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: d0.order[1], cardId: "C" } }).accepted, "secondo prende C");
assert(s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: d0.order[2], cardId: "D" } }).accepted, "terzo prende D");
assert(turn.view() === d0.order[0], "il turno torna al primo (giro completo)");

// IL TEST CHE PRIMA FALLIVA: replay == stato, ora che tutto nasce dal log
const a = JSON.stringify(s.getState());
const b = JSON.stringify(Session.replay(s.getLog(), systems, 5));
assert(a === b, "replay == stato: la partita si ricostruisce INTERA dal log");

console.log("");
if (failures === 0) { console.log("VERDE. Il draft nasce dal log; il replay ricostruisce tutto. Bug risolto nel dominio."); process.exit(0); }
else { console.error(`ROSSO. ${failures} asserzioni fallite.`); process.exit(1); }
