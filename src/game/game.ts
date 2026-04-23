import { countDiscs, createInitialBoard, isBoardFull } from './board'
import { applyMove, getOpponent, getValidMoves } from './moves'
import type { Board, GameState, Move, Player, Winner } from './types'

function computeWinner(board: Board): Winner {
  const score = countDiscs(board)

  if (score.black === score.white) {
    return 'draw'
  }

  return score.black > score.white ? 'black' : 'white'
}

function shouldFinishGame(
  board: Board,
  currentPlayerMoves: Move[],
  currentPlayer: Player,
  consecutivePasses: number,
): boolean {
  if (isBoardFull(board) || consecutivePasses >= 2) {
    return true
  }

  if (currentPlayerMoves.length > 0) {
    return false
  }

  const opponentMoves = getValidMoves(board, getOpponent(currentPlayer))
  return opponentMoves.length === 0
}

export function createGameState(
  board: Board,
  currentPlayer: Player,
  consecutivePasses = 0,
): GameState {
  const validMoves = getValidMoves(board, currentPlayer)
  const finished = shouldFinishGame(
    board,
    validMoves,
    currentPlayer,
    consecutivePasses,
  )

  return {
    board,
    currentPlayer,
    validMoves,
    consecutivePasses,
    status: finished ? 'finished' : 'playing',
    winner: finished ? computeWinner(board) : null,
  }
}

export function createInitialGameState(): GameState {
  return createGameState(createInitialBoard(), 'black')
}

export function playTurn(state: GameState, move: Move | null): GameState {
  if (state.status === 'finished') {
    throw new Error('Game is already finished')
  }

  if (move === null) {
    if (state.validMoves.length > 0) {
      throw new Error('Pass is only allowed when there are no valid moves')
    }

    return createGameState(
      state.board,
      getOpponent(state.currentPlayer),
      state.consecutivePasses + 1,
    )
  }

  const nextBoard = applyMove(state.board, state.currentPlayer, move)
  return createGameState(nextBoard, getOpponent(state.currentPlayer), 0)
}
