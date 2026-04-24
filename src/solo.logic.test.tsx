import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import type { Move } from "./game/types";
import App from "./App";

let gameHookValue: {
  state: {
    board: null[][];
    currentPlayer: "black" | "white";
    validMoves: Move[];
    consecutivePasses: number;
    status: "playing" | "finished";
    winner: "black" | "white" | "draw" | null;
  };
  score: { black: number; white: number };
  playMove: ReturnType<typeof vi.fn>;
  passTurn: ReturnType<typeof vi.fn>;
  resetGame: ReturnType<typeof vi.fn>;
};

let latestUseAIOptions:
  | {
      enabled: boolean;
      aiPlayer: "white";
      state: unknown;
      onResolveMove: (move: Move | null) => void;
      depth: number;
      delayMs: number;
    }
  | undefined;

vi.mock("./effects/useGame", () => ({
  useGame: () => gameHookValue,
}));

vi.mock("./effects/useAI", () => ({
  useAI: (options: typeof latestUseAIOptions) => {
    latestUseAIOptions = options;
  },
}));

vi.mock("./components/Board", () => ({
  Board: ({ interactive, onMove }: { interactive: boolean; onMove: (move: Move) => void }) => (
    <button type="button" disabled={!interactive} onClick={() => onMove({ row: 2, col: 3 })}>
      board
    </button>
  ),
}));

vi.mock("./ui/Button", () => ({
  Button: ({
    children,
    isDisabled,
    onPress,
  }: {
    children: string;
    isDisabled?: boolean;
    onPress?: () => void;
  }) => (
    <button type="button" disabled={isDisabled} onClick={onPress}>
      {children}
    </button>
  ),
}));

vi.mock("./ui/Toggle", () => ({
  Toggle: ({
    label,
    isSelected,
    onChange,
  }: {
    label: string;
    isSelected: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <button type="button" onClick={() => onChange(!isSelected)}>
      {label}
    </button>
  ),
}));

vi.mock("./ui/ConfirmDialog", () => ({
  ConfirmDialog: ({
    isOpen,
    title,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
  }: {
    isOpen: boolean;
    title: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    isOpen ? (
      <div>
        <h2>{title}</h2>
        <button type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    ) : null,
}));

function renderAt(pathname = "/solo") {
  window.history.pushState({}, "", pathname);
  return render(<App />);
}

describe("Solo route logic", () => {
  beforeEach(() => {
    latestUseAIOptions = undefined;
    gameHookValue = {
      state: {
        board: Array.from({ length: 8 }, () => Array(8).fill(null)),
        currentPlayer: "black",
        validMoves: [{ row: 2, col: 3 }],
        consecutivePasses: 0,
        status: "playing",
        winner: null,
      },
      score: { black: 2, white: 2 },
      playMove: vi.fn(),
      passTurn: vi.fn(),
      resetGame: vi.fn(),
    };
  });

  test("asks for confirmation before resetting an active game and allows cancel", async () => {
    const user = userEvent.setup();

    renderAt();
    await user.click(await screen.findByRole("button", { name: "最初から" }));

    expect(
      await screen.findByRole("heading", { name: "対局を中断しますか？" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "続ける" }));

    expect(gameHookValue.resetGame).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "対局を中断しますか？" })).not.toBeInTheDocument();
  });

  test("resets immediately after a finished draw game", async () => {
    const user = userEvent.setup();
    gameHookValue = {
      ...gameHookValue,
      state: {
        ...gameHookValue.state,
        status: "finished",
        winner: "draw",
        validMoves: [],
      },
    };

    renderAt();

    expect(await screen.findByText("引き分けです。")).toBeInTheDocument();
    expect(screen.getByText("対局が終わりました。最初からやり直せます。")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "最初から" }));

    expect(gameHookValue.resetGame).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("heading", { name: "対局を中断しますか？" })).not.toBeInTheDocument();
  });

  test("auto-passes when the local player has no legal moves", async () => {
    gameHookValue = {
      ...gameHookValue,
      state: {
        ...gameHookValue.state,
        currentPlayer: "black",
        validMoves: [],
      },
    };

    renderAt();

    expect(await screen.findByText("黒の番です。")).toBeInTheDocument();
    expect(gameHookValue.passTurn).toHaveBeenCalledTimes(1);
  });

  test("delegates player and AI moves to the correct handlers", async () => {
    const user = userEvent.setup();
    gameHookValue = {
      ...gameHookValue,
      state: {
        ...gameHookValue.state,
        currentPlayer: "white",
        validMoves: [{ row: 2, col: 4 }],
      },
    };

    renderAt();

    expect(await screen.findByText("AIが考えています...")).toBeInTheDocument();
    expect(screen.getByText("AIの手番です。入力を待っています。")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "board" }));
    expect(gameHookValue.playMove).not.toHaveBeenCalled();

    act(() => {
      latestUseAIOptions?.onResolveMove(null);
      latestUseAIOptions?.onResolveMove({ row: 2, col: 4 });
    });

    expect(gameHookValue.passTurn).toHaveBeenCalledTimes(1);
    expect(gameHookValue.playMove).toHaveBeenCalledWith({ row: 2, col: 4 });
  });
});
