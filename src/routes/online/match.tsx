import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Board } from '../../components/Board'
import { GameStatus } from '../../components/GameStatus'
import { OnlineControls } from '../../components/OnlineControls'
import { ScoreBoard } from '../../components/ScoreBoard'
import { StatusLine } from '../../components/StatusLine'
import { useOnlineMatchContext } from '../../effects/useOnlineMatchContext'
import type { Player, Winner } from '../../game/types'

function playerLabel(player: Player): string {
  return player === 'black' ? '黒' : '白'
}

function winnerText(winner: Winner): string {
  return winner === 'draw' ? '引き分けです。' : `${playerLabel(winner)}の勝ちです。`
}

function MatchRoute() {
  const { viewModel: online, actions } = useOnlineMatchContext()
  const navigate = useNavigate()

  const [initialConnectionState] = useState(online.connectionState)
  useEffect(() => {
    if (initialConnectionState !== 'connected') {
      navigate({ to: '/online', replace: true })
    }
  }, [initialConnectionState, navigate])

  const localPlayer =
    online.localRole === 'host' ? 'black' : online.localRole === 'guest' ? 'white' : null
  const onlineCanPass =
    online.canInteract &&
    online.gameState.status === 'playing' &&
    online.gameState.validMoves.length === 0
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

  return (
    <section className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
      <div className="w-full rounded-[calc(var(--radius-board)+8px)] border border-white/15 bg-black/25 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm lg:w-120 lg:shrink-0">
        <Board
          board={online.gameState.board}
          validMoves={online.gameState.validMoves}
          interactive={online.canInteract}
          onMove={actions.submitMove}
        />
      </div>

      <aside className="flex w-full flex-col gap-4 rounded-3xl border border-white/15 bg-black/20 p-5 backdrop-blur lg:w-80 lg:shrink-0">
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
        <GameStatus title={statusTitle} detail={statusDetail} />
        <OnlineControls
          message={controlsMessage}
          canPass={onlineCanPass}
          canRequestRematch={online.canRequestRematch}
          pendingRematch={online.pendingRematch}
          peerRequestedRematch={online.peerRequestedRematch}
          onPass={actions.submitPass}
          onRematch={actions.requestRematch}
          onLeave={() => {
            actions.leaveMatch()
            navigate({ to: '/' })
          }}
        />
      </aside>
    </section>
  )
}

export const Route = createFileRoute('/online/match')({
  component: MatchRoute,
})
