import { useEffect, useRef, useState } from 'react'
import { Instagram, Menu, X } from 'lucide-react'
import { IconButton } from '../ui/IconButton'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); toggleRef.current?.focus() }
    }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [open])

  return <header className="site-header">
    <div className="page-container header-inner">
      <a className="brand" href="/" aria-label="Cinemine home">
        {logoFailed ? <span className="brand-dot" /> : <img className="brand-image" src="/images/cinemine-logo.jpg" alt="" width="36" height="36" onError={() => setLogoFailed(true)} />}
        <span>cinemine</span>
      </a>
      <button ref={toggleRef} type="button" className="icon-button menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}>{open ? <X size={23} /> : <Menu size={23} />}</button>
      <nav id="main-navigation" aria-label="Main navigation" className={`main-nav ${open ? 'is-open' : ''}`}>
        <a href="#tonights-picks" onClick={() => setOpen(false)}>Explore</a>
        <a href="#find-my-movie" onClick={() => { setOpen(false); document.getElementById('movie-query')?.focus() }}>Find My Movie</a>
        <a href="#tonights-picks" onClick={() => setOpen(false)}>My Picks</a>
        <button type="button" disabled title="Watchlists are coming soon" aria-label="Watchlist — coming soon">Watchlist <span className="mobile-coming-soon">Coming soon</span></button>
        <span className="nav-divider" aria-hidden="true" />
        <a className="instagram-nav icon-button" href="#instagram" aria-label="From our Instagram" onClick={() => setOpen(false)}><Instagram size={23} strokeWidth={1.7} /></a>
        <IconButton className="sign-in" disabled title="Sign in is coming soon" aria-label="Sign in — coming soon">Sign in</IconButton>
      </nav>
    </div>
  </header>
}
