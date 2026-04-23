import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createGameState, createInitialGameState } from '../game/game'
import type {
  MatchConnectionState,
  Move,
  PlayerRole,
} from '../game/types'
import type { PeerEnvelope } from './peerProtocol'
import { useOnlineMatch } from './useOnlineMatch'

const createRoom = vi.fn<() => Promise<void>>()
const joinRoom = vi.fn<(inviteCode: string) => Promise<void>>()
const acceptGuestAnswer = vi.fn<(inviteCode: string) => Promise<void>>()
const sendEnvelope = vi.fn<(envelope: PeerEnvelope) => boolean>()
const leaveConnection = vi.fn<() => void>()

let capturedEnvelopeHandler: ((envelope: PeerEnvelope) => void) | null = null
let capturedConnectionLostHandler: (() => void) | undefined
let peerState: {
  localRole: PlayerRole | null
  connectionState: MatchConnectionState
  inviteCode: string
  errorMessage: string | null
}

vi.mock('./usePeerConnection', () => ({
  usePeerConnection: (options: {
    onEnvelope: (envelope: PeerEnvelope) => void
    onConnectionLost?: () => void
  }) => {
    capturedEnvelopeHandler = options.onEnvelope
    capturedConnectionLostHandler = options.onConnectionLost

    return {
      ...peerState,
      createRoom,
      joinRoom,
      acceptGuestAnswer,
      sendEnvelope,
      leaveConnection,
    }
  },
}))

function parseBoard(rows: string[]) {
  return rows.map((row) =>
    row.split('').map((cell) => {
      if (cell === 'B') return 'black'
      if (cell === 'W') return 'white'
      return null
    }),
  )
}

describe('useOnlineMatch', () => {
  beforeEach(() => {
    createRoom.mockReset()
    createRoom.mockResolvedValue(undefined)
    joinRoom.mockReset()
    joinRoom.mockResolvedValue(undefined)
    acceptGuestAnswer.mockReset()
    acceptGuestAnswer.mockResolvedValue(undefined)
    sendEnvelope.mockReset()
    sendEnvelope.mockReturnValue(true)
    leaveConnection.mockReset()
    capturedEnvelopeHandler = null
    capturedConnectionLostHandler = undefined
    peerState = {
      localRole: 'host',
      connectionState: 'connected',
      inviteCode: '',
      errorMessage: null,
    }
  })

  test('accepts a legal guest move on the host and broadcasts sync-state', async () => {
    const { result } = renderHook(() => useOnlineMatch())

    await act(async () => {
      await result.current.actions.createRoom()
    })

    act(() => {
      result.current.actions.submitMove({ row: 2, col: 3 })
    })

    const guestMove = result.current.viewModel.gameState.validMoves[0] as Move

    act(() => {
      capturedEnvelopeHandler?.({
        type: 'move-request',
        revision: result.current.viewModel.revision,
        payload: guestMove,
      })
    })

    expect(result.current.viewModel.gameState.currentPlayer).toBe('black')
    expect(result.current.viewModel.revision).toBe(2)
    expect(sendEnvelope).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: 'sync-state',
        revision: 2,
      }),
    )
  })

  test('resends the latest snapshot when guest revision is stale', () => {
    const { result } = renderHook(() => useOnlineMatch())

    act(() => {
      capturedEnvelopeHandler?.({
        type: 'move-request',
        revision: 99,
        payload: { row: 2, col: 3 },
      })
    })

    expect(result.current.viewModel.errorMessage).toBe('盤面がずれたため最新状態を再送しました。')
    expect(sendEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'sync-state',
        revision: 0,
      }),
    )
  })

  test('accepts a legal pass request and advances the turn', () => {
    const passState = createGameState(parseBoard([
      '.WBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
    ]), 'white')

    const { result } = renderHook(() => useOnlineMatch())

    act(() => {
      capturedEnvelopeHandler?.({
        type: 'sync-state',
        revision: 5,
        payload: {
          gameState: passState,
          matchId: 'match-pass',
          revision: 5,
        },
      })
    })

    act(() => {
      capturedEnvelopeHandler?.({
        type: 'pass-request',
        revision: 5,
        payload: { matchId: 'match-pass' },
      })
    })

    expect(result.current.viewModel.gameState.currentPlayer).toBe('black')
    expect(result.current.viewModel.revision).toBe(6)
  })

  test('resets the board when the host accepts a rematch request', () => {
    const finishedState = createGameState(parseBoard([
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
    ]), 'white')

    const { result } = renderHook(() => useOnlineMatch())

    act(() => {
      capturedEnvelopeHandler?.({
        type: 'sync-state',
        revision: 3,
        payload: {
          gameState: finishedState,
          matchId: 'match-rematch',
          revision: 3,
        },
      })
    })

    act(() => {
      capturedEnvelopeHandler?.({
        type: 'rematch-request',
        payload: { matchId: 'match-rematch' },
      })
    })

    act(() => {
      result.current.actions.requestRematch()
    })

    expect(result.current.viewModel.gameState).toEqual(createInitialGameState())
    expect(result.current.viewModel.revision).toBe(4)
    expect(sendEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'rematch-accepted' }),
    )
  })

  test('exposes disconnect errors from the peer layer', () => {
    const { result } = renderHook(() => useOnlineMatch())

    act(() => {
      capturedConnectionLostHandler?.()
    })

    expect(result.current.viewModel.errorMessage).toBe('接続が切れました。')
  })
})
