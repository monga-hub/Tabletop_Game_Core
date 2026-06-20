// ============================================================
// @framework/sim — Benchmark del game design
// Erede del laboratorio Python: non script temporanei, ma una suite stabile.
// Fa girare la batteria CONGELATA di agenti sullo stesso scenario e produce un
// dataset di metriche. Un benchmark per commit → serie storica del design.
//
// Cosa misura (per ogni agente, su N partite):
//  - distribuzione delle stelle delle carte scelte
//  - distribuzione delle specie
//  - stelle medie
// La metrica chiave NON è "chi vince" ma quanto i risultati DIVERGONO tra agenti
// (sensibilità del design): se tutti convergono, poche decisioni; se divergono,
// trade-off reali.
// ============================================================
import { Session } from "../session/session";
import { AgentKind, BATTERY, makeAgent } from "../../examples/pescaria/agents/battery";
import { System } from "../core/types";
import { runGame } from "./simulator";
import { Card } from "../../examples/pescaria/model/card";

export interface AgentResult {
  agent: AgentKind;
  games: number;
  starHist: Record<number, number>;
  speciesHist: Record<string, number>;
  avgStars: number;
}
export interface BenchmarkReport {
  commit: string;            // etichetta del commit/scenario
  scenario: string;
  results: AgentResult[];
  sensitivity: number;       // 0..1: quanto divergono gli agenti (0 = identici)
}

function makeRng(seed: number) { let s = seed; return () => { s = (s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; }; }

export function benchmark(opts: {
  commit: string;
  scenario: string;
  systems: System[];
  startIntent: (deck: Card[]) => { players: string[]; cards: Card[]; cardsPerPlayer: number };
  makeDeck: () => Card[];
  games?: number;
}): BenchmarkReport {
  const games = opts.games ?? 1000;
  const results: AgentResult[] = [];

  for (const kind of BATTERY) {
    const starHist: Record<number, number> = {1:0,2:0,3:0,4:0};
    const speciesHist: Record<string, number> = {};
    let totalStars = 0, totalCards = 0;
    for (let i = 0; i < games; i++) {
      const session = new Session({ systems: opts.systems, seed: i });
      const deck = opts.makeDeck();
      const cfg = opts.startIntent(deck);
      session.submit({ type: "pescaria.draft.start", agentId: "bench", payload: cfg });
      const rng = makeRng(i * 100 + 1);
      const agents = cfg.players.map((p) => makeAgent(kind, p, session, rng));
      runGame(session, agents);
      const d = session.getState().entities["__draft__"] as { pickedCards: Record<string,string[]>; registry: Card[] };
      for (const id of Object.values(d.pickedCards).flat()) {
        const c = d.registry.find((x) => x.id === id)!;
        starHist[c.stars] = (starHist[c.stars] ?? 0) + 1;
        speciesHist[c.species] = (speciesHist[c.species] ?? 0) + 1;
        totalStars += c.stars; totalCards++;
      }
    }
    results.push({ agent: kind, games, starHist, speciesHist, avgStars: totalStars / totalCards });
  }

  // sensibilità: deviazione media delle avgStars tra agenti, normalizzata.
  // 0 = tutti gli agenti scelgono uguale (design piatto); più alta = più trade-off.
  const avgs = results.map((r) => r.avgStars);
  const mean = avgs.reduce((a, b) => a + b, 0) / avgs.length;
  const variance = avgs.reduce((a, v) => a + (v - mean) ** 2, 0) / avgs.length;
  const sensitivity = Math.sqrt(variance); // dev. standard delle stelle medie

  return { commit: opts.commit, scenario: opts.scenario, results, sensitivity };
}
