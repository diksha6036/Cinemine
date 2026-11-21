import { MovieCard } from '../../../components/movies/MovieCard'
import type { SearchMovie, SearchResult } from '../types/search'

export interface PreferenceChip { id: string; label: string; onEdit: () => void }
interface Props {
  request: string
  results: SearchResult[]
  chips: PreferenceChip[]
  error?: string
  hasMore?: boolean
  loading?: boolean
  onMore?: () => void
  onRetry: () => void
  onSelect: (movie: SearchMovie) => void
}
export function SearchResults({ request, results, chips, error, hasMore, loading, onMore, onRetry, onSelect }: Props) {
  const unique = [...new Map(results.map(result => [result.movie.id, result])).values()]
  return <section className="search-results" aria-labelledby="results-heading" aria-busy={loading}>
    <div className="results-heading"><h3 id="results-heading" tabIndex={-1}>{unique.length ? 'Your matches' : error ? 'Let’s try that again' : 'No exact matches'}</h3><span>{unique.length} films</span></div>
    <p className="original-request">Your request: “{request}”</p>
    {chips.length > 0 && <div className="preference-chips" aria-label="Edit search preferences">{chips.map(chip => <button key={chip.id} type="button" onClick={() => { chip.onEdit(); window.setTimeout(() => document.querySelector<HTMLElement>('.search-tab-panel input, .search-tab-panel select, .search-tab-panel textarea')?.focus(), 0) }} aria-label={`Edit ${chip.label}`}>{chip.label} <span aria-hidden="true">×</span></button>)}</div>}
    {error && <div className="feature-empty" role="alert"><p>{error}</p><button type="button" className="feature-button" disabled={loading} onClick={onRetry}>Retry search</button></div>}
    {unique.length > 0 ? <div className="search-result-grid">{unique.map(result => <div key={result.movie.id}><MovieCard movie={result.movie} onSelect={() => onSelect(result.movie)} /><p className="result-reason">{result.reason}</p></div>)}</div> : !error && <div className="feature-empty"><p>No films matched these preferences{hasMore ? ' on these pages. You can check more results or adjust a filter.' : '. Try another title, remove a preference, or widen the runtime.'}</p></div>}
    {hasMore && <div className="feature-actions"><button type="button" className="feature-button" disabled={loading} onClick={onMore}>{loading ? 'Loading more…' : 'Show more films'}</button></div>}
  </section>
}
