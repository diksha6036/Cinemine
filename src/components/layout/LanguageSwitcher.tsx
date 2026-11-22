import { Languages, ChevronDown } from 'lucide-react'
import { languages, languageCookie } from '../../../shared/languages.mjs'
import { useI18n } from '../../i18n/LanguageProvider'

export function LanguageSwitcher() {
  const { language, t } = useI18n()
  return <label className="language-switcher" title={t('Website language')}>
    <Languages size={17} aria-hidden="true" /><span className="sr-only">{t('Website language')}</span>
    <select aria-label={t('Website language')} value={language.code} onChange={event => {
      const code = event.target.value
      document.cookie = `${languageCookie}=${code}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
      const destination = new URL(location.href)
      destination.searchParams.set('locale', code)
      // A navigation gives translated source data and SSR one consistent language.
      location.assign(destination.href)
    }}>{languages.map(option => <option key={option.code} value={option.code} lang={option.code} dir={option.dir}>{option.name}</option>)}</select>
    <ChevronDown size={13} aria-hidden="true" />
  </label>
}
