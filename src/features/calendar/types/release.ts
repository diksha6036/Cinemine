export type ReleaseType = 'Premiere' | 'Limited theatrical' | 'Theatrical' | 'Digital' | 'Physical' | 'TV'
export interface ReleaseEvent {
  eventId: string
  movieId: string
  title: string
  posterUrl: string
  date: string | null
  countryCode: string
  releaseType: ReleaseType
  originalLanguage: string
  genreIds: number[]
  source: 'TMDB'
  sourceUrl: string
  lastCheckedAt: string
}
