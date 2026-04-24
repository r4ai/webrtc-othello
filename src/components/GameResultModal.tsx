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
  onViewBoard: () => void
  onPrimary: () => void
  onSecondary: () => void
}

const toneStyles: Record<GameResultModalProps['resultTone'], { badge: string }> = {
  black: {
    badge: 'border-sky-300/35 bg-sky-300/10 text-sky-100',
  },
  white: {
    badge: 'border-amber-200/35 bg-amber-300/10 text-amber-50',
  },
  draw: {
    badge: 'border-emerald-200/35 bg-emerald-300/10 text-emerald-50',
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
  onViewBoard,
  onPrimary,
  onSecondary,
}: GameResultModalProps) {
  const style = toneStyles[resultTone]

  return (
    <ModalOverlay
      isOpen={isOpen}
      isDismissable={false}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm sm:px-6 sm:py-8"
    >
      <Modal className="w-full max-w-4xl outline-none">
        <Dialog className="rounded-3xl border border-white/15 bg-black/20 p-6 text-white shadow-2xl backdrop-blur outline-none sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <div className="flex flex-col gap-6">
              <div>
                <p className={clsx('inline-flex rounded-full border px-3 py-1 text-xs font-bold tracking-[0.18em]', style.badge)}>
                  対局終了
                </p>
                <Heading slot="title" className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                  {title}
                </Heading>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                  {detail}
                </p>
                {hint && <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">{hint}</p>}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button onPress={onPrimary} isDisabled={primaryDisabled} className="w-full">
                  {primaryLabel}
                </Button>
                <Button variant="secondary" onPress={onViewBoard} className="w-full">
                  盤面を見る
                </Button>
                <Button variant="ghost" onPress={onSecondary} className="w-full sm:col-span-2">
                  {secondaryLabel}
                </Button>
              </div>
            </div>

            <section className="rounded-2xl border border-white/15 bg-white/10 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">最終スコア</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-white shadow-[0_12px_30px_rgba(2,6,23,0.35)]">
                  <div className="flex items-center justify-between px-4 pt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                    <span>黒</span>
                    <span>BLACK</span>
                  </div>
                  <div className="px-4 pb-4 pt-3">
                    <p className="text-4xl font-black tracking-tight">{blackScore}</p>
                    <p className="mt-2 text-sm text-white/65">黒の石の合計</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white text-slate-950 shadow-[0_12px_30px_rgba(255,255,255,0.08)]">
                  <div className="flex items-center justify-between px-4 pt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <span>白</span>
                    <span>WHITE</span>
                  </div>
                  <div className="px-4 pb-4 pt-3">
                    <p className="text-4xl font-black tracking-tight">{whiteScore}</p>
                    <p className="mt-2 text-sm text-slate-500">白の石の合計</p>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-white/60">
                {resultTone === 'draw'
                  ? '引き分けでした。盤面を確認してから次の行動を選べます。'
                  : '勝敗が決まりました。盤面を確認して、次の一手を考えられます。'}
              </p>
            </section>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}