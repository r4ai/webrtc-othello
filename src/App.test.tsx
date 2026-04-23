import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import App from './App'

describe('App', () => {
  test('renders game shell', () => {
    render(<App />)

    expect(screen.getByRole('grid', { name: 'オセロボード' })).toBeInTheDocument()
    expect(screen.getByText('Othello Engine + UI')).toBeInTheDocument()
  })

  test('accepts a legal opening move', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByLabelText('3行4列 置けます'))

    expect(screen.getByText('白の番です。')).toBeInTheDocument()
  })
})
