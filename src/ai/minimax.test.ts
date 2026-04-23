import { describe, expect, test } from 'vitest'
import type { Board } from '../game/types'
import { searchBestMove } from './minimax'

function parseBoard(rows: string[]): Board {
  return rows.map((row) =>
    row.split('').map((cell) => {
      if (cell === 'B') return 'black'
      if (cell === 'W') return 'white'
      return null
    }),
  )
}

describe('minimax', () => {
  test('returns null when no valid moves exist', () => {
    const board = parseBoard([
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
    ])

    expect(searchBestMove(board, 'white', 3)).toBeNull()
  })

  test('selects the known best move at depth 1, 3, and 5', () => {
    const board = parseBoard([
      '.WBBBBBB',
      'WWWWWWWB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBB.',
    ])

    expect(searchBestMove(board, 'black', 1)).toEqual({ row: 0, col: 0 })
    expect(searchBestMove(board, 'black', 3)).toEqual({ row: 0, col: 0 })
    expect(searchBestMove(board, 'black', 5)).toEqual({ row: 0, col: 0 })
  })
})
