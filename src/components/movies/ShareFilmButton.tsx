import { useI18n } from '../../i18n/LanguageProvider'
import { useContext, useEffect, useRef, useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import { PageDataContext } from '../../app/PageData'
import { Dialog } from '../ui/Dialog'
import type { Movie } from '../../types/movie'
import { mediaKey, titlePath } from '../../../shared/media.mjs'

export function ShareFilmButton({ movie }: { movie: Movie }) {
  const { t } = useI18n()
  const page = useContext(PageDataContext)
  const [copied, setCopied] = useState(false)
  const [manualUrl, setManualUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  useEffect(() => { if (manualUrl) { input.current?.focus(); input.current?.select() } }, [manualUrl])
  const identity = mediaKey(movie)
  useEffect(() => { setCopied(false); setManualUrl(''); if (timer.current) clearTimeout(timer.current) }, [identity])
  async function share() {
    const url = new URL(titlePath(movie), page.origin || window.location.origin).href
    const data = { title: `${movie.title}${movie.releaseYear ? ` (${movie.releaseYear})` : ''} · Cinemine`, text: t('Found something to watch: {title}.', { title: movie.title }), url }
    setBusy(true)
    try {
      if (navigator.share) {
        try { await navigator.share(data); return }
        catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return }
      }
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
        await navigator.clipboard.writeText(url)
        setCopied(true)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), 2500)
      } catch { setManualUrl(url) }
    } finally { setBusy(false) }
  }
  return <>
    <button type="button" className={`feature-button share-film ${copied ? 'is-copied' : ''}`} disabled={busy} onClick={() => void share()}>{copied ? <Check size={16} /> : <Share2 size={16} />} {copied ? t("Link copied") : movie.mediaType === 'tv' ? t("Share series") : t("Share film")}</button>
    <span role="status" className="sr-only">{copied ? t('Link for {title} copied to clipboard.', { title: movie.title }) : ''}</span>
    {manualUrl && <Dialog titleId="share-dialog-title" className="share-dialog" onClose={() => setManualUrl('')}><p className="feature-eyebrow">{t("A good film is worth sharing")}</p><h2 id="share-dialog-title">{t("Send a little cinema.")}</h2><p className="feature-muted">{t("Copy this link for your next movie night.")}</p><label className="share-link-label"><Copy size={15} />  {t("Title link")}<input ref={input} readOnly value={manualUrl} onFocus={event => event.target.select()} /></label></Dialog>}
  </>
}
