import { useI18n } from '../../i18n/LanguageProvider'
import { useEffect, useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { api } from '../../lib/api'

interface WatchCountry { code: string; name: string }
let cached: { countries: WatchCountry[]; expires: number } | null = null
let pending: Promise<WatchCountry[]> | null = null

function loadCountries() {
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached.countries)
  if (!pending) pending = api<{ countries: WatchCountry[] }>('/api/watch-regions')
    .then(data => { cached = { countries: data.countries, expires: Date.now() + 300000 }; return data.countries })
    .finally(() => { pending = null })
  return pending
}

export function WatchCountrySelect({ value, onChange, hideLabel = false }: { value: string; onChange: (code: string) => void; hideLabel?: boolean }) {
  const { t, countryName, language } = useI18n()
  const id = useId()
  const [countries, setCountries] = useState<WatchCountry[]>(cached?.countries ?? [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true); setError(false)
    loadCountries().then(data => { if (active) setCountries(data) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry])

  return <div className="watch-country-field">
    <label htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>{t("Country")}</label>
    <div className="watch-country-input"><select id={id} value={value} disabled={loading || error} aria-describedby={loading || error ? `${id}-status` : undefined} onChange={event => onChange(event.target.value)}>
      {!countries.some(country => country.code === value) && <option value={value}>{countryName(value)}</option>}
      {[...countries].sort((a, b) => countryName(a.code).localeCompare(countryName(b.code), language.locale)).map(country => <option key={country.code} value={country.code}>{countryName(country.code)}</option>)}
    </select><ChevronDown size={16} aria-hidden="true" /></div>
    {loading && <p id={`${id}-status`} className="watch-country-status" role="status">{t("Loading countries…")}</p>}
    {error && <p id={`${id}-status`} className="watch-country-status" role="status">{t("Couldn’t load countries.")} <button type="button" className="text-button" onClick={() => setRetry(value => value + 1)}>{t("Retry countries")}</button></p>}
  </div>
}
