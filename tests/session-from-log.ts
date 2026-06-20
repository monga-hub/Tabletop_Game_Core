// ============================================================
// tests/session-from-log — l'INVARIANTE resa eseguibile
// "Una Session deve poter essere ricostruita esclusivamente dal suo log."
// Verifica che Session.fromLog() produca una Session indistinguibile
// dall'originale, e che initialState non esista più (stato non iniettabile).
// ============================================================
import { Session } from "../packages/session/session";
import { PescariaDraftSystem } from "../examples/pescaria/draft-system";
import { PescariaDraftPickSystem } from "../examples/pescaria/draft-pick-system";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else { console.error(`  ✗ FALLITO: ${msg}`); failures++; }
}

console.log("TEST — Session ricostruibile SOLO dal log\n");

const systems = [PescariaDraftSystem, PescariaDraftPickSystem];
const orig = new Session({ systems, seed: 9 });
orig.submit({ type: "pescaria.draft.start", agentId: "h", payload: { players: ["a", "b"], cards: ["A", "B", "C"] } });
const d = orig.getState().entities["__draft__"] as { order: string[] };
orig.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: d.order[0], cardId: "A" } });
orig.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: d.order[1], cardId: "B" } });

// ricostruisco una NUOVA Session solo dal log dell'originale
const rebuilt = Session.fromLog(orig.getLog(), systems, 9);

assert(
  JSON.stringify(orig.getState()) === JSON.stringify(rebuilt.getState()),
  "fromLog ricostruisce uno stato identico all'originale"
);
assert(
  orig.getLog().length === rebuilt.getLog().length,
  "il log ricostruito ha la stessa lunghezza"
);

// la Session ricostruita può CONTINUARE a giocare correttamente
const next = rebuilt.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: d.order[0], cardId: "C" } });
assert(next.accepted, "la Session ricostruita può continuare la partita");

// prova che non si può più iniettare stato: il costruttore non accetta initialState.
// (verifica a compile-time via TS; qui controlliamo che una Session nuova sia vuota)
const empty = new Session({ systems, seed: 0 });
assert(
  Object.keys(empty.getState().entities).length === 0,
  "una Session nuova nasce vuota (nessuno stato iniettabile)"
);

console.log("");
if (failures === 0) { console.log("VERDE. La Session è definita dal suo log. Nessuno stato iniettabile."); process.exit(0); }
else { console.error(`ROSSO. ${failures} asserzioni fallite.`); process.exit(1); }
