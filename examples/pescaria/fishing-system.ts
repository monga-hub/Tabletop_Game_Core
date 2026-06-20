// ============================================================
// examples/pescaria/fishing-system.ts — 0033: Pesca dei pesci
//
// Struttura della partita -> V1: Setup -> Pesca -> Draft -> Aste -> Mercato
// -> Bilancia -> Nuova giornata. Questo commit implementa SOLO la Pesca.
//
// Decisione di dominio (confermata): tutti i pesci pescati vanno nell'Area
// di Stoccaggio CONDIVISA, divisi per specie. Nessuna distinzione per
// giocatore in questa fase — la destinazione individuale (Banco) non
// esiste ancora in questo commit.
//
// Deliberatamente "stupido", come il Contratto S0: nessuna scelta
// dell'agente, nessun timing, un solo evento derivato. Non c'è
// legalIntents perché nessun agente sceglie nulla qui: è una trasformazione
// di stato che accade una volta, scatenata da un solo Intent (come
// draft.start). Nessun aggancio alla fase del draft: i System non
// collaborano fra loro, collaborano i fatti (principio già stabilito per
// draft-pick-system.ts). L'orchestrazione "pesca poi draft poi..." è una
// domanda ancora aperta, non decisa oggi.
// ============================================================
import { System, GameState, GameEvent, Intent, EventDraft } from "../../packages/core/types";
import { Bag, FishSpecies, FISH_SPECIES, standardBag, emptyTally } from "./model/fish";

const NS = "pescaria";

function nextRng(rngState: number): { value: number; next: number } {
  let s = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, next: s };
}

function bagTotal(bag: Bag): number {
  return FISH_SPECIES.reduce((sum, sp) => sum + bag[sp], 0);
}

// Pesca senza reimbussolamento: ogni gettone estratto lascia il sacchetto.
function drawWithoutReplacement(
  bag: Bag,
  count: number,
  rngState: number,
): { drawn: Record<FishSpecies, number>; bagAfter: Bag; rngAfter: number } {
  const pool: FishSpecies[] = [];
  for (const sp of FISH_SPECIES) for (let i = 0; i < bag[sp]; i++) pool.push(sp);

  const drawn = emptyTally();
  let state = rngState;
  for (let i = 0; i < count; i++) {
    const r = nextRng(state); state = r.next;
    const idx = Math.floor(r.value * pool.length);
    const species = pool[idx];
    drawn[species]++;
    pool.splice(idx, 1);
  }

  const bagAfter: Bag = { ...bag };
  for (const sp of FISH_SPECIES) bagAfter[sp] -= drawn[sp];
  return { drawn, bagAfter, rngAfter: state };
}

export const PescariaFishingSystem: System = {
  namespace: NS,

  handles(type: string): boolean {
    return type === "pescaria.fishing.draw" || type === "pescaria.fishing.drawn";
  },

  validate(state: GameState, intent: Intent): string | null {
    if (intent.type !== "pescaria.fishing.draw") return "handles only fishing.draw";
    const players = intent.payload.players;
    if (!Array.isArray(players) || players.length < 1) return "fishing.draw requires at least 1 player";
    const bag = (intent.payload.bag as Bag | undefined) ?? standardBag();
    const need = players.length * 6;
    const have = bagTotal(bag);
    if (need > have) return `not enough fish in the bag: need ${need}, have ${have}`;
    return null;
  },

  reduce(state: GameState, intent: Intent): EventDraft[] {
    const players = intent.payload.players as string[];
    const bag = (intent.payload.bag as Bag | undefined) ?? standardBag();
    const need = players.length * 6;
    const { drawn, bagAfter, rngAfter } = drawWithoutReplacement(bag, need, state.rngState);
    return [
      { type: "pescaria.fishing.drawn", producer: NS, payload: { drawn, bagAfter, rngAfter, playerCount: players.length } },
    ];
  },

  apply(state: GameState, event: GameEvent): GameState {
    if (event.type === "pescaria.fishing.drawn") {
      return {
        ...state,
        rngState: event.payload.rngAfter as number,
        entities: {
          ...state.entities,
          __stoccaggio__: event.payload.drawn as Record<string, unknown>,
          __bag__: event.payload.bagAfter as Record<string, unknown>,
        },
      };
    }
    return state;
  },
  // Nessun legalIntents: nessun agente scelta qui. La pesca è un fatto che
  // accade, non una decisione di un giocatore (coerente con la descrizione:
  // "nessuna scelta del giocatore").
};
