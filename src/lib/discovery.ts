import { genreOptions, languageOptions, seriesGenreOptions, seriesGenreFor } from '../features/search/data/catalogue'
import type { MediaFilter } from '../types/movie'
import type { SearchMovie } from '../features/search/types/search'
import { getLanguage } from '../../shared/languages.mjs'
import { translate } from '../../shared/translations.mjs'

export interface DescriptionFilters { genreIds: number[]; excludedGenreIds: number[]; languages: string[]; runtime: number | null }
export function interpretDescription(text: string, mediaType: MediaFilter = 'movie', displayLanguage = 'en', localizedLanguageName?: (code: string) => string): DescriptionFilters {
  const selectedLanguage = getLanguage(displayLanguage)
  const escaped = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let lower = text.normalize('NFC').toLowerCase().replace(/[०-९٠-٩۰-۹]/g, digit => String('०१२३४५६७८९'.includes(digit) ? digit.charCodeAt(0) - 0x966 : '٠١٢٣٤٥٦٧٨٩'.includes(digit) ? digit.charCodeAt(0) - 0x660 : digit.charCodeAt(0) - 0x6f0))
  let localizedRuntime: number | null = null
  if (selectedLanguage.code !== 'en') {
    const runtimePattern = escaped(translate(selectedLanguage.code, 'Under {count} min').toLowerCase()).replace(escaped('{count}'), '(\\d+)')
    const duration = lower.match(new RegExp(runtimePattern))
    if (duration) localizedRuntime = Number(duration[1])
    const genres = [...new Map([...genreOptions, ...seriesGenreOptions].map(genre => [genre.id, genre])).values()]
      .map(genre => ({ ...genre, translated: translate(selectedLanguage.code, genre.name).toLowerCase() })).sort((a, b) => b.translated.length - a.translated.length)
    for (const genre of genres) {
      const excluded = translate(selectedLanguage.code, 'No {genre}', { genre: genre.translated }).toLowerCase()
      lower = lower.replaceAll(excluded, ` no ${genre.name.toLowerCase()} `).replaceAll(genre.translated, ` ${genre.name.toLowerCase()} `)
    }
    const names = new Intl.DisplayNames([selectedLanguage.locale], { type: 'language' })
    for (const language of languageOptions) {
      const name = (localizedLanguageName?.(language.code) ?? names.of(language.code))?.toLowerCase()
      if (name) lower = lower.replaceAll(name, ` ${language.name.toLowerCase()} `)
    }
  }
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
  const runtime = localizedRuntime ?? (minutes ? Number(minutes[1]) : hours ? (hourNumbers[hours[1]] ?? Number(hours[1])) * 60 : null)
  return { genreIds: [...new Set(mediaType === 'tv' ? genreIds.map(seriesGenreFor) : genreIds)], excludedGenreIds: [...new Set(mediaType === 'tv' ? excludedGenreIds.map(seriesGenreFor) : excludedGenreIds)], languages, runtime }
}
export function matchesDescription(movie: SearchMovie, filters: DescriptionFilters) {
  return filters.genreIds.every(id => movie.genreIds.includes(id)) && !filters.excludedGenreIds.some(id => movie.genreIds.includes(id)) && filters.languages.every(code => movie.originalLanguages.includes(code)) && (filters.runtime === null || (movie.runtimeMinutes !== null && movie.runtimeMinutes < filters.runtime))
}
