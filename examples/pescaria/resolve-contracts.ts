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
// La funzione restituisce SOLO l'esito della policy (completati, mano residua,
// banco). NON misura se lo stato e' "conflittuale": quella e' una proprieta'
// del dominio, non di questa policy, e vive nell'esperimento futuro. Vedi nota
// sopra ResolveResult.
// ============================================================
import { FishSpecies, FISH_SPECIES } from "./model/fish";
import { RealCard } from "./cards/real-deck";

export type Bank = Partial<Record<FishSpecies, number>>;

// conflictObserved NON vive qui. "Questo stato è conflittuale" (l'insieme dei
// contratti completati dipende dall'ordine?) è una proprietà dello STATO e del
// MAZZO, non di questa policy. Definirla dentro resolveContracts la legherebbe
// alla policy "ordine della mano": cambiando policy, cambierebbe la misura —
// e siccome la misura serve proprio a decidere se cambiare policy, sarebbe
// circolare. Verificato empiricamente (20000 stati): la def. procedurale e
// quella di dominio coincidono OGGI, ma solo perché la policy è questa. La
// proprietà di dominio vive nell'esperimento (commit futuro), che la calcola
// confrontando gli esiti di più ordini sullo stesso stato.
export interface ResolveResult {
  completed: RealCard[];            // i contratti completati, nell'ordine in cui sono stati completati
  remainingHand: RealCard[];        // le carte non completate (restano in mano)
  bankAfter: Bank;                  // il Banco dopo aver consumato i pesci dei contratti completati
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

  for (let i = 0; i < hand.length; i++) {
    const card = hand[i];
    if (canComplete(currentBank, card.requirements)) {
      currentBank = consume(currentBank, card.requirements);
      completed.push(card);
    } else {
      remaining.push(card);
    }
  }

  // normalizza il banco (niente chiavi a 0 sparse, per confronti puliti)
  const bankAfter: Bank = {};
  for (const sp of FISH_SPECIES) if ((currentBank[sp] ?? 0) > 0) bankAfter[sp] = currentBank[sp];

  return { completed, remainingHand: remaining, bankAfter };
}
