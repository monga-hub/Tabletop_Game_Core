// ============================================================
// examples/pescaria — draft.start (nascita di una fase) + creazione draft
// draft.start ora crea ANCHE lo stato del draft (ordine + carte) VIA EVENTO,
// così il draft nasce dal LOG e non da uno stato iniettato. È la correzione
// del primo bug serio: il replay deve poter ricostruire tutto dal log.
//
// La catena: draft.start -> phase.changed + draft.created + draft.order.decided
// dove draft.created porta le carte disponibili nel payload.
// ============================================================
import { System, GameState, GameEvent, Intent, EventDraft } from "../../packages/core/types";

const NS = "pescaria";

function nextRng(rngState: number): { value: number; next: number } {
  let s = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, next: s };
}
function shuffleDeterministic<T>(items: readonly T[], rngState: number): { shuffled: T[]; next: number } {
  const arr = [...items];
  let state = rngState;
  for (let i = arr.length - 1; i > 0; i--) {
    const r = nextRng(state); state = r.next;
    const j = Math.floor(r.value * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return { shuffled: arr, next: state };
}

export const PescariaDraftSystem: System = {
  namespace: NS,

  handles(type: string): boolean {
    return type === "pescaria.draft.start"
        || type === "pescaria.phase.changed"
        || type === "pescaria.draft.created"
        || type === "pescaria.draft.order.decided";
  },

  validate(state: GameState, intent: Intent): string | null {
    if (intent.type !== "pescaria.draft.start") return `handles only draft.start`;
    const players = intent.payload.players;
    if (!Array.isArray(players) || players.length < 2) return "draft.start requires at least 2 players";
    if (!players.every((p) => typeof p === "string" && p.length > 0)) return "draft.start: non-empty player ids";
    const cards = intent.payload.cards;
    if (!Array.isArray(cards) || cards.length < 1) return "draft.start requires a non-empty card pool";
    const phase = (state.entities["__game__"] as { phase?: string } | undefined)?.phase;
    if (phase && phase !== "idle") return `cannot start draft: phase already active (${phase})`;
    return null;
  },

  reduce(state: GameState, intent: Intent): EventDraft[] {
    const players = intent.payload.players as string[];
    const cards = intent.payload.cards as string[];
    const { shuffled, next } = shuffleDeterministic(players, state.rngState);
    return [
      // "phase" candidata alla promozione nel Core (ora esiste anche in TTT: stato terminale).
      { type: "pescaria.phase.changed", producer: NS, payload: { from: "idle", to: "draft" } },
      // draft.created porta TUTTO ciò che serve a ricostruire il draft dal log:
      // ordine giocatori e carte disponibili. Niente stato iniettato da fuori.
      { type: "pescaria.draft.order.decided", producer: NS, payload: { order: shuffled, rngAfter: next } },
      { type: "pescaria.draft.created", producer: NS, payload: { order: shuffled, cards: [...cards] } },
    ];
  },

  apply(state: GameState, event: GameEvent): GameState {
    const game = (state.entities["__game__"] as Record<string, unknown> | undefined) ?? {};
    switch (event.type) {
      case "pescaria.phase.changed":
        return { ...state, entities: { ...state.entities, __game__: { ...game, phase: event.payload.to } } };
      case "pescaria.draft.order.decided":
        return { ...state, rngState: event.payload.rngAfter as number,
          entities: { ...state.entities, __game__: { ...game, order: event.payload.order } } };
      case "pescaria.draft.created":
        // crea lo stato del draft DAL LOG: questo è ciò che il replay ricostruisce
        return { ...state, entities: { ...state.entities,
          __draft__: {
            order: event.payload.order, currentPlayer: 0,
            availableCards: event.payload.cards, pickedCards: {},
          } as unknown as Record<string, unknown> } };
      default:
        return state;
    }
  },
};
