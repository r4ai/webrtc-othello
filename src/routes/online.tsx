import { createFileRoute, Outlet } from '@tanstack/react-router'
import { OnlineMatchProvider } from '../effects/OnlineMatchContext'

function OnlineLayout() {
  return (
    <OnlineMatchProvider>
      <Outlet />
    </OnlineMatchProvider>
  )
}

export const Route = createFileRoute('/online')({
  component: OnlineLayout,
})
