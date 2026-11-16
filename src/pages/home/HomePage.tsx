import { CinePickCarousel } from '../../components/discovery/CinePickCarousel'
import { Footer } from '../../components/layout/Footer'
import { FeaturedMoviesSection } from './sections/FeaturedMoviesSection'

export function HomePage() {
  return <><main id="main-content"><CinePickCarousel /><FeaturedMoviesSection /></main><Footer /></>
}
