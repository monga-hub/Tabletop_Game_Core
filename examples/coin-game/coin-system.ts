// ============================================================
// examples/coin-game — il primo gioco del framework
// Non Pescaria. Un gioco ridicolo: monete in un wallet.
// Serve a verificare che il framework regga un dominio banale, così
// che ogni futura difficoltà in Pescaria sia attribuibile al GIOCO,
// non al motore.
//
// Tutto il gioco è in questo system. Se cancelli questo file, il
// framework resta intatto: non sa nulla di monete.
// ============================================================
import { System, GameState, GameEvent, Intent, EventDraft } from "../../packages/core/types";

const NS = "coin";

function walletOf(state: GameState, player: string): number {
  const e = state.entities[player] as { wallet?: number } | undefined;
  return e?.wallet ?? 0;
}

export const CoinSystem: System = {
  namespace: NS,

  handles(type: string): boolean {
    return type === "coin.give" || type === "coin.granted"
        || type === "coin.take" || type === "coin.taken";
  },

  validate(state: GameState, intent: Intent): string | null {
    const player = intent.payload.player;
    if (typeof player !== "string" || player.length === 0) {
      return "a coin intent requires a non-empty player id";
    }
    switch (intent.type) {
      case "coin.give":
        return null; // dare è sempre lecito
      case "coin.take":
        // rifiuto DIPENDENTE DALLO STATO: non puoi togliere da un wallet vuoto
        if (walletOf(state, player) <= 0) {
          return `cannot take a coin from ${player}: wallet is empty`;
        }
        return null;
      default:
        return `CoinSystem does not handle intent ${intent.type}`;
    }
  },

  reduce(_state: GameState, intent: Intent): EventDraft[] {
    switch (intent.type) {
      case "coin.give":
        return [{ type: "coin.granted", producer: NS, payload: { player: intent.payload.player } }];
      case "coin.take":
        return [{ type: "coin.taken", producer: NS, payload: { player: intent.payload.player } }];
      default:
        return [];
    }
  },

  apply(state: GameState, event: GameEvent): GameState {
    let delta = 0;
    if (event.type === "coin.granted") delta = +1;
    else if (event.type === "coin.taken") delta = -1;
    else return state; // ignora gli intent stessi e altri eventi

    const player = event.payload.player as string;
    const prev = (state.entities[player] as { wallet?: number } | undefined);
    const wallet = (prev?.wallet ?? 0) + delta;
    return {
      ...state,
      entities: {
        ...state.entities,
        [player]: { ...(prev ?? {}), wallet },
      },
    };
  },
};
