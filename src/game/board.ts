import { BOARD_SIZE, type Board, type Cell, type Player } from './types'

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array<Cell>(BOARD_SIZE).fill(null),
  )
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice())
}

export function createInitialBoard(): Board {
  const board = createEmptyBoard()
  const mid = BOARD_SIZE / 2

  board[mid - 1][mid - 1] = 'white'
  board[mid][mid] = 'white'
  board[mid - 1][mid] = 'black'
  board[mid][mid - 1] = 'black'

  return board
}

export function isInsideBoard(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

export function countDiscs(board: Board): Record<Player, number> {
  let black = 0
  let white = 0

  for (const row of board) {
    for (const cell of row) {
      if (cell === 'black') {
        black += 1
      }
      if (cell === 'white') {
        white += 1
      }
    }
  }

  return { black, white }
}

export function isBoardFull(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell !== null))
}
