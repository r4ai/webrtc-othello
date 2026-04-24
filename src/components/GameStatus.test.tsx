import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { GameStatus } from './GameStatus'

describe('GameStatus', () => {
  test('renders title and detail', () => {
    const { container } = render(
      <GameStatus
        title="対局中"
        detail="黒の番です。"
      />,
    )

    expect(container).toHaveTextContent('対局中')
    expect(container).toHaveTextContent('黒の番です。')
  })

  test('shows supplied finished message', () => {
    const { getByText } = render(
      <GameStatus
        title="ゲーム終了"
        detail="白の勝ちです。"
        status="finished"
      />,
    )

    expect(getByText('ゲーム終了')).toBeInTheDocument()
    expect(getByText('白の勝ちです。')).toBeInTheDocument()
    expect(getByText('対局終了')).toBeInTheDocument()
    expect(getByText('再戦するか、最初からやり直せます。')).toBeInTheDocument()
  })
})
