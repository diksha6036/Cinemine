import { MovieArtwork } from './MovieArtwork'
import type { Movie } from '../../types/movie'

interface MovieCardProps { movie: Movie; onSelect?: () => void }
export function MovieCard({ movie, onSelect }: MovieCardProps) {
  const content = <>
    <MovieArtwork movie={movie} />
    <h3>{movie.title}</h3>
    <p className="movie-meta"><span>{movie.releaseYear}</span><span aria-hidden="true">·</span><span>{movie.genres[0]}</span></p>
  </>
  return <article className="movie-card">{onSelect ? <button type="button" className="movie-card-select" onClick={onSelect} aria-label={`Preview ${movie.title}`}>{content}</button> : content}</article>
}
