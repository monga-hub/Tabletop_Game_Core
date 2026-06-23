// tests/contracts-completed — Commit B: integrazione ARCHITETTURALE del verbo
// "completare i contratti" nell'event sourcing. Mani reali costruite
// direttamente (nessun draft, nessun agente): si verifica che il verbo viva
// negli eventi/stato/replay, non l'integrazione causale con l'inizio partita.
import { Session } from "../packages/session/session";
import { PescariaContractsCompletedSystem } from "../examples/pescaria/contracts-completed-system";
import { realDeck, RealCard } from "../examples/pescaria/cards/real-deck";
import { Bank } from "../examples/pescaria/resolve-contracts";

let f = 0; const ok = (c: boolean, m: string) => { if (c) console.log(`  ✓ ${m}`); else { console.error(`  ✗ ${m}`); f++; } };
console.log("TEST — ContractsCompletedSystem (Commit B: verbo nell'event sourcing)\n");

const systems = [PescariaContractsCompletedSystem];
const deck = realDeck();
const card = (sid: number): RealCard => {
  const c = deck.find((x) => x.sourceId === sid);
  if (!c) throw new Error(`carta ${sid} assente`);
  return c;
};

// r18 = 1 sardina, r74 = 2 polpi, r9 = 3 sardine
const hand = [card(18), card(74), card(9)];
const bank: Bank = { sardina: 1, polpo: 2 }; // completa r18 e r74, non r9

const s = new Session({ systems, seed: 1 });

// 1) la mano reale entra nello stato
s.submit({ type: "pescaria.realhand.created", agentId: "h", payload: { hand, bank } });
const rh = s.getState().entities["__realHand__"] as { hand: RealCard[]; bank: Bank };
ok(rh.hand.length === 3, "realhand.created: la mano reale (3 carte) entra nello stato");
ok((rh.bank.sardina ?? 0) === 1 && (rh.bank.polpo ?? 0) === 2, "il banco entra nello stato");

// 2) il verbo si esegue come trasformazione di stato via evento
s.submit({ type: "pescaria.contracts.resolve", agentId: "h", payload: {} });
const completed = s.getState().entities["__completedContracts__"] as RealCard[];
const rhAfter = s.getState().entities["__realHand__"] as { hand: RealCard[]; bank: Bank };

ok(completed.length === 2, "due contratti completati (r18, r74)");
ok(completed.some((c) => c.sourceId === 18) && completed.some((c) => c.sourceId === 74), "completati esattamente r18 e r74");
ok(rhAfter.hand.length === 1 && rhAfter.hand[0].sourceId === 9, "r9 (3 sardine, non completabile) resta nella mano reale");
ok((rhAfter.bank.sardina ?? 0) === 0 && (rhAfter.bank.polpo ?? 0) === 0, "il banco e' stato consumato dai contratti completati");

// 3) integrazione architetturale: replay == stato
const a = JSON.stringify(s.getState());
const b = JSON.stringify(Session.replay(s.getLog(), systems, 1));
ok(a === b, "replay == stato: il verbo e' un cittadino di prima classe dell'event sourcing");

// 4) il log contiene gli eventi del dominio reale, non altro
const types = s.getLog().map((e) => e.type);
ok(types.includes("pescaria.realhand.created") && types.includes("pescaria.contracts.completed"),
   "il log contiene realhand.created e contracts.completed");

// 5) resolve senza una mano reale viene rifiutato
const s2 = new Session({ systems, seed: 2 });
const r = s2.submit({ type: "pescaria.contracts.resolve", agentId: "h", payload: {} });
ok(!r.accepted, "contracts.resolve senza realhand.created e' rifiutato");

// 6) la Cesta INTEGRA nella pipeline: Banco non basta, Cesta completa il mancante.
// Serve iniettare __cesta__ nello stato: uso un seeder minimale insieme ai systems.
import { System as Sys, GameState as GS, Intent as Int, EventDraft as ED, GameEvent as GE } from "../packages/core/types";
const CestaSeeder: Sys = {
  namespace: "seedc",
  handles: (t) => t === "seedc.set" || t === "seedc.set.done",
  validate: () => null,
  reduce: (_s, i: Int): ED[] => [{ type: "seedc.set.done", producer: "seedc", payload: i.payload }],
  apply: (st: GS, e: GE): GS => e.type === "seedc.set.done" ? { ...st, entities: { ...st.entities, __cesta__: e.payload.cesta } } : st,
};
{
  const sysC = [CestaSeeder, ...systems];
  const sc = new Session({ systems: sysC, seed: 7 });
  // r9 = 3 sardine. Banco 2 sardine, Cesta 2 sardine -> Banco non basta, Banco+Cesta sì.
  sc.submit({ type: "seedc.set", agentId: "h", payload: { cesta: { sardina: 2 } } });
  sc.submit({ type: "pescaria.realhand.created", agentId: "h", payload: { hand: [card(9)], bank: { sardina: 2 } } });
  sc.submit({ type: "pescaria.contracts.resolve", agentId: "h", payload: {} });

  const completedC = sc.getState().entities["__completedContracts__"] as RealCard[];
  const cestaC = sc.getState().entities["__cesta__"] as Record<string, number>;
  ok(completedC.length === 1, "nella pipeline: il contratto si completa attingendo alla Cesta (Banco non bastava)");
  ok((cestaC.sardina ?? 0) === 1, "la Cesta ha integrato solo il mancante: 2 - 1 = 1 sardina resta");
}

console.log("");
if (f === 0) { console.log("VERDE. Verbo integrato nell'event sourcing; pipeline del dominio reale (corta), agenti intatti."); process.exit(0); } else process.exit(1);
