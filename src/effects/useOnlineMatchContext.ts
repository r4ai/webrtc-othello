import { useContext } from 'react'
import type { OnlineMatchValue } from './OnlineMatchContext'
import { OnlineMatchContext } from './onlineMatchContext'

export function useOnlineMatchContext(): OnlineMatchValue {
  const ctx = useContext(OnlineMatchContext)
  if (!ctx) throw new Error('useOnlineMatchContext must be used within OnlineMatchProvider')
  return ctx
}
