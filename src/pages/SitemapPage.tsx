import { Link } from 'react-router-dom'
import { mediaKey, mediaLabel, titlePath } from '../../shared/media.mjs'
import { Footer } from '../components/layout/Footer'
import { useCatalogue } from '../features/catalogue/useCatalogue'

export function SitemapPage() {
  const { movies, spotlights, loading, error, reload } = useCatalogue()
  const films = [...new Map([...movies, ...spotlights].map(movie => [mediaKey(movie), movie])).values()].sort((a, b) => a.title.localeCompare(b.title, 'en'))
  return <><main id="main-content" className="calendar-page directory-page page-container">
    <div className="calendar-page-heading"><div><p className="feature-eyebrow">Site directory</p><h1>Explore<br /><em>Cinemine.</em></h1><p className="feature-muted">Find your way to a film, a release date, or your next movie night.</p></div></div>
    <section aria-labelledby="directory-pages-heading"><h2 id="directory-pages-heading">Around Cinemine</h2><nav className="directory-pages" aria-label="Site pages"><Link to="/">Explore films<span>Daily trends and today’s CinePicks</span></Link><Link to="/find-my-movie">Find movies & series<span>Search by title, mood, description, or a similar film</span></Link><Link to="/where-to-watch">Where to watch<span>Search movies and series for streaming platforms</span></Link><Link to="/calendar">Release calendar<span>Regional movie release dates</span></Link></nav></section>
    <section aria-labelledby="directory-films-heading"><div className="feature-section-heading"><h2 id="directory-films-heading">Featured titles</h2>{films.length > 0 && <span>{films.length} films</span>}</div>
      {loading && !films.length ? <p role="status" className="feature-muted">Loading movie links…</p> : error ? <div role="alert" className="feature-empty"><p>Movie links are temporarily unavailable.</p><button type="button" className="feature-button" onClick={reload}>Retry</button></div> : <ul className="directory-films">{films.map(movie => <li key={mediaKey(movie)}><Link to={titlePath(movie)}>{movie.title}<span>{mediaLabel(movie)}{movie.releaseYear ? ` · ${movie.releaseYear}` : ''}</span></Link></li>)}</ul>}
    </section>
  </main><Footer /></>
}
