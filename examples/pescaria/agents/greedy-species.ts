// Ipotesi di comportamento: "massimizza la diversità di specie nella mia mano".
// Preferisce una carta di una specie che NON ho ancora, anche se a poche stelle.
import { Intent, GameState } from "../../../packages/core/types";
import { Agent } from "../../../packages/sim/agent";
import { Card } from "../model/card";

export class GreedySpeciesAgent implements Agent {
  constructor(readonly id: string, private getState: () => GameState) {}
  choose(legal: Intent[]): Intent | null {
    if (!legal.length) return null;
    const d = this.getState().entities["__draft__"] as { registry?: Card[]; pickedCards?: Record<string, string[]> };
    const reg = d?.registry ?? [];
    const mine = (d?.pickedCards?.[this.id] ?? []);
    const myspecies = new Set(mine.map((id) => reg.find((c) => c.id === id)?.species));
    const speciesOf = (id: string) => reg.find((c) => c.id === id)?.species;
    const starsOf = (id: string) => reg.find((c) => c.id === id)?.stars ?? 0;
    // preferisci una specie nuova; a parità, più stelle
    return legal.reduce((best, i) => {
      const ci = i.payload.cardId as string, cb = best.payload.cardId as string;
      const newI = myspecies.has(speciesOf(ci)) ? 0 : 1;
      const newB = myspecies.has(speciesOf(cb)) ? 0 : 1;
      if (newI !== newB) return newI > newB ? i : best;
      return starsOf(ci) > starsOf(cb) ? i : best;
    }, legal[0]);
  }
}
