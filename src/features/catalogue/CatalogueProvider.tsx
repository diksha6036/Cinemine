import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { SearchMovie } from '../search/types/search'
import { api } from '../../lib/api'
import { CatalogueContext } from './CatalogueContext'
import { useLiveRefresh } from '../../lib/useLiveRefresh'

export function CatalogueProvider({ children }: { children: ReactNode }) {
  const [movies, setMovies] = useState<SearchMovie[]>([])
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
    api<{ movies: SearchMovie[]; refreshedAt: string }>('/api/movies/featured', controller.signal).then(data => { if (active) { setMovies(data.movies); setRefreshedAt(data.refreshedAt) } }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load the collection.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [generation])
  return <CatalogueContext.Provider value={{ movies, loading, error, refreshedAt, reload }}>{children}</CatalogueContext.Provider>
}
