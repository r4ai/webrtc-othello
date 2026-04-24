export const BOARD_SIZE = 8;

export type Player = "black" | "white";
export type Cell = Player | null;

export interface Move {
  row: number;
  col: number;
}

export type Board = Cell[][];

export type Winner = Player | "draw";
export type GameStatus = "playing" | "finished";
export type PlayerRole = "host" | "guest";
export type MatchConnectionState =
  | "idle"
  | "code-ready"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed";

export interface GameState {
  board: Board;
  currentPlayer: Player;
  validMoves: Move[];
  consecutivePasses: number;
  status: GameStatus;
  winner: Winner | null;
}
