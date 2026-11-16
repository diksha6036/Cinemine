import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { SearchRequest } from './types/search'
import { SearchContext } from './SearchContext'
import { SearchDialog } from './SearchDialog'

export function SearchProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<SearchRequest | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
  function openSearch(value: SearchRequest = {}) {
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setRequest(value)
  }
  return <SearchContext.Provider value={{ openSearch }}>{children}{request && <SearchDialog initial={request} returnFocusTo={trigger.current} onClose={() => setRequest(null)} />}</SearchContext.Provider>
}
