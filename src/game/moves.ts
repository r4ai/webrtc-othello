import { cloneBoard, isInsideBoard } from "./board";
import type { Board, Move, Player } from "./types";

const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

export function getOpponent(player: Player): Player {
  return player === "black" ? "white" : "black";
}

function collectDirectionFlips(
  board: Board,
  player: Player,
  move: Move,
  dRow: number,
  dCol: number,
): Move[] {
  const flips: Move[] = [];
  const opponent = getOpponent(player);

  let row = move.row + dRow;
  let col = move.col + dCol;

  while (isInsideBoard(row, col) && board[row][col] === opponent) {
    flips.push({ row, col });
    row += dRow;
    col += dCol;
  }

  if (flips.length === 0 || !isInsideBoard(row, col) || board[row][col] !== player) {
    return [];
  }

  return flips;
}

export function getFlipsForMove(board: Board, player: Player, move: Move): Move[] {
  if (!isInsideBoard(move.row, move.col) || board[move.row][move.col] !== null) {
    return [];
  }

  return DIRECTIONS.flatMap(([dRow, dCol]) =>
    collectDirectionFlips(board, player, move, dRow, dCol),
  );
}

export function isValidMove(board: Board, player: Player, move: Move): boolean {
  return getFlipsForMove(board, player, move).length > 0;
}

export function getValidMoves(board: Board, player: Player): Move[] {
  const moves: Move[] = [];

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const move = { row, col };
      if (isValidMove(board, player, move)) {
        moves.push(move);
      }
    }
  }

  return moves;
}

export function applyMove(board: Board, player: Player, move: Move): Board {
  const flips = getFlipsForMove(board, player, move);

  if (flips.length === 0) {
    throw new Error(`Invalid move (${move.row}, ${move.col}) for ${player}`);
  }

  const nextBoard = cloneBoard(board);
  nextBoard[move.row][move.col] = player;

  for (const flip of flips) {
    nextBoard[flip.row][flip.col] = player;
  }

  return nextBoard;
}
