import { monthCells, formatDate, monthLabel } from '../utils/dates'
import { ReleaseEntry } from './ReleaseEntry'
import type { ReleaseEvent } from '../types/release'

export function MonthCalendar({ year, month, events, today, selected, onDate, onMovie }: { year: number; month: number; events: ReleaseEvent[]; today: string; selected: string | null; onDate: (date: string) => void; onMovie: (event: ReleaseEvent) => void }) {
  const cells = monthCells(year, month)
  return <div className="calendar-scroll" role="region" aria-label="Month calendar; scroll horizontally on small screens" tabIndex={0}><table className="month-calendar"><caption className="sr-only">{monthLabel(year, month)} releases, Monday to Sunday</caption><thead><tr>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <th key={day} scope="col">{day}</th>)}</tr></thead><tbody>
    {Array.from({ length: cells.length / 7 }, (_, row) => <tr key={row}>{cells.slice(row * 7, row * 7 + 7).map((date, index) => {
      const releases = events.filter(event => event.date === date)
      return <td key={date ?? `blank-${row}-${index}`} data-date={date ?? undefined} className={`${date ? 'calendar-day' : 'calendar-blank'} ${date === today ? 'is-today' : ''} ${date && date === selected ? 'is-selected' : ''}`} onClick={date ? () => onDate(date) : undefined}>
        {date && <><button type="button" className="calendar-date" aria-label={`View releases for ${formatDate(date)}`} aria-current={date === today ? 'date' : undefined} aria-pressed={date === selected} onClick={event => { event.stopPropagation(); onDate(date) }}>{Number(date.slice(-2))}{date === today && <span>Today</span>}</button><div className="day-entries">{releases.slice(0, 2).map(event => <ReleaseEntry key={event.eventId} event={event} compact onSelect={onMovie} />)}{releases.length > 2 && <button type="button" className="more-releases" aria-label={`Show all ${releases.length} releases on ${formatDate(date)}`} onClick={event => { event.stopPropagation(); onDate(date) }}>+{releases.length - 2} more</button>}</div></>}
      </td>
    })}</tr>)}
  </tbody></table></div>
}
