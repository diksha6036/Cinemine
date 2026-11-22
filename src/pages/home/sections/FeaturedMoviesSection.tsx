import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { MovieCard } from '../../../components/movies/MovieCard'
import { MediaTypeFilter } from '../../../components/movies/MediaTypeFilter'
import { useCatalogue } from '../../../features/catalogue/useCatalogue'
import { api } from '../../../lib/api'
import { mediaKey, titlePath } from '../../../../shared/media.mjs'
import type { MediaFilter } from '../../../types/movie'
import type { SearchMovie } from '../../../features/search/types/search'

export function FeaturedMoviesSection() {
  const catalogue = useCatalogue()
  const [expanded, setExpanded] = useState(false)
  const [mediaType, setMediaType] = useState<MediaFilter>('all')
  const [retry, setRetry] = useState(0)
  const [result, setResult] = useState<{ type: MediaFilter; titles: SearchMovie[]; error?: string } | null>(null)
  useEffect(() => {
    if (mediaType === 'all') return
    const controller = new AbortController()
    let active = true
    setResult(null)
    api<{ titles: SearchMovie[] }>(`/api/titles/trending?${new URLSearchParams({ mediaType })}`, controller.signal)
      .then(data => { if (active) setResult({ type: mediaType, titles: data.titles }) })
      .catch(reason => { if (active) setResult({ type: mediaType, titles: [], error: reason instanceof Error ? reason.message : 'Could not load trending titles.' }) })
    return () => { active = false; controller.abort() }
  }, [mediaType, catalogue.refreshedAt, retry])
  const current = result?.type === mediaType ? result : null
  const movies = mediaType === 'all' ? catalogue.movies : current?.titles ?? []
  const loading = mediaType === 'all' ? catalogue.loading : !current
  const error = mediaType === 'all' ? catalogue.error : current?.error
  return <section id="tonights-picks" className="featured-section page-container" aria-labelledby="picks-heading">
    <div className="section-heading"><div><h2 id="picks-heading">Trending today</h2><p>Movies and series getting attention today</p></div>{movies.length > 5 && <button type="button" className="view-all" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'View all'} <ArrowRight size={20} /></button>}</div>
    <MediaTypeFilter value={mediaType} onChange={value => { setMediaType(value); setExpanded(false) }} />
    {loading ? <div className="feature-loading" role="status"><span className="loading-orbit" /> Loading titles…</div> : error ? <div className="feature-empty" role="alert"><p>{error}</p><button type="button" className="feature-button" onClick={() => { if (mediaType === 'all') catalogue.reload(); else setRetry(value => value + 1) }}>Retry</button></div> : <div className="movie-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">{(expanded ? movies : movies.slice(0, 5)).map(movie => <MovieCard key={mediaKey(movie)} movie={movie} href={titlePath(movie)} />)}</div>}
  </section>
}
