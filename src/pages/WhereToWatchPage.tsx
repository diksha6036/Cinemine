import { useId, useState } from 'react'
import { Footer } from '../components/layout/Footer'
import { MovieArtwork } from '../components/movies/MovieArtwork'
import { WhereToWatch } from '../components/movies/WhereToWatch'
import { WatchCountrySelect } from '../components/movies/WatchCountrySelect'
import { TitleAutocomplete } from '../features/search/components/TitleAutocomplete'
import type { SearchMovie } from '../features/search/types/search'

export function WhereToWatchPage({ embedded = false }: { embedded?: boolean }) {
  const titleId = useId()
  const movieTitleId = useId()
  const Root = embedded ? 'section' : 'main'
  const Heading = embedded ? 'h2' : 'h1'
  const MovieHeading = embedded ? 'h3' : 'h2'
  const [query, setQuery] = useState('')
  const [movie, setMovie] = useState<SearchMovie | null>(null)
  const [countryCode, setCountryCode] = useState('IN')

  return <><Root id={embedded ? 'where-to-watch' : 'main-content'} className={`${embedded ? 'mobile-home-section embedded-watch' : 'watch-search-page'} page-container`} aria-labelledby={titleId}>
    <div className="watch-search-content">
      <Heading id={titleId}>Where to watch</Heading>
      <p className="watch-search-description">Search for a movie and choose your country to see its streaming platforms.</p>
      <div className="watch-search-controls"><div className="watch-search-field">
        <TitleAutocomplete label="Search for a movie" value={query} onChange={value => { setQuery(value); setMovie(null) }} onSelect={selected => { setMovie(selected); setQuery(selected.title) }} />
      </div><WatchCountrySelect value={countryCode} onChange={setCountryCode} /></div>
      {movie && <section className="watch-search-result" aria-labelledby={movieTitleId}>
        <div className="watch-selected-movie">
          <div className="watch-movie-poster"><MovieArtwork key={movie.id} movie={movie} thumbnail /></div>
          <div><MovieHeading id={movieTitleId}>{movie.title}</MovieHeading>{movie.releaseYear && <p>{movie.releaseYear}</p>}</div>
        </div>
        <WhereToWatch movieId={movie.id} countryCode={countryCode} headingLevel="h3" showCountrySelector={false} />
      </section>}
    </div>
  </Root>{!embedded && <Footer />}</>
}
