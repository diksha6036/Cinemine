import { useEffect, useId, useState } from 'react'
import { CircleAlert, MonitorPlay } from 'lucide-react'
import { api } from '../../lib/api'
import { WatchCountrySelect } from './WatchCountrySelect'
import type { MediaType } from '../../types/movie'

interface WatchAvailability {
  countryCode: string
  groups: { type: string; label: string; providers: { id: number; name: string; logoUrl: string }[] }[]
}

interface WhereToWatchProps { movieId: string; mediaType?: MediaType; countryCode?: string; headingLevel?: 'h2' | 'h3'; showCountrySelector?: boolean }

export function WhereToWatch(props: WhereToWatchProps) {
  return <WatchAvailabilityPanel key={`${props.mediaType ?? 'movie'}:${props.movieId}:${props.countryCode ?? 'IN'}`} {...props} />
}

function WatchAvailabilityPanel({ movieId, mediaType = 'movie', countryCode: initialCountryCode = 'IN', headingLevel: Heading = 'h2', showCountrySelector = true }: WhereToWatchProps) {
  const titleId = useId()
  const [countryCode, setCountryCode] = useState(initialCountryCode)
  const [result, setResult] = useState<{ key: string; data?: WatchAvailability; error?: string } | null>(null)
  const [retry, setRetry] = useState(0)
  const requestKey = `${mediaType}:${movieId}:${countryCode}:${retry}`
  const current = result?.key === requestKey ? result : null
  const countryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) ?? countryCode
  const providers = (current?.data?.groups.flatMap(group => group.providers) ?? []).filter((provider, index, all) => all.findIndex(entry => entry.id === provider.id) === index)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const parameters = new URLSearchParams({ id: movieId, mediaType, country: countryCode })
    api<WatchAvailability>(`/api/titles/watch-providers?${parameters}`, controller.signal)
      .then(data => { if (active) setResult({ key: requestKey, data }) })
      .catch(() => { if (active) setResult({ key: requestKey, error: 'Couldn’t load availability. Please try again.' }) })
    return () => { active = false; controller.abort() }
  }, [movieId, mediaType, countryCode, requestKey])

  return <div className="watch-availability"><section className="where-to-watch" aria-labelledby={titleId}>
    <div className={`watch-heading${showCountrySelector ? ' watch-heading-with-country' : ''}`}><Heading id={titleId}>Where to watch</Heading>{showCountrySelector ? <WatchCountrySelect value={countryCode} onChange={setCountryCode} hideLabel /> : <span>In {countryName}</span>}</div>
    {!current ? <div className="watch-state" role="status"><span className="loading-orbit" aria-hidden="true" /><p className="watch-state-description">Checking availability in {countryName}…</p></div> : current.error ? <div className="watch-state" role="status"><CircleAlert size={24} strokeWidth={1.5} aria-hidden="true" /><p className="watch-state-title">Couldn’t load availability</p><p className="watch-state-description">Please try again in a moment.</p><button className="feature-button" type="button" onClick={() => setRetry(value => value + 1)}>Retry</button></div> : current.data && <>
      {providers.length ? <ul className="watch-providers">{providers.map(provider => <li className="watch-provider" key={provider.id}>
          {provider.logoUrl && <img src={provider.logoUrl} alt="" width="32" height="32" loading="lazy" onError={event => { event.currentTarget.hidden = true }} />}
          <span>{provider.name}</span>
        </li>)}</ul> : <div className="watch-state" role="status"><MonitorPlay size={24} strokeWidth={1.5} aria-hidden="true" /><p className="watch-state-title">No platforms listed yet</p><p className="watch-state-description">No streaming information for {countryName}. Try another country.</p></div>}
    </>}
  </section></div>
}
