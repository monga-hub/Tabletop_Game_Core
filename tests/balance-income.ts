// tests/balance-income — verbo "Rendite della Bilancia" (Fase 4). Legge
// __improvements__, valuta le condizioni delle carte ⚖, produce Ducati.
import { Session } from "../packages/session/session";
import { PescariaBalanceIncomeSystem, computeBalanceIncome } from "../examples/pescaria/balance-income-system";
import { Slots } from "../examples/pescaria/install-improvements-system";
import { realDeck, RealCard } from "../examples/pescaria/cards/real-deck";
import { System, GameState, Intent, EventDraft, GameEvent } from "../packages/core/types";

let f = 0; const ok = (c: boolean, m: string) => { if (c) console.log(`  ✓ ${m}`); else { console.error(`  ✗ ${m}`); f++; } };
console.log("TEST — Balance income (Rendite della Bilancia: legge __improvements__, produce Ducati)\n");

const deck = realDeck();
const card = (sid: number): RealCard => {
  const c = deck.find((x) => x.sourceId === sid);
  if (!c) throw new Error(`carta ${sid} assente`);
  return c;
};
// carte per improvement (prendo la prima con quel testo)
const byImprovement = (text: string): RealCard => {
  const c = deck.find((x) => x.improvement === text);
  if (!c) throw new Error(`nessuna carta con improvement "${text}"`);
  return c;
};

const empty = (): Slots => ({ approvvigionamento: [], esperienza: [], commercio: [], bilancia: [] });

// carte reali per categoria (per riempire gli slot)
const appro = deck.filter((c) => c.improvement.startsWith("⚓"));
const esper = deck.filter((c) => c.improvement.startsWith("🔨"));
const comm  = deck.filter((c) => c.improvement.startsWith("💰"));

const maestroEsperienza = byImprovement("⚖ Maestro Esperienza");
const bancoEquilibrato  = byImprovement("⚖ Banco Equilibrato");
const diversificazione  = byImprovement("⚖ Diversificazione");

// --- 1) Maestro: +2 se >=3 carte della categoria bersaglio ---
{
  const s = empty();
  s.bilancia = [maestroEsperienza];
  s.esperienza = [esper[0], esper[1]]; // solo 2 -> condizione NON soddisfatta
  ok(computeBalanceIncome(s) === 0, "Maestro Esperienza con 2 carte 🔨: condizione non soddisfatta, 0 Ducati");

  s.esperienza = [esper[0], esper[1], esper[2]]; // 3 -> soddisfatta
  ok(computeBalanceIncome(s) === 2, "Maestro Esperienza con 3 carte 🔨: +2 Ducati");
}

// --- 2) Maestro cumulabile "per copia" ---
{
  const s = empty();
  s.bilancia = [maestroEsperienza, maestroEsperienza]; // 2 copie
  s.esperienza = [esper[0], esper[1], esper[2]];        // condizione soddisfatta
  ok(computeBalanceIncome(s) === 4, "due copie di Maestro Esperienza, condizione soddisfatta: +2 per copia = +4");
}

// --- 3) Banco Equilibrato: +3 se >=2 in CIASCUNA delle altre tre categorie ---
{
  const s = empty();
  s.bilancia = [bancoEquilibrato];
  s.approvvigionamento = [appro[0], appro[1]]; // 2
  s.esperienza = [esper[0], esper[1]];          // 2
  s.commercio = [comm[0]];                       // solo 1 -> NON soddisfatta
  ok(computeBalanceIncome(s) === 0, "Banco Equilibrato con 2/2/1: una categoria sotto soglia, 0 Ducati");

  s.commercio = [comm[0], comm[1]];              // ora 2 -> soddisfatta
  ok(computeBalanceIncome(s) === 3, "Banco Equilibrato con 2/2/2 nelle altre tre categorie: +3 Ducati");
}

// --- 4) Diversificazione: +1 per ogni tipo distinto di miglioria ---
{
  const s = empty();
  s.bilancia = [diversificazione];
  // tipi distinti: diversificazione stessa + 2 tipi di ⚓ (se distinti) ecc.
  // costruisco con tipi noti distinti.
  const a1 = byImprovement("⚓ Banco Ampliato");
  const a2 = byImprovement("⚓ Fiuto per il Pescato");
  s.approvvigionamento = [a1, a1, a2]; // 2 tipi distinti (Banco Ampliato conta una volta)
  // tipi distinti totali: Diversificazione, Banco Ampliato, Fiuto = 3
  ok(computeBalanceIncome(s) === 3, "Diversificazione: +1 per tipo distinto (Diversificazione + Banco Ampliato + Fiuto = 3), copie multiple contano una volta");
}

// --- 5) nessuna carta Bilancia: 0 ---
{
  const s = empty();
  s.approvvigionamento = [appro[0], appro[1], appro[2]];
  ok(computeBalanceIncome(s) === 0, "nessuna carta ⚖ installata: 0 Ducati di rendita");
}

// --- 6) via System: i Ducati si sommano a __ducati__ esistenti ---
{
  const Seeder: System = {
    namespace: "seed",
    handles: (t) => t === "seed.state" || t === "seed.state.done",
    validate: () => null,
    reduce: (_s, i: Intent): EventDraft[] => [{ type: "seed.state.done", producer: "seed", payload: i.payload }],
    apply: (st: GameState, e: GameEvent): GameState => {
      if (e.type === "seed.state.done") {
        return { ...st, entities: { ...st.entities, __improvements__: e.payload.slots, __ducati__: e.payload.ducati } };
      }
      return st;
    },
  };
  const sys = [Seeder, PescariaBalanceIncomeSystem];
  const s = new Session({ systems: sys, seed: 1 });
  const slots = empty();
  slots.bilancia = [maestroEsperienza];
  slots.esperienza = [esper[0], esper[1], esper[2]];
  s.submit({ type: "seed.state", agentId: "h", payload: { slots, ducati: 10 } });
  s.submit({ type: "pescaria.balance.collect", agentId: "h", payload: {} });
  ok((s.getState().entities["__ducati__"] as number) === 12, "via System: 10 Ducati + 2 di rendita = 12 (le rendite si sommano)");

  const a = JSON.stringify(s.getState());
  const b = JSON.stringify(Session.replay(s.getLog(), sys, 1));
  ok(a === b, "replay == stato");
}

console.log("");
if (f === 0) { console.log("VERDE. Rendite della Bilancia: tre forme di condizione, cumulabili per copia, legge __improvements__."); process.exit(0); } else process.exit(1);
