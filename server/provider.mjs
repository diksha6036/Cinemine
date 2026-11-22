import { createHash } from 'node:crypto'
import { readServerConfig } from './env.mjs'
import { MOODS, matchesFilters, matchesSimilarity, similarityFacts, uniqueMovies } from './discovery.mjs'
import { currentLanguage, localizedKey, withLanguage } from './language.mjs'
import { translate } from '../shared/translations.mjs'

const API = 'https://api.themoviedb.org/3'
const TTL = 5 * 60 * 1000
const state = globalThis[Symbol.for('cinemine.tmdb-cache')] ??= { requests: new Map(), pending: new Map(), movies: new Map(), scope: '' }
export const GENRES = [{ id: 18, name: 'Drama' }, { id: 10749, name: 'Romance' }, { id: 53, name: 'Thriller' }, { id: 12, name: 'Adventure' }, { id: 878, name: 'Sci-fi' }, { id: 35, name: 'Comedy' }, { id: 27, name: 'Horror' }, { id: 16, name: 'Animation' }, { id: 9648, name: 'Mystery' }, { id: 14, name: 'Fantasy' }, { id: 28, name: 'Action' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' }, { id: 10751, name: 'Family' }, { id: 36, name: 'History' }, { id: 10402, name: 'Music' }, { id: 10752, name: 'War' }, { id: 37, name: 'Western' }, { id: 10770, name: 'TV Movie' }]
export const RELEASE_TYPES = { 1: 'Premiere', 2: 'Limited theatrical', 3: 'Theatrical', 4: 'Digital', 5: 'Physical', 6: 'TV' }

function configuration() {
  const config = readServerConfig()
  if (!config.token && !config.apiKey) {
    const error = new Error('The movie service is not configured. Check the local .env file.')
    error.status = 503
    throw error
  }
  const scope = createHash('sha256').update(config.token || config.apiKey).digest('hex')
  if (scope !== state.scope) { state.requests.clear(); state.pending.clear(); state.movies.clear(); state.scope = scope }
  return config
}

export async function tmdb(path, parameters = {}) {
  if (parameters.language && path !== '/search/keyword') parameters = { ...parameters, language: currentLanguage().tmdb }
  const config = configuration()
  const cacheKey = `${state.scope}:${path}?${new URLSearchParams(parameters)}`
  const cached = state.requests.get(cacheKey)
  if (cached?.expires > Date.now()) return cached.data
  if (state.pending.has(cacheKey)) return state.pending.get(cacheKey)
  const task = (async () => {
    const url = new URL(`${API}${path}`)
    url.search = new URLSearchParams(parameters).toString()
    if (!config.token) url.searchParams.set('api_key', config.apiKey)
    const headers = { Accept: 'application/json', ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}) }
    let result
    for (let attempt = 0; attempt < 2; attempt++) {
      let response
      try { response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) }) }
      catch { if (attempt === 0) continue; throw new Error('Could not connect to the movie service. Please retry.') }
      if (response.status === 401 || response.status === 403) { const error = new Error('The movie service rejected its credential. Check the local .env file.'); error.status = 502; throw error }
      if (response.status === 404) { const error = new Error('This film could not be found.'); error.status = 404; throw error }
      if (response.status === 429) throw new Error('The movie service is busy. Please try again shortly.')
      if (!response.ok) { if (attempt === 0 && response.status >= 500) continue; throw new Error('The movie service is temporarily unavailable. Please retry.') }
      try { result = await response.json() } catch { throw new Error('The movie service returned an unreadable response. Please retry.') }
      break
    }
    if (state.requests.size >= 600) state.requests.delete(state.requests.keys().next().value)
    state.requests.set(cacheKey, { data: result, expires: Date.now() + TTL })
    return result
  })().finally(() => state.pending.delete(cacheKey))
  state.pending.set(cacheKey, task)
  return task
}

async function mapBounded(items, mapper, concurrency = 4) {
  const output = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) { const index = next++; try { output[index] = { ok: true, value: await mapper(items[index]) } } catch (error) { output[index] = { ok: false, error } } }
  }))
  return output
}

export function imageUrl(path, size = 'w500', base = 'https://image.tmdb.org/t/p/') {
  if (!/^\/[A-Za-z0-9_.-]+\.(?:jpg|png|webp)$/i.test(path ?? '')) return ''
  return `${base}${size}${path}`
}
export function moodsForGenres(ids) {
  const moods = []
  if (ids.includes(35)) moods.push('Funny', 'Feel-good')
  if (ids.includes(10749)) moods.push('Romantic')
  if ([53, 27, 28].some(id => ids.includes(id))) moods.push('Thrilling')
  if (ids.includes(18)) moods.push('Emotional')
  if ([878, 9648].some(id => ids.includes(id))) moods.push('Mind-bending')
  return moods
}
export function normalizeFilm(record, images = {}) {
  const genres = record.genres ?? (record.genre_ids ?? []).map(id => GENRES.find(genre => genre.id === id)).filter(Boolean)
  const genreIds = genres.map(genre => genre.id)
  const year = record.release_date?.match(/^(\d{4})-/)?.[1]
  const directors = (record.credits?.crew ?? []).filter(person => person.job === 'Director')
  const trailers = (record.videos?.results ?? []).filter(video => video.site === 'YouTube' && video.type === 'Trailer' && /^[A-Za-z0-9_-]{11}$/.test(video.key))
  const trailer = trailers.find(video => video.official) ?? trailers[0]
  const posterPath = record.poster_path || (record.images?.posters ?? []).find(poster => imageUrl(poster.file_path))?.file_path
  return {
    id: String(record.id), mediaType: 'movie', title: record.title || record.original_title || 'Untitled film', releaseYear: year ? Number(year) : null,
    genres: genres.map(genre => genre.name), genreIds, posterUrl: imageUrl(posterPath, 'w500', images.base), backdropUrl: imageUrl(record.backdrop_path, 'w1280', images.base),
    shortDescription: record.overview || 'A synopsis is not available for this film.', originalLanguage: record.original_language || 'und', originalLanguages: record.original_language ? [record.original_language] : [],
    runtimeMinutes: Number.isFinite(record.runtime) && record.runtime > 0 ? record.runtime : null, moods: moodsForGenres(genreIds),
    directors: directors.map(person => person.name), directorIds: directors.map(person => String(person.id)), castIds: (record.credits?.cast ?? []).slice(0, 20).map(person => String(person.id)),
    cast: (record.credits?.cast ?? []).slice(0, 12).map(person => ({ id: String(person.id), name: person.name, character: person.character || '' })),
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '', ratingValue: record.vote_count > 0 ? record.vote_average : null,
    source: 'TMDB', sourceUrl: `https://www.themoviedb.org/movie/${record.id}`, lastCheckedAt: new Date().toISOString(),
  }
}
export function normalizeSeries(record, images = {}) {
  const credits = record.aggregate_credits ?? record.credits ?? {}
  const base = normalizeFilm({ ...record, title: record.name || record.original_name, release_date: record.first_air_date, credits }, images)
  const durations = [...new Set((record.episode_run_time ?? []).filter(value => Number.isFinite(value) && value > 0))].sort((a, b) => a - b)
  const latestRuntime = record.last_episode_to_air?.runtime
  const runtime = durations.length ? Math.max(...durations) : Number.isFinite(latestRuntime) && latestRuntime > 0 ? latestRuntime : null
  const keywords = (record.keywords?.results ?? []).map(keyword => keyword.name?.toLowerCase()).filter(Boolean)
  const moods = []
  if (base.genreIds.includes(35)) moods.push('Funny', 'Feel-good')
  if (base.genreIds.includes(18)) moods.push('Emotional')
  if (base.genreIds.some(id => [10759, 9648].includes(id)) || keywords.some(name => ['thriller', 'horror'].includes(name))) moods.push('Thrilling')
  if (base.genreIds.some(id => [10765, 9648].includes(id))) moods.push('Mind-bending')
  if (keywords.includes('romance')) moods.push('Romantic')
  return { ...base, mediaType: 'tv', runtimeMinutes: runtime, episodeRuntimeMinutes: durations, moods,
    creators: (record.created_by ?? []).map(person => person.name), creatorIds: (record.created_by ?? []).map(person => String(person.id)),
    numberOfSeasons: Number.isInteger(record.number_of_seasons) ? record.number_of_seasons : null,
    numberOfEpisodes: Number.isInteger(record.number_of_episodes) ? record.number_of_episodes : null,
    firstAirDate: record.first_air_date || '', lastAirDate: record.last_air_date || '', status: record.status || '',
    networks: (record.networks ?? []).map(network => network.name), keywordNames: keywords,
    cast: (credits.cast ?? []).slice(0, 12).map(person => ({ id: String(person.id), name: person.name, character: person.roles?.map(role => role.character).filter(Boolean).join(' / ') || person.character || '' })),
    seasons: (record.seasons ?? []).map(season => ({ id: String(season.id), number: season.season_number, name: season.name, episodeCount: Number.isInteger(season.episode_count) ? season.episode_count : null, airDate: season.air_date || null, overview: season.overview || '', posterUrl: imageUrl(season.poster_path, 'w185', images.base) })),
    sourceUrl: `https://www.themoviedb.org/tv/${record.id}`,
  }
}
async function imagesConfiguration() {
  const data = await tmdb('/configuration')
  const base = data.images?.secure_base_url
  return { base: typeof base === 'string' && base === 'https://image.tmdb.org/t/p/' ? base : 'https://image.tmdb.org/t/p/' }
}
async function localizedDetails(path, append) {
  const record = await tmdb(path, { language: 'en-US', append_to_response: append })
  if (record.adult || currentLanguage().code === 'en') return record
  if (!record.overview?.trim() || !record.videos?.results?.length || record.seasons?.some(season => !season.overview?.trim())) {
    try {
      const fallback = await withLanguage('en', () => tmdb(path, { language: 'en-US', append_to_response: append }))
      if (!record.overview?.trim()) record.overview = fallback.overview
      if (!record.videos?.results?.length) record.videos = fallback.videos
      if (record.seasons) record.seasons = record.seasons.map(season => {
        const original = fallback.seasons?.find(item => item.id === season.id)
        return { ...season, overview: season.overview?.trim() ? season.overview : original?.overview || '' }
      })
    } catch { /* A missing fallback must not discard a valid localized record. */ }
  }
  return record
}
export async function getFilms(ids) {
  configuration()
  const valid = [...new Set(ids.map(String))].filter(id => /^[1-9]\d*$/.test(id))
  const missing = valid.filter(id => !state.movies.has(localizedKey(id)) || state.movies.get(localizedKey(id)).expires <= Date.now())
  if (missing.length) {
    const images = await imagesConfiguration()
    const results = await mapBounded(missing, async id => {
      const record = await localizedDetails(`/movie/${id}`, 'credits,videos,release_dates')
      if (record.adult) return null
      // A translated detail record can lack a primary poster. Look for genuine
      // posters across languages before declaring the artwork unavailable.
      if (!imageUrl(record.poster_path)) {
        try { record.images = await tmdb(`/movie/${id}/images`) }
        catch { /* Missing artwork must not discard a real release record. */ }
      }
      const movie = normalizeFilm(record, images)
      if (state.movies.size >= 1000) state.movies.delete(state.movies.keys().next().value)
      state.movies.set(localizedKey(id), { movie, releaseDates: record.release_dates, expires: Date.now() + TTL })
      return movie
    })
    if (results.every(result => !result.ok)) throw results[0].error
  }
  return valid.flatMap(id => state.movies.get(localizedKey(id))?.expires > Date.now() ? [state.movies.get(localizedKey(id)).movie] : [])
}
export async function getSeries(ids) {
  configuration()
  const valid = [...new Set(ids.map(String))].filter(id => /^[1-9]\d*$/.test(id))
  const missing = valid.filter(id => !state.movies.has(localizedKey(`tv:${id}`)) || state.movies.get(localizedKey(`tv:${id}`)).expires <= Date.now())
  if (missing.length) {
    const images = await imagesConfiguration()
    const results = await mapBounded(missing, async id => {
      const record = await localizedDetails(`/tv/${id}`, 'aggregate_credits,videos,keywords')
      if (record.adult) return null
      if (!imageUrl(record.poster_path)) {
        try { record.images = await tmdb(`/tv/${id}/images`) } catch { /* Preserve real titles even without artwork. */ }
      }
      const movie = normalizeSeries(record, images)
      if (state.movies.size >= 1000) state.movies.delete(state.movies.keys().next().value)
      state.movies.set(localizedKey(`tv:${id}`), { movie, expires: Date.now() + TTL })
      return movie
    })
    if (results.every(result => !result.ok)) throw results[0].error
  }
  return valid.flatMap(id => state.movies.get(localizedKey(`tv:${id}`))?.expires > Date.now() ? [state.movies.get(localizedKey(`tv:${id}`)).movie] : [])
}
export async function featuredFilms() {
  const data = await tmdb('/trending/movie/day', { language: 'en-US' })
  const movies = await getFilms(uniqueMovies((data.results ?? []).filter(record => !record.adult)).slice(0, 20).map(record => record.id))
  if (!movies.length) throw new Error('No featured films are available. Please retry.')
  return movies
}
export async function homeFilms() {
  const movies = await featuredFilms()
  const excluded = new Set(movies.map(movie => movie.id))
  try {
    const first = await tmdb('/movie/now_playing', { language: 'en-US', region: 'IN', page: '1' })
    const second = Number(first.total_pages) > 1 ? await tmdb('/movie/now_playing', { language: 'en-US', region: 'IN', page: '2' }) : { results: [] }
    const candidates = uniqueMovies([...(first.results ?? []), ...(second.results ?? [])]).filter(movie => !movie.adult && movie.poster_path && !excluded.has(String(movie.id)))
    // Rotate the spotlight daily in India, while preserving genuine trend rank below.
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
    const offset = candidates.length ? Math.floor(Date.parse(date) / 86400000) % candidates.length : 0
    const picks = [...candidates.slice(offset), ...candidates.slice(0, offset)].slice(0, 5)
    const spotlights = await getFilms(picks.map(movie => movie.id))
    return { movies, spotlights, spotlightError: spotlights.length ? '' : 'No spotlight films are available right now. Please retry.' }
  } catch {
    return { movies, spotlights: [], spotlightError: 'Could not load the spotlight films. Please retry.' }
  }
}

// Scan a bounded number of source pages and return a cursor for the next request.
// Exclusions travel with the request so pagination also works across serverless instances.
async function collectFilms(loadPage, { page = 1, exclude = [] }, matches) {
  const seen = new Set(exclude.map(String))
  const results = []
  let cursor = page, totalPages = page
  for (let count = 0; count < 3 && cursor <= totalPages && results.length < 20; count++, cursor++) {
    const data = await loadPage(cursor)
    totalPages = Math.min(Number(data.total_pages) || 1, 500)
    const records = uniqueMovies(data.results ?? []).filter(record => !record.adult && !seen.has(String(record.id)))
    for (const record of records) seen.add(String(record.id))
    const movies = await getFilms(records.map(record => record.id))
    results.push(...movies.filter(matches))
  }
  // Keep every match from scanned pages so the cursor never skips unseen matches.
  return { movies: uniqueMovies(results), nextPage: cursor <= totalPages ? cursor : null }
}

export async function discoverFilms(filters) {
  const { genres = [], excludedGenres = [], languages = [], moods = [], runtime = null } = filters
  const required = [...new Set([...genres, ...moods.filter(mood => MOODS[mood]?.length === 1).map(mood => MOODS[mood][0])])]
  const seed = required.length ? required.join(',') : (MOODS[moods[0]] ?? []).join('|')
  // Multiple original languages need an OR across separate discovery queries.
  // Merge each page, deduplicate IDs, and verify all selected facts after enrichment.
  const loadPage = async page => {
    const pages = await Promise.all((languages.length ? languages : ['']).map(language => tmdb('/discover/movie', {
      language: 'en-US', include_adult: 'false', sort_by: 'popularity.desc', page: String(page),
      'primary_release_date.lte': new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()),
      ...(seed ? { with_genres: seed } : {}), ...(excludedGenres.length ? { without_genres: excludedGenres.join(',') } : {}),
      ...(language ? { with_original_language: language } : {}), ...(runtime ? { 'with_runtime.gte': '1', 'with_runtime.lte': String(runtime - 1) } : {}),
    })))
    return { results: uniqueMovies(pages.flatMap(data => data.results ?? [])), total_pages: Math.max(...pages.map(data => Number(data.total_pages) || 1)) }
  }
  return collectFilms(loadPage, filters, movie => matchesFilters(movie, filters))
}

export async function similarFilms({ id, aspects = [], page = 1, exclude = [] }) {
  const [reference] = await getFilms([id])
  if (!reference) { const error = new Error('The reference film could not be found.'); error.status = 404; throw error }
  if ((aspects.includes('romance') && !reference.genreIds.includes(10749)) || (aspects.includes('cast') && !reference.castIds.length) || (aspects.includes('director') && !reference.directorIds.length) || (aspects.includes('genres') && !reference.genreIds.length)) return { movies: [], nextPage: null, reference }
  const exactPeople = aspects.includes('cast') || aspects.includes('director')
  const loadPage = page => exactPeople ? tmdb('/discover/movie', {
    language: 'en-US', include_adult: 'false', sort_by: 'popularity.desc', page: String(page),
    ...(aspects.includes('cast') ? { with_cast: reference.castIds.join('|') } : {}),
    ...(aspects.includes('director') ? { with_crew: reference.directorIds.join('|') } : {}),
    ...(aspects.includes('romance') ? { with_genres: '10749' } : aspects.includes('genres') ? { with_genres: reference.genreIds.join('|') } : {}),
  }) : tmdb(`/movie/${id}/recommendations`, { language: 'en-US', page: String(page) })
  const result = await collectFilms(loadPage, { page, exclude: [...exclude, id] }, movie => matchesSimilarity(movie, reference, aspects))
  return { ...result, reference }
}
export function recommendationReason(movie, reference) {
  const facts = similarityFacts(movie, reference)
  const t = (key, values) => translate(currentLanguage().code, key, values)
  return [facts.genres.length ? t('Shared genres: {genres}.', { genres: movie.genres.filter((_, index) => facts.genres.includes(movie.genreIds[index])).join(', ') }) : '', facts.cast ? t('Shares cast members.') : '', facts.director ? t('Shares a director or creator.') : ''].filter(Boolean).join(' ') || t('Recommended from the reference title.')
}
export async function searchFilms(query) {
  const data = await tmdb('/search/movie', { query, language: 'en-US', include_adult: 'false', page: '1' })
  return getFilms((data.results ?? []).filter(record => !record.adult).slice(0, 10).map(record => record.id))
}
export async function watchRegions() {
  const data = await tmdb('/watch/providers/regions', { language: 'en-US' })
  const countries = [...new Map((data.results ?? []).flatMap(region => {
    if (!/^[A-Z]{2}$/.test(region?.iso_3166_1 ?? '') || typeof region.english_name !== 'string' || !region.english_name.trim()) return []
    return [[region.iso_3166_1, { code: region.iso_3166_1, name: region.english_name.trim() }]]
  })).values()].sort((a, b) => a.name.localeCompare(b.name, 'en'))
  if (!countries.length) throw new Error('Could not load countries with streaming availability. Please retry.')
  return countries
}
export async function watchProviders(id, country = 'IN', mediaType = 'movie') {
  const data = await tmdb(`/${mediaType}/${id}/watch/providers`)
  const regional = data.results?.[country]
  const categories = [['flatrate', 'Subscription'], ['free', 'Free'], ['ads', 'Free with ads'], ['rent', 'Rent'], ['buy', 'Buy']]
  const groups = categories.flatMap(([type, label]) => {
    const seen = new Set()
    const providers = (Array.isArray(regional?.[type]) ? regional[type] : []).flatMap(provider => {
      if (!Number.isSafeInteger(provider?.provider_id) || provider.provider_id < 1 || typeof provider.provider_name !== 'string' || !provider.provider_name.trim() || seen.has(provider.provider_id)) return []
      seen.add(provider.provider_id)
      return [{ id: provider.provider_id, name: provider.provider_name.trim(), logoUrl: imageUrl(provider.logo_path, 'w92') }]
    })
    return providers.length ? [{ type, label, providers }] : []
  })
  let watchUrl = ''
  try {
    const link = new URL(regional?.link)
    if (link.origin === 'https://www.themoviedb.org' && !link.username && !link.password) watchUrl = link.href
  } catch { /* A missing source link must not invent a playback URL. */ }
  return { countryCode: country, mediaType, groups, watchUrl, source: 'JustWatch', refreshedAt: new Date().toISOString() }
}
export function publicationEvents(releaseData, movie, country, from, to, requestedType = '') {
  const regional = (releaseData.results ?? []).find(entry => entry.iso_3166_1 === country)
  const events = new Map()
  for (const release of regional?.release_dates ?? []) {
    const date = release.release_date?.match(/^(\d{4}-\d{2}-\d{2})T/)?.[1]
    const type = RELEASE_TYPES[release.type]
    if (!date || !type || date < from || date > to || (requestedType && requestedType !== type)) continue
    const event = { eventId: `${movie.id}:${country}:${type}:${date}`, movieId: movie.id, title: movie.title, posterUrl: movie.posterUrl, date, countryCode: country, releaseType: type, originalLanguage: movie.originalLanguage, genreIds: movie.genreIds, source: 'TMDB', sourceUrl: movie.sourceUrl, lastCheckedAt: new Date().toISOString() }
    events.set(event.eventId, event)
  }
  return [...events.values()]
}
export async function releaseCalendar({ from, to, country, genre = '', language = '', releaseType = '' }) {
  const types = Object.entries(RELEASE_TYPES).filter(([, label]) => !releaseType || label === releaseType).map(([id]) => id).join('|')
  const parameters = { region: country, 'release_date.gte': from, 'release_date.lte': to, with_release_type: types, include_adult: 'false', language: 'en-US', sort_by: 'release_date.asc', ...(genre ? { with_genres: genre } : {}), ...(language ? { with_original_language: language } : {}) }
  const first = await tmdb('/discover/movie', { ...parameters, page: '1' })
  const totalPages = Math.max(1, Number(first.total_pages) || 1)
  const lastPage = Math.min(totalPages, 20)
  const pages = await mapBounded(Array.from({ length: lastPage - 1 }, (_, index) => index + 2), page => tmdb('/discover/movie', { ...parameters, page: String(page) }))
  const candidates = [first, ...pages.filter(page => page.ok).map(page => page.value)].flatMap(page => page.results ?? [])
  const ids = [...new Set(candidates.filter(record => !record.adult).map(record => String(record.id)))]
  const movies = await getFilms(ids)
  const movieMap = new Map(movies.map(movie => [movie.id, movie]))
  const dates = await mapBounded(movies, async movie => publicationEvents(state.movies.get(localizedKey(movie.id))?.releaseDates ?? await tmdb(`/movie/${movie.id}/release_dates`), movie, country, from, to, releaseType))
  const events = dates.filter(result => result.ok).flatMap(result => result.value)
  const failed = pages.some(page => !page.ok) || dates.some(result => !result.ok) || movies.length < ids.length
  const partial = totalPages > lastPage || failed
  const warnings = []
  if (totalPages > lastPage) warnings.push(`Showing ${lastPage} of ${totalPages} discovery pages. Narrow the date range or filters to view more.`)
  if (failed) warnings.push('Some release information could not be retrieved. The calendar is incomplete; retry to refresh it.')
  const returnedIds = new Set(events.map(event => event.movieId))
  return { movies: [...returnedIds].map(id => movieMap.get(id)).filter(Boolean), events: [...new Map(events.map(event => [event.eventId, event])).values()], refreshedAt: new Date().toISOString(), source: 'TMDB', partial, warning: warnings.join(' ') }
}
