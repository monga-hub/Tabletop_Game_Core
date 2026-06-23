// ============================================================
// examples/pescaria/install-improvements-system.ts — Installare (Fase 4)
//
// Verbo del regolamento (Fase 4): "ogni carta contratto completata viene
// installata, in base alla propria icona, nello slot Miglioria corrispondente
// sulla Plancia Giocatore. Il bonus conferito è attivo dalla Giornata
// successiva."
//
// Il verbo è INSTALLARE, non ATTIVARE. Il regolamento separa i due atti NEL
// TEMPO DI GIOCO: la carta si installa oggi, il bonus vale "dalla giornata
// successiva". L'installazione produce uno STATO PERSISTENTE (la carta è nello
// slot), non un effetto immediato. Rende vera solo la frase "questa carta è
// installata nello slot Esperienza" — NON "questa carta aumenta il valore
// d'asta". Gli effetti (leggere gli slot e cambiare il comportamento delle
// fasi) sono trasformazioni successive e distinte, una per effetto, su fasi
// diverse. Confonderle sarebbe come confondere "muovere il pesce" con "pagare"
// nell'acquisto.
//
// STRUTTURA degli slot (vincolo di dominio dal regolamento, NON una scelta
// implementativa libera): la plancia ha QUATTRO slot, uno per categoria. Ma il
// regolamento (cap. 4 e 8) dice esplicitamente che "è possibile installare PIÙ
// carte nello stesso slot" e gli effetti si sommano per copia. Quindi ogni slot
// è una LISTA di carte, non una singola carta:
//   __improvements__ = { approvvigionamento: [...], esperienza: [...],
//                        commercio: [...], bilancia: [...] }
// Questa forma incorpora due vincoli del regolamento — "quattro categorie" e
// "più carte per categoria" — senza incorporare alcun effetto. Rende anche
// possibile il conteggio per il tie-break di fine partita ("più carte Miglioria
// installate complessivamente", cap. 9) sommando le lunghezze.
//
// Consuma __completedContracts__: è l'ULTIMO verbo che lo legge (l'incasso lo
// aveva solo letto e lasciato). Dopo l'installazione, il ciclo di
// __completedContracts__ è chiuso.
// ============================================================
import { System, GameState, GameEvent, Intent, EventDraft } from "../../packages/core/types";
import { RealCard } from "./cards/real-deck";

const NS = "pescaria";

export type ImprovementCategory = "approvvigionamento" | "esperienza" | "commercio" | "bilancia";
export const CATEGORIES: readonly ImprovementCategory[] = ["approvvigionamento", "esperienza", "commercio", "bilancia"];

// mappatura icona -> categoria, confermata dal regolamento (cap. 8).
const ICON_TO_CATEGORY: Record<string, ImprovementCategory> = {
  "⚓": "approvvigionamento",
  "🔨": "esperienza",
  "💰": "commercio",
  "⚖": "bilancia",
};

export type Slots = Record<ImprovementCategory, RealCard[]>;

function emptySlots(): Slots {
  return { approvvigionamento: [], esperienza: [], commercio: [], bilancia: [] };
}

/** La categoria di una carta, derivata dall'icona del campo improvement. */
export function categoryOf(card: RealCard): ImprovementCategory | null {
  const icon = card.improvement?.trim().split(/\s+/)[0] ?? "";
  return ICON_TO_CATEGORY[icon] ?? null;
}

function completedContracts(state: GameState): RealCard[] | null {
  return (state.entities["__completedContracts__"] as RealCard[] | undefined) ?? null;
}
function improvements(state: GameState): Slots {
  return (state.entities["__improvements__"] as Slots | undefined) ?? emptySlots();
}

export const PescariaInstallImprovementsSystem: System = {
  namespace: NS,

  handles(type: string): boolean {
    return type === "pescaria.improvements.install" || type === "pescaria.improvements.installed";
  },

  validate(state: GameState, intent: Intent): string | null {
    if (intent.type !== "pescaria.improvements.install") return "handles only improvements.install";
    const c = completedContracts(state);
    if (!c) return "no completed contracts: resolve contracts first";
    if (c.length === 0) return "no completed contracts to install";
    // ogni carta deve avere una categoria riconoscibile dall'icona.
    for (const card of c) {
      if (categoryOf(card) === null) return `card ${card.id} has no recognizable improvement category: "${card.improvement}"`;
    }
    return null;
  },

  reduce(state: GameState, intent: Intent): EventDraft[] {
    const completed = completedContracts(state)!;
    // raggruppa per categoria (ogni slot e' una lista: piu' carte per categoria)
    const byCategory: Record<ImprovementCategory, RealCard[]> = emptySlots();
    for (const card of completed) {
      const cat = categoryOf(card)!;
      byCategory[cat].push(card);
    }
    return [{ type: "pescaria.improvements.installed", producer: NS, payload: { byCategory } }];
  },

  apply(state: GameState, event: GameEvent): GameState {
    if (event.type === "pescaria.improvements.installed") {
      const byCategory = event.payload.byCategory as Record<ImprovementCategory, RealCard[]>;
      const current = improvements(state);
      const next: Slots = emptySlots();
      for (const cat of CATEGORIES) {
        next[cat] = [...current[cat], ...byCategory[cat]]; // accumula: cumulabili
      }
      return {
        ...state,
        entities: {
          ...state.entities,
          __improvements__: next as unknown as Record<string, unknown>,
          // __completedContracts__ consumato: l'installazione e' l'ultimo verbo
          // che lo legge. Ciclo chiuso.
          __completedContracts__: [] as unknown as Record<string, unknown>,
        },
      };
    }
    return state;
  },
  // Nessun legalIntents: installare non e' una scelta (il regolamento installa
  // OGNI carta completata, automaticamente). Nessun effetto applicato qui.
};
