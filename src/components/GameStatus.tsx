import { clsx } from 'clsx'

interface GameStatusProps {
  title: string
  detail: string
  status?: 'playing' | 'finished'
}

export function GameStatus({ title, detail, status = 'playing' }: GameStatusProps) {
  const isFinished = status === 'finished'

  return (
    <section
      aria-live="polite"
      className={clsx(
        'rounded-2xl border p-4 text-white',
        isFinished
          ? 'border-emerald-300/45 bg-gradient-to-br from-emerald-400/20 via-emerald-500/10 to-white/5 shadow-[0_0_0_1px_rgba(52,211,153,0.16)]'
          : 'border-white/20 bg-white/10',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={clsx(
            'text-xs font-semibold tracking-[0.12em]',
            isFinished ? 'text-emerald-100/85' : 'text-white/55',
          )}
        >
          {title}
        </p>
        {isFinished && (
          <span className="rounded-full border border-emerald-200/40 bg-emerald-300/15 px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-emerald-50">
            対局終了
          </span>
        )}
      </div>
      <p className={clsx('mt-1 font-bold', isFinished ? 'text-2xl' : 'text-xl')}>
        {detail}
      </p>
      {isFinished && <p className="mt-2 text-sm text-emerald-50/80">再戦するか、最初からやり直せます。</p>}
    </section>
  )
}
