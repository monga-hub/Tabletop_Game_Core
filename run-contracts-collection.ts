// ============================================================
// run-contracts-collection.ts — 0032: Contracts S0 su Scenario B
//
// Domanda (senza previsione): l'introduzione di una sorgente di valore
// contestuale (3 Sardine -> 15 punti) è sufficiente, DA SOLA, a modificare
// il comportamento della batteria congelata? La batteria non sa che il
// contratto esiste: nessun agente nuovo è stato introdotto. Questo script
// osserva solo gli ESITI (hands/scores dopo draft.completed), non i pick:
// l'ordering benchmark (già girato) non può cambiare per costruzione, perché
// il contratto valuta dopo che i pick sono già decisi.
//
// Riusa l'infrastruttura esistente (Session, runGame, makeAgent, BATTERY).
// Non è un nuovo framework di benchmark: è la lettura di un campo (__scores__)
// che prima di questo commit non esisteva.
// ============================================================
import { Session } from "./packages/session/session";
import { runGame } from "./packages/sim/simulator";
import { BATTERY, AgentKind, makeAgent } from "./examples/pescaria/agents/battery";
import { PescariaDraftSystem } from "./examples/pescaria/draft-system";
import { PescariaDraftPickSystem } from "./examples/pescaria/draft-pick-system";
import { sampleDeck } from "./examples/pescaria/model/card";
import * as fs from "fs";

function makeRng(seed: number) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }

const systems = [PescariaDraftSystem, PescariaDraftPickSystem];
const players = ["p1", "p2", "p3"];
const games = 1000;

interface AgentObservation {
  agent: AgentKind;
  games: number;
  playerSlots: number;          // games * players.length
  contractsCompleted: number;   // quante volte (per giocatore-partita) il contratto è scattato
  gamesWithAtLeastOne: number;  // partite in cui ALMENO un giocatore ha completato il contratto
  totalScore: number;
}

const observations: AgentObservation[] = [];

for (const kind of BATTERY) {
  let contractsCompleted = 0;
  let gamesWithAtLeastOne = 0;
  let totalScore = 0;

  for (let i = 0; i < games; i++) {
    const session = new Session({ systems, seed: i });
    const deck = sampleDeck();
    session.submit({ type: "pescaria.draft.start", agentId: "obs", payload: { players, cards: deck, cardsPerPlayer: 4 } });
    const rng = makeRng(i * 100 + 1);
    const agents = players.map((p) => makeAgent(kind, p, session, rng));
    runGame(session, agents);

    const scores = session.getState().entities["__scores__"] as Record<string, number> | undefined;
    if (scores) {
      let anyThisGame = false;
      for (const p of players) {
        const sc = scores[p] ?? 0;
        totalScore += sc;
        if (sc > 0) { contractsCompleted++; anyThisGame = true; }
      }
      if (anyThisGame) gamesWithAtLeastOne++;
    }
  }

  observations.push({
    agent: kind, games, playerSlots: games * players.length,
    contractsCompleted, gamesWithAtLeastOne, totalScore,
  });
}

fs.mkdirSync("experiments/0032-contracts-s0", { recursive: true });
fs.writeFileSync("experiments/0032-contracts-s0/observation.json", JSON.stringify(observations, null, 2));

console.log("OSSERVAZIONE 0032 — Contracts S0 su Scenario B (collection, 4 carte a testa)\n");
console.log("Nessuna previsione formulata in anticipo. Si osserva solo cosa succede.\n");
console.log("Agente            partite   giocatori-partita col contratto   partite con ≥1 contratto   punti totali");
for (const o of observations) {
  const pct = ((o.contractsCompleted / o.playerSlots) * 100).toFixed(2);
  console.log(`  ${o.agent.padEnd(16)} ${String(o.games).padStart(6)}   ${String(o.contractsCompleted).padStart(5)} / ${o.playerSlots} (${pct}%)            ${String(o.gamesWithAtLeastOne).padStart(5)} / ${o.games}              ${o.totalScore}`);
}
