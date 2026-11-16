import type { ReleaseEvent } from '../types/release'

export function deduplicateEvents(events: ReleaseEvent[]) {
  const unique = new Map<string, ReleaseEvent>()
  for (const event of events) {
    const key = JSON.stringify([event.movieId, event.countryCode, event.releaseType, event.date])
    const previous = unique.get(key)
    if (!previous || event.lastCheckedAt > previous.lastCheckedAt) unique.set(key, event)
  }
  return [...unique.values()]
}
