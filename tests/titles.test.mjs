import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getFilms, getSeries, normalizeSeries, watchProviders } from '../server/provider.mjs'
import { castTitles, discoverTitles, homeCatalogue, readTitleOptions, searchTitles, similarTitles } from '../server/titles.mjs'
import { handleApi } from '../server/api.mjs'
import { matchesSimilarity } from '../server/discovery.mjs'
import { mediaKey, titlePath } from '../shared/media.mjs'
import { createMetadata } from '../shared/seo.mjs'
import { movieSitemapXml } from '../server/sitemaps.mjs'
import { renderDocument } from '../server/html.mjs'

const movieRecord = { id: 7, title: 'A movie', release_date: '2010-07-16', overview: 'Movie overview.', poster_path: '/movie.jpg', original_language: 'hi', runtime: 59, genres: [{ id: 35, name: 'Comedy' }, { id: 18, name: 'Drama' }], credits: { crew: [{ id: 70, name: 'A director', job: 'Director' }], cast: [{ id: 100, name: 'An actor', character: 'A role' }] } }
const seriesRecord = { id: 7, name: 'A web series', first_air_date: '2018-04-03', last_air_date: '2023-05-20', overview: 'Series overview.', poster_path: '/series.jpg', original_language: 'hi', episode_run_time: [24, 30], created_by: [{ id: 70, name: 'A creator' }], number_of_seasons: 3, number_of_episodes: 30, status: 'Ended', genres: movieRecord.genres, aggregate_credits: { cast: [{ id: 100, name: 'An actor', roles: [{ character: 'A series role' }] }], crew: [] }, keywords: { results: [] }, seasons: [{ id: 90, season_number: 1, name: 'Season 1', episode_count: 10, air_date: '2018-04-03', overview: 'Season overview.' }], networks: [{ name: 'A network' }] }
let testNumber = 0
async function isolated(run, mock) {
  const cwd = process.cwd(), names = ['TMDB_READ_ACCESS_TOKEN', 'TMDB_ACCESS_TOKEN', 'TMDB_API_KEY'], saved = Object.fromEntries(names.map(name => [name, process.env[name]])), originalFetch = globalThis.fetch
  const directory = mkdtempSync(join(tmpdir(), 'cinemine-titles-'))
  process.chdir(directory)
  for (const name of names) delete process.env[name]
  const token = `unit-titles-${++testNumber}`
  process.env.TMDB_READ_ACCESS_TOKEN = token
  const calls = []
  globalThis.fetch = async (input, options) => {
    const url = new URL(input)
    calls.push(url)
    assert.equal(url.hostname, 'api.themoviedb.org')
    assert.equal(options.headers.Authorization, `Bearer ${token}`)
    assert.equal(url.searchParams.has('api_key'), false)
    if (url.pathname.endsWith('/configuration')) return Response.json({ images: { secure_base_url: 'https://image.tmdb.org/t/p/' } })
    if (url.pathname.endsWith('/watch/providers/regions')) return Response.json({ results: [{ iso_3166_1: 'IN', english_name: 'India' }, { iso_3166_1: 'US', english_name: 'United States' }] })
    const response = await mock?.(url)
    if (response) return response
    if (/\/movie\/\d+$/.test(url.pathname)) return Response.json({ ...movieRecord, id: Number(url.pathname.split('/').at(-1)) })
    if (/\/tv\/\d+$/.test(url.pathname)) return Response.json({ ...seriesRecord, id: Number(url.pathname.split('/').at(-1)) })
    throw new Error(`Unexpected fixture request: ${url.pathname}`)
  }
  try { return await run({ calls, token }) }
  finally { globalThis.fetch = originalFetch; process.chdir(cwd); for (const name of names) { if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name] } rmSync(directory, { recursive: true }) }
}
async function request(url) {
  let status, body
  await handleApi({ url, method: 'GET', socket: { remoteAddress: 'test-titles' } }, { writeHead(code) { status = code }, end(value) { body = JSON.parse(value) } })
  return { status, body }
}

test('series facts use creators, episode duration, seasons and aggregate cast without inventing missing facts', () => {
  const series = normalizeSeries(seriesRecord)
  assert.equal(series.mediaType, 'tv')
  assert.equal(series.title, 'A web series')
  assert.equal(series.runtimeMinutes, 30)
  assert.deepEqual(series.episodeRuntimeMinutes, [24, 30])
  assert.deepEqual(series.creators, ['A creator'])
  assert.deepEqual(series.directors, [])
  assert.equal(series.cast[0].character, 'A series role')
  assert.equal(series.seasons[0].episodeCount, 10)
  assert.equal(series.numberOfEpisodes, 30)
  assert.equal(series.releaseYear, 2018)
  assert.equal(series.sourceUrl, 'https://www.themoviedb.org/tv/7')
  const missing = normalizeSeries({ id: 8, name: 'Unknown facts' })
  assert.equal(missing.runtimeMinutes, null)
  assert.equal(missing.numberOfEpisodes, null)
  assert.equal(missing.numberOfSeasons, null)
  assert.deepEqual(missing.creators, [])
})

test('combined search preserves movie/series ID collisions and source rank, excludes people/adult records, and paginates', async () => {
  await isolated(async ({ token, calls }) => {
    const result = await searchTitles('A title')
    assert.deepEqual(result.titles.map(title => [title.mediaType, title.id, title.title]), [['movie', '7', 'A movie'], ['tv', '7', 'A web series']])
    assert.equal(result.nextPage, 2)
    assert.equal(JSON.stringify(result).includes(token), false)
    assert.ok(calls.some(url => url.pathname === '/3/tv/7' && url.searchParams.get('append_to_response').includes('aggregate_credits')))
    const [movie] = await getFilms(['7']), [series] = await getSeries(['7'])
    assert.notEqual(movie.title, series.title)
    assert.equal(titlePath(movie), '/movie/7')
    assert.equal(titlePath(series), '/series/7')
    const next = await searchTitles('A title', { page: 2 })
    assert.equal(next.nextPage, null)
  }, url => url.pathname.endsWith('/search/multi') ? Response.json({ total_pages: 2, results: [{ id: 7, media_type: 'person' }, { id: 7, media_type: 'movie' }, { id: 7, media_type: 'tv' }, { id: 7, media_type: 'tv' }, { id: 8, media_type: 'tv', adult: true }] }) : undefined)
})

test('movie and series search filters use their own source endpoints', async () => {
  await isolated(async ({ calls }) => {
    const movies = await searchTitles('A title', { mediaType: 'movie' })
    const series = await searchTitles('A title', { mediaType: 'tv' })
    assert.equal(movies.titles[0].mediaType, 'movie')
    assert.equal(series.titles[0].mediaType, 'tv')
    assert.ok(calls.some(url => url.pathname === '/3/search/movie'))
    assert.ok(calls.some(url => url.pathname === '/3/search/tv'))
  }, url => /\/search\/(movie|tv)$/.test(url.pathname) ? Response.json({ results: [{ id: 7 }], total_pages: 1 }) : undefined)
})

test('actor suggestions preserve Unicode queries and distinguish people with known titles without exposing credentials', async () => {
  await isolated(async ({ calls, token }) => {
    const result = await request('/api/titles/people?q=%20आलिया%20%20')
    assert.equal(result.status, 200)
    assert.deepEqual(result.body.people, [{ id: '100', name: 'आलिया भट्ट', profileUrl: 'https://image.tmdb.org/t/p/w185/actor.jpg', knownFor: ['A movie', 'A series'] }, { id: '101', name: 'Another actor', profileUrl: '', knownFor: [] }])
    const search = calls.find(url => url.pathname.endsWith('/search/person'))
    assert.equal(search.searchParams.get('query'), 'आलिया')
    assert.equal(search.searchParams.get('include_adult'), 'false')
    assert.equal(JSON.stringify(result.body).includes(token), false)
    assert.equal(calls.some(url => /\/(movie|tv)\/\d+$/.test(url.pathname)), false, 'suggestions do not hydrate every known title')
  }, url => url.pathname.endsWith('/search/person') ? Response.json({ results: [
    { id: 100, name: 'आलिया भट्ट', known_for_department: 'Acting', profile_path: '/actor.jpg', known_for: [{ title: 'A movie', media_type: 'movie' }, { name: 'A series', media_type: 'tv' }, { title: 'Excluded', media_type: 'movie', adult: true }] },
    { id: 101, name: 'Another actor', known_for_department: 'Acting', profile_path: 'https://invalid.example/photo.jpg' },
    { id: 102, name: 'Crew member', known_for_department: 'Directing' },
    { id: 103, name: 'Excluded', known_for_department: 'Acting', adult: true },
    { id: '../invalid', name: 'Invalid', known_for_department: 'Acting' },
  ] }) : url.pathname.endsWith('/person/102/combined_credits') ? Response.json({ cast: [], crew: [{ id: 7, media_type: 'movie' }] }) : undefined)
})

test('actor suggestions expose every source page and include credited actors with another or missing primary department', async () => {
  await isolated(async ({ calls }) => {
    const first = await request('/api/titles/people?q=Actor')
    assert.equal(first.status, 200)
    assert.equal(first.body.people.length, 20, 'the first page is no longer truncated to ten suggestions')
    assert.equal(first.body.nextPage, 2)
    const second = await request('/api/titles/people?q=Actor&page=2')
    assert.equal(second.status, 200)
    assert.equal(second.body.nextPage, null)
    assert.deepEqual(second.body.people.map(person => person.id), ['119', '120', '121', '123'])
    assert.deepEqual(second.body.people.find(person => person.id === '120').knownFor, ['A movie'])
    assert.equal(second.body.people.find(person => person.id === '123').profileUrl, '')
    assert.ok(calls.some(url => url.pathname.endsWith('/search/person') && url.searchParams.get('page') === '2'))
    assert.ok(!calls.some(url => url.pathname.endsWith('/person/125/combined_credits')), 'excluded adult people are not looked up')
  }, url => {
    if (url.pathname.endsWith('/search/person')) return Response.json({ total_pages: 2, results: url.searchParams.get('page') === '1' ? Array.from({ length: 20 }, (_, index) => ({ id: 100 + index, name: `Actor ${index}`, known_for_department: 'Acting' })) : [
      { id: 119, name: 'Actor 19', known_for_department: 'Acting' },
      { id: 120, name: 'Actor and director', known_for_department: 'Directing' },
      { id: 121, name: 'Actor with incomplete metadata' },
      { id: 122, name: 'Crew only', known_for_department: 'Writing' },
      { id: 123, name: 'Actor without a photo', known_for_department: 'Acting' },
      { id: 124, name: 'Interview guest', known_for_department: 'Production' },
      { id: 125, name: 'Excluded', adult: true },
      { id: 126, name: 'Deleted source person' },
    ] })
    if (url.pathname.endsWith('/person/120/combined_credits')) return Response.json({ cast: [{ id: 7, media_type: 'movie', title: 'A movie', character: 'A role' }] })
    if (url.pathname.endsWith('/person/121/combined_credits')) return Response.json({ cast: [{ id: 7, media_type: 'tv', name: 'A series', character: 'A voice (voice)' }] })
    if (url.pathname.endsWith('/person/122/combined_credits')) return Response.json({ cast: [], crew: [{ id: 7, media_type: 'movie' }] })
    if (url.pathname.endsWith('/person/124/combined_credits')) return Response.json({ cast: [{ id: 7, media_type: 'tv', character: 'Self' }] })
    if (url.pathname.endsWith('/person/126/combined_credits')) return new Response('', { status: 404 })
  })
})

test('a people page without actors preserves the next page instead of replacing the query with typo guesses', async () => {
  await isolated(async ({ calls }) => {
    const first = await request('/api/titles/people?q=Regional%20performer')
    assert.equal(first.status, 200)
    assert.deepEqual(first.body.people, [])
    assert.equal(first.body.nextPage, 2)
    const second = await request('/api/titles/people?q=Regional%20performer&page=2')
    assert.equal(second.body.people[0].name, 'Regional performer')
    assert.equal(second.body.nextPage, null)
    assert.ok(calls.filter(url => url.pathname.endsWith('/search/person')).every(url => url.searchParams.get('query') === 'Regional performer'))
  }, url => url.pathname.endsWith('/search/person') ? Response.json({ total_pages: 2, results: url.searchParams.get('page') === '1' ? [{ id: 100, name: 'Crew', known_for_department: 'Directing' }] : [{ id: 101, name: 'Regional performer', known_for_department: 'Acting' }] }) : url.pathname.endsWith('/person/100/combined_credits') ? Response.json({ cast: [] }) : undefined)
})

test('a failure verifying missing department data stays retryable rather than hiding an actor', async () => {
  await isolated(async () => {
    const result = await request('/api/titles/people?q=New%20performer')
    assert.equal(result.status, 502)
    assert.ok(result.body.error)
  }, url => url.pathname.endsWith('/search/person') ? Response.json({ results: [{ id: 100, name: 'New performer' }] }) : url.pathname.endsWith('/person/100/combined_credits') ? new Response('', { status: 503 }) : undefined)
})

test('acting credits paginate and filter by type without conflating IDs, including crew work, or returning adult titles', async () => {
  await isolated(async () => {
    const first = await request('/api/titles/cast?id=100&mediaType=all')
    assert.equal(first.status, 200)
    assert.equal(first.body.titles.length, 20)
    assert.deepEqual(first.body.titles.slice(0, 2).map(mediaKey), ['movie:7', 'tv:7'])
    assert.equal(first.body.nextPage, 2)
    const second = await castTitles('100', { mediaType: 'all', page: 2 })
    assert.equal(second.nextPage, null)
    assert.equal(second.titles.length, 3, 'hydrated adult title is excluded too')
    const all = [...first.body.titles, ...second.titles].map(mediaKey)
    assert.equal(new Set(all).size, 23)
    assert.ok(!all.some(key => ['movie:8', 'movie:9', 'movie:40'].includes(key)))
    const movies = await request('/api/titles/cast?id=100&mediaType=movie')
    assert.ok(movies.body.titles.every(title => title.mediaType === 'movie'))
    const series = await request('/api/titles/cast?id=100&mediaType=tv')
    assert.deepEqual(series.body.titles.map(mediaKey), ['tv:7'])
    assert.equal(series.body.nextPage, null)
  }, url => {
    if (url.pathname.endsWith('/person/100/combined_credits')) return Response.json({ cast: [
      { id: 7, media_type: 'movie', popularity: 1000 }, { id: 7, media_type: 'tv', popularity: 900 },
      { id: 7, media_type: 'movie', popularity: 800 }, { id: 8, media_type: 'movie', adult: true },
      { id: 10, media_type: 'person' }, { id: '../invalid', media_type: 'movie' },
      ...Array.from({ length: 22 }, (_, index) => ({ id: 20 + index, media_type: 'movie', popularity: 100 - index })),
    ], crew: [{ id: 9, media_type: 'movie', popularity: 2000 }] })
    if (url.pathname.endsWith('/movie/40')) return Response.json({ ...movieRecord, id: 40, adult: true })
  })
})

test('unknown people and empty acting credits return an empty state; source failures remain errors', async () => {
  await isolated(async () => {
    assert.deepEqual((await request('/api/titles/people?q=Nobody')).body.people, [])
    const empty = await request('/api/titles/cast?id=100')
    assert.equal(empty.status, 200)
    assert.deepEqual(empty.body.titles, [])
    assert.equal(empty.body.nextPage, null)
    const failed = await request('/api/titles/cast?id=101')
    assert.equal(failed.status, 502)
    assert.ok(failed.body.error)
  }, url => url.pathname.endsWith('/search/person') ? Response.json({ results: [] }) : url.pathname.endsWith('/person/100/combined_credits') ? Response.json({ cast: [], crew: [{ id: 7, media_type: 'movie' }] }) : url.pathname.endsWith('/person/101/combined_credits') ? new Response('', { status: 503 }) : undefined)
})

test('actor search defaults to All and excludes interviews, reality shows and archive appearances', async () => {
  await isolated(async () => {
    const defaults = await request('/api/titles/cast?id=100')
    assert.equal(defaults.status, 200)
    assert.deepEqual(defaults.body.titles.map(mediaKey), ['movie:7', 'tv:7', 'movie:14'])
    assert.deepEqual(defaults.body.roles, { 'movie:7': 'A fictional role', 'tv:7': 'A series role', 'movie:14': 'Hostage negotiator' })
    const movies = await request('/api/titles/cast?id=100&mediaType=movie')
    assert.deepEqual(movies.body.titles.map(mediaKey), ['movie:7', 'movie:14'])
    const all = await request('/api/titles/cast?id=100&mediaType=all')
    assert.deepEqual(all.body.titles.map(mediaKey), ['movie:7', 'tv:7', 'movie:14'])
    assert.equal(all.body.roles['tv:7'], 'A series role')
    const series = await request('/api/titles/cast?id=100&mediaType=tv')
    assert.deepEqual(series.body.titles.map(mediaKey), ['tv:7'])
  }, url => url.pathname.endsWith('/person/100/combined_credits') ? Response.json({ cast: [
    { id: 8, media_type: 'tv', character: 'Self', popularity: 1000 },
    { id: 9, media_type: 'tv', character: '', genre_ids: [10764], popularity: 900 },
    { id: 10, media_type: 'tv', character: '', genre_ids: [10767], popularity: 800 },
    { id: 11, media_type: 'tv', character: '', genre_ids: [99], popularity: 700 },
    { id: 12, media_type: 'movie', character: 'An actor (archive footage)', popularity: 600 },
    { id: 13, media_type: 'movie', character: 'Herself (Special Appearance)', popularity: 500 },
    { id: 7, media_type: 'movie', character: 'A fictional role', popularity: 300 },
    { id: 7, media_type: 'tv', character: 'Self', popularity: 250 },
    { id: 7, media_type: 'tv', character: 'A series role', genre_ids: [18], popularity: 200 },
    { id: 14, media_type: 'movie', character: 'Hostage negotiator', popularity: 100 },
  ], crew: [{ id: 15, media_type: 'movie' }] }) : undefined)
})

test('typed actor searches tolerate misspellings and spacing without matching unrelated people', async () => {
  await isolated(async ({ calls }) => {
    const alia = await request('/api/titles/cast?q=Alia%20Bhaatt&mediaType=movie')
    assert.equal(alia.status, 200)
    assert.equal(alia.body.person.name, 'Alia Bhatt')
    assert.deepEqual(alia.body.titles.map(mediaKey), ['movie:7'])
    const shah = await request('/api/titles/cast?q=shahruk%20khan')
    assert.equal(shah.status, 200)
    assert.equal(shah.body.person.name, 'Shah Rukh Khan')
    const unknown = await request('/api/titles/cast?q=Unknown%20Khan')
    assert.equal(unknown.status, 200)
    assert.equal(unknown.body.person, null)
    assert.deepEqual(unknown.body.titles, [])
    assert.ok(!calls.some(url => url.pathname.endsWith('/person/102/combined_credits')), 'a common surname does not select an unrelated actor')
    const searchCalls = calls.filter(url => url.pathname.endsWith('/search/person'))
    assert.ok(searchCalls.length <= 9, 'fallback is bounded to the full name and two name parts per query')
  }, url => {
    if (url.pathname.endsWith('/search/person')) {
      const q = url.searchParams.get('query')
      const results = q === 'Alia' ? [{ id: 100, name: 'Alia Bhatt', known_for_department: 'Acting' }] : q === 'khan' || q === 'Khan' ? [
        { id: 102, name: 'Salman Khan', known_for_department: 'Acting', popularity: 1000 },
        { id: 101, name: 'Shah Rukh Khan', known_for_department: 'Acting' },
      ] : []
      return Response.json({ results })
    }
    if (/\/person\/(100|101)\/combined_credits$/.test(url.pathname)) return Response.json({ cast: [{ id: 7, media_type: 'movie' }] })
  })
})

test('people APIs reject invalid input before calling the source', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => assert.fail('Invalid people inputs must not contact TMDB')
  try {
    for (const path of ['/api/titles/people?q=x', `/api/titles/people?q=${'a'.repeat(121)}`, '/api/titles/people?q=Actor&page=0', '/api/titles/people?q=Actor&page=1.5', '/api/titles/people?q=Actor&page=501', '/api/titles/cast?q=x', `/api/titles/cast?q=${'a'.repeat(121)}`, '/api/titles/cast?id=../x', '/api/titles/cast?id=0', '/api/titles/cast?id=100&page=1.5', '/api/titles/cast?id=100&page=501', '/api/titles/cast?id=100&mediaType=person']) assert.equal((await request(path)).status, 400, path)
  } finally { globalThis.fetch = original }
})

test('mixed discovery verifies every preference, episode runtime boundaries, and typed exclusions across pages', async () => {
  await isolated(async () => {
    const options = readTitleOptions(new URLSearchParams('mediaType=all&genres=35,18&languages=hi&moods=Funny,Emotional&runtime=60&exclude=movie:7'))
    const first = await discoverTitles(options)
    assert.deepEqual(new Set(first.titles.map(mediaKey)), new Set(['movie:10', 'tv:7']))
    assert.equal(first.nextPage, 4)
    const next = await discoverTitles({ ...options, page: 4, exclude: [...options.exclude, ...first.titles.map(mediaKey)] })
    assert.deepEqual(next.titles, [])
    assert.equal(next.nextPage, null)
  }, url => {
    if (/\/discover\/(movie|tv)$/.test(url.pathname)) {
      assert.equal(url.searchParams.get('with_original_language'), 'hi')
      assert.equal(url.searchParams.get('with_runtime.lte'), '59')
      return Response.json({ total_pages: 4, results: [7, 8, 9, 10].map(id => ({ id })) })
    }
    if (/\/tv\/\d+$/.test(url.pathname)) {
      const id = Number(url.pathname.split('/').at(-1))
      return Response.json({ ...seriesRecord, id, ...(id === 8 ? { episode_run_time: [60] } : id === 9 ? { episode_run_time: [] } : id === 10 ? { genres: [{ id: 18, name: 'Drama' }] } : {}) })
    }
    if (/\/movie\/\d+$/.test(url.pathname)) {
      const id = Number(url.pathname.split('/').at(-1))
      return Response.json({ ...movieRecord, id, runtime: id === 10 ? 59 : 60 })
    }
  })
})

test('romantic series require a real source romance keyword and verify enriched facts', async () => {
  await isolated(async () => {
    const result = await discoverTitles(readTitleOptions(new URLSearchParams('mediaType=tv&moods=Romantic')))
    assert.deepEqual(result.titles.map(title => title.id), ['7'])
  }, url => {
    if (url.pathname.endsWith('/search/keyword')) return Response.json({ results: [{ id: 9840, name: 'romance' }] })
    if (url.pathname.endsWith('/discover/tv')) { assert.equal(url.searchParams.get('with_keywords'), '9840'); return Response.json({ total_pages: 1, results: [{ id: 7 }, { id: 8 }] }) }
    if (/\/tv\/\d+$/.test(url.pathname)) { const id = Number(url.pathname.split('/').at(-1)); return Response.json({ ...seriesRecord, id, keywords: { results: id === 7 ? [{ id: 9840, name: 'romance' }] : [] } }) }
  })
})

test('shared cast and creator recommendations use person credits, verify facts, and only exclude the exact reference type', async () => {
  await isolated(async ({ calls }) => {
    const result = await similarTitles(readTitleOptions(new URLSearchParams('mediaType=all&referenceType=tv&id=7&aspects=cast,director'), true))
    assert.deepEqual(new Set(result.titles.map(mediaKey)), new Set(['movie:7', 'tv:8']))
    assert.ok(calls.some(url => url.pathname.includes('/person/100/combined_credits')))
    assert.ok(calls.some(url => url.pathname.includes('/person/70/combined_credits')))
    assert.equal(calls.some(url => url.pathname.includes('/discover/tv')), false)
  }, url => {
    if (url.pathname.includes('/combined_credits')) return Response.json({ cast: [{ id: 7, media_type: 'movie' }, { id: 7, media_type: 'tv' }, { id: 8, media_type: 'tv' }, { id: 9, media_type: 'tv' }], crew: [{ id: 7, media_type: 'movie' }, { id: 8, media_type: 'tv' }, { id: 9, media_type: 'tv' }] })
    if (url.pathname === '/3/tv/9') return Response.json({ ...seriesRecord, id: 9, created_by: [{ id: 999, name: 'Someone else' }] })
  })
})

test('cross-type genre families match without merging different movie genres or dropping same-ID titles', () => {
  const movie = { mediaType: 'movie', id: '7', genreIds: [878], castIds: [], directorIds: [], moods: [] }
  const series = { mediaType: 'tv', id: '7', genreIds: [10765], castIds: [], creatorIds: [], directorIds: [], moods: [] }
  assert.equal(matchesSimilarity(movie, series, ['genres']), true)
  assert.equal(matchesSimilarity({ ...movie, id: '8', genreIds: [14] }, movie, ['genres']), false)
})

test('series watch providers use the TV namespace; generic APIs work through both deployment adapters', async () => {
  await isolated(async ({ token }) => {
    const data = await watchProviders('7', 'IN', 'tv')
    assert.equal(data.mediaType, 'tv')
    assert.equal(data.groups[0].providers[0].name, 'Series service')
    assert.equal(JSON.stringify(data).includes(token), false)
    const { default: vercel } = await import('../api/titles/[action].js')
    let status, body
    await vercel({ url: '/api/titles/details?id=7&mediaType=tv', method: 'GET', socket: { remoteAddress: 'test-title-vercel' } }, { writeHead(code) { status = code }, end(value) { body = JSON.parse(value) } })
    assert.equal(status, 200)
    assert.equal(body.movie.mediaType, 'tv')
    const { default: netlify } = await import('../netlify/functions/movie-api.mjs')
    const response = await netlify(new Request('https://cinemine.example/api/titles/search?q=A%20series&mediaType=tv'), { ip: 'test-title-netlify' })
    assert.equal(response.status, 200)
    assert.equal((await response.json()).titles[0].mediaType, 'tv')
    assert.equal((await request('/api/titles/watch-providers?id=7&mediaType=tv&country=IN')).status, 200)
  }, url => url.pathname.endsWith('/tv/7/watch/providers') ? Response.json({ results: { IN: { flatrate: [{ provider_id: 8, provider_name: 'Series service', logo_path: '/service.jpg' }] } } }) : url.pathname.endsWith('/search/tv') ? Response.json({ results: [{ id: 7 }], total_pages: 1 }) : undefined)
})

test('generic APIs reject invalid types, page limits, IDs and preferences before contacting TMDB', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => assert.fail('Invalid inputs must not contact TMDB')
  try {
    for (const path of ['/api/titles/search?q=Title&mediaType=person', '/api/titles/search?q=T', '/api/titles/search?q=Title&page=501', '/api/titles/search?q=Title&limit=100', '/api/titles/details?id=../x&mediaType=tv', '/api/titles/details?id=7&mediaType=all', '/api/titles/discover?mediaType=tv&genres=999', '/api/titles/discover?tvGenres=878', '/api/titles/recommendations?id=7&referenceType=all', '/api/titles/watch-providers?id=7&mediaType=tv&country=IND']) assert.equal((await request(path)).status, 400, path)
  } finally { globalThis.fetch = original }
})

test('series HTML, structured data and sitemap URLs stay separate from movies with the same ID', async () => {
  await isolated(async () => {
    const template = '<html><head><!--seo:start--><!--seo:end--></head><body><div id="root"></div></body></html>'
    const result = await renderDocument({ url: '/series/7', method: 'GET', headers: { host: 'cinemine.example' } }, { template, render: async page => `<main>${page.movie.title}</main>` })
    assert.equal(result.status, 200)
    assert.match(result.body, /A web series/)
    assert.match(result.body, /"@type":"TVSeries"/)
    const series = normalizeSeries(seriesRecord)
    const meta = createMetadata({ pathname: '/series/7', origin: 'https://cinemine.example', movie: series })
    assert.equal(meta.type, 'video.tv_show')
    assert.equal(meta.canonical, 'https://cinemine.example/series/7')
    const schema = meta.jsonLd['@graph'].find(item => item['@type'] === 'TVSeries')
    assert.equal(schema.numberOfSeasons, 3)
    assert.equal(schema.creator[0].name, 'A creator')
    assert.equal('director' in schema, false)
    const xml = movieSitemapXml('https://cinemine.example', [{ id: '7', mediaType: 'movie' }, series, series])
    assert.equal((xml.match(/\/movie\/7/g) ?? []).length, 1)
    assert.equal((xml.match(/\/series\/7/g) ?? []).length, 1)
  })
})


test('mixed home trends preserve source rank while movie spotlights exclude typed overlap', async () => {
  await isolated(async () => {
    const home = await homeCatalogue()
    assert.deepEqual(home.movies.map(mediaKey), ['movie:7', 'tv:55'])
    assert.equal(home.spotlights.length, 5)
    assert.ok(home.spotlights.every(title => title.mediaType === 'movie' && title.id !== '7'))
    assert.ok(home.spotlights.some(title => title.id === '55'))
  }, url => url.pathname.endsWith('/trending/all/day') ? Response.json({ results: [{ id: 99, media_type: 'person' }, { id: 7, media_type: 'movie' }, { id: 55, media_type: 'tv' }] }) : url.pathname.endsWith('/now_playing') ? Response.json({ total_pages: 1, results: [7, 55, 10, 11, 12, 13].map(id => ({ id, poster_path: '/poster.jpg' })) }) : undefined)
})

test('mixed description genre mappings query each catalogue correctly without inventing TV genre facts', async () => {
  await isolated(async () => {
    const result = await discoverTitles(readTitleOptions(new URLSearchParams('mediaType=all&genres=878&tvGenres=10765')))
    assert.deepEqual(new Set(result.titles.map(mediaKey)), new Set(['movie:7', 'tv:7']))
    assert.deepEqual(result.titles.find(title => title.mediaType === 'tv').genreIds, [10765])
  }, url => {
    if (/\/discover\/(movie|tv)$/.test(url.pathname)) {
      assert.equal(url.searchParams.get('with_genres'), url.pathname.endsWith('/tv') ? '10765' : '878')
      return Response.json({ total_pages: 1, results: [{ id: 7 }] })
    }
    if (url.pathname === '/3/movie/7') return Response.json({ ...movieRecord, genres: [{ id: 878, name: 'Science Fiction' }] })
    if (url.pathname === '/3/tv/7') return Response.json({ ...seriesRecord, genres: [{ id: 10765, name: 'Sci-Fi & Fantasy' }] })
  })
})
