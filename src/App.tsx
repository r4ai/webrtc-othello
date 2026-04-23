import { useCallback, useState } from 'react'
import { Board } from './components/Board'
import { Controls } from './components/Controls'
import { GameStatus } from './components/GameStatus'
import { HomeModePicker } from './components/HomeModePicker'
import { OnlineControls } from './components/OnlineControls'
import { OnlineSetupPanel } from './components/OnlineSetupPanel'
import { ScoreBoard } from './components/ScoreBoard'
import { StatusLine } from './components/StatusLine'
import { useAI } from './effects/useAI'
import { useGame } from './effects/useGame'
import { useOnlineMatch } from './effects/useOnlineMatch'
import type { Move } from './game/types'

type AppMode = 'home' | 'solo' | 'onlineSetup' | 'onlineMatch'

function SoloGame({ onBack }: { onBack: () => void }) {
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
        <ButtonRow onBack={onBack} />
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

function ButtonRow({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-semibold text-white/75 transition hover:text-white"
      >
        モード選択へ戻る
      </button>
    </div>
  )
}

function App() {
  const [mode, setMode] = useState<AppMode>('home')
  const {
    viewModel: online,
    actions: onlineActions,
  } = useOnlineMatch()
  const effectiveMode: AppMode =
    mode === 'onlineSetup' && online.connectionState === 'connected'
      ? 'onlineMatch'
      : mode === 'onlineMatch' &&
          (online.connectionState === 'failed' || online.connectionState === 'disconnected')
        ? 'onlineSetup'
        : mode

  const onlineCanPass =
    online.canInteract && online.gameState.status === 'playing' && online.gameState.validMoves.length === 0

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

        {effectiveMode === 'home' && (
          <HomeModePicker
            onSelectSolo={() => setMode('solo')}
            onSelectOnline={() => setMode('onlineSetup')}
          />
        )}

        {effectiveMode === 'solo' && <SoloGame onBack={() => setMode('home')} />}

        {effectiveMode === 'onlineSetup' && (
          <>
            {online.errorMessage !== null && (
              <StatusLine tone="error">{online.errorMessage}</StatusLine>
            )}
            <OnlineSetupPanel
              connectionState={online.connectionState}
              inviteCode={online.inviteCode}
              requiresAnswerCode={online.requiresAnswerCode}
              onCreateRoom={onlineActions.createRoom}
              onJoinRoom={onlineActions.joinRoom}
              onSubmitAnswerCode={onlineActions.submitAnswerCode}
              onCopyInviteCode={onlineActions.copyInviteCode}
              onBack={() => {
                onlineActions.leaveMatch()
                setMode('home')
              }}
            />
          </>
        )}

        {effectiveMode === 'onlineMatch' && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[calc(var(--radius-board)+8px)] border border-white/15 bg-black/25 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
              <Board
                board={online.gameState.board}
                validMoves={online.gameState.validMoves}
                interactive={online.canInteract}
                onMove={onlineActions.submitMove}
              />
            </div>

            <aside className="flex flex-col gap-4 rounded-3xl border border-white/15 bg-black/20 p-5 backdrop-blur">
              {online.errorMessage !== null ? (
                <StatusLine tone="error">{online.errorMessage}</StatusLine>
              ) : (
                <StatusLine>
                  接続状態: {online.connectionState} / あなたの石: {online.localPlayerLabel}
                </StatusLine>
              )}
              <ScoreBoard
                black={online.score.black}
                white={online.score.white}
                currentPlayer={online.gameState.currentPlayer}
              />
              <GameStatus
                status={online.gameState.status}
                currentPlayer={online.gameState.currentPlayer}
                winner={online.gameState.winner}
                validMovesCount={online.gameState.validMoves.length}
              />
              <OnlineControls
                canPass={onlineCanPass}
                canRequestRematch={online.canRequestRematch}
                pendingRematch={online.pendingRematch}
                peerRequestedRematch={online.peerRequestedRematch}
                onPass={onlineActions.submitPass}
                onRematch={onlineActions.requestRematch}
                onLeave={() => {
                  onlineActions.leaveMatch()
                  setMode('onlineSetup')
                }}
              />
            </aside>
          </section>
        )}
      </div>
    </main>
  )
}

export default App
