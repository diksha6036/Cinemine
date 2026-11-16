import { useState } from 'react'
import { Film } from 'lucide-react'
import type { Movie } from '../../types/movie'

export function MovieArtwork({ movie, priority = false, thumbnail = false }: { movie: Movie; priority?: boolean; thumbnail?: boolean }) {
  const [failed, setFailed] = useState(false)
  return <div className="movie-poster">{movie.posterUrl && !failed ? <img src={thumbnail ? movie.posterUrl.replace('/w500/', '/w185/') : movie.posterUrl} alt={`${movie.title} movie poster`} width={500} height={750} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" onError={() => setFailed(true)} /> : <div className="poster-fallback" role="img" aria-label={`Poster unavailable for ${movie.title}`}><Film size={32} strokeWidth={1.2} /><span>{movie.title}</span><small>Poster unavailable</small></div>}</div>
}
