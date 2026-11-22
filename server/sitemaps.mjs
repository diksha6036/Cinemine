import { escapeHtml } from '../shared/seo.mjs'

export const PAGE_PATHS = ['/', '/calendar', '/where-to-watch', '/credits', '/sitemap']
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
  const ids = [...new Set(movies.map(movie => String(movie.id)).filter(id => /^[1-9]\d*$/.test(id)))]
  return urlSet(origin, ids.map(id => `/movie/${id}`))
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
          const ids = [...new Set([...home.movies, ...home.spotlights].map(movie => String(movie.id)).filter(id => /^[1-9]\d*$/.test(id)))]
          if (!ids.length) throw new Error('No movie URLs are available.')
          snapshot = { movies: ids.map(id => ({ id })), checked: now() }
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
