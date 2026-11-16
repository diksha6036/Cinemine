import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Dialog({ titleId, onClose, children, className = '', returnFocusTo }: { titleId: string; onClose: () => void; children: ReactNode; className?: string; returnFocusTo?: HTMLElement | null }) {
  const ref = useRef<HTMLDialogElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const trigger = returnFocusTo ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    const dialog = ref.current!
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (trigger?.isConnected && trigger.getClientRects().length && !trigger.closest('[inert]')) trigger.focus({ preventScroll: true })
      else document.getElementById('global-search-trigger')?.focus({ preventScroll: true })
    }
  }, [returnFocusTo])
  return <dialog ref={ref} className={`app-dialog ${className}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); closeRef.current() }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeRef.current() } }} onKeyDown={event => {
    if (event.key !== 'Tab') return
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(item => item.getClientRects().length > 0)
    const first = items[0], last = items.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }}>
    <button type="button" className="dialog-close icon-button" aria-label="Close dialog" onClick={onClose}><X size={21} /></button>
    {children}
  </dialog>
}
