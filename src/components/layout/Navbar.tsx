import { useEffect, useState } from 'react'
import { Instagram, Search } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useI18n } from '../../i18n/LanguageProvider'
import { useSearch } from '../../features/search/useSearch'
import { useMobileLayout } from '../../lib/useMobileLayout'

export function Navbar() {
  const { t } = useI18n()
  const { openSearch } = useSearch()
  const compactLayout = useMobileLayout()
  const [shortcut, setShortcut] = useState('Ctrl K')
  useEffect(() => { setShortcut(/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K') }, [])
  const find = () => openSearch()
  const tabs = [{ to: '/', label: 'Explore' }, { to: '/find-my-movie', label: 'Search' }, { to: '/where-to-watch', label: 'Where to watch' }, { to: '/calendar', label: 'Calendar' }]
  return <header className="site-header">
    <div className="page-container header-inner">
      <Link className="brand" to="/" aria-label={t('cinemine home')}><img className="brand-image" src="/images/cinemine-logo.jpg" alt="" width={40} height={40} /><span>cinemine</span></Link>
      <nav id="main-navigation" className="main-nav" aria-label={t('Main navigation')} inert={compactLayout} aria-hidden={compactLayout || undefined}>
        <NavLink to="/" end>{t('Explore')}</NavLink>
        <button type="button" className="nav-find" onClick={find}>{t('Find Movies & Series')}</button>
        <NavLink to="/where-to-watch">{t('Where to watch')}</NavLink>
        <NavLink to="/calendar">{t('Release Calendar')}</NavLink>
        <Link to="/#tonights-picks">{t('Trending')}</Link>
        <span className="nav-divider" aria-hidden="true" />
        <a className="icon-button instagram-nav" href="https://www.instagram.com/dr.cinemine/" target="_blank" rel="noopener noreferrer" aria-label={t('Visit @dr.cinemine on Instagram')}><Instagram size={22} strokeWidth={1.7} /></a>
      </nav>
      <LanguageSwitcher />
      <button type="button" className="icon-button navbar-search" id="global-search-trigger" title={t('Search movies and series (⌘/Ctrl + K)')} aria-label={t('Search movies and series')} aria-haspopup={compactLayout ? undefined : 'dialog'} onClick={find}><Search size={21} /><kbd className="nav-search-shortcut" aria-hidden="true">{shortcut}</kbd></button>
    </div>
    <nav className="mobile-tabs-nav page-container" aria-label={t('Mobile navigation')}>{tabs.map(tab => <NavLink key={tab.to} to={tab.to} end>{t(tab.label)}</NavLink>)}</nav>
  </header>
}
