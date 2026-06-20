// ============================================================
// run-benchmark-collection.ts — Scenario B: Collection
//
// Stesso benchmark di run-benchmark.ts (0028), stessa batteria congelata,
// stessi System. Cambia SOLO cardsPerPlayer: 2 -> 4.
//
// Perché: il commit 0028/0029 (Scenario A, baseline) rende irraggiungibile
// per costruzione qualunque meccanica che richieda 3+ carte della stessa
// specie (A-005). Scenario B non sostituisce il baseline: lo affianca, per
// rendere possibile l'osservazione di meccaniche di collezione PRIMA di
// introdurne una. Questo commit non aggiunge nessuna meccanica di gioco.
// ============================================================
import { benchmark } from "./packages/sim/benchmark";
import { PescariaDraftSystem } from "./examples/pescaria/draft-system";
import { PescariaDraftPickSystem } from "./examples/pescaria/draft-pick-system";
import { sampleDeck } from "./examples/pescaria/model/card";
import * as fs from "fs";

const report = benchmark({
  commit: "0031-collection-scenario",
  scenario: "draft collection: 3 giocatori, 4 carte, mazzo 16 (4 specie x 4 stelle)",
  systems: [PescariaDraftSystem, PescariaDraftPickSystem],
  makeDeck: () => sampleDeck(),
  startIntent: (deck) => ({ players: ["p1","p2","p3"], cards: deck, cardsPerPlayer: 4 }),
  games: 1000,
});

fs.mkdirSync("experiments/0031-collection-scenario", { recursive: true });
fs.writeFileSync("experiments/0031-collection-scenario/report.json", JSON.stringify(report, null, 2));

console.log("BENCHMARK 0031 — Scenario B (collection, 4 carte a testa)\n");
console.log("scenario:", report.scenario, "\n");
console.log("Agente            stelle medie   distribuzione stelle");
for (const r of report.results) {
  const h = r.starHist;
  console.log(`  ${r.agent.padEnd(16)} ${r.avgStars.toFixed(2).padStart(6)}        1★:${h[1]} 2★:${h[2]} 3★:${h[3]} 4★:${h[4]}`);
}
console.log(`\nSENSIBILITÀ DEL DESIGN: ${report.sensitivity.toFixed(3)}  (dev.std delle stelle medie tra agenti)`);
console.log("(0 = tutti gli agenti scelgono uguale; più alta = più trade-off reali)");
