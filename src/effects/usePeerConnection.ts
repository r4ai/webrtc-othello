import { useCallback, useEffect, useRef, useState } from "react";
import type { MatchConnectionState, PlayerRole } from "../game/types";
import { decodeInvitePayload, encodeInvitePayload, type PeerEnvelope } from "./peerProtocol";

interface UsePeerConnectionOptions {
  onEnvelope: (envelope: PeerEnvelope) => void;
  onConnectionLost?: () => void;
}

export interface UsePeerConnectionResult {
  localRole: PlayerRole | null;
  connectionState: MatchConnectionState;
  inviteCode: string;
  errorMessage: string | null;
  createRoom: () => Promise<void>;
  joinRoom: (inviteCode: string) => Promise<void>;
  acceptGuestAnswer: (inviteCode: string) => Promise<void>;
  sendEnvelope: (envelope: PeerEnvelope) => boolean;
  leaveConnection: () => void;
}

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const iceGatheringTimeoutMs = 5_000;

function waitForIceGatheringComplete(connection: RTCPeerConnection): Promise<void> {
  if (connection.iceGatheringState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    const resolveOnce = () => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      connection.removeEventListener("icegatheringstatechange", handleStateChange);
      resolve();
    };
    const handleStateChange = () => {
      if (connection.iceGatheringState === "complete") {
        resolveOnce();
      }
    };
    const timeout = setTimeout(resolveOnce, iceGatheringTimeoutMs);

    connection.addEventListener("icegatheringstatechange", handleStateChange);
  });
}

function normalizeConnectionState(state: RTCPeerConnectionState): MatchConnectionState | null {
  if (state === "connected") {
    return "connected";
  }

  if (state === "connecting") {
    return "connecting";
  }

  if (state === "disconnected" || state === "closed") {
    return "disconnected";
  }

  if (state === "failed") {
    return "failed";
  }

  return null;
}

export function usePeerConnection({
  onEnvelope,
  onConnectionLost,
}: UsePeerConnectionOptions): UsePeerConnectionResult {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const roleRef = useRef<PlayerRole | null>(null);
  const onEnvelopeRef = useRef(onEnvelope);
  const onConnectionLostRef = useRef(onConnectionLost);
  const [localRole, setLocalRole] = useState<PlayerRole | null>(null);
  const [connectionState, setConnectionState] = useState<MatchConnectionState>("idle");
  const [inviteCode, setInviteCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    onEnvelopeRef.current = onEnvelope;
  }, [onEnvelope]);

  useEffect(() => {
    onConnectionLostRef.current = onConnectionLost;
  }, [onConnectionLost]);

  const cleanupConnection = useCallback(() => {
    channelRef.current?.close();
    channelRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    roleRef.current = null;
  }, []);

  const leaveConnection = useCallback(() => {
    cleanupConnection();
    setLocalRole(null);
    setInviteCode("");
    setErrorMessage(null);
    setConnectionState("idle");
  }, [cleanupConnection]);

  const attachChannel = useCallback((channel: RTCDataChannel) => {
    channelRef.current = channel;

    channel.addEventListener("open", () => {
      setErrorMessage(null);
      setConnectionState("connected");
    });

    channel.addEventListener("close", () => {
      setConnectionState("disconnected");
      onConnectionLostRef.current?.();
    });

    channel.addEventListener("message", (event) => {
      try {
        const envelope = JSON.parse(event.data) as PeerEnvelope;
        onEnvelopeRef.current(envelope);
      } catch {
        setErrorMessage("受信データを解釈できませんでした。");
      }
    });
  }, []);

  const attachPeer = useCallback(
    (connection: RTCPeerConnection, role: PlayerRole) => {
      peerRef.current = connection;
      roleRef.current = role;
      setLocalRole(role);
      setErrorMessage(null);

      connection.addEventListener("connectionstatechange", () => {
        const nextState = normalizeConnectionState(connection.connectionState);
        if (nextState === null) {
          return;
        }

        setConnectionState(nextState);

        if (nextState === "failed") {
          setErrorMessage("接続に失敗しました。");
        }

        if (nextState === "disconnected") {
          onConnectionLostRef.current?.();
        }
      });

      connection.addEventListener("datachannel", (event) => {
        attachChannel(event.channel);
      });
    },
    [attachChannel],
  );

  const createRoom = useCallback(async () => {
    cleanupConnection();

    const connection = new RTCPeerConnection(rtcConfig);
    attachPeer(connection, "host");

    const channel = connection.createDataChannel("othello-match", { ordered: true });
    attachChannel(channel);

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    await waitForIceGatheringComplete(connection);

    if (connection.localDescription === null) {
      throw new Error("招待コードを生成できませんでした。");
    }

    setInviteCode(
      encodeInvitePayload({
        version: 1,
        role: "host-offer",
        sdp: JSON.stringify(connection.localDescription),
      }),
    );
    setConnectionState("code-ready");
  }, [attachChannel, attachPeer, cleanupConnection]);

  const joinRoom = useCallback(
    async (rawInviteCode: string) => {
      cleanupConnection();

      const invite = decodeInvitePayload(rawInviteCode);
      if (invite.role !== "host-offer") {
        throw new Error("ホストの招待コードを入力してください。");
      }

      const connection = new RTCPeerConnection(rtcConfig);
      attachPeer(connection, "guest");
      await connection.setRemoteDescription(JSON.parse(invite.sdp) as RTCSessionDescriptionInit);

      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      await waitForIceGatheringComplete(connection);

      if (connection.localDescription === null) {
        throw new Error("応答コードを生成できませんでした。");
      }

      setInviteCode(
        encodeInvitePayload({
          version: 1,
          role: "guest-answer",
          sdp: JSON.stringify(connection.localDescription),
        }),
      );
      setConnectionState("code-ready");
    },
    [attachPeer, cleanupConnection],
  );

  const acceptGuestAnswer = useCallback(async (rawInviteCode: string) => {
    const connection = peerRef.current;
    if (connection === null || roleRef.current !== "host") {
      throw new Error("部屋作成後に参加コードを貼り付けてください。");
    }

    const invite = decodeInvitePayload(rawInviteCode);
    if (invite.role !== "guest-answer") {
      throw new Error("参加者の応答コードを入力してください。");
    }

    await connection.setRemoteDescription(JSON.parse(invite.sdp) as RTCSessionDescriptionInit);
    setConnectionState("connecting");
    setErrorMessage(null);
  }, []);

  const sendEnvelope = useCallback((envelope: PeerEnvelope) => {
    const channel = channelRef.current;
    if (channel === null || channel.readyState !== "open") {
      setErrorMessage("接続が確立していません。");
      return false;
    }

    channel.send(JSON.stringify(envelope));
    return true;
  }, []);

  useEffect(() => {
    return () => {
      cleanupConnection();
    };
  }, [cleanupConnection]);

  return {
    localRole,
    connectionState,
    inviteCode,
    errorMessage,
    createRoom,
    joinRoom,
    acceptGuestAnswer,
    sendEnvelope,
    leaveConnection,
  };
}
