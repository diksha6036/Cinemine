import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'
import { SearchDialog } from '../features/search/SearchDialog'
import type { SearchRequest } from '../features/search/types/search'

export function FindMyMoviePage() {
  const location = useLocation()
  const [request, setRequest] = useState<{ key: string; initial: SearchRequest } | null>(null)
  useEffect(() => {
    setRequest({ key: location.key, initial: (location.state as { searchRequest?: SearchRequest } | null)?.searchRequest ?? {} })
  }, [location.key, location.state])
  return <><main id="main-content" className="find-movie-page page-container"><SearchDialog key={request?.key ?? 'initial'} initial={request?.initial ?? {}} embedded onClose={() => {}} returnFocusTo={null} /></main><Footer /></>
}
