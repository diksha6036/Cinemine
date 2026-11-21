import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Footer } from '../components/layout/Footer'
export function NotFoundPage() {
  return <><main id="main-content" className="movie-detail-page page-container"><p className="eyebrow">404 · Page not found</p><h1>This scene is missing.</h1><p>The page you’re looking for could not be found.</p><Link className="feature-button primary" to="/"><ArrowLeft size={17} /> Explore films</Link></main><Footer /></>
}
