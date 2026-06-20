// ============================================================
// @framework/sim — Probe (attrito-detector)
// Fa girare molte partite e cerca ANOMALIE, non conferme: esplosione di mosse
// legali, partite vicine al limite di turni, log anomali. Oggi sul draft non
// trova nulla (è regolare). Sarà utile alle aste, dove un bid può essere
// qualunque importo e legalIntents rischia di esplodere.
//
// Uso: adattare i system/agenti e lanciare. È uno strumento, non un test.
// ============================================================
import { Session } from "../session/session";
import { Agent } from "./agent";

export interface ProbeReport {
  games: number;
  maxLegalIntents: number;   // se cresce senza limite → attrito (es. bid liberi)
  turnsDistribution: Record<number, number>;
  maxTurns: number;
  avgEvents: number;
  maxEvents: number;
  hitTurnLimit: number;      // partite che NON sono finite da sole → attrito
}

export function probe(
  makeGame: (seed: number) => { session: Session; agents: Agent[] },
  games = 1000, maxTurns = 1000,
): ProbeReport {
  let maxLegal = 0, maxT = 0, totalEv = 0, maxEv = 0, hitLimit = 0;
  const dist: Record<number, number> = {};
  for (let i = 0; i < games; i++) {
    const { session, agents } = makeGame(i);
    let turns = 0, finished = false;
    while (turns < maxTurns) {
      let moved = false;
      for (const a of agents) {
        const legal = session.legalIntents(a.id);
        if (legal.length > maxLegal) maxLegal = legal.length;
        const c = a.choose(legal);
        if (c) { session.submit(c); moved = true; turns++; }
      }
      if (!moved) { finished = true; break; }
    }
    if (!finished) hitLimit++;
    dist[turns] = (dist[turns] ?? 0) + 1;
    if (turns > maxT) maxT = turns;
    const ev = session.getLog().length;
    totalEv += ev; if (ev > maxEv) maxEv = ev;
  }
  return { games, maxLegalIntents: maxLegal, turnsDistribution: dist, maxTurns: maxT, avgEvents: totalEv/games, maxEvents: maxEv, hitTurnLimit: hitLimit };
}
