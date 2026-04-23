import { createContext, useContext, type ReactNode } from 'react'
import { useOnlineMatch } from './useOnlineMatch'

type OnlineMatchValue = ReturnType<typeof useOnlineMatch>

const OnlineMatchContext = createContext<OnlineMatchValue | null>(null)

export function OnlineMatchProvider({ children }: { children: ReactNode }) {
  const match = useOnlineMatch()
  return <OnlineMatchContext.Provider value={match}>{children}</OnlineMatchContext.Provider>
}

export function useOnlineMatchContext(): OnlineMatchValue {
  const ctx = useContext(OnlineMatchContext)
  if (!ctx) throw new Error('useOnlineMatchContext must be used within OnlineMatchProvider')
  return ctx
}
