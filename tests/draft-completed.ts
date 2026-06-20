// ============================================================
// tests/draft-completed — il primo FATTO DERIVATO
// draft.completed NON è un Intent. Nessun agente lo decide. Emerge quando
// l'ultimo pick rende vera la condizione "ogni giocatore ha N carte".
// È il primo evento che nasce dall'evoluzione dello stato, non da una volontà.
// Mette pressione a H-001 (decision context) e conferma H-002 (eventi = fatti).
// ============================================================
import { Session } from "../packages/session/session";
import { PescariaDraftSystem } from "../examples/pescaria/draft-system";
import { PescariaDraftPickSystem } from "../examples/pescaria/draft-pick-system";
import { asCards } from "../examples/pescaria/model/test-cards";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else { console.error(`  ✗ FALLITO: ${msg}`); failures++; }
}

console.log("TEST — draft.completed (fatto derivato, non intent)\n");

const systems = [PescariaDraftSystem, PescariaDraftPickSystem];
const s = new Session({ systems, seed: 3 });

// 2 giocatori, N=2 carte a testa, pool di 4 carte → il draft finisce dopo 4 pick
s.submit({ type: "pescaria.draft.start", agentId: "h",
  payload: { players: ["alice", "bob"], cards: asCards(["A", "B", "C", "D"]), cardsPerPlayer: 2 } });
const d = s.getState().entities["__draft__"] as { order: string[] };
const [p0, p1] = d.order;

// primo giro: p0 prende A, p1 prende B — nessuno ha ancora 2 carte
let r = s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p0, cardId: "A" } });
assert(!r.emitted.some((e) => e.type === "pescaria.draft.completed"), "dopo 1 pick: draft NON completo");
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p1, cardId: "B" } });

// secondo giro: p0 prende C (ha 2). p1 prende D → ORA tutti hanno 2 → draft.completed emerge
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p0, cardId: "C" } });
const last = s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p1, cardId: "D" } });

// IL FATTO DERIVATO: l'ultimo pick ha prodotto draft.completed da sé
assert(last.emitted.some((e) => e.type === "pescaria.draft.completed"), "l'ultimo pick EMETTE draft.completed (fatto derivato)");
assert(last.emitted.some((e) => e.type === "pescaria.phase.changed"), "...e fa transitare la fase (phase.changed)");

// draft.completed è causato dal pick, non da un intent separato
const completed = last.emitted.find((e) => e.type === "pescaria.draft.completed")!;
const pickEvent = last.emitted.find((e) => e.type === "pescaria.draft.pick")!;
assert(completed.causedBy === pickEvent.id, "draft.completed è causato dal pick (catena), non da un agente");

// nessuno ha mai inviato un intent "draft.end": non esiste
const hasEndIntent = s.getLog().some((e) => e.type === "pescaria.draft.end");
assert(!hasEndIntent, "non esiste alcun intent draft.end: la fine EMERGE, non si comanda");

// lo stato riflette il completamento
const df = s.getState().entities["__draft__"] as { completed?: boolean };
assert(df.completed === true, "lo stato del draft è marcato completo");
const game = s.getState().entities["__game__"] as { phase: string };
assert(game.phase === "post-draft", "la fase è transitata a post-draft");

// replay == stato, con un fatto derivato e due system che gestiscono phase.changed
const a = JSON.stringify(s.getState());
const b = JSON.stringify(Session.replay(s.getLog(), systems, 3));
assert(a === b, "replay == stato (con fatto derivato + phase emessa da un system, applicata da un altro)");

console.log("");
if (failures === 0) { console.log("VERDE. Primo fatto derivato: la fine del draft EMERGE dallo stato."); process.exit(0); }
else { console.error(`ROSSO. ${failures} asserzioni fallite.`); process.exit(1); }
