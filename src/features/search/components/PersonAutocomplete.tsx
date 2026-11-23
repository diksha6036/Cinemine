import { useEffect, useId, useRef, useState } from 'react'
import { UserRound } from 'lucide-react'
import { useI18n } from '../../../i18n/LanguageProvider'
import { api } from '../../../lib/api'
import type { SearchPerson } from '../types/search'

export function PersonAutocomplete({ value, selected, onChange, onSelect }: { value: string; selected: SearchPerson | null; onChange: (value: string) => void; onSelect: (person: SearchPerson) => void }) {
  const { t } = useI18n()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [people, setPeople] = useState<SearchPerson[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [nextPage, setNextPage] = useState<number | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState('')
  const generation = useRef(0)
  const moreController = useRef<AbortController | null>(null)
  const moreButton = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    generation.current++
    moreController.current?.abort()
    let cancelled = false
    const controller = new AbortController()
    setActive(-1); setPeople([]); setNextPage(null); setLoadingMore(false); setMoreError('')
    if (selected || value.trim().length < 2) { setStatus('idle'); return }
    setStatus('loading')
    const timer = window.setTimeout(async () => {
      try {
        const data = await api<{ people: SearchPerson[]; nextPage: number | null }>(`/api/titles/people?${new URLSearchParams({ q: value.trim() })}`, controller.signal)
        if (!cancelled) { setPeople(data.people); setNextPage(data.nextPage ?? null); setStatus('ready') }
      } catch (reason) {
        if (!cancelled) { setError(reason instanceof Error ? reason.message : t('Could not load data. Please retry.')); setStatus('error') }
      }
    }, 300)
    return () => { cancelled = true; controller.abort(); moreController.current?.abort(); window.clearTimeout(timer) }
  }, [value, selected, retry, t])
  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, id])
  function choose(person: SearchPerson) { setOpen(false); setActive(-1); onSelect(person) }
  async function loadMore() {
    if (!nextPage || loadingMore) return
    const version = generation.current
    moreController.current?.abort()
    const controller = new AbortController()
    moreController.current = controller
    setLoadingMore(true); setMoreError('')
    try {
      const data = await api<{ people: SearchPerson[]; nextPage: number | null }>(`/api/titles/people?${new URLSearchParams({ q: value.trim(), page: String(nextPage) })}`, controller.signal)
      if (version === generation.current && !controller.signal.aborted) {
        if (document.activeElement === moreButton.current) document.getElementById(id)?.focus({ preventScroll: true })
        setPeople(previous => [...new Map([...previous, ...data.people].map(person => [person.id, person])).values()])
        setNextPage(data.nextPage ?? null)
      }
    } catch (reason) {
      if (version === generation.current && !controller.signal.aborted) setMoreError(reason instanceof Error ? reason.message : t('Could not load data. Please retry.'))
    } finally {
      if (version === generation.current && !controller.signal.aborted) setLoadingMore(false)
    }
  }
  const expanded = open && status === 'ready' && people.length > 0
  return <div className="autocomplete person-autocomplete" onBlur={event => {
    const form = event.currentTarget.closest('form')
    if (form && event.relatedTarget instanceof Node && form.contains(event.relatedTarget)) return
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }}>
    <label htmlFor={id}>{t('Actor / actress')}</label>
    <input id={id} role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls={`${id}-options`} aria-describedby={`${id}-help`} aria-activedescendant={expanded && active >= 0 ? `${id}-option-${active}` : undefined} autoComplete="off" maxLength={120} placeholder={t('Enter an actor or actress name')} value={value} onFocus={() => setOpen(true)} onChange={event => { onChange(event.target.value); setOpen(true) }} onKeyDown={event => {
      if (event.key === 'ArrowDown' && people.length) { event.preventDefault(); setOpen(true); setActive((active + 1) % people.length) }
      if (event.key === 'ArrowUp' && people.length) { event.preventDefault(); setOpen(true); setActive(active < 0 ? people.length - 1 : (active - 1 + people.length) % people.length) }
      if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(-1) }
      if (event.key === 'Enter' && expanded && active >= 0 && people[active]) { event.preventDefault(); choose(people[active]) }
      else if (event.key === 'Enter') { setOpen(false); setActive(-1) }
    }} />
    <p id={`${id}-help`} className="field-help">{selected ? `${t('Selected:')} ${selected.name}` : t('Enter a name and search, or choose a person from the suggestions.')}</p>
    {open && status === 'loading' && <p role="status" className="autocomplete-status">{t('Searching actors and actresses…')}</p>}
    {open && status === 'ready' && !people.length && !nextPage && <p role="status" className="autocomplete-status">{t('No matching actors or actresses. Try another name.')}</p>}
    {open && status === 'error' && <p role="alert" className="autocomplete-status">{error} <button type="button" className="text-button" onClick={() => { document.getElementById(id)?.focus({ preventScroll: true }); setRetry(retry + 1); setOpen(true) }}>{t('Retry')}</button></p>}
    <ul id={`${id}-options`} role="listbox" aria-label={t('Actor / actress')} aria-busy={loadingMore} className="autocomplete-options" hidden={!expanded}>
      {people.map((person, index) => <li key={person.id} id={`${id}-option-${index}`} role="option" aria-selected={active === index} onMouseDown={event => event.preventDefault()} onClick={() => choose(person)}>
        <div className="person-portrait" aria-hidden="true">{person.profileUrl ? <img src={person.profileUrl} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true }} /> : <UserRound size={24} />}</div>
        <span>{person.name}{person.knownFor.length > 0 && <small>{person.knownFor.join(' · ')}</small>}</span>
      </li>)}
    </ul>
    {open && status === 'ready' && moreError && <p role="alert" className="autocomplete-status">{moreError}</p>}
    {open && status === 'ready' && nextPage && <button ref={moreButton} type="button" className="feature-button person-load-more" aria-disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? t('Loading more…') : moreError ? t('Retry') : t('Show more actors and actresses')}</button>}
  </div>
}
