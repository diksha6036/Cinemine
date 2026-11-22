import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { CinePickCarousel } from '../../components/discovery/CinePickCarousel'
import { Footer } from '../../components/layout/Footer'
import { FeaturedMoviesSection } from './sections/FeaturedMoviesSection'
import { SearchDialog } from '../../features/search/SearchDialog'
import { WhereToWatchPage } from '../WhereToWatchPage'
import { CalendarPage } from '../../features/calendar/CalendarPage'
import { useMobileLayout } from '../../lib/useMobileLayout'

export function HomePage() {
  const mobile = useMobileLayout()
  const { hash } = useLocation()
  useEffect(() => {
    if (!mobile || !hash) return
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView())
    return () => cancelAnimationFrame(frame)
  }, [mobile, hash])
  return <><main id="main-content"><CinePickCarousel /><FeaturedMoviesSection />{mobile && <>
    <SearchDialog initial={{}} onClose={() => {}} returnFocusTo={null} embedded />
    <WhereToWatchPage embedded />
    <CalendarPage embedded />
  </>}</main><Footer /></>
}
