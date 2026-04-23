import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { Board } from '../components/Board'
import { Controls } from '../components/Controls'
import { GameStatus } from '../components/GameStatus'
import { ScoreBoard } from '../components/ScoreBoard'
import { useAI } from '../effects/useAI'
import { useGame } from '../effects/useGame'
import type { Move } from '../game/types'

function SoloRoute() {
  const navigate = useNavigate()
  const { state, score, playMove, passTurn, resetGame } = useGame()
  const [aiEnabled, setAiEnabled] = useState(true)

  const isAiTurn =
    aiEnabled && state.status === 'playing' && state.currentPlayer === 'white'

  const handleMove = useCallback(
    (move: Move) => {
      if (!isAiTurn) {
        playMove(move)
      }
    },
    [isAiTurn, playMove],
  )

  const handleAiMove = useCallback(
    (move: Move | null) => {
      if (move === null) {
        passTurn()
        return
      }

      playMove(move)
    },
    [passTurn, playMove],
  )

  useAI({
    enabled: aiEnabled,
    aiPlayer: 'white',
    state,
    onResolveMove: handleAiMove,
    depth: 5,
    delayMs: 320,
  })

  const canPass = state.status === 'playing' && state.validMoves.length === 0 && !isAiTurn

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-[calc(var(--radius-board)+8px)] border border-white/15 bg-black/25 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
        <Board
          board={state.board}
          validMoves={state.validMoves}
          interactive={state.status === 'playing' && !isAiTurn}
          onMove={handleMove}
        />
      </div>

      <aside className="flex flex-col gap-4 rounded-3xl border border-white/15 bg-black/20 p-5 backdrop-blur">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate({ to: '/' })}
            className="text-sm font-semibold text-white/75 transition hover:text-white"
          >
            モード選択へ戻る
          </button>
        </div>
        <ScoreBoard
          black={score.black}
          white={score.white}
          currentPlayer={state.currentPlayer}
        />
        <GameStatus
          status={state.status}
          currentPlayer={state.currentPlayer}
          winner={state.winner}
          validMovesCount={state.validMoves.length}
        />
        <Controls
          canPass={canPass}
          onPass={passTurn}
          onReset={resetGame}
          aiEnabled={aiEnabled}
          onToggleAI={setAiEnabled}
          isAiTurn={isAiTurn}
        />
      </aside>
    </section>
  )
}

export const Route = createFileRoute('/solo')({
  component: SoloRoute,
})
