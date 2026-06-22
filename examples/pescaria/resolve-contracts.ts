// ============================================================
// examples/pescaria/resolve-contracts.ts — il verbo "completare i contratti"
//
// Funzione pura (nessuna Session, nessun evento): dato un insieme di carte
// reali in mano e un Banco di pesci, completa i contratti completabili,
// consumando i pesci richiesti.
//
// Modello deciso (regolamento + decisioni di laboratorio):
//  - il completamento e' AUTOMATICO, non una scelta: la scelta vive nel Draft
//    e nelle aste (cosa offrire vs cosa tenere), non qui. Vedi README di
//    dominio. Qui si completa tutto il completabile.
//  - completamento LOCALE e deterministico: si processano le carte
//    nell'ordine della mano; per ciascuna, se il Banco contiene i pesci
//    richiesti, si completa e si consumano. L'ordine della mano e' una regola
//    di disambiguazione SEGNAPOSTO (dichiarata): quando due contratti
//    competono per lo stesso pesce, vince chi viene prima nella mano. NON e'
//    un risolutore ottimo: cercare "il miglior insieme di contratti" sarebbe
//    una Policy, e non introduciamo una Policy prima di aver OSSERVATO che i
//    conflitti esistono e contano (stessa disciplina del ContractAgent).
//
// conflictObserved: durante la risoluzione, se completare un contratto rende
// NON piu' completabile un altro contratto che era completabile subito prima,
// si registra un conflitto. NON si risolve, NON si fa backtracking: si osserva.
// E' il dato grezzo che dira' (in un ESPERIMENTO separato, non qui) se una
// Policy serve davvero.
// ============================================================
import { FishSpecies, FISH_SPECIES } from "./model/fish";
import { RealCard } from "./cards/real-deck";

export type Bank = Partial<Record<FishSpecies, number>>;

export interface ResolveResult {
  completed: RealCard[];            // i contratti completati, nell'ordine in cui sono stati completati
  remainingHand: RealCard[];        // le carte non completate (restano in mano)
  bankAfter: Bank;                  // il Banco dopo aver consumato i pesci dei contratti completati
  conflictObserved: boolean;        // un completamento ha reso incompletabile un altro contratto prima completabile?
}

function canComplete(bank: Bank, req: RealCard["requirements"]): boolean {
  for (const sp of Object.keys(req) as FishSpecies[]) {
    if ((bank[sp] ?? 0) < (req[sp] ?? 0)) return false;
  }
  return true;
}

function consume(bank: Bank, req: RealCard["requirements"]): Bank {
  const out: Bank = { ...bank };
  for (const sp of Object.keys(req) as FishSpecies[]) {
    out[sp] = (out[sp] ?? 0) - (req[sp] ?? 0);
  }
  return out;
}

/**
 * Completa i contratti completabili, in ordine di mano, consumando i pesci.
 * Pura: non muta gli argomenti.
 */
export function resolveContracts(hand: readonly RealCard[], bank: Bank): ResolveResult {
  let currentBank: Bank = { ...bank };
  const completed: RealCard[] = [];
  const remaining: RealCard[] = [];
  let conflictObserved = false;

  for (let i = 0; i < hand.length; i++) {
    const card = hand[i];
    if (canComplete(currentBank, card.requirements)) {
      // prima di consumare: quali altre carte ANCORA in mano erano completabili?
      const othersCompletableBefore = hand
        .slice(i + 1)
        .filter((c) => canComplete(currentBank, c.requirements));

      currentBank = consume(currentBank, card.requirements);
      completed.push(card);

      // dopo aver consumato: qualcuna di quelle non lo e' piu'? -> conflitto
      if (othersCompletableBefore.some((c) => !canComplete(currentBank, c.requirements))) {
        conflictObserved = true;
      }
    } else {
      remaining.push(card);
    }
  }

  // normalizza il banco (niente chiavi a 0 sparse, per confronti puliti)
  const bankAfter: Bank = {};
  for (const sp of FISH_SPECIES) if ((currentBank[sp] ?? 0) > 0) bankAfter[sp] = currentBank[sp];

  return { completed, remainingHand: remaining, bankAfter, conflictObserved };
}
