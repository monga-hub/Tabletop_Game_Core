// ============================================================
// examples/pescaria — il primo modulo di Pescaria
// NON tutto Pescaria. Un solo concetto: la NASCITA DI UNA FASE.
//
// draft.start introduce ciò che il Coin Game non aveva: una fase di gioco.
// È anche il primo intent che produce una CATENA di eventi (non uno solo):
//   draft.start  →  phase.changed  +  draft.created  +  player.order.generated
//
// La generazione dell'ordine giocatori è casuale, ma la casualità viene
// dall'RNG nello stato (determinismo): rigiocare il log dà lo stesso ordine.
//
// Ancora nessuna carta, nessun pesce, nessuna asta. Solo: il framework
// sa rappresentare l'inizio di una fase?
// ============================================================
import { System, GameState, GameEvent, Intent, EventDraft } from "../../packages/core/types";

const NS = "pescaria";

// RNG deterministico: stessa funzione del seed nello stato.
// Dato uno stato rngState, produce (valore, nuovoRngState). Puro.
function nextRng(rngState: number): { value: number; next: number } {
  // mulberry32, identico a quello della Session
  let s = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, next: s };
}

// mescola una lista in modo deterministico a partire da rngState.
// Ritorna la lista mescolata e il nuovo rngState. Puro: nessun Math.random.
function shuffleDeterministic<T>(items: readonly T[], rngState: number): { shuffled: T[]; next: number } {
  const arr = [...items];
  let state = rngState;
  for (let i = arr.length - 1; i > 0; i--) {
    const r = nextRng(state);
    state = r.next;
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
    if (intent.type !== "pescaria.draft.start") {
      return `PescariaDraftSystem does not handle intent ${intent.type}`;
    }
    const players = intent.payload.players;
    if (!Array.isArray(players) || players.length < 2) {
      return "draft.start requires at least 2 players";
    }
    if (!players.every((p) => typeof p === "string" && p.length > 0)) {
      return "draft.start: every player must be a non-empty id";
    }
    // non puoi iniziare un draft se una fase è già in corso
    const phase = (state.entities["__game__"] as { phase?: string } | undefined)?.phase;
    if (phase && phase !== "idle") {
      return `cannot start draft: a phase is already active (${phase})`;
    }
    return null;
  },

  reduce(state: GameState, intent: Intent): EventDraft[] {
    const players = intent.payload.players as string[];
    // L'ordine è deciso QUI, deterministicamente dallo stato. Ma nel payload
    // registriamo il FATTO (l'ordine deciso), non l'algoritmo né lo stato RNG.
    // Scelta architetturale: log AUTOSUFFICIENTE. Il replay legge l'ordine dal
    // log, non lo ricalcola. Così, se un domani cambiasse l'algoritmo di shuffle,
    // i log esistenti resterebbero validi: l'ordine è un fatto registrato, non
    // una simulazione da rieseguire.
    const { shuffled, next } = shuffleDeterministic(players, state.rngState);
    return [
      // NOTA: "phase" è un concetto candidato alla promozione nel Core.
      // Resta in pescaria.* finché un SECONDO gioco non avrà le fasi (principio #7).
      { type: "pescaria.phase.changed", producer: NS, payload: { from: "idle", to: "draft" } },
      { type: "pescaria.draft.created", producer: NS, payload: { players: [...players] } },
      // l'avanzamento dell'RNG (next) va nel payload SOLO perché apply deve
      // aggiornare lo stato RNG per il prossimo uso casuale — non per ricostruire
      // l'ordine, che è già un fatto qui sopra.
      { type: "pescaria.draft.order.decided", producer: NS, payload: { order: shuffled, rngAfter: next } },
    ];
  },

  apply(state: GameState, event: GameEvent): GameState {
    const game = (state.entities["__game__"] as Record<string, unknown> | undefined) ?? {};
    switch (event.type) {
      case "pescaria.phase.changed":
        return {
          ...state,
          entities: { ...state.entities, __game__: { ...game, phase: event.payload.to } },
        };
      case "pescaria.draft.created":
        return {
          ...state,
          entities: { ...state.entities, __game__: { ...game, draftPlayers: event.payload.players } },
        };
      case "pescaria.draft.order.decided":
        // applichiamo anche l'avanzamento dell'RNG: la casualità è parte dello stato
        return {
          ...state,
          rngState: event.payload.rngAfter as number,
          entities: { ...state.entities, __game__: { ...game, order: event.payload.order } },
        };
      default:
        return state; // l'intent stesso non muta lo stato
    }
  },
};
