import { genreOptions, languageOptions, seriesGenreOptions, seriesGenreFor } from '../features/search/data/catalogue'
import type { MediaFilter } from '../types/movie'
import type { SearchMovie } from '../features/search/types/search'

export interface DescriptionFilters { genreIds: number[]; excludedGenreIds: number[]; languages: string[]; runtime: number | null }
export function interpretDescription(text: string, mediaType: MediaFilter = 'movie'): DescriptionFilters {
  const lower = text.toLowerCase()
  const genreIds: number[] = [], excludedGenreIds: number[] = []
  for (const genre of genreOptions) {
    const words = genre.name === 'Sci-fi' ? ['sci-fi', 'science fiction', 'scifi'] : genre.name === 'Romance' ? ['romance', 'romantic'] : genre.name === 'Comedy' ? ['comedy', 'funny'] : [genre.name.toLowerCase()]
    if (words.some(word => lower.includes(word))) {
      if (words.some(word => new RegExp(`(?:no|not|without|exclude)\\s+(?:any\\s+)?${word}`).test(lower))) excludedGenreIds.push(genre.id)
      else genreIds.push(genre.id)
    }
  }
  if (mediaType !== 'movie') for (const genre of seriesGenreOptions.filter(genre => !genreOptions.some(existing => existing.id === genre.id))) {
    const word = genre.name.toLowerCase()
    if (lower.includes(word)) {
      if (new RegExp(`(?:no|not|without|exclude)\\s+(?:any\\s+)?${word}`).test(lower)) excludedGenreIds.push(genre.id)
      else genreIds.push(genre.id)
    }
  }
  const languages = languageOptions.filter(language => lower.includes(language.name.toLowerCase())).map(language => language.code)
  const minutes = lower.match(/(?:under|less than|max(?:imum)?)\s+(\d+)\s*(?:min|minutes)/)
  const hours = lower.match(/(?:under|less than|max(?:imum)?)\s+(\d+(?:\.\d+)?|one|two|three)\s*(?:hour|hr)/)
  const hourNumbers: Record<string, number> = { one: 1, two: 2, three: 3 }
  const runtime = minutes ? Number(minutes[1]) : hours ? (hourNumbers[hours[1]] ?? Number(hours[1])) * 60 : null
  return { genreIds: [...new Set(mediaType === 'tv' ? genreIds.map(seriesGenreFor) : genreIds)], excludedGenreIds: [...new Set(mediaType === 'tv' ? excludedGenreIds.map(seriesGenreFor) : excludedGenreIds)], languages, runtime }
}
export function matchesDescription(movie: SearchMovie, filters: DescriptionFilters) {
  return filters.genreIds.every(id => movie.genreIds.includes(id)) && !filters.excludedGenreIds.some(id => movie.genreIds.includes(id)) && filters.languages.every(code => movie.originalLanguages.includes(code)) && (filters.runtime === null || (movie.runtimeMinutes !== null && movie.runtimeMinutes < filters.runtime))
}
