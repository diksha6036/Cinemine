import { MovieArtwork } from '../../../components/movies/MovieArtwork'
import { useContext } from 'react'
import { CalendarMoviesContext } from '../CalendarMoviesContext'
import type { ReleaseEvent } from '../types/release'
import { useI18n } from '../../../i18n/LanguageProvider'

export function ReleaseEntry({ event, onSelect, compact = false }: { event: ReleaseEvent; onSelect: (event: ReleaseEvent) => void; compact?: boolean }) {
  const { t, languageName, formatDate } = useI18n()
  const movie = useContext(CalendarMoviesContext).get(event.movieId)
  return <button type="button" className={`release-entry ${compact ? 'compact' : ''}`} onClick={click => { click.stopPropagation(); onSelect(event) }} aria-label={t('Preview {title}', { title: event.title })}>
    {movie && <span className="tiny-poster"><MovieArtwork movie={movie} thumbnail /></span>}
    <span className="release-entry-copy"><strong>{event.title}</strong><span className={`release-badge type-${event.releaseType.toLowerCase().replaceAll(' ', '-')}`}>{t(event.releaseType)}</span>{!compact && <small>{languageName(event.originalLanguage)}{event.date ? ` · ${formatDate(event.date, { day: 'numeric', month: 'short' })}` : ` · ${t('Date to be announced')}`}</small>}</span>
  </button>
}
