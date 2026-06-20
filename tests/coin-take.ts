// ============================================================
// tests/coin-take — il secondo Intent, con rifiuto dipendente dallo stato
// Verifica che coin.take funzioni e che il rifiuto "wallet vuoto" sia
// deciso guardando lo STATO, non solo la forma dell'intent.
// E ricontrolla che replay==stato regga con due intent.
// ============================================================
import { Session } from "../packages/session/session";
import { CoinSystem } from "../examples/coin-game/coin-system";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else { console.error(`  ✗ FALLITO: ${msg}`); failures++; }
}

console.log("TEST — coin.take (rifiuto dipendente dallo stato)\n");

const s = new Session({ systems: [CoinSystem], seed: 7 });

// dare due monete ad alice, poi toglierne una
s.submit({ type: "coin.give", agentId: "a", payload: { player: "alice" } });
s.submit({ type: "coin.give", agentId: "a", payload: { player: "alice" } });
const take1 = s.submit({ type: "coin.take", agentId: "a", payload: { player: "alice" } });

assert(take1.accepted === true, "togliere da un wallet con 2 monete è accettato");
assert((s.getState().entities["alice"] as { wallet: number }).wallet === 1, "alice resta con 1 moneta");

// toglierne ancora una: ora il wallet va a 0
const take2 = s.submit({ type: "coin.take", agentId: "a", payload: { player: "alice" } });
assert(take2.accepted === true, "seconda rimozione accettata (wallet era 1)");
assert((s.getState().entities["alice"] as { wallet: number }).wallet === 0, "alice ora ha 0 monete");

// IL CASO NUOVO: togliere da un wallet vuoto deve essere RIFIUTATO
const take3 = s.submit({ type: "coin.take", agentId: "a", payload: { player: "alice" } });
assert(take3.accepted === false, "togliere da un wallet vuoto è RIFIUTATO");
assert(
  (take3.reason ?? "").includes("empty"),
  "il motivo del rifiuto parla di wallet vuoto"
);
assert((s.getState().entities["alice"] as { wallet: number }).wallet === 0, "lo stato non cambia dopo un rifiuto");

// togliere da un giocatore mai visto: wallet implicito 0 → rifiutato
const take4 = s.submit({ type: "coin.take", agentId: "a", payload: { player: "carol" } });
assert(take4.accepted === false, "togliere da un giocatore inesistente è rifiutato");

// IL TEST FONDANTE, ancora: replay == stato con DUE tipi di intent nel log
const stateA = JSON.stringify(s.getState());
const stateB = JSON.stringify(Session.replay(s.getLog(), [CoinSystem], 7));
assert(stateA === stateB, "replay == stato regge con give E take nel log");

console.log("");
if (failures === 0) { console.log("VERDE. Il secondo Intent regge, senza toccare il Core."); process.exit(0); }
else { console.error(`ROSSO. ${failures} asserzioni fallite.`); process.exit(1); }
