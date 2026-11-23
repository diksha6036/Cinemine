import { GENRES, getFilms, getSeries, discoverFilms, imageUrl, tmdb } from './provider.mjs'
import { matchesFilters, matchesSimilarity, readDiscoveryOptions, uniqueMovies } from './discovery.mjs'
import { mediaKey } from '../shared/media.mjs'

export const TV_GENRES = [{ id: 10759, name: 'Action & Adventure' }, { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' }, { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }, { id: 10762, name: 'Kids' }, { id: 9648, name: 'Mystery' }, { id: 10763, name: 'News' }, { id: 10764, name: 'Reality' }, { id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 10766, name: 'Soap' }, { id: 10767, name: 'Talk' }, { id: 10768, name: 'War & Politics' }, { id: 37, name: 'Western' }]
const movieGenres = new Set(GENRES.map(genre => genre.id))
const tvGenres = new Set(TV_GENRES.map(genre => genre.id))
const keywordGenres = { 10749: 'romance', 27: 'horror', 53: 'thriller' }
const types = filter => filter === 'all' ? ['movie', 'tv'] : [filter]
const excludedIds = (exclude, type) => exclude.flatMap(value => value.startsWith(`${type}:`) ? [value.split(':')[1]] : type === 'movie' && /^\d+$/.test(value) ? [value] : [])
const cursor = pages => { const values = pages.map(page => page.nextPage).filter(value => value !== null); return values.length ? Math.min(...values) : null }
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())

export function readMediaType(value = 'all', allowAll = true) {
  if (!(allowAll ? ['all', 'movie', 'tv'] : ['movie', 'tv']).includes(value)) { const error = new Error('Choose All, Movies, or Series.'); error.status = 400; throw error }
  return value
}
export function readTitleOptions(parameters, similar = false) {
  const options = readDiscoveryOptions(parameters, [...new Set([...movieGenres, ...tvGenres])], similar)
  const mediaType = readMediaType(parameters.get('mediaType') ?? 'all')
  const referenceType = readMediaType(parameters.get('referenceType') ?? 'movie', false)
  const list = key => (parameters.get(key) ?? '').split(',').filter(Boolean).map(Number)
  const tvGenreIds = parameters.has('tvGenres') ? list('tvGenres') : undefined
  const tvExcludedGenreIds = parameters.has('tvWithoutGenres') ? list('tvWithoutGenres') : undefined
  if ([...(tvGenreIds ?? []), ...(tvExcludedGenreIds ?? [])].some(id => !tvGenres.has(id) && !keywordGenres[id])) { const error = new Error('Choose valid series genres.'); error.status = 400; throw error }
  return { ...options, mediaType, referenceType, tvGenreIds, tvExcludedGenreIds }
}

export async function getTitles(references) {
  const refs = uniqueMovies(references.filter(ref => ['movie', 'tv'].includes(ref.mediaType) && /^[1-9]\d*$/.test(String(ref.id))))
  const [movies, series] = await Promise.all([
    refs.some(ref => ref.mediaType === 'movie') ? getFilms(refs.filter(ref => ref.mediaType === 'movie').map(ref => ref.id)) : [],
    refs.some(ref => ref.mediaType === 'tv') ? getSeries(refs.filter(ref => ref.mediaType === 'tv').map(ref => ref.id)) : [],
  ])
  const records = new Map([...movies, ...series].map(title => [mediaKey(title), title]))
  return refs.flatMap(ref => records.has(mediaKey(ref)) ? [records.get(mediaKey(ref))] : [])
}

export async function searchTitles(query, { mediaType = 'all', page = 1, limit = 20 } = {}) {
  const data = await tmdb(`/search/${mediaType === 'all' ? 'multi' : mediaType}`, { query, language: 'en-US', include_adult: 'false', page: String(page) })
  const records = (data.results ?? []).filter(record => !record.adult && (mediaType !== 'all' || ['movie', 'tv'].includes(record.media_type)))
  const references = uniqueMovies(records.map(record => ({ id: String(record.id), mediaType: mediaType === 'all' ? record.media_type : mediaType }))).slice(0, limit)
  return { titles: await getTitles(references), nextPage: page < Math.min(Number(data.total_pages) || 1, 500) ? page + 1 : null }
}

const personNameKey = name => String(name ?? '').normalize('NFKD').toLocaleLowerCase('en').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]/gu, '')
function nameDistance(left, right) {
  const a = Array.from(left), b = Array.from(right)
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let row = 1; row <= a.length; row++) {
    const current = [row]
    for (let column = 1; column <= b.length; column++) current[column] = Math.min(current[column - 1] + 1, previous[column] + 1, previous[column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1))
    previous = current
  }
  return previous[b.length]
}
async function actingPeople(records) {
  const candidates = [...new Map(records.filter(person => !person.adult && person.name?.trim() && /^[1-9]\d{0,9}$/.test(String(person.id))).map(person => [String(person.id), person])).values()]
  const matches = []
  for (let index = 0; index < candidates.length; index += 4) {
    const batch = await Promise.all(candidates.slice(index, index + 4).map(async person => {
      if (person.known_for_department === 'Acting') return person
      // A primary department is not a complete career history. Verify acting
      // credits for multi-career people and those with missing department data.
      let credits
      try { credits = await tmdb(`/person/${person.id}/combined_credits`, { language: 'en-US' }) }
      catch (error) { if (error.status === 404) return null; throw error }
      const roles = (credits.cast ?? []).filter(record => !record.adult && /^[1-9]\d*$/.test(String(record.id)) && ['movie', 'tv'].includes(record.media_type) && isActingCredit(record))
      return roles.length ? { ...person, known_for: roles.sort((left, right) => (Number(right.popularity) || 0) - (Number(left.popularity) || 0)).slice(0, 3) } : null
    }))
    matches.push(...batch.filter(Boolean))
  }
  return matches
}
export async function searchPeople(query, { page = 1 } = {}) {
  const loadPage = (term, number) => tmdb('/search/person', { query: term, language: 'en-US', include_adult: 'false', page: String(number) })
  const data = await loadPage(query, page)
  let matches = await actingPeople(data.results ?? [])
  const totalPages = Math.min(Number(data.total_pages) || 1, 500)
  let nextPage = page < totalPages ? page + 1 : null
  // When the full name has a typo, search its first and last parts, then keep
  // only close full-name matches so a common surname cannot match everyone.
  const words = query.trim().split(/\s+/u)
  if (!matches.length && totalPages === 1 && words.length > 1) {
    const parts = [...new Set([words[0], words.at(-1)])].filter(word => word.length >= 2)
    const pages = await Promise.all(parts.map(term => loadPage(term, 1)))
    const candidates = await actingPeople(pages.flatMap(result => result.results ?? []))
    const key = personNameKey(query)
    matches = candidates.map(person => ({ person, distance: nameDistance(key, personNameKey(person.name)) }))
      .filter(({ person, distance }) => distance <= Math.max(1, Math.floor(Math.max(Array.from(key).length, Array.from(personNameKey(person.name)).length) * .25)))
      .sort((left, right) => left.distance - right.distance || (Number(right.person.popularity) || 0) - (Number(left.person.popularity) || 0)).map(match => match.person)
    nextPage = page * 20 < matches.length ? page + 1 : null
    matches = matches.slice((page - 1) * 20, page * 20)
  }
  return { people: matches.map(person => ({
    id: String(person.id), name: person.name, profileUrl: imageUrl(person.profile_path, 'w185'),
    knownFor: (person.known_for ?? []).filter(title => !title.adult && ['movie', 'tv'].includes(title.media_type)).slice(0, 3).map(title => title.title || title.name).filter(Boolean),
  })), nextPage }
}

function isActingCredit(record) {
  if (record.media_type === 'tv' && (record.genre_ids ?? []).some(genre => [99, 10763, 10764, 10767].includes(genre))) return false
  const role = String(record.character ?? '').trim()
  return !/^(?:self|himself|herself|themselves|host|presenter|interviewee)\b/i.test(role) && !/\barchiv(?:e|al)\s+(?:footage|material)\b|\(archive\)/i.test(role)
}
export async function castTitles(id, { mediaType = 'all', page = 1 } = {}) {
  const data = await tmdb(`/person/${id}/combined_credits`, { language: 'en-US' })
  const credits = uniqueMovies((data.cast ?? []).filter(record => !record.adult && ['movie', 'tv'].includes(record.media_type) && (mediaType === 'all' || record.media_type === mediaType) && isActingCredit(record))
    .sort((left, right) => (Number(right.popularity) || 0) - (Number(left.popularity) || 0))
    .map(record => ({ id: String(record.id), mediaType: record.media_type, character: record.character || '' })).filter(record => /^[1-9]\d*$/.test(record.id)))
  const start = (page - 1) * 20
  const selected = credits.slice(start, start + 20), rolesByTitle = new Map(selected.map(record => [mediaKey(record), record.character]))
  const titles = await getTitles(selected)
  const roles = Object.fromEntries(titles.flatMap(title => rolesByTitle.get(mediaKey(title)) ? [[mediaKey(title), rolesByTitle.get(mediaKey(title))]] : []))
  return { titles, roles, nextPage: start + 20 < credits.length && page < 500 ? page + 1 : null }
}

async function collectTitles(loadPage, type, options, matches) {
  const seen = new Set(excludedIds(options.exclude ?? [], type))
  const output = []
  let page = options.page ?? 1, total = page
  for (let scanned = 0; scanned < 3 && page <= total && output.length < 20; scanned++, page++) {
    const data = await loadPage(page)
    total = Math.min(Number(data.total_pages) || 1, 500)
    const records = uniqueMovies((data.results ?? []).filter(record => !record.adult).map(record => ({ ...record, mediaType: type }))).filter(record => !seen.has(String(record.id)))
    for (const record of records) seen.add(String(record.id))
    const titles = await getTitles(records.map(record => ({ id: String(record.id), mediaType: type })))
    output.push(...titles.filter(matches))
  }
  return { titles: output, nextPage: page <= total ? page : null }
}

async function keywordIds(names) {
  return Promise.all([...new Set(names)].map(async name => {
    const data = await tmdb('/search/keyword', { query: name, page: '1' })
    const match = data.results?.find(keyword => keyword.name?.toLowerCase() === name)
    if (!match) throw new Error(`The source has no ${name} keyword for series. Choose another preference.`)
    return String(match.id)
  }))
}
function matchesSeries(title, filters) {
  const includes = id => tvGenres.has(id) ? title.genreIds.includes(id) : (title.keywordNames ?? []).includes(keywordGenres[id])
  return filters.genres.every(includes) && !filters.excludedGenres.some(includes) && matchesFilters(title, { ...filters, genres: [], excludedGenres: [] })
}
async function discoverSeries(options) {
  const genres = options.tvGenreIds ?? options.genres ?? [], excludedGenres = options.tvExcludedGenreIds ?? options.excludedGenres ?? []
  const moods = options.moods ?? []
  if (genres.some(id => !tvGenres.has(id) && !keywordGenres[id])) return { titles: [], nextPage: null }
  const positive = genres.filter(id => keywordGenres[id]).map(id => keywordGenres[id])
  if (moods.includes('Romantic')) positive.push('romance')
  const [keywords, withoutKeywords] = await Promise.all([keywordIds(positive), keywordIds(excludedGenres.filter(id => keywordGenres[id]).map(id => keywordGenres[id]))])
  const required = [...new Set([...genres.filter(id => tvGenres.has(id)), ...moods.filter(mood => ['Funny', 'Feel-good', 'Emotional'].includes(mood)).map(mood => mood === 'Emotional' ? 18 : 35)])]
  const loadPage = async page => {
    const pages = await Promise.all((options.languages?.length ? options.languages : ['']).map(language => tmdb('/discover/tv', {
      language: 'en-US', include_adult: 'false', sort_by: 'popularity.desc', page: String(page), 'first_air_date.lte': today(),
      ...(required.length ? { with_genres: required.join(',') } : {}),
      ...(excludedGenres.some(id => tvGenres.has(id)) ? { without_genres: excludedGenres.filter(id => tvGenres.has(id)).join(',') } : {}),
      ...(keywords.length ? { with_keywords: keywords.join(',') } : {}), ...(withoutKeywords.length ? { without_keywords: withoutKeywords.join(',') } : {}),
      ...(language ? { with_original_language: language } : {}), ...(options.runtime ? { 'with_runtime.gte': '1', 'with_runtime.lte': String(options.runtime - 1) } : {}),
    })))
    return { results: uniqueMovies(pages.flatMap(data => data.results ?? []).map(record => ({ ...record, mediaType: 'tv' }))), total_pages: Math.max(...pages.map(data => Number(data.total_pages) || 1)) }
  }
  return collectTitles(loadPage, 'tv', options, title => matchesSeries(title, { ...options, genres, excludedGenres }))
}
export async function discoverTitles(options) {
  const pages = await Promise.all(types(options.mediaType ?? 'all').map(async type => {
    if (type === 'tv') return discoverSeries(options)
    if ((options.genres ?? []).some(id => !movieGenres.has(id))) return { titles: [], nextPage: null }
    const result = await discoverFilms({ ...options, exclude: excludedIds(options.exclude ?? [], 'movie') })
    return { titles: result.movies, nextPage: result.nextPage }
  }))
  // Use the earliest unfinished page. Typed exclusions make rescans safe and
  // ensure one catalogue cannot skip unseen results from the other catalogue.
  return { titles: uniqueMovies(pages.flatMap(page => page.titles)), nextPage: cursor(pages) }
}

function relatedGenreIds(reference, target) {
  return [...new Set(reference.genreIds.flatMap(id => target === 'tv' ? ({ 28: [10759], 12: [10759], 878: [10765], 14: [10765], 10752: [10768] }[id] ?? [id]) : ({ 10759: [28, 12], 10765: [878, 14], 10768: [10752] }[id] ?? [id])))].filter(id => (target === 'tv' ? tvGenres : movieGenres).has(id))
}
async function peopleCandidates(reference, aspects) {
  const requests = [...(aspects.includes('cast') ? reference.castIds.map(id => ({ id, role: 'cast' })) : []), ...(aspects.includes('director') ? (reference.mediaType === 'tv' ? reference.creatorIds : reference.directorIds).map(id => ({ id, role: 'crew' })) : [])]
  const records = []
  // Bound simultaneous person-credit requests, even for a large shared cast.
  for (let index = 0; index < requests.length; index += 4) {
    const pages = await Promise.all(requests.slice(index, index + 4).map(async person => (await tmdb(`/person/${person.id}/combined_credits`, { language: 'en-US' }))[person.role] ?? []))
    records.push(...pages.flat())
  }
  return uniqueMovies(records.filter(record => !record.adult && ['movie', 'tv'].includes(record.media_type)).map(record => ({ ...record, mediaType: record.media_type }))).sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
}
export async function similarTitles(options) {
  const [reference] = await getTitles([{ id: options.id, mediaType: options.referenceType }])
  if (!reference) { const error = new Error('This reference title could not be found.'); error.status = 404; throw error }
  const aspects = options.aspects ?? []
  if ((aspects.includes('cast') && !reference.castIds.length) || (aspects.includes('director') && !(reference.mediaType === 'tv' ? reference.creatorIds : reference.directorIds).length) || (aspects.includes('romance') && !reference.moods.includes('Romantic'))) return { titles: [], nextPage: null, reference }
  const people = aspects.includes('cast') || aspects.includes('director') ? await peopleCandidates(reference, aspects) : null
  const pages = await Promise.all(types(options.mediaType).map(async type => {
    const loadPage = people ? async page => { const candidates = people.filter(record => record.mediaType === type); return { results: candidates.slice((page - 1) * 20, page * 20), total_pages: Math.max(1, Math.ceil(candidates.length / 20)) } } : type === reference.mediaType ? page => tmdb(`/${type}/${reference.id}/recommendations`, { language: 'en-US', page: String(page) }) : page => tmdb(`/discover/${type}`, {
      language: 'en-US', include_adult: 'false', sort_by: 'popularity.desc', page: String(page),
      ...(relatedGenreIds(reference, type).length ? { with_genres: relatedGenreIds(reference, type).join('|') } : {}),
    })
    return collectTitles(loadPage, type, options, title => matchesSimilarity(title, reference, aspects))
  }))
  return { titles: uniqueMovies(pages.flatMap(page => page.titles)), nextPage: cursor(pages), reference }
}

export async function trendingTitles(mediaType = 'all') {
  const data = await tmdb(`/trending/${mediaType}/day`, { language: 'en-US' })
  return getTitles((data.results ?? []).filter(record => !record.adult && (mediaType !== 'all' || ['movie', 'tv'].includes(record.media_type))).slice(0, 20).map(record => ({ id: String(record.id), mediaType: mediaType === 'all' ? record.media_type : mediaType })))
}
export async function homeCatalogue() {
  const movies = await trendingTitles('all')
  if (!movies.length) throw new Error('No trending titles are available. Please retry.')
  const excluded = new Set(movies.map(mediaKey))
  try {
    const first = await tmdb('/movie/now_playing', { language: 'en-US', region: 'IN', page: '1' })
    const second = Number(first.total_pages) > 1 ? await tmdb('/movie/now_playing', { language: 'en-US', region: 'IN', page: '2' }) : { results: [] }
    const candidates = uniqueMovies([...(first.results ?? []), ...(second.results ?? [])]).filter(record => !record.adult && record.poster_path && !excluded.has(mediaKey(record)))
    const offset = candidates.length ? Math.floor(Date.parse(today()) / 86400000) % candidates.length : 0
    const spotlights = await getFilms([...candidates.slice(offset), ...candidates.slice(0, offset)].slice(0, 5).map(record => record.id))
    return { movies, spotlights, spotlightError: spotlights.length ? '' : 'No spotlight films are available right now. Please retry.' }
  } catch { return { movies, spotlights: [], spotlightError: 'Could not load the spotlight films. Please retry.' } }
}
