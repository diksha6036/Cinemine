import { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { createMetadata } from '../../../shared/seo.mjs'
import { PageDataContext } from '../../app/PageData'
import { useCatalogue } from '../../features/catalogue/useCatalogue'
import type { SearchMovie } from '../../features/search/types/search'
import { useI18n } from '../../i18n/LanguageProvider'

export function PageMetadata({ movie, status = 200 }: { movie?: SearchMovie | null; status?: number }) {
  const { language } = useI18n()
  const { pathname } = useLocation()
  const page = useContext(PageDataContext)
  const { movies } = useCatalogue()
  useEffect(() => {
    const meta = createMetadata({ pathname, origin: page.origin || window.location.origin, movie, movies, status, noIndex: page.noIndex, language: language.code })
    document.title = meta.title
    const update = (key: string, value: string, property = false) => {
      const attribute = property ? 'property' : 'name'
      let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
      if (!tag) { tag = document.createElement('meta'); tag.setAttribute(attribute, key); document.head.appendChild(tag) }
      tag.content = value
    }
    update('description', meta.description); update('robots', meta.robots)
    for (const [key, value] of Object.entries({ 'og:site_name': 'Cinemine', 'og:locale': language.locale.replace('-', '_'), 'og:title': meta.title, 'og:description': meta.description, 'og:type': meta.type, 'og:url': meta.canonical, 'og:image': meta.image, 'og:image:alt': meta.imageAlt })) update(key, value, true)
    for (const [key, value] of Object.entries({ 'twitter:card': 'summary_large_image', 'twitter:title': meta.title, 'twitter:description': meta.description, 'twitter:image': meta.image, 'twitter:image:alt': meta.imageAlt })) update(key, value)
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
    canonical.href = meta.canonical
    let structured = document.getElementById('page-structured-data')
    if (!structured) { structured = document.createElement('script'); structured.id = 'page-structured-data'; structured.setAttribute('type', 'application/ld+json'); document.head.appendChild(structured) }
    structured.textContent = JSON.stringify(meta.jsonLd)
  }, [pathname, page.origin, page.noIndex, movie, movies, status, language])
  return null
}
export function RouteMetadata() {
  const { pathname } = useLocation()
  const { error } = useCatalogue()
  return /^\/(movie|series)\//.test(pathname) ? null : <PageMetadata status={['/', '/sitemap'].includes(pathname) && error ? 503 : 200} />
}
