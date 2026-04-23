import { describe, expect, test } from 'vitest'
import { decodeInvitePayload, encodeInvitePayload } from './peerProtocol'

describe('peerProtocol', () => {
  test('encodes and decodes invite payloads', () => {
    const code = encodeInvitePayload({
      version: 1,
      role: 'host-offer',
      sdp: '{"type":"offer"}',
    })

    expect(decodeInvitePayload(code)).toEqual({
      version: 1,
      role: 'host-offer',
      sdp: '{"type":"offer"}',
    })
  })

  test('rejects malformed invite codes', () => {
    expect(() => decodeInvitePayload('not-base64')).toThrow('無効な招待コードです。')
  })
})
