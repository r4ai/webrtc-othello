import type { GameState, MatchConnectionState, PlayerRole } from "../game/types";

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
