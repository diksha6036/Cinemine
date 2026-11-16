import { api } from '../../../lib/api'
import type { SearchMovie } from '../types/search'

export async function findTitles(query: string, signal?: AbortSignal) {
  const term = query.trim()
  if (term.length < 2 || term.length > 120) throw new Error('Enter a movie title between 2 and 120 characters.')
  const data = await api<{ movies: SearchMovie[] }>(`/api/movies/search?q=${encodeURIComponent(term)}`, signal)
  return data.movies
}
