// ============================================================
// @framework/sim — Agent
// Un Agent sceglie un Intent tra quelli legali. Non conosce le regole:
// le mosse legali gliele dà il dominio (Session.legalIntents). Lui sceglie.
// Questo separa tre responsabilità:
//   Dominio  → quali mosse esistono   (legalIntents)
//   Agent    → quale scegliere         (questo file)
//   Solver   → quanto sono buone       (futuro: valuta, non genera)
// ============================================================
import { Intent } from "../core/types";

export interface Agent {
  readonly id: string;
  choose(legal: Intent[]): Intent | null; // null = nessuna mossa (passa/finito)
}

// Agent deliberatamente stupido: sceglie a caso. Nessuna strategia.
// Deterministico se gli dai un RNG seedato.
export class RandomAgent implements Agent {
  constructor(readonly id: string, private rng: () => number = Math.random) {}
  choose(legal: Intent[]): Intent | null {
    if (legal.length === 0) return null;
    return legal[Math.floor(this.rng() * legal.length)];
  }
}
