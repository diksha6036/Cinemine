import { useId, useState } from 'react'
import { Footer } from '../components/layout/Footer'
import { MovieArtwork } from '../components/movies/MovieArtwork'
import { WhereToWatch } from '../components/movies/WhereToWatch'
import { WatchCountrySelect } from '../components/movies/WatchCountrySelect'
import { MediaTypeFilter } from '../components/movies/MediaTypeFilter'
import { mediaKey, mediaLabel } from '../../shared/media.mjs'
import type { MediaFilter } from '../types/movie'
import { TitleAutocomplete } from '../features/search/components/TitleAutocomplete'
import type { SearchMovie } from '../features/search/types/search'

export function WhereToWatchPage() {
  const titleId = useId()
  const movieTitleId = useId()
  const [query, setQuery] = useState('')
  const [movie, setMovie] = useState<SearchMovie | null>(null)
  const [countryCode, setCountryCode] = useState('IN')
  const [mediaType, setMediaType] = useState<MediaFilter>('all')

  return <><main id="main-content" className="watch-search-page page-container" aria-labelledby={titleId}>
    <div className="watch-search-content">
      <h1 id={titleId}>Where to watch</h1>
      <p className="watch-search-description">Search for a movie or web series and choose your country to see its streaming platforms.</p>
      <MediaTypeFilter value={mediaType} onChange={value => { setMediaType(value); setMovie(null) }} />
      <div className="watch-search-controls"><div className="watch-search-field">
        <TitleAutocomplete label="Search for a title" mediaType={mediaType} value={query} onChange={value => { setQuery(value); setMovie(null) }} onSelect={selected => { setMovie(selected); setQuery(selected.title) }} />
      </div><WatchCountrySelect value={countryCode} onChange={setCountryCode} /></div>
      {movie && <section className="watch-search-result" aria-labelledby={movieTitleId}>
        <div className="watch-selected-movie">
          <div className="watch-movie-poster"><MovieArtwork key={mediaKey(movie)} movie={movie} thumbnail /></div>
          <div><h2 id={movieTitleId}>{movie.title}</h2><p>{mediaLabel(movie)}{movie.releaseYear ? ` · ${movie.releaseYear}` : ''}</p></div>
        </div>
        <WhereToWatch movieId={movie.id} mediaType={movie.mediaType} countryCode={countryCode} headingLevel="h3" showCountrySelector={false} />
      </section>}
    </div>
  </main><Footer /></>
}
