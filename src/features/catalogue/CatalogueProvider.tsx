import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { SearchMovie } from '../search/types/search'
import { api } from '../../lib/api'
import { CatalogueContext } from './CatalogueContext'
import { useLiveRefresh } from '../../lib/useLiveRefresh'

export function CatalogueProvider({ children }: { children: ReactNode }) {
  const [movies, setMovies] = useState<SearchMovie[]>([])
  const [spotlights, setSpotlights] = useState<SearchMovie[]>([])
  const [spotlightError, setSpotlightError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshedAt, setRefreshedAt] = useState('')
  const [generation, setGeneration] = useState(0)
  const reload = useCallback(() => setGeneration(value => value + 1), [])
  useLiveRefresh(reload)
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true); setError('')
    api<{ movies: SearchMovie[]; spotlights: SearchMovie[]; spotlightError: string; refreshedAt: string }>('/api/movies/featured', controller.signal).then(data => { if (active) { setMovies(data.movies); setSpotlights(data.spotlights); setSpotlightError(data.spotlightError); setRefreshedAt(data.refreshedAt) } }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load the collection.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [generation])
  return <CatalogueContext.Provider value={{ movies, spotlights, spotlightError, loading, error, refreshedAt, reload }}>{children}</CatalogueContext.Provider>
}
