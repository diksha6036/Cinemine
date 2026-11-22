import type { MediaFilter, Movie } from '../../../types/movie'

export type SearchTab = 'title' | 'mood' | 'description' | 'similar'
export interface SearchMovie extends Movie {
  creators?: string[]
  creatorIds?: string[]
  numberOfSeasons?: number | null
  numberOfEpisodes?: number | null
  episodeRuntimeMinutes?: number[]
  status?: string
  firstAirDate?: string
  lastAirDate?: string
  networks?: string[]
  cast?: { id: string; name: string; character: string }[]
  seasons?: { id: string; number: number; name: string; episodeCount: number | null; airDate: string | null; overview: string; posterUrl: string }[]
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
export interface SearchRequest { tab?: SearchTab; query?: string; mood?: string; referenceMovie?: SearchMovie; mediaType?: MediaFilter }
export interface SearchResult { movie: SearchMovie; reason: string }
export type SimilarAspect = 'genres' | 'cast' | 'director' | 'romance'
