import { ArrowRight } from 'lucide-react'
import { MovieCard } from '../../../components/movies/MovieCard'
import { movies } from '../../../data/movies'

export function FeaturedMoviesSection() {
  return <section id="tonights-picks" className="featured-section page-container" aria-labelledby="picks-heading">
    <div className="section-heading">
      <div><h2 id="picks-heading">Tonight deserves a great film</h2><p>Handpicked for your next movie night</p></div>
      <button type="button" className="view-all" disabled title="The full catalogue is coming soon" aria-label="View all movies — coming soon">View all <ArrowRight size={21} strokeWidth={1.6} /></button>
    </div>
    <div className="movie-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">{movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}</div>
  </section>
}
