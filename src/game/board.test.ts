import { describe, expect, test } from 'vitest'
import {
  countDiscs,
  createEmptyBoard,
  createInitialBoard,
  isBoardFull,
  isInsideBoard,
} from './board'

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

  test('treats only coordinates inside the 8x8 grid as in-bounds', () => {
    expect(isInsideBoard(0, 0)).toBe(true)
    expect(isInsideBoard(7, 7)).toBe(true)
    expect(isInsideBoard(-1, 0)).toBe(false)
    expect(isInsideBoard(0, -1)).toBe(false)
    expect(isInsideBoard(8, 0)).toBe(false)
    expect(isInsideBoard(0, 8)).toBe(false)
  })

  test('counts black and white discs independently', () => {
    const board = createEmptyBoard()
    board[0][0] = 'black'
    board[0][1] = 'black'
    board[7][7] = 'white'

    expect(countDiscs(board)).toEqual({ black: 2, white: 1 })
  })

  test('detects whether the board still has empty cells', () => {
    const board = createEmptyBoard()
    expect(isBoardFull(board)).toBe(false)

    const fullBoard = board.map(() => Array(8).fill('black'))
    expect(isBoardFull(fullBoard)).toBe(true)
  })
})
