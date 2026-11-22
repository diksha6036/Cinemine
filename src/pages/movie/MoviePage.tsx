import { useI18n } from '../../i18n/LanguageProvider'
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
import { useSearch } from '../../features/search/useSearch'
import { mediaKey, mediaLabel, titlePath } from '../../../shared/media.mjs'
import type { SearchMovie } from '../../features/search/types/search'
import type { MediaType } from '../../types/movie'

export function MoviePage({ mediaType = 'movie' }: { mediaType?: MediaType }) {
  const { id = '' } = useParams()
  return <TitleDetail key={`${mediaType}:${id}`} id={id} mediaType={mediaType} />
}

function TitleDetail({ id, mediaType }: { id: string; mediaType: MediaType }) {
  const { t, languageName, formatDate } = useI18n()
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
  const runtime = movie?.episodeRuntimeMinutes?.length ? t('{count} minutes', { count: `${movie.episodeRuntimeMinutes[0]}${movie.episodeRuntimeMinutes.length > 1 ? `–${movie.episodeRuntimeMinutes.at(-1)}` : ''}` }) : movie?.runtimeMinutes ? t('{count} minutes', { count: movie.runtimeMinutes }) : t("Not recorded")
  return <><PageMetadata movie={movie} status={error ? (page.status >= 400 ? page.status : 503) : 200} />
    <main id="main-content" className="movie-detail-page page-container">
      <Link className="text-button detail-back" to="/"><ArrowLeft size={16} />  {t("Back to discovery")}</Link>
      {loading ? <div className="feature-loading" role="status"><span className="loading-orbit" />  {t("Getting to know this title…")}</div> : error ? <div className="feature-empty" role="alert"><h1>{t("Couldn’t load this title")}</h1><p>{t(error)}</p><button type="button" className="feature-button" onClick={() => setRetry(value => value + 1)}>{t("Retry")}</button></div> : movie && <div className="movie-detail-layout">
        <div className="detail-art"><MovieArtwork movie={movie} /></div>
        <div className="detail-copy">
          <p className="feature-eyebrow">{t(mediaLabel(movie))}  {t("· Your next watch")}</p>
          <h1>{movie.title}{movie.releaseYear && <em>{movie.releaseYear}</em>}</h1>
          <div className="preference-chips">{movie.genres.slice(0, 5).map(genre => <span key={genre}>{t(genre.replace(/ film$/, ''))}</span>)}</div>
          <p className="detail-description">{t(movie.shortDescription)}</p>
          <div className="movie-facts">
            <div><Clapperboard size={17} /><span>{series ? t("Created by") : t("Director")}<strong>{(series ? movie.creators ?? [] : movie.directors).join(', ') || t("Not recorded")}</strong></span></div>
            <div><Clock size={17} /><span>{series ? t("Episode runtime") : t("Runtime")}<strong>{runtime}</strong></span></div>
            <div><Globe2 size={17} /><span>{t("Original language")}<strong>{movie.originalLanguages.map(languageName).join(', ') || t("Not recorded")}</strong></span></div>
            <div><CalendarDays size={17} /><span>{series ? t("First aired") : t("First recorded release")}<strong>{series ? movie.firstAirDate ? formatDate(movie.firstAirDate) : t("Not recorded") : movie.releaseYear ?? t("Not recorded")}</strong></span></div>
            {series && <><div><Layers size={17} /><span>{t("Seasons / episodes")}<strong>{t('{count} seasons · {episodes} episodes', { count: movie.numberOfSeasons ?? t('Unknown'), episodes: movie.numberOfEpisodes ?? t('Unknown') })}</strong></span></div><div><Tv size={17} /><span>{t("Status")}<strong>{t(movie.status || 'Not recorded')}</strong></span></div></>}
          </div>
          {series && Boolean(movie.networks?.length) && <p className="detail-networks">{t('Networks: {names}', { names: movie.networks?.join(', ') ?? '' })}</p>}
          <WhereToWatch movieId={movie.id} mediaType={mediaType} />
          <div className="feature-actions"><a className="feature-button primary" href={movie.trailerUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${movie.releaseYear ?? ''} trailer`)}`} target="_blank" rel="noopener noreferrer">{movie.trailerUrl ? t("Watch trailer") : t("Search for trailers")} <ArrowUpRight size={16} /></a><ShareFilmButton movie={movie} /></div>
          <button type="button" className="text-button detail-find" onClick={() => openSearch({ tab: 'similar', referenceMovie: movie })}>{t("Find something with a similar feeling")} <ArrowUpRight size={16} /></button>
          {series && Boolean(movie.seasons?.length) && <details className="title-extra"><summary>{movie.seasons?.some(season => season.number === 0) ? t("Seasons & specials") : t("Seasons")} ({movie.seasons?.length})</summary><ul className="season-list">{movie.seasons?.map(season => <li key={season.id}><h3>{season.name}</h3><p>{t('{count} episodes', { count: season.episodeCount ?? t('Unknown') })} · {season.airDate ? formatDate(season.airDate) : t('Air date not recorded')}</p>{season.overview && <p>{season.overview}</p>}</li>)}</ul></details>}
          {Boolean(movie.cast?.length) && <details className="title-extra"><summary>{t("Cast")}</summary><ul className="title-cast">{movie.cast?.map(person => <li key={person.id}><strong>{person.name}</strong>{person.character && <span>{person.character}</span>}</li>)}</ul></details>}
        </div>
      </div>}
    </main><Footer />
  </>
}
