import { HeroSection } from './sections/HeroSection'
import { FeaturedMoviesSection } from './sections/FeaturedMoviesSection'
import { InstagramSection } from './sections/InstagramSection'
import { Footer } from '../../components/layout/Footer'
import { CinePickCarousel } from '../../components/discovery/CinePickCarousel'

export function HomePage() {
  return <><main id="main-content"><CinePickCarousel /><HeroSection /><FeaturedMoviesSection /><InstagramSection /></main><Footer /></>
}
