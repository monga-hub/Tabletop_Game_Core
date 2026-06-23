// tests/install-improvements — verbo "Installare" (Fase 4). Le carte contratto
// completate vanno negli slot della plancia, per categoria. Cumulabili (più
// carte per slot). Nessun effetto applicato.
import { Session } from "../packages/session/session";
import { PescariaInstallImprovementsSystem, categoryOf, Slots } from "../examples/pescaria/install-improvements-system";
import { realDeck, RealCard } from "../examples/pescaria/cards/real-deck";

let f = 0; const ok = (c: boolean, m: string) => { if (c) console.log(`  ✓ ${m}`); else { console.error(`  ✗ ${m}`); f++; } };
console.log("TEST — Install improvements (verbo Installare: carte negli slot per categoria)\n");

const systems = [PescariaInstallImprovementsSystem];
const deck = realDeck();
const card = (sid: number): RealCard => {
  const c = deck.find((x) => x.sourceId === sid);
  if (!c) throw new Error(`carta ${sid} assente`);
  return c;
};

// categorie note (mazzo 2026):
//  r1 = ⚓ Approvvigionamento (Banco Ampliato)
//  r5 = ⚓ Approvvigionamento (Banco Ampliato)   <- stessa categoria di r1
//  r2 = 🔨 Esperienza (Nuovi Clienti)
//  r4 = 💰 Commercio (Contrattazione Sottobanco)
//  r3 = ⚖ Bilancia (Banco Equilibrato)

// sanity sulla derivazione della categoria dall'icona
ok(categoryOf(card(1)) === "approvvigionamento", "r1 -> approvvigionamento (⚓)");
ok(categoryOf(card(2)) === "esperienza", "r2 -> esperienza (🔨)");
ok(categoryOf(card(4)) === "commercio", "r4 -> commercio (💰)");
ok(categoryOf(card(3)) === "bilancia", "r3 -> bilancia (⚖)");

// helper sotto: inietto __completedContracts__ via un System seeder minimale,
// perche' questo System non lo produce (lo produce contracts-completed-system).

import { System, GameState, Intent, EventDraft, GameEvent } from "../packages/core/types";
const Seeder: System = {
  namespace: "seed",
  handles: (t) => t === "seed.completed" || t === "seed.completed.done",
  validate: () => null,
  reduce: (_s: GameState, i: Intent): EventDraft[] => [{ type: "seed.completed.done", producer: "seed", payload: { cards: i.payload.cards } }],
  apply: (s: GameState, e: GameEvent): GameState => {
    if (e.type === "seed.completed.done") {
      return { ...s, entities: { ...s.entities, __completedContracts__: e.payload.cards as Record<string, unknown> } };
    }
    return s;
  },
};

const sys = [Seeder, PescariaInstallImprovementsSystem];

// --- 1) collocazione per categoria + cumulabilità ---
{
  const s = new Session({ systems: sys, seed: 1 });
  // due ⚓ (r1, r5), una 🔨 (r2), una 💰 (r4)
  s.submit({ type: "seed.completed", agentId: "h", payload: { cards: [card(1), card(5), card(2), card(4)] } });
  s.submit({ type: "pescaria.improvements.install", agentId: "h", payload: {} });

  const slots = s.getState().entities["__improvements__"] as Slots;
  ok(slots.approvvigionamento.length === 2, "slot Approvvigionamento: 2 carte (r1, r5) — cumulabili nello stesso slot");
  ok(slots.esperienza.length === 1, "slot Esperienza: 1 carta (r2)");
  ok(slots.commercio.length === 1, "slot Commercio: 1 carta (r4)");
  ok(slots.bilancia.length === 0, "slot Bilancia: vuoto (nessuna carta ⚖)");

  // completedContracts consumato (ultimo verbo che lo legge)
  const completed = s.getState().entities["__completedContracts__"] as RealCard[];
  ok(completed.length === 0, "completedContracts consumato dopo l'installazione (ciclo chiuso)");

  // nessun effetto applicato: nessuno stato di Banco/asta toccato
  ok(s.getState().entities["__bankCapacity__"] === undefined, "nessun effetto applicato: la capacità del Banco non è toccata (installare != attivare)");
}

// --- 2) installazioni successive accumulano negli stessi slot ---
{
  const s = new Session({ systems: sys, seed: 2 });
  s.submit({ type: "seed.completed", agentId: "h", payload: { cards: [card(1)] } });          // ⚓
  s.submit({ type: "pescaria.improvements.install", agentId: "h", payload: {} });
  s.submit({ type: "seed.completed", agentId: "h", payload: { cards: [card(5)] } });          // ⚓ di nuovo
  s.submit({ type: "pescaria.improvements.install", agentId: "h", payload: {} });
  const slots = s.getState().entities["__improvements__"] as Slots;
  ok(slots.approvvigionamento.length === 2, "due installazioni successive accumulano nello stesso slot (2 carte ⚓)");
}

// --- 3) replay == stato ---
{
  const s = new Session({ systems: sys, seed: 3 });
  s.submit({ type: "seed.completed", agentId: "h", payload: { cards: [card(1), card(2), card(3)] } });
  s.submit({ type: "pescaria.improvements.install", agentId: "h", payload: {} });
  const a = JSON.stringify(s.getState());
  const b = JSON.stringify(Session.replay(s.getLog(), sys, 3));
  ok(a === b, "replay == stato (installazione ricostruibile dal log)");
}

// --- 4) install senza contratti completati: rifiutato ---
{
  const s = new Session({ systems: sys, seed: 4 });
  const r = s.submit({ type: "pescaria.improvements.install", agentId: "h", payload: {} });
  ok(!r.accepted, "install senza completedContracts e' rifiutato");
}

console.log("");
if (f === 0) { console.log("VERDE. Installare: carte negli slot per categoria, cumulabili, nessun effetto applicato."); process.exit(0); } else process.exit(1);
