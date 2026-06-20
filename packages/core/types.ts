// ============================================================
// @framework/core — tipi fondamentali
// Questo file non conosce nessun gioco. Se domani cancellassi
// Pescaria (o il Coin Game), questo file resterebbe identico.
// ============================================================

/** Un fatto accaduto. Immutabile. L'unità del log. */
export interface GameEvent {
  readonly id: number;          // univoco e strettamente crescente (invariante)
  readonly type: string;        // namespaced: "core.*", "economy.*", "coin.*", ...
  readonly producer: string;    // chi l'ha prodotto: un Agent (Intent) o un System
  readonly causedBy: number | null; // id dell'evento che l'ha generato, null se originario
  readonly payload: Readonly<Record<string, unknown>>;
}

/** Una richiesta di azione da parte di un Agent. Volontà, non fatto. Può essere rifiutata. */
export interface Intent {
  readonly type: string;        // namespaced
  readonly agentId: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

/** Identificatore di un oggetto del dominio. Solo un id. */
export type EntityId = string;

/**
 * Lo stato è una mappa di componenti per entità.
 * Il Core sa che esistono entità con componenti; NON sa cosa significhino.
 * Un Component è un sacchetto di dati interpretato da un modulo, mai dal Core.
 */
export interface GameState {
  readonly entities: Readonly<Record<EntityId, Readonly<Record<string, unknown>>>>;
  readonly rngState: number;    // la casualità è parte dello stato (determinismo)
}

export const EMPTY_STATE: GameState = Object.freeze({ entities: {}, rngState: 0 });

/**
 * Un System trasforma Intent in Event e definisce come gli Event mutano lo stato.
 * È l'UNICO posto dove vivono le regole. Due responsabilità, entrambe pure:
 *  - validate: l'Intent è ammissibile in questo stato?
 *  - reduce:   dato un Intent valido, quali Event emette? (NON muta lo stato)
 *  - apply:    dato un Event, qual è il nuovo stato? (puramente deterministico)
 * Il Core non sa cosa validano: lo sanno i moduli.
 */
export interface System {
  readonly namespace: string;   // es. "coin", "economy", "pescaria"
  /** true se questo system gestisce eventi/intent di quel tipo */
  handles(type: string): boolean;
  /** valida un Intent; ritorna null se valido, o una stringa col motivo del rifiuto */
  validate(state: GameState, intent: Intent): string | null;
  /** dato un Intent valido, produce gli Event conseguenti (payload, non id) */
  reduce(state: GameState, intent: Intent): EventDraft[];
  /** applica un singolo Event allo stato. DEVE essere puro e deterministico. */
  apply(state: GameState, event: GameEvent): GameState;
}

/** Un Event prima che il motore gli assegni id e causedBy. */
export interface EventDraft {
  readonly type: string;
  readonly producer: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

/**
 * Una Projection osserva il flusso degli Event e ne deriva una vista.
 * NON può scrivere: riceve eventi, aggiorna una propria struttura interna.
 * UI, Solver, Analytics, Replay, AI sono tutte Projection.
 */
export interface Projection<View> {
  readonly name: string;
  observe(event: GameEvent): void;
  view(): View;
}
