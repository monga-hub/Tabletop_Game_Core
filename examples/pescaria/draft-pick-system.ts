// ============================================================
// examples/pescaria — draft.pick: IL TURNO DEL DRAFT
// Un solo concetto nuovo: il TEMPO. Finora avevamo "stato"; ora abbiamo
// "stato -> stato successivo", una sequenza ordinata di scelte.
//
// Le carte sono identificatori NUDI ("A","B","C","D"): nessuna proprietà,
// nessun pesce, nessun valore. Così questo commit verifica UNA cosa sola:
// il framework sa rappresentare una sequenza ordinata di pick?
//
// NON c'è: refill, mano vera, contratti, valore, asta, Solver. Tutto dopo.
//
// Questo system NON conosce il system che crea il draft. Conosce solo il FATTO
// __draft__ nello stato e gli eventi che lo toccano. Non collaborano i System:
// collaborano i fatti. Se domani il draft fosse creato da un altro system, il
// pick continuerebbe a funzionare: non conosce il produttore, solo il linguaggio.
// ============================================================
import { System, GameState, GameEvent, Intent, EventDraft } from "../../packages/core/types";

const NS = "pescaria";

interface DraftState {
  order: string[];
  currentPlayer: number;       // indice in order
  availableCards: string[];    // identificatori nudi
  pickedCards: Record<string, string[]>; // player -> carte prese
}
function draft(state: GameState): DraftState | null {
  return (state.entities["__draft__"] as DraftState | undefined) ?? null;
}

export const PescariaDraftPickSystem: System = {
  namespace: NS,

  handles(type: string): boolean {
    return type === "pescaria.draft.pick"
        || type === "pescaria.draft.card.picked"
        || type === "pescaria.draft.turn.advanced";
  },

  validate(state: GameState, intent: Intent): string | null {
    if (intent.type !== "pescaria.draft.pick") return `handles only draft.pick`;
    const d = draft(state);
    if (!d) return "no draft in progress";                       // 1. esiste un draft?
    const player = intent.payload.playerId;
    const expected = d.order[d.currentPlayer];
    if (player !== expected) return `not your turn: it's ${expected}'s pick`; // 2. è il tuo turno?
    const card = intent.payload.cardId;
    if (typeof card !== "string" || !d.availableCards.includes(card)) {
      return `card ${String(card)} is not available`;            // 3. la carta esiste?
    }
    return null;
  },

  reduce(state: GameState, intent: Intent): EventDraft[] {
    const d = draft(state)!;
    const player = intent.payload.playerId as string;
    const card = intent.payload.cardId as string;
    const nextPlayer = (d.currentPlayer + 1) % d.order.length;
    return [
      { type: "pescaria.draft.card.picked", producer: NS, payload: { player, card } },
      { type: "pescaria.draft.turn.advanced", producer: NS, payload: { to: nextPlayer, player: d.order[nextPlayer] } },
    ];
  },

  apply(state: GameState, event: GameEvent): GameState {
    const d = draft(state);
    if (event.type === "pescaria.draft.card.picked") {
      const cur = d!;
      const card = event.payload.card as string;
      const player = event.payload.player as string;
      return {
        ...state,
        entities: {
          ...state.entities,
          __draft__: {
            ...cur,
            availableCards: cur.availableCards.filter((c) => c !== card),
            pickedCards: { ...cur.pickedCards, [player]: [...(cur.pickedCards[player] ?? []), card] },
          },
        },
      };
    }
    if (event.type === "pescaria.draft.turn.advanced") {
      return {
        ...state,
        entities: { ...state.entities, __draft__: { ...d!, currentPlayer: event.payload.to as number } },
      };
    }
    return state;
  },
};
