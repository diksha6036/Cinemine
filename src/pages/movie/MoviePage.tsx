import { useContext, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Clock, Clapperboard, Globe2, CalendarDays } from 'lucide-react'
import { PageDataContext } from '../../app/PageData'
import { PageMetadata } from '../../components/seo/PageMetadata'
import { api } from '../../lib/api'
import { ShareFilmButton } from '../../components/movies/ShareFilmButton'
import { MovieArtwork } from '../../components/movies/MovieArtwork'
import { Footer } from '../../components/layout/Footer'
import { languageName } from '../../features/search/data/catalogue'
import { useSearch } from '../../features/search/useSearch'
import type { SearchMovie } from '../../features/search/types/search'

export function MoviePage() {
  const { id } = useParams()
  const page = useContext(PageDataContext)
  const initialMovie = page.movie && page.movie.id === id ? page.movie : null
  const { openSearch } = useSearch()
  const [movie, setMovie] = useState<SearchMovie | null>(initialMovie)
  const [error, setError] = useState(page.pathname === `/movie/${id}` ? page.error ?? '' : '')
  const [loading, setLoading] = useState(!initialMovie && !error)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (initialMovie && retry === 0) { setMovie(initialMovie); setLoading(false); return }
    const controller = new AbortController()
    let active = true
    setLoading(true); setError(''); setMovie(null)
    api<{ movie: SearchMovie }>(`/api/movies/${encodeURIComponent(id ?? '')}`, controller.signal).then(data => { if (active) { setMovie(data.movie) } }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load this film.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [id, retry, initialMovie])
  return <><PageMetadata movie={movie?.id === id ? movie : null} status={error ? (page.status >= 400 ? page.status : 503) : 200} /><main id="main-content" className="movie-detail-page page-container"><Link className="text-button detail-back" to="/"><ArrowLeft size={16} /> Back to discovery</Link>{loading ? <div className="feature-loading" role="status"><span className="loading-orbit" /> Getting to know this film…</div> : error ? <div className="feature-empty" role="alert"><h1>Couldn’t load this film</h1><p>{error}</p><button type="button" className="feature-button" onClick={() => setRetry(value => value + 1)}>Retry</button></div> : movie && <><div className="movie-detail-layout"><div className="detail-art"><MovieArtwork movie={movie} /></div><div className="detail-copy"><p className="feature-eyebrow">THE NEXT CHAPTER OF YOUR MOVIE NIGHT</p><h1>{movie.title}<em>{movie.releaseYear}</em></h1><div className="preference-chips">{movie.genres.slice(0, 5).map(genre => <span key={genre}>{genre.replace(/ film$/, '')}</span>)}</div><p className="detail-description">{movie.shortDescription}</p><div className="movie-facts"><div><Clapperboard size={17} /><span>Director<strong>{movie.directors.join(', ') || 'Not recorded'}</strong></span></div><div><Clock size={17} /><span>Runtime<strong>{movie.runtimeMinutes ? `${movie.runtimeMinutes} minutes` : 'Not recorded'}</strong></span></div><div><Globe2 size={17} /><span>Original languages<strong>{movie.originalLanguages.map(languageName).join(', ') || 'Not recorded'}</strong></span></div><div><CalendarDays size={17} /><span>First recorded release<strong>{movie.releaseYear ?? 'Not recorded'}</strong></span></div></div><div className="feature-actions"><a className="feature-button primary" href={movie.trailerUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${movie.releaseYear ?? ''} trailer`)}`} target="_blank" rel="noopener noreferrer">{movie.trailerUrl ? 'Watch trailer' : 'Search for trailers'} <ArrowUpRight size={16} /></a><ShareFilmButton movie={movie} /></div><button type="button" className="text-button detail-find" onClick={() => openSearch({ tab: 'similar', referenceMovie: movie })}>Find something with a similar feeling <ArrowUpRight size={16} /></button></div></div></>}</main><Footer /></>
}
