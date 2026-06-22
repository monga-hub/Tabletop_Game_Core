// ============================================================
// examples/pescaria/purchase-system.ts — 0036: acquisto (movimento del lotto)
//
// Trasformazione: __auctionRanking__ + __stoccaggio__ -> __banks__.
// Il vincitore dell'asta (primo in classifica) trasferisce il lotto dal
// mercato (stoccaggio condiviso) al proprio Banco.
//
// Cosa entra (cambia il risultato di questa trasformazione):
//  - chi e' il vincitore (primo in __auctionRanking__.ranking);
//  - il pesce nel lotto (__stoccaggio__) si sposta sul Banco del vincitore;
//  - lo stoccaggio si svuota.
//
// Cosa NON entra (trasformazioni successive — vedi README di dominio):
//  - i Ducati come risorsa e il pagamento (1 Ducato/pezzo): il MOVIMENTO del
//    pesce e' un fatto distinto dal PAGAMENTO, come il rilancio era distinto
//    dalla determinazione del vincitore;
//  - la scelta di "quanti pesci desidera" (regolamento): introdurrebbe un
//    Intent e una decisione degli agenti congelati. Semplificazione
//    diagnostica DICHIARATA: il vincitore prende TUTTO il lotto (come la V1
//    "il vincitore prende tutto"). Sostituibile quando la scelta sara'
//    inevitabile, senza toccare nulla d'altro;
//  - gli acquisti di secondo, terzo... classificato (a 2 Ducati);
//  - la capienza del Banco (max 6): nessun limite applicato oggi, perche'
//    senza Ducati/scelta non c'e' ancora pressione sul Banco;
//  - il passaggio del segnalino Primo Giocatore al vincitore;
//  - gli scarti di fine fase.
//
// Semplificazione sul "lotto": il regolamento 2026 ha un'asta per tipologia
// (5 aste). Il simulatore non ha ancora la nozione di asta-per-specie:
// __stoccaggio__ e' tutto il pesce pescato insieme, __auctionRanking__ e' una
// classifica unica. Quindi "il lotto" qui = tutto lo stoccaggio. E' coerente
// con lo stato attuale del simulatore, non con la struttura a 5 aste: quella
// e' una trasformazione successiva.
// ============================================================
import { System, GameState, GameEvent, Intent, EventDraft } from "../../packages/core/types";
import { FishSpecies, FISH_SPECIES, emptyTally } from "./model/fish";

const NS = "pescaria";

type Tally = Record<FishSpecies, number>;

function ranking(state: GameState): string[] | null {
  const r = state.entities["__auctionRanking__"] as { ranking?: string[] } | undefined;
  return r?.ranking ?? null;
}
function stoccaggio(state: GameState): Tally | null {
  return (state.entities["__stoccaggio__"] as Tally | undefined) ?? null;
}
function banks(state: GameState): Record<string, Tally> {
  return (state.entities["__banks__"] as Record<string, Tally> | undefined) ?? {};
}

export const PescariaPurchaseSystem: System = {
  namespace: NS,

  handles(type: string): boolean {
    return type === "pescaria.purchase.take" || type === "pescaria.purchase.taken";
  },

  validate(state: GameState, intent: Intent): string | null {
    if (intent.type !== "pescaria.purchase.take") return "handles only purchase.take";
    const r = ranking(state);
    if (!r || r.length === 0) return "no auction ranking: resolve the auction first";
    if (!stoccaggio(state)) return "no stoccaggio to take from";
    return null;
  },

  reduce(state: GameState, intent: Intent): EventDraft[] {
    const winner = ranking(state)![0];
    const lot = stoccaggio(state)!;
    // il vincitore prende TUTTO il lotto (semplificazione diagnostica).
    return [{ type: "pescaria.purchase.taken", producer: NS, payload: { winner, lot } }];
  },

  apply(state: GameState, event: GameEvent): GameState {
    if (event.type === "pescaria.purchase.taken") {
      const winner = event.payload.winner as string;
      const lot = event.payload.lot as Tally;
      const currentBanks = banks(state);
      const winnerBank = currentBanks[winner] ?? emptyTally();
      const newBank = { ...winnerBank };
      for (const sp of FISH_SPECIES) newBank[sp] += lot[sp];
      return {
        ...state,
        entities: {
          ...state.entities,
          __banks__: { ...currentBanks, [winner]: newBank },
          __stoccaggio__: emptyTally() as Record<string, unknown>, // il lotto e' stato preso
        },
      };
    }
    return state;
  },
  // Nessun legalIntents: l'acquisto minimo non e' una scelta dell'agente (il
  // vincitore prende tutto). Diventera' una scelta quando il "quanti desidera"
  // entrera' — non oggi.
};
