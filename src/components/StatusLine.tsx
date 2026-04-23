import type { ReactNode } from 'react'

interface StatusLineProps {
  tone?: 'neutral' | 'error'
  children: ReactNode
}

export function StatusLine({ tone = 'neutral', children }: StatusLineProps) {
  return (
    <p
      className={
        tone === 'error'
          ? 'rounded-2xl border border-rose-300/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100'
          : 'rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white/85'
      }
    >
      {children}
    </p>
  )
}
