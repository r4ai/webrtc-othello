import { describe, expect, test } from 'vitest'
import { createGameState, createInitialGameState, playTurn } from './game'
import type { Board } from './types'

function parseBoard(rows: string[]): Board {
  return rows.map((row) =>
    row.split('').map((cell) => {
      if (cell === 'B') return 'black'
      if (cell === 'W') return 'white'
      return null
    }),
  )
}

describe('game', () => {
  test('creates initial game state', () => {
    const state = createInitialGameState()

    expect(state.currentPlayer).toBe('black')
    expect(state.status).toBe('playing')
    expect(state.validMoves).toHaveLength(4)
  })

  test('switches turn after a valid move', () => {
    const state = createInitialGameState()
    const next = playTurn(state, { row: 2, col: 3 })

    expect(next.currentPlayer).toBe('white')
    expect(next.board[3][3]).toBe('black')
    expect(next.consecutivePasses).toBe(0)
  })

  test('allows pass only when no valid moves', () => {
    const board = parseBoard([
      '.BWWWWWW',
      'WWWWWWWW',
      'WWWWWWWW',
      'WWWWWWWW',
      'WWWWWWWW',
      'WWWWWWWW',
      'WWWWWWWW',
      'WWWWWWWW',
    ])

    const state = createGameState(board, 'black')
    expect(state.validMoves).toEqual([])

    const afterPass = playTurn(state, null)
    expect(afterPass.currentPlayer).toBe('white')
    expect(afterPass.validMoves).toEqual([{ row: 0, col: 0 }])
  })

  test('finishes game and decides winner', () => {
    const board = parseBoard([
      '.BWWWWWW',
      'WWWWWWWW',
      'WWWWWWWW',
      'WWWWWWWW',
      'WWWWWWWW',
      'WWWWWWWW',
      'WWWWWWWW',
      'WWWWWWWW',
    ])

    const state = createGameState(board, 'black')
    const afterPass = playTurn(state, null)
    const finished = playTurn(afterPass, { row: 0, col: 0 })

    expect(finished.status).toBe('finished')
    expect(finished.winner).toBe('white')
  })

  test('returns draw winner when counts are equal on full board', () => {
    const board = parseBoard([
      'BWBWBWBW',
      'WBWBWBWB',
      'BWBWBWBW',
      'WBWBWBWB',
      'BWBWBWBW',
      'WBWBWBWB',
      'BWBWBWBW',
      'WBWBWBWB',
    ])

    const state = createGameState(board, 'black')

    expect(state.status).toBe('finished')
    expect(state.winner).toBe('draw')
  })

  test('throws when trying to play after game is finished', () => {
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

    const finished = createGameState(board, 'white')
    expect(() => playTurn(finished, null)).toThrow()
  })
})
