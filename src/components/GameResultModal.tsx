import { clsx } from 'clsx'
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import type { ReactNode } from 'react'
import { Button } from '../ui/Button'

interface GameResultModalProps {
  isOpen: boolean
  title: string
  detail: string
  blackScore: number
  whiteScore: number
  resultTone: 'black' | 'white' | 'draw'
  primaryLabel: string
  secondaryLabel: string
  primaryDisabled?: boolean
  hint?: ReactNode
  onPrimary: () => void
  onSecondary: () => void
}

const toneStyles: Record<GameResultModalProps['resultTone'], { badge: string; panel: string; accent: string }> = {
  black: {
    badge: 'border-sky-300/35 bg-sky-300/10 text-sky-100',
    panel: 'border-sky-300/20 bg-sky-500/10',
    accent: 'from-sky-400/25 via-white/5 to-transparent',
  },
  white: {
    badge: 'border-amber-200/35 bg-amber-300/10 text-amber-50',
    panel: 'border-amber-200/20 bg-amber-400/10',
    accent: 'from-amber-300/25 via-white/5 to-transparent',
  },
  draw: {
    badge: 'border-emerald-200/35 bg-emerald-300/10 text-emerald-50',
    panel: 'border-emerald-200/20 bg-emerald-400/10',
    accent: 'from-emerald-300/25 via-white/5 to-transparent',
  },
}

export function GameResultModal({
  isOpen,
  title,
  detail,
  blackScore,
  whiteScore,
  resultTone,
  primaryLabel,
  secondaryLabel,
  primaryDisabled = false,
  hint,
  onPrimary,
  onSecondary,
}: GameResultModalProps) {
  const style = toneStyles[resultTone]

  return (
    <ModalOverlay
      isOpen={isOpen}
      isDismissable={false}
      className="fixed inset-0 z-50 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.16),transparent_28%),rgba(2,6,23,0.92)] px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-6"
    >
      <Modal className="flex min-h-full items-center justify-center outline-none">
        <Dialog className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950/95 text-white shadow-[0_30px_100px_rgba(0,0,0,0.65)] outline-none">
          <div className={clsx('absolute inset-0 bg-gradient-to-br', style.accent)} aria-hidden="true" />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] lg:p-10">
            <div className="flex flex-col justify-between gap-8">
              <div>
                <p className={clsx('inline-flex rounded-full border px-3 py-1 text-xs font-bold tracking-[0.18em]', style.badge)}>
                  対局終了
                </p>
                <Heading slot="title" className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
                  {title}
                </Heading>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
                  {detail}
                </p>
                {hint && <p className="mt-6 max-w-2xl text-sm text-white/60">{hint}</p>}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onPress={onPrimary} isDisabled={primaryDisabled} className="sm:flex-1">
                  {primaryLabel}
                </Button>
                <Button variant="ghost" onPress={onSecondary} className="sm:flex-1">
                  {secondaryLabel}
                </Button>
              </div>
            </div>

            <div className={clsx('relative overflow-hidden rounded-[1.75rem] border p-5 sm:p-6', style.panel)}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">最終スコア</p>
              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>黒</span>
                    <span>Black</span>
                  </div>
                  <p className="mt-2 text-5xl font-black tracking-tight">{blackScore}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>白</span>
                    <span>White</span>
                  </div>
                  <p className="mt-2 text-5xl font-black tracking-tight">{whiteScore}</p>
                </div>
              </div>

              <p className="mt-6 text-sm leading-7 text-white/70">
                {resultTone === 'draw'
                  ? '互角の勝負でした。もう一戦で決着をつけることもできます。'
                  : '盤面を見直して、次の一局に進む準備をしてください。'}
              </p>
            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}