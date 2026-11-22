export type LanguageCode = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'pt' | 'ar' | 'ja' | 'ko' | 'zh'
export interface Language { code: LanguageCode; name: string; locale: string; tmdb: string; dir: 'ltr' | 'rtl' }
export const languages: Language[]
export const languageCookie: string
export const originalLanguageCodes: string[]
export interface LocaleNames { languages: Record<string, string>; regions: Record<string, string> }
export function localeNames(code: string, extraLanguages?: string[]): LocaleNames
export function getLanguage(value?: string | null): Language
export function requestLanguage(request: { url?: string; headers?: unknown }): LanguageCode
