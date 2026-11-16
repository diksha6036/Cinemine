import { useEffect, useId, useState } from 'react'
import { MovieArtwork } from '../../../components/movies/MovieArtwork'
import { findTitles } from '../data/titleSearch'
import type { SearchMovie } from '../types/search'

export function TitleAutocomplete({ label, value, onChange, onSelect }: { label: string; value: string; onChange: (value: string) => void; onSelect: (movie: SearchMovie) => void }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [suggestions, setSuggestions] = useState<SearchMovie[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [retry, setRetry] = useState(0)
  const [error, setError] = useState('')
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    setActive(-1)
    if (value.trim().length < 2) { setSuggestions([]); setStatus('idle'); return }
    setStatus('loading'); setSuggestions([])
    const timer = window.setTimeout(async () => {
      try { const matches = await findTitles(value, controller.signal); if (!cancelled) { setSuggestions(matches); setStatus('ready') } }
      catch (reason) { if (!cancelled) { setError(reason instanceof Error ? reason.message : 'Search is unavailable. Please retry.'); setStatus('error') } }
    }, 300)
    return () => { cancelled = true; controller.abort(); window.clearTimeout(timer) }
  }, [value, retry])
  function choose(movie: SearchMovie) { setOpen(false); setActive(-1); onSelect(movie) }
  return <div className="autocomplete" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <label htmlFor={id}>{label}</label>
    <input id={id} role="combobox" aria-autocomplete="list" aria-expanded={open && status === 'ready' && suggestions.length > 0} aria-controls={`${id}-options`} aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined} autoComplete="off" placeholder="Try Inception or The Lunchbox" value={value} onFocus={() => setOpen(true)} onChange={event => { onChange(event.target.value); setOpen(true) }} onKeyDown={event => {
      if (event.key === 'ArrowDown' && suggestions.length) { event.preventDefault(); setOpen(true); setActive((active + 1) % suggestions.length) }
      if (event.key === 'ArrowUp' && suggestions.length) { event.preventDefault(); setOpen(true); setActive(active < 0 ? suggestions.length - 1 : (active - 1 + suggestions.length) % suggestions.length) }
      if (event.key === 'Enter' && open && active >= 0 && suggestions[active]) { event.preventDefault(); choose(suggestions[active]) }
    }} />
    {open && status === 'loading' && <p role="status" className="autocomplete-status">Searching films…</p>}
    {open && status === 'ready' && suggestions.length === 0 && <p role="status" className="autocomplete-status">No film matches. Try a different title.</p>}
    {open && status === 'error' && <p role="alert" className="autocomplete-status">{error} <button type="button" className="text-button" onClick={() => { setRetry(retry + 1); setOpen(true) }}>Retry</button></p>}
    <ul id={`${id}-options`} role="listbox" aria-label={`${label} suggestions`} className="autocomplete-options" hidden={!open || status !== 'ready' || suggestions.length === 0}>
      {suggestions.map((movie, index) => <li key={movie.id} id={`${id}-option-${index}`} role="option" aria-selected={active === index} onMouseDown={event => event.preventDefault()} onClick={() => choose(movie)}><div className="tiny-poster"><MovieArtwork movie={movie} /></div><span>{movie.title}<small>{movie.releaseYear}</small></span></li>)}
    </ul>
  </div>
}
