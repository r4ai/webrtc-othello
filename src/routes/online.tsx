import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Board } from '../components/Board'
import { GameStatus } from '../components/GameStatus'
import { OnlineControls } from '../components/OnlineControls'
import { OnlineSetupPanel } from '../components/OnlineSetupPanel'
import { ScoreBoard } from '../components/ScoreBoard'
import { StatusLine } from '../components/StatusLine'
import { useOnlineMatch } from '../effects/useOnlineMatch'
import type { Player, Winner } from '../game/types'

function playerLabel(player: Player): string {
  return player === 'black' ? '黒' : '白'
}

function winnerText(winner: Winner): string {
  return winner === 'draw' ? '引き分けです。' : `${playerLabel(winner)}の勝ちです。`
}

function OnlineRoute() {
  const navigate = useNavigate()
  const {
    viewModel: online,
    actions: onlineActions,
  } = useOnlineMatch()

  const showMatch = online.connectionState === 'connected'
  const localPlayer =
    online.localRole === 'host' ? 'black' : online.localRole === 'guest' ? 'white' : null
  const onlineCanPass =
    online.canInteract && online.gameState.status === 'playing' && online.gameState.validMoves.length === 0
  const statusTitle = online.gameState.status === 'finished' ? 'ゲーム終了' : '対局中'
  const statusDetail =
    online.gameState.status === 'finished'
      ? winnerText(online.gameState.winner as Winner)
      : onlineCanPass
        ? `${playerLabel(online.gameState.currentPlayer)}は打てる手がありません。パスしてください。`
        : online.canInteract
          ? `${playerLabel(online.gameState.currentPlayer)}の番です。`
          : `${playerLabel(online.gameState.currentPlayer)}の番です。相手の操作を待っています。`
  const controlsMessage = online.peerRequestedRematch
    ? '相手が再戦を希望しています。再戦を承認できます。'
    : online.pendingRematch
      ? '再戦の返答を待っています。'
      : online.gameState.status === 'finished'
        ? '対局が終わりました。必要なら再戦できます。'
        : onlineCanPass
          ? '打てる手がありません。パスしてください。'
          : online.canInteract
            ? 'あなたの手番です。'
            : localPlayer === null
              ? '接続情報を確認しています。'
              : '相手の手番です。'

  if (!showMatch) {
    return (
      <>
        {online.errorMessage !== null && (
          <StatusLine tone="error">{online.errorMessage}</StatusLine>
        )}
        <OnlineSetupPanel
          localRole={online.localRole}
          connectionState={online.connectionState}
          inviteCode={online.inviteCode}
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
          <StatusLine>接続済み / あなたは{online.localPlayerLabel}です</StatusLine>
        )}
        <ScoreBoard
          black={online.score.black}
          white={online.score.white}
          currentPlayer={online.gameState.currentPlayer}
        />
        <GameStatus
          title={statusTitle}
          detail={statusDetail}
        />
        <OnlineControls
          message={controlsMessage}
          canPass={onlineCanPass}
          canRequestRematch={online.canRequestRematch}
          pendingRematch={online.pendingRematch}
          peerRequestedRematch={online.peerRequestedRematch}
          onPass={onlineActions.submitPass}
          onRematch={onlineActions.requestRematch}
          onLeave={() => {
            onlineActions.leaveMatch()
            navigate({ to: '/' })
          }}
        />
      </aside>
    </section>
  )
}

export const Route = createFileRoute('/online')({
  component: OnlineRoute,
})
