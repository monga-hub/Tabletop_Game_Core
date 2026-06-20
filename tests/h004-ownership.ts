// ============================================================
// tests/h004-ownership — H-004 messa alla prova
// Ipotesi: le zone (mano, draft, scarti) sono projection di un unico fatto,
// l'ownership. Rifacciamo un draft SOLO con trasferimenti di proprietà.
// Se le zone emergono da query (senza contenitori), l'ipotesi regge.
// ============================================================
import { Session } from "../packages/session/session";
import { OwnershipSystem, DRAFT_POOL, DISCARD } from "../examples/pescaria-ownership/ownership-system";
import { OwnershipProjection } from "../examples/pescaria-ownership/zone-projections";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else { console.error(`  ✗ FALLITO: ${msg}`); failures++; }
}

console.log("TEST — H-004: le zone sono projection dell'ownership\n");

const zones = new OwnershipProjection();
const s = new Session({ systems: [OwnershipSystem], projections: [zones], seed: 1 });

// le carte "nascono" nel draft pool (mint con owner iniziale = pool)
for (const c of ["A", "B", "C", "D"]) {
  s.submit({ type: "owner.mint", agentId: "setup", payload: { card: c, to: DRAFT_POOL } });
}
// LA ZONA "draft pool" È UNA QUERY, non una struttura
assert(zones.cardsOwnedBy(DRAFT_POOL).sort().join() === "A,B,C,D", "il draft pool è una query: contiene A,B,C,D");
assert(zones.cardsOwnedBy("alice").length === 0, "la mano di alice è vuota (query, non struttura)");

// "alice prende A" = A cambia owner da pool a alice. Nessuno spostamento.
assert(s.submit({ type: "owner.transfer", agentId: "u", payload: { card: "A", from: DRAFT_POOL, to: "alice" } }).accepted, "alice prende A (transfer di ownership)");
assert(zones.cardsOwnedBy("alice").join() === "A", "ora la mano di alice = [A] (query)");
assert(!zones.cardsOwnedBy(DRAFT_POOL).includes("A"), "A non è più nel draft pool (stessa carta, owner diverso)");

// bob prende C
s.submit({ type: "owner.transfer", agentId: "u", payload: { card: "C", from: DRAFT_POOL, to: "bob" } });
assert(zones.cardsOwnedBy("bob").join() === "C", "mano di bob = [C]");

// rifiuto: alice non può prendere C, non è del pool (è di bob)
const wrong = s.submit({ type: "owner.transfer", agentId: "u", payload: { card: "C", from: DRAFT_POOL, to: "alice" } });
assert(wrong.accepted === false, "rifiutato: C non è più nel pool (è di bob)");

// alice scarta A: A cambia owner a @discard. Lo scarto è un'altra query.
s.submit({ type: "owner.transfer", agentId: "u", payload: { card: "A", from: "alice", to: DISCARD } });
assert(zones.cardsOwnedBy("alice").length === 0, "dopo lo scarto, mano di alice vuota");
assert(zones.cardsOwnedBy(DISCARD).join() === "A", "lo scarto = [A] (terza zona, stessa query)");

// CONSERVAZIONE: ogni carta esiste esattamente una volta, ovunque sia l'owner
const all = zones.view();
assert(Object.keys(all).length === 4, "le 4 carte esistono sempre tutte (mai distrutte, solo ri-possedute)");

// replay == stato: il modello a ownership è event-sourced come il resto
const a = JSON.stringify(s.getState());
const b = JSON.stringify(Session.replay(s.getLog(), [OwnershipSystem], 1));
assert(a === b, "replay == stato (modello a ownership)");

console.log("");
if (failures === 0) {
  console.log("VERDE. H-004 REGGE (su draft+scarti): zone = query sull'ownership, zero contenitori.");
  process.exit(0);
} else { console.error(`ROSSO. ${failures} asserzioni fallite. H-004 ha un controesempio.`); process.exit(1); }
