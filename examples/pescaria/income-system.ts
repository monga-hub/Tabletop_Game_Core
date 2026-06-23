// ============================================================
// examples/pescaria/income-system.ts — Incassare (Fase 4)
//
// Verbo del regolamento: "si riscuotono i Ducati relativi ai contratti
// completati. I pesci utilizzati per i contratti tornano nel Sacchetto."
//
// UN solo verbo, DUE effetti INSEPARABILI:
//   1. il giocatore ottiene i Ducati (somma dei reward dei contratti completati);
//   2. i pesci spesi per quei contratti tornano nel Sacchetto.
// Non sono due verbi: il ritorno del pesce non è un'azione autonoma del
// regolamento, è la coda dell'incasso. I pesci consumati non sono una risorsa
// "in viaggio" (come il lotto nell'acquisto, che aveva senso da solo): sono il
// COSTO del contratto, e il contratto non è concluso finché non si incassa.
//
// I Ducati entrano QUI come risorsa/stato (__ducati__). Non è un prerequisito
// esterno tipo auctionValue (un attributo che preesisteva): i Ducati nascono
// con questo verbo, perché è il primo punto in cui il regolamento li rende
// operativi. Introdurre un nuovo stato di dominio per implementare un verbo non
// è un argomento per spezzarlo: è il momento in cui quel pezzo di dominio entra.
//
// Trasformazione: __completedContracts__ (letto) -> __ducati__ (+) , __bag__
// (+pesci). NON consuma __completedContracts__: lo legge e lo lascia, perche'
// il verbo successivo (installazione migliorie, stessa Fase 4) deve leggere le
// stesse carte. Marca __incomeCollected__ per non re-incassare.
//
// Scope: pipeline del dominio reale, single-hand (come __realHand__). Nessun
// playerId: la struttura multi-giocatore non esiste ancora nella pipeline reale
// e questo verbo non la richiede. Entrerà con l'integrazione causale.
//
// NON entra: l'installazione delle migliorie (verbo successivo, stessa Fase 4);
// le rendite della Bilancia; il fatto che reward possa avere bonus da migliorie
// (nessuna miglioria è attiva). Qui reward è il valore nudo della carta.
// ============================================================
import { System, GameState, GameEvent, Intent, EventDraft } from "../../packages/core/types";
import { FishSpecies, FISH_SPECIES } from "./model/fish";
import { RealCard } from "./cards/real-deck";

const NS = "pescaria";

type Tally = Record<FishSpecies, number>;

function completedContracts(state: GameState): RealCard[] | null {
  return (state.entities["__completedContracts__"] as RealCard[] | undefined) ?? null;
}
function bag(state: GameState): Partial<Tally> {
  return (state.entities["__bag__"] as Partial<Tally> | undefined) ?? {};
}
function ducati(state: GameState): number {
  return (state.entities["__ducati__"] as number | undefined) ?? 0;
}

export const PescariaIncomeSystem: System = {
  namespace: NS,

  handles(type: string): boolean {
    return type === "pescaria.income.collect" || type === "pescaria.income.collected";
  },

  validate(state: GameState, intent: Intent): string | null {
    if (intent.type !== "pescaria.income.collect") return "handles only income.collect";
    const c = completedContracts(state);
    if (!c) return "no completed contracts: resolve contracts first";
    if (c.length === 0) return "no completed contracts to collect";
    if (state.entities["__incomeCollected__"] === true) return "income already collected for these contracts";
    return null;
  },

  reduce(state: GameState, intent: Intent): EventDraft[] {
    const completed = completedContracts(state)!;
    // effetto 1: Ducati = somma dei reward
    const earned = completed.reduce((sum, c) => sum + c.reward, 0);
    // effetto 2: i pesci spesi per quei contratti tornano nel sacchetto
    const returned: Partial<Tally> = {};
    for (const c of completed) {
      for (const sp of Object.keys(c.requirements) as FishSpecies[]) {
        returned[sp] = (returned[sp] ?? 0) + (c.requirements[sp] ?? 0);
      }
    }
    return [{
      type: "pescaria.income.collected", producer: NS,
      payload: { earned, returnedFish: returned, contractsCount: completed.length },
    }];
  },

  apply(state: GameState, event: GameEvent): GameState {
    if (event.type === "pescaria.income.collected") {
      const earned = event.payload.earned as number;
      const returned = event.payload.returnedFish as Partial<Tally>;
      const currentBag = bag(state);
      const newBag: Partial<Tally> = { ...currentBag };
      for (const sp of FISH_SPECIES) {
        const back = returned[sp] ?? 0;
        if (back > 0) newBag[sp] = (newBag[sp] ?? 0) + back;
      }
      return {
        ...state,
        entities: {
          ...state.entities,
          // __ducati__: SOLO il denaro/punteggio (regolamento: "denaro guadagnato
          // e punteggio finale"). NON il Ducato Influenza, che è una risorsa
          // DISTINTA generata dalla miglioria Esperienza, spendibile in asta.
          // Se un giorno l'Influenza entrera', sara' uno stato separato, non
          // questo.
          __ducati__: ducati(state) + earned,            // effetto 1: accredito
          __bag__: newBag as Record<string, unknown>,    // effetto 2: pesce restituito
          // __completedContracts__ NON viene azzerato: il verbo SUCCESSIVO
          // (installazione migliorie, stessa Fase 4) legge "ogni carta contratto
          // completata". Incasso e Migliorie consumano lo STESSO stato in
          // sequenza (regolamento Fase 4). Azzerarlo qui distruggerebbe lo stato
          // prima che l'installazione lo legga. Si marca solo che l'incasso e'
          // avvenuto, per non re-incassare.
          __incomeCollected__: true as unknown as Record<string, unknown>,
        },
      };
    }
    return state;
  },
  // Nessun legalIntents: incassare non è una scelta. Tutti i contratti
  // completati vengono incassati (il regolamento non prevede di rinunciarvi).
};
