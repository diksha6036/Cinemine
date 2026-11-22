import { useEffect, useRef, useState } from 'react'
import { Instagram, Menu, Search, X } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useSearch } from '../../features/search/useSearch'
import { MOBILE_LAYOUT_QUERY, useMobileLayout } from '../../lib/useMobileLayout'

export function Navbar() {
  const { openSearch } = useSearch()
  const navigate = useNavigate()
  const { pathname, hash } = useLocation()
  const onePage = useMobileLayout()
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [shortcut, setShortcut] = useState('Ctrl K')
  const toggle = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K')
    const media = window.matchMedia('(max-width: 1200px)')
    const change = () => { setMobile(media.matches); setOpen(false) }
    change()
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    if (!open) return
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus() } }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [open])
  const find = () => {
    if (window.matchMedia(MOBILE_LAYOUT_QUERY).matches) {
      void navigate('/#find-my-movie')
      requestAnimationFrame(() => { document.getElementById('find-my-movie')?.scrollIntoView(); document.querySelector<HTMLInputElement>('#find-my-movie input')?.focus({ preventScroll: true }) })
    } else openSearch()
    setOpen(false)
  }
  const sections = [{ id: 'cinepicks', label: 'Explore' }, { id: 'find-my-movie', label: 'Find a film' }, { id: 'where-to-watch', label: 'Where to watch' }, { id: 'release-calendar', label: 'Calendar' }]
  return <header className="site-header"><div className="page-container header-inner"><Link className="brand" to="/" aria-label="cinemine home"><img className="brand-image" src="/images/cinemine-logo.jpg" alt="" width={40} height={40} /><span>cinemine</span></Link><nav id="main-navigation" className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation" inert={mobile && !open} aria-hidden={mobile && !open ? true : undefined}><NavLink to="/" end onClick={() => setOpen(false)}>Explore</NavLink><button type="button" className="nav-find" onClick={find}>Find My Movie</button><NavLink to="/where-to-watch" onClick={() => setOpen(false)}>Where to watch</NavLink><NavLink to="/calendar" onClick={() => setOpen(false)}>Release Calendar</NavLink><Link to="/#tonights-picks" onClick={() => setOpen(false)}>Trending</Link><span className="nav-divider" aria-hidden="true" /><a className="icon-button instagram-nav" href="https://www.instagram.com/dr.cinemine/" target="_blank" rel="noopener noreferrer" aria-label="Visit @dr.cinemine on Instagram"><Instagram size={22} strokeWidth={1.7} /></a></nav><button type="button" className="icon-button navbar-search" id="global-search-trigger" title="Search movies (⌘/Ctrl + K)" aria-label="Search movies" aria-haspopup={onePage ? undefined : 'dialog'} onClick={find}><Search size={21} /><kbd className="nav-search-shortcut" aria-hidden="true">{shortcut}</kbd></button><button ref={toggle} type="button" className="icon-button menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}>{open ? <X size={23} /> : <Menu size={23} />}</button></div><nav className="mobile-section-nav page-container" aria-label="Page sections">{sections.map(section => <Link key={section.id} to={`/#${section.id}`} aria-current={pathname === '/' && (hash === `#${section.id}` || (!hash && section.id === 'cinepicks')) ? 'location' : undefined} onClick={() => requestAnimationFrame(() => document.getElementById(section.id)?.scrollIntoView())}>{section.label}</Link>)}</nav></header>
}
