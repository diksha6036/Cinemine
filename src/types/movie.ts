export interface Movie {
  id: string
  title: string
  releaseYear: number
  genres: string[]
  posterUrl: string
  shortDescription: string
  /** Image-only rectangle in the supplied 1536 × 1024 reference; remove for standalone posters. */
  referenceCrop?: { x: number; y: number; width: number; height: number }
}
