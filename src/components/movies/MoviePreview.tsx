import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { MovieArtwork } from './MovieArtwork'
import { WhereToWatch } from './WhereToWatch'
import { mediaKey, mediaLabel, titlePath } from '../../../shared/media.mjs'
import { languageName } from '../../features/search/data/catalogue'
import { formatDate } from '../../features/calendar/utils/dates'
import { countries } from '../../features/calendar/data/releases'
import type { SearchMovie } from '../../features/search/types/search'
import type { ReleaseEvent } from '../../features/calendar/types/release'

export function MoviePreview({ movie, event, titleId, onNavigate }: { movie: SearchMovie; event?: ReleaseEvent; titleId: string; onNavigate?: () => void }) {
  return <div className="movie-preview"><div className="preview-poster"><MovieArtwork key={mediaKey(movie)} movie={movie} /></div><div><p className="feature-eyebrow">{mediaLabel(movie)} · A closer look</p><h2 id={titleId} tabIndex={-1}>{movie.title}</h2><p className="feature-muted">{movie.releaseYear ?? 'Year not recorded'} · {movie.originalLanguages.map(languageName).join(', ') || 'Language not recorded'}{movie.runtimeMinutes ? ` · ${movie.runtimeMinutes} min${movie.mediaType === 'tv' ? '/episode' : ''}` : ''}</p><div className="preference-chips">{movie.genres.slice(0, 5).map(genre => <span key={genre}>{genre.replace(/ film$/, '')}</span>)}</div>{event && <div className="release-preview-info"><span>{countries.find(country => country.code === event.countryCode)?.name ?? event.countryCode}</span><strong>{event.date ? formatDate(event.date) : 'Date to be announced'}</strong><span className={`release-badge type-${event.releaseType.toLowerCase().replaceAll(' ', '-')}`}>{event.releaseType}</span></div>}<h3 className="preview-synopsis-title">About this title</h3><p className="preview-synopsis">{movie.shortDescription}</p>{(movie.mediaType === 'tv' ? (movie.creators?.length ?? 0) : movie.directors.length) > 0 && <p className="feature-muted small-copy">{movie.mediaType === 'tv' ? 'Created by' : 'Directed by'} {(movie.mediaType === 'tv' ? movie.creators ?? [] : movie.directors).join(', ')}</p>}<WhereToWatch movieId={movie.id} mediaType={movie.mediaType} countryCode={event?.countryCode} headingLevel="h3" /><div className="feature-actions"><Link className="feature-button primary" to={titlePath(movie)} onClick={onNavigate}>Explore this title <ArrowUpRight size={15} /></Link></div></div></div>
}
