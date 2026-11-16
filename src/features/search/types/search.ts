import type { Movie } from '../../../types/movie'

export type SearchTab = 'title' | 'mood' | 'description' | 'similar'
export interface SearchMovie extends Movie {
  originalLanguage: string
  runtimeMinutes: number | null
  genreIds: number[]
  moods: string[]
  originalLanguages: string[]
  directors: string[]
  directorIds: string[]
  castIds: string[]
  source: 'TMDB'
  trailerUrl?: string
  ratingValue?: number | null
  sourceUrl: string
  lastCheckedAt: string
}
export interface SearchRequest { tab?: SearchTab; query?: string; mood?: string; referenceMovie?: SearchMovie }
export interface SearchResult { movie: SearchMovie; reason: string }
export type SimilarAspect = 'genres' | 'cast' | 'director' | 'romance'
