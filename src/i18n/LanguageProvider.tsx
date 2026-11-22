import { createContext, useContext, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { PageDataContext } from '../app/PageData'
import { getLanguage, languageCookie } from '../../shared/languages.mjs'
import type { LocaleNames } from '../../shared/languages.mjs'
import { translate } from '../../shared/translations.mjs'

function valueFor(code = 'en', names?: LocaleNames) {
  const language = getLanguage(code)
  const t = (text: string, values?: Record<string, string | number>) => translate(language.code, text, values)
  const display = (type: 'language' | 'region', value: string) => {
    if (!value || value === 'und') return t('Not recorded')
    const saved = names?.[type === 'language' ? 'languages' : 'regions'][value]
    if (saved) return saved
    try { return new Intl.DisplayNames([language.locale], { type }).of(value) ?? value } catch { return value }
  }
  const date = (value: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) => {
    const [year, month, day] = value.split('-').map(Number)
    return new Intl.DateTimeFormat(language.locale, { ...options, calendar: 'gregory' }).format(new Date(year, month - 1, day, 12))
  }
  return { language, t, languageName: (code: string) => display('language', code), countryName: (code: string) => display('region', code), formatDate: date,
    monthLabel: (year: number, month: number) => new Intl.DateTimeFormat(language.locale, { month: 'long', year: 'numeric', calendar: 'gregory' }).format(new Date(year, month, 1, 12)) }
}
const LanguageContext = createContext(valueFor())
export function LanguageProvider({ children }: { children: ReactNode }) {
  const page = useContext(PageDataContext)
  // Server bootstrap is authoritative during hydration. A bare Vite page is CSR.
  const code = page.language ?? (typeof document === 'undefined' ? 'en' : new URL(location.href).searchParams.get('locale') ?? document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${languageCookie}=`))?.slice(languageCookie.length + 1) ?? 'en')
  const value = useMemo(() => valueFor(code, page.localeNames), [code, page.localeNames])
  useEffect(() => { document.documentElement.lang = value.language.code; document.documentElement.dir = value.language.dir }, [value.language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
export const useI18n = () => useContext(LanguageContext)
