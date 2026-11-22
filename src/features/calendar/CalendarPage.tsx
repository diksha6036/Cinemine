import { useCallback, useContext, useEffect, useId, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, LayoutList, Search, SlidersHorizontal, X } from 'lucide-react'
import { Dialog } from '../../components/ui/Dialog'
import { MoviePreview } from '../../components/movies/MoviePreview'
import { Footer } from '../../components/layout/Footer'
import { countries, releaseTypes } from './data/releases'
import { genreOptions, languageOptions } from '../search/data/catalogue'
import { dateKey, dateParts, daysInMonth, formatDate, monthLabel, shiftMonth, todayKey } from './utils/dates'
import { MonthCalendar } from './components/MonthCalendar'
import { ReleaseList } from './components/ReleaseList'
import { ReleaseEntry } from './components/ReleaseEntry'
import { api } from '../../lib/api'
import { CalendarMoviesContext } from './CalendarMoviesContext'
import type { SearchMovie } from '../search/types/search'
import type { ReleaseEvent } from './types/release'
import { useLiveRefresh } from '../../lib/useLiveRefresh'
import { PageDataContext } from '../../app/PageData'

export function CalendarPage() {
  const titleId = useId()
  const page = useContext(PageDataContext)
  const [today, setToday] = useState(page.today ?? todayKey())
  const [visible, setVisible] = useState(() => dateParts(today))
  useEffect(() => {
    const current = todayKey()
    setToday(current)
    if (current.slice(0, 7) !== today.slice(0, 7)) setVisible(dateParts(current))
    const timer = window.setInterval(() => setToday(todayKey()), 60000)
    return () => window.clearInterval(timer)
    // Bootstrap dates keep server/client markup identical, then follow local time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [view, setView] = useState<'month' | 'list'>('month')
  useEffect(() => { if (window.matchMedia('(max-width: 760px)').matches) setView('list') }, [])
  const [country, setCountry] = useState('IN')
  const [genre, setGenre] = useState('')
  const [language, setLanguage] = useState('')
  const [releaseType, setReleaseType] = useState('')
  const [releaseEvents, setReleaseEvents] = useState<ReleaseEvent[]>([])
  const [releaseMovies, setReleaseMovies] = useState<SearchMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [refreshedAt, setRefreshedAt] = useState('')
  const [refresh, setRefresh] = useState(0)
  const refreshDates = useCallback(() => setRefresh(value => value + 1), [])
  useLiveRefresh(refreshDates)
  const movieById = useMemo(() => new Map(releaseMovies.map(movie => [movie.id, movie])), [releaseMovies])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [preview, setPreview] = useState<ReleaseEvent | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true); setError(''); setWarning(''); setRefreshedAt(''); setReleaseEvents([]); setReleaseMovies([]); setSelected(null); setPreview(null)
    const from = dateKey(visible.year, visible.month, 1)
    const to = dateKey(visible.year, visible.month, daysInMonth(visible.year, visible.month))
    api<{ events: ReleaseEvent[]; movies: SearchMovie[]; refreshedAt: string; warning: string }>(`/api/releases?${new URLSearchParams({ from, to, country, genre, language, type: releaseType })}`, controller.signal).then(data => { if (active) { setReleaseEvents(data.events); setReleaseMovies(data.movies); setRefreshedAt(data.refreshedAt); setWarning(data.warning) } }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load release dates.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [visible.year, visible.month, country, genre, language, releaseType, refresh])
  const prefix = `${visible.year}-${String(visible.month + 1).padStart(2, '0')}-`
  const filtered = releaseEvents.filter(event => (!genre || event.genreIds.includes(Number(genre))) && (!language || movieById.get(event.movieId)?.originalLanguages.includes(language)) && (!releaseType || event.releaseType === releaseType) && event.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  const monthEvents = filtered.filter(event => event.date?.startsWith(prefix)).sort((a, b) => a.date!.localeCompare(b.date!) || a.title.localeCompare(b.title))
  const upcoming = monthEvents.filter(event => event.date! >= today)
  const tba = filtered.filter(event => event.date === null)
  const dayEvents = filtered.filter(event => event.date === selected)
  const previewMovie = preview ? movieById.get(preview.movieId) : undefined
  function clearFilters() { setCountry('IN'); setGenre(''); setLanguage(''); setReleaseType(''); setQuery('') }
  function navigate(delta: number) { setVisible({ ...shiftMonth(visible.year, visible.month, delta), day: 1 }); setSelected(null) }
  function selectDate(date: string) { setSelected(date); window.setTimeout(() => { const heading = document.getElementById('day-details-heading'); heading?.focus({ preventScroll: true }); if (window.matchMedia('(max-width: 1240px)').matches) heading?.scrollIntoView({ block: 'nearest' }) }, 0) }
  const hasFilters = genre || language || releaseType || query || country !== 'IN'

  return <CalendarMoviesContext.Provider value={movieById}><main id="main-content" className="calendar-page page-container" aria-labelledby={titleId}>
    <div className="calendar-page-heading"><div><p className="feature-eyebrow"><CalendarDays size={15} /> Movie release calendar</p><h1 id={titleId}>Your next movie night<br /><em>starts here.</em></h1><p className="feature-muted">A little anticipation. A lot to look forward to. Explore what’s coming to screens near you.</p></div><div className="view-toggle" role="group" aria-label="Release calendar view"><button type="button" aria-pressed={view === 'month'} onClick={() => setView('month')}><CalendarDays size={16} /> Month</button><button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}><LayoutList size={16} /> List</button></div></div>
    <div className="calendar-data-note">{refreshedAt && <span>Updated {new Date(refreshedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}<button type="button" className="text-button" onClick={() => setRefresh(value => value + 1)} disabled={loading}>Refresh dates</button></div>
    <section className="calendar-toolbar" aria-label="Calendar navigation and filters">
      <div className="month-navigation"><div><button type="button" className="icon-button feature-button" aria-label="Previous month" onClick={() => navigate(-1)}><ChevronLeft size={20} /></button><button type="button" className="icon-button feature-button" aria-label="Next month" onClick={() => navigate(1)}><ChevronRight size={20} /></button><button type="button" className="feature-button" onClick={() => { setVisible(dateParts(today)); setSelected(today) }}>Today</button></div><h2 aria-live="polite">{monthLabel(visible.year, visible.month)}</h2><span className="feature-muted">{monthEvents.length} release events</span></div>
      <div className="calendar-filters">
        <label>Country<select aria-label="Country" value={country} onChange={event => setCountry(event.target.value)}>{countries.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}</select></label>
        <label>Genre<select aria-label="Genre" value={genre} onChange={event => setGenre(event.target.value)}><option value="">All genres</option>{genreOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
        <label>Original language<select aria-label="Original language" value={language} onChange={event => setLanguage(event.target.value)}><option value="">All languages</option>{languageOptions.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}</select></label>
        <label>Release type<select aria-label="Release type" value={releaseType} onChange={event => setReleaseType(event.target.value)}><option value="">All types</option>{releaseTypes.map(type => <option key={type}>{type}</option>)}</select></label>
        <label className="calendar-search"><span><Search size={13} /> Filter this collection</span><input type="search" placeholder="Search displayed releases…" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <button type="button" className="text-button clear-filters" onClick={clearFilters} disabled={!hasFilters}><SlidersHorizontal size={14} /> Clear filters</button>
      </div>
    </section>
    {warning && !error && <p className="coverage-note">{warning}</p>}
    {loading && <div className="feature-loading" role="status"><span className="loading-orbit" /> Loading releases…</div>}
    {error && <div className="feature-empty" role="alert"><h3>Couldn’t load release dates</h3><p>{error}</p><button className="feature-button" type="button" onClick={() => setRefresh(value => value + 1)}>Retry</button></div>}
    <div className={`calendar-layout ${selected ? 'with-day-details' : ''}`}>
      <div className="calendar-main">
        {!error && view === 'month' ? <MonthCalendar year={visible.year} month={visible.month} events={monthEvents} today={today} selected={selected} onDate={selectDate} onMovie={setPreview} /> : monthEvents.length > 0 && <ReleaseList events={monthEvents} onMovie={setPreview} onDate={selectDate} />}
        {!loading && !error && monthEvents.length === 0 && <div className="feature-empty" role="status"><CalendarDays size={28} /><h3>No releases match</h3><p>{hasFilters ? 'Try clearing a filter. Your preferences have not been changed.' : 'Try another month or country to explore more releases.'}</p>{hasFilters && <button type="button" className="feature-button" onClick={clearFilters}>Clear filters</button>}</div>}
      </div>
      {selected && <aside className="day-details" aria-labelledby="day-details-heading"><div className="day-panel-heading"><p className="feature-eyebrow">The day’s lineup</p><button type="button" className="icon-button" aria-label="Close day details" onClick={() => setSelected(null)}><X size={17} /></button></div><h3 id="day-details-heading" tabIndex={-1}>{formatDate(selected, { weekday: 'long', day: 'numeric', month: 'long' })}</h3><p className="feature-muted">{dayEvents.length} {dayEvents.length === 1 ? 'release' : 'releases'} · {countries.find(item => item.code === country)?.name}</p>{dayEvents.length ? dayEvents.map(event => <ReleaseEntry key={event.eventId} event={event} onSelect={setPreview} />) : <p className="day-panel-empty">No releases match your filters for this date.</p>}</aside>}
    </div>
    <div className="calendar-supporting"><section aria-labelledby="upcoming-heading"><div className="feature-section-heading"><h2 id="upcoming-heading">Still to come this month</h2><span>{upcoming.length} events</span></div>{upcoming.length ? <ReleaseList events={upcoming} onMovie={setPreview} /> : <p className="feature-muted">No upcoming releases match this view.</p>}</section>{tba.length > 0 && <section aria-labelledby="tba-heading"><div className="feature-section-heading"><h2 id="tba-heading">Date to be announced</h2></div><p className="feature-muted small-copy">Undated releases for your country and active filters, independent of the month.</p>{tba.length ? <ReleaseList events={tba} onMovie={setPreview} /> : <p className="feature-muted">No undated releases reported.</p>}</section>}</div>
  </main><Footer />{preview && previewMovie && <Dialog titleId="calendar-preview-title" onClose={() => setPreview(null)}><MoviePreview movie={previewMovie} event={preview} titleId="calendar-preview-title" /></Dialog>}</CalendarMoviesContext.Provider>
}
