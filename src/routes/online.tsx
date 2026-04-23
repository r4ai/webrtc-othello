import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Board } from '../components/Board'
import { GameStatus } from '../components/GameStatus'
import { OnlineControls } from '../components/OnlineControls'
import { OnlineSetupPanel } from '../components/OnlineSetupPanel'
import { ScoreBoard } from '../components/ScoreBoard'
import { StatusLine } from '../components/StatusLine'
import { useOnlineMatch } from '../effects/useOnlineMatch'

function OnlineRoute() {
  const navigate = useNavigate()
  const {
    viewModel: online,
    actions: onlineActions,
  } = useOnlineMatch()

  const showMatch = online.connectionState === 'connected'
  const onlineCanPass =
    online.canInteract && online.gameState.status === 'playing' && online.gameState.validMoves.length === 0

  if (!showMatch) {
    return (
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
            navigate({ to: '/' })
          }}
        />
      </>
    )
  }

  return (
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
          onLeave={onlineActions.leaveMatch}
        />
      </aside>
    </section>
  )
}

export const Route = createFileRoute('/online')({
  component: OnlineRoute,
})
