import { useI18n } from '../../i18n/LanguageProvider'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { MovieArtwork } from './MovieArtwork'
import { WhereToWatch } from './WhereToWatch'
import { mediaKey, mediaLabel, titlePath } from '../../../shared/media.mjs'
import type { SearchMovie } from '../../features/search/types/search'
import type { ReleaseEvent } from '../../features/calendar/types/release'

export function MoviePreview({ movie, event, titleId, onNavigate }: { movie: SearchMovie; event?: ReleaseEvent; titleId: string; onNavigate?: () => void }) {
  const { t, languageName, formatDate, countryName } = useI18n()
  return <div className="movie-preview"><div className="preview-poster"><MovieArtwork key={mediaKey(movie)} movie={movie} /></div><div><p className="feature-eyebrow">{t(mediaLabel(movie))}  {t("· A closer look")}</p><h2 id={titleId} tabIndex={-1}>{movie.title}</h2><p className="feature-muted">{movie.releaseYear ?? t("Year not recorded")} · {movie.originalLanguages.map(languageName).join(', ') || t("Language not recorded")}{movie.runtimeMinutes ? ` · ${t(movie.mediaType === 'tv' ? '{count} min/episode' : '{count} min', { count: movie.runtimeMinutes })}` : ''}</p><div className="preference-chips">{movie.genres.slice(0, 5).map(genre => <span key={genre}>{t(genre.replace(/ film$/, ''))}</span>)}</div>{event && <div className="release-preview-info"><span>{countryName(event.countryCode)}</span><strong>{event.date ? formatDate(event.date) : t('Date to be announced')}</strong><span className={`release-badge type-${event.releaseType.toLowerCase().replaceAll(' ', '-')}`}>{t(event.releaseType)}</span></div>}<h3 className="preview-synopsis-title">{t("About this title")}</h3><p className="preview-synopsis">{t(movie.shortDescription)}</p>{(movie.mediaType === 'tv' ? (movie.creators?.length ?? 0) : movie.directors.length) > 0 && <p className="feature-muted small-copy">{movie.mediaType === 'tv' ? t("Created by") : t("Directed by")} {(movie.mediaType === 'tv' ? movie.creators ?? [] : movie.directors).join(', ')}</p>}<WhereToWatch movieId={movie.id} mediaType={movie.mediaType} countryCode={event?.countryCode} headingLevel="h3" /><div className="feature-actions"><Link className="feature-button primary" to={titlePath(movie)} onClick={onNavigate}>{t("Explore this title")} <ArrowUpRight size={15} /></Link></div></div></div>
}
