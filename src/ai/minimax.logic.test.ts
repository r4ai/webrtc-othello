import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { Board, Move, Player } from '../game/types'
import { searchBestMove } from './minimax'

type FakeBoard = Board & { __id: string }

const { getValidMoves, applyMove, evaluate } = vi.hoisted(() => ({
  getValidMoves: vi.fn<(board: Board, player: Player) => Move[]>(),
  applyMove: vi.fn<(board: Board, player: Player, move: Move) => Board>(),
  evaluate: vi.fn<(board: Board, perspective: Player) => number>(),
}))

vi.mock('../game/moves', () => ({
  getValidMoves,
  applyMove,
  getOpponent: (player: Player) => (player === 'black' ? 'white' : 'black'),
}))

vi.mock('./evaluator', () => ({
  evaluate,
}))

function board(id: string): FakeBoard {
  return { __id: id } as FakeBoard
}

describe('minimax logic branches', () => {
  beforeEach(() => {
    getValidMoves.mockReset()
    applyMove.mockReset()
    evaluate.mockReset()
  })

  test('uses depth cutoff and lexicographic tie-breaks at the root', () => {
    const root = board('root')
    const leftMove = board('left-move')
    const rightMove = board('right-move')

    getValidMoves.mockImplementation((currentBoard, player) => {
      const id = (currentBoard as FakeBoard).__id

      if (id === 'root' && player === 'black') {
        return [
          { row: 2, col: 6 },
          { row: 2, col: 2 },
        ]
      }

      if ((id === 'left-move' || id === 'right-move') && player === 'white') {
        return []
      }

      return []
    })

    applyMove.mockImplementation((currentBoard, _player, move) => {
      const id = (currentBoard as FakeBoard).__id

      if (id !== 'root') {
        throw new Error(`Unexpected root transition from ${id}`)
      }

      return move.col === 2 ? leftMove : rightMove
    })

    evaluate.mockReturnValue(7)

    expect(searchBestMove(root, 'black', 1)).toEqual({ row: 2, col: 2 })
  })

  test('evaluates terminal nodes when neither player can move', () => {
    const root = board('root')
    const terminal = board('terminal')

    getValidMoves.mockImplementation((currentBoard, player) => {
      const id = (currentBoard as FakeBoard).__id

      if (id === 'root' && player === 'black') {
        return [{ row: 4, col: 4 }]
      }

      if (id === 'terminal') {
        return []
      }

      return []
    })

    applyMove.mockReturnValue(terminal)
    evaluate.mockReturnValue(13)

    expect(searchBestMove(root, 'black', 3)).toEqual({ row: 4, col: 4 })
    expect(evaluate).toHaveBeenCalledWith(terminal, 'black')
  })

  test('skips a turn and continues searching from the same board for the opponent', () => {
    const root = board('root')
    const afterOpening = board('after-opening')
    const afterReply = board('after-reply')

    getValidMoves.mockImplementation((currentBoard, player) => {
      const id = (currentBoard as FakeBoard).__id

      if (id === 'root' && player === 'black') {
        return [{ row: 2, col: 3 }]
      }

      if (id === 'after-opening' && player === 'white') {
        return []
      }

      if (id === 'after-opening' && player === 'black') {
        return [{ row: 5, col: 4 }]
      }

      if (id === 'after-reply') {
        return []
      }

      return []
    })

    applyMove.mockImplementation((currentBoard, player, move) => {
      const id = (currentBoard as FakeBoard).__id

      if (id === 'root' && player === 'black' && move.row === 2 && move.col === 3) {
        return afterOpening
      }

      if (
        id === 'after-opening' &&
        player === 'black' &&
        move.row === 5 &&
        move.col === 4
      ) {
        return afterReply
      }

      throw new Error(`Unexpected transition from ${id}`)
    })

    evaluate.mockReturnValue(21)

    expect(searchBestMove(root, 'black', 3)).toEqual({ row: 2, col: 3 })
    expect(applyMove).toHaveBeenCalledWith(afterOpening, 'black', { row: 5, col: 4 })
  })

  test('explores minimizing replies for the opponent', () => {
    const root = board('root')
    const candidate = board('candidate')
    const punished = board('punished')
    const tolerated = board('tolerated')

    getValidMoves.mockImplementation((currentBoard, player) => {
      const id = (currentBoard as FakeBoard).__id

      if (id === 'root' && player === 'black') {
        return [{ row: 2, col: 3 }]
      }

      if (id === 'candidate' && player === 'white') {
        return [
          { row: 0, col: 1 },
          { row: 7, col: 6 },
        ]
      }

      if ((id === 'punished' || id === 'tolerated') && player === 'black') {
        return []
      }

      return []
    })

    applyMove.mockImplementation((currentBoard, player, move) => {
      const id = (currentBoard as FakeBoard).__id

      if (id === 'root' && player === 'black') {
        return candidate
      }

      if (id === 'candidate' && player === 'white' && move.row === 0) {
        return punished
      }

      if (id === 'candidate' && player === 'white' && move.row === 7) {
        return tolerated
      }

      throw new Error(`Unexpected transition from ${id}`)
    })

    evaluate.mockImplementation((currentBoard) => {
      const id = (currentBoard as FakeBoard).__id
      return id === 'punished' ? -5 : 9
    })

    expect(searchBestMove(root, 'black', 2)).toEqual({ row: 2, col: 3 })
    expect(evaluate).toHaveBeenCalledWith(punished, 'black')
    expect(evaluate).toHaveBeenCalledWith(tolerated, 'black')
  })

  test('falls back to the first move when the score is not comparable', () => {
    const root = board('root')
    const afterMove = board('after-move')

    getValidMoves.mockImplementation((currentBoard, player) => {
      const id = (currentBoard as FakeBoard).__id

      if (id === 'root' && player === 'black') {
        return [{ row: 3, col: 2 }]
      }

      if (id === 'after-move' && player === 'white') {
        return []
      }

      return []
    })

    applyMove.mockReturnValue(afterMove)
    evaluate.mockReturnValue(Number.NaN)

    expect(searchBestMove(root, 'black', 1)).toEqual({ row: 3, col: 2 })
  })

  test('prunes maximizing branches when alpha reaches beta', () => {
    const root = board('root')
    const minimizing = board('minimizing')
    const settled = board('settled')
    const maximizing = board('maximizing')
    const winningLeaf = board('winning-leaf')

    getValidMoves.mockImplementation((currentBoard, player) => {
      const id = (currentBoard as FakeBoard).__id

      if (id === 'root' && player === 'black') {
        return [{ row: 2, col: 3 }]
      }

      if (id === 'minimizing' && player === 'white') {
        return [
          { row: 0, col: 0 },
          { row: 7, col: 7 },
        ]
      }

      if (id === 'settled' && player === 'black') {
        return []
      }

      if (id === 'maximizing' && player === 'black') {
        return [
          { row: 1, col: 1 },
          { row: 6, col: 6 },
        ]
      }

      if (id === 'winning-leaf' && player === 'white') {
        return []
      }

      return []
    })

    applyMove.mockImplementation((currentBoard, player, move) => {
      const id = (currentBoard as FakeBoard).__id

      if (id === 'root' && player === 'black') {
        return minimizing
      }

      if (id === 'minimizing' && player === 'white' && move.row === 0) {
        return settled
      }

      if (id === 'minimizing' && player === 'white' && move.row === 7) {
        return maximizing
      }

      if (id === 'maximizing' && player === 'black' && move.row === 1) {
        return winningLeaf
      }

      throw new Error(`Unexpected transition from ${id}`)
    })

    evaluate.mockImplementation((currentBoard) => {
      const id = (currentBoard as FakeBoard).__id
      return id === 'settled' ? 10 : 12
    })

    expect(searchBestMove(root, 'black', 4)).toEqual({ row: 2, col: 3 })
    expect(applyMove).not.toHaveBeenCalledWith(maximizing, 'black', { row: 6, col: 6 })
  })

  test('prunes minimizing branches when beta drops below alpha', () => {
    const root = board('root')
    const forcedReply = board('forced-reply')
    const maximizing = board('maximizing')
    const strongLeaf = board('strong-leaf')
    const minimizing = board('minimizing')
    const weakLeaf = board('weak-leaf')

    getValidMoves.mockImplementation((currentBoard, player) => {
      const id = (currentBoard as FakeBoard).__id

      if (id === 'root' && player === 'black') {
        return [{ row: 2, col: 3 }]
      }

      if (id === 'forced-reply' && player === 'white') {
        return [{ row: 4, col: 5 }]
      }

      if (id === 'maximizing' && player === 'black') {
        return [
          { row: 1, col: 1 },
          { row: 6, col: 6 },
        ]
      }

      if (id === 'strong-leaf' && player === 'white') {
        return []
      }

      if (id === 'minimizing' && player === 'white') {
        return [
          { row: 0, col: 0 },
          { row: 7, col: 7 },
        ]
      }

      if (id === 'weak-leaf' && player === 'black') {
        return []
      }

      return []
    })

    applyMove.mockImplementation((currentBoard, player, move) => {
      const id = (currentBoard as FakeBoard).__id

      if (id === 'root' && player === 'black') {
        return forcedReply
      }

      if (id === 'forced-reply' && player === 'white') {
        return maximizing
      }

      if (id === 'maximizing' && player === 'black' && move.row === 1) {
        return strongLeaf
      }

      if (id === 'maximizing' && player === 'black' && move.row === 6) {
        return minimizing
      }

      if (id === 'minimizing' && player === 'white' && move.row === 0) {
        return weakLeaf
      }

      throw new Error(`Unexpected transition from ${id}`)
    })

    evaluate.mockImplementation((currentBoard) => {
      const id = (currentBoard as FakeBoard).__id
      return id === 'strong-leaf' ? 10 : 8
    })

    expect(searchBestMove(root, 'black', 5)).toEqual({ row: 2, col: 3 })
    expect(applyMove).not.toHaveBeenCalledWith(minimizing, 'white', { row: 7, col: 7 })
  })
})
