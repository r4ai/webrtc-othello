import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { GameStatus } from './GameStatus'

describe('GameStatus', () => {
  test('matches snapshot while playing', () => {
    const { container } = render(
      <GameStatus
        status="playing"
        currentPlayer="black"
        winner={null}
        validMovesCount={4}
      />,
    )

    expect(container).toMatchSnapshot()
  })

  test('shows winner text for finished game', () => {
    const { getByText } = render(
      <GameStatus
        status="finished"
        currentPlayer="white"
        winner="white"
        validMovesCount={0}
      />,
    )

    expect(getByText('ゲーム終了')).toBeInTheDocument()
    expect(getByText('白の勝ちです。')).toBeInTheDocument()
  })
})
