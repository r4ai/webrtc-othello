import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import App from './App'

function renderAt(pathname = '/') {
  window.history.pushState({}, '', pathname)
  return render(<App />)
}

describe('App', () => {
  test('renders mode picker on first view', async () => {
    renderAt('/')

    expect(await screen.findByText('Othello Engine + UI')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'ひとりで遊ぶ' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'オンライン対戦' })).toBeInTheDocument()
  })

  test('enters solo mode and accepts a legal opening move', async () => {
    const user = userEvent.setup()

    renderAt('/')
    await user.click(await screen.findByRole('button', { name: 'ひとりで遊ぶ' }))
    expect(window.location.pathname).toBe('/solo')
    await user.click(await screen.findByLabelText('3行4列 置けます'))

    expect(await screen.findByRole('grid', { name: 'オセロボード' })).toBeInTheDocument()
    expect(await screen.findByText('白の番です。AIが考えています。')).toBeInTheDocument()
  })

  test('supports browser back navigation between routed screens', async () => {
    const user = userEvent.setup()

    renderAt('/')
    await user.click(await screen.findByRole('button', { name: 'ひとりで遊ぶ' }))
    expect(window.location.pathname).toBe('/solo')

    act(() => {
      window.history.back()
    })

    await waitFor(() => {
      expect(window.location.pathname).toBe('/')
      expect(screen.getByRole('button', { name: 'オンライン対戦' })).toBeInTheDocument()
    })
  })
})
