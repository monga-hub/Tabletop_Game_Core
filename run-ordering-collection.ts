// ============================================================
// run-ordering-collection.ts — Scenario B: Collection
//
// Stesso ordering benchmark di run-ordering.ts (0029), stessa batteria
// congelata, stessi System. Cambia SOLO cardsPerPlayer: 2 -> 4.
//
// Domanda: l'ordine totale osservato nel baseline (Scenario A) regge anche
// con mani più grandi, PRIMA che esista qualunque meccanica di collezione?
// Serve come secondo punto di riferimento: se i contratti (0032) cambieranno
// qualcosa, dovremo sapere se il cambiamento viene dal contratto o dalla sola
// dimensione della mano. Questo commit non aggiunge nessuna meccanica di gioco.
// ============================================================
import { orderingBenchmark } from "./packages/sim/ordering-benchmark";
import { PescariaDraftSystem } from "./examples/pescaria/draft-system";
import { PescariaDraftPickSystem } from "./examples/pescaria/draft-pick-system";
import { sampleDeck } from "./examples/pescaria/model/card";
import { AgentKind } from "./examples/pescaria/agents/battery";
import * as fs from "fs";

const systems = [PescariaDraftSystem, PescariaDraftPickSystem];
fs.mkdirSync("experiments/0031-collection-scenario", { recursive: true });

console.log("ORDERING BENCHMARK — Scenario B (collection, 4 carte a testa)\n");
console.log("(coppie contese = entrambe le direzioni osservate = il contesto conta)\n");

for (const agent of ["random","greedy-stars","greedy-species","balanced"] as AgentKind[]) {
  const r = orderingBenchmark({
    commit: "0031-collection-scenario", agent, systems,
    makeDeck: () => sampleDeck(),
    startIntent: (deck) => ({ players: ["p1","p2","p3"], cards: deck, cardsPerPlayer: 4 }),
    games: 1000,
  });
  fs.writeFileSync(`experiments/0031-collection-scenario/ordering-${agent}.json`, JSON.stringify(r, null, 2));
  const verdict = r.isTotalOrder ? "ORDINE TOTALE (classifica fissa)" : `CONTESTO CONTA (${r.contestedPairs} coppie contese)`;
  console.log(`  ${agent.padEnd(16)} coppie osservate: ${String(r.observedPairs).padStart(3)}  contese: ${String(r.contestedPairs).padStart(3)}  → ${verdict}`);
}
