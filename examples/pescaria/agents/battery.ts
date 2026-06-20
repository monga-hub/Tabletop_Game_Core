// ============================================================
// LA BATTERIA DI AGENTI — CONGELATA
// Questi quattro agenti sono lo STRUMENTO DI MISURA, non parte del gioco.
// Come un microscopio: non si modificano quando si studia una meccanica nuova,
// così ogni cambiamento nei risultati è attribuibile al GIOCO, non allo strumento.
//
// REGOLA: non aggiungere agenti qui senza una ragione fortissima. Aggiungerne uno
// rompe la serie storica (i benchmark vecchi non sarebbero più confrontabili).
// Un agente nuovo è un microscopio nuovo: ricominci le misure da zero.
// ============================================================
import { Session } from "../../../packages/session/session";
import { Agent } from "../../../packages/sim/agent";
import { RandomChoiceAgent } from "./random";
import { GreedyStarsAgent } from "./greedy-stars";
import { GreedySpeciesAgent } from "./greedy-species";
import { BalancedAgent } from "./balanced";

export type AgentKind = "random" | "greedy-stars" | "greedy-species" | "balanced";
export const BATTERY: readonly AgentKind[] = ["random", "greedy-stars", "greedy-species", "balanced"];

export function makeAgent(kind: AgentKind, id: string, session: Session, rng: () => number): Agent {
  switch (kind) {
    case "random":        return new RandomChoiceAgent(id, rng);
    case "greedy-stars":  return new GreedyStarsAgent(id, () => session.getState());
    case "greedy-species":return new GreedySpeciesAgent(id, () => session.getState());
    case "balanced":      return new BalancedAgent(id, () => session.getState());
  }
}
