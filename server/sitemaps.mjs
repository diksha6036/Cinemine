import { escapeHtml } from '../shared/seo.mjs'
import { mediaKey, titlePath } from '../shared/media.mjs'

export const PAGE_PATHS = ['/', '/find-my-movie', '/calendar', '/where-to-watch', '/credits', '/sitemap']
export const CRAWLER_PATHS = ['/robots.txt', '/sitemap.xml', '/sitemap-pages.xml', '/sitemap-movies.xml']
export const isCrawlerPath = pathname => CRAWLER_PATHS.includes(pathname)
const declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
const namespace = 'http://www.sitemaps.org/schemas/sitemap/0.9'
function urlSet(origin, paths) {
  return `${declaration}<urlset xmlns="${namespace}">${paths.map(path => `<url><loc>${escapeHtml(origin + path)}</loc></url>`).join('')}</urlset>`
}
export function sitemapIndexXml(origin) {
  return `${declaration}<sitemapindex xmlns="${namespace}">${['/sitemap-pages.xml', '/sitemap-movies.xml'].map(path => `<sitemap><loc>${escapeHtml(origin + path)}</loc></sitemap>`).join('')}</sitemapindex>`
}
export function pageSitemapXml(origin) { return urlSet(origin, PAGE_PATHS) }
export function movieSitemapXml(origin, movies) {
  const titles = [...new Map(movies.filter(movie => /^[1-9]\d*$/.test(String(movie.id))).map(movie => [mediaKey(movie), movie])).values()]
  return urlSet(origin, titles.map(titlePath))
}

// A warm function can preserve real, previously discovered URLs through a brief
// provider outage. This cache stores movie IDs, not origin-specific XML or secrets.
export function createMovieSitemapCache(now = Date.now) {
  let snapshot = null
  let pending = null
  const freshFor = 5 * 60 * 1000, staleFor = 24 * 60 * 60 * 1000
  return {
    async get(load) {
      if (snapshot && now() - snapshot.checked < freshFor) return { movies: snapshot.movies, stale: false }
      if (pending) return pending
      pending = (async () => {
        try {
          const home = await load()
          const titles = [...new Map([...home.movies, ...home.spotlights].filter(movie => /^[1-9]\d*$/.test(String(movie.id))).map(movie => [mediaKey(movie), { id: String(movie.id), mediaType: movie.mediaType ?? 'movie' }])).values()]
          if (!titles.length) throw new Error('No title URLs are available.')
          snapshot = { movies: titles, checked: now() }
          return { movies: snapshot.movies, stale: false }
        } catch (error) {
          if (snapshot && now() - snapshot.checked < staleFor) return { movies: snapshot.movies, stale: true }
          throw error
        }
      })().finally(() => { pending = null })
      return pending
    },
  }
}
