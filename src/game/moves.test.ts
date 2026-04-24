import { describe, expect, test } from "vite-plus/test";
import { createEmptyBoard, createInitialBoard } from "./board";
import { applyMove, getFlipsForMove, getOpponent, getValidMoves, isValidMove } from "./moves";

describe("moves", () => {
  test("returns the opposing player", () => {
    expect(getOpponent("black")).toBe("white");
    expect(getOpponent("white")).toBe("black");
  });

  test("returns the four opening moves for black", () => {
    const board = createInitialBoard();

    expect(getValidMoves(board, "black")).toEqual([
      { row: 2, col: 3 },
      { row: 3, col: 2 },
      { row: 4, col: 5 },
      { row: 5, col: 4 },
    ]);
  });

  test("flips one direction from initial position", () => {
    const board = createInitialBoard();
    const next = applyMove(board, "black", { row: 2, col: 3 });

    expect(next[2][3]).toBe("black");
    expect(next[3][3]).toBe("black");
  });

  test("flips all 8 directions from a single move", () => {
    const board = createEmptyBoard();

    const opponentCells = [
      [2, 2],
      [2, 3],
      [2, 4],
      [3, 2],
      [3, 4],
      [4, 2],
      [4, 3],
      [4, 4],
    ];

    const anchorCells = [
      [1, 1],
      [1, 3],
      [1, 5],
      [3, 1],
      [3, 5],
      [5, 1],
      [5, 3],
      [5, 5],
    ];

    for (const [row, col] of opponentCells) {
      board[row][col] = "white";
    }

    for (const [row, col] of anchorCells) {
      board[row][col] = "black";
    }

    const next = applyMove(board, "black", { row: 3, col: 3 });

    for (const [row, col] of opponentCells) {
      expect(next[row][col]).toBe("black");
    }
  });

  test("supports corner captures", () => {
    const board = createEmptyBoard();
    board[0][1] = "white";
    board[0][2] = "black";

    expect(isValidMove(board, "black", { row: 0, col: 0 })).toBe(true);

    const next = applyMove(board, "black", { row: 0, col: 0 });
    expect(next[0][1]).toBe("black");
  });

  test("returns no flips for out-of-bounds or occupied cells", () => {
    const board = createInitialBoard();

    expect(getFlipsForMove(board, "black", { row: -1, col: 0 })).toEqual([]);
    expect(getFlipsForMove(board, "black", { row: 3, col: 3 })).toEqual([]);
  });

  test("returns no flips when a line is not enclosed by the current player", () => {
    const board = createEmptyBoard();
    board[3][4] = "white";

    expect(getFlipsForMove(board, "black", { row: 3, col: 3 })).toEqual([]);
    expect(isValidMove(board, "black", { row: 3, col: 3 })).toBe(false);
  });

  test("throws on invalid moves", () => {
    const board = createInitialBoard();

    expect(() => applyMove(board, "black", { row: 3, col: 3 })).toThrow();
    expect(() => applyMove(board, "black", { row: 0, col: 0 })).toThrow();
  });
});
