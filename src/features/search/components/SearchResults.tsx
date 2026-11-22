import { useI18n } from '../../../i18n/LanguageProvider'
import { MovieCard } from '../../../components/movies/MovieCard'
import type { SearchMovie, SearchResult } from '../types/search'
import { mediaKey } from '../../../../shared/media.mjs'

export interface PreferenceChip { id: string; label: string; onEdit: () => void }
interface Props {
  headingId?: string
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
export function SearchResults({ headingId = 'results-heading', request, results, chips, error, hasMore, loading, onMore, onRetry, onSelect }: Props) {
  const { t } = useI18n()
  const unique = [...new Map(results.map(result => [mediaKey(result.movie), result])).values()]
  return <section className="search-results" aria-labelledby={headingId} aria-busy={loading}>
    <div className="results-heading"><h3 id={headingId} tabIndex={-1}>{unique.length ? t("Your matches") : error ? t("Let’s try that again") : t("No exact matches")}</h3><span>{t('{count} titles', { count: unique.length })}</span></div>
    <p className="original-request">{t('Your request: “{request}”', { request })}</p>
    {chips.length > 0 && <div className="preference-chips" aria-label={t("Edit search preferences")}>{chips.map(chip => <button key={chip.id} type="button" onClick={event => { const panel = event.currentTarget.closest('.search-tab-panel'); chip.onEdit(); window.setTimeout(() => panel?.querySelector<HTMLElement>('input, select, textarea')?.focus(), 0) }} aria-label={t('Edit {label}', { label: chip.label })}>{chip.label} <span aria-hidden="true">×</span></button>)}</div>}
    {error && <div className="feature-empty" role="alert"><p>{t(error)}</p><button type="button" className="feature-button" disabled={loading} onClick={onRetry}>{t("Retry search")}</button></div>}
    {unique.length > 0 ? <div className="search-result-grid">{unique.map(result => <div key={mediaKey(result.movie)}><MovieCard movie={result.movie} onSelect={() => onSelect(result.movie)} /><p className="result-reason">{t(result.reason)}</p></div>)}</div> : !error && <div className="feature-empty"><p>{t(hasMore ? 'No matches on these pages. Check more results or adjust a filter.' : 'No matches. Try another title, remove a preference, or widen the runtime.')}</p></div>}
    {hasMore && <div className="feature-actions"><button type="button" className="feature-button" disabled={loading} onClick={onMore}>{loading ? t("Loading more…") : t("Show more titles")}</button></div>}
  </section>
}
