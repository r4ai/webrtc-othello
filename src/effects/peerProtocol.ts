import {
  BOARD_SIZE,
  type GameState,
  type MatchConnectionState,
  type PlayerRole,
} from "../game/types";

export interface MatchSnapshot {
  gameState: GameState;
  matchId: string;
  revision: number;
}

export interface InvitePayload {
  version: 1;
  sdp: string;
  role: "host-offer" | "guest-answer";
}

export type PeerEnvelope =
  | { type: "join-request"; payload: { matchId: string } }
  | { type: "join-accepted"; payload: { matchId: string } }
  | { type: "move-request"; revision: number; payload: { row: number; col: number } }
  | { type: "pass-request"; revision: number; payload: { matchId: string } }
  | { type: "rematch-request"; payload: { matchId: string } }
  | { type: "rematch-accepted"; payload: { matchId: string } }
  | { type: "sync-state"; revision: number; payload: MatchSnapshot }
  | { type: "peer-left"; payload: { matchId: string } }
  | { type: "error"; payload: { message: string } };

export interface OnlineMatchViewModel {
  gameState: GameState;
  localRole: PlayerRole | null;
  connectionState: MatchConnectionState;
  inviteCode: string;
  errorMessage: string | null;
  isCreatingRoom: boolean;
  isJoiningRoom: boolean;
  isSubmittingAnswer: boolean;
  canInteract: boolean;
  canRequestRematch: boolean;
  localPlayerLabel: string;
  matchId: string | null;
  revision: number;
  pendingRematch: boolean;
  peerRequestedRematch: boolean;
  requiresAnswerCode: boolean;
}

export interface OnlineMatchActions {
  createRoom: () => Promise<void>;
  joinRoom: (inviteCode: string) => Promise<void>;
  submitAnswerCode: (inviteCode: string) => Promise<void>;
  submitMove: (move: { row: number; col: number }) => void;
  submitPass: () => void;
  requestRematch: () => void;
  leaveMatch: () => void;
  copyInviteCode: () => Promise<boolean>;
}

export function encodeInvitePayload(payload: InvitePayload): string {
  return window.btoa(JSON.stringify(payload));
}

export function decodeInvitePayload(inviteCode: string): InvitePayload {
  try {
    const raw = window.atob(inviteCode.trim());
    const parsed = JSON.parse(raw) as Partial<InvitePayload>;

    if (
      parsed.version !== 1 ||
      typeof parsed.sdp !== "string" ||
      (parsed.role !== "host-offer" && parsed.role !== "guest-answer")
    ) {
      throw new Error("invalid invite payload");
    }

    return parsed as InvitePayload;
  } catch {
    throw new Error("無効な招待コードです。");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isInteger(value: unknown): value is number {
  return Number.isInteger(value);
}

function hasMatchIdPayload(value: unknown): value is { matchId: string } {
  return isRecord(value) && typeof value["matchId"] === "string";
}

function hasMovePayload(value: unknown): value is { row: number; col: number } {
  return isRecord(value) && isInteger(value["row"]) && isInteger(value["col"]);
}

function isCell(value: unknown): value is "black" | "white" | null {
  return value === "black" || value === "white" || value === null;
}

function isBoard(value: unknown): value is GameState["board"] {
  return (
    Array.isArray(value) &&
    value.length === BOARD_SIZE &&
    value.every((row) => {
      return Array.isArray(row) && row.length === BOARD_SIZE && row.every(isCell);
    })
  );
}

function isPlayer(value: unknown): value is GameState["currentPlayer"] {
  return value === "black" || value === "white";
}

function isGameStatus(value: unknown): value is GameState["status"] {
  return value === "playing" || value === "finished";
}

function isWinner(value: unknown): value is GameState["winner"] {
  return value === "black" || value === "white" || value === "draw" || value === null;
}

function isMove(value: unknown): value is { row: number; col: number } {
  return hasMovePayload(value);
}

function isGameState(value: unknown): value is GameState {
  return (
    isRecord(value) &&
    isBoard(value["board"]) &&
    isPlayer(value["currentPlayer"]) &&
    Array.isArray(value["validMoves"]) &&
    value["validMoves"].every(isMove) &&
    isInteger(value["consecutivePasses"]) &&
    isGameStatus(value["status"]) &&
    isWinner(value["winner"])
  );
}

function hasSnapshotPayload(value: unknown): value is MatchSnapshot {
  return (
    isRecord(value) &&
    isGameState(value["gameState"]) &&
    typeof value["matchId"] === "string" &&
    isInteger(value["revision"])
  );
}

function hasErrorPayload(value: unknown): value is { message: string } {
  return isRecord(value) && typeof value["message"] === "string";
}

function assertPeerEnvelope(value: unknown): asserts value is PeerEnvelope {
  if (!isRecord(value) || typeof value["type"] !== "string") {
    throw new Error("invalid peer envelope");
  }

  switch (value["type"]) {
    case "join-request":
    case "join-accepted":
    case "rematch-request":
    case "rematch-accepted":
    case "peer-left": {
      if (!hasMatchIdPayload(value["payload"])) {
        throw new Error("invalid peer envelope");
      }
      return;
    }
    case "move-request": {
      if (!isInteger(value["revision"]) || !hasMovePayload(value["payload"])) {
        throw new Error("invalid peer envelope");
      }
      return;
    }
    case "pass-request": {
      if (!isInteger(value["revision"]) || !hasMatchIdPayload(value["payload"])) {
        throw new Error("invalid peer envelope");
      }
      return;
    }
    case "sync-state": {
      if (!isInteger(value["revision"]) || !hasSnapshotPayload(value["payload"])) {
        throw new Error("invalid peer envelope");
      }
      return;
    }
    case "error": {
      if (!hasErrorPayload(value["payload"])) {
        throw new Error("invalid peer envelope");
      }
      return;
    }
    default:
      throw new Error("invalid peer envelope");
  }
}

export function decodePeerEnvelope(data: unknown): PeerEnvelope {
  if (typeof data !== "string") {
    throw new Error("invalid peer envelope");
  }

  const parsed = JSON.parse(data) as unknown;
  assertPeerEnvelope(parsed);
  return parsed;
}
