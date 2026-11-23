import { homeFilms, discoverFilms, similarFilms, recommendationReason, getFilms, releaseCalendar, RELEASE_TYPES, GENRES, searchFilms, watchProviders, watchRegions } from './provider.mjs'
import { isConfigured } from './env.mjs'
import { readDiscoveryOptions } from './discovery.mjs'
import { castTitles, discoverTitles, getTitles, homeCatalogue, readMediaType, readTitleOptions, searchPeople, searchTitles, similarTitles, trendingTitles } from './titles.mjs'
import { withLanguage, currentLanguage } from './language.mjs'
import { requestLanguage } from '../shared/languages.mjs'
import { translate } from '../shared/translations.mjs'

const windows = new Map()
function send(response, status, body) {
  if (body.error && currentLanguage().code !== 'en') {
    const translated = translate(currentLanguage().code, body.error)
    body = { ...body, error: translated === body.error ? translate(currentLanguage().code, 'Could not load data. Please retry.') : translated }
  }
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex' })
  response.end(JSON.stringify(body))
}
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1) return false
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate()
}
export function handleApi(request, response) {
  return withLanguage(requestLanguage(request), () => handleLocalizedApi(request, response))
}
async function handleLocalizedApi(request, response) {
  const url = new URL(request.url ?? '/', 'http://localhost')
  if (!url.pathname.startsWith('/api/')) return false
  if (request.method !== 'GET') { send(response, 405, { error: 'Only GET is supported.' }); return true }
  const ip = request.socket.remoteAddress ?? 'local'
  const now = Date.now()
  if (windows.size > 500) for (const [key, value] of windows) if (value.until < now) windows.delete(key)
  const window = windows.get(ip)
  if (window && window.until > now && window.count >= 120) { send(response, 429, { error: 'Too many requests. Please try again in a minute.' }); return true }
  windows.set(ip, window && window.until > now ? { ...window, count: window.count + 1 } : { until: now + 60000, count: 1 })
  try {
    if (url.pathname === '/api/health') send(response, 200, { provider: 'TMDB', credentialsRequired: true, configured: isConfigured() })
    else if (url.pathname === '/api/watch-regions') send(response, 200, { countries: await watchRegions() })
    else if (url.pathname.startsWith('/api/titles/')) {
      const action = url.pathname.split('/').at(-1)
      if (action === 'featured') send(response, 200, { ...await homeCatalogue(), source: 'TMDB', refreshedAt: new Date().toISOString() })
      else if (action === 'trending') send(response, 200, { titles: await trendingTitles(readMediaType(url.searchParams.get('mediaType') ?? 'all')) })
      else if (action === 'search') {
        const query = (url.searchParams.get('q') ?? '').trim(), page = Number(url.searchParams.get('page') ?? '1'), limit = Number(url.searchParams.get('limit') ?? '20')
        const mediaType = readMediaType(url.searchParams.get('mediaType') ?? 'all')
        if (query.length < 2 || query.length > 120 || !Number.isInteger(page) || page < 1 || page > 500 || !Number.isInteger(limit) || limit < 1 || limit > 20) send(response, 400, { error: 'Enter a title between 2 and 120 characters and choose a valid results page.' })
        else send(response, 200, { ...await searchTitles(query, { mediaType, page, limit }), source: 'TMDB' })
      } else if (action === 'people') {
        const query = (url.searchParams.get('q') ?? '').trim(), page = Number(url.searchParams.get('page') ?? '1')
        if (query.length < 2 || query.length > 120) send(response, 400, { error: 'Enter a name between 2 and 120 characters.' })
        else if (!Number.isInteger(page) || page < 1 || page > 500) send(response, 400, { error: 'Choose an actor or actress and a valid results page.' })
        else send(response, 200, { ...await searchPeople(query, { page }), source: 'TMDB' })
      } else if (action === 'cast') {
        const id = url.searchParams.get('id'), query = (url.searchParams.get('q') ?? '').trim(), page = Number(url.searchParams.get('page') ?? '1')
        const mediaType = readMediaType(url.searchParams.get('mediaType') ?? 'all')
        if ((id !== null ? !/^[1-9]\d{0,9}$/.test(id) : query.length < 2 || query.length > 120) || !Number.isInteger(page) || page < 1 || page > 500) send(response, 400, { error: 'Choose an actor or actress and a valid results page.' })
        else if (id !== null) send(response, 200, { ...await castTitles(id, { mediaType, page }), source: 'TMDB' })
        else {
          const { people } = await searchPeople(query), person = people[0] ?? null
          send(response, 200, { ...(person ? await castTitles(person.id, { mediaType, page }) : { titles: [], nextPage: null }), person, source: 'TMDB' })
        }
      } else if (action === 'discover') send(response, 200, { ...await discoverTitles(readTitleOptions(url.searchParams)), refreshedAt: new Date().toISOString() })
      else if (action === 'recommendations') {
        const { titles, reference, nextPage } = await similarTitles(readTitleOptions(url.searchParams, true))
        send(response, 200, { results: titles.map(movie => ({ movie, reason: recommendationReason(movie, reference) })), nextPage })
      } else if (action === 'details' || action === 'watch-providers') {
        const id = url.searchParams.get('id') ?? '', mediaType = readMediaType(url.searchParams.get('mediaType') ?? 'movie', false)
        if (!/^[1-9]\d{0,9}$/.test(id)) send(response, 400, { error: 'Choose a valid title.' })
        else if (action === 'details') {
          const [movie] = await getTitles([{ id, mediaType }])
          send(response, movie ? 200 : 404, movie ? { movie } : { error: 'This title could not be found.' })
        } else {
          const country = url.searchParams.get('country') ?? 'IN'
          if (!/^[A-Z]{2}$/.test(country)) send(response, 400, { error: 'Choose a valid country.' })
          else if (!(await watchRegions()).some(region => region.code === country)) send(response, 400, { error: 'Streaming availability is not supported for this country.' })
          else send(response, 200, await watchProviders(id, country, mediaType))
        }
      } else send(response, 404, { error: 'This API endpoint does not exist.' })
    }
    else if (url.pathname === '/api/movies/featured') send(response, 200, { ...await homeFilms(), source: 'TMDB', refreshedAt: new Date().toISOString() })
    else if (url.pathname === '/api/movies/discover') {
      const filters = readDiscoveryOptions(url.searchParams, GENRES.map(genre => genre.id))
      send(response, 200, { ...await discoverFilms(filters), refreshedAt: new Date().toISOString() })
    } else if (url.pathname === '/api/movies/recommendations') {
      const options = readDiscoveryOptions(url.searchParams, GENRES.map(genre => genre.id), true)
      const { movies, reference, nextPage } = await similarFilms(options)
      send(response, 200, { results: movies.map(movie => ({ movie, reason: recommendationReason(movie, reference) })), nextPage })
    } else if (url.pathname === '/api/movies/search') {
      const query = (url.searchParams.get('q') ?? '').trim()
      if (query.length < 2 || query.length > 120) send(response, 400, { error: 'Enter a movie title between 2 and 120 characters.' })
      else send(response, 200, { movies: await searchFilms(query), source: 'TMDB', refreshedAt: new Date().toISOString() })
    } else if (url.pathname === '/api/movies/watch-providers') {
      const id = url.searchParams.get('id') ?? '', country = url.searchParams.get('country') ?? 'IN'
      if (!/^[1-9]\d{0,9}$/.test(id) || !/^[A-Z]{2}$/.test(country)) send(response, 400, { error: 'Choose a valid movie and supported country.' })
      else if (!(await watchRegions()).some(region => region.code === country)) send(response, 400, { error: 'Streaming availability is not supported for this country.' })
      else send(response, 200, await watchProviders(id, country))
    } else if (/^\/api\/movies\/[1-9]\d*$/.test(url.pathname)) {
      const movies = await getFilms([url.pathname.split('/').at(-1)])
      send(response, movies.length ? 200 : 404, movies.length ? { movie: movies[0] } : { error: 'This film could not be found in the source.' })
    } else if (url.pathname === '/api/releases') {
      const from = url.searchParams.get('from'), to = url.searchParams.get('to'), country = url.searchParams.get('country') ?? 'IN'
      const genre = url.searchParams.get('genre') ?? '', language = url.searchParams.get('language') ?? '', releaseType = url.searchParams.get('type') ?? ''
      if (!validDate(from) || !validDate(to) || from > to || (Date.parse(to) - Date.parse(from)) / 86400000 > 62 || !['IN', 'US', 'GB', 'CA', 'AU'].includes(country) || (genre && !GENRES.some(option => String(option.id) === genre)) || (language && !/^[a-z]{2}$/.test(language)) || (releaseType && !Object.values(RELEASE_TYPES).includes(releaseType))) send(response, 400, { error: 'Choose a valid date range of at most 62 days, country, and filters.' })
      else send(response, 200, await releaseCalendar({ from, to, country, genre, language, releaseType }))
    } else send(response, 404, { error: 'This API endpoint does not exist.' })
  } catch (error) { send(response, [400, 404, 503].includes(error?.status) ? error.status : 502, { error: error?.name === 'TimeoutError' ? 'The movie service took too long to respond. Please retry.' : error instanceof Error ? error.message : 'The movie service is unavailable. Please retry.' }) }
  return true
}
