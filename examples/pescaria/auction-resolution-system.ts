// ============================================================
// examples/pescaria/auction-resolution-system.ts — 0035: risoluzione asta
//
// Trasformazione: __offers__ + __draft__.order -> __auctionRanking__.
// Determina la classifica completa di un'asta a partire dalle offerte.
//
// Cosa entra (cambia chi vince e in che ordine — regolamento cap. "Aste"):
//  - il Valore d'Asta (auctionValue) della carta offerta;
//  - "vince il valore totale più alto";
//  - pareggi: "vince chi è più avanti nell'ordine partendo dal Primo
//    Giocatore" -> ordine ciclico da order[0];
//  - la classifica COMPLETA, non solo il vincitore: il regolamento dice che
//    anche secondo, terzo... acquistano, nell'ordine di classifica.
//
// Cosa NON entra (non cambia QUESTA trasformazione — vedi README di dominio):
//  - rilancio in Ducati: nessun agente puo' rilanciare, il termine vale 0 per
//    tutti, quindi "valore totale" si riduce al solo Valore d'Asta. I Ducati
//    come risorsa non esistono ancora nel simulatore.
//  - bonus Esperienza: miglioria non implementata.
//  - l'acquisto del pesce (1 vs 2 Ducati) e il passaggio del segnalino Primo
//    Giocatore: sono le trasformazioni SUCCESSIVE. Il segnalino entrera' nello
//    stato solo nel commit in cui dovra' cambiare (seconda asta). Per la prima
//    asta della giornata il Primo Giocatore e' ancora quello iniziale, e
//    __draft__.order — che parte da lui — lo rappresenta gia'.
// ============================================================
import { System, GameState, GameEvent, Intent, EventDraft } from "../../packages/core/types";
import { Card, CardId } from "./model/card";

const NS = "pescaria";

interface DraftState { order: string[]; }

function draftOrder(state: GameState): string[] | null {
  const d = state.entities["__draft__"] as DraftState | undefined;
  return d?.order ?? null;
}
function offers(state: GameState): Record<string, CardId> | null {
  return (state.entities["__offers__"] as Record<string, CardId> | undefined) ?? null;
}
function registry(state: GameState): Card[] {
  const d = state.entities["__draft__"] as { registry?: Card[] } | undefined;
  return d?.registry ?? [];
}

export const PescariaAuctionResolutionSystem: System = {
  namespace: NS,

  handles(type: string): boolean {
    return type === "pescaria.auction.resolve" || type === "pescaria.auction.resolved";
  },

  validate(state: GameState, intent: Intent): string | null {
    if (intent.type !== "pescaria.auction.resolve") return "handles only auction.resolve";
    const order = draftOrder(state);
    if (!order) return "no draft order available";
    const o = offers(state);
    if (!o) return "no offers to resolve";
    // ogni giocatore che partecipa deve avere un'offerta. Il regolamento prevede
    // il "passo", ma nel simulatore attuale offer-system fa offrire tutti: la
    // risoluzione richiede almeno un'offerta. Chi non ha offerto non e' in
    // classifica (modellato sotto), non e' un errore.
    if (Object.keys(o).length === 0) return "no offers to resolve";
    return null;
  },

  reduce(state: GameState, intent: Intent): EventDraft[] {
    const order = draftOrder(state)!;
    const o = offers(state)!;
    const reg = registry(state);
    const valueOf = (cardId: CardId) => reg.find((c) => c.id === cardId)?.auctionValue ?? 0;

    // posizione nell'ordine ciclico partendo da order[0] (Primo Giocatore della
    // prima asta): chi e' piu' avanti vince i pari. order[0] ha priorita' 0.
    const turnIndex = new Map(order.map((p, i) => [p, i] as const));

    // solo i giocatori che hanno offerto entrano in classifica.
    const participants = order.filter((p) => o[p] !== undefined);

    const ranking = [...participants].sort((a, b) => {
      const va = valueOf(o[a]);
      const vb = valueOf(o[b]);
      if (vb !== va) return vb - va;                       // valore piu' alto prima
      return (turnIndex.get(a)! - turnIndex.get(b)!);        // pari: piu' avanti nell'ordine
    });

    const detail = ranking.map((p) => ({ player: p, card: o[p], value: valueOf(o[p]) }));
    return [{ type: "pescaria.auction.resolved", producer: NS, payload: { ranking, detail } }];
  },

  apply(state: GameState, event: GameEvent): GameState {
    if (event.type === "pescaria.auction.resolved") {
      return {
        ...state,
        entities: {
          ...state.entities,
          __auctionRanking__: {
            ranking: event.payload.ranking as string[],
            detail: event.payload.detail as unknown,
          } as Record<string, unknown>,
        },
      };
    }
    return state;
  },
  // Nessun legalIntents: la risoluzione non e' una scelta di un agente, e' una
  // funzione delle offerte gia' fatte (come la pesca in 0033).
};
