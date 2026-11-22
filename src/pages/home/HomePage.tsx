import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CinePickCarousel } from '../../components/discovery/CinePickCarousel'
import { Footer } from '../../components/layout/Footer'
import { FeaturedMoviesSection } from './sections/FeaturedMoviesSection'

export function HomePage() {
  const { hash } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const destination = ({ '#find-my-movie': '/find-my-movie', '#where-to-watch': '/where-to-watch', '#release-calendar': '/calendar' } as Record<string, string>)[hash]
    if (destination) void navigate(destination, { replace: true })
  }, [hash, navigate])
  return <><main id="main-content"><CinePickCarousel /><FeaturedMoviesSection /></main><Footer /></>
}
