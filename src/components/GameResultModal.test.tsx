import { render } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { GameResultModal } from './GameResultModal'

describe('GameResultModal', () => {
  test('renders full-screen end state content', () => {
    const onPrimary = vi.fn()
    const onSecondary = vi.fn()

    const { getByText, getByRole } = render(
      <GameResultModal
        isOpen
        title="対局終了"
        detail="白の勝ちです。"
        blackScore={28}
        whiteScore={36}
        resultTone="white"
        primaryLabel="再戦を申し込む"
        secondaryLabel="対戦を終了"
        hint="再戦を申し込むか、対戦を終了できます。"
        onPrimary={onPrimary}
        onSecondary={onSecondary}
      />,
    )

    expect(getByRole('heading', { name: '対局終了' })).toBeInTheDocument()
    expect(getByText('白の勝ちです。')).toBeInTheDocument()
    expect(getByText('最終スコア')).toBeInTheDocument()
    expect(getByText('28')).toBeInTheDocument()
    expect(getByText('36')).toBeInTheDocument()
    expect(getByRole('button', { name: '再戦を申し込む' })).toBeInTheDocument()
    expect(getByRole('button', { name: '対戦を終了' })).toBeInTheDocument()
  })
})