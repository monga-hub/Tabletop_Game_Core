// ============================================================
// @framework/session — la Session
// Il contenitore di una partita: EventLog (la verità), RNG seedato,
// System attivi, Projection, cache di stato.
// Non conosce nessun gioco. Orchestra; non decide le regole.
// ============================================================
import {
  GameEvent, GameState, Intent, System, Projection, EventDraft, EMPTY_STATE,
} from "../core/types";

export interface SubmitResult {
  readonly accepted: boolean;
  readonly reason?: string;          // se rifiutato
  readonly emitted: readonly GameEvent[]; // eventi prodotti (incluso il rifiuto)
}

export class Session {
  private log: GameEvent[] = [];
  private nextId = 1;
  private state: GameState;
  private readonly systems: System[];
  private readonly projections: Projection<unknown>[];

  constructor(opts: {
    systems: System[];
    projections?: Projection<unknown>[];
    seed?: number;
    initialState?: GameState;
  }) {
    this.systems = opts.systems;
    this.projections = opts.projections ?? [];
    this.state = opts.initialState
      ? opts.initialState
      : { ...EMPTY_STATE, rngState: opts.seed ?? 0 };
  }

  /** Il log è la verità. Esposto in sola lettura. */
  getLog(): readonly GameEvent[] {
    return this.log;
  }

  /** Lo stato è una cache della proiezione del log. */
  getState(): GameState {
    return this.state;
  }

  /**
   * Il ciclo del motore.
   * Intent → validate (dai System) → emit Event → apply → osservano le Projection.
   * Un Intent rifiutato è anch'esso un fatto: va nel log come core.intent.rejected.
   */
  submit(intent: Intent): SubmitResult {
    const system = this.systems.find((s) => s.handles(intent.type));
    if (!system) {
      const ev = this.commit({
        type: "core.intent.rejected",
        producer: "engine",
        payload: { intent: intent.type, reason: "no system handles this intent" },
      }, null);
      return { accepted: false, reason: "no system", emitted: [ev] };
    }

    const reason = system.validate(this.state, intent);
    if (reason !== null) {
      const ev = this.commit({
        type: "core.intent.rejected",
        producer: "engine",
        payload: { intent: intent.type, reason },
      }, null);
      return { accepted: false, reason, emitted: [ev] };
    }

    // Intent valido: il System produce i draft; il motore assegna id/causedBy.
    // L'Intent originario entra nel log come evento radice (causedBy = null);
    // le conseguenze puntano ad esso.
    const intentEvent = this.commit({
      type: intent.type,
      producer: intent.agentId,
      payload: intent.payload,
    }, null);

    const drafts: EventDraft[] = system.reduce(this.state, intent);
    const emitted: GameEvent[] = [intentEvent];
    for (const d of drafts) {
      emitted.push(this.commit(d, intentEvent.id));
    }
    return { accepted: true, emitted };
  }

  /** Assegna id, registra nel log, applica allo stato, notifica le projection. */
  private commit(draft: EventDraft, causedBy: number | null): GameEvent {
    const event: GameEvent = {
      id: this.nextId++,
      type: draft.type,
      producer: draft.producer,
      causedBy,
      payload: draft.payload,
    };
    this.log.push(event);
    // apply tramite il system che gestisce questo tipo (se esiste); gli eventi
    // core.* senza system non mutano lo stato di dominio.
    const sys = this.systems.find((s) => s.handles(event.type));
    if (sys) this.state = sys.apply(this.state, event);
    for (const p of this.projections) p.observe(event);
    return event;
  }

  /**
   * Ricostruisce lo stato da zero rigiocando un log con gli stessi system.
   * Questa è la definizione operativa di "stato = fold(apply, eventi)".
   * Usata dal test fondante Replay == Stato.
   */
  static replay(log: readonly GameEvent[], systems: System[], seed = 0): GameState {
    let state: GameState = { ...EMPTY_STATE, rngState: seed };
    for (const event of log) {
      const sys = systems.find((s) => s.handles(event.type));
      if (sys) state = sys.apply(state, event);
    }
    return state;
  }
}
