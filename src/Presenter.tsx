import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import { StepContext } from './components/Draw'
import type { SlideDef } from './deck'

type Pos = { slide: number; step: number }

const clampPos = (slides: SlideDef[], { slide, step }: Pos): Pos => {
  const s = Math.min(Math.max(slide, 0), slides.length - 1)
  return { slide: s, step: Math.min(Math.max(step, 0), slides[s].steps) }
}

const readHash = (slides: SlideDef[]): Pos => {
  const [, slide = '1', step = '0'] = location.hash.split('/')
  return clampPos(slides, { slide: Number(slide) - 1 || 0, step: Number(step) || 0 })
}

// Presentation clickers send PageDown/PageUp (some send arrows, "b" or ".").
const NEXT = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter', 'n'])
const PREV = new Set(['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'])

export default function Presenter({ slides }: { slides: SlideDef[] }) {
  const [pos, setPos] = useState<Pos>(() => readHash(slides))
  const [mounted, setMounted] = useState(false)
  const [black, setBlack] = useState(false)
  const [progress, setProgress] = useState(true)

  const next = useCallback(() => setPos(({ slide, step }) =>
    step < slides[slide].steps
      ? { slide, step: step + 1 }
      : clampPos(slides, { slide: slide + 1, step: slide + 1 < slides.length ? 0 : step })), [slides])

  const prev = useCallback(() => setPos(({ slide, step }) =>
    step > 0
      ? { slide, step: step - 1 }
      : slide > 0 ? { slide: slide - 1, step: slides[slide - 1].steps } : { slide, step }), [slides])

  // Render each new slide once with nothing revealed, so its strokes animate in.
  useEffect(() => {
    setMounted(false)
    let inner = 0
    const outer = requestAnimationFrame(() => { inner = requestAnimationFrame(() => setMounted(true)) })
    return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner) }
  }, [pos.slide])

  useEffect(() => {
    history.replaceState(null, '', `#/${pos.slide + 1}/${pos.step}`)
  }, [pos])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Leave browser shortcuts alone, and ignore auto-repeat so a held clicker button can't skip slides.
      if (e.ctrlKey || e.altKey || e.metaKey) return
      if (e.repeat) { e.preventDefault(); return }
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (black && k !== 'b' && k !== '.') { setBlack(false); e.preventDefault(); return }
      if (NEXT.has(k)) next()
      else if (PREV.has(k)) prev()
      else if (k === 'Home') setPos({ slide: 0, step: 0 })
      else if (k === 'End') setPos(clampPos(slides, { slide: slides.length - 1, step: 99 }))
      else if (k === 'b' || k === '.') setBlack((b) => !b)
      else if (k === 'p') setProgress((p) => !p)
      else if (k === 'f' || k === 'F5') {
        if (document.fullscreenElement) document.exitFullscreen()
        else document.documentElement.requestFullscreen().catch(() => {})
      } else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, black, slides])

  // The click that brings the window back into focus should not also advance a slide.
  const focusedAt = useRef(0)
  useEffect(() => {
    const onFocus = () => { focusedAt.current = Date.now() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])
  const onClick = () => { if (Date.now() - focusedAt.current > 400) next() }

  // On phones: swipe left for the next step, right to go back (a tap still advances).
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(t.clientY - start.y)) return
    e.preventDefault()
    if (dx < 0) next()
    else prev()
  }

  const { Slide } = slides[pos.slide]
  const total = slides.reduce((n, s) => n + s.steps + 1, 0)
  const done = slides.slice(0, pos.slide).reduce((n, s) => n + s.steps + 1, 0) + pos.step + 1

  return (
    <main
      className="stage"
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onContextMenu={(e) => { e.preventDefault(); prev() }}
    >
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="canvas">
        <StepContext.Provider value={mounted ? pos.step : -1}>
          <g key={pos.slide} className="slide">
            <Slide />
          </g>
        </StepContext.Provider>
      </svg>
      {progress && done > 1 && <div className="progress" style={{ width: `${(done / total) * 100}%` }} />}
      <div className={`blackout${black ? ' on' : ''}`} />
    </main>
  )
}
