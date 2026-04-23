import { applyMove, getOpponent, getValidMoves } from '../game/moves'
import type { Board, Move, Player } from '../game/types'
import { evaluate } from './evaluator'

function compareMoves(a: Move, b: Move): number {
  if (a.row !== b.row) {
    return a.row - b.row
  }
  return a.col - b.col
}

function minimax(
  board: Board,
  currentPlayer: Player,
  perspective: Player,
  depth: number,
  alpha: number,
  beta: number,
): number {
  const currentMoves = getValidMoves(board, currentPlayer)
  const opponent = getOpponent(currentPlayer)

  if (depth <= 0) {
    return evaluate(board, perspective)
  }

  if (currentMoves.length === 0) {
    const opponentMoves = getValidMoves(board, opponent)
    if (opponentMoves.length === 0) {
      return evaluate(board, perspective)
    }

    return minimax(board, opponent, perspective, depth - 1, alpha, beta)
  }

  if (currentPlayer === perspective) {
    let bestScore = Number.NEGATIVE_INFINITY

    for (const move of currentMoves) {
      const next = applyMove(board, currentPlayer, move)
      const score = minimax(next, opponent, perspective, depth - 1, alpha, beta)

      bestScore = Math.max(bestScore, score)
      alpha = Math.max(alpha, score)

      if (beta <= alpha) {
        break
      }
    }

    return bestScore
  }

  let bestScore = Number.POSITIVE_INFINITY

  for (const move of currentMoves) {
    const next = applyMove(board, currentPlayer, move)
    const score = minimax(next, opponent, perspective, depth - 1, alpha, beta)

    bestScore = Math.min(bestScore, score)
    beta = Math.min(beta, score)

    if (beta <= alpha) {
      break
    }
  }

  return bestScore
}

export function searchBestMove(board: Board, player: Player, depth: number): Move | null {
  const moves = getValidMoves(board, player).sort(compareMoves)

  if (moves.length === 0) {
    return null
  }

  let bestMove: Move | null = null
  let bestScore = Number.NEGATIVE_INFINITY

  for (const move of moves) {
    const next = applyMove(board, player, move)
    const score = minimax(
      next,
      getOpponent(player),
      player,
      depth - 1,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    )

    if (
      score > bestScore ||
      (score === bestScore && bestMove !== null && compareMoves(move, bestMove) < 0)
    ) {
      bestScore = score
      bestMove = move
    }

    if (bestMove === null) {
      bestMove = move
      bestScore = score
    }
  }

  return bestMove
}
