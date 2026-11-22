import { translate } from '../../shared/translations.mjs'

export async function api<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = new URL(path, window.location.origin)
  url.searchParams.set('locale', document.documentElement.lang || 'en')
  const failure = (message: string) => new Error(translate(document.documentElement.lang, document.documentElement.lang === 'en' ? message : 'Could not load data. Please retry.'))
  const timeout = AbortSignal.timeout(45000)
  const response = await fetch(url.pathname + url.search, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout, headers: { Accept: 'application/json' } }).catch(error => {
    if (error instanceof DOMException && error.name === 'TimeoutError') throw failure('The movie service is taking longer than expected. Please retry.')
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw failure('Could not connect to the movie service. Please retry.')
  })
  const data = await response.json().catch(() => ({ error: 'The server returned an unreadable response.' }))
  if (!response.ok) throw failure(data.error ?? 'Could not load film data. Please retry.')
  return data as T
}
