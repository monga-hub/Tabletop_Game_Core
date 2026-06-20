// ============================================================
// @framework/sim — Ordering Benchmark (la metrica FONDAMENTALE)
// Non misura gli agenti. Misura le CARTE. La domanda di design vera, quella
// attorno a cui ruota tutta la ricerca sul draft:
//
//   "Esiste una carta sempre migliore, o il valore emerge dal contesto?"
//
// Per ogni coppia (A,B), quante volte A è scelta quando ENTRAMBE erano
// disponibili e un agente ha scelto. Se è sempre 100/0, ORDINE TOTALE: il gioco
// ha una classifica fissa (sta aggiungendo numeri). Se compaiono coppie miste
// (es. 55/45), il CONTESTO conta: il gioco crea trade-off (dissociazione).
//
// È la dissociazione di Knizia resa misurabile: ciò che vale dipende da cosa
// stai costruendo, non da una classifica assoluta.
// ============================================================
import { Session } from "../session/session";
import { System, Intent } from "../core/types";
import { AgentKind, makeAgent } from "../../examples/pescaria/agents/battery";
import { Card } from "../../examples/pescaria/model/card";

export interface OrderingReport {
  commit: string;
  agent: AgentKind;
  // per ogni coppia "X|Y" (X<Y per id): { xOverY, yOverX } = quante volte ciascuna
  // è stata scelta quando ENTRAMBE erano tra le mosse legali.
  pairs: Record<string, { a: string; b: string; aOverB: number; bOverA: number }>;
  totalOrderViolations: number; // coppie con entrambe le direzioni > 0 (contesto conta)
  contestedPairs: number;       // quante coppie sono "miste"
  observedPairs: number;
  isTotalOrder: boolean;        // true se NESSUNA coppia è contesa
}

function makeRng(seed: number) { let s = seed; return () => { s = (s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; }; }
function key(a: string, b: string) { return a < b ? `${a}|${b}` : `${b}|${a}`; }

export function orderingBenchmark(opts: {
  commit: string;
  agent: AgentKind;
  systems: System[];
  makeDeck: () => Card[];
  startIntent: (deck: Card[]) => { players: string[]; cards: Card[]; cardsPerPlayer: number };
  games?: number;
}): OrderingReport {
  const games = opts.games ?? 1000;
  const pairs: OrderingReport["pairs"] = {};

  for (let i = 0; i < games; i++) {
    const session = new Session({ systems: opts.systems, seed: i });
    const deck = opts.makeDeck();
    const cfg = opts.startIntent(deck);
    session.submit({ type: "pescaria.draft.start", agentId: "bench", payload: cfg });
    const rng = makeRng(i * 100 + 1);
    const agents = cfg.players.map((p) => makeAgent(opts.agent, p, session, rng));

    // gioco passo-passo: a ogni pick, registro la carta scelta vs le altre disponibili
    let turns = 0;
    while (turns < 1000) {
      let moved = false;
      for (const ag of agents) {
        const legal: Intent[] = session.legalIntents(ag.id);
        const choice = ag.choose(legal);
        if (choice) {
          const chosen = choice.payload.cardId as string;
          const available = legal.map((l) => l.payload.cardId as string);
          // la carta scelta è "preferita" a ogni altra carta disponibile
          for (const other of available) {
            if (other === chosen) continue;
            const k = key(chosen, other);
            if (!pairs[k]) {
              const [a, b] = k.split("|");
              pairs[k] = { a, b, aOverB: 0, bOverA: 0 };
            }
            if (chosen === pairs[k].a) pairs[k].aOverB++; else pairs[k].bOverA++;
          }
          session.submit(choice);
          moved = true; turns++;
        }
      }
      if (!moved) break;
    }
  }

  let contested = 0;
  for (const k of Object.keys(pairs)) {
    const p = pairs[k];
    if (p.aOverB > 0 && p.bOverA > 0) contested++; // entrambe le direzioni osservate
  }
  const observed = Object.keys(pairs).length;
  return {
    commit: opts.commit, agent: opts.agent, pairs,
    totalOrderViolations: contested, contestedPairs: contested,
    observedPairs: observed, isTotalOrder: contested === 0,
  };
}
