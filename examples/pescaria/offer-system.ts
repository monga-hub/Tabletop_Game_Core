// ============================================================
// examples/pescaria/offer-system.ts — 0034: hands -> offers
//
// Trasformazione minima: __hands__ -> __offers__. Un giocatore scegli una
// carta dalla propria mano e la gioca; la carta esce da hands ed entra in
// offers. Una sola volta per giocatore.
//
// Cosa NON entra in questo commit, e perché (criterio di lavoro in
// examples/pescaria/README.md — "cosa entra in una trasformazione"):
//  - la carta è "coperta" nel regolamento, ma oggi il simulatore modella lo
//    stato del mondo, non la conoscenza dei giocatori (nessun agente legge
//    offers prima di muovere). Non cambia il risultato di QUESTA
//    trasformazione -> non entra oggi.
//  - l'ordine di turno (orario, dal primo giocatore) non cambia lo stato
//    finale di questa trasformazione (chi offre prima non altera il
//    risultato hands->offers) -> non entra oggi. Diventerà rilevante
//    quando un'altra trasformazione dipenderà da esso (es. risoluzione dei
//    pareggi, "il vincitore diventa primo giocatore").
// ============================================================
import { System, GameState, GameEvent, Intent, EventDraft } from "../../packages/core/types";
import { CardId } from "./model/card";

const NS = "pescaria";

function hands(state: GameState): Record<string, CardId[]> | null {
  return (state.entities["__hands__"] as Record<string, CardId[]> | undefined) ?? null;
}
function offers(state: GameState): Record<string, CardId> {
  return (state.entities["__offers__"] as Record<string, CardId> | undefined) ?? {};
}

export const PescariaOfferSystem: System = {
  namespace: NS,

  handles(type: string): boolean {
    return type === "pescaria.offer.play" || type === "pescaria.offer.played";
  },

  validate(state: GameState, intent: Intent): string | null {
    if (intent.type !== "pescaria.offer.play") return "handles only offer.play";
    const h = hands(state);
    if (!h) return "no hands available: draft not completed";
    const player = intent.payload.playerId;
    if (typeof player !== "string" || !(player in h)) return "unknown player";
    const o = offers(state);
    if (o[player] !== undefined) return `${player} has already offered this round`;
    const card = intent.payload.cardId;
    if (typeof card !== "string" || !h[player].includes(card)) {
      return `card ${String(card)} is not in ${player}'s hand`;
    }
    return null;
  },

  reduce(state: GameState, intent: Intent): EventDraft[] {
    const player = intent.payload.playerId as string;
    const card = intent.payload.cardId as string;
    return [{ type: "pescaria.offer.played", producer: NS, payload: { player, card } }];
  },

  apply(state: GameState, event: GameEvent): GameState {
    if (event.type === "pescaria.offer.played") {
      const h = hands(state)!;
      const o = offers(state);
      const player = event.payload.player as string;
      const card = event.payload.card as string;
      return {
        ...state,
        entities: {
          ...state.entities,
          __hands__: { ...h, [player]: h[player].filter((c) => c !== card) },
          __offers__: { ...o, [player]: card },
        },
      };
    }
    return state;
  },

  // Ogni giocatore che ha ancora una mano e non ha già offerto può offrire
  // qualunque carta in mano. Nessun ordine: vedi nota in testa al file.
  legalIntents(state: GameState, agentId: string): Intent[] {
    const h = hands(state);
    if (!h || !(agentId in h)) return [];
    const o = offers(state);
    if (o[agentId] !== undefined) return [];
    return h[agentId].map((card) => ({
      type: "pescaria.offer.play",
      agentId,
      payload: { playerId: agentId, cardId: card },
    }));
  },
};
