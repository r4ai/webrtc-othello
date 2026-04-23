import type { ReactNode } from 'react'
import { useOnlineMatch } from './useOnlineMatch'
import { OnlineMatchContext } from './onlineMatchContext'

export type OnlineMatchValue = ReturnType<typeof useOnlineMatch>

export function OnlineMatchProvider({ children }: { children: ReactNode }) {
  const match = useOnlineMatch()
  return <OnlineMatchContext.Provider value={match}>{children}</OnlineMatchContext.Provider>
}
