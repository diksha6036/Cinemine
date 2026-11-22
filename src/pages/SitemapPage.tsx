import { Link } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'
import { useCatalogue } from '../features/catalogue/useCatalogue'

export function SitemapPage() {
  const { movies, spotlights, loading, error, reload } = useCatalogue()
  const films = [...new Map([...movies, ...spotlights].map(movie => [movie.id, movie])).values()].sort((a, b) => a.title.localeCompare(b.title, 'en'))
  return <><main id="main-content" className="calendar-page directory-page page-container">
    <div className="calendar-page-heading"><div><p className="feature-eyebrow">Site directory</p><h1>Explore<br /><em>Cinemine.</em></h1><p className="feature-muted">Find your way to a film, a release date, or your next movie night.</p></div></div>
    <section aria-labelledby="directory-pages-heading"><h2 id="directory-pages-heading">Around Cinemine</h2><nav className="directory-pages" aria-label="Site pages"><Link to="/">Explore films<span>Daily trends and today’s CinePicks</span></Link><Link to="/where-to-watch">Where to watch<span>Search movies and find their streaming platforms</span></Link><Link to="/calendar">Release calendar<span>Regional movie release dates</span></Link></nav></section>
    <section aria-labelledby="directory-films-heading"><div className="feature-section-heading"><h2 id="directory-films-heading">Featured movie pages</h2>{films.length > 0 && <span>{films.length} films</span>}</div>
      {loading && !films.length ? <p role="status" className="feature-muted">Loading movie links…</p> : error ? <div role="alert" className="feature-empty"><p>Movie links are temporarily unavailable.</p><button type="button" className="feature-button" onClick={reload}>Retry</button></div> : <ul className="directory-films">{films.map(movie => <li key={movie.id}><Link to={`/movie/${movie.id}`}>{movie.title}{movie.releaseYear && <span>{movie.releaseYear}</span>}</Link></li>)}</ul>}
    </section>
  </main><Footer /></>
}
