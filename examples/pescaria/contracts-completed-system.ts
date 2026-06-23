// ============================================================
// examples/pescaria/contracts-completed-system.ts — Commit B
//
// INTEGRAZIONE ARCHITETTURALE (non causale) del verbo "completare i
// contratti". Porta resolveContracts() dentro l'architettura event-sourced:
// eventi, apply, replay. NON lo collega ancora all'inizio della partita —
// quella e' l'integrazione CAUSALE, che arrivera' col draft reale.
//
// Pipeline del DOMINIO REALE (oggi corta, parte piu' avanti — non finta):
//
//   realhand.created  (una mano di RealCard + un Banco entrano nello stato)
//          │
//          ▼
//   contracts.resolve  (intent) -> contracts.completed  (evento)
//
// Domani, davanti a questa, comparira' la fine dell'asta e la creazione della
// mano reale dal draft reale. Quando accadra', QUESTO System non cambia:
// cambia solo CHI produce realhand.created. Se dovesse cambiare, il confine
// era sbagliato.
//
// Resta separato dall'albero sintetico (sampleDeck -> draft -> agenti). I due
// filoni condividono il framework, non ancora gli eventi iniziali. Il punto
// di unione NON va progettato ora: emergera' (o no) col draft reale.
// ============================================================
import { System, GameState, GameEvent, Intent, EventDraft } from "../../packages/core/types";
import { RealCard } from "./cards/real-deck";
import { resolveContracts, Bank } from "./resolve-contracts";

const NS = "pescaria";

interface RealHandState {
  hand: RealCard[];
  bank: Bank;
}

function realHand(state: GameState): RealHandState | null {
  return (state.entities["__realHand__"] as RealHandState | undefined) ?? null;
}

export const PescariaContractsCompletedSystem: System = {
  namespace: NS,

  handles(type: string): boolean {
    return (
      type === "pescaria.realhand.created" ||
      type === "pescaria.contracts.resolve" ||
      type === "pescaria.contracts.completed"
    );
  },

  validate(state: GameState, intent: Intent): string | null {
    if (intent.type === "pescaria.realhand.created") {
      const hand = intent.payload.hand;
      const bank = intent.payload.bank;
      if (!Array.isArray(hand)) return "realhand.created requires a hand (RealCard[])";
      if (typeof bank !== "object" || bank === null) return "realhand.created requires a bank";
      return null;
    }
    if (intent.type === "pescaria.contracts.resolve") {
      if (!realHand(state)) return "no real hand: emit realhand.created first";
      return null;
    }
    return "unhandled intent";
  },

  reduce(state: GameState, intent: Intent): EventDraft[] {
    if (intent.type === "pescaria.realhand.created") {
      return [{
        type: "pescaria.realhand.created", producer: NS,
        payload: { hand: intent.payload.hand, bank: intent.payload.bank },
      }];
    }
    if (intent.type === "pescaria.contracts.resolve") {
      const rh = realHand(state)!;
      const cestaState = (state.entities["__cesta__"] as Bank | undefined) ?? {};
      const result = resolveContracts(rh.hand, rh.bank, cestaState);
      return [{
        type: "pescaria.contracts.completed", producer: NS,
        payload: {
          completed: result.completed,
          remainingHand: result.remainingHand,
          bankAfter: result.bankAfter,
          cestaAfter: result.cestaAfter,
        },
      }];
    }
    return [];
  },

  apply(state: GameState, event: GameEvent): GameState {
    if (event.type === "pescaria.realhand.created") {
      return {
        ...state,
        entities: {
          ...state.entities,
          __realHand__: {
            hand: event.payload.hand as RealCard[],
            bank: event.payload.bank as Bank,
          } as Record<string, unknown>,
        },
      };
    }
    if (event.type === "pescaria.contracts.completed") {
      const completed = event.payload.completed as RealCard[];
      const remainingHand = event.payload.remainingHand as RealCard[];
      const bankAfter = event.payload.bankAfter as Bank;
      const cestaAfter = event.payload.cestaAfter as Bank | undefined;
      return {
        ...state,
        entities: {
          ...state.entities,
          // il presente: la mano reale ora contiene solo le carte non completate,
          // e il banco e' quello dopo aver consumato i pesci dei contratti.
          __realHand__: { hand: remainingHand, bank: bankAfter } as Record<string, unknown>,
          // il residuo della trasformazione: i contratti completati.
          __completedContracts__: completed as unknown as Record<string, unknown>,
          // la Cesta dopo l'eventuale integrazione (invariata se il Banco bastava).
          ...(cestaAfter !== undefined ? { __cesta__: cestaAfter as Record<string, unknown> } : {}),
        },
      };
    }
    return state;
  },
  // Nessun legalIntents: completare non e' una scelta dell'agente (la scelta
  // vive nel Draft e nelle aste). Il completamento e' automatico.
};
