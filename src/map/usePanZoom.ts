import { type PointerEvent as RPointerEvent, type RefObject, useCallback, useEffect, useRef, useState } from 'react'

export interface View {
  x: number
  y: number
  k: number
}

const MIN = 0.5
const MAX = 2.5
const clampK = (k: number) => Math.min(MAX, Math.max(MIN, k))

/** Zoom (0,5× a 2,5×) e arrasto para um mundo de tamanho fixo dentro de uma janela. */
export function usePanZoom(viewport: RefObject<HTMLElement | null>, world: { w: number; h: number }, enabled: boolean) {
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 })
  const drag = useRef<{ id: number; x: number; y: number } | null>(null)

  const fit = useCallback(() => {
    const el = viewport.current
    if (!el) return
    const { clientWidth: vw, clientHeight: vh } = el
    if (!vw || !vh) return
    const k = clampK(Math.min(vw / world.w, vh / world.h, 1.15) * 0.98)
    setView({ k, x: (vw - world.w * k) / 2, y: (vh - world.h * k) / 2 })
  }, [viewport, world.w, world.h])

  const zoomAt = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      const el = viewport.current
      setView((v) => {
        const k = clampK(v.k * factor)
        const px = cx ?? (el?.clientWidth ?? 0) / 2
        const py = cy ?? (el?.clientHeight ?? 0) / 2
        const ratio = k / v.k
        return { k, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio }
      })
    },
    [viewport],
  )

  useEffect(() => {
    if (!enabled) return
    fit()
    const el = viewport.current
    if (!el) return
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null
    ro?.observe(el)
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - rect.left, e.clientY - rect.top)
      else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === '+' || e.key === '=') zoomAt(1.2)
      else if (e.key === '-') zoomAt(1 / 1.2)
      else if (e.key === '0') fit()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      ro?.disconnect()
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, [enabled, fit, viewport, zoomAt])

  const onPointerDown = (e: RPointerEvent) => {
    if (!enabled || e.button !== 0) return
    if ((e.target as HTMLElement).closest('button, a, [role="switch"]')) return
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: RPointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    d.x = e.clientX
    d.y = e.clientY
    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }))
  }
  const onPointerUp = (e: RPointerEvent) => {
    if (drag.current?.id === e.pointerId) drag.current = null
  }

  return {
    view,
    fit,
    zoomIn: () => zoomAt(1.2),
    zoomOut: () => zoomAt(1 / 1.2),
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  }
}
