// ============================================================
// tests/tictactoe — il principio #7 messo alla prova
// Un gioco totalmente diverso usa lo STESSO framework, ZERO modifiche.
// Riusa anche AuditProjection (framework) senza che essa sappia nulla di TTT.
// ============================================================
import { Session } from "../packages/session/session";
import { TicTacToeSystem } from "../examples/tictactoe/tictactoe-system";
import { AuditProjection } from "../packages/core/audit-projection";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else { console.error(`  ✗ FALLITO: ${msg}`); failures++; }
}

console.log("TEST — Tic Tac Toe (test definitivo del principio #7)\n");

const audit = new AuditProjection(); // projection del FRAMEWORK, riusata tale quale
const s = new Session({ systems: [TicTacToeSystem], projections: [audit] });

// X vince sulla prima riga: X(0) O(3) X(1) O(4) X(2)
assert(s.submit({ type: "ttt.mark", agentId: "p", payload: { player: "X", cell: 0 } }).accepted, "X gioca 0");
assert(s.submit({ type: "ttt.mark", agentId: "p", payload: { player: "O", cell: 3 } }).accepted, "O gioca 3");
assert(s.submit({ type: "ttt.mark", agentId: "p", payload: { player: "X", cell: 1 } }).accepted, "X gioca 1");
assert(s.submit({ type: "ttt.mark", agentId: "p", payload: { player: "O", cell: 4 } }).accepted, "O gioca 4");

// rifiuto: non è il turno di O dopo che tocca a X — proviamo a far giocare O
const wrongTurn = s.submit({ type: "ttt.mark", agentId: "p", payload: { player: "O", cell: 5 } });
assert(wrongTurn.accepted === false, "rifiutato: non è il turno di O");

// rifiuto: cella occupata
const taken = s.submit({ type: "ttt.mark", agentId: "p", payload: { player: "X", cell: 0 } });
assert(taken.accepted === false, "rifiutato: cella 0 occupata");

// X vince: mossa 2 completa la riga 0-1-2 → produce ttt.marked + ttt.won
const winning = s.submit({ type: "ttt.mark", agentId: "p", payload: { player: "X", cell: 2 } });
assert(winning.accepted, "X gioca 2 (vincente)");
assert(winning.emitted.some((e) => e.type === "ttt.won"), "la mossa vincente emette ttt.won (catena di eventi)");

// stato terminale: dopo la vittoria, nessuna mossa è accettata
const afterWin = s.submit({ type: "ttt.mark", agentId: "p", payload: { player: "O", cell: 5 } });
assert(afterWin.accepted === false, "stato terminale: nessuna mossa dopo la vittoria");

// replay == stato, su un gioco senza casualità e con stato terminale
const a = JSON.stringify(s.getState());
const b = JSON.stringify(Session.replay(s.getLog(), [TicTacToeSystem]));
assert(a === b, "replay == stato (gioco diverso, stesso framework)");

// l'AuditProjection del framework ha funzionato senza sapere cos'è il TTT
assert(audit.view().danglingCausedBy === 0, "audit (framework) integro su un gioco mai visto");

console.log("");
if (failures === 0) {
  console.log("VERDE. Un gioco completamente diverso entra con ZERO modifiche al framework.");
  console.log("Il principio #7 regge: il framework non è segretamente 'di Pescaria'.");
  process.exit(0);
} else { console.error(`ROSSO. ${failures} asserzioni fallite.`); process.exit(1); }
