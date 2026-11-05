import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Film, Instagram } from 'lucide-react'
import { cinePicks, instagramProfileUrl } from '../../data/instagramPosts'
import { IconButton } from '../ui/IconButton'
import type { CinePick } from '../../types/social'

function CinePickArtwork({ pick }: { pick: CinePick }) {
  const [failed, setFailed] = useState(false)

  return <a className="cinepick-artwork" href={pick.postUrl} target="_blank" rel="noopener noreferrer" aria-label={`See ${pick.title} in its original Instagram post (opens in a new tab)`} draggable={false}>
    {failed ? <div className="cinepick-image-fallback"><Film size={42} strokeWidth={1} /><span>{pick.title}</span><span>View the artwork on Instagram <ArrowUpRight size={15} /></span></div> : <img src={pick.imageUrl} alt={pick.imageAlt} width={pick.imageWidth} height={pick.imageHeight} decoding="async" fetchPriority="high" onError={() => setFailed(true)} draggable={false} />}
    <span className="cinepick-artwork-label"><Instagram size={13} /> @dr.cinemine <ArrowUpRight size={13} /></span>
  </a>
}

export function CinePickCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const pick = cinePicks[activeIndex]
  const select = (index: number) => setActiveIndex((index + cinePicks.length) % cinePicks.length)

  return <section
    id="cinepicks"
    className="cinepick-section page-container"
    aria-labelledby="cinepick-heading"
    aria-roledescription="carousel"
    aria-describedby="cinepick-instructions"
    tabIndex={0}
    onKeyDown={(event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key === 'ArrowLeft') { event.preventDefault(); select(activeIndex - 1) }
      if (event.key === 'ArrowRight') { event.preventDefault(); select(activeIndex + 1) }
      if (event.key === 'Home') { event.preventDefault(); select(0) }
      if (event.key === 'End') { event.preventDefault(); select(cinePicks.length - 1) }
    }}
  >
    <div className="cinepick-section-heading">
      <div><p className="eyebrow">Good films. Great finds.</p><h1 id="cinepick-heading">Today’s <em>CinePick.</em></h1></div>
      <a className="cinepick-profile" href={instagramProfileUrl} target="_blank" rel="noopener noreferrer"><Instagram size={17} /> From @dr.cinemine <ArrowUpRight size={16} /></a>
    </div>
    <p id="cinepick-instructions" className="sr-only">Five highlights from the CineMine Instagram page. Use the previous and next buttons, left and right arrow keys, or swipe to browse. Slides do not advance automatically.</p>
    <div
      className={`cinepick-stage cinepick-theme-${pick.theme}`}
      onTouchStart={(event) => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY } }}
      onTouchCancel={() => { touchStart.current = null }}
      onTouchEnd={(event) => {
        const start = touchStart.current
        touchStart.current = null
        if (!start) return
        const touch = event.changedTouches[0]
        const dx = touch.clientX - start.x
        const dy = touch.clientY - start.y
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) select(activeIndex + (dx < 0 ? 1 : -1))
      }}
    >
      <div className="cinepick-slide" role="group" aria-roledescription="slide" aria-label={`${activeIndex + 1} of ${cinePicks.length}: ${pick.title}`}>
        <div className="cinepick-copy" aria-live="polite" aria-atomic="true">
          <p className="cinepick-kicker"><span /> The spotlight</p>
          <h2>{pick.title}</h2>
          <div className="cinepick-story"><p className="cinepick-collection-label">In the collection</p><h3>{pick.collection}</h3><p>{pick.description}</p></div>
          <a className="cinepick-post-link" href={pick.postUrl} target="_blank" rel="noopener noreferrer">Explore the Instagram post <ArrowUpRight size={19} /></a>
          <p className="cinepick-source">Curated by CineMine. Made for your next movie night.</p>
        </div>
        <CinePickArtwork key={pick.id} pick={pick} />
      </div>
      <div className="cinepick-controls">
        <span className="cinepick-count" aria-hidden="true">{String(activeIndex + 1).padStart(2, '0')} <span>/ {String(cinePicks.length).padStart(2, '0')}</span></span>
        <div className="cinepick-dots" role="group" aria-label="Choose a CinePick">
          {cinePicks.map((item, index) => <button key={item.id} type="button" className={`cinepick-dot ${index === activeIndex ? 'is-active' : ''}`} aria-label={`Show ${item.title}`} aria-pressed={index === activeIndex} onClick={() => select(index)}><span /></button>)}
        </div>
        <div className="cinepick-arrows"><IconButton aria-label="Previous CinePick" onClick={() => select(activeIndex - 1)}><ArrowLeft size={21} /></IconButton><IconButton aria-label="Next CinePick" onClick={() => select(activeIndex + 1)}><ArrowRight size={21} /></IconButton></div>
      </div>
    </div>
  </section>
}
