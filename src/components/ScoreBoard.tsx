import { clsx } from 'clsx'
import type { Player } from '../game/types'

interface ScoreBoardProps {
  black: number
  white: number
  currentPlayer: Player
}

function ScoreCard({
  label,
  score,
  active,
  tone,
}: {
  label: string
  score: number
  active: boolean
  tone: 'light' | 'dark'
}) {
  return (
    <div
      className={clsx(
        'rounded-2xl border px-4 py-3 transition',
        tone === 'dark'
          ? 'border-slate-900/70 bg-slate-900 text-slate-50'
          : 'border-slate-200 bg-slate-100 text-slate-900',
        active && tone === 'dark' && 'ring-2 ring-amber-300 ring-offset-2 ring-offset-transparent',
        active && tone === 'light' && 'ring-2 ring-emerald-600 ring-offset-2 ring-offset-transparent',
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{score}</p>
    </div>
  )
}

export function ScoreBoard({ black, white, currentPlayer }: ScoreBoardProps) {
  return (
    <section aria-label="スコア" className="grid grid-cols-2 gap-3">
      <ScoreCard
        label="黒"
        score={black}
        active={currentPlayer === 'black'}
        tone="dark"
      />
      <ScoreCard
        label="白"
        score={white}
        active={currentPlayer === 'white'}
        tone="light"
      />
    </section>
  )
}
