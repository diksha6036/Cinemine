import { Footer } from '../components/layout/Footer'

export function CreditsPage() {
  return <><main id="main-content" className="credits-page page-container">
    <div className="credits-content">
      <h1>Credits</h1>
      <section aria-labelledby="tmdb-credit-title">
        <a className="credits-logo" href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" aria-label="Visit The Movie Database"><img src="/images/tmdb-logo.svg" alt="TMDB" width="88" /></a>
        <h2 id="tmdb-credit-title">The Movie Database</h2>
        <p>Movie information and artwork are supplied through TMDB.</p>
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </section>
      <section aria-labelledby="justwatch-credit-title">
        <h2 id="justwatch-credit-title"><a href="https://www.justwatch.com" target="_blank" rel="noopener noreferrer">JustWatch</a></h2>
        <p>Streaming availability data is provided by JustWatch via TMDB.</p>
      </section>
    </div>
  </main><Footer /></>
}
