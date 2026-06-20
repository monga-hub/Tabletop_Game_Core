// Ipotesi di comportamento: nessuna. Baseline casuale.
import { Intent } from "../../../packages/core/types";
import { Agent } from "../../../packages/sim/agent";
export class RandomChoiceAgent implements Agent {
  constructor(readonly id: string, private rng: () => number) {}
  choose(legal: Intent[]): Intent | null {
    return legal.length ? legal[Math.floor(this.rng() * legal.length)] : null;
  }
}
