import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { createGameState, createInitialGameState } from "../game/game";
import type { MatchConnectionState, Move, PlayerRole } from "../game/types";
import type { PeerEnvelope } from "./peerProtocol";
import { useOnlineMatch } from "./useOnlineMatch";

const createRoom = vi.fn<() => Promise<void>>();
const joinRoom = vi.fn<(inviteCode: string) => Promise<void>>();
const acceptGuestAnswer = vi.fn<(inviteCode: string) => Promise<void>>();
const sendEnvelope = vi.fn<(envelope: PeerEnvelope) => boolean>();
const leaveConnection = vi.fn<() => void>();

let capturedEnvelopeHandler: ((envelope: PeerEnvelope) => void) | null = null;
let capturedConnectionLostHandler: (() => void) | undefined;
let peerState: {
  localRole: PlayerRole | null;
  connectionState: MatchConnectionState;
  inviteCode: string;
  errorMessage: string | null;
};

vi.mock("./usePeerConnection", () => ({
  usePeerConnection: (options: {
    onEnvelope: (envelope: PeerEnvelope) => void;
    onConnectionLost?: () => void;
  }) => {
    capturedEnvelopeHandler = options.onEnvelope;
    capturedConnectionLostHandler = options.onConnectionLost;

    return {
      ...peerState,
      createRoom,
      joinRoom,
      acceptGuestAnswer,
      sendEnvelope,
      leaveConnection,
    };
  },
}));

function parseBoard(rows: string[]) {
  return rows.map((row) =>
    row.split("").map((cell) => {
      if (cell === "B") return "black";
      if (cell === "W") return "white";
      return null;
    }),
  );
}

function renderOnlineMatch() {
  return renderHook(() => useOnlineMatch());
}

describe("useOnlineMatch", () => {
  beforeEach(() => {
    createRoom.mockReset();
    createRoom.mockResolvedValue(undefined);
    joinRoom.mockReset();
    joinRoom.mockResolvedValue(undefined);
    acceptGuestAnswer.mockReset();
    acceptGuestAnswer.mockResolvedValue(undefined);
    sendEnvelope.mockReset();
    sendEnvelope.mockReturnValue(true);
    leaveConnection.mockReset();
    capturedEnvelopeHandler = null;
    capturedConnectionLostHandler = undefined;
    peerState = {
      localRole: "host",
      connectionState: "connected",
      inviteCode: "",
      errorMessage: null,
    };
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  test("accepts a legal guest move on the host and broadcasts sync-state", async () => {
    const { result } = renderOnlineMatch();

    await act(async () => {
      await result.current.actions.createRoom();
    });

    act(() => {
      result.current.actions.submitMove({ row: 2, col: 3 });
    });

    const guestMove = result.current.viewModel.gameState.validMoves[0] as Move;

    act(() => {
      capturedEnvelopeHandler?.({
        type: "move-request",
        revision: result.current.viewModel.revision,
        payload: guestMove,
      });
    });

    expect(result.current.viewModel.gameState.currentPlayer).toBe("black");
    expect(result.current.viewModel.revision).toBe(2);
    expect(sendEnvelope).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: "sync-state",
        revision: 2,
      }),
    );
  });

  test("resends the latest snapshot when guest revision is stale", () => {
    const { result } = renderOnlineMatch();

    act(() => {
      capturedEnvelopeHandler?.({
        type: "move-request",
        revision: 99,
        payload: { row: 2, col: 3 },
      });
    });

    expect(result.current.viewModel.errorMessage).toBe("盤面がずれたため最新状態を再送しました。");
    expect(sendEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "sync-state",
        revision: 0,
      }),
    );
  });

  test("deduplicates concurrent createRoom requests and exposes the loading flag", async () => {
    let resolveCreate: (() => void) | null = null;
    createRoom.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveCreate = resolve;
        }),
    );

    const { result } = renderOnlineMatch();

    let firstRequest: Promise<void> | undefined;
    let secondRequest: Promise<void> | undefined;
    await act(async () => {
      firstRequest = result.current.actions.createRoom();
      secondRequest = result.current.actions.createRoom();
    });

    expect(firstRequest).toBe(secondRequest);
    expect(createRoom).toHaveBeenCalledTimes(1);
    expect(result.current.viewModel.isCreatingRoom).toBe(true);

    await act(async () => {
      resolveCreate?.();
      await firstRequest;
    });

    expect(result.current.viewModel.isCreatingRoom).toBe(false);
  });

  test("keeps requiresAnswerCode true until the host accepts the guest answer", async () => {
    peerState = {
      localRole: "host",
      connectionState: "code-ready",
      inviteCode: "host-offer",
      errorMessage: null,
    };

    const { result, rerender } = renderOnlineMatch();

    await act(async () => {
      await result.current.actions.createRoom();
    });

    rerender();
    expect(result.current.viewModel.requiresAnswerCode).toBe(true);

    peerState = {
      ...peerState,
      connectionState: "connecting",
    };

    rerender();
    expect(result.current.viewModel.requiresAnswerCode).toBe(true);
  });

  test("rejects an illegal guest move and reports the error to the peer", () => {
    renderOnlineMatch();

    act(() => {
      capturedEnvelopeHandler?.({
        type: "move-request",
        revision: 0,
        payload: { row: 0, col: 0 },
      });
    });

    expect(sendEnvelope).toHaveBeenCalledWith({
      type: "error",
      payload: { message: "その手は受理できません。" },
    });
  });

  test("accepts a legal pass request and advances the turn", () => {
    const passState = createGameState(
      parseBoard([
        ".WBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
      ]),
      "white",
    );

    const { result } = renderOnlineMatch();

    act(() => {
      capturedEnvelopeHandler?.({
        type: "sync-state",
        revision: 5,
        payload: {
          gameState: passState,
          matchId: "match-pass",
          revision: 5,
        },
      });
    });

    act(() => {
      capturedEnvelopeHandler?.({
        type: "pass-request",
        revision: 5,
        payload: { matchId: "match-pass" },
      });
    });

    expect(result.current.viewModel.gameState.currentPlayer).toBe("black");
    expect(result.current.viewModel.revision).toBe(6);
  });

  test("rejects an invalid pass request and resends the latest snapshot", () => {
    renderOnlineMatch();

    act(() => {
      capturedEnvelopeHandler?.({
        type: "pass-request",
        revision: 0,
        payload: { matchId: "match-pass" },
      });
    });

    expect(sendEnvelope).toHaveBeenNthCalledWith(1, {
      type: "error",
      payload: { message: "パスを受理できません。" },
    });
    expect(sendEnvelope).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: "sync-state",
        revision: 0,
      }),
    );
  });

  test("ignores host-only envelopes when the local player is a guest", () => {
    peerState = {
      localRole: "guest",
      connectionState: "connected",
      inviteCode: "guest-answer",
      errorMessage: null,
    };

    renderOnlineMatch();
    sendEnvelope.mockClear();

    act(() => {
      capturedEnvelopeHandler?.({
        type: "move-request",
        revision: 0,
        payload: { row: 2, col: 3 },
      });
      capturedEnvelopeHandler?.({
        type: "pass-request",
        revision: 0,
        payload: { matchId: "match-guest" },
      });
      capturedEnvelopeHandler?.({
        type: "join-request",
        payload: { matchId: "match-guest" },
      });
    });

    expect(sendEnvelope).not.toHaveBeenCalled();
  });

  test("guest sends a join-request when the peer connection becomes connected", () => {
    peerState = {
      localRole: "guest",
      connectionState: "connecting",
      inviteCode: "guest-answer",
      errorMessage: null,
    };

    const { rerender } = renderOnlineMatch();
    sendEnvelope.mockClear();

    peerState = {
      ...peerState,
      connectionState: "connected",
    };

    rerender();

    expect(sendEnvelope).toHaveBeenCalledWith({
      type: "join-request",
      payload: { matchId: expect.any(String) },
    });
  });

  test("resets the join loading flag after a failed join attempt", async () => {
    joinRoom.mockRejectedValueOnce(new Error("join failed"));
    const { result } = renderOnlineMatch();

    await act(async () => {
      await result.current.actions.joinRoom("host-offer");
    });

    expect(result.current.viewModel.isJoiningRoom).toBe(false);
    expect(result.current.viewModel.errorMessage).toBe("join failed");
  });

  test("submits guest moves and passes through the peer channel", () => {
    peerState = {
      localRole: "guest",
      connectionState: "connected",
      inviteCode: "guest-answer",
      errorMessage: null,
    };

    const guestTurnState = createGameState(
      parseBoard([
        "........",
        "........",
        "........",
        "...BW...",
        "...WB...",
        "........",
        "........",
        "........",
      ]),
      "white",
    );
    const guestPassState = createGameState(
      parseBoard([
        ".WBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
      ]),
      "white",
    );

    const { result } = renderOnlineMatch();

    act(() => {
      capturedEnvelopeHandler?.({
        type: "sync-state",
        revision: 4,
        payload: {
          gameState: guestTurnState,
          matchId: "match-guest",
          revision: 4,
        },
      });
    });

    sendEnvelope.mockClear();

    act(() => {
      result.current.actions.submitMove({ row: 2, col: 4 });
    });

    expect(sendEnvelope).toHaveBeenCalledWith({
      type: "move-request",
      revision: 4,
      payload: { row: 2, col: 4 },
    });

    act(() => {
      capturedEnvelopeHandler?.({
        type: "sync-state",
        revision: 9,
        payload: {
          gameState: guestPassState,
          matchId: "match-guest",
          revision: 9,
        },
      });
    });

    sendEnvelope.mockClear();

    act(() => {
      result.current.actions.submitPass();
    });

    expect(sendEnvelope).toHaveBeenCalledWith({
      type: "pass-request",
      revision: 9,
      payload: { matchId: "match-guest" },
    });
  });

  test("ignores local move and pass submissions when interaction is not allowed", () => {
    peerState = {
      localRole: "guest",
      connectionState: "disconnected",
      inviteCode: "guest-answer",
      errorMessage: null,
    };

    const { result } = renderOnlineMatch();

    act(() => {
      result.current.actions.submitMove({ row: 2, col: 3 });
      result.current.actions.submitPass();
    });

    expect(sendEnvelope).not.toHaveBeenCalled();
  });

  test("resets the board when the host accepts a rematch request", () => {
    const finishedState = createGameState(
      parseBoard([
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
      ]),
      "white",
    );

    const { result } = renderOnlineMatch();

    act(() => {
      capturedEnvelopeHandler?.({
        type: "sync-state",
        revision: 3,
        payload: {
          gameState: finishedState,
          matchId: "match-rematch",
          revision: 3,
        },
      });
    });

    act(() => {
      capturedEnvelopeHandler?.({
        type: "rematch-request",
        payload: { matchId: "match-rematch" },
      });
    });

    act(() => {
      result.current.actions.requestRematch();
    });

    expect(result.current.viewModel.gameState).toEqual(createInitialGameState());
    expect(result.current.viewModel.revision).toBe(4);
    expect(sendEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({ type: "rematch-accepted" }),
    );
  });

  test("guest clears rematch flags when host accepts the rematch", () => {
    peerState = {
      localRole: "guest",
      connectionState: "connected",
      inviteCode: "guest-answer",
      errorMessage: null,
    };

    const finishedState = createGameState(
      parseBoard([
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
        "BBBBBBBB",
      ]),
      "white",
    );

    const { result } = renderOnlineMatch();

    act(() => {
      capturedEnvelopeHandler?.({
        type: "sync-state",
        revision: 3,
        payload: {
          gameState: finishedState,
          matchId: "match-rematch",
          revision: 3,
        },
      });
    });

    act(() => {
      result.current.actions.requestRematch();
    });

    expect(result.current.viewModel.pendingRematch).toBe(true);

    act(() => {
      capturedEnvelopeHandler?.({
        type: "rematch-accepted",
        payload: { matchId: "match-rematch" },
      });
    });

    expect(result.current.viewModel.pendingRematch).toBe(false);
    expect(result.current.viewModel.peerRequestedRematch).toBe(false);
    expect(result.current.viewModel.gameState).toEqual(finishedState);
  });

  test("blocks rematch requests until the game is finished", () => {
    const { result } = renderOnlineMatch();

    act(() => {
      result.current.actions.requestRematch();
    });

    expect(sendEnvelope).not.toHaveBeenCalled();
    expect(result.current.viewModel.pendingRematch).toBe(false);
  });

  test("forwards peer-left and disconnect errors from the peer layer", () => {
    const { result } = renderOnlineMatch();

    act(() => {
      capturedEnvelopeHandler?.({
        type: "peer-left",
        payload: { matchId: "match-left" },
      });
    });

    expect(result.current.viewModel.errorMessage).toBe("相手が切断しました。");
    expect(result.current.viewModel.canInteract).toBe(false);
    expect(result.current.viewModel.canRequestRematch).toBe(false);

    sendEnvelope.mockClear();
    act(() => {
      result.current.actions.submitMove({ row: 2, col: 3 });
    });

    expect(sendEnvelope).not.toHaveBeenCalled();

    act(() => {
      capturedConnectionLostHandler?.();
    });

    expect(result.current.viewModel.errorMessage).toBe("接続が切れました。");
  });

  test("resets state and surfaces peer-layer errors when room creation or join fails", async () => {
    createRoom.mockRejectedValueOnce(new Error("create failed"));
    joinRoom.mockRejectedValueOnce(new Error("join failed"));
    const { result } = renderOnlineMatch();

    await act(async () => {
      await result.current.actions.createRoom();
    });

    expect(result.current.viewModel.errorMessage).toBe("create failed");
    expect(result.current.viewModel.matchId).toBe(null);
    expect(result.current.viewModel.revision).toBe(0);
    expect(leaveConnection).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.actions.joinRoom("host-offer");
    });

    expect(result.current.viewModel.errorMessage).toBe("join failed");
    expect(result.current.viewModel.matchId).toBe(null);
    expect(result.current.viewModel.revision).toBe(0);
    expect(leaveConnection).toHaveBeenCalledTimes(2);
  });

  test("surfaces answer-code submission errors", async () => {
    acceptGuestAnswer.mockRejectedValueOnce(new Error("answer failed"));
    peerState = {
      localRole: "host",
      connectionState: "code-ready",
      inviteCode: "host-offer",
      errorMessage: null,
    };
    const { result, rerender } = renderOnlineMatch();

    await act(async () => {
      await result.current.actions.createRoom();
    });

    rerender();

    expect(result.current.viewModel.isSubmittingAnswer).toBe(false);
    expect(result.current.viewModel.requiresAnswerCode).toBe(true);

    await act(async () => {
      await result.current.actions.submitAnswerCode("guest-answer");
    });

    expect(result.current.viewModel.isSubmittingAnswer).toBe(false);
    expect(result.current.viewModel.requiresAnswerCode).toBe(true);
    expect(result.current.viewModel.errorMessage).toBe("answer failed");
  });

  test("deduplicates concurrent answer-code submissions", async () => {
    let resolveAnswer: (() => void) | null = null;
    acceptGuestAnswer.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveAnswer = resolve;
        }),
    );

    const { result } = renderOnlineMatch();

    let firstRequest: Promise<void> | undefined;
    let secondRequest: Promise<void> | undefined;
    await act(async () => {
      firstRequest = result.current.actions.submitAnswerCode("guest-answer");
      secondRequest = result.current.actions.submitAnswerCode("guest-answer");
    });

    expect(firstRequest).toBe(secondRequest);
    expect(acceptGuestAnswer).toHaveBeenCalledTimes(1);
    expect(result.current.viewModel.isSubmittingAnswer).toBe(true);

    await act(async () => {
      resolveAnswer?.();
      await firstRequest;
    });

    expect(result.current.viewModel.isSubmittingAnswer).toBe(false);
  });

  test("clears requiresAnswerCode after the host accepts the guest answer", async () => {
    peerState = {
      localRole: "host",
      connectionState: "code-ready",
      inviteCode: "host-offer",
      errorMessage: null,
    };

    const { result, rerender } = renderOnlineMatch();

    await act(async () => {
      await result.current.actions.createRoom();
    });

    rerender();
    expect(result.current.viewModel.requiresAnswerCode).toBe(true);

    await act(async () => {
      await result.current.actions.submitAnswerCode("guest-answer");
    });

    expect(acceptGuestAnswer).toHaveBeenCalledWith("guest-answer");
    expect(result.current.viewModel.requiresAnswerCode).toBe(false);
  });

  test("clears pending loading flags when the peer connection is lost", async () => {
    let resolveCreate: (() => void) | null = null;
    createRoom.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveCreate = resolve;
        }),
    );

    const { result } = renderOnlineMatch();

    await act(async () => {
      void result.current.actions.createRoom();
    });

    expect(result.current.viewModel.isCreatingRoom).toBe(true);

    act(() => {
      capturedConnectionLostHandler?.();
    });

    expect(result.current.viewModel.isCreatingRoom).toBe(false);
    expect(result.current.viewModel.isJoiningRoom).toBe(false);
    expect(result.current.viewModel.isSubmittingAnswer).toBe(false);
    expect(result.current.viewModel.errorMessage).toBe("接続が切れました。");

    await act(async () => {
      resolveCreate?.();
    });
  });

  test("copies invite codes only when a clipboard and invite code are available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });

    peerState = {
      localRole: "host",
      connectionState: "code-ready",
      inviteCode: "invite-code",
      errorMessage: null,
    };

    const { result, rerender } = renderOnlineMatch();

    await expect(result.current.actions.copyInviteCode()).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("invite-code");

    peerState = {
      ...peerState,
      inviteCode: "",
    };

    rerender();

    await expect(result.current.actions.copyInviteCode()).resolves.toBe(false);
  });

  test("leaving a connected match notifies the peer and resets local state", () => {
    const { result } = renderOnlineMatch();

    act(() => {
      result.current.actions.leaveMatch();
    });

    expect(sendEnvelope).toHaveBeenCalledWith({
      type: "peer-left",
      payload: { matchId: "" },
    });
    expect(leaveConnection).toHaveBeenCalledTimes(1);
    expect(result.current.viewModel.matchId).toBe(null);
    expect(result.current.viewModel.revision).toBe(0);
    expect(result.current.viewModel.pendingRematch).toBe(false);
  });
});
