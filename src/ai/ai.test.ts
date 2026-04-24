import { describe, expect, test } from "vite-plus/test";
import type { Board } from "../game/types";
import { searchBestMove } from "./minimax";

function parseBoard(rows: string[]): Board {
  return rows.map((row) =>
    row.split("").map((cell) => {
      if (cell === "B") return "black";
      if (cell === "W") return "white";
      return null;
    }),
  );
}

describe("ai integration", () => {
  test("returns deterministic result for fixed board and depth", () => {
    const board = parseBoard([
      ".WBBBBBB",
      "WWWWWWWB",
      "BBBBBBBB",
      "BBBBBBBB",
      "BBBBBBBB",
      "BBBBBBBB",
      "BBBBBBBB",
      "BBBBBBB.",
    ]);

    const first = searchBestMove(board, "black", 4);
    const second = searchBestMove(board, "black", 4);

    expect(first).toEqual({ row: 0, col: 0 });
    expect(second).toEqual(first);
  });
});
