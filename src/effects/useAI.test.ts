import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createGameState } from '../game/game'
import type { Board } from '../game/types'
import { useAI } from './useAI'

function parseBoard(rows: string[]): Board {
  return rows.map((row) =>
    row.split('').map((cell) => {
      if (cell === 'B') return 'black'
      if (cell === 'W') return 'white'
      return null
    }),
  )
}

describe('useAI', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('calls resolver with searched move after delay', () => {
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

    const state = createGameState(board, 'black')
    const onResolveMove = vi.fn()

    renderHook(() =>
      useAI({
        enabled: true,
        aiPlayer: 'black',
        state,
        onResolveMove,
        depth: 3,
        delayMs: 50,
      }),
    )

    expect(onResolveMove).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)

    expect(onResolveMove).toHaveBeenCalledWith({ row: 0, col: 0 })
  })

  test('does not run when disabled', () => {
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

    const state = createGameState(board, 'black')
    const onResolveMove = vi.fn()

    renderHook(() =>
      useAI({
        enabled: false,
        aiPlayer: 'black',
        state,
        onResolveMove,
      }),
    )

    vi.advanceTimersByTime(500)

    expect(onResolveMove).not.toHaveBeenCalled()
  })
})
