import { useContext, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Clock, Clapperboard, Globe2, CalendarDays, Layers, Tv } from 'lucide-react'
import { PageDataContext } from '../../app/PageData'
import { PageMetadata } from '../../components/seo/PageMetadata'
import { api } from '../../lib/api'
import { ShareFilmButton } from '../../components/movies/ShareFilmButton'
import { MovieArtwork } from '../../components/movies/MovieArtwork'
import { WhereToWatch } from '../../components/movies/WhereToWatch'
import { Footer } from '../../components/layout/Footer'
import { languageName } from '../../features/search/data/catalogue'
import { useSearch } from '../../features/search/useSearch'
import { mediaKey, mediaLabel, titlePath } from '../../../shared/media.mjs'
import type { SearchMovie } from '../../features/search/types/search'
import type { MediaType } from '../../types/movie'

export function MoviePage({ mediaType = 'movie' }: { mediaType?: MediaType }) {
  const { id = '' } = useParams()
  return <TitleDetail key={`${mediaType}:${id}`} id={id} mediaType={mediaType} />
}

function TitleDetail({ id, mediaType }: { id: string; mediaType: MediaType }) {
  const page = useContext(PageDataContext)
  const initialMovie = page.movie && mediaKey(page.movie) === `${mediaType}:${id}` ? page.movie : null
  const { openSearch } = useSearch()
  const [movie, setMovie] = useState<SearchMovie | null>(initialMovie)
  const [error, setError] = useState(page.pathname === titlePath({ id, mediaType }) ? page.error ?? '' : '')
  const [loading, setLoading] = useState(!initialMovie && !error)
  const [retry, setRetry] = useState(0)
  const series = mediaType === 'tv'
  useEffect(() => {
    if (initialMovie && retry === 0) { setMovie(initialMovie); setLoading(false); return }
    const controller = new AbortController()
    let active = true
    setLoading(true); setError(''); setMovie(null)
    api<{ movie: SearchMovie }>(`/api/titles/details?${new URLSearchParams({ id, mediaType })}`, controller.signal)
      .then(data => { if (active) setMovie(data.movie) })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load this title.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [id, mediaType, retry, initialMovie])
  const runtime = movie?.episodeRuntimeMinutes?.length ? `${movie.episodeRuntimeMinutes[0]}${movie.episodeRuntimeMinutes.length > 1 ? `–${movie.episodeRuntimeMinutes.at(-1)}` : ''} minutes` : movie?.runtimeMinutes ? `${movie.runtimeMinutes} minutes` : 'Not recorded'
  return <><PageMetadata movie={movie} status={error ? (page.status >= 400 ? page.status : 503) : 200} />
    <main id="main-content" className="movie-detail-page page-container">
      <Link className="text-button detail-back" to="/"><ArrowLeft size={16} /> Back to discovery</Link>
      {loading ? <div className="feature-loading" role="status"><span className="loading-orbit" /> Getting to know this title…</div> : error ? <div className="feature-empty" role="alert"><h1>Couldn’t load this title</h1><p>{error}</p><button type="button" className="feature-button" onClick={() => setRetry(value => value + 1)}>Retry</button></div> : movie && <div className="movie-detail-layout">
        <div className="detail-art"><MovieArtwork movie={movie} /></div>
        <div className="detail-copy">
          <p className="feature-eyebrow">{mediaLabel(movie)} · Your next watch</p>
          <h1>{movie.title}{movie.releaseYear && <em>{movie.releaseYear}</em>}</h1>
          <div className="preference-chips">{movie.genres.slice(0, 5).map(genre => <span key={genre}>{genre.replace(/ film$/, '')}</span>)}</div>
          <p className="detail-description">{movie.shortDescription}</p>
          <div className="movie-facts">
            <div><Clapperboard size={17} /><span>{series ? 'Created by' : 'Director'}<strong>{(series ? movie.creators ?? [] : movie.directors).join(', ') || 'Not recorded'}</strong></span></div>
            <div><Clock size={17} /><span>{series ? 'Episode runtime' : 'Runtime'}<strong>{runtime}</strong></span></div>
            <div><Globe2 size={17} /><span>Original language<strong>{movie.originalLanguages.map(languageName).join(', ') || 'Not recorded'}</strong></span></div>
            <div><CalendarDays size={17} /><span>{series ? 'First aired' : 'First recorded release'}<strong>{series ? movie.firstAirDate || 'Not recorded' : movie.releaseYear ?? 'Not recorded'}</strong></span></div>
            {series && <><div><Layers size={17} /><span>Seasons / episodes<strong>{movie.numberOfSeasons ?? 'Unknown'} seasons · {movie.numberOfEpisodes ?? 'Unknown'} episodes</strong></span></div><div><Tv size={17} /><span>Status<strong>{movie.status || 'Not recorded'}</strong></span></div></>}
          </div>
          {series && Boolean(movie.networks?.length) && <p className="detail-networks">Networks: {movie.networks?.join(', ')}</p>}
          <WhereToWatch movieId={movie.id} mediaType={mediaType} />
          <div className="feature-actions"><a className="feature-button primary" href={movie.trailerUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${movie.releaseYear ?? ''} trailer`)}`} target="_blank" rel="noopener noreferrer">{movie.trailerUrl ? 'Watch trailer' : 'Search for trailers'} <ArrowUpRight size={16} /></a><ShareFilmButton movie={movie} /></div>
          <button type="button" className="text-button detail-find" onClick={() => openSearch({ tab: 'similar', referenceMovie: movie })}>Find something with a similar feeling <ArrowUpRight size={16} /></button>
          {series && Boolean(movie.seasons?.length) && <details className="title-extra"><summary>{movie.seasons?.some(season => season.number === 0) ? 'Seasons & specials' : 'Seasons'} ({movie.seasons?.length})</summary><ul className="season-list">{movie.seasons?.map(season => <li key={season.id}><h3>{season.name}</h3><p>{season.episodeCount ?? 'Unknown'} episodes · {season.airDate || 'Air date not recorded'}</p>{season.overview && <p>{season.overview}</p>}</li>)}</ul></details>}
          {Boolean(movie.cast?.length) && <details className="title-extra"><summary>Cast</summary><ul className="title-cast">{movie.cast?.map(person => <li key={person.id}><strong>{person.name}</strong>{person.character && <span>{person.character}</span>}</li>)}</ul></details>}
        </div>
      </div>}
    </main><Footer />
  </>
}
