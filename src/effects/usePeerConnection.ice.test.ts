import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { usePeerConnection } from "./usePeerConnection";

class SlowIcePeerConnection extends EventTarget {
  connectionState: RTCPeerConnectionState = "new";
  iceGatheringState: RTCIceGatheringState = "gathering";
  localDescription: RTCSessionDescriptionInit | null = null;

  createDataChannel() {
    return Object.assign(new EventTarget(), {
      close() {},
    }) as RTCDataChannel;
  }

  async createOffer() {
    return { type: "offer", sdp: "offer-sdp" } as RTCSessionDescriptionInit;
  }

  async setLocalDescription(description: RTCSessionDescriptionInit) {
    this.localDescription = description;
  }

  close() {}
}

describe("usePeerConnection ICE gathering", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("RTCPeerConnection", SlowIcePeerConnection);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("continues room creation when ICE gathering does not complete", async () => {
    const { result } = renderHook(() =>
      usePeerConnection({
        onEnvelope: vi.fn(),
      }),
    );

    await act(async () => {
      const request = result.current.createRoom();
      await vi.advanceTimersByTimeAsync(5_000);
      await request;
    });

    expect(result.current.connectionState).toBe("code-ready");
    expect(result.current.inviteCode).not.toBe("");
  });
});
