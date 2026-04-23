import type { GameStatus as Status, Player, Winner } from '../game/types'

interface GameStatusProps {
  status: Status
  currentPlayer: Player
  winner: Winner | null
  validMovesCount: number
}

function playerLabel(player: Player): string {
  return player === 'black' ? '黒' : '白'
}

export function GameStatus({
  status,
  currentPlayer,
  winner,
  validMovesCount,
}: GameStatusProps) {
  let title = '対局中'
  let detail = `${playerLabel(currentPlayer)}の番です。`

  if (status === 'finished') {
    title = 'ゲーム終了'
    detail = winner === 'draw' ? '引き分けです。' : `${playerLabel(winner as Player)}の勝ちです。`
  } else if (validMovesCount === 0) {
    detail = `${playerLabel(currentPlayer)}は打てる手がありません。パスしてください。`
  }

  return (
    <section className="rounded-2xl border border-white/20 bg-white/10 p-4 text-white">
      <h2 className="text-sm font-bold uppercase tracking-[0.18em]">{title}</h2>
      <p className="mt-2 text-lg font-semibold">{detail}</p>
    </section>
  )
}
