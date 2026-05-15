import { describe, expect, test } from "vite-plus/test";
import { decodeInvitePayload, decodePeerEnvelope, encodeInvitePayload } from "./peerProtocol";

describe("peerProtocol", () => {
  test("encodes and decodes invite payloads", () => {
    const code = encodeInvitePayload({
      version: 1,
      role: "host-offer",
      sdp: '{"type":"offer"}',
    });

    expect(decodeInvitePayload(code)).toEqual({
      version: 1,
      role: "host-offer",
      sdp: '{"type":"offer"}',
    });
  });

  test("rejects malformed invite codes", () => {
    expect(() => decodeInvitePayload("not-base64")).toThrow("無効な招待コードです。");
  });

  test("decodes valid peer envelopes", () => {
    expect(
      decodePeerEnvelope(
        JSON.stringify({
          type: "move-request",
          revision: 3,
          payload: { row: 2, col: 4 },
        }),
      ),
    ).toEqual({
      type: "move-request",
      revision: 3,
      payload: { row: 2, col: 4 },
    });
  });

  test("rejects malformed peer envelopes", () => {
    expect(() =>
      decodePeerEnvelope(
        JSON.stringify({
          type: "sync-state",
          revision: 1,
          payload: { matchId: "match-1", revision: 1 },
        }),
      ),
    ).toThrow("invalid peer envelope");

    expect(() =>
      decodePeerEnvelope(
        JSON.stringify({
          type: "move-request",
          revision: 1,
          payload: { row: "2", col: 4 },
        }),
      ),
    ).toThrow("invalid peer envelope");
  });
});
