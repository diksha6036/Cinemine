import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { SearchRequest } from './types/search'
import { SearchContext } from './SearchContext'
import { SearchDialog } from './SearchDialog'

export function SearchProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<SearchRequest | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const openSearch = useCallback((value: SearchRequest = {}) => {
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setRequest(value)
  }, [])
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey || event.key.toLowerCase() !== 'k') return
      const dialog = document.querySelector<HTMLDialogElement>('dialog[open]')
      if (dialog && !request) return
      event.preventDefault()
      if (request) dialog?.querySelector<HTMLInputElement>('input')?.focus()
      else openSearch()
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [openSearch, request])
  return <SearchContext.Provider value={{ openSearch }}>{children}{request && <SearchDialog initial={request} returnFocusTo={trigger.current} onClose={() => setRequest(null)} />}</SearchContext.Provider>
}
