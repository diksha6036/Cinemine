export interface Movie {
  id: string
  title: string
  releaseYear: number | null
  genres: string[]
  posterUrl: string
  backdropUrl?: string
  shortDescription: string
}
