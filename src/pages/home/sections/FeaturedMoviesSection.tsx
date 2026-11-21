import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { MovieCard } from '../../../components/movies/MovieCard'
import { useCatalogue } from '../../../features/catalogue/useCatalogue'

export function FeaturedMoviesSection() {
  const { movies, loading, error, reload } = useCatalogue()
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  return <section id="tonights-picks" className="featured-section page-container" aria-labelledby="picks-heading"><div className="section-heading"><div><h2 id="picks-heading">Trending today</h2><p>Explore the films getting attention today</p></div>{movies.length > 5 && <button type="button" className="view-all" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'View all'} <ArrowRight size={20} /></button>}</div>{loading ? <div className="feature-loading" role="status"><span className="loading-orbit" /> Loading films…</div> : error ? <div className="feature-empty" role="alert"><p>{error}</p><button type="button" className="feature-button" onClick={reload}>Retry</button></div> : <div className="movie-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">{(expanded ? movies : movies.slice(0, 5)).map(movie => <MovieCard key={movie.id} movie={movie} onSelect={() => navigate(`/movie/${movie.id}`)} />)}</div>}</section>
}
