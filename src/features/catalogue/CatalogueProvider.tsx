import { useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { SearchMovie } from '../search/types/search'
import { api } from '../../lib/api'
import { CatalogueContext } from './CatalogueContext'
import { useLiveRefresh } from '../../lib/useLiveRefresh'
import { PageDataContext } from '../../app/PageData'

export function CatalogueProvider({ children }: { children: ReactNode }) {
  const page = useContext(PageDataContext)
  const [movies, setMovies] = useState<SearchMovie[]>(page.home?.movies ?? [])
  const [spotlights, setSpotlights] = useState<SearchMovie[]>(page.home?.spotlights ?? [])
  const [spotlightError, setSpotlightError] = useState(page.home?.spotlightError ?? '')
  const [loading, setLoading] = useState(!page.home && !(['/', '/sitemap'].includes(page.pathname) && page.error))
  const [error, setError] = useState(['/', '/sitemap'].includes(page.pathname) ? page.error ?? '' : '')
  const [refreshedAt, setRefreshedAt] = useState(page.home?.refreshedAt ?? '')
  const [generation, setGeneration] = useState(0)
  const reload = useCallback(() => setGeneration(value => value + 1), [])
  useLiveRefresh(reload)
  useEffect(() => {
    if (page.home && generation === 0) return
    const controller = new AbortController()
    let active = true
    setLoading(true); setError('')
    api<{ movies: SearchMovie[]; spotlights: SearchMovie[]; spotlightError: string; refreshedAt: string }>('/api/titles/featured', controller.signal).then(data => { if (active) { setMovies(data.movies); setSpotlights(data.spotlights); setSpotlightError(data.spotlightError); setRefreshedAt(data.refreshedAt) } }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load the collection.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [generation, page.home])
  return <CatalogueContext.Provider value={{ movies, spotlights, spotlightError, loading, error, refreshedAt, reload }}>{children}</CatalogueContext.Provider>
}
