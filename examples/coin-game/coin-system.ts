// ============================================================
// examples/coin-game — il primo gioco del framework
// Non Pescaria. Un gioco ridicolo: dai una moneta a un giocatore.
// Serve a verificare che il framework regga un dominio banale, così
// che ogni futura difficoltà in Pescaria sia attribuibile al GIOCO,
// non al motore.
//
// Tutto il gioco è in questo system. Se cancelli questo file, il
// framework resta intatto: non sa nulla di monete.
// ============================================================
import { System, GameState, GameEvent, Intent, EventDraft } from "../../packages/core/types";

const NS = "coin";

export const CoinSystem: System = {
  namespace: NS,

  handles(type: string): boolean {
    return type === "coin.give" || type === "coin.granted";
  },

  validate(_state: GameState, intent: Intent): string | null {
    if (intent.type !== "coin.give") return "CoinSystem handles only coin.give";
    const player = intent.payload.player;
    if (typeof player !== "string" || player.length === 0) {
      return "coin.give requires a non-empty player id";
    }
    return null; // valido
  },

  reduce(_state: GameState, intent: Intent): EventDraft[] {
    // un Intent valido produce un Domain/Consequence event
    return [{
      type: "coin.granted",
      producer: NS,
      payload: { player: intent.payload.player },
    }];
  },

  apply(state: GameState, event: GameEvent): GameState {
    if (event.type !== "coin.granted") return state; // ignora l'intent stesso
    const player = event.payload.player as string;
    const prev = (state.entities[player] as { wallet?: number } | undefined);
    const wallet = (prev?.wallet ?? 0) + 1;
    return {
      ...state,
      entities: {
        ...state.entities,
        [player]: { ...(prev ?? {}), wallet },
      },
    };
  },
};
