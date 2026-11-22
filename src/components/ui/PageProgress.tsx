import { useI18n } from '../../i18n/LanguageProvider'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'

export function PageProgress() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const line = useRef<HTMLDivElement>(null)
  const [showTop, setShowTop] = useState(false)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
      if (line.current) line.current.style.transform = `scaleX(${progress})`
      setShowTop(scrollable > 200 && window.scrollY > Math.min(600, window.innerHeight * .5, scrollable * .5))
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new ResizeObserver(schedule)
    observer.observe(document.body)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule) }
  }, [pathname])
  return <>
    <div className="page-progress" aria-hidden="true"><div ref={line} /></div>
    {showTop && <button type="button" className="back-to-top" aria-label={t("Back to top")} title={t("Back to top")} onClick={() => { window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); document.querySelector<HTMLElement>('.brand')?.focus({ preventScroll: true }) }}><ArrowUp size={17} /><span>{t("Back to top")}</span></button>}
  </>
}
