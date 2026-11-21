import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import { Dialog } from '../../components/ui/Dialog'
import { MoviePreview } from '../../components/movies/MoviePreview'
import { TitleAutocomplete } from './components/TitleAutocomplete'
import { api } from '../../lib/api'
import { SearchResults } from './components/SearchResults'
import type { PreferenceChip } from './components/SearchResults'
import { genreOptions, languageName, languageOptions, moodOptions, similarAspects } from './data/catalogue'
import { interpretDescription } from '../../lib/discovery'
import type { DescriptionFilters } from '../../lib/discovery'
import type { SearchMovie, SearchRequest, SearchResult, SearchTab, SimilarAspect } from './types/search'

const tabs: { id: SearchTab; label: string }[] = [{ id: 'title', label: 'Movie title' }, { id: 'mood', label: 'By mood' }, { id: 'description', label: 'Describe a movie' }, { id: 'similar', label: 'Similar to…' }]
interface Outcome { request: string; results: SearchResult[]; error?: string; nextPage?: number | null; endpoint?: string; parameters?: string }

export function SearchDialog({ initial, onClose, returnFocusTo }: { initial: SearchRequest; onClose: () => void; returnFocusTo: HTMLElement | null }) {
  const [searching, setSearching] = useState(false)
  const [descriptionFilters, setDescriptionFilters] = useState<DescriptionFilters | null>(null)
  const searchGeneration = useRef(0)
  const searchController = useRef<AbortController | null>(null)
  useEffect(() => () => { searchGeneration.current++; searchController.current?.abort() }, [])
  const [tab, setTab] = useState<SearchTab>(initial.tab ?? 'title')
  const activeTab = useRef(tab)
  activeTab.current = tab
  const [title, setTitle] = useState(initial.query ?? '')
  const [selectedMoods, setSelectedMoods] = useState<string[]>(initial.mood && moodOptions.includes(initial.mood) ? [initial.mood] : [])
  const [language, setLanguage] = useState('')
  const [runtime, setRuntime] = useState('')
  const [genre, setGenre] = useState('')
  const [description, setDescription] = useState('')
  const [referenceQuery, setReferenceQuery] = useState(initial.referenceMovie?.title ?? '')
  const [reference, setReference] = useState<SearchMovie | null>(initial.referenceMovie ?? null)
  const [aspects, setAspects] = useState<SimilarAspect[]>(['genres'])
  const [outcomes, setOutcomes] = useState<Partial<Record<SearchTab, Outcome>>>({})
  const [preview, setPreview] = useState<SearchMovie | null>(null)
  const previewTrigger = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (preview) {
      const heading = document.getElementById('search-dialog-title')
      heading?.focus({ preventScroll: true })
      heading?.closest('dialog')?.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [preview])
  const outcome = outcomes[tab]
  function cancelSearch() {
    searchGeneration.current++
    searchController.current?.abort()
    setSearching(false)
  }
  function invalidate() { cancelSearch(); setOutcomes(previous => ({ ...previous, [tab]: undefined })) }
  function changeTab(next: SearchTab) { if (next === tab) return; cancelSearch(); setTab(next) }
  function focusResults() { window.setTimeout(() => document.getElementById('results-heading')?.focus(), 0) }
  async function runSearch(target: SearchTab, request: string, endpoint: string, parameters: URLSearchParams, append = false) {
    const generation = ++searchGeneration.current
    searchController.current?.abort()
    const controller = new AbortController()
    searchController.current = controller
    const prior = append ? outcomes[target] : undefined
    const base = parameters.toString()
    if (prior) {
      parameters.set('page', String(prior.nextPage))
      parameters.set('exclude', prior.results.map(result => result.movie.id).join(','))
    }
    setSearching(true)
    try {
      const data = await api<{ movies?: SearchMovie[]; results?: SearchResult[]; nextPage?: number | null }>(`${endpoint}?${parameters}`, controller.signal)
      const incoming = data.results ?? (data.movies ?? []).map(movie => ({ movie, reason: [movie.releaseYear, movie.genres.slice(0, 2).join(' · '), movie.runtimeMinutes ? movie.runtimeMinutes + ' min' : ''].filter(Boolean).join(' · ') }))
      if (generation === searchGeneration.current) {
        const results = [...new Map([...(prior?.results ?? []), ...incoming].map(result => [result.movie.id, result])).values()]
        setOutcomes(previous => ({ ...previous, [target]: { request, results, nextPage: data.nextPage ?? null, endpoint, parameters: base } }))
      }
    } catch (error) {
      if (generation === searchGeneration.current) setOutcomes(previous => ({ ...previous, [target]: { ...prior, request, results: prior?.results ?? [], endpoint, parameters: base, error: error instanceof Error ? error.message : 'Could not find films. Please retry.' } }))
    } finally {
      if (generation === searchGeneration.current) { setSearching(false); if (activeTab.current === target && !append) focusResults() }
    }
  }
  function moreResults() {
    if (outcome?.nextPage && outcome.endpoint) void runSearch(tab, outcome.request, outcome.endpoint, new URLSearchParams(outcome.parameters), true)
  }
  function submit() {
    if (tab === 'title') { void runSearch(tab, title, '/api/movies/search', new URLSearchParams({ q: title.trim() })); return }
    const parameters = new URLSearchParams()
    let request = ''
    let error = ''
    let endpoint = '/api/movies/discover'
    if (tab === 'mood') {
      request = [selectedMoods.join(' + ') || 'Any mood', language && languageName(language), runtime && 'Under ' + runtime + ' minutes', genre && genreOptions.find(option => option.id === Number(genre))?.name].filter(Boolean).join(' · ')
      if (selectedMoods.length) parameters.set('moods', selectedMoods.join(','))
      if (language) parameters.set('languages', language)
      if (runtime) parameters.set('runtime', runtime)
      if (genre) parameters.set('genres', genre)
    } else if (tab === 'description') {
      request = description
      const filters = descriptionFilters ?? interpretDescription(description)
      setDescriptionFilters(filters)
      if (!filters.genreIds.length && !filters.excludedGenreIds.length && !filters.languages.length && !filters.runtime) error = 'Try a genre, language, or runtime, such as “Hindi comedy under two hours”.'
      if (filters.genreIds.length) parameters.set('genres', filters.genreIds.join(','))
      if (filters.excludedGenreIds.length) parameters.set('withoutGenres', filters.excludedGenreIds.join(','))
      if (filters.languages.length) parameters.set('languages', filters.languages.join(','))
      if (filters.runtime) parameters.set('runtime', String(filters.runtime))
    } else {
      request = (reference?.title ?? referenceQuery) + (aspects.length ? ' · ' + aspects.join(', ') : ' · Related films')
      if (!reference) error = 'Select a reference movie from the title suggestions first.'
      else parameters.set('id', reference.id)
      if (aspects.length) parameters.set('aspects', aspects.join(','))
      endpoint = '/api/movies/recommendations'
    }
    if (error) { cancelSearch(); setOutcomes(previous => ({ ...previous, [tab]: { request, results: [], error } })); return }
    void runSearch(tab, request, endpoint, parameters)
  }
  const chips: PreferenceChip[] = tab === 'mood' ? [
    ...selectedMoods.map(mood => ({ id: mood, label: mood, onEdit: () => { setSelectedMoods(selectedMoods.filter(item => item !== mood)); invalidate() } })),
    ...(language ? [{ id: 'language', label: languageName(language), onEdit: () => { setLanguage(''); invalidate() } }] : []),
    ...(runtime ? [{ id: 'runtime', label: `Under ${runtime} min`, onEdit: () => { setRuntime(''); invalidate() } }] : []),
    ...(genre ? [{ id: 'genre', label: genreOptions.find(option => option.id === Number(genre))!.name, onEdit: () => { setGenre(''); invalidate() } }] : []),
  ] : tab === 'similar' ? aspects.map(aspect => ({ id: aspect, label: aspect, onEdit: () => { setAspects(aspects.filter(item => item !== aspect)); invalidate() } })) : tab === 'description' && descriptionFilters ? [
    ...descriptionFilters.genreIds.map(id => ({ id: `genre-${id}`, label: genreOptions.find(option => option.id === id)!.name, onEdit: () => { setDescriptionFilters({ ...descriptionFilters, genreIds: descriptionFilters.genreIds.filter(value => value !== id) }); invalidate() } })),
    ...descriptionFilters.languages.map(code => ({ id: `lang-${code}`, label: languageName(code), onEdit: () => { setDescriptionFilters({ ...descriptionFilters, languages: descriptionFilters.languages.filter(value => value !== code) }); invalidate() } })),
    ...descriptionFilters.excludedGenreIds.map(id => ({ id: `exclude-${id}`, label: `No ${genreOptions.find(option => option.id === id)!.name}`, onEdit: () => { setDescriptionFilters({ ...descriptionFilters, excludedGenreIds: descriptionFilters.excludedGenreIds.filter(value => value !== id) }); invalidate() } })),
    ...(descriptionFilters.runtime ? [{ id: 'runtime', label: `Under ${descriptionFilters.runtime} min`, onEdit: () => { setDescriptionFilters({ ...descriptionFilters, runtime: null }); invalidate() } }] : []),
  ] : []

  return <Dialog titleId="search-dialog-title" className="search-dialog" onClose={onClose} returnFocusTo={returnFocusTo}>
    {preview ? <><button type="button" className="text-button preview-back" onClick={() => { setPreview(null); window.setTimeout(() => previewTrigger.current?.focus(), 0) }}><ArrowLeft size={16} /> Back to results</button><MoviePreview movie={preview} titleId="search-dialog-title" onNavigate={onClose} /></> : <>
      <p className="feature-eyebrow">Find your next great film</p><h2 id="search-dialog-title">What are you in the mood for?</h2>
      <p className="feature-muted">Search real film records, or explore a different way into cinema.</p>
      <div className="search-tabs" role="tablist" aria-label="Search by" onKeyDown={event => {
        const current = tabs.findIndex(item => item.id === tab)
        let index: number | undefined
        if (event.key === 'ArrowRight') index = (current + 1) % tabs.length
        if (event.key === 'ArrowLeft') index = (current - 1 + tabs.length) % tabs.length
        if (event.key === 'Home') index = 0
        if (event.key === 'End') index = tabs.length - 1
        if (index !== undefined) { event.preventDefault(); changeTab(tabs[index].id); document.getElementById(`tab-${tabs[index].id}`)?.focus() }
      }}>{tabs.map(item => <button key={item.id} type="button" role="tab" id={`tab-${item.id}`} aria-controls={`panel-${item.id}`} aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} onClick={() => changeTab(item.id)}>{item.label}</button>)}</div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="search-tab-panel">
        <form onSubmit={event => { event.preventDefault(); submit() }}>
          {tab === 'title' && <TitleAutocomplete label="Movie title" value={title} onChange={value => { setTitle(value); invalidate() }} onSelect={movie => { setTitle(movie.title); cancelSearch(); setOutcomes(previous => ({ ...previous, title: { request: movie.title, results: [{ movie, reason: `Title match · ${movie.releaseYear ?? 'Year not recorded'}` }] } })); focusResults() }} />}
          {tab === 'mood' && <>
            <fieldset><legend>Choose your moods <span className="feature-muted">(matches all selected)</span></legend><div className="preference-chips">{moodOptions.map(mood => <button key={mood} type="button" aria-pressed={selectedMoods.includes(mood)} onClick={() => { setSelectedMoods(selectedMoods.includes(mood) ? selectedMoods.filter(item => item !== mood) : [...selectedMoods, mood]); invalidate() }}>{mood}</button>)}</div></fieldset>
            <div className="search-preferences">
              <label>Original language<select aria-label="Original language" value={language} onChange={event => { setLanguage(event.target.value); invalidate() }}><option value="">Any language</option>{languageOptions.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}</select></label>
              <label>Runtime<select aria-label="Runtime" value={runtime} onChange={event => { setRuntime(event.target.value); invalidate() }}><option value="">Any runtime</option><option value="100">Under 100 min</option><option value="120">Under 120 min</option><option value="150">Under 150 min</option></select></label>
              <label>Genre<select aria-label="Genre" value={genre} onChange={event => { setGenre(event.target.value); invalidate() }}><option value="">Any genre</option>{genreOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
            </div>
          </>}
          {tab === 'description' && <label>Describe your ideal movie<textarea value={description} onChange={event => { setDescription(event.target.value); setDescriptionFilters(null); invalidate() }} rows={3} required maxLength={1000} placeholder="A light Hindi comedy under two hours." /><span className="field-help">Use genres, original languages, and a runtime. For example: Hindi comedy under two hours.</span></label>}
          {tab === 'similar' && <>
            <TitleAutocomplete label="Reference movie" value={referenceQuery} onChange={value => { setReferenceQuery(value); setReference(null); invalidate() }} onSelect={movie => { setReference(movie); setReferenceQuery(movie.title); invalidate() }} />
            {reference && <p className="field-help">Selected: {reference.title} ({reference.releaseYear})</p>}
            <fieldset><legend>What matters to you? <span className="feature-muted">(matches all selected)</span></legend><div className="preference-chips">{similarAspects.map(aspect => <button key={aspect} type="button" aria-pressed={aspects.includes(aspect)} onClick={() => { setAspects(aspects.includes(aspect) ? aspects.filter(item => item !== aspect) : [...aspects, aspect]); invalidate() }}>{aspect}</button>)}</div></fieldset>
          </>}
          <div className="search-submit-row"><button type="submit" className="feature-button primary" disabled={searching || (tab === 'title' && title.trim().length < 2)}><Search size={16} /> {searching ? 'Searching…' : 'Find films'}</button>{tab === 'similar' && <span className="field-help">Choose what you want in common.</span>}</div>
        </form>
        {searching && <p role="status" className="field-help">Finding films…</p>}
        {outcome && <>{tab === 'description' && descriptionFilters && <div className="interpreted-filters"><p className="field-help">Matched keywords: {descriptionFilters.genreIds.map(id => genreOptions.find(genre => genre.id === id)?.name).concat(descriptionFilters.languages.map(languageName), descriptionFilters.runtime ? [`Under ${descriptionFilters.runtime} min`] : [], descriptionFilters.excludedGenreIds.map(id => `No ${genreOptions.find(genre => genre.id === id)?.name}`)).join(' · ') || 'None'}. Keyword matching only; other story details are not interpreted.</p></div>}<SearchResults request={outcome.request} results={outcome.results} chips={chips} error={outcome.error} onRetry={() => { if (outcome.results.length && outcome.nextPage) moreResults(); else submit() }} hasMore={Boolean(outcome.nextPage)} loading={searching} onMore={moreResults} onSelect={movie => { previewTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setPreview(movie) }} /></>}

      </div>
    </>}
  </Dialog>
}
