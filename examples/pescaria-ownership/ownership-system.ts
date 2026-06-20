// ============================================================
// RICERCA H-004 — ownership come unico fatto
// Ipotesi: le zone del gioco (draft pool, mano, mercato, scarti) non sono
// strutture dati. Sono projection di un unico fatto: card.owner.changed.
// Una carta non si sposta mai tra contenitori: cambia solo proprietario.
//
// Questo system conosce UN SOLO concetto: una carta ha un owner, e l'owner
// può cambiare. Non sa cosa siano "mano", "draft", "mercato".
// ============================================================
import { System, GameState, GameEvent, Intent, EventDraft } from "../../packages/core/types";

const NS = "owner";

// owner speciali (sono solo stringhe: il system non li tratta diversamente)
export const DRAFT_POOL = "@draft-pool";
export const DISCARD = "@discard";
export const MARKET = "@market";

interface Owners { [cardId: string]: string; } // card -> owner corrente
function owners(state: GameState): Owners {
  return (state.entities["__owners__"] as Owners | undefined) ?? {};
}

export const OwnershipSystem: System = {
  namespace: NS,

  handles(type: string): boolean {
    return type === "owner.transfer" || type === "owner.changed" || type === "owner.mint";
  },

  validate(state: GameState, intent: Intent): string | null {
    const o = owners(state);
    if (intent.type === "owner.mint") {
      // crea una carta con un owner iniziale
      const card = intent.payload.card;
      if (typeof card !== "string" || !card) return "mint requires a card id";
      if (o[card]) return `card ${card} already exists`;
      if (typeof intent.payload.to !== "string") return "mint requires an initial owner";
      return null;
    }
    if (intent.type === "owner.transfer") {
      const card = intent.payload.card as string;
      const from = intent.payload.from as string;
      if (!o[card]) return `card ${card} does not exist`;
      if (o[card] !== from) return `card ${card} is owned by ${o[card]}, not ${from}`;
      if (typeof intent.payload.to !== "string") return "transfer requires a 'to' owner";
      return null;
    }
    return `OwnershipSystem does not handle ${intent.type}`;
  },

  reduce(_state: GameState, intent: Intent): EventDraft[] {
    if (intent.type === "owner.mint") {
      return [{ type: "owner.changed", producer: NS,
        payload: { card: intent.payload.card, from: null, to: intent.payload.to } }];
    }
    // transfer
    return [{ type: "owner.changed", producer: NS,
      payload: { card: intent.payload.card, from: intent.payload.from, to: intent.payload.to } }];
  },

  apply(state: GameState, event: GameEvent): GameState {
    if (event.type !== "owner.changed") return state;
    const o = { ...owners(state) };
    o[event.payload.card as string] = event.payload.to as string;
    return { ...state, entities: { ...state.entities, __owners__: o as unknown as Record<string, unknown> } };
  },
};
