// ============================================================
// examples/pescaria/move-to-basket-system.ts — Spostamento Scarti (Fase 3)
//
// Verbo del regolamento: "il pesce rimasto invenduto sul Banco, una volta
// soddisfatti i contratti, PUÒ essere spostato nella Cesta, fino alla sua
// capienza massima."
//
// PRIMO verbo che contiene una DECISIONE DEL GIOCATORE. Tutti i verbi
// precedenti erano automatici (il regolamento non lasciava scelta). Qui il
// regolamento dice "può" e, dato che il pesce invenduto può eccedere la
// capienza della Cesta, il giocatore SCEGLIE cosa conservare. La scelta non e'
// rimovibile come nell'acquisto ("prende tutto"): determina cosa SOPRAVVIVE
// alla giornata, cioe' il punto di partenza della giornata successiva. E'
// persistenza di stato, non economia momentanea.
//
// Disciplina (come resolveContracts riceve una mano senza deciderla): il System
// NON decide cosa conservare. RICEVE la selezione come parametro dell'Intent.
// Nessuna policy automatica (che andrebbe poi cancellata), nessun agente
// (ancora assente nella pipeline reale). Il simulatore ESEGUE decisioni, non le
// inventa. L'Intent porta la scelta come dato; i test la costruiscono
// esplicitamente.
//
// Il Banco e' un MULTISET (Bank = Record<FishSpecies, number>), non una lista
// di pesci individuali. Quindi "selezione" e' una configurazione del multiset:
// quanti di ciascuna specie conservare. Vincoli: per ogni specie, non piu' di
// quanti ce ne sono invenduti; totale <= capienza Cesta (3).
//
// Trasformazione: Banco invenduto + selezione -> __cesta__, Banco ridotto.
// Il pesce non selezionato resta fuori dalla Cesta (a fine giornata sara'
// scartato/restituito — verbo successivo, non qui).
//
// NON entra: la capienza della Cesta modificata da migliorie (nessuna attiva);
// l'eccedenza scartata a fine giornata (verbo successivo); la Pulizia della
// Cesta (verbo successivo, costa Ducati).
// ============================================================
import { System, GameState, GameEvent, Intent, EventDraft } from "../../packages/core/types";
import { FishSpecies, FISH_SPECIES } from "./model/fish";

const NS = "pescaria";

type Bank = Partial<Record<FishSpecies, number>>;

const CESTA_CAPACITY = 3; // capienza iniziale (regolamento cap. 4)

function total(m: Bank): number {
  return FISH_SPECIES.reduce((s, sp) => s + (m[sp] ?? 0), 0);
}

// la selezione e' contenuta nel Banco invenduto? (per ogni specie, non di piu')
function fitsInBank(selection: Bank, bank: Bank): boolean {
  return FISH_SPECIES.every((sp) => (selection[sp] ?? 0) <= (bank[sp] ?? 0));
}

function unsoldBank(state: GameState): Bank | null {
  // il Banco invenduto e' il banco della mano reale dopo i contratti.
  const rh = state.entities["__realHand__"] as { bank?: Bank } | undefined;
  return rh?.bank ?? null;
}
function cesta(state: GameState): Bank {
  return (state.entities["__cesta__"] as Bank | undefined) ?? {};
}

export const PescariaMoveToBasketSystem: System = {
  namespace: NS,

  handles(type: string): boolean {
    return type === "pescaria.basket.move" || type === "pescaria.basket.moved";
  },

  validate(state: GameState, intent: Intent): string | null {
    if (intent.type !== "pescaria.basket.move") return "handles only basket.move";
    const bank = unsoldBank(state);
    if (!bank) return "no unsold bank: need a real hand with a bank";
    const selection = intent.payload.selection as Bank | undefined;
    if (!selection || typeof selection !== "object") return "basket.move requires a selection (a fish multiset)";
    // la selezione deve essere contenuta nel Banco invenduto
    if (!fitsInBank(selection, bank)) return "selection exceeds the unsold fish available in the bank";
    // la selezione, sommata a cio' che e' gia' in Cesta, non deve eccedere la capienza
    if (total(selection) + total(cesta(state)) > CESTA_CAPACITY) {
      return `selection (${total(selection)}) + current basket (${total(cesta(state))}) exceeds Cesta capacity (${CESTA_CAPACITY})`;
    }
    return null;
  },

  reduce(state: GameState, intent: Intent): EventDraft[] {
    const selection = intent.payload.selection as Bank;
    return [{ type: "pescaria.basket.moved", producer: NS, payload: { selection } }];
  },

  apply(state: GameState, event: GameEvent): GameState {
    if (event.type === "pescaria.basket.moved") {
      const selection = event.payload.selection as Bank;
      const rh = state.entities["__realHand__"] as { hand: unknown; bank: Bank };
      // sposta: la selezione esce dal Banco ed entra in Cesta.
      const newBank: Bank = { ...rh.bank };
      const newCesta: Bank = { ...cesta(state) };
      for (const sp of FISH_SPECIES) {
        const moved = selection[sp] ?? 0;
        if (moved > 0) {
          newBank[sp] = (newBank[sp] ?? 0) - moved;
          newCesta[sp] = (newCesta[sp] ?? 0) + moved;
        }
      }
      // normalizza (niente chiavi a 0)
      for (const sp of FISH_SPECIES) {
        if ((newBank[sp] ?? 0) === 0) delete newBank[sp];
        if ((newCesta[sp] ?? 0) === 0) delete newCesta[sp];
      }
      return {
        ...state,
        entities: {
          ...state.entities,
          __realHand__: { hand: rh.hand, bank: newBank } as Record<string, unknown>,
          __cesta__: newCesta as Record<string, unknown>,
        },
      };
    }
    return state;
  },
  // legalIntents: il verbo HA una scelta, ma le opzioni legali sono molte (ogni
  // sotto-multiset del banco entro capienza). Non le enumeriamo: non c'e' ancora
  // un agente che le consumi, e enumerarle sarebbe costruire l'infrastruttura
  // della scelta prima del suo consumatore. Per ora la selezione arriva
  // dall'esterno (test); l'enumerazione nascera' col primo agente reale.
};
