import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { imageUrl, normalizeFilm, publicationEvents, releaseCalendar } from '../server/provider.mjs'
import { readServerConfig } from '../server/env.mjs'
import { handleApi, validDate } from '../server/api.mjs'

const record = { id: 27205, title: 'Inception', release_date: '2010-07-16', poster_path: '/poster.jpg', backdrop_path: '/backdrop.jpg', original_language: 'en', overview: 'A spoiler-free synopsis.', runtime: 148, genres: [{ id: 878, name: 'Science Fiction' }], credits: { crew: [{ id: 525, name: 'Christopher Nolan', job: 'Director' }], cast: [{ id: 6193, name: 'Leonardo DiCaprio' }] }, videos: { results: [{ site: 'YouTube', type: 'Trailer', official: true, key: 'abcdefghijk' }] }, vote_count: 100, vote_average: 8.3 }
const config = { images: { secure_base_url: 'https://image.tmdb.org/t/p/' } }
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
