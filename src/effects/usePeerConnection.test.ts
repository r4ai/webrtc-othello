import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { usePeerConnection } from "./usePeerConnection";

class FakeDataChannel extends EventTarget {
  readyState: RTCDataChannelState = "connecting";
  sent: string[] = [];

  open() {
    this.readyState = "open";
    this.dispatchEvent(new Event("open"));
  }

  close() {
    this.readyState = "closed";
  }

  fireClose() {
    this.readyState = "closed";
    this.dispatchEvent(new Event("close"));
  }

  fireMessage(data: string) {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }

  send(message: string) {
    this.sent.push(message);
  }
}

class FakePeerConnection extends EventTarget {
  static instances: FakePeerConnection[] = [];

  connectionState: RTCPeerConnectionState = "new";
  iceGatheringState: RTCIceGatheringState = "complete";
  localDescription: RTCSessionDescriptionInit | null = null;
  remoteDescription: RTCSessionDescriptionInit | null = null;
  channels: FakeDataChannel[] = [];
  closed = false;

  constructor() {
    super();
    FakePeerConnection.instances.push(this);
  }

  createDataChannel() {
    const channel = new FakeDataChannel();
    this.channels.push(channel);
    return channel as unknown as RTCDataChannel;
  }

  async createOffer() {
    return { type: "offer", sdp: "offer-sdp" } as RTCSessionDescriptionInit;
  }

  async createAnswer() {
    return { type: "answer", sdp: "answer-sdp" } as RTCSessionDescriptionInit;
  }

  async setLocalDescription(description: RTCSessionDescriptionInit) {
    this.localDescription = description;
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit) {
    this.remoteDescription = description;
  }

  close() {
    this.closed = true;
    this.connectionState = "closed";
  }

  fireConnectionState(state: RTCPeerConnectionState) {
    this.connectionState = state;
    this.dispatchEvent(new Event("connectionstatechange"));
  }
}

describe("usePeerConnection", () => {
  const originalPeerConnection = globalThis.RTCPeerConnection;

  beforeEach(() => {
    FakePeerConnection.instances = [];
    vi.stubGlobal("RTCPeerConnection", FakePeerConnection);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalPeerConnection !== undefined) {
      vi.stubGlobal("RTCPeerConnection", originalPeerConnection);
    }
  });

  test("ignores close events from stale channels after recreating a room", async () => {
    const onConnectionLost = vi.fn();
    const { result } = renderHook(() =>
      usePeerConnection({
        onEnvelope: vi.fn(),
        onConnectionLost,
      }),
    );

    await act(async () => {
      await result.current.createRoom();
    });

    const firstChannel = FakePeerConnection.instances[0]?.channels[0];

    await act(async () => {
      await result.current.createRoom();
    });

    expect(result.current.connectionState).toBe("code-ready");

    act(() => {
      firstChannel?.fireClose();
    });

    expect(result.current.connectionState).toBe("code-ready");
    expect(onConnectionLost).not.toHaveBeenCalled();
  });

  test("ignores messages from stale channels after recreating a room", async () => {
    const onEnvelope = vi.fn();
    const { result } = renderHook(() =>
      usePeerConnection({
        onEnvelope,
      }),
    );

    await act(async () => {
      await result.current.createRoom();
    });

    const firstChannel = FakePeerConnection.instances[0]?.channels[0];

    await act(async () => {
      await result.current.createRoom();
    });

    act(() => {
      firstChannel?.fireMessage(
        JSON.stringify({
          type: "peer-left",
          payload: { matchId: "old-match" },
        }),
      );
    });

    expect(onEnvelope).not.toHaveBeenCalled();
  });
});
