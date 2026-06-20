// ============================================================
// examples/coin-game — WalletProjection
// Una projection di DOMINIO: sa cosa sia una moneta.
// Vive nell'esempio, non nel framework, perché serve solo a questo gioco.
//
// Scopo: dimostrare che una projection può ricostruire COMPLETAMENTE uno
// stato osservando SOLO il log degli eventi, senza guardare GameState.
// È la prova in piccolo di ciò che faranno Solver e Analytics su Pescaria.
// ============================================================
import { Projection, GameEvent } from "../../packages/core/types";

export class WalletProjection implements Projection<Record<string, number>> {
  readonly name = "wallet";
  private wallets: Record<string, number> = {};

  observe(event: GameEvent): void {
    let delta = 0;
    if (event.type === "coin.granted") delta = +1;
    else if (event.type === "coin.taken") delta = -1;
    else return;
    const player = event.payload.player as string;
    this.wallets[player] = (this.wallets[player] ?? 0) + delta;
  }

  view(): Record<string, number> {
    return { ...this.wallets };
  }
}
