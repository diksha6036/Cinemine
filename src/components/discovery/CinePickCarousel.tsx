import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Instagram } from 'lucide-react'
import { Link } from 'react-router-dom'
import { mediaKey, titlePath } from '../../../shared/media.mjs'
import { useCatalogue } from '../../features/catalogue/useCatalogue'
import { MovieArtwork } from '../movies/MovieArtwork'
import { languageName } from '../../features/search/data/catalogue'

export function CinePickCarousel() {
  const { spotlights, spotlightError, loading, error, reload } = useCatalogue()
  const [index, setIndex] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const picks = spotlights
  const active = index % (picks.length || 1)
  const pick = picks[active]
  const select = (value: number) => setIndex((value + picks.length) % (picks.length || 1))
  return <section id="cinepicks" className="cinepick-section page-container" aria-labelledby="cinepick-heading" aria-roledescription="carousel" tabIndex={0} onKeyDown={event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === 'ArrowLeft') { event.preventDefault(); select(active - 1) }
    if (event.key === 'ArrowRight') { event.preventDefault(); select(active + 1) }
    if (event.key === 'Home') { event.preventDefault(); select(0) }
    if (event.key === 'End') { event.preventDefault(); select(picks.length - 1) }
  }}><div className="cinepick-section-heading"><div><p className="eyebrow">Good films. Great finds.</p><h1 id="cinepick-heading">Today’s <em>CinePick.</em></h1></div><a className="cinepick-profile" href="https://www.instagram.com/dr.cinemine/" target="_blank" rel="noopener noreferrer"><Instagram size={17} /> @dr.cinemine <ArrowUpRight size={16} /></a></div><div className={`cinepick-stage cinepick-theme-${['ocean', 'winter', 'arena', 'noir', 'gold'][active]}`} onTouchStart={event => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY } }} onTouchCancel={() => { touchStart.current = null }} onTouchEnd={event => { const start = touchStart.current; touchStart.current = null; if (!start) return; const touch = event.changedTouches[0], dx = touch.clientX - start.x, dy = touch.clientY - start.y; if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) select(active + (dx < 0 ? 1 : -1)) }}>
    {pick ? <div className="cinepick-slide" role="group" aria-roledescription="slide" aria-label={`${active + 1} of ${picks.length}: ${pick.title}`}><div className="cinepick-copy" aria-live="polite" aria-atomic="true"><p className="cinepick-kicker"><span /> The spotlight</p><h2>{pick.title}</h2><p className="cinepick-film-meta">{[pick.releaseYear, languageName(pick.originalLanguage), pick.runtimeMinutes && `${pick.runtimeMinutes} min`].filter(Boolean).join(' · ')}</p><div className="cinepick-story"><p className="cinepick-collection-label">The story</p><p>{pick.shortDescription}</p></div><div className="cinepick-genres">{pick.genres.slice(0, 3).map(genre => <span key={genre}>{genre}</span>)}</div><Link className="cinepick-post-link" to={titlePath(pick)}>Explore this film <ArrowUpRight size={18} /></Link></div><Link className="cinepick-artwork" to={titlePath(pick)} aria-label={`Explore ${pick.title}`}><MovieArtwork key={mediaKey(pick)} movie={pick} priority /></Link></div> : <div className="cinepick-empty">{loading ? <><span className="loading-orbit" /><p role="status">Finding your next great film…</p></> : <div role="alert"><h2>Let’s find your next film.</h2><p>{error || spotlightError}</p><button type="button" className="feature-button" onClick={reload}>Retry</button></div>}</div>}
    {picks.length > 1 && <div className="cinepick-controls"><span className="cinepick-count" aria-hidden="true">{String(active + 1).padStart(2, '0')} <span>/ {String(picks.length).padStart(2, '0')}</span></span><div className="cinepick-dots" role="group" aria-label="Choose a CinePick">{picks.map((movie, i) => <button key={mediaKey(movie)} type="button" className={`cinepick-dot ${i === active ? 'is-active' : ''}`} aria-label={`Show ${movie.title}`} aria-pressed={i === active} onClick={() => select(i)}><span /></button>)}</div><div className="cinepick-arrows"><button type="button" className="icon-button" aria-label="Previous CinePick" onClick={() => select(active - 1)}><ArrowLeft size={21} /></button><button type="button" className="icon-button" aria-label="Next CinePick" onClick={() => select(active + 1)}><ArrowRight size={21} /></button></div></div>}
  </div></section>
}
