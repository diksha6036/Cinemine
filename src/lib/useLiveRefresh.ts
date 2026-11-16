import { useEffect } from 'react'

// Recheck visible pages every five minutes and when returning to an older tab.
export function useLiveRefresh(refresh: () => void) {
  useEffect(() => {
    let lastRefresh = Date.now()
    const check = () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastRefresh < 300000) return
      lastRefresh = Date.now()
      refresh()
    }
    const interval = window.setInterval(check, 300000)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [refresh])
}
