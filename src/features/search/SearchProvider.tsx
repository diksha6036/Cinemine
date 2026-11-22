import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { SearchRequest } from './types/search'
import { SearchContext } from './SearchContext'
import { SearchDialog } from './SearchDialog'
import { useLocation, useNavigate } from 'react-router-dom'
import { MOBILE_LAYOUT_QUERY } from '../../lib/useMobileLayout'

export function SearchProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [request, setRequest] = useState<SearchRequest | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const openSearch = useCallback((value: SearchRequest = {}) => {
    if (window.matchMedia(MOBILE_LAYOUT_QUERY).matches) {
      if (pathname === '/find-my-movie' && !Object.keys(value).length) document.querySelector<HTMLInputElement>('#find-my-movie input')?.focus()
      else void navigate('/find-my-movie', { state: { searchRequest: value } })
      return
    }
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setRequest(value)
  }, [navigate, pathname])
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
