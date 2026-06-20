// Ipotesi di comportamento: "bilancia valore e diversità".
// Pesa stelle E novità di specie insieme, invece di massimizzarne una sola.
// È il quarto e ultimo agente della batteria CONGELATA.
import { Intent, GameState } from "../../../packages/core/types";
import { Agent } from "../../../packages/sim/agent";
import { Card } from "../model/card";

export class BalancedAgent implements Agent {
  constructor(readonly id: string, private getState: () => GameState) {}
  choose(legal: Intent[]): Intent | null {
    if (!legal.length) return null;
    const d = this.getState().entities["__draft__"] as { registry?: Card[]; pickedCards?: Record<string, string[]> };
    const reg = d?.registry ?? [];
    const mine = d?.pickedCards?.[this.id] ?? [];
    const mySpecies = new Set(mine.map((id) => reg.find((c) => c.id === id)?.species));
    const score = (cardId: string) => {
      const c = reg.find((x) => x.id === cardId);
      if (!c) return 0;
      const novelty = mySpecies.has(c.species) ? 0 : 1.5; // bonus specie nuova
      return c.stars + novelty; // stelle + novità: né solo valore né solo diversità
    };
    return legal.reduce((best, i) =>
      score(i.payload.cardId as string) > score(best.payload.cardId as string) ? i : best, legal[0]);
  }
}
