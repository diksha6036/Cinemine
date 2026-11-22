import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { imageUrl, normalizeFilm, publicationEvents, releaseCalendar, homeFilms, discoverFilms, similarFilms, watchProviders, watchRegions } from '../server/provider.mjs'
import { readDiscoveryOptions } from '../server/discovery.mjs'
import { readServerConfig } from '../server/env.mjs'
import { handleApi, validDate } from '../server/api.mjs'

const record = { id: 27205, title: 'Inception', release_date: '2010-07-16', poster_path: '/poster.jpg', backdrop_path: '/backdrop.jpg', original_language: 'en', overview: 'A spoiler-free synopsis.', runtime: 148, genres: [{ id: 878, name: 'Science Fiction' }], credits: { crew: [{ id: 525, name: 'Christopher Nolan', job: 'Director' }], cast: [{ id: 6193, name: 'Leonardo DiCaprio' }] }, videos: { results: [{ site: 'YouTube', type: 'Trailer', official: true, key: 'abcdefghijk' }] }, vote_count: 100, vote_average: 8.3 }
const config = { images: { secure_base_url: 'https://image.tmdb.org/t/p/' } }
const regionsFixture = { results: [{ iso_3166_1: 'IN', english_name: 'India' }, { iso_3166_1: 'US', english_name: 'United States' }, { iso_3166_1: 'GB', english_name: 'United Kingdom' }, { iso_3166_1: 'CA', english_name: 'Canada' }, { iso_3166_1: 'AU', english_name: 'Australia' }, { iso_3166_1: 'FR', english_name: 'France' }, { iso_3166_1: 'JP', english_name: 'Japan' }] }
const watchFixture = { results: {
  IN: { link: 'https://www.themoviedb.org/movie/27205/watch?locale=IN', flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.jpg' }, { provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.jpg' }, { provider_name: 'Unknown provider' }], free: [{ provider_id: 9, provider_name: 'Free service' }], ads: [{ provider_id: 10, provider_name: 'Ad-supported service' }], rent: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: 'https://untrusted.example/logo.jpg' }], buy: [{ provider_id: 2, provider_name: 'Apple TV' }] },
  US: { link: 'https://www.themoviedb.org/movie/27205/watch?locale=US', flatrate: [{ provider_id: 337, provider_name: 'Disney Plus' }] },
  FR: { flatrate: [{ provider_id: 381, provider_name: 'Canal+' }] },
} }
const envNames = ['TMDB_READ_ACCESS_TOKEN', 'TMDB_ACCESS_TOKEN', 'TMDB_API_KEY']
function isolatedEnv(callback, contents = '') {
  const cwd = process.cwd(), saved = Object.fromEntries(envNames.map(name => [name, process.env[name]]))
  const directory = mkdtempSync(join(tmpdir(), 'cinemine-env-test-'))
  for (const name of envNames) delete process.env[name]
  process.chdir(directory)
  if (contents) writeFileSync('.env', contents)
  return Promise.resolve().then(callback).finally(() => { process.chdir(cwd); for (const name of envNames) { if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name] } rmSync(directory, { recursive: true }) })
}

test('normalizes real poster URLs, source facts, credits, and a supplied trailer', () => {
  const movie = normalizeFilm(record)
  assert.equal(movie.id, '27205')
  assert.equal(movie.posterUrl, 'https://image.tmdb.org/t/p/w500/poster.jpg')
  assert.equal(movie.backdropUrl, 'https://image.tmdb.org/t/p/w1280/backdrop.jpg')
  assert.equal(movie.runtimeMinutes, 148)
  assert.equal(movie.releaseYear, 2010)
  assert.deepEqual(movie.originalLanguages, ['en'])
  assert.deepEqual(movie.directors, ['Christopher Nolan'])
  assert.equal(movie.source, 'TMDB')
  assert.equal(movie.trailerUrl, 'https://www.youtube.com/watch?v=abcdefghijk')
  assert.equal(imageUrl('https://untrusted.example/image.jpg'), '')
})
test('unknown facts and missing posters stay missing', () => {
  const movie = normalizeFilm({ id: 1, title: 'A film' })
  assert.equal(movie.runtimeMinutes, null)
  assert.equal(movie.releaseYear, null)
  assert.equal(movie.posterUrl, '')
  assert.deepEqual(movie.originalLanguages, [])
})
test('uses a genuine alternate poster when the primary artwork is missing', () => {
  const movie = normalizeFilm({ ...record, poster_path: null, images: { posters: [{ file_path: 'https://invalid.example/poster.jpg' }, { file_path: '/alternate.jpg' }] } })
  assert.equal(movie.posterUrl, 'https://image.tmdb.org/t/p/w500/alternate.jpg')
})
test('regional dates retain distinct formats while exact duplicates are removed', () => {
  const movie = normalizeFilm(record)
  const releases = { results: [{ iso_3166_1: 'IN', release_dates: [{ type: 3, release_date: '2026-11-16T00:00:00.000Z' }, { type: 3, release_date: '2026-11-16T00:00:00.000Z' }, { type: 4, release_date: '2026-11-27T00:00:00.000Z' }, { type: 1, release_date: '2026-12-01T00:00:00.000Z' }] }, { iso_3166_1: 'US', release_dates: [{ type: 3, release_date: '2026-11-12T00:00:00.000Z' }] }] }
  const events = publicationEvents(releases, movie, 'IN', '2026-11-01', '2026-11-30')
  assert.equal(events.length, 2)
  assert.equal(events[0].date, '2026-11-16')
  assert.equal(events[0].countryCode, 'IN')
  assert.equal(events[1].releaseType, 'Digital')
  assert.equal(publicationEvents(releases, movie, 'GB', '2026-11-01', '2026-11-30').length, 0)
  assert.equal(publicationEvents(releases, movie, 'IN', '2026-11-01', '2026-11-30', 'Digital').length, 1)
})
test('loads quoted credentials from a local .env file without exposing them', async () => {
  await isolatedEnv(() => { assert.equal(readServerConfig().token, 'unit-file-token'); assert.equal(readServerConfig().apiKey, '') }, 'TMDB_READ_ACCESS_TOKEN="unit-file-token"\n')
})
test('unconfigured requests fail clearly and never query a public fallback', async () => {
  await isolatedEnv(async () => {
    const originalFetch = globalThis.fetch
    let requests = 0
    globalThis.fetch = async () => { requests++; throw new Error('Must not fetch') }
    try {
      let status, body
      await handleApi({ url: '/api/movies/featured', method: 'GET', socket: { remoteAddress: 'test-config' } }, { writeHead(code) { status = code }, end(value) { body = JSON.parse(value) } })
      assert.equal(status, 503)
      assert.match(body.error, /local \.env file/)
      assert.equal(requests, 0)
    } finally { globalThis.fetch = originalFetch }
  })
})
test('paginates discovery, fetches regional dates, and keeps authentication server-side', async () => {
  await isolatedEnv(async () => {
    const originalFetch = globalThis.fetch
    const token = 'unit-pagination-token'
    process.env.TMDB_READ_ACCESS_TOKEN = token
    const calls = []
    globalThis.fetch = async (input, options) => {
      const url = new URL(input)
      calls.push(url)
      assert.equal(url.hostname, 'api.themoviedb.org')
      assert.equal(options.headers.Authorization, `Bearer ${token}`)
      assert.equal(url.searchParams.has('api_key'), false)
      if (url.pathname.endsWith('/configuration')) return Response.json(config)
      if (url.pathname.endsWith('/discover/movie')) {
        assert.equal(url.searchParams.get('region'), 'IN')
        return Response.json({ total_pages: 2, results: [{ id: url.searchParams.get('page') === '1' ? 27205 : 680 }] })
      }
      assert.ok(url.searchParams.get('append_to_response').includes('release_dates'))
      return Response.json({ ...record, id: Number(url.pathname.split('/').at(-1)), release_dates: { results: [{ iso_3166_1: 'IN', release_dates: [{ type: 3, release_date: '2026-11-16T00:00:00.000Z' }, { type: 4, release_date: '2026-11-27T00:00:00.000Z' }] }] } })
    }
    try {
      const result = await releaseCalendar({ from: '2026-11-01', to: '2026-11-30', country: 'IN' })
      assert.equal(result.events.length, 4)
      assert.equal(result.movies.length, 2)
      assert.equal(result.partial, false)
      assert.ok(calls.some(url => url.searchParams.get('page') === '2'))
      assert.equal(calls.some(url => url.pathname.endsWith('/release_dates')), false)
      assert.equal(JSON.stringify(result).includes(token), false)
    } finally { globalThis.fetch = originalFetch }
  })
})
test('rejects impossible dates instead of normalizing them', () => {
  assert.equal(validDate('2024-02-29'), true)
  assert.equal(validDate('2025-02-29'), false)
  assert.equal(validDate('2026-11-31'), false)
  assert.equal(validDate('2026-11-16T00:00:00Z'), false)
})

test('watch options keep country and payment categories separate and use existing authenticated caching', async () => {
  await isolatedEnv(async () => {
    const originalFetch = globalThis.fetch
    process.env.TMDB_READ_ACCESS_TOKEN = 'unit-watch-providers'
    let requests = 0
    globalThis.fetch = async (input, options) => {
      const url = new URL(input)
      requests++
      assert.equal(url.href, 'https://api.themoviedb.org/3/movie/27205/watch/providers')
      assert.equal(options.headers.Authorization, 'Bearer unit-watch-providers')
      return Response.json(watchFixture)
    }
    try {
      const india = await watchProviders('27205')
      assert.equal(india.countryCode, 'IN')
      assert.deepEqual(india.groups.map(group => group.label), ['Subscription', 'Free', 'Free with ads', 'Rent', 'Buy'])
      assert.deepEqual(india.groups[0].providers, [{ id: 8, name: 'Netflix', logoUrl: 'https://image.tmdb.org/t/p/w92/netflix.jpg' }])
      assert.equal(india.groups[3].providers[0].logoUrl, '')
      assert.equal(india.groups[4].providers[0].name, 'Apple TV')
      assert.equal(india.watchUrl, watchFixture.results.IN.link)
      assert.equal(india.source, 'JustWatch')
      const us = await watchProviders('27205', 'US')
      assert.equal(us.groups[0].providers[0].name, 'Disney Plus')
      assert.equal(us.watchUrl, watchFixture.results.US.link)
      const missing = await watchProviders('27205', 'GB')
      assert.deepEqual(missing.groups, [])
      assert.equal(missing.watchUrl, '')
      assert.equal(requests, 1)
      assert.equal(JSON.stringify(india).includes(process.env.TMDB_READ_ACCESS_TOKEN), false)
    } finally { globalThis.fetch = originalFetch }
  })
})

test('watch options reject untrusted source links and report upstream errors separately from missing listings', async () => {
  await isolatedEnv(async () => {
    const originalFetch = globalThis.fetch
    process.env.TMDB_READ_ACCESS_TOKEN = 'unit-watch-errors'
    globalThis.fetch = async input => {
      if (new URL(input).pathname.includes('/27205/')) return Response.json({ results: { IN: { ...watchFixture.results.IN, link: 'https://untrusted.example/watch' } } })
      return new Response('', { status: 401 })
    }
    try {
      assert.equal((await watchProviders('27205')).watchUrl, '')
      let status, body
      await handleApi({ url: '/api/movies/watch-providers?id=680', method: 'GET', socket: { remoteAddress: 'test-watch-failure' } }, { writeHead(code) { status = code }, end(value) { body = JSON.parse(value) } })
      assert.equal(status, 502)
      assert.match(body.error, /credential/)
      assert.equal(body.groups, undefined)
      assert.equal(JSON.stringify(body).includes(process.env.TMDB_READ_ACCESS_TOKEN), false)
    } finally { globalThis.fetch = originalFetch }
  })
})

test('watch-provider API validates film IDs and country-code format before fetching', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => { assert.fail('Invalid inputs must not reach TMDB') }
  try {
    for (const query of ['', 'id=0', 'id=-1', 'id=abc', 'id=27205/credits', 'id=99999999999', 'id=27205&country=USA', 'id=27205&country=in', 'id=27205&country=']) {
      let status
      await handleApi({ url: `/api/movies/watch-providers?${query}`, method: 'GET', socket: { remoteAddress: 'test-watch-validation' } }, { writeHead(code) { status = code }, end() {} })
      assert.equal(status, 400, query)
    }
  } finally { globalThis.fetch = originalFetch }
})

test('streaming countries are source-backed, sorted, deduplicated, cached, and available beyond the original five', async () => {
  await isolatedEnv(async () => {
    const originalFetch = globalThis.fetch
    process.env.TMDB_READ_ACCESS_TOKEN = 'unit-watch-regions'
    const calls = []
    globalThis.fetch = async (input, options) => {
      const url = new URL(input)
      calls.push(url.pathname)
      assert.equal(options.headers.Authorization, 'Bearer unit-watch-regions')
      if (url.pathname.endsWith('/watch/providers/regions')) {
        assert.equal(url.searchParams.get('language'), 'en-US')
        return Response.json({ results: [...regionsFixture.results, regionsFixture.results[0], null, { iso_3166_1: 'bad', english_name: 'Invalid' }, { iso_3166_1: 'ZZ', english_name: '' }] })
      }
      assert.equal(url.pathname, '/3/movie/27205/watch/providers')
      return Response.json(watchFixture)
    }
    const request = async path => {
      let status, body
      await handleApi({ url: path, method: 'GET', socket: { remoteAddress: 'test-watch-regions' } }, { writeHead(code) { status = code }, end(value) { body = JSON.parse(value) } })
      return { status, body }
    }
    try {
      const regions = await request('/api/watch-regions')
      assert.equal(regions.status, 200)
      assert.equal(regions.body.countries.length, 7)
      assert.deepEqual(regions.body.countries.map(country => country.name), ['Australia', 'Canada', 'France', 'India', 'Japan', 'United Kingdom', 'United States'])
      assert.deepEqual(await watchRegions(), regions.body.countries)
      const france = await request('/api/movies/watch-providers?id=27205&country=FR')
      assert.equal(france.status, 200)
      assert.equal(france.body.countryCode, 'FR')
      assert.equal(france.body.groups[0].providers[0].name, 'Canal+')
      const japan = await request('/api/movies/watch-providers?id=27205&country=JP')
      assert.equal(japan.status, 200)
      assert.deepEqual(japan.body.groups, [])
      const unsupported = await request('/api/movies/watch-providers?id=27205&country=XX')
      assert.equal(unsupported.status, 400)
      assert.equal(unsupported.body.groups, undefined)
      assert.equal(calls.filter(path => path.endsWith('/regions')).length, 1)
      assert.equal(calls.filter(path => path.endsWith('/watch/providers')).length, 1)
    } finally { globalThis.fetch = originalFetch }
  })
})

test('an empty country response is a retryable source error instead of a fabricated country list', async () => {
  await isolatedEnv(async () => {
    const originalFetch = globalThis.fetch
    process.env.TMDB_READ_ACCESS_TOKEN = 'unit-empty-regions'
    globalThis.fetch = async () => Response.json({ results: [] })
    try { await assert.rejects(watchRegions, /Could not load countries/) }
    finally { globalThis.fetch = originalFetch }
  })
})

test('Vercel functions serve public API URLs using environment-only credentials', async () => {
  await isolatedEnv(async () => {
    const originalFetch = globalThis.fetch
    const token = 'unit-vercel-environment-token'
    process.env.TMDB_READ_ACCESS_TOKEN = token
    globalThis.fetch = async (input, options) => {
      const url = new URL(input)
      assert.equal(options.headers.Authorization, `Bearer ${token}`)
      if (url.pathname.endsWith('/watch/providers/regions')) return Response.json(regionsFixture)
      if (url.pathname.endsWith('/watch/providers')) return Response.json(watchFixture)
      if (url.pathname.endsWith('/configuration')) return Response.json(config)
      if (url.pathname.endsWith('/search/movie')) assert.equal(url.searchParams.get('query'), 'Inception')
      if (url.pathname.endsWith('/discover/movie')) {
        if (url.searchParams.has('release_date.gte')) assert.equal(url.searchParams.get('region'), 'IN')
        assert.equal(url.searchParams.get('with_genres'), '878')
      }
      if (url.pathname.endsWith('/recommendations')) return Response.json({ total_pages: 1, results: [{ id: 680 }] })
      if (!/\/movie\/\d+$/.test(url.pathname)) return Response.json({ total_pages: 1, results: [{ id: 27205 }] })
      return Response.json({ ...record, id: Number(url.pathname.split('/').at(-1)), release_dates: { results: [{ iso_3166_1: 'IN', release_dates: [{ type: 3, release_date: '2026-11-16T00:00:00.000Z' }] }] } })
    }
    const routes = [
      ['../api/health.js', '/api/health', body => assert.equal(body.configured, true)],
      ['../api/watch-regions.js', '/api/watch-regions', body => assert.ok(body.countries.some(country => country.code === 'JP'))],
      ['../api/movies/featured.js', '/api/movies/featured', body => assert.equal(body.movies[0].id, '27205')],
      ['../api/movies/search.js', '/api/movies/search?q=Inception', body => assert.equal(body.movies[0].title, 'Inception')],
      ['../api/movies/discover.js', '/api/movies/discover?genres=878', body => assert.equal(body.movies[0].id, '27205')],
      ['../api/movies/recommendations.js', '/api/movies/recommendations?id=27205&aspects=genres', body => assert.equal(body.results[0].movie.id, '680')],
      ['../api/movies/[id].js', '/api/movies/27205', body => assert.equal(body.movie.runtimeMinutes, 148)],
      ['../api/movies/watch-providers.js', '/api/movies/watch-providers?id=27205&country=US', body => { assert.equal(body.countryCode, 'US'); assert.equal(body.groups[0].providers[0].name, 'Disney Plus') }],
      ['../api/releases.js', '/api/releases?from=2026-11-01&to=2026-11-30&country=IN&genre=878&type=Theatrical', body => { assert.equal(body.events.length, 1); assert.equal(body.events[0].countryCode, 'IN') }],
    ]
    try {
      for (const [entry, url, check] of routes) {
        const { default: handler } = await import(entry)
        let status, headers, body
        await handler({ url, method: 'GET', socket: { remoteAddress: 'test-vercel' } }, { writeHead(code, values) { status = code; headers = values }, end(value) { assert.equal(value.includes(token), false); body = JSON.parse(value) } })
        assert.equal(status, 200, url)
        assert.match(headers['Content-Type'], /application\/json/)
        check(body)
      }
    } finally { globalThis.fetch = originalFetch }
  })
})

test('Netlify web handler preserves API paths, queries, statuses, and private environment authentication', async () => {
  await isolatedEnv(async () => {
    const { default: handler } = await import('../netlify/functions/movie-api.mjs')
    const request = (path, method = 'GET') => handler(new Request(`https://cinemine.example${path}`, { method }), { ip: 'test-netlify' })
    const health = await request('/api/health')
    assert.equal(health.status, 200)
    assert.equal((await health.json()).configured, false)
    assert.equal((await request('/api/movies/featured')).status, 503)
    const originalFetch = globalThis.fetch
    const token = 'unit-netlify-environment-token'
    process.env.TMDB_READ_ACCESS_TOKEN = token
    globalThis.fetch = async (input, options) => {
      const url = new URL(input)
      assert.equal(options.headers.Authorization, `Bearer ${token}`)
      if (url.pathname.endsWith('/watch/providers/regions')) return Response.json(regionsFixture)
      if (url.pathname.endsWith('/watch/providers')) return Response.json(watchFixture)
      if (url.pathname.endsWith('/configuration')) return Response.json(config)
      if (url.pathname.endsWith('/search/movie')) {
        assert.equal(url.searchParams.get('query'), 'Inception & dreams')
        return Response.json({ results: [{ id: 27205 }] })
      }
      return Response.json(record)
    }
    try {
      assert.equal((await (await request('/api/health')).json()).configured, true)
      const response = await request('/api/movies/search?q=Inception%20%26%20dreams')
      assert.equal(response.status, 200)
      assert.match(response.headers.get('content-type'), /application\/json/)
      assert.equal(response.headers.get('cache-control'), 'no-store')
      const text = await response.text()
      assert.equal(text.includes(token), false)
      assert.equal(JSON.parse(text).movies[0].id, '27205')
      const detail = await request('/api/movies/27205')
      assert.equal(detail.status, 200)
      assert.equal((await detail.json()).movie.runtimeMinutes, 148)
      const availability = await request('/api/movies/watch-providers?id=27205')
      assert.equal(availability.status, 200)
      assert.equal((await availability.json()).groups[0].providers[0].name, 'Netflix')
      assert.ok((await (await request('/api/watch-regions')).json()).countries.some(country => country.code === 'FR'))
      const france = await request('/api/movies/watch-providers?id=27205&country=FR')
      assert.equal(france.status, 200)
      assert.equal((await france.json()).groups[0].providers[0].name, 'Canal+')
      assert.equal((await request('/api/movies/search?q=x')).status, 400)
      assert.equal((await request('/api/movies/search?q=Inception', 'POST')).status, 405)
      assert.equal((await request('/api/unknown')).status, 404)
      assert.equal((await request('/not-an-api-route')).status, 404)
    } finally { globalThis.fetch = originalFetch }
  })
})

test('home uses daily trends and a separate deduplicated spotlight pool', async () => {
  await isolatedEnv(async () => {
    process.env.TMDB_READ_ACCESS_TOKEN = 'unit-home-selection'
    const originalFetch = globalThis.fetch
    globalThis.fetch = async input => {
      const url = new URL(input)
      if (url.pathname.endsWith('/configuration')) return Response.json(config)
      if (url.pathname.includes('/trending/')) {
        assert.ok(url.pathname.endsWith('/day'))
        return Response.json({ results: [1, 1, ...Array.from({ length: 20 }, (_, i) => i + 2)].map(id => ({ id })) })
      }
      if (url.pathname.endsWith('/now_playing')) return Response.json({ total_pages: 1, results: [1, 2, 31, 32, 33, 33, 34, 35, 36, 37].map(id => ({ id, poster_path: '/poster.jpg' })) })
      return Response.json({ ...record, id: Number(url.pathname.split('/').at(-1)) })
    }
    try {
      const result = await homeFilms()
      assert.equal(result.movies.length, 20)
      assert.equal(result.spotlights.length, 5)
      assert.equal(new Set(result.movies.map(movie => movie.id)).size, 20)
      assert.equal(new Set(result.spotlights.map(movie => movie.id)).size, 5)
      assert.ok(result.spotlights.every(movie => !result.movies.some(trend => trend.id === movie.id)))
      assert.equal(result.spotlightError, '')
    } finally { globalThis.fetch = originalFetch }
  })
})

test('live discovery enforces combined preferences and excludes duplicates across result pages', async () => {
  await isolatedEnv(async () => {
    process.env.TMDB_READ_ACCESS_TOKEN = 'unit-discovery-filters'
    const originalFetch = globalThis.fetch
    const records = {
      1: { runtime: 119 }, 2: { runtime: 120 }, 3: { runtime: 0 },
      4: { original_language: 'en' }, 5: { genres: [{ id: 35, name: 'Comedy' }] },
      6: {}, 7: {}, 8: { genres: [{ id: 35, name: 'Comedy' }, { id: 27, name: 'Horror' }] },
    }
    const pages = { 1: [1, 1, 2, 3, 8], 2: [1, 4, 5, 6], 3: [6], 4: [1, 6, 7] }
    globalThis.fetch = async input => {
      const url = new URL(input)
      if (url.pathname.endsWith('/configuration')) return Response.json(config)
      if (url.pathname.endsWith('/discover/movie')) {
        assert.equal(url.searchParams.get('with_original_language'), 'hi')
        assert.equal(url.searchParams.get('with_runtime.lte'), '119')
        assert.equal(url.searchParams.get('with_runtime.gte'), '1')
        assert.equal(url.searchParams.get('with_genres'), '35')
        assert.equal(url.searchParams.get('without_genres'), '27')
        return Response.json({ total_pages: 4, results: pages[url.searchParams.get('page')].map(id => ({ id })) })
      }
      const id = Number(url.pathname.split('/').at(-1))
      return Response.json({ ...record, id, runtime: 90, original_language: 'hi', genres: [{ id: 35, name: 'Comedy' }, { id: 53, name: 'Thriller' }], ...records[id] })
    }
    try {
      const filters = { genres: [35], excludedGenres: [27], languages: ['hi'], runtime: 120, moods: ['Funny', 'Thrilling'] }
      const first = await discoverFilms(filters)
      assert.deepEqual(first.movies.map(movie => movie.id), ['1', '6'])
      assert.equal(first.nextPage, 4)
      const next = await discoverFilms({ ...filters, page: first.nextPage, exclude: first.movies.map(movie => movie.id) })
      assert.deepEqual(next.movies.map(movie => movie.id), ['7'])
      assert.equal(next.nextPage, null)
    } finally { globalThis.fetch = originalFetch }
  })
})

test('similar films query beyond the homepage and enforce people preferences without recommending the reference', async () => {
  await isolatedEnv(async () => {
    process.env.TMDB_READ_ACCESS_TOKEN = 'unit-similarity-filters'
    const originalFetch = globalThis.fetch
    globalThis.fetch = async input => {
      const url = new URL(input)
      if (url.pathname.endsWith('/configuration')) return Response.json(config)
      if (url.pathname.endsWith('/recommendations')) return Response.json({ total_pages: 1, results: [1, 2, 2, 3, 4].map(id => ({ id })) })
      if (url.pathname.endsWith('/discover/movie')) {
        assert.equal(url.searchParams.get('with_cast'), '6193')
        assert.equal(url.searchParams.get('with_crew'), '525')
        return Response.json({ total_pages: 1, results: [1, 2, 3, 4].map(id => ({ id })) })
      }
      const id = Number(url.pathname.split('/').at(-1))
      return Response.json({ ...record, id, credits: { crew: [{ id: id === 3 ? 700 : 525, name: 'Director', job: 'Director' }], cast: [{ id: id === 4 ? 999 : 6193 }] } })
    }
    try {
      const recommended = await similarFilms({ id: '1', aspects: ['genres'] })
      assert.deepEqual(recommended.movies.map(movie => movie.id), ['2', '3', '4'])
      const people = await similarFilms({ id: '1', aspects: ['genres', 'cast', 'director'] })
      assert.deepEqual(people.movies.map(movie => movie.id), ['2'])
      assert.equal(people.nextPage, null)
    } finally { globalThis.fetch = originalFetch }
  })
})

test('discovery rejects invalid filters and unbounded page requests', () => {
  for (const query of ['page=0', 'page=501', 'genres=999', 'runtime=0', 'runtime=abc', 'moods=unknown', 'languages=english', 'exclude=abc']) {
    assert.throws(() => readDiscoveryOptions(new URLSearchParams(query), [35, 53]), { status: 400 })
  }
  assert.throws(() => readDiscoveryOptions(new URLSearchParams('id=bad'), [35], true), { status: 400 })
})
