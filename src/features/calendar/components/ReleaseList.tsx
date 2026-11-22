import { ReleaseEntry } from './ReleaseEntry'
import type { ReleaseEvent } from '../types/release'
import { useI18n } from '../../../i18n/LanguageProvider'

export function ReleaseList({ events, onMovie, onDate }: { events: ReleaseEvent[]; onMovie: (event: ReleaseEvent) => void; onDate?: (date: string) => void }) {
  const { t, formatDate } = useI18n()
  const dates = [...new Set(events.map(event => event.date))].sort((a, b) => (a ?? '').localeCompare(b ?? ''))
  return <div className="release-list">{dates.map(date => <section className="release-date-group" key={date ?? 'tba'} aria-label={date ? formatDate(date) : t('Date to be announced')}>{date && <h3>{onDate ? <button type="button" className="text-button" onClick={() => onDate(date)}>{formatDate(date, { weekday: 'short', day: 'numeric', month: 'long' })}</button> : formatDate(date, { weekday: 'short', day: 'numeric', month: 'long' })}</h3>}<div>{events.filter(event => event.date === date).map(event => <ReleaseEntry key={event.eventId} event={event} onSelect={onMovie} />)}</div></section>)}</div>
}
