import { useCallback, useMemo, useState } from 'react'
import { countDiscs } from '../game/board'
import { createInitialGameState, playTurn } from '../game/game'
import type { GameState, Move } from '../game/types'

function hasMove(validMoves: Move[], move: Move): boolean {
  return validMoves.some((candidate) => {
    return candidate.row === move.row && candidate.col === move.col
  })
}

export interface UseGameResult {
  state: GameState
  score: { black: number; white: number }
  playMove: (move: Move) => void
  passTurn: () => void
  resetGame: () => void
}

export function useGame(initialState: GameState = createInitialGameState()): UseGameResult {
  const [state, setState] = useState<GameState>(initialState)

  const playMove = useCallback((move: Move) => {
    setState((previous) => {
      if (previous.status !== 'playing') {
        return previous
      }

      if (!hasMove(previous.validMoves, move)) {
        return previous
      }

      return playTurn(previous, move)
    })
  }, [])

  const passTurn = useCallback(() => {
    setState((previous) => {
      if (previous.status !== 'playing' || previous.validMoves.length > 0) {
        return previous
      }

      return playTurn(previous, null)
    })
  }, [])

  const resetGame = useCallback(() => {
    setState(createInitialGameState())
  }, [])

  const score = useMemo(() => countDiscs(state.board), [state.board])

  return {
    state,
    score,
    playMove,
    passTurn,
    resetGame,
  }
}
