// ============================================================
// examples/pescaria/balance-income-system.ts — Rendite della Bilancia (Fase 4)
//
// Verbo del regolamento: "chi possiede carte della categoria ⚖ Bilancia ne
// verifica le condizioni e incassa i Ducati corrispondenti."
//
// Primo verbo che LEGGE __improvements__ (gli slot costruiti dal 0042). La
// Bilancia "non modifica lo svolgimento delle fasi: legge la forma del motore
// costruito nelle altre tre categorie e premia in Ducati le configurazioni
// soddisfatte". Quindi: legge __improvements__ e __ducati__, produce Ducati.
// Nessun nuovo contenitore, nessuna nuova risorsa, nessuna fase modificata.
//
// Le cinque carte Bilancia (mazzo 2026) NON hanno la stessa forma di effetto.
// Tre tipi:
//  - Maestro dell'X (Approvvigionamento/Esperienza/Commercio): +2 se possiedi
//    >=3 carte della categoria X. STESSA funzione, cambia solo il parametro
//    categoria -> estratta in maestroBonus(). Non e' un "motore di regole":
//    e' un'espressione aritmetica identica tre volte, parametrica. (Le carte
//    NON portano la propria logica: dicono solo "sono Maestro Esperienza"; e'
//    il verbo a sapere cosa significa. Dato e trasformazione restano distinti.)
//  - Banco Equilibrato: +3 se >=2 carte in CIASCUNA delle altre tre categorie.
//  - Diversificazione: +1 per ogni TIPO distinto di miglioria posseduto.
// Banco Equilibrato e Diversificazione restano ESPLICITI: sono unici. Se un
// domani avranno una struttura comune, dovra' emergere dal codice, non essere
// imposta oggi.
//
// "Per copia posseduta" (regolamento): le carte Bilancia sono cumulabili. La
// condizione si valuta una volta; il premio si moltiplica per il numero di
// copie di quella carta possedute.
// ============================================================
import { System, GameState, GameEvent, Intent, EventDraft } from "../../packages/core/types";
import { RealCard } from "./cards/real-deck";
import { Slots, ImprovementCategory, CATEGORIES } from "./install-improvements-system";

const NS = "pescaria";

function improvements(state: GameState): Slots | null {
  return (state.entities["__improvements__"] as Slots | undefined) ?? null;
}
function ducati(state: GameState): number {
  return (state.entities["__ducati__"] as number | undefined) ?? 0;
}

// quante carte in una categoria (conta tutte le carte installate nello slot).
function countCategory(slots: Slots, cat: ImprovementCategory): number {
  return slots[cat].length;
}

// la categoria-bersaglio di un Maestro, dal nome della carta. I Maestri
// premiano il possesso di carte di un'ALTRA categoria (Approvvigionamento/
// Esperienza/Commercio), non della Bilancia stessa.
const MAESTRO_TARGET: Record<string, ImprovementCategory> = {
  "Maestro Approvvigionamento": "approvvigionamento",
  "Maestro Esperienza": "esperienza",
  "Maestro Commercio": "commercio",
};

// nome della carta Bilancia, senza l'icona iniziale.
function balanceName(card: RealCard): string {
  return card.improvement.replace(/^⚖\s*/, "").trim();
}

// calcolo comune dei tre Maestri: +2 se possiedi >=3 carte della categoria.
// Espressione identica osservata tre volte, parametrica sulla categoria.
function maestroBonus(slots: Slots, target: ImprovementCategory): number {
  return countCategory(slots, target) >= 3 ? 2 : 0;
}

export function computeBalanceIncome(slots: Slots): number {
  let total = 0;
  const bilancia = slots.bilancia;

  for (const card of bilancia) {
    const name = balanceName(card);

    if (name in MAESTRO_TARGET) {
      // Maestro: +2 se >=3 carte della categoria bersaglio. Per copia: ogni
      // istanza di questa carta nello slot somma il bonus (il loop le visita
      // tutte, quindi la moltiplicazione "per copia" e' implicita).
      total += maestroBonus(slots, MAESTRO_TARGET[name]);

    } else if (name === "Banco Equilibrato") {
      // +3 se >=2 carte in CIASCUNA delle altre tre categorie (non la Bilancia).
      const others: ImprovementCategory[] = ["approvvigionamento", "esperienza", "commercio"];
      const ok = others.every((c) => countCategory(slots, c) >= 2);
      total += ok ? 3 : 0;

    } else if (name === "Diversificazione") {
      // +1 per ogni TIPO distinto di miglioria posseduto. "Tipo" = nome di carta
      // distinto (copie multiple della stessa carta contano una volta), su tutte
      // le categorie.
      const distinctTypes = new Set<string>();
      for (const cat of CATEGORIES) {
        for (const c of slots[cat]) distinctTypes.add(c.improvement);
      }
      total += distinctTypes.size;
    }
    // altre carte ⚖ non previste: ignorate (validate le esclude).
  }
  return total;
}

export const PescariaBalanceIncomeSystem: System = {
  namespace: NS,

  handles(type: string): boolean {
    return type === "pescaria.balance.collect" || type === "pescaria.balance.collected";
  },

  validate(state: GameState, intent: Intent): string | null {
    if (intent.type !== "pescaria.balance.collect") return "handles only balance.collect";
    if (!improvements(state)) return "no improvements installed: install first";
    return null;
  },

  reduce(state: GameState, intent: Intent): EventDraft[] {
    const slots = improvements(state)!;
    const earned = computeBalanceIncome(slots);
    return [{ type: "pescaria.balance.collected", producer: NS, payload: { earned } }];
  },

  apply(state: GameState, event: GameEvent): GameState {
    if (event.type === "pescaria.balance.collected") {
      const earned = event.payload.earned as number;
      return {
        ...state,
        entities: {
          ...state.entities,
          __ducati__: ducati(state) + earned,  // le rendite si sommano ai Ducati
        },
      };
    }
    return state;
  },
  // Nessun legalIntents: la Bilancia non e' una scelta, e' una lettura che
  // produce Ducati a fine giornata.
};
