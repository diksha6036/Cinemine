import { api } from '../../../lib/api'
import type { SearchMovie } from '../types/search'
import type { MediaFilter } from '../../../types/movie'

export async function findTitles(query: string, signal?: AbortSignal, mediaType: MediaFilter = 'all') {
  const term = query.trim()
  if (term.length < 2 || term.length > 120) throw new Error('Enter a title between 2 and 120 characters.')
  const data = await api<{ titles: SearchMovie[] }>(`/api/titles/search?${new URLSearchParams({ q: term, mediaType, limit: '10' })}`, signal)
  return data.titles
}
