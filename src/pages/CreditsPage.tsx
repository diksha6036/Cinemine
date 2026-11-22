import { useI18n } from '../i18n/LanguageProvider'
import { Footer } from '../components/layout/Footer'

export function CreditsPage() {
  const { t } = useI18n()
  return <><main id="main-content" className="credits-page page-container">
    <div className="credits-content">
      <h1>{t("Credits")}</h1>
      <section aria-labelledby="tmdb-credit-title">
        <a className="credits-logo" href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" aria-label={t('Explore {title}', { title: 'The Movie Database' })}><img src="/images/tmdb-logo.svg" alt="TMDB" width="88" /></a>
        <h2 id="tmdb-credit-title">The Movie Database</h2>
        <p>{t("Movie and series information and artwork are supplied through TMDB.")}</p>
        <p lang="en">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </section>
      <section aria-labelledby="justwatch-credit-title">
        <h2 id="justwatch-credit-title"><a href="https://www.justwatch.com" target="_blank" rel="noopener noreferrer">JustWatch</a></h2>
        <p>{t("Streaming availability data is provided by JustWatch via TMDB.")}</p>
      </section>
    </div>
  </main><Footer /></>
}
