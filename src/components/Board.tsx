import { useMemo } from 'react'
import type { Board as BoardState, Move } from '../game/types'
import { Cell } from './Cell'

interface BoardProps {
  board: BoardState
  validMoves: Move[]
  interactive: boolean
  onMove: (move: Move) => void
}

export function Board({ board, validMoves, interactive, onMove }: BoardProps) {
  const validMoveSet = useMemo(() => {
    return new Set(validMoves.map((move) => `${move.row}-${move.col}`))
  }, [validMoves])

  return (
    <div
      role="grid"
      aria-label="オセロボード"
      className="grid w-full max-w-170 grid-cols-8 gap-1 rounded-(--radius-board) bg-(--color-board-dark) p-2"
    >
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const key = `${rowIndex}-${colIndex}`
          const canPlace = validMoveSet.has(key)

          return (
            <Cell
              key={key}
              row={rowIndex}
              col={colIndex}
              value={cell}
              canPlace={canPlace}
              isEnabled={interactive && canPlace}
              onSelect={onMove}
            />
          )
        }),
      )}
    </div>
  )
}
