import { describe, expect, test } from 'vitest'
import { createInitialBoard } from '../game/board'
import { getValidMoves } from '../game/moves'
import type { Board } from '../game/types'
import { evaluate } from './evaluator'

function parseBoard(rows: string[]): Board {
  return rows.map((row) =>
    row.split('').map((cell) => {
      if (cell === 'B') return 'black'
      if (cell === 'W') return 'white'
      return null
    }),
  )
}

describe('evaluator', () => {
  test('is anti-symmetric between players', () => {
    const board = createInitialBoard()

    expect(evaluate(board, 'black') + evaluate(board, 'white')).toBe(0)
  })

  test('prefers corner ownership over non-corner ownership', () => {
    const cornerBoard = parseBoard([
      'B.......',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
    ])

    const nonCornerBoard = parseBoard([
      '.B......',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
    ])

    expect(evaluate(cornerBoard, 'black')).toBeGreaterThan(
      evaluate(nonCornerBoard, 'black'),
    )
  })

  test('rewards mobility advantage', () => {
    const mobilityBoard = parseBoard([
      '........',
      '........',
      '..WWW...',
      '..WBW...',
      '..WWW...',
      '........',
      '........',
      '........',
    ])

    expect(getValidMoves(mobilityBoard, 'black').length).toBeGreaterThan(
      getValidMoves(mobilityBoard, 'white').length,
    )
    expect(evaluate(mobilityBoard, 'black')).toBeGreaterThan(
      evaluate(mobilityBoard, 'white'),
    )
  })
})
