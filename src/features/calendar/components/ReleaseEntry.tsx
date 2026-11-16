import { MovieArtwork } from '../../../components/movies/MovieArtwork'
import { languageName } from '../../search/data/catalogue'
import { useContext } from 'react'
import { CalendarMoviesContext } from '../CalendarMoviesContext'
import { formatDate } from '../utils/dates'
import type { ReleaseEvent } from '../types/release'

export function ReleaseEntry({ event, onSelect, compact = false }: { event: ReleaseEvent; onSelect: (event: ReleaseEvent) => void; compact?: boolean }) {
  const movie = useContext(CalendarMoviesContext).get(event.movieId)
  return <button type="button" className={`release-entry ${compact ? 'compact' : ''}`} onClick={click => { click.stopPropagation(); onSelect(event) }} aria-label={`Preview ${event.title}, ${event.releaseType}${event.date ? `, ${formatDate(event.date)}` : ', date to be announced'}`}>
    {movie && <span className="tiny-poster"><MovieArtwork movie={movie} thumbnail /></span>}
    <span className="release-entry-copy"><strong>{event.title}</strong><span className={`release-badge type-${event.releaseType.toLowerCase().replaceAll(' ', '-')}`}>{event.releaseType}</span>{!compact && <small>{languageName(event.originalLanguage)}{event.date ? ` · ${formatDate(event.date, { day: 'numeric', month: 'short' })}` : ' · Date to be announced'}</small>}</span>
  </button>
}
