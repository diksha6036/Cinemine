export const MOODS = {
  'Feel-good': [35], Thrilling: [53, 27, 28], Romantic: [10749],
  Emotional: [18], 'Mind-bending': [878, 9648], Funny: [35],
}
export const ASPECTS = ['genres', 'cast', 'director', 'romance']
export function readDiscoveryOptions(parameters, genreIds, similar = false) {
  const list = key => [...new Set((parameters.get(key) ?? '').split(',').filter(Boolean))]
  const page = Number(parameters.get('page') ?? '1')
  const exclude = list('exclude')
  const genres = list('genres').map(Number), excludedGenres = list('withoutGenres').map(Number)
  const languages = list('languages'), moods = list('moods'), aspects = list('aspects')
  const runtime = parameters.has('runtime') ? Number(parameters.get('runtime')) : null
  const id = parameters.get('id') ?? ''
  if (!Number.isInteger(page) || page < 1 || page > 500 || exclude.length > 1000 || exclude.some(id => !/^[1-9]\d*$/.test(id)) ||
    [...genres, ...excludedGenres].some(id => !genreIds.includes(id)) || languages.length > 3 || languages.some(code => !/^[a-z]{2}$/.test(code)) ||
    moods.some(mood => !Object.hasOwn(MOODS, mood)) || aspects.some(aspect => !ASPECTS.includes(aspect)) ||
    (runtime !== null && (!Number.isInteger(runtime) || runtime < 1 || runtime > 600)) || (similar && !/^[1-9]\d*$/.test(id))) {
    const error = new Error('Choose valid movie preferences and a valid results page.')
    error.status = 400
    throw error
  }
  return { page, exclude, genres, excludedGenres, languages, moods, runtime, id, aspects }
}
export function uniqueMovies(movies) {
  return [...new Map(movies.map(movie => [String(movie.id), movie])).values()]
}
export function matchesFilters(movie, { genres = [], excludedGenres = [], languages = [], moods = [], runtime = null } = {}) {
  return genres.every(id => movie.genreIds.includes(id)) &&
    !excludedGenres.some(id => movie.genreIds.includes(id)) &&
    (!languages.length || languages.includes(movie.originalLanguage)) &&
    moods.every(mood => MOODS[mood]?.some(id => movie.genreIds.includes(id))) &&
    (runtime === null || (movie.runtimeMinutes !== null && movie.runtimeMinutes > 0 && movie.runtimeMinutes < runtime))
}
export function similarityFacts(movie, reference) {
  return {
    genres: movie.genreIds.filter(id => reference.genreIds.includes(id)),
    cast: movie.castIds.some(id => reference.castIds.includes(id)),
    director: movie.directorIds.some(id => reference.directorIds.includes(id)),
    romance: movie.genreIds.includes(10749) && reference.genreIds.includes(10749),
  }
}
export function matchesSimilarity(movie, reference, aspects) {
  if (movie.id === reference.id) return false
  const facts = similarityFacts(movie, reference)
  return aspects.every(aspect => aspect === 'genres' ? facts.genres.length > 0 : facts[aspect])
}
