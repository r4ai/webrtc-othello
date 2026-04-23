import { useCallback, useState } from 'react'
import { Board } from './components/Board'
import { Controls } from './components/Controls'
import { GameStatus } from './components/GameStatus'
import { ScoreBoard } from './components/ScoreBoard'
import { useAI } from './effects/useAI'
import { useGame } from './effects/useGame'
import type { Move } from './game/types'

function App() {
  const { state, score, playMove, passTurn, resetGame } = useGame()
  const [aiEnabled, setAiEnabled] = useState(true)

  const isAiTurn =
    aiEnabled && state.status === 'playing' && state.currentPlayer === 'white'

  const handleMove = useCallback(
    (move: Move) => {
      if (isAiTurn) {
        return
      }

      playMove(move)
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,#2d6a4f_0%,#1b4332_38%,#081c15_100%)] px-4 py-8 text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-white/15 bg-black/20 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
            Classical TDD Othello
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">
            Othello Engine + UI
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-emerald-100/90 md:text-base">
            純粋関数で構築したドメイン層と、React AriaベースのUIを結合した8x8オセロ実装です。
          </p>
        </header>

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
      </div>
    </main>
  )
}

export default App
