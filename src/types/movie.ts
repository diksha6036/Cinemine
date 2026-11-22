export type MediaType = 'movie' | 'tv'
export type MediaFilter = MediaType | 'all'

export interface Movie {
  mediaType?: MediaType
  id: string
  title: string
  releaseYear: number | null
  genres: string[]
  posterUrl: string
  backdropUrl?: string
  shortDescription: string
}
