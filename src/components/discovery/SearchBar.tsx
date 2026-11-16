import { ArrowRight, Search } from 'lucide-react'
import { useSearch } from '../../features/search/useSearch'

interface SearchBarProps { query: string; onQueryChange: (value: string) => void }
export function SearchBar({ query, onQueryChange }: SearchBarProps) {
  const { openSearch } = useSearch()
  return <div className="search-area">
    <form role="search" className="search-bar" onSubmit={(event) => { event.preventDefault(); openSearch({ tab: 'title', query }) }}>
      <Search className="search-icon" size={22} strokeWidth={1.8} aria-hidden="true" />
      <label className="sr-only" htmlFor="movie-query">Describe a movie, mood, or story</label>
      <input id="movie-query" type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="A movie, a mood, or a story you have in mind…" autoComplete="off" />
      <button className="search-submit" type="submit">Find my movie <ArrowRight size={23} strokeWidth={1.6} aria-hidden="true" /></button>
    </form>
  </div>
}
