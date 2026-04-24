import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vite-plus/test";
import { OnlineMatchContext } from "./onlineMatchContext";
import { useOnlineMatchContext } from "./useOnlineMatchContext";

describe("useOnlineMatchContext", () => {
  test("throws when used without a provider", () => {
    expect(() => renderHook(() => useOnlineMatchContext())).toThrow(
      "useOnlineMatchContext must be used within OnlineMatchProvider",
    );
  });

  test("returns the provided context value", () => {
    const value = {
      viewModel: {
        gameState: {
          board: [],
          currentPlayer: "black" as const,
          validMoves: [],
          consecutivePasses: 0,
          status: "playing" as const,
          winner: null,
        },
        score: { black: 2, white: 2 },
        localRole: null,
        connectionState: "idle" as const,
        inviteCode: "",
        errorMessage: null,
        isCreatingRoom: false,
        isJoiningRoom: false,
        isSubmittingAnswer: false,
        canInteract: false,
        canRequestRematch: false,
        localPlayerLabel: "観戦",
        matchId: null,
        revision: 0,
        pendingRematch: false,
        peerRequestedRematch: false,
        requiresAnswerCode: false,
      },
      actions: {
        createRoom: vi.fn(),
        joinRoom: vi.fn(),
        submitAnswerCode: vi.fn(),
        submitMove: vi.fn(),
        submitPass: vi.fn(),
        requestRematch: vi.fn(),
        leaveMatch: vi.fn(),
        copyInviteCode: vi.fn(),
      },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <OnlineMatchContext.Provider value={value}>{children}</OnlineMatchContext.Provider>
    );

    const { result } = renderHook(() => useOnlineMatchContext(), { wrapper });

    expect(result.current).toBe(value);
  });
});
