import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { HomeModePicker } from '../components/HomeModePicker'

function HomeRoute() {
  const navigate = useNavigate()

  return (
    <HomeModePicker
      onSelectSolo={() => navigate({ to: '/solo' })}
      onSelectOnline={() => navigate({ to: '/online' })}
    />
  )
}

export const Route = createFileRoute('/')({
  component: HomeRoute,
})
