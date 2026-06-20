// ============================================================
// examples/pescaria — PhaseProjection (dominio)
// Traccia la fase corrente e l'ordine giocatori osservando SOLO il log.
// Sarà la base di ciò che la UI mostra: "in che fase siamo, chi gioca".
// ============================================================
import { Projection, GameEvent } from "../../packages/core/types";

export interface PhaseView {
  phase: string;
  order: string[];
}

export class PhaseProjection implements Projection<PhaseView> {
  readonly name = "phase";
  private phase = "idle";
  private order: string[] = [];

  observe(event: GameEvent): void {
    if (event.type === "pescaria.phase.changed") this.phase = event.payload.to as string;
    else if (event.type === "pescaria.draft.order.decided") this.order = event.payload.order as string[];
  }

  view(): PhaseView {
    return { phase: this.phase, order: [...this.order] };
  }
}
