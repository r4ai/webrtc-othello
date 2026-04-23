import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { Controls } from './Controls'

describe('Controls', () => {
  test('disables pass button when pass is not allowed', () => {
    render(
      <Controls
        canPass={false}
        onPass={() => {}}
        onReset={() => {}}
        aiEnabled={true}
        onToggleAI={() => {}}
        isAiTurn={false}
      />,
    )

    expect(screen.getByRole('button', { name: 'パス' })).toBeDisabled()
  })

  test('toggles ai switch', async () => {
    const onToggleAI = vi.fn()
    const user = userEvent.setup()

    render(
      <Controls
        canPass={true}
        onPass={() => {}}
        onReset={() => {}}
        aiEnabled={true}
        onToggleAI={onToggleAI}
        isAiTurn={false}
      />,
    )

    await user.click(screen.getByRole('switch', { name: '白をAIで操作' }))

    expect(onToggleAI).toHaveBeenCalledWith(false)
  })
})
