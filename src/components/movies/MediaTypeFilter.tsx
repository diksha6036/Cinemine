import type { MediaFilter } from '../../types/movie'

export function MediaTypeFilter({ value, onChange }: { value: MediaFilter; onChange: (value: MediaFilter) => void }) {
  return <div className="media-type-filter" role="group" aria-label="Title type">{([{ value: 'all', label: 'All' }, { value: 'movie', label: 'Movies' }, { value: 'tv', label: 'Series' }] as const).map(option => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>
}
