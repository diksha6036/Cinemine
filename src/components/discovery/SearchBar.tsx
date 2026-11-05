import { useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'

interface SearchBarProps { query: string; onQueryChange: (value: string) => void }
export function SearchBar({ query, onQueryChange }: SearchBarProps) {
  const [submitted, setSubmitted] = useState(false)
  return <div className="search-area">
    <form role="search" className="search-bar" onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}>
      <Search className="search-icon" size={22} strokeWidth={1.8} aria-hidden="true" />
      <label className="sr-only" htmlFor="movie-query">Describe a movie, mood, or story</label>
      <input id="movie-query" type="search" value={query} onChange={(event) => { onQueryChange(event.target.value); setSubmitted(false) }} placeholder="A movie, a mood, or a story you have in mind…" aria-describedby={submitted ? 'search-status' : undefined} autoComplete="off" />
      <button className="search-submit" type="submit">Find my movie <ArrowRight size={23} strokeWidth={1.6} aria-hidden="true" /></button>
    </form>
    {submitted && <p role="status" id="search-status" className="search-status">Movie search is coming soon. For now, explore the sample picks below.</p>}
  </div>
}
