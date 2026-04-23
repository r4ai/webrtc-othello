import { countDiscs } from '../game/board'
import { getValidMoves, getOpponent } from '../game/moves'
import type { Board, Player } from '../game/types'

const CORNERS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0, 7],
  [7, 0],
  [7, 7],
]

const EDGE_INDICES = [0, 7]

const WEIGHTS = {
  disc: 1,
  mobility: 8,
  corner: 30,
  edge: 4,
}

function countCorners(board: Board, player: Player): number {
  return CORNERS.reduce((sum, [row, col]) => {
    return sum + (board[row][col] === player ? 1 : 0)
  }, 0)
}

function countEdges(board: Board, player: Player): number {
  let count = 0

  for (let i = 1; i < 7; i += 1) {
    for (const edge of EDGE_INDICES) {
      if (board[edge][i] === player) {
        count += 1
      }
      if (board[i][edge] === player) {
        count += 1
      }
    }
  }

  return count
}

export function evaluate(board: Board, perspective: Player): number {
  const opponent = getOpponent(perspective)
  const discs = countDiscs(board)

  const discScore = discs[perspective] - discs[opponent]
  const mobilityScore =
    getValidMoves(board, perspective).length - getValidMoves(board, opponent).length
  const cornerScore = countCorners(board, perspective) - countCorners(board, opponent)
  const edgeScore = countEdges(board, perspective) - countEdges(board, opponent)

  const score =
    discScore * WEIGHTS.disc +
    mobilityScore * WEIGHTS.mobility +
    cornerScore * WEIGHTS.corner +
    edgeScore * WEIGHTS.edge

  return Object.is(score, -0) ? 0 : score
}
