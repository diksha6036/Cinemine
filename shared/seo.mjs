import { titlePath } from './media.mjs'
import { translate } from './translations.mjs'
export const SITE_NAME = 'Cinemine'
export const HOME_DESCRIPTION = 'Discover movies and web series with Cinemine. Search by title or mood, find streaming platforms by country, and explore movie release dates.'
export function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]) }
export function scriptJson(value) { return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') }
export function cleanOrigin(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.origin : '' } catch { return '' }
}
export function createMetadata({ pathname = '/', origin, movie, movies = [], status = 200, noIndex = false, language = 'en' }) {
  const base = cleanOrigin(origin)
  const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '')
  const url = `${base}${path}`
  const isMovie = /^\/movie\/[1-9]\d*$/.test(path)
  const isSeries = /^\/series\/[1-9]\d*$/.test(path)
  const isTitle = isMovie || isSeries
  const isCalendar = path === '/calendar'
  const isDirectory = path === '/sitemap'
  const isWatchSearch = path === '/where-to-watch'
  const isCredits = path === '/credits'
  const isMovieSearch = path === '/find-my-movie'
  const missing = status === 404 || (!isTitle && !isCalendar && !isDirectory && !isWatchSearch && !isCredits && !isMovieSearch && path !== '/')
  let title = 'Cinemine | Discover Movies & Web Series'
  let description = HOME_DESCRIPTION
  if (isCalendar) { title = 'Movie Release Calendar | Cinemine'; description = 'Explore movie release dates by country, genre, language, and release format. Plan your next cinema visit or movie night with Cinemine.' }
  if (isDirectory) { title = 'Sitemap | Explore Cinemine'; description = 'Browse Cinemine’s movie pages, trending films, and regional release calendar from one simple site directory.' }
  if (isWatchSearch) { title = 'Where to Watch Movies by Country | Cinemine'; description = 'Search movies and series, choose your country, and see streaming platforms with provider names and logos on Cinemine.' }
  if (isCredits) { title = 'Credits | Cinemine'; description = 'Credits for TMDB movie information and artwork, and JustWatch streaming availability used by Cinemine.' }
  if (isMovieSearch) { title = 'Find Movies & Series | Cinemine'; description = 'Find movies and web series by title, mood, description, or similarity with Cinemine.' }
  if (isTitle) {
    title = movie ? `${movie.title}${movie.releaseYear ? ` (${movie.releaseYear})` : ''} | Cinemine` : `${isSeries ? 'Series' : 'Movie'} Details | Cinemine`
    description = movie ? `${movie.shortDescription} Explore ${movie.title}'s details and streaming platforms on Cinemine.` : 'Explore movies and series, cast, trailers, and streaming platforms with Cinemine.'
  }
  if (missing) { title = 'Page Not Found | Cinemine'; description = 'This page could not be found. Explore trending films and movie release dates on Cinemine.' }
  if (status >= 500) { title = 'Temporarily Unavailable | Cinemine'; description = 'Film information is temporarily unavailable. Please try Cinemine again shortly.' }
  if (language !== 'en') {
    const t = key => translate(language, key)
    if (!isTitle) {
      title = `${t(isCalendar ? 'Release calendar' : isDirectory ? 'Sitemap' : isWatchSearch ? 'Where to watch' : isCredits ? 'Credits' : 'Find movies & series')} | Cinemine`
      description = t(isCalendar ? 'A little anticipation. A lot to look forward to. Explore what’s coming to screens near you.' : isCredits ? 'Movie and series information and artwork are supplied through TMDB.' : isWatchSearch ? 'Search for a movie or web series and choose your country to see its streaming platforms.' : 'Search movies and web series by title, mood, description, or something you already enjoy.')
    } else if (movie) description = movie.shortDescription
    if (missing || status >= 500) { title = `${t(missing ? '404 · Page not found' : 'Couldn’t load this title')} | Cinemine`; description = t(missing ? 'The page you’re looking for could not be found.' : 'Could not load data. Please retry.') }
  }
  description = description.replace(/\s+/g, ' ').trim(); if (description.length > 180) description = description.slice(0, 177).replace(/\s+\S*$/, '') + '…'
  const robots = noIndex || missing || status >= 400 || (isTitle && !movie) ? 'noindex, follow' : 'index, follow, max-image-preview:large'
  const image = movie?.backdropUrl || movie?.posterUrl || `${base}/images/cinemine-share.png`
  const graph = [
    { '@type': 'Organization', '@id': `${base}/#organization`, name: SITE_NAME, url: `${base}/`, logo: `${base}/images/cinemine-logo.jpg`, sameAs: ['https://www.instagram.com/dr.cinemine/'] },
    { '@type': 'WebSite', '@id': `${base}/#website`, name: SITE_NAME, url: `${base}/`, description: HOME_DESCRIPTION, publisher: { '@id': `${base}/#organization` } },
    { '@type': isCalendar || isDirectory ? 'CollectionPage' : 'WebPage', '@id': `${url}#webpage`, url, name: title, description, isPartOf: { '@id': `${base}/#website` } },
  ]
  const movieSchema = film => film.mediaType === 'tv' ? ({ '@type': 'TVSeries', '@id': `${base}${titlePath(film)}#series`, name: film.title, url: `${base}${titlePath(film)}`, description: film.shortDescription, ...(film.posterUrl ? { image: film.posterUrl } : {}), genre: film.genres, ...(film.creators?.length ? { creator: film.creators.map(name => ({ '@type': 'Person', name })) } : {}), ...(Number.isInteger(film.numberOfSeasons) ? { numberOfSeasons: film.numberOfSeasons } : {}), ...(Number.isInteger(film.numberOfEpisodes) ? { numberOfEpisodes: film.numberOfEpisodes } : {}) }) : ({ '@type': 'Movie', '@id': `${base}/movie/${film.id}#movie`, name: film.title, url: `${base}/movie/${film.id}`, description: film.shortDescription, ...(film.posterUrl ? { image: film.posterUrl } : {}), genre: film.genres, ...(film.runtimeMinutes ? { duration: `PT${film.runtimeMinutes}M` } : {}), ...(film.directors?.length ? { director: film.directors.map(name => ({ '@type': 'Person', name })) } : {}) })
  if (movie && status === 200) {
    graph.push(movieSchema(movie))
    graph[2].mainEntity = { '@id': `${url}#${movie.mediaType === 'tv' ? 'series' : 'movie'}` }
    graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${base}/` }, { '@type': 'ListItem', position: 2, name: movie.title, item: url }] })
  } else if (path === '/' && movies.length && status === 200) {
    graph.push({ '@type': 'ItemList', name: 'Trending movies', itemListElement: movies.slice(0, 5).map((film, index) => ({ '@type': 'ListItem', position: index + 1, item: movieSchema(film) })) })
  }
  return { title, description, canonical: url, image, imageAlt: movie ? `${movie.title} ${movie.mediaType === 'tv' ? 'series' : 'movie'} artwork` : 'Cinemine — a film for every feeling', type: movie ? movie.mediaType === 'tv' ? 'video.tv_show' : 'video.movie' : 'website', robots, jsonLd: { '@context': 'https://schema.org', '@graph': graph } }
}
export function renderHead(meta) {
  const tag = (name, content, property = false) => `<meta ${property ? 'property' : 'name'}="${name}" content="${escapeHtml(content)}" data-seo>`
  return [ `<title>${escapeHtml(meta.title)}</title>`, tag('description', meta.description), tag('robots', meta.robots), `<link rel="canonical" href="${escapeHtml(meta.canonical)}" data-seo>`,
    tag('og:site_name', SITE_NAME, true), tag('og:locale', meta.locale || 'en_IN', true), tag('og:title', meta.title, true), tag('og:description', meta.description, true), tag('og:type', meta.type, true), tag('og:url', meta.canonical, true), tag('og:image', meta.image, true), tag('og:image:alt', meta.imageAlt, true),
    tag('twitter:card', 'summary_large_image'), tag('twitter:title', meta.title), tag('twitter:description', meta.description), tag('twitter:image', meta.image), tag('twitter:image:alt', meta.imageAlt),
    `<script type="application/ld+json" id="page-structured-data">${scriptJson(meta.jsonLd)}</script>` ].join('\n')
}
