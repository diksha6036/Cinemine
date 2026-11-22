import { useSyncExternalStore } from 'react'

// Shared compact navigation for phones and tablets, including landscape tablets.
export const MOBILE_LAYOUT_QUERY = '(max-width: 1400px)'

function subscribe(callback: () => void) {
  const media = window.matchMedia(MOBILE_LAYOUT_QUERY)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

export function useMobileLayout() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE_LAYOUT_QUERY).matches, () => false)
}
