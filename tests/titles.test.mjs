import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getFilms, getSeries, normalizeSeries, watchProviders } from '../server/provider.mjs'
import { discoverTitles, homeCatalogue, readTitleOptions, searchTitles, similarTitles } from '../server/titles.mjs'
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
