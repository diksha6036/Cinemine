import type { MediaFilter } from '../../../types/movie'
export const genreOptions = [{ id: 18, name: 'Drama' }, { id: 10749, name: 'Romance' }, { id: 53, name: 'Thriller' }, { id: 12, name: 'Adventure' }, { id: 878, name: 'Sci-fi' }, { id: 35, name: 'Comedy' }, { id: 27, name: 'Horror' }, { id: 16, name: 'Animation' }, { id: 9648, name: 'Mystery' }, { id: 14, name: 'Fantasy' }, { id: 28, name: 'Action' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' }, { id: 10751, name: 'Family' }, { id: 36, name: 'History' }, { id: 10402, name: 'Music' }, { id: 10752, name: 'War' }, { id: 37, name: 'Western' }, { id: 10770, name: 'TV Movie' }]
export const languageOptions = [{ code: 'en', name: 'English' }, { code: 'hi', name: 'Hindi' }, { code: 'fr', name: 'French' }, { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' }, { code: 'ta', name: 'Tamil' }, { code: 'te', name: 'Telugu' }, { code: 'es', name: 'Spanish' }, { code: 'de', name: 'German' }]
export const languageName = (code: string) => code === 'und' ? 'Not recorded' : languageOptions.find(option => option.code === code)?.name ?? code
export const moodOptions = ['Feel-good', 'Thrilling', 'Romantic', 'Emotional', 'Mind-bending', 'Funny']
export const similarAspects = ['genres', 'cast', 'director', 'romance'] as const

export const seriesGenreOptions = [{ id: 10759, name: 'Action & Adventure' }, { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' }, { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }, { id: 10762, name: 'Kids' }, { id: 9648, name: 'Mystery' }, { id: 10763, name: 'News' }, { id: 10764, name: 'Reality' }, { id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 10766, name: 'Soap' }, { id: 10767, name: 'Talk' }, { id: 10768, name: 'War & Politics' }, { id: 37, name: 'Western' }, { id: 10749, name: 'Romance' }, { id: 27, name: 'Horror' }, { id: 53, name: 'Thriller' }]
export function getGenreOptions(mediaType: MediaFilter) {
  return mediaType === 'movie' ? genreOptions : mediaType === 'tv' ? seriesGenreOptions : [...new Map([...genreOptions, ...seriesGenreOptions].map(genre => [genre.id, genre])).values()]
}
export function seriesGenreFor(id: number) { return ({ 28: 10759, 12: 10759, 878: 10765, 14: 10765, 10752: 10768 } as Record<number, number>)[id] ?? id }
