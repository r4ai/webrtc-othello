import { describe, expect, test } from 'vitest'
import { createEmptyBoard, createInitialBoard } from './board'

describe('board', () => {
  test('creates an empty 8x8 board', () => {
    const board = createEmptyBoard()

    expect(board).toHaveLength(8)
    expect(board.every((row) => row.length === 8)).toBe(true)
    expect(board.flat().every((cell) => cell === null)).toBe(true)
  })

  test('uses distinct row arrays to avoid accidental shared mutation', () => {
    const board = createEmptyBoard()
    board[0][0] = 'black'

    expect(board[1][0]).toBeNull()
  })

  test('creates the standard initial othello setup', () => {
    const board = createInitialBoard()

    expect(board[3][3]).toBe('white')
    expect(board[4][4]).toBe('white')
    expect(board[3][4]).toBe('black')
    expect(board[4][3]).toBe('black')
  })
})
