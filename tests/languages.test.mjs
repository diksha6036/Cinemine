import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { languages, requestLanguage } from '../shared/languages.mjs'
import { messages, translate } from '../shared/translations.mjs'
import { withLanguage, currentLanguage } from '../server/language.mjs'
import { getFilms, getSeries } from '../server/provider.mjs'
import { handleApi } from '../server/api.mjs'
import { renderDocument } from '../server/html.mjs'
import { discoverTitles, readTitleOptions } from '../server/titles.mjs'

let runNumber = 0
async function sourceFixture(task, override) {
  const original = globalThis.fetch, token = process.env.TMDB_READ_ACCESS_TOKEN
  process.env.TMDB_READ_ACCESS_TOKEN = `language-fixture-${++runNumber}`
  const calls = []
  globalThis.fetch = async input => {
    const url = new URL(input)
    calls.push(url)
    const result = await override?.(url)
    if (result) return result
    if (url.pathname.endsWith('/configuration')) return Response.json({ images: { secure_base_url: 'https://image.tmdb.org/t/p/' } })
    const language = url.searchParams.get('language')
    if (/\/(movie|tv)\/\d+$/.test(url.pathname)) return Response.json({ id: Number(url.pathname.split('/').at(-1)), title: `Movie ${language}`, name: `Series ${language}`, overview: `Overview ${language}`, poster_path: '/poster.jpg', original_language: 'hi', genres: [{ id: 35, name: `Comedy ${language}` }], runtime: 90, episode_run_time: [30], videos: { results: [{ key: 'abcdefghijk', site: 'YouTube', type: 'Trailer' }] } })
    if (url.pathname.endsWith('/search/multi')) return Response.json({ total_pages: 1, results: [{ id: 42, media_type: 'movie' }, { id: 42, media_type: 'tv' }] })
    throw new Error(`Unexpected source fixture: ${url.pathname}`)
  }
  try { await task(calls) }
  finally { globalThis.fetch = original; if (token === undefined) delete process.env.TMDB_READ_ACCESS_TOKEN; else process.env.TMDB_READ_ACCESS_TOKEN = token }
}
async function request(url, cookie = '') {
  let status, body
  await handleApi({ url, method: 'GET', headers: { cookie }, socket: { remoteAddress: 'language-fixture' } }, { writeHead(code) { status = code }, end(value) { body = JSON.parse(value) } })
  return { status, body }
}

test('all ten languages have complete messages and preserve interpolation and unknown source text', () => {
  assert.equal(languages.length, 10)
  for (const { code } of languages) for (const key of Object.keys(messages.en)) {
    assert.ok(typeof messages[code][key] === 'string' && messages[code][key].trim(), `${code}: ${key}`)
    assert.deepEqual((messages[code][key].match(/\{\w+\}/g) ?? []).sort(), (key.match(/\{\w+\}/g) ?? []).sort(), `${code}: ${key}`)
  }
  assert.equal(translate('hi', 'Where to watch'), 'कहाँ देखें')
  assert.equal(translate('es', 'In {country}', { country: 'España' }), 'En España')
  assert.equal(translate('ar', 'Unknown source synopsis.'), 'Unknown source synopsis.')
  assert.equal(translate('invalid', 'Retry'), 'Retry')
})

test('language URL and saved cookie are validated, with URL taking precedence', () => {
  assert.equal(requestLanguage({ url: '/', headers: {} }), 'en')
  assert.equal(requestLanguage({ url: '/series/42', headers: { cookie: 'other=x; cinemine-language=ja; third=y' } }), 'ja')
  assert.equal(requestLanguage({ url: '/?locale=ar', headers: new Headers({ cookie: 'cinemine-language=fr' }) }), 'ar')
  assert.equal(requestLanguage({ url: '/?locale=%3Cscript%3E', headers: {} }), 'en')
  assert.equal(requestLanguage({ url: '/', headers: { cookie: 'cinemine-language=not-a-language' } }), 'en')
})

test('concurrent visitors keep language context and movie/series caches separate', async () => {
  await sourceFixture(async calls => {
    const results = await Promise.all(['en', 'hi', 'ar', 'fr'].map(code => withLanguage(code, async () => {
      const [movie, series] = await Promise.all([getFilms(['42']), getSeries(['42'])])
      await new Promise(resolve => setTimeout(resolve, 1))
      assert.equal(currentLanguage().code, code)
      const tag = languages.find(language => language.code === code).tmdb
      assert.equal(movie[0].title, `Movie ${tag}`)
      assert.equal(series[0].title, `Series ${tag}`)
      return [movie[0].title, series[0].title]
    })))
    assert.equal(new Set(results.flat()).size, 8)
    const before = calls.length
    await withLanguage('hi', () => getFilms(['42']))
    await withLanguage('en', () => getSeries(['42']))
    assert.equal(calls.length, before, 'each language reuses only its own cache')
    assert.equal(currentLanguage().code, 'en')
  })
})

test('missing translated synopses and trailers use English without replacing localized names or season text', async () => {
  await sourceFixture(async () => {
    const [series] = await withLanguage('ja', () => getSeries(['42']))
    assert.equal(series.title, '日本語タイトル')
    assert.equal(series.shortDescription, 'English overview')
    assert.equal(series.seasons[0].overview, 'English season overview')
    assert.equal(series.seasons[1].overview, '日本語のあらすじ')
    assert.match(series.trailerUrl, /abcdefghijk/)
  }, url => {
    if (!url.pathname.endsWith('/tv/42')) return
    const english = url.searchParams.get('language') === 'en-US'
    return Response.json({ id: 42, name: english ? 'English title' : '日本語タイトル', overview: english ? 'English overview' : '', poster_path: '/poster.jpg', videos: { results: english ? [{ key: 'abcdefghijk', site: 'YouTube', type: 'Trailer' }] : [] }, seasons: [{ id: 1, season_number: 1, overview: english ? 'English season overview' : '' }, { id: 2, season_number: 2, overview: english ? 'Unused fallback' : '日本語のあらすじ' }] })
  })
})

test('a failed English fallback preserves a usable translated title', async () => {
  await sourceFixture(async () => {
    const [movie] = await withLanguage('fr', () => getFilms(['42']))
    assert.equal(movie.title, 'Titre français')
    assert.equal(movie.shortDescription, 'Un résumé français.')
  }, url => {
    if (!url.pathname.endsWith('/movie/42')) return
    if (url.searchParams.get('language') === 'en-US') return new Response('', { status: 503 })
    return Response.json({ id: 42, title: 'Titre français', overview: 'Un résumé français.', poster_path: '/poster.jpg' })
  })
})

test('API language localizes both title types and keeps title queries unchanged', async () => {
  await sourceFixture(async calls => {
    const result = await request('/api/titles/search?mediaType=all&q=%E0%A4%AA%E0%A4%82%E0%A4%9A%E0%A4%BE%E0%A4%AF%E0%A4%A4&locale=hi')
    assert.equal(result.status, 200)
    assert.deepEqual(result.body.titles.map(title => title.title), ['Movie hi-IN', 'Series hi-IN'])
    const search = calls.find(url => url.pathname.endsWith('/search/multi'))
    assert.equal(search.searchParams.get('language'), 'hi-IN')
    assert.equal(search.searchParams.get('query'), 'पंचायत')
    assert.equal((await request('/api/titles/details?id=42&mediaType=tv', 'cinemine-language=es')).body.movie.title, 'Series es-ES')
    const invalid = await request('/api/titles/search?q=x&locale=hi')
    assert.equal(invalid.status, 400)
    assert.equal(invalid.body.error, translate('hi', 'Could not load data. Please retry.'))
  })
})

test('display language never changes selected original-language filters or numeric genre preferences', async () => {
  await sourceFixture(async calls => {
    const titles = await withLanguage('fr', () => discoverTitles(readTitleOptions(new URLSearchParams('mediaType=all&languages=hi&genres=35&runtime=100'))))
    assert.equal(titles.titles.length, 2)
    assert.ok(titles.titles.every(title => title.originalLanguage === 'hi' && title.genreIds.includes(35)))
    const discovery = calls.filter(url => /\/discover\/(movie|tv)$/.test(url.pathname))
    assert.equal(discovery.length, 2)
    for (const url of discovery) {
      assert.equal(url.searchParams.get('language'), 'fr-FR')
      assert.equal(url.searchParams.get('with_original_language'), 'hi')
      assert.equal(url.searchParams.get('with_genres'), '35')
      assert.equal(url.searchParams.get('with_runtime.lte'), '99')
    }
  }, url => /\/discover\/(movie|tv)$/.test(url.pathname) ? Response.json({ total_pages: 1, results: [{ id: 42 }] }) : undefined)
})

test('localized HTML sets language, direction, matching bootstrap and private cache headers', async () => {
  const options = { template: '<html lang="en"><head><!--seo:start--><!--seo:end--></head><body><div id="root"></div></body></html>', render: async page => `<main>${translate(page.language, 'Where to watch')}</main>` }
  const result = await renderDocument({ url: '/where-to-watch?locale=ar', headers: { host: 'cinemine.example' } }, options)
  assert.equal(result.status, 200)
  assert.match(result.body, /<html lang="ar" dir="rtl">/)
  assert.match(result.body, /"language":"ar"/)
  assert.match(result.body, /"localeNames":\{"languages":/)
  assert.match(result.body, /أين تشاهد/)
  assert.match(result.body, /property="og:locale" content="ar_SA"/)
  assert.equal(result.headers['Content-Language'], 'ar')
  assert.match(result.headers['Cache-Control'], /private.*no-store/)
  const saved = await renderDocument({ url: '/where-to-watch', headers: { host: 'cinemine.example', cookie: 'cinemine-language=hi' } }, options)
  assert.match(saved.body, /<html lang="hi" dir="ltr">/)
  assert.match(saved.body, /कहाँ देखें/)
})

async function descriptionUtility() {
  const catalogueUrl = new URL('../src/features/search/data/catalogue.ts', import.meta.url)
  const sourceUrl = new URL('../src/lib/discovery.ts', import.meta.url)
  const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  const catalogue = `data:text/javascript;base64,${Buffer.from(compile(await readFile(catalogueUrl, 'utf8'))).toString('base64')}`
  const source = compile(await readFile(sourceUrl, 'utf8')).replace(/from (['"])(.*?)\1/g, (_, quote, ref) => `from ${JSON.stringify(ref.includes('data/catalogue') ? catalogue : new URL(ref, sourceUrl).href)}`)
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}
test('localized description examples preserve genre IDs, original language, runtime and exclusions in every offered language', async () => {
  const { interpretDescription } = await descriptionUtility()
  for (const language of languages) {
    const hindi = new Intl.DisplayNames([language.locale], { type: 'language' }).of('hi')
    const example = `${hindi} ${translate(language.code, 'Comedy')} ${translate(language.code, 'Under {count} min', { count: 120 })}`
    const filters = interpretDescription(example, 'all', language.code)
    assert.deepEqual(filters, { genreIds: [35], excludedGenreIds: [], languages: ['hi'], runtime: 120 }, language.code)
    const excluded = interpretDescription(translate(language.code, 'No {genre}', { genre: translate(language.code, 'Horror') }), 'all', language.code)
    assert.deepEqual(excluded.excludedGenreIds, [27], language.code)
    assert.deepEqual(excluded.genreIds, [], language.code)
  }
  assert.equal(interpretDescription('कॉमेडी १२० मिनट से कम', 'tv', 'hi').runtime, 120)
  assert.equal(interpretDescription('كوميديا أقل من ١٢٠ دقيقة', 'tv', 'ar').runtime, 120)
  assert.equal(interpretDescription('Hindi comedy under two hours', 'movie').runtime, 120)
})
