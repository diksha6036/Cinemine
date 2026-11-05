import { useState } from 'react'
import { Film } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { Movie } from '../../types/movie'

interface MovieCardProps { movie: Movie }
export function MovieCard({ movie }: MovieCardProps) {
  const [failed, setFailed] = useState(false)
  const crop = movie.referenceCrop
  const cropStyle = crop ? {
    '--crop-width': `${1536 / crop.width * 100}%`,
    '--crop-left': `${-crop.x / crop.width * 100}%`,
    '--crop-top': `${-crop.y / crop.width * 100}%`,
  } as CSSProperties : undefined

  return <article className="movie-card">
    <div className={`movie-poster ${crop ? 'reference-poster' : ''}`} style={cropStyle}>
      {failed ? <div className="poster-fallback"><Film size={36} strokeWidth={1} /><span>{movie.title}</span></div> : <img src={movie.posterUrl} alt={`${movie.title} — ${movie.shortDescription}`} loading="lazy" decoding="async" width={crop ? 1536 : 500} height={crop ? 1024 : 500} onError={() => setFailed(true)} />}
    </div>
    <h3>{movie.title}</h3>
    <p className="movie-meta"><span>{movie.releaseYear}</span><span aria-hidden="true">·</span><span>{movie.genres[0]}</span></p>
  </article>
}
