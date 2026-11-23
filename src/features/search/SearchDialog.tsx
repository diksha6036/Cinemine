import { useI18n } from '../../i18n/LanguageProvider'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import { Dialog } from '../../components/ui/Dialog'
import { MoviePreview } from '../../components/movies/MoviePreview'
import { TitleAutocomplete } from './components/TitleAutocomplete'
import { PersonAutocomplete } from './components/PersonAutocomplete'
import { api } from '../../lib/api'
import { SearchResults } from './components/SearchResults'
import type { PreferenceChip } from './components/SearchResults'
import { getGenreOptions, languageOptions, moodOptions, similarAspects, seriesGenreFor } from './data/catalogue'
import { MediaTypeFilter } from '../../components/movies/MediaTypeFilter'
import { mediaKey, mediaLabel } from '../../../shared/media.mjs'
import type { MediaFilter } from '../../types/movie'
import { interpretDescription } from '../../lib/discovery'
import type { DescriptionFilters } from '../../lib/discovery'
import type { SearchMovie, SearchPerson, SearchRequest, SearchResult, SearchTab, SimilarAspect } from './types/search'

const tabs: { id: SearchTab; label: string }[] = [{ id: 'title', label: 'Title' }, { id: 'person', label: 'Actor / Actress' }, { id: 'mood', label: 'By mood' }, { id: 'description', label: 'Describe a title' }, { id: 'similar', label: 'Similar to…' }]
interface Outcome { request: string; results: SearchResult[]; error?: string; nextPage?: number | null; endpoint?: string; parameters?: string }

export function SearchDialog({ initial, onClose, returnFocusTo, embedded = false }: { initial: SearchRequest; onClose: () => void; returnFocusTo: HTMLElement | null; embedded?: boolean }) {
  const { t, languageName, language: displayLanguage } = useI18n()
  const Heading = embedded ? 'h1' : 'h2'
  const titleId = embedded ? 'mobile-search-title' : 'search-dialog-title'
  const resultsId = embedded ? 'mobile-results-heading' : 'results-heading'
  const tabPrefix = embedded ? 'mobile-tab' : 'tab'
  const panelPrefix = embedded ? 'mobile-panel' : 'panel'
  const [searching, setSearching] = useState(false)
  const [tab, setTab] = useState<SearchTab>(initial.tab ?? 'title')
  const [titleMediaType, setTitleMediaType] = useState<MediaFilter>(initial.mediaType ?? 'all')
  const [personMediaType, setPersonMediaType] = useState<MediaFilter>(initial.tab === 'person' ? initial.mediaType ?? 'all' : 'all')
  const mediaType = tab === 'person' ? personMediaType : titleMediaType
  const setMediaType = tab === 'person' ? setPersonMediaType : setTitleMediaType
  const genreOptions = getGenreOptions(mediaType)
  const descriptionExample = `${languageName('hi')} ${t('Comedy')} ${t('Under {count} min', { count: 120 })}`
  const [descriptionFilters, setDescriptionFilters] = useState<DescriptionFilters | null>(null)
  const searchGeneration = useRef(0)
  const searchController = useRef<AbortController | null>(null)
  useEffect(() => () => { searchGeneration.current++; searchController.current?.abort() }, [])
  const activeTab = useRef(tab)
  activeTab.current = tab
  const [title, setTitle] = useState(initial.query ?? '')
  const [personQuery, setPersonQuery] = useState(initial.tab === 'person' ? initial.query ?? '' : '')
  const [person, setPerson] = useState<SearchPerson | null>(null)
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
    let base = parameters.toString()
    if (prior) {
      parameters.set('page', String(prior.nextPage))
      parameters.set('exclude', prior.results.map(result => mediaKey(result.movie)).join(','))
    }
    setSearching(true)
    try {
      const data = await api<{ titles?: SearchMovie[]; movies?: SearchMovie[]; results?: SearchResult[]; nextPage?: number | null; person?: SearchPerson | null; roles?: Record<string, string> }>(`${endpoint}?${parameters}`, controller.signal)
      const incoming = data.results ?? (data.titles ?? data.movies ?? []).map(movie => ({ movie, reason: [data.roles?.[mediaKey(movie)] ? t('As {character}', { character: data.roles[mediaKey(movie)] }) : '', t(mediaLabel(movie)), movie.releaseYear, movie.genres.slice(0, 2).map(value => t(value)).join(' · '), movie.runtimeMinutes ? t(movie.mediaType === 'tv' ? '{count} min/episode' : '{count} min', { count: movie.runtimeMinutes }) : ''].filter(Boolean).join(' · ') }))
      if (generation === searchGeneration.current) {
        if (target === 'person' && data.person) {
          setPerson(data.person); setPersonQuery(data.person.name)
          const resolved = new URLSearchParams(base)
          resolved.delete('q'); resolved.set('id', data.person.id)
          base = resolved.toString()
          request = data.person.name
        }
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
    if (tab === 'person') {
      if (person || personQuery.trim().length >= 2) void runSearch(tab, person?.name ?? personQuery.trim(), '/api/titles/cast', new URLSearchParams({ ...(person ? { id: person.id } : { q: personQuery.trim() }), mediaType }))
      return
    }
    const parameters = new URLSearchParams({ mediaType })
    let request = ''
    let error = ''
    let endpoint = '/api/titles/discover'
    if (tab === 'mood') {
      request = [selectedMoods.map(mood => t(mood)).join(' + ') || t('All'), language && languageName(language), runtime && t('Under {count} min', { count: runtime }), genre && t(getGenreOptions('all').find(option => option.id === Number(genre))?.name ?? '')].filter(Boolean).join(' · ')
      if (selectedMoods.length) parameters.set('moods', selectedMoods.join(','))
      if (language) parameters.set('languages', language)
      if (runtime) parameters.set('runtime', runtime)
      if (genre) parameters.set('genres', genre)
    } else if (tab === 'description') {
      request = description
      const filters = descriptionFilters ?? interpretDescription(description, mediaType, displayLanguage.code, languageName)
      setDescriptionFilters(filters)
      if (!filters.genreIds.length && !filters.excludedGenreIds.length && !filters.languages.length && !filters.runtime) error = t('Try a genre, original language, or runtime.')
      if (filters.genreIds.length) parameters.set('genres', filters.genreIds.join(','))
      if (filters.excludedGenreIds.length) parameters.set('withoutGenres', filters.excludedGenreIds.join(','))
      if (mediaType === 'all') {
        parameters.set('tvGenres', [...new Set(filters.genreIds.map(seriesGenreFor))].join(','))
        parameters.set('tvWithoutGenres', [...new Set(filters.excludedGenreIds.map(seriesGenreFor))].join(','))
      }
      if (filters.languages.length) parameters.set('languages', filters.languages.join(','))
      if (filters.runtime) parameters.set('runtime', String(filters.runtime))
    } else {
      request = (reference?.title ?? referenceQuery) + (aspects.length ? ' · ' + aspects.map(aspect => t(aspect === 'director' ? 'Director / creator' : aspect)).join(', ') : ` · ${t('Recommended from the reference title.')}`)
      if (!reference) error = t('Select a reference movie or series from the title suggestions first.')
      else { parameters.set('id', reference.id); parameters.set('referenceType', reference.mediaType ?? 'movie') }
      if (aspects.length) parameters.set('aspects', aspects.join(','))
      endpoint = '/api/titles/recommendations'
    }
    if (error) { cancelSearch(); setOutcomes(previous => ({ ...previous, [tab]: { request, results: [], error } })); return }
    void runSearch(tab, request, endpoint, parameters)
  }
  const chips: PreferenceChip[] = tab === 'mood' ? [
    ...selectedMoods.map(mood => ({ id: mood, label: t(mood), onEdit: () => { setSelectedMoods(selectedMoods.filter(item => item !== mood)); invalidate() } })),
    ...(language ? [{ id: 'language', label: languageName(language), onEdit: () => { setLanguage(''); invalidate() } }] : []),
    ...(runtime ? [{ id: 'runtime', label: t('Under {count} min', { count: runtime }), onEdit: () => { setRuntime(''); invalidate() } }] : []),
    ...(genre ? [{ id: 'genre', label: t(getGenreOptions('all').find(option => option.id === Number(genre))!.name), onEdit: () => { setGenre(''); invalidate() } }] : []),
  ] : tab === 'similar' ? aspects.map(aspect => ({ id: aspect, label: t(aspect === 'director' ? 'Director / creator' : aspect), onEdit: () => { setAspects(aspects.filter(item => item !== aspect)); invalidate() } })) : tab === 'description' && descriptionFilters ? [
    ...descriptionFilters.genreIds.map(id => ({ id: `genre-${id}`, label: t(getGenreOptions('all').find(option => option.id === id)!.name), onEdit: () => { setDescriptionFilters({ ...descriptionFilters, genreIds: descriptionFilters.genreIds.filter(value => value !== id) }); invalidate() } })),
    ...descriptionFilters.languages.map(code => ({ id: `lang-${code}`, label: languageName(code), onEdit: () => { setDescriptionFilters({ ...descriptionFilters, languages: descriptionFilters.languages.filter(value => value !== code) }); invalidate() } })),
    ...descriptionFilters.excludedGenreIds.map(id => ({ id: `exclude-${id}`, label: t('No {genre}', { genre: t(getGenreOptions('all').find(option => option.id === id)!.name) }), onEdit: () => { setDescriptionFilters({ ...descriptionFilters, excludedGenreIds: descriptionFilters.excludedGenreIds.filter(value => value !== id) }); invalidate() } })),
    ...(descriptionFilters.runtime ? [{ id: 'runtime', label: t('Under {count} min', { count: descriptionFilters.runtime }), onEdit: () => { setDescriptionFilters({ ...descriptionFilters, runtime: null }); invalidate() } }] : []),
  ] : []

  const content = <>
    {preview ? <><button type="button" className="text-button preview-back" onClick={() => { setPreview(null); window.setTimeout(() => previewTrigger.current?.focus(), 0) }}><ArrowLeft size={16} />  {t("Back to results")}</button><MoviePreview movie={preview} titleId={titleId} onNavigate={onClose} /></> : <>
      <p className="feature-eyebrow">{t("Find your next great watch")}</p><Heading id={titleId}>{embedded ? t("Find movies & series") : t("What would you like to watch?")}</Heading>
      <p className="feature-muted">{t("Search movies and web series by title, actor, actress, mood, or something you already enjoy.")}</p>
      <MediaTypeFilter value={mediaType} onChange={value => { cancelSearch(); setMediaType(value); setOutcomes({}); setDescriptionFilters(null); if (tab === 'person' && person) void runSearch('person', person.name, '/api/titles/cast', new URLSearchParams({ id: person.id, mediaType: value })) }} /><div className="search-tabs" role="tablist" aria-label={t("Search by")} onKeyDown={event => {
        const current = tabs.findIndex(item => item.id === tab)
        let index: number | undefined
        if (event.key === 'ArrowRight') index = (current + 1) % tabs.length
        if (event.key === 'ArrowLeft') index = (current - 1 + tabs.length) % tabs.length
        if (event.key === 'Home') index = 0
        if (event.key === 'End') index = tabs.length - 1
        if (index !== undefined) { event.preventDefault(); changeTab(tabs[index].id); document.getElementById(`${tabPrefix}-${tabs[index].id}`)?.focus() }
      }}>{tabs.map(item => <button key={item.id} type="button" role="tab" id={`${tabPrefix}-${item.id}`} aria-controls={`${panelPrefix}-${item.id}`} aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} onClick={() => changeTab(item.id)}>{t(item.label)}</button>)}</div>
      <div role="tabpanel" id={`${panelPrefix}-${tab}`} aria-labelledby={`${tabPrefix}-${tab}`} className="search-tab-panel">
        <form onSubmit={event => { event.preventDefault(); submit() }}>
          {tab === 'title' && <TitleAutocomplete label="Title" mediaType={mediaType} value={title} onChange={value => { setTitle(value); invalidate() }} onSelect={movie => { setTitle(movie.title); cancelSearch(); setOutcomes(previous => ({ ...previous, title: { request: movie.title, results: [{ movie, reason: `${t('Title match')} · ${movie.releaseYear ?? t("Year not recorded")}` }] } })); focusResults() }} />}
          {tab === 'person' && <PersonAutocomplete value={personQuery} selected={person} onChange={value => { setPersonQuery(value); setPerson(null); invalidate() }} onSelect={selected => { setPerson(selected); setPersonQuery(selected.name); void runSearch('person', selected.name, '/api/titles/cast', new URLSearchParams({ id: selected.id, mediaType })) }} />}
          {tab === 'mood' && <>
            <fieldset><legend>{t("Choose your moods")} <span className="feature-muted">{t("(matches all selected)")}</span></legend><div className="preference-chips">{moodOptions.map(mood => <button key={mood} type="button" aria-pressed={selectedMoods.includes(mood)} onClick={() => { setSelectedMoods(selectedMoods.includes(mood) ? selectedMoods.filter(item => item !== mood) : [...selectedMoods, mood]); invalidate() }}>{t(mood)}</button>)}</div></fieldset>
            <div className="search-preferences">
              <label>{t("Original language")}<select aria-label={t("Original language")} value={language} onChange={event => { setLanguage(event.target.value); invalidate() }}><option value="">{t("Any language")}</option>{languageOptions.map(option => <option key={option.code} value={option.code}>{languageName(option.code)}</option>)}</select></label>
              <label>{t("Runtime")}<select aria-label={t("Runtime")} value={runtime} onChange={event => { setRuntime(event.target.value); invalidate() }}><option value="">{t("Any runtime")}</option><option value="30">{t('Under {count} min', { count: 30 })}</option><option value="60">{t('Under {count} min', { count: 60 })}</option><option value="100">{t('Under {count} min', { count: 100 })}</option><option value="120">{t('Under {count} min', { count: 120 })}</option><option value="150">{t('Under {count} min', { count: 150 })}</option></select>{mediaType !== 'movie' && <span className="field-help">{t("Per episode for series")}</span>}</label>
              <label>{t("Genre")}<select aria-label={t("Genre")} value={genre} onChange={event => { setGenre(event.target.value); invalidate() }}><option value="">{t("Any genre")}</option>{genre && !genreOptions.some(option => option.id === Number(genre)) && <option value={genre}>{t("Previous genre — choose another")}</option>}{genreOptions.map(option => <option key={option.id} value={option.id}>{t(option.name)}</option>)}</select></label>
            </div>
          </>}
          {tab === 'description' && <label>{t("Describe what you want to watch")}<textarea value={description} onChange={event => { setDescription(event.target.value); setDescriptionFilters(null); invalidate() }} rows={3} required maxLength={1000} placeholder={descriptionExample} /><span className="field-help">{t('Use a genre, original language, and runtime. Example: {example}', { example: descriptionExample })}</span></label>}
          {tab === 'similar' && <>
            <TitleAutocomplete label="Reference title" value={referenceQuery} onChange={value => { setReferenceQuery(value); setReference(null); invalidate() }} onSelect={movie => { setReference(movie); setReferenceQuery(movie.title); invalidate() }} />
            {reference && <p className="field-help">{t("Selected:")} {reference.title} ({reference.releaseYear})</p>}
            <fieldset><legend>{t("What matters to you?")} <span className="feature-muted">{t("(matches all selected)")}</span></legend><div className="preference-chips">{similarAspects.map(aspect => <button key={aspect} type="button" aria-pressed={aspects.includes(aspect)} onClick={() => { setAspects(aspects.includes(aspect) ? aspects.filter(item => item !== aspect) : [...aspects, aspect]); invalidate() }}>{t(aspect === 'director' ? 'Director / creator' : aspect)}</button>)}</div></fieldset>
          </>}
          <div className="search-submit-row"><button type="submit" className="feature-button primary" disabled={searching || (tab === 'title' && title.trim().length < 2) || (tab === 'person' && personQuery.trim().length < 2)}><Search size={16} /> {searching ? t("Searching…") : t("Find titles")}</button>{tab === 'similar' && <span className="field-help">{t("Choose what you want in common.")}</span>}</div>
        </form>
        {searching && <p role="status" className="field-help">{t("Finding titles…")}</p>}
        {outcome && <>{tab === 'description' && descriptionFilters && <div className="interpreted-filters"><p className="field-help">{t("Matched keywords:")} {descriptionFilters.genreIds.map(id => t(getGenreOptions('all').find(genre => genre.id === id)?.name ?? '')).concat(descriptionFilters.languages.map(languageName), descriptionFilters.runtime ? [t('Under {count} min', { count: descriptionFilters.runtime })] : [], descriptionFilters.excludedGenreIds.map(id => t('No {genre}', { genre: t(getGenreOptions('all').find(genre => genre.id === id)?.name ?? '') }))).join(' · ') || t('None')}. {mediaType === 'all' && descriptionFilters.genreIds.some(id => seriesGenreFor(id) !== id) && <>{t("Series categories:")} {[...new Set(descriptionFilters.genreIds.map(seriesGenreFor))].map(id => t(getGenreOptions('tv').find(genre => genre.id === id)?.name ?? '')).filter(Boolean).join(', ')}. </>}{t("Keyword matching only; other story details are not interpreted.")}</p></div>}<SearchResults headingId={resultsId} request={outcome.request} results={outcome.results} chips={chips} error={outcome.error} onRetry={() => { if (outcome.results.length && outcome.nextPage) moreResults(); else submit() }} hasMore={Boolean(outcome.nextPage)} loading={searching} onMore={moreResults} onSelect={movie => { previewTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setPreview(movie) }} /></>}

      </div>
    </>}
  </>
  return embedded ? <section id="find-my-movie" className="embedded-search" aria-labelledby={titleId}>{preview && <h1 className="sr-only">{t("Find movies & series")}</h1>}{content}</section> : <Dialog titleId={titleId} className="search-dialog" onClose={onClose} returnFocusTo={returnFocusTo}>{content}</Dialog>
}
