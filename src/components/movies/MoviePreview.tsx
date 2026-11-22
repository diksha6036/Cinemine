import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { MovieArtwork } from './MovieArtwork'
import { WhereToWatch } from './WhereToWatch'
import { languageName } from '../../features/search/data/catalogue'
import { formatDate } from '../../features/calendar/utils/dates'
import { countries } from '../../features/calendar/data/releases'
import type { SearchMovie } from '../../features/search/types/search'
import type { ReleaseEvent } from '../../features/calendar/types/release'

export function MoviePreview({ movie, event, titleId, onNavigate }: { movie: SearchMovie; event?: ReleaseEvent; titleId: string; onNavigate?: () => void }) {
  return <div className="movie-preview"><div className="preview-poster"><MovieArtwork movie={movie} /></div><div><p className="feature-eyebrow">A closer look</p><h2 id={titleId} tabIndex={-1}>{movie.title}</h2><p className="feature-muted">{movie.releaseYear ?? 'Year not recorded'} · {movie.originalLanguages.map(languageName).join(', ') || 'Language not recorded'}{movie.runtimeMinutes ? ` · ${movie.runtimeMinutes} min` : ''}</p><div className="preference-chips">{movie.genres.slice(0, 5).map(genre => <span key={genre}>{genre.replace(/ film$/, '')}</span>)}</div>{event && <div className="release-preview-info"><span>{countries.find(country => country.code === event.countryCode)?.name ?? event.countryCode}</span><strong>{event.date ? formatDate(event.date) : 'Date to be announced'}</strong><span className={`release-badge type-${event.releaseType.toLowerCase().replaceAll(' ', '-')}`}>{event.releaseType}</span></div>}<h3 className="preview-synopsis-title">About the film</h3><p className="preview-synopsis">{movie.shortDescription}</p>{movie.directors.length > 0 && <p className="feature-muted small-copy">Directed by {movie.directors.join(', ')}</p>}<WhereToWatch movieId={movie.id} countryCode={event?.countryCode} headingLevel="h3" /><div className="feature-actions"><Link className="feature-button primary" to={`/movie/${movie.id}`} onClick={onNavigate}>Explore this film <ArrowUpRight size={15} /></Link></div></div></div>
}
