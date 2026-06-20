// ============================================================
// examples/tictactoe — IL TEST DEFINITIVO DEL PRINCIPIO #7
// Un gioco completamente diverso da Pescaria e Coin: niente risorse,
// niente aste, niente casualità. Ha però due cose nuove: un TURNO
// alternato e una CONDIZIONE DI VITTORIA (stato terminale).
//
// La domanda: entra toccando ZERO righe del framework?
// Se sì, il framework è davvero separato dal dominio.
// Se serve modificare Core/Session, il framework era ancora "di Pescaria".
// ============================================================
import { System, GameState, GameEvent, Intent, EventDraft } from "../../packages/core/types";

const NS = "ttt";
const LINES = [
  [0,1,2],[3,4,5],[6,7,8], // righe
  [0,3,6],[1,4,7],[2,5,8], // colonne
  [0,4,8],[2,4,6],         // diagonali
];

interface Board { cells: (string | null)[]; turn: "X" | "O"; winner: string | null; }
function board(state: GameState): Board {
  return (state.entities["__ttt__"] as Board | undefined)
    ?? { cells: Array(9).fill(null), turn: "X", winner: null };
}
function winnerOf(cells: (string | null)[]): string | null {
  for (const [a,b,c] of LINES) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) return cells[a]!;
  }
  return null;
}

export const TicTacToeSystem: System = {
  namespace: NS,

  handles(type: string): boolean {
    return type === "ttt.mark" || type === "ttt.marked" || type === "ttt.won";
  },

  validate(state: GameState, intent: Intent): string | null {
    if (intent.type !== "ttt.mark") return `TTT handles only ttt.mark`;
    const b = board(state);
    if (b.winner) return `game already won by ${b.winner}`;
    const cell = intent.payload.cell;
    if (typeof cell !== "number" || cell < 0 || cell > 8) return "cell must be 0..8";
    if (b.cells[cell] !== null) return `cell ${cell} is already taken`;
    const player = intent.payload.player;
    if (player !== b.turn) return `not your turn: it's ${b.turn}'s move`;
    return null;
  },

  reduce(state: GameState, intent: Intent): EventDraft[] {
    const b = board(state);
    const cell = intent.payload.cell as number;
    const mark = b.turn;
    const events: EventDraft[] = [
      { type: "ttt.marked", producer: NS, payload: { cell, mark } },
    ];
    // simuliamo la board dopo la mossa per decidere se c'è vittoria
    const after = [...b.cells]; after[cell] = mark;
    const w = winnerOf(after);
    if (w) events.push({ type: "ttt.won", producer: NS, payload: { winner: w } });
    return events;
  },

  apply(state: GameState, event: GameEvent): GameState {
    const b = board(state);
    if (event.type === "ttt.marked") {
      const cells = [...b.cells];
      cells[event.payload.cell as number] = event.payload.mark as string;
      return {
        ...state,
        entities: { ...state.entities, __ttt__: { cells, turn: b.turn === "X" ? "O" : "X", winner: b.winner } },
      };
    }
    if (event.type === "ttt.won") {
      return {
        ...state,
        entities: { ...state.entities, __ttt__: { ...b, winner: event.payload.winner } },
      };
    }
    return state;
  },
};
