import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import { Dialog } from '../../components/ui/Dialog'
import { MoviePreview } from '../../components/movies/MoviePreview'
import { TitleAutocomplete } from './components/TitleAutocomplete'
import { api } from '../../lib/api'
import { SearchResults } from './components/SearchResults'
import type { PreferenceChip } from './components/SearchResults'
import { getGenreOptions, languageName, languageOptions, moodOptions, similarAspects, seriesGenreFor } from './data/catalogue'
import { MediaTypeFilter } from '../../components/movies/MediaTypeFilter'
import { mediaKey, mediaLabel } from '../../../shared/media.mjs'
import type { MediaFilter } from '../../types/movie'
import { interpretDescription } from '../../lib/discovery'
import type { DescriptionFilters } from '../../lib/discovery'
import type { SearchMovie, SearchRequest, SearchResult, SearchTab, SimilarAspect } from './types/search'

const tabs: { id: SearchTab; label: string }[] = [{ id: 'title', label: 'Title' }, { id: 'mood', label: 'By mood' }, { id: 'description', label: 'Describe a movie' }, { id: 'similar', label: 'Similar to…' }]
interface Outcome { request: string; results: SearchResult[]; error?: string; nextPage?: number | null; endpoint?: string; parameters?: string }

export function SearchDialog({ initial, onClose, returnFocusTo, embedded = false }: { initial: SearchRequest; onClose: () => void; returnFocusTo: HTMLElement | null; embedded?: boolean }) {
  const Heading = embedded ? 'h1' : 'h2'
  const titleId = embedded ? 'mobile-search-title' : 'search-dialog-title'
  const resultsId = embedded ? 'mobile-results-heading' : 'results-heading'
  const tabPrefix = embedded ? 'mobile-tab' : 'tab'
  const panelPrefix = embedded ? 'mobile-panel' : 'panel'
  const [searching, setSearching] = useState(false)
  const [mediaType, setMediaType] = useState<MediaFilter>(initial.mediaType ?? 'all')
  const genreOptions = getGenreOptions(mediaType)
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
      const heading = document.getElementById(titleId)
      heading?.focus({ preventScroll: true })
      heading?.closest('dialog')?.scrollTo({ top: 0, behavior: 'instant' })
      if (embedded) heading?.scrollIntoView({ block: 'start' })
    }
  }, [preview, titleId, embedded])
  const outcome = outcomes[tab]
  function cancelSearch() {
    searchGeneration.current++
    searchController.current?.abort()
    setSearching(false)
  }
  function invalidate() { cancelSearch(); setOutcomes(previous => ({ ...previous, [tab]: undefined })) }
  function changeTab(next: SearchTab) { if (next === tab) return; cancelSearch(); setTab(next) }
  function focusResults() { window.setTimeout(() => document.getElementById(resultsId)?.focus(), 0) }
  async function runSearch(target: SearchTab, request: string, endpoint: string, parameters: URLSearchParams, append = false) {
    const generation = ++searchGeneration.current
    searchController.current?.abort()
    const controller = new AbortController()
    searchController.current = controller
    const prior = append ? outcomes[target] : undefined
    const base = parameters.toString()
    if (prior) {
      parameters.set('page', String(prior.nextPage))
      parameters.set('exclude', prior.results.map(result => mediaKey(result.movie)).join(','))
    }
    setSearching(true)
    try {
      const data = await api<{ titles?: SearchMovie[]; movies?: SearchMovie[]; results?: SearchResult[]; nextPage?: number | null }>(`${endpoint}?${parameters}`, controller.signal)
      const incoming = data.results ?? (data.titles ?? data.movies ?? []).map(movie => ({ movie, reason: [mediaLabel(movie), movie.releaseYear, movie.genres.slice(0, 2).join(' · '), movie.runtimeMinutes ? `${movie.runtimeMinutes} min${movie.mediaType === 'tv' ? '/episode' : ''}` : ''].filter(Boolean).join(' · ') }))
      if (generation === searchGeneration.current) {
        const results = [...new Map([...(prior?.results ?? []), ...incoming].map(result => [mediaKey(result.movie), result])).values()]
        setOutcomes(previous => ({ ...previous, [target]: { request, results, nextPage: data.nextPage ?? null, endpoint, parameters: base } }))
      }
    } catch (error) {
      if (generation === searchGeneration.current) setOutcomes(previous => ({ ...previous, [target]: { ...prior, request, results: prior?.results ?? [], endpoint, parameters: base, error: error instanceof Error ? error.message : 'Could not find titles. Please retry.' } }))
    } finally {
      if (generation === searchGeneration.current) { setSearching(false); if (activeTab.current === target && !append) focusResults() }
    }
  }
  function moreResults() {
    if (outcome?.nextPage && outcome.endpoint) void runSearch(tab, outcome.request, outcome.endpoint, new URLSearchParams(outcome.parameters), true)
  }
  function submit() {
    if (tab === 'title') { void runSearch(tab, title, '/api/titles/search', new URLSearchParams({ q: title.trim(), mediaType })); return }
    const parameters = new URLSearchParams({ mediaType })
    let request = ''
    let error = ''
    let endpoint = '/api/titles/discover'
    if (tab === 'mood') {
      request = [selectedMoods.join(' + ') || 'Any mood', language && languageName(language), runtime && 'Under ' + runtime + ' minutes', genre && getGenreOptions('all').find(option => option.id === Number(genre))?.name].filter(Boolean).join(' · ')
      if (selectedMoods.length) parameters.set('moods', selectedMoods.join(','))
      if (language) parameters.set('languages', language)
      if (runtime) parameters.set('runtime', runtime)
      if (genre) parameters.set('genres', genre)
    } else if (tab === 'description') {
      request = description
      const filters = descriptionFilters ?? interpretDescription(description, mediaType)
      setDescriptionFilters(filters)
      if (!filters.genreIds.length && !filters.excludedGenreIds.length && !filters.languages.length && !filters.runtime) error = 'Try a genre, language, or runtime, such as “Hindi comedy under two hours”.'
      if (filters.genreIds.length) parameters.set('genres', filters.genreIds.join(','))
      if (filters.excludedGenreIds.length) parameters.set('withoutGenres', filters.excludedGenreIds.join(','))
      if (mediaType === 'all') {
        parameters.set('tvGenres', [...new Set(filters.genreIds.map(seriesGenreFor))].join(','))
        parameters.set('tvWithoutGenres', [...new Set(filters.excludedGenreIds.map(seriesGenreFor))].join(','))
      }
      if (filters.languages.length) parameters.set('languages', filters.languages.join(','))
      if (filters.runtime) parameters.set('runtime', String(filters.runtime))
    } else {
      request = (reference?.title ?? referenceQuery) + (aspects.length ? ' · ' + aspects.join(', ') : ' · Related films')
      if (!reference) error = 'Select a reference movie or series from the title suggestions first.'
      else { parameters.set('id', reference.id); parameters.set('referenceType', reference.mediaType ?? 'movie') }
      if (aspects.length) parameters.set('aspects', aspects.join(','))
      endpoint = '/api/titles/recommendations'
    }
    if (error) { cancelSearch(); setOutcomes(previous => ({ ...previous, [tab]: { request, results: [], error } })); return }
    void runSearch(tab, request, endpoint, parameters)
  }
  const chips: PreferenceChip[] = tab === 'mood' ? [
    ...selectedMoods.map(mood => ({ id: mood, label: mood, onEdit: () => { setSelectedMoods(selectedMoods.filter(item => item !== mood)); invalidate() } })),
    ...(language ? [{ id: 'language', label: languageName(language), onEdit: () => { setLanguage(''); invalidate() } }] : []),
    ...(runtime ? [{ id: 'runtime', label: `Under ${runtime} min`, onEdit: () => { setRuntime(''); invalidate() } }] : []),
    ...(genre ? [{ id: 'genre', label: getGenreOptions('all').find(option => option.id === Number(genre))!.name, onEdit: () => { setGenre(''); invalidate() } }] : []),
  ] : tab === 'similar' ? aspects.map(aspect => ({ id: aspect, label: aspect === 'director' ? 'Director / creator' : aspect, onEdit: () => { setAspects(aspects.filter(item => item !== aspect)); invalidate() } })) : tab === 'description' && descriptionFilters ? [
    ...descriptionFilters.genreIds.map(id => ({ id: `genre-${id}`, label: getGenreOptions('all').find(option => option.id === id)!.name, onEdit: () => { setDescriptionFilters({ ...descriptionFilters, genreIds: descriptionFilters.genreIds.filter(value => value !== id) }); invalidate() } })),
    ...descriptionFilters.languages.map(code => ({ id: `lang-${code}`, label: languageName(code), onEdit: () => { setDescriptionFilters({ ...descriptionFilters, languages: descriptionFilters.languages.filter(value => value !== code) }); invalidate() } })),
    ...descriptionFilters.excludedGenreIds.map(id => ({ id: `exclude-${id}`, label: `No ${getGenreOptions('all').find(option => option.id === id)!.name}`, onEdit: () => { setDescriptionFilters({ ...descriptionFilters, excludedGenreIds: descriptionFilters.excludedGenreIds.filter(value => value !== id) }); invalidate() } })),
    ...(descriptionFilters.runtime ? [{ id: 'runtime', label: `Under ${descriptionFilters.runtime} min`, onEdit: () => { setDescriptionFilters({ ...descriptionFilters, runtime: null }); invalidate() } }] : []),
  ] : []

  const content = <>
    {preview ? <><button type="button" className="text-button preview-back" onClick={() => { setPreview(null); window.setTimeout(() => previewTrigger.current?.focus(), 0) }}><ArrowLeft size={16} /> Back to results</button><MoviePreview movie={preview} titleId={titleId} onNavigate={onClose} /></> : <>
      <p className="feature-eyebrow">Find your next great film</p><Heading id={titleId}>{embedded ? 'Find movies & series' : 'What would you like to watch?'}</Heading>
      <p className="feature-muted">Search movies and web series by title, mood, description, or something you already enjoy.</p>
      <MediaTypeFilter value={mediaType} onChange={value => { cancelSearch(); setMediaType(value); setOutcomes({}); setDescriptionFilters(null) }} /><div className="search-tabs" role="tablist" aria-label="Search by" onKeyDown={event => {
        const current = tabs.findIndex(item => item.id === tab)
        let index: number | undefined
        if (event.key === 'ArrowRight') index = (current + 1) % tabs.length
        if (event.key === 'ArrowLeft') index = (current - 1 + tabs.length) % tabs.length
        if (event.key === 'Home') index = 0
        if (event.key === 'End') index = tabs.length - 1
        if (index !== undefined) { event.preventDefault(); changeTab(tabs[index].id); document.getElementById(`${tabPrefix}-${tabs[index].id}`)?.focus() }
      }}>{tabs.map(item => <button key={item.id} type="button" role="tab" id={`${tabPrefix}-${item.id}`} aria-controls={`${panelPrefix}-${item.id}`} aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} onClick={() => changeTab(item.id)}>{item.label}</button>)}</div>
      <div role="tabpanel" id={`${panelPrefix}-${tab}`} aria-labelledby={`${tabPrefix}-${tab}`} className="search-tab-panel">
        <form onSubmit={event => { event.preventDefault(); submit() }}>
          {tab === 'title' && <TitleAutocomplete label="Title" mediaType={mediaType} value={title} onChange={value => { setTitle(value); invalidate() }} onSelect={movie => { setTitle(movie.title); cancelSearch(); setOutcomes(previous => ({ ...previous, title: { request: movie.title, results: [{ movie, reason: `Title match · ${movie.releaseYear ?? 'Year not recorded'}` }] } })); focusResults() }} />}
          {tab === 'mood' && <>
            <fieldset><legend>Choose your moods <span className="feature-muted">(matches all selected)</span></legend><div className="preference-chips">{moodOptions.map(mood => <button key={mood} type="button" aria-pressed={selectedMoods.includes(mood)} onClick={() => { setSelectedMoods(selectedMoods.includes(mood) ? selectedMoods.filter(item => item !== mood) : [...selectedMoods, mood]); invalidate() }}>{mood}</button>)}</div></fieldset>
            <div className="search-preferences">
              <label>Original language<select aria-label="Original language" value={language} onChange={event => { setLanguage(event.target.value); invalidate() }}><option value="">Any language</option>{languageOptions.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}</select></label>
              <label>Runtime<select aria-label="Runtime" value={runtime} onChange={event => { setRuntime(event.target.value); invalidate() }}><option value="">Any runtime</option><option value="30">Under 30 min</option><option value="60">Under 60 min</option><option value="100">Under 100 min</option><option value="120">Under 120 min</option><option value="150">Under 150 min</option></select>{mediaType !== 'movie' && <span className="field-help">Per episode for series</span>}</label>
              <label>Genre<select aria-label="Genre" value={genre} onChange={event => { setGenre(event.target.value); invalidate() }}><option value="">Any genre</option>{genre && !genreOptions.some(option => option.id === Number(genre)) && <option value={genre}>Previous genre — choose another</option>}{genreOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
            </div>
          </>}
          {tab === 'description' && <label>Describe what you want to watch<textarea value={description} onChange={event => { setDescription(event.target.value); setDescriptionFilters(null); invalidate() }} rows={3} required maxLength={1000} placeholder="A light Hindi comedy under two hours." /><span className="field-help">Use genres, original languages, and a runtime. For example: Hindi comedy under two hours.</span></label>}
          {tab === 'similar' && <>
            <TitleAutocomplete label="Reference title" value={referenceQuery} onChange={value => { setReferenceQuery(value); setReference(null); invalidate() }} onSelect={movie => { setReference(movie); setReferenceQuery(movie.title); invalidate() }} />
            {reference && <p className="field-help">Selected: {reference.title} ({reference.releaseYear})</p>}
            <fieldset><legend>What matters to you? <span className="feature-muted">(matches all selected)</span></legend><div className="preference-chips">{similarAspects.map(aspect => <button key={aspect} type="button" aria-pressed={aspects.includes(aspect)} onClick={() => { setAspects(aspects.includes(aspect) ? aspects.filter(item => item !== aspect) : [...aspects, aspect]); invalidate() }}>{aspect === 'director' ? 'Director / creator' : aspect}</button>)}</div></fieldset>
          </>}
          <div className="search-submit-row"><button type="submit" className="feature-button primary" disabled={searching || (tab === 'title' && title.trim().length < 2)}><Search size={16} /> {searching ? 'Searching…' : 'Find titles'}</button>{tab === 'similar' && <span className="field-help">Choose what you want in common.</span>}</div>
        </form>
        {searching && <p role="status" className="field-help">Finding titles…</p>}
        {outcome && <>{tab === 'description' && descriptionFilters && <div className="interpreted-filters"><p className="field-help">Matched keywords: {descriptionFilters.genreIds.map(id => getGenreOptions('all').find(genre => genre.id === id)?.name).concat(descriptionFilters.languages.map(languageName), descriptionFilters.runtime ? [`Under ${descriptionFilters.runtime} min`] : [], descriptionFilters.excludedGenreIds.map(id => `No ${getGenreOptions('all').find(genre => genre.id === id)?.name}`)).join(' · ') || 'None'}. {mediaType === 'all' && descriptionFilters.genreIds.some(id => seriesGenreFor(id) !== id) && <>Series categories: {[...new Set(descriptionFilters.genreIds.map(seriesGenreFor))].map(id => getGenreOptions('tv').find(genre => genre.id === id)?.name).filter(Boolean).join(', ')}. </>}Keyword matching only; other story details are not interpreted.</p></div>}<SearchResults headingId={resultsId} request={outcome.request} results={outcome.results} chips={chips} error={outcome.error} onRetry={() => { if (outcome.results.length && outcome.nextPage) moreResults(); else submit() }} hasMore={Boolean(outcome.nextPage)} loading={searching} onMore={moreResults} onSelect={movie => { previewTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setPreview(movie) }} /></>}

      </div>
    </>}
  </>
  return embedded ? <section id="find-my-movie" className="embedded-search" aria-labelledby={titleId}>{preview && <h1 className="sr-only">Find movies & series</h1>}{content}</section> : <Dialog titleId={titleId} className="search-dialog" onClose={onClose} returnFocusTo={returnFocusTo}>{content}</Dialog>
}
