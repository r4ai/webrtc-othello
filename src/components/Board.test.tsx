import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vite-plus/test";
import { createInitialGameState } from "../game/game";
import { Board } from "./Board";

describe("Board", () => {
  test("renders 64 cells and 4 opening hints", () => {
    const state = createInitialGameState();

    render(
      <Board
        board={state.board}
        validMoves={state.validMoves}
        interactive={true}
        onMove={() => {}}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(64);
    expect(screen.getAllByTestId("move-hint")).toHaveLength(4);
  });

  test("invokes callback when a valid cell is selected", async () => {
    const state = createInitialGameState();
    const onMove = vi.fn();
    const user = userEvent.setup();

    render(
      <Board
        board={state.board}
        validMoves={state.validMoves}
        interactive={true}
        onMove={onMove}
      />,
    );

    await user.click(screen.getByLabelText("3行4列 置けます"));

    expect(onMove).toHaveBeenCalledWith({ row: 2, col: 3 });
  });

  test("hides move hints while the board is not interactive", () => {
    const state = createInitialGameState();

    render(
      <Board
        board={state.board}
        validMoves={state.validMoves}
        interactive={false}
        onMove={() => {}}
      />,
    );

    expect(screen.queryByTestId("move-hint")).not.toBeInTheDocument();
    expect(screen.getByLabelText("3行4列 空きマス")).toBeDisabled();
  });
});
