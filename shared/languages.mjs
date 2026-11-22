export const languages = [
  { code: 'en', name: 'English', locale: 'en-IN', tmdb: 'en-US', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', locale: 'hi-IN', tmdb: 'hi-IN', dir: 'ltr' },
  { code: 'es', name: 'Español', locale: 'es-ES', tmdb: 'es-ES', dir: 'ltr' },
  { code: 'fr', name: 'Français', locale: 'fr-FR', tmdb: 'fr-FR', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', locale: 'de-DE', tmdb: 'de-DE', dir: 'ltr' },
  { code: 'pt', name: 'Português', locale: 'pt-BR', tmdb: 'pt-BR', dir: 'ltr' },
  { code: 'ar', name: 'العربية', locale: 'ar-SA', tmdb: 'ar-SA', dir: 'rtl' },
  { code: 'ja', name: '日本語', locale: 'ja-JP', tmdb: 'ja-JP', dir: 'ltr' },
  { code: 'ko', name: '한국어', locale: 'ko-KR', tmdb: 'ko-KR', dir: 'ltr' },
  { code: 'zh', name: '中文', locale: 'zh-CN', tmdb: 'zh-CN', dir: 'ltr' },
]
export const languageCookie = 'cinemine-language'
export const originalLanguageCodes = ['en', 'hi', 'fr', 'ja', 'ko', 'ta', 'te', 'es', 'de', 'pt', 'ar', 'zh']
export function getLanguage(value) { return languages.find(language => language.code === value) ?? languages[0] }
export function localeNames(code, extraLanguages = []) {
  const language = getLanguage(code)
  const languageNames = new Intl.DisplayNames([language.locale], { type: 'language' })
  const regions = new Intl.DisplayNames([language.locale], { type: 'region' })
  return {
    languages: Object.fromEntries([...new Set([...originalLanguageCodes, ...extraLanguages])].filter(code => /^[a-z]{2,3}$/.test(code)).map(code => [code, languageNames.of(code) ?? code])),
    regions: Object.fromEntries(['IN', 'US', 'GB', 'CA', 'AU'].map(code => [code, regions.of(code) ?? code])),
  }
}
export function requestLanguage(request) {
  const url = new URL(request.url || '/', 'http://localhost')
  const cookie = typeof request.headers?.get === 'function' ? request.headers.get('cookie') : request.headers?.cookie
  const saved = String(cookie ?? '').split(';').map(part => part.trim()).find(part => part.startsWith(`${languageCookie}=`))?.slice(languageCookie.length + 1)
  return getLanguage(url.searchParams.get('locale') ?? saved).code
}
