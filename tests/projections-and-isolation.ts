// ============================================================
// tests/projections-and-isolation
// Tre verifiche:
//  1. AuditProjection (framework) misura l'integrità del log
//  2. WalletProjection (dominio) ricostruisce lo stato dal SOLO log
//  3. Due Session sono indipendenti: nessuno stato globale nel framework
// ============================================================
import { Session } from "../packages/session/session";
import { AuditProjection } from "../packages/core/audit-projection";
import { WalletProjection } from "../examples/coin-game/wallet-projection";
import { CoinSystem } from "../examples/coin-game/coin-system";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else { console.error(`  ✗ FALLITO: ${msg}`); failures++; }
}

console.log("TEST — Projections e isolamento multi-sessione\n");

// ---------- 1 & 2: audit + wallet su una sessione ----------
const audit = new AuditProjection();
const wallet = new WalletProjection();
const s = new Session({ systems: [CoinSystem], projections: [audit, wallet], seed: 1 });

s.submit({ type: "coin.give", agentId: "x", payload: { player: "alice" } });
s.submit({ type: "coin.give", agentId: "x", payload: { player: "alice" } });
s.submit({ type: "coin.give", agentId: "x", payload: { player: "bob" } });
s.submit({ type: "coin.take", agentId: "x", payload: { player: "alice" } });
s.submit({ type: "coin.take", agentId: "x", payload: { player: "carol" } }); // rifiutato: wallet vuoto

const a = audit.view();
console.log("  AUDIT:", JSON.stringify(a.byType));
assert(a.intentsRejected === 1, "audit conta 1 intent rifiutato");
assert(a.danglingCausedBy === 0, "audit: nessun causedBy pendente");
assert(a.idMonotonicityBreaks === 0, "audit: id sempre crescenti");
assert(a.intentsAccepted === 4, "audit conta 4 intent accettati (3 give + 1 take)");

// la WalletProjection ha ricostruito lo stato osservando SOLO il log
const w = wallet.view();
assert(w["alice"] === 1, "wallet ricostruito: alice = 1 (2 give - 1 take)");
assert(w["bob"] === 1, "wallet ricostruito: bob = 1");
assert(w["carol"] === undefined, "wallet ricostruito: carol mai creata (take rifiutato)");

// la projection di dominio combacia con lo stato del motore, pur non avendolo
// mai guardato: ha visto solo gli eventi.
const engineAlice = (s.getState().entities["alice"] as { wallet: number }).wallet;
assert(w["alice"] === engineAlice, "wallet-da-log === wallet-da-stato (alice)");

// ---------- 3: due sessioni indipendenti ----------
const auditA = new AuditProjection();
const auditB = new AuditProjection();
const A = new Session({ systems: [CoinSystem], projections: [auditA], seed: 100 });
const B = new Session({ systems: [CoinSystem], projections: [auditB], seed: 200 });

// sequenze diverse nelle due sessioni
A.submit({ type: "coin.give", agentId: "a", payload: { player: "p" } });
A.submit({ type: "coin.take", agentId: "a", payload: { player: "p" } });
A.submit({ type: "coin.give", agentId: "a", payload: { player: "p" } });

B.submit({ type: "coin.take", agentId: "b", payload: { player: "p" } }); // rifiutato: vuoto
B.submit({ type: "coin.give", agentId: "b", payload: { player: "p" } });

assert((A.getState().entities["p"] as { wallet: number }).wallet === 1, "Session A: p = 1");
assert((B.getState().entities["p"] as { wallet: number }).wallet === 1, "Session B: p = 1");
assert(A.getLog().length !== B.getLog().length, "i due log hanno lunghezze diverse (indipendenti)");
assert(auditA.view().intentsRejected === 0, "audit A: 0 rifiuti");
assert(auditB.view().intentsRejected === 1, "audit B: 1 rifiuto (sequenza diversa)");
// la prova chiave: gli id ripartono da 1 in entrambe → nessun contatore globale
assert(A.getLog()[0].id === 1 && B.getLog()[0].id === 1, "ogni Session ha il proprio id-counter (nessuno stato globale)");

console.log("");
if (failures === 0) { console.log("VERDE. Projection indipendenti dal dominio, e framework realmente multi-sessione."); process.exit(0); }
else { console.error(`ROSSO. ${failures} asserzioni fallite.`); process.exit(1); }
