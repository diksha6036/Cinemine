import { homeFilms, discoverFilms, similarFilms, recommendationReason, getFilms, releaseCalendar, RELEASE_TYPES, GENRES, searchFilms } from './provider.mjs'
import { isConfigured } from './env.mjs'
import { readDiscoveryOptions } from './discovery.mjs'

const windows = new Map()
function send(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
  response.end(JSON.stringify(body))
}
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1) return false
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate()
}
export async function handleApi(request, response) {
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
