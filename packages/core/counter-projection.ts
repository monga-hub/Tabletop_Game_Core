// ============================================================
// @framework/core — CounterProjection
// La projection più semplice possibile: conta gli eventi osservati.
// Serve solo a dimostrare che il meccanismo di osservazione funziona.
// NON scrive nulla nello stato. Osserva e basta.
// ============================================================
import { Projection, GameEvent } from "../core/types";

export class CounterProjection implements Projection<number> {
  readonly name = "counter";
  private count = 0;

  observe(_event: GameEvent): void {
    this.count++;
  }

  view(): number {
    return this.count;
  }
}
