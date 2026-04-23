import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  test('calls onConfirm from the confirm button', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <ConfirmDialog
        isOpen={true}
        title="確認"
        confirmLabel="はい"
        cancelLabel="いいえ"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    )

    expect(screen.queryByText('説明文')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'はい' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  test('calls onCancel from the cancel button', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        isOpen={true}
        title="確認"
        description="説明文"
        confirmLabel="はい"
        cancelLabel="いいえ"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'いいえ' }))

    expect(onCancel).toHaveBeenCalled()
  })
})
