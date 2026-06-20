// ============================================================
// examples/pescaria — CurrentTurnProjection (dominio)
// Dice di chi è il turno, osservando solo il log. Nient'altro.
// ============================================================
import { Projection, GameEvent } from "../../packages/core/types";

export class CurrentTurnProjection implements Projection<string | null> {
  readonly name = "current-turn";
  private current: string | null = null;

  observe(event: GameEvent): void {
    if (event.type === "pescaria.draft.turn.advanced") {
      this.current = event.payload.player as string;
    }
  }
  view(): string | null { return this.current; }
}
