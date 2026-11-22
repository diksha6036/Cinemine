import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'

interface Point { x: number; y: number }
interface Drag { pointerId: number; start: Point; origin: Point; moved: boolean }
const STORAGE_KEY = 'cinemine-buddy-position'
const EDGE = 16

export function useDraggableBuddy() {
  const ref = useRef<HTMLElement>(null)
  const current = useRef<Point | null>(null)
  const drag = useRef<Drag | null>(null)
  const ignoreClick = useRef(false)
  const [position, setPosition] = useState<Point | null>(null)
  const [dragging, setDragging] = useState(false)

  const moveTo = useCallback((point: Point, save = false) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const viewport = window.visualViewport
    const left = (viewport?.offsetLeft ?? 0) + EDGE
    const top = (viewport?.offsetTop ?? 0) + EDGE
    const right = Math.max(left, (viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth) - rect.width - EDGE)
    const bottom = Math.max(top, (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - rect.height - EDGE)
    const next = { x: Math.min(right, Math.max(left, point.x)), y: Math.min(bottom, Math.max(top, point.y)) }
    current.current = next
    setPosition(next)
    if (save) {
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* Moving still works without storage. */ }
    }
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')
      if (saved && typeof saved.x === 'number' && typeof saved.y === 'number' && Number.isFinite(saved.x) && Number.isFinite(saved.y)) moveTo(saved)
    } catch { /* Ignore missing or invalid saved positions. */ }
    const fit = () => { if (current.current) moveTo(current.current, true) }
    window.addEventListener('resize', fit)
    window.visualViewport?.addEventListener('resize', fit)
    window.visualViewport?.addEventListener('scroll', fit)
    return () => {
      window.removeEventListener('resize', fit)
      window.visualViewport?.removeEventListener('resize', fit)
      window.visualViewport?.removeEventListener('scroll', fit)
    }
  }, [moveTo])

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || !event.isPrimary || drag.current) return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    ignoreClick.current = false
    drag.current = { pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: { x: rect.left, y: rect.top }, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current
    if (!active || active.pointerId !== event.pointerId) return
    const dx = event.clientX - active.start.x, dy = event.clientY - active.start.y
    if (!active.moved && Math.hypot(dx, dy) < 6) return
    active.moved = true
    setDragging(true)
    moveTo({ x: active.origin.x + dx, y: active.origin.y + dy })
    event.preventDefault()
  }

  function finish(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const active = drag.current
    if (!active || active.pointerId !== event.pointerId) return
    drag.current = null
    ignoreClick.current = active.moved && !cancelled
    if (active.moved && current.current) moveTo(current.current, true)
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function shouldIgnoreClick(event: MouseEvent<HTMLButtonElement>) {
    const ignore = ignoreClick.current && event.detail !== 0
    ignoreClick.current = false
    if (ignore) { event.preventDefault(); event.stopPropagation() }
    return ignore
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const direction: Record<string, Point> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }
    const step = direction[event.key]
    const rect = ref.current?.getBoundingClientRect()
    if (!step || !rect) return
    event.preventDefault()
    const distance = event.shiftKey ? 40 : 12
    moveTo({ x: rect.left + step.x * distance, y: rect.top + step.y * distance }, true)
  }

  return { ref, position, dragging, onPointerDown, onPointerMove, onPointerUp: (event: PointerEvent<HTMLButtonElement>) => finish(event), onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => finish(event, true), onLostPointerCapture: (event: PointerEvent<HTMLButtonElement>) => finish(event, true), onKeyDown, shouldIgnoreClick }
}
