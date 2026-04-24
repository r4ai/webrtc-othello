import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import { createGameState, createInitialGameState } from "../game/game";
import type { Board } from "../game/types";
import { useGame } from "./useGame";

function parseBoard(rows: string[]): Board {
  return rows.map((row) =>
    row.split("").map((cell) => {
      if (cell === "B") return "black";
      if (cell === "W") return "white";
      return null;
    }),
  );
}

describe("useGame", () => {
  test("exposes initial state and score", () => {
    const { result } = renderHook(() => useGame());

    expect(result.current.state.currentPlayer).toBe("black");
    expect(result.current.score).toEqual({ black: 2, white: 2 });
  });

  test("applies legal move and switches player", () => {
    const { result } = renderHook(() => useGame());

    act(() => {
      result.current.playMove({ row: 2, col: 3 });
    });

    expect(result.current.state.currentPlayer).toBe("white");
    expect(result.current.state.board[3][3]).toBe("black");
  });

  test("ignores illegal move", () => {
    const { result } = renderHook(() => useGame());

    const before = result.current.state;

    act(() => {
      result.current.playMove({ row: 0, col: 0 });
    });

    expect(result.current.state).toBe(before);
  });

  test("ignores moves after the game has finished", () => {
    const board = parseBoard([
      "BBBBBBBB",
      "BBBBBBBB",
      "BBBBBBBB",
      "BBBBBBBB",
      "BBBBBBBB",
      "BBBBBBBB",
      "BBBBBBBB",
      "BBBBBBBB",
    ]);

    const finishedState = createGameState(board, "white");
    const { result } = renderHook(() => useGame(finishedState));

    act(() => {
      result.current.playMove({ row: 0, col: 0 });
    });

    expect(result.current.state).toBe(finishedState);
  });

  test("passes when no moves exist", () => {
    const board = parseBoard([
      ".BWWWWWW",
      "WWWWWWWW",
      "WWWWWWWW",
      "WWWWWWWW",
      "WWWWWWWW",
      "WWWWWWWW",
      "WWWWWWWW",
      "WWWWWWWW",
    ]);

    const initialState = createGameState(board, "black");
    const { result } = renderHook(() => useGame(initialState));

    act(() => {
      result.current.passTurn();
    });

    expect(result.current.state.currentPlayer).toBe("white");
    expect(result.current.state.validMoves).toEqual([{ row: 0, col: 0 }]);
  });

  test("ignores pass while legal moves still exist", () => {
    const { result } = renderHook(() => useGame());
    const before = result.current.state;

    act(() => {
      result.current.passTurn();
    });

    expect(result.current.state).toBe(before);
  });

  test("ignores pass after the game has finished", () => {
    const board = parseBoard([
      "BBBBBBBB",
      "BBBBBBBB",
      "BBBBBBBB",
      "BBBBBBBB",
      "BBBBBBBB",
      "BBBBBBBB",
      "BBBBBBBB",
      "BBBBBBBB",
    ]);

    const finishedState = createGameState(board, "white");
    const { result } = renderHook(() => useGame(finishedState));

    act(() => {
      result.current.passTurn();
    });

    expect(result.current.state).toBe(finishedState);
  });

  test("resets to initial game state", () => {
    const { result } = renderHook(() => useGame());

    act(() => {
      result.current.playMove({ row: 2, col: 3 });
    });
    act(() => {
      result.current.resetGame();
    });

    expect(result.current.state).toEqual(createInitialGameState());
  });
});
