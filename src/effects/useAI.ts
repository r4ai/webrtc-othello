import { useEffect } from 'react'
import { searchBestMove } from '../ai/minimax'
import type { GameState, Move, Player } from '../game/types'

export interface UseAIOptions {
  enabled: boolean
  aiPlayer: Player
  state: GameState
  onResolveMove: (move: Move | null) => void
  depth?: number
  delayMs?: number
}

export function useAI({
  enabled,
  aiPlayer,
  state,
  onResolveMove,
  depth = 5,
  delayMs = 280,
}: UseAIOptions): void {
  useEffect(() => {
    if (
      !enabled ||
      state.status !== 'playing' ||
      state.currentPlayer !== aiPlayer
    ) {
      return
    }

    const timerId = window.setTimeout(() => {
      const move = searchBestMove(state.board, aiPlayer, depth)
      onResolveMove(move)
    }, delayMs)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [aiPlayer, delayMs, depth, enabled, onResolveMove, state])
}
