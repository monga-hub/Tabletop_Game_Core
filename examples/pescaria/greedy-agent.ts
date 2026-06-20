// ============================================================
// examples/pescaria — GreedyAgent (di dominio)
// NON è casuale: preferisce la carta con più stelle tra le mosse legali.
// È il primo agente con COMPORTAMENTO. Per scegliere deve leggere gli attributi
// delle carte (registry), quindi ha bisogno dello stato — non solo della lista
// di mosse. Questo è già un dato: un agente strategico vuole più della lista.
// ============================================================
import { Intent, GameState } from "../../packages/core/types";
import { Agent } from "../../packages/sim/agent";
import { Card } from "./model/card";

export class GreedyAgent implements Agent {
  constructor(readonly id: string, private getState: () => GameState) {}

  choose(legal: Intent[]): Intent | null {
    if (legal.length === 0) return null;
    const d = this.getState().entities["__draft__"] as { registry?: Card[] } | undefined;
    const registry = d?.registry ?? [];
    const starsOf = (cardId: string) => registry.find((c) => c.id === cardId)?.stars ?? 0;
    // sceglie l'intent il cui cardId ha più stelle
    let best = legal[0], bestStars = starsOf(legal[0].payload.cardId as string);
    for (const i of legal) {
      const st = starsOf(i.payload.cardId as string);
      if (st > bestStars) { best = i; bestStars = st; }
    }
    return best;
  }
}
