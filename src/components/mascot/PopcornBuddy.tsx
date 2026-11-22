import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { mediaKey } from '../../../shared/media.mjs'
import { Shuffle, X } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { MoviePreview } from '../movies/MoviePreview'
import { api } from '../../lib/api'
import { PopcornCharacter } from './PopcornCharacter'
import { useDraggableBuddy } from './useDraggableBuddy'
import type { SearchMovie } from '../../features/search/types/search'

export function PopcornBuddy() {
  const buddy = useDraggableBuddy()
  const { pathname } = useLocation()
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const [movie, setMovie] = useState<SearchMovie | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pool = useRef<SearchMovie[]>([])
  const seen = useRef(new Set<string>())
  const nextPage = useRef<number | null>(1)
  const controller = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const busy = useRef(false)
  useEffect(() => {
    try { setHidden(sessionStorage.getItem('cinemine-hide-buddy') === '1') } catch { /* Storage is optional. */ }
    return () => { generation.current++; controller.current?.abort() }
  }, [])
  const close = () => { generation.current++; controller.current?.abort(); busy.current = false; setLoading(false); setOpen(false) }
  async function pick() {
    if (busy.current) return
    busy.current = true
    const version = ++generation.current
    const match = pathname.match(/^\/(movie|series)\/(\d+)/)
    const currentId = match ? `${match[1] === 'series' ? 'tv' : 'movie'}:${match[2]}` : undefined
    setOpen(true); setLoading(true); setError('')
    try {
      pool.current = pool.current.filter(film => mediaKey(film) !== currentId && (!movie || mediaKey(film) !== mediaKey(movie)) && !seen.current.has(mediaKey(film)))
      if (!pool.current.length) {
        if (!nextPage.current) { seen.current.clear(); if (movie) seen.current.add(mediaKey(movie)); nextPage.current = 1 }
        controller.current?.abort(); controller.current = new AbortController()
        const exclude = [...seen.current, ...(currentId ? [currentId] : [])].slice(-1000)
        const data = await api<{ titles: SearchMovie[]; nextPage: number | null }>(`/api/titles/discover?${new URLSearchParams({ page: String(nextPage.current), exclude: exclude.join(',') })}`, controller.current.signal)
        if (version !== generation.current) return
        nextPage.current = data.nextPage
        pool.current = [...new Map(data.titles.filter(film => film.posterUrl && mediaKey(film) !== currentId && (!movie || mediaKey(film) !== mediaKey(movie)) && !seen.current.has(mediaKey(film))).map(film => [mediaKey(film), film])).values()]
      }
      if (!pool.current.length) throw new Error('No surprise titles are available in this batch. Try another pick.')
      const index = Math.floor(Math.random() * pool.current.length)
      const [chosen] = pool.current.splice(index, 1)
      seen.current.add(mediaKey(chosen)); setMovie(chosen)
    } catch (reason) {
      if (version === generation.current) setError(reason instanceof Error ? reason.message : 'Couldn’t pick a film. Please try again.')
    } finally {
      if (version === generation.current) { busy.current = false; setLoading(false) }
    }
  }
  if (hidden) return null
  return <>
    <aside ref={buddy.ref} className={`popcorn-buddy${buddy.dragging ? ' is-dragging' : ''}${buddy.position && buddy.position.y < 140 ? ' greeting-below' : ''}${buddy.position && buddy.position.x < 100 ? ' greeting-left' : ''}`} style={buddy.position ? { left: buddy.position.x, top: buddy.position.y, right: 'auto', bottom: 'auto' } : undefined} aria-label="Movie-night companion">
      <span id="buddy-greeting" className="buddy-greeting">Movie night? <span aria-hidden="true">✦</span></span>
      <span id="buddy-move-hint" className="sr-only">Drag to move, or use the arrow keys when focused.</span>
      <button type="button" className="buddy-trigger" aria-label="Surprise me with a film" aria-describedby="buddy-greeting buddy-move-hint" aria-haspopup="dialog" title="Drag to move. Click for a surprise film." onPointerDown={buddy.onPointerDown} onPointerMove={buddy.onPointerMove} onPointerUp={buddy.onPointerUp} onPointerCancel={buddy.onPointerCancel} onLostPointerCapture={buddy.onLostPointerCapture} onKeyDown={buddy.onKeyDown} onDragStart={event => event.preventDefault()} onClick={event => { if (!buddy.shouldIgnoreClick(event)) void pick() }}><PopcornCharacter /></button>
      <button type="button" className="buddy-dismiss" aria-label="Hide popcorn buddy" onClick={() => { setHidden(true); try { sessionStorage.setItem('cinemine-hide-buddy', '1') } catch { /* Storage is optional. */ } }}><X size={14} /></button>
    </aside>
    {open && <Dialog titleId="buddy-dialog-title" className="buddy-dialog" onClose={close}>
      <p className="feature-eyebrow">A little movie magic</p><h2 id="buddy-dialog-title">Your movie-night surprise.</h2>
      {loading ? <div className="feature-loading" role="status"><span className="loading-orbit" /> Finding something to watch…</div> : error ? <p role="alert" className="feature-empty">{error}</p> : movie && <MoviePreview movie={movie} titleId="buddy-film-title" onNavigate={close} />}
      <div className="feature-actions"><button type="button" className="feature-button" disabled={loading} onClick={() => void pick()}><Shuffle size={16} /> {error ? 'Try another pick' : 'Another pick'}</button></div>
    </Dialog>}
  </>
}
