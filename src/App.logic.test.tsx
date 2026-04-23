import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type {
  GameState,
  MatchConnectionState,
  PlayerRole,
} from './game/types'
import App from './App'

let onlineState: {
  gameState: GameState
  score: { black: number; white: number }
  localRole: PlayerRole | null
  connectionState: MatchConnectionState
  inviteCode: string
  errorMessage: string | null
  canInteract: boolean
  canRequestRematch: boolean
  localPlayerLabel: string
  matchId: string | null
  revision: number
  pendingRematch: boolean
  peerRequestedRematch: boolean
  requiresAnswerCode: boolean
}

const createRoom = vi.fn<() => Promise<void>>()
const joinRoom = vi.fn<(inviteCode: string) => Promise<void>>()
const submitAnswerCode = vi.fn<(inviteCode: string) => Promise<void>>()
const submitMove = vi.fn<(move: { row: number; col: number }) => void>()
const submitPass = vi.fn<() => void>()
const requestRematch = vi.fn<() => void>()
const leaveMatch = vi.fn<() => void>()
const copyInviteCode = vi.fn<() => Promise<boolean>>()

vi.mock('./effects/useOnlineMatch', () => ({
  useOnlineMatch: () => ({
    viewModel: onlineState,
    actions: {
      createRoom,
      joinRoom,
      submitAnswerCode,
      submitMove,
      submitPass,
      requestRematch,
      leaveMatch,
      copyInviteCode,
    },
  }),
}))

describe('App online logic', () => {
  beforeEach(() => {
    createRoom.mockReset()
    joinRoom.mockReset()
    submitAnswerCode.mockReset()
    submitMove.mockReset()
    submitPass.mockReset()
    requestRematch.mockReset()
    leaveMatch.mockReset()
    copyInviteCode.mockReset()
    copyInviteCode.mockResolvedValue(true)
    onlineState = {
      gameState: {
        board: [] as never[],
        currentPlayer: 'black',
        validMoves: [],
        consecutivePasses: 0,
        status: 'playing',
        winner: null,
      },
      score: { black: 2, white: 2 },
      localRole: 'host',
      connectionState: 'code-ready',
      inviteCode: 'invite-code',
      errorMessage: null,
      canInteract: false,
      canRequestRematch: false,
      localPlayerLabel: '黒',
      matchId: 'match-1',
      revision: 0,
      pendingRematch: false,
      peerRequestedRematch: false,
      requiresAnswerCode: true,
    }
  })

  test('shows online setup flow with invite and answer inputs', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: 'オンライン対戦' }))

    expect(screen.getByText('オンライン対戦')).toBeInTheDocument()
    expect(screen.getByDisplayValue('invite-code')).toBeInTheDocument()
    expect(screen.getByLabelText('参加者の応答コード')).toBeInTheDocument()
  })

  test('forwards join code input to joinRoom', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: 'オンライン対戦' }))
    await user.type(screen.getByLabelText('部屋に入る'), 'host-offer')
    await user.click(screen.getByRole('button', { name: '招待コードで入室' }))

    expect(joinRoom).toHaveBeenCalledWith('host-offer')
  })

  test('shows online match screen when connected and dispatches board moves', async () => {
    const user = userEvent.setup()
    onlineState = {
      ...onlineState,
      connectionState: 'connected',
      canInteract: true,
      requiresAnswerCode: false,
      gameState: {
        board: Array.from({ length: 8 }, () => Array(8).fill(null)),
        currentPlayer: 'black',
        validMoves: [{ row: 2, col: 3 }],
        consecutivePasses: 0,
        status: 'playing',
        winner: null,
      },
    }

    render(<App />)
    await user.click(screen.getByRole('button', { name: 'オンライン対戦' }))
    await user.click(screen.getByLabelText('3行4列 置けます'))

    expect(screen.getByText(/あなたの石: 黒/)).toBeInTheDocument()
    expect(submitMove).toHaveBeenCalledWith({ row: 2, col: 3 })
  })

  test('returns to setup when online disconnect action is used', async () => {
    const user = userEvent.setup()
    onlineState = {
      ...onlineState,
      connectionState: 'connected',
      requiresAnswerCode: false,
      gameState: {
        board: Array.from({ length: 8 }, () => Array(8).fill(null)),
        currentPlayer: 'white',
        validMoves: [],
        consecutivePasses: 0,
        status: 'finished',
        winner: 'white',
      },
      canRequestRematch: true,
    }

    render(<App />)
    await user.click(screen.getByRole('button', { name: 'オンライン対戦' }))
    await user.click(screen.getByRole('button', { name: '切断' }))

    expect(leaveMatch).toHaveBeenCalledTimes(1)
  })
})
