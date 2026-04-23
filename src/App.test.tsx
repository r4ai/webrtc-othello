import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import App from './App'

describe('App', () => {
  test('renders mode picker on first view', () => {
    render(<App />)

    expect(screen.getByText('Othello Engine + UI')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ひとりで遊ぶ' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'オンライン対戦' })).toBeInTheDocument()
  })

  test('enters solo mode and accepts a legal opening move', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: 'ひとりで遊ぶ' }))
    await user.click(screen.getByLabelText('3行4列 置けます'))

    expect(screen.getByRole('grid', { name: 'オセロボード' })).toBeInTheDocument()
    expect(screen.getByText('白の番です。')).toBeInTheDocument()
  })
})
