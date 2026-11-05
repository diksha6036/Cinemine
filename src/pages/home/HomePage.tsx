import { HeroSection } from './sections/HeroSection'
import { FeaturedMoviesSection } from './sections/FeaturedMoviesSection'
import { InstagramSection } from './sections/InstagramSection'
import { Footer } from '../../components/layout/Footer'

export function HomePage() {
  return <><main id="main-content"><HeroSection /><FeaturedMoviesSection /><InstagramSection /></main><Footer /></>
}
