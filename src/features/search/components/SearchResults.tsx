import { MovieCard } from '../../../components/movies/MovieCard'
import type { SearchMovie, SearchResult } from '../types/search'

export interface PreferenceChip { id: string; label: string; onEdit: () => void }
export function SearchResults({ request, results, chips, error, onRetry, onSelect }: { request: string; results: SearchResult[]; chips: PreferenceChip[]; error?: string; onRetry: () => void; onSelect: (movie: SearchMovie) => void }) {
  return <section className="search-results" aria-labelledby="results-heading">
    <div className="results-heading"><h3 id="results-heading" tabIndex={-1}>{error ? 'Let’s try that again' : results.length ? 'Your matches' : 'No exact matches'}</h3><span>{results.length} films</span></div>
    <p className="original-request">Your request: “{request}”</p>
    {chips.length > 0 && <div className="preference-chips" aria-label="Edit search preferences">{chips.map(chip => <button key={chip.id} type="button" onClick={() => { chip.onEdit(); window.setTimeout(() => document.querySelector<HTMLElement>('.search-tab-panel input, .search-tab-panel select, .search-tab-panel textarea')?.focus(), 0) }} aria-label={`Edit ${chip.label}`}>{chip.label} <span aria-hidden="true">×</span></button>)}</div>}
    {error ? <div className="feature-empty" role="alert"><p>{error}</p><button type="button" className="feature-button" onClick={onRetry}>Retry search</button></div> : results.length ? <div className="search-result-grid">{results.map(result => <div key={result.movie.id}><MovieCard movie={result.movie} onSelect={() => onSelect(result.movie)} /><p className="result-reason">{result.reason}</p></div>)}</div> : <div className="feature-empty"><p>No requirements were changed. Try removing a preference chip, choosing another mood, or widening the runtime. Try another title or remove a preference to broaden the collection.</p><button type="button" className="feature-button" onClick={onRetry}>Retry search</button></div>}
  </section>
}
