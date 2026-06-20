// Ipotesi di comportamento: "massimizza subito le stelle".
import { Intent, GameState } from "../../../packages/core/types";
import { Agent } from "../../../packages/sim/agent";
import { Card } from "../model/card";

export class GreedyStarsAgent implements Agent {
  constructor(readonly id: string, private getState: () => GameState) {}
  choose(legal: Intent[]): Intent | null {
    if (!legal.length) return null;
    const reg = (this.getState().entities["__draft__"] as { registry?: Card[] })?.registry ?? [];
    const stars = (id: string) => reg.find((c) => c.id === id)?.stars ?? 0;
    return legal.reduce((best, i) =>
      stars(i.payload.cardId as string) > stars(best.payload.cardId as string) ? i : best, legal[0]);
  }
}
