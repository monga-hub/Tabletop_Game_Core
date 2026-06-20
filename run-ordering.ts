import { orderingBenchmark } from "./packages/sim/ordering-benchmark";
import { PescariaDraftSystem } from "./examples/pescaria/draft-system";
import { PescariaDraftPickSystem } from "./examples/pescaria/draft-pick-system";
import { sampleDeck } from "./examples/pescaria/model/card";
import { AgentKind } from "./examples/pescaria/agents/battery";
import * as fs from "fs";

const systems = [PescariaDraftSystem, PescariaDraftPickSystem];
fs.mkdirSync("experiments/0029-ordering-baseline", { recursive: true });

console.log("ORDERING BENCHMARK — esiste un ordine totale delle carte?\n");
console.log("(coppie contese = entrambe le direzioni osservate = il contesto conta)\n");

for (const agent of ["random","greedy-stars","greedy-species","balanced"] as AgentKind[]) {
  const r = orderingBenchmark({
    commit: "0029", agent, systems,
    makeDeck: () => sampleDeck(),
    startIntent: (deck) => ({ players: ["p1","p2","p3"], cards: deck, cardsPerPlayer: 2 }),
    games: 1000,
  });
  fs.writeFileSync(`experiments/0029-ordering-baseline/${agent}.json`, JSON.stringify(r, null, 2));
  const verdict = r.isTotalOrder ? "ORDINE TOTALE (classifica fissa)" : `CONTESTO CONTA (${r.contestedPairs} coppie contese)`;
  console.log(`  ${agent.padEnd(16)} coppie osservate: ${String(r.observedPairs).padStart(3)}  contese: ${String(r.contestedPairs).padStart(3)}  → ${verdict}`);
}
