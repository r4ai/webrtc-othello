import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { Board } from '../components/Board'
import { GameStatus } from '../components/GameStatus'
import { ScoreBoard } from '../components/ScoreBoard'
import { useAI } from '../effects/useAI'
import { useGame } from '../effects/useGame'
import { Button } from '../ui/Button'
import { Toggle } from '../ui/Toggle'
import type { Move, Player, Winner } from '../game/types'

function playerLabel(player: Player): string {
  return player === 'black' ? '黒' : '白'
}

function winnerText(winner: Winner): string {
  return winner === 'draw' ? '引き分けです。' : `${playerLabel(winner)}の勝ちです。`
}

function SoloRoute() {
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

  useEffect(() => {
    if (!canPass) return
    passTurn()
  }, [canPass, passTurn])

  const statusTitle = state.status === 'finished' ? 'ゲーム終了' : '対局中'
  const statusDetail =
    state.status === 'finished'
      ? winnerText(state.winner as Winner)
      : isAiTurn && state.validMoves.length === 0
        ? 'AIが自動でパスします。'
        : isAiTurn
          ? 'AIが考えています...'
          : `${playerLabel(state.currentPlayer)}の番です。`

  const controlsHelperText =
    state.status === 'finished'
      ? '対局が終わりました。最初からやり直せます。'
      : aiEnabled && isAiTurn
        ? 'AIの手番です。入力を待っています。'
        : aiEnabled
          ? 'あなたの番です。'
          : null

  return (
    <section className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
      <div className="w-full rounded-[calc(var(--radius-board)+8px)] border border-white/15 bg-black/25 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm lg:w-120 lg:shrink-0">
        <Board
          board={state.board}
          validMoves={state.validMoves}
          interactive={state.status === 'playing' && !isAiTurn}
          onMove={handleMove}
        />
      </div>

      <aside className="flex w-full flex-col gap-4 rounded-3xl border border-white/15 bg-black/20 p-5 backdrop-blur lg:w-80 lg:shrink-0">
        <ScoreBoard
          black={score.black}
          white={score.white}
          currentPlayer={state.currentPlayer}
        />
        <GameStatus title={statusTitle} detail={statusDetail} />

        <section className="rounded-2xl border border-white/20 bg-white/10 p-4">
          <Toggle label="白をAIで操作" isSelected={aiEnabled} onChange={setAiEnabled} />
        </section>

        <section className="space-y-3 rounded-2xl border border-white/20 bg-white/10 p-4">
          {controlsHelperText && (
            <p className="text-sm text-white/90">{controlsHelperText}</p>
          )}
          <Button variant="secondary" onPress={resetGame}>
            最初から
          </Button>
        </section>
      </aside>
    </section>
  )
}

export const Route = createFileRoute('/solo')({
  component: SoloRoute,
})
