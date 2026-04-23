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

function renderAt(pathname = '/') {
  window.history.pushState({}, '', pathname)
  return render(<App />)
}

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
    createRoom.mockResolvedValue(undefined)
    joinRoom.mockResolvedValue(undefined)
    submitAnswerCode.mockResolvedValue(undefined)
    leaveMatch.mockImplementation(() => {
      onlineState = {
        ...onlineState,
        connectionState: 'disconnected',
        requiresAnswerCode: false,
      }
    })
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

  test('shows host create flow with invite code and answer code input', async () => {
    renderAt('/online/create')

    expect(await screen.findByText('部屋を作る')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('invite-code')).toBeInTheDocument()
    expect(await screen.findByLabelText('相手の応答コード')).toBeInTheDocument()
  })

  test('forwards join code input to joinRoom', async () => {
    const user = userEvent.setup()
    onlineState = {
      ...onlineState,
      localRole: null,
      connectionState: 'idle',
      inviteCode: '',
      requiresAnswerCode: false,
    }

    renderAt('/online')
    await user.click(await screen.findByRole('button', { name: '招待コードで参加' }))
    await user.type(await screen.findByLabelText('招待コード'), 'host-offer')
    await user.click(await screen.findByRole('button', { name: '応答コードを生成' }))

    expect(joinRoom).toHaveBeenCalledWith('host-offer')
  })

  test('shows guest response code after joining with an invite code', async () => {
    onlineState = {
      ...onlineState,
      localRole: 'guest',
      connectionState: 'code-ready',
      requiresAnswerCode: false,
    }

    renderAt('/online/join')

    expect(await screen.findByText('応答コードをホストに送る')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('invite-code')).toBeInTheDocument()
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

    renderAt('/online/match')
    await user.click(await screen.findByLabelText('3行4列 置けます'))

    expect(await screen.findByText('接続済み / あなたは黒です')).toBeInTheDocument()
    expect(submitMove).toHaveBeenCalledWith({ row: 2, col: 3 })
  })

  test('returns to home when online disconnect action is used', async () => {
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

    renderAt('/online/match')
    await user.click(await screen.findByRole('button', { name: '対戦を終了' }))

    expect(leaveMatch).toHaveBeenCalledTimes(1)
    expect(window.location.pathname).toBe('/')
    expect(await screen.findByRole('button', { name: 'オンライン対戦' })).toBeInTheDocument()
  })
})
