import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseEnv } from 'node:util'
import { readFileSync } from 'node:fs'
import { homeCatalogue, getTitles } from './titles.mjs'
import { createMovieSitemapCache, sitemapIndexXml, pageSitemapXml, movieSitemapXml } from './sitemaps.mjs'
import { cleanOrigin, createMetadata, escapeHtml, renderHead, scriptJson } from '../shared/seo.mjs'

function siteConfiguration() {
  let local = {}
  try { local = parseEnv(readFileSync(resolve(process.cwd(), '.env'), 'utf8')) } catch { /* Hosted deployments use process.env. */ }
  return { origin: cleanOrigin(process.env.SITE_URL || local.SITE_URL || ''), googleVerification: (process.env.GOOGLE_SITE_VERIFICATION || local.GOOGLE_SITE_VERIFICATION || '').trim(), bingVerification: (process.env.BING_SITE_VERIFICATION || local.BING_SITE_VERIFICATION || '').trim(), preview: process.env.VERCEL_ENV === 'preview' || ['deploy-preview', 'branch-deploy'].includes(process.env.CONTEXT) }
}
function header(request, name) { return typeof request.headers?.get === 'function' ? request.headers.get(name) : request.headers?.[name] }
export function requestLocation(request) {
  const host = String(header(request, 'x-forwarded-host') || header(request, 'host') || 'localhost').split(',')[0].trim()
  const protocol = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host) ? 'http' : 'https'
  const url = new URL(request.url || '/', `${protocol}://${host}`)
  // Vercel rewrites carry the original page explicitly; normal requests keep their URL.
  const path = url.pathname === '/api/pages' ? url.searchParams.get('_path') || '/' : url.pathname
  const pathname = path.startsWith('/') && !path.startsWith('//') ? new URL(path, 'https://cinemine.internal').pathname : '/404'
  const config = siteConfiguration()
  const origin = config.origin || cleanOrigin(url.origin)
  const noIndex = config.preview || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname)
  return { pathname: pathname === '/' ? '/' : pathname.replace(/\/+$/, ''), origin, noIndex }
}
const movieSitemaps = createMovieSitemapCache()
async function defaultRender(page) {
  const { render } = await import(pathToFileURL(resolve(process.cwd(), 'dist-ssr/entry-server.mjs')).href)
  return render(page)
}
export async function renderDocument(request, options = {}) {
  const location = requestLocation(request)
  const { pathname, origin, noIndex } = location
  const headers = { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' }
  if (!['GET', 'HEAD'].includes(request.method || 'GET')) return { status: 405, headers: { ...headers, Allow: 'GET, HEAD', 'Cache-Control': 'no-store' }, body: 'Method not allowed.' }
  if (pathname === '/index.html') return { status: 308, headers: { ...headers, Location: '/' }, body: '' }
  if (noIndex) headers['X-Robots-Tag'] = 'noindex, follow'
  if (pathname === '/robots.txt') return { status: 200, headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' }, body: `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n` }
  const xmlHeaders = { ...headers, 'Content-Type': 'application/xml; charset=utf-8' }
  if (pathname === '/sitemap.xml') return { status: 200, headers: xmlHeaders, body: sitemapIndexXml(origin) }
  if (pathname === '/sitemap-pages.xml') return { status: 200, headers: xmlHeaders, body: pageSitemapXml(origin) }
  if (pathname === '/sitemap-movies.xml') {
    try {
      const result = await movieSitemaps.get(homeCatalogue)
      return { status: 200, headers: { ...xmlHeaders, 'X-Sitemap-Cache': result.stale ? 'stale' : 'fresh' }, body: movieSitemapXml(origin, result.movies) }
    } catch { return { status: 503, headers: { ...headers, 'Cache-Control': 'no-store', 'Retry-After': '60', 'Content-Type': 'text/plain; charset=utf-8' }, body: 'The sitemap is temporarily unavailable. Please retry.' } }
  }
  const page = { ...location, status: 200, today: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()) }
  try {
    if (pathname === '/' || pathname === '/sitemap') page.home = { ...await homeCatalogue(), refreshedAt: new Date().toISOString() }
    else if (/^\/(movie|series)\/[1-9]\d*$/.test(pathname)) {
      const [movie] = await getTitles([{ id: pathname.split('/').at(-1), mediaType: pathname.startsWith('/series/') ? 'tv' : 'movie' }])
      if (movie) page.movie = movie
      else { page.status = 404; page.error = 'This film could not be found.' }
    } else if (!['/calendar', '/find-my-movie', '/where-to-watch', '/credits'].includes(pathname)) page.status = 404
  } catch (error) {
    page.status = error?.status === 404 ? 404 : 503
    page.error = page.status === 404 ? 'This film could not be found.' : 'Film information is temporarily unavailable. Please try again.'
  }
  const metadata = createMetadata({ ...page, movies: page.home?.movies })
  const template = options.template ?? await readFile(resolve(process.cwd(), 'dist/index.html'), 'utf8')
  const content = await (options.render ?? defaultRender)(page)
  const verification = siteConfiguration()
  const verificationTags = [['google-site-verification', verification.googleVerification], ['msvalidate.01', verification.bingVerification]].filter(([, value]) => value).map(([name, value]) => `<meta name="${name}" content="${escapeHtml(value)}">`).join('\n')
  const body = template.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, renderHead(metadata) + verificationTags)
    .replace('<div id="root"></div>', () => `<div id="root">${content}</div><script>window.__CINEMINE_PAGE__=${scriptJson(page)}</script>`)
  if (page.status >= 400) { headers['Cache-Control'] = 'no-store'; if (page.status === 503) headers['Retry-After'] = '60' }
  if (noIndex || page.status >= 400) headers['X-Robots-Tag'] = 'noindex, follow'
  return { status: page.status, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' }, body }
}
export async function handlePage(request, response, options) {
  try {
    const result = await renderDocument(request, options)
    response.writeHead(result.status, result.headers)
    response.end(request.method === 'HEAD' ? undefined : result.body)
  } catch (error) {
    console.error('Cinemine page rendering failed:', error instanceof Error ? error.message : 'Unknown rendering error')
    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'Retry-After': '60' })
    response.end('The page is temporarily unavailable. Please retry.')
  }
}
