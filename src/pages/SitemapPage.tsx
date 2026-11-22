import { useI18n } from '../i18n/LanguageProvider'
import { Link } from 'react-router-dom'
import { mediaKey, mediaLabel, titlePath } from '../../shared/media.mjs'
import { Footer } from '../components/layout/Footer'
import { useCatalogue } from '../features/catalogue/useCatalogue'

export function SitemapPage() {
  const { t, language } = useI18n()
  const { movies, spotlights, loading, error, reload } = useCatalogue()
  const films = [...new Map([...movies, ...spotlights].map(movie => [mediaKey(movie), movie])).values()].sort((a, b) => a.title.localeCompare(b.title, language.locale))
  return <><main id="main-content" className="calendar-page directory-page page-container">
    <div className="calendar-page-heading"><div><p className="feature-eyebrow">{t("Site directory")}</p><h1>{t("Explore")}<br /><em>Cinemine.</em></h1><p className="feature-muted">{t("Find your way to a film, a release date, or your next movie night.")}</p></div></div>
    <section aria-labelledby="directory-pages-heading"><h2 id="directory-pages-heading">{t("Around Cinemine")}</h2><nav className="directory-pages" aria-label={t("Site pages")}><Link to="/">{t("Explore films")}<span>{t("Daily trends and today’s CinePicks")}</span></Link><Link to="/find-my-movie">{t("Find movies & series")}<span>{t("Search by title, mood, description, or a similar film")}</span></Link><Link to="/where-to-watch">{t("Where to watch")}<span>{t("Search movies and series for streaming platforms")}</span></Link><Link to="/calendar">{t("Release calendar")}<span>{t("Regional movie release dates")}</span></Link></nav></section>
    <section aria-labelledby="directory-films-heading"><div className="feature-section-heading"><h2 id="directory-films-heading">{t("Featured titles")}</h2>{films.length > 0 && <span>{t('{count} titles', { count: films.length })}</span>}</div>
      {loading && !films.length ? <p role="status" className="feature-muted">{t("Loading movie links…")}</p> : error ? <div role="alert" className="feature-empty"><p>{t("Movie links are temporarily unavailable.")}</p><button type="button" className="feature-button" onClick={reload}>{t("Retry")}</button></div> : <ul className="directory-films">{films.map(movie => <li key={mediaKey(movie)}><Link to={titlePath(movie)}>{movie.title}<span>{t(mediaLabel(movie))}{movie.releaseYear ? ` · ${movie.releaseYear}` : ''}</span></Link></li>)}</ul>}
    </section>
  </main><Footer /></>
}
