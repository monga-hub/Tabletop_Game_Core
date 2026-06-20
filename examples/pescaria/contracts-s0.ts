// ============================================================
// examples/pescaria/contracts-s0.ts
// ============================================================
// Contratto S0 (diagnostico). Regola di laboratorio:
//
//   Disponibilità: ogni giocatore ha un proprio contratto identico,
//                  non condiviso; il completamento di uno non
//                  influenza gli altri.
//   Requisito:     3 Sardine
//   Ricompensa:    15 punti
//   Costo:         le 3 Sardine vengono rimosse da hands
//   Frequenza:     completabile al massimo una volta
//
// Deliberatamente "stupido": nessuna scelta, nessun timing, nessuna
// priorità, nessun evento nuovo. Non stiamo ancora studiando un SISTEMA
// di contratti — stiamo solo introducendo una sorgente di valore
// contestuale, per vedere se basta a modificare il comportamento della
// batteria congelata. Per questo è una funzione pura, non un System:
// niente ContractModel, niente ContractRepository. Quando arriveranno
// contratti multipli o effetti diversi, l'astrazione emergerà da quel
// secondo caso — non da questo.
// ============================================================
import { Card, CardId } from "./model/card";

const REQUIRED_SPECIES = "sardina";
const REQUIRED_COUNT = 3;
const REWARD_POINTS = 15;

export interface ContractsS0Result {
  hands: Record<string, CardId[]>;
  scores: Record<string, number>;
}

/**
 * Valuta il contratto S0 per ogni giocatore, una sola volta, subito dopo
 * che le hands sono nate dal draft. Nessuna scelta dell'agente: se le 3
 * Sardine sono in mano, il contratto si completa — punto.
 */
export function evaluateContractsS0(
  hands: Readonly<Record<string, readonly CardId[]>>,
  registry: readonly Card[],
): ContractsS0Result {
  const speciesOf = new Map(registry.map((c) => [c.id, c.species] as const));
  const outHands: Record<string, CardId[]> = {};
  const scores: Record<string, number> = {};

  for (const player of Object.keys(hands)) {
    const hand = [...hands[player]];
    const sardineIds = hand.filter((id) => speciesOf.get(id) === REQUIRED_SPECIES);
    if (sardineIds.length >= REQUIRED_COUNT) {
      const toRemove = new Set(sardineIds.slice(0, REQUIRED_COUNT));
      outHands[player] = hand.filter((id) => !toRemove.has(id));
      scores[player] = REWARD_POINTS;
    } else {
      outHands[player] = hand;
      scores[player] = 0;
    }
  }
  return { hands: outHands, scores };
}
