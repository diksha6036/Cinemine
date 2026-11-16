export async function api<T>(path: string, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(45000)
  const response = await fetch(path, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout, headers: { Accept: 'application/json' } }).catch(error => {
    if (error instanceof DOMException && error.name === 'TimeoutError') throw new Error('The movie service is taking longer than expected. Please retry.')
    throw error
  })
  const data = await response.json().catch(() => ({ error: 'The server returned an unreadable response.' }))
  if (!response.ok) throw new Error(data.error ?? 'Could not load film data. Please retry.')
  return data as T
}
