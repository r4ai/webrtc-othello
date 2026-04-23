import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { GameState, Move } from './game/types'
import App from './App'

const playMove = vi.fn<(move: Move) => void>()
const passTurn = vi.fn<() => void>()
const resetGame = vi.fn<() => void>()
let capturedAiHandler: ((move: Move | null) => void) | null = null
let mockState: GameState

vi.mock('./effects/useGame', () => ({
  useGame: () => ({
    state: mockState,
    score: { black: 2, white: 2 },
    playMove,
    passTurn,
    resetGame,
  }),
}))

vi.mock('./effects/useAI', () => ({
  useAI: ({ onResolveMove }: { onResolveMove: (move: Move | null) => void }) => {
    capturedAiHandler = onResolveMove
  },
}))

vi.mock('./components/Board', () => ({
  Board: ({
    interactive,
    onMove,
  }: {
    interactive: boolean
    onMove: (move: Move) => void
  }) => (
    <button
      type="button"
      data-testid="board-trigger"
      data-interactive={interactive ? 'true' : 'false'}
      onClick={() => onMove({ row: 6, col: 7 })}
    >
      board
    </button>
  ),
}))

vi.mock('./components/Controls', () => ({
  Controls: ({
    canPass,
    isAiTurn,
  }: {
    canPass: boolean
    isAiTurn: boolean
  }) => (
    <div>
      <span data-testid="can-pass">{String(canPass)}</span>
      <span data-testid="is-ai-turn">{String(isAiTurn)}</span>
    </div>
  ),
}))

vi.mock('./components/GameStatus', () => ({
  GameStatus: () => <div>status</div>,
}))

vi.mock('./components/ScoreBoard', () => ({
  ScoreBoard: () => <div>score</div>,
}))

describe('App logic branches', () => {
  beforeEach(() => {
    playMove.mockReset()
    passTurn.mockReset()
    resetGame.mockReset()
    capturedAiHandler = null
    mockState = {
      board: [] as never[],
      currentPlayer: 'black',
      validMoves: [{ row: 2, col: 3 }],
      consecutivePasses: 0,
      status: 'playing',
      winner: null,
    }
  })

  test('forwards board clicks to playMove during the human turn', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByTestId('board-trigger'))

    expect(playMove).toHaveBeenCalledWith({ row: 6, col: 7 })
    expect(screen.getByTestId('can-pass')).toHaveTextContent('false')
  })

  test('ignores board clicks during the AI turn and disables pass', async () => {
    const user = userEvent.setup()
    mockState = {
      ...mockState,
      currentPlayer: 'white',
      validMoves: [],
    }

    render(<App />)
    await user.click(screen.getByTestId('board-trigger'))

    expect(playMove).not.toHaveBeenCalled()
    expect(screen.getByTestId('is-ai-turn')).toHaveTextContent('true')
    expect(screen.getByTestId('can-pass')).toHaveTextContent('false')
  })

  test('passes when the AI resolves to null', () => {
    render(<App />)

    capturedAiHandler?.(null)

    expect(passTurn).toHaveBeenCalledTimes(1)
    expect(playMove).not.toHaveBeenCalled()
  })

  test('plays the resolved AI move when one is returned', () => {
    render(<App />)

    capturedAiHandler?.({ row: 4, col: 5 })

    expect(playMove).toHaveBeenCalledWith({ row: 4, col: 5 })
    expect(passTurn).not.toHaveBeenCalled()
  })

  test('allows pass when the human player has no valid moves', () => {
    mockState = {
      ...mockState,
      currentPlayer: 'black',
      validMoves: [],
    }

    render(<App />)

    expect(screen.getByTestId('is-ai-turn')).toHaveTextContent('false')
    expect(screen.getByTestId('can-pass')).toHaveTextContent('true')
  })
})
