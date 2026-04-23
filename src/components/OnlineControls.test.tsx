import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { OnlineControls } from './OnlineControls'

describe('OnlineControls', () => {
  test('dispatches pass and rematch actions, and leaves only after confirmation', async () => {
    const user = userEvent.setup()
    const onPass = vi.fn()
    const onRematch = vi.fn()
    const onLeave = vi.fn()

    render(
      <OnlineControls
        message="あなたの手番です。"
        canPass={true}
        canRequestRematch={true}
        pendingRematch={false}
        peerRequestedRematch={false}
        onPass={onPass}
        onRematch={onRematch}
        onLeave={onLeave}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'パス' }))
    await user.click(screen.getByRole('button', { name: '再戦' }))
    expect(onPass).toHaveBeenCalledTimes(1)
    expect(onRematch).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: '対戦を終了' }))
    expect(await screen.findByRole('heading', { name: '対戦を終了しますか？' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '続ける' }))
    expect(onLeave).not.toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: '対戦を終了しますか？' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '対戦を終了' }))
    await user.click(await screen.findByRole('button', { name: '終了する' }))
    expect(onLeave).toHaveBeenCalledTimes(1)
  })

  test('renders rematch labels for pending and peer-requested states', () => {
    const noop = () => {}
    const { rerender } = render(
      <OnlineControls
        message="再戦待ちです。"
        canPass={false}
        canRequestRematch={true}
        pendingRematch={true}
        peerRequestedRematch={false}
        onPass={noop}
        onRematch={noop}
        onLeave={noop}
      />,
    )

    expect(screen.getByRole('button', { name: '再戦を申請中' })).toBeDisabled()

    rerender(
      <OnlineControls
        message="相手が再戦を希望しています。"
        canPass={false}
        canRequestRematch={true}
        pendingRematch={false}
        peerRequestedRematch={true}
        onPass={noop}
        onRematch={noop}
        onLeave={noop}
      />,
    )

    expect(screen.getByRole('button', { name: '再戦を承認' })).toBeEnabled()
  })
})
