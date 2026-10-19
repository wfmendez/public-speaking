import { useCallback, useEffect, useState } from 'react'
import { StepContext } from './components/Draw'
import { slides } from './slides'

type Pos = { slide: number; step: number }

const clampPos = ({ slide, step }: Pos): Pos => {
  const s = Math.min(Math.max(slide, 0), slides.length - 1)
  return { slide: s, step: Math.min(Math.max(step, 0), slides[s].steps) }
}

const readHash = (): Pos => {
  const [, slide = '1', step = '0'] = location.hash.split('/')
  return clampPos({ slide: Number(slide) - 1 || 0, step: Number(step) || 0 })
}

// Presentation clickers send PageDown/PageUp (some send arrows, "b" or ".").
const NEXT = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter', 'n'])
const PREV = new Set(['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'])

export default function App() {
  const [pos, setPos] = useState<Pos>(readHash)
  const [mounted, setMounted] = useState(false)
  const [black, setBlack] = useState(false)
  const [progress, setProgress] = useState(true)

  const next = useCallback(() => setPos(({ slide, step }) =>
    step < slides[slide].steps
      ? { slide, step: step + 1 }
      : clampPos({ slide: slide + 1, step: slide + 1 < slides.length ? 0 : step })), [])

  const prev = useCallback(() => setPos(({ slide, step }) =>
    step > 0
      ? { slide, step: step - 1 }
      : slide > 0 ? { slide: slide - 1, step: slides[slide - 1].steps } : { slide, step }), [])

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
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (black && k !== 'b' && k !== '.') { setBlack(false); e.preventDefault(); return }
      if (NEXT.has(k)) next()
      else if (PREV.has(k)) prev()
      else if (k === 'Home') setPos({ slide: 0, step: 0 })
      else if (k === 'End') setPos(clampPos({ slide: slides.length - 1, step: 99 }))
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
  }, [next, prev, black])

  const { Slide } = slides[pos.slide]
  const total = slides.reduce((n, s) => n + s.steps + 1, 0)
  const done = slides.slice(0, pos.slide).reduce((n, s) => n + s.steps + 1, 0) + pos.step + 1

  return (
    <main
      className="stage"
      onClick={next}
      onContextMenu={(e) => { e.preventDefault(); prev() }}
    >
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="canvas">
        <StepContext.Provider value={mounted ? pos.step : -1}>
          <g key={pos.slide} className="slide">
            <Slide />
          </g>
        </StepContext.Provider>
      </svg>
      {progress && <div className="progress" style={{ width: `${(done / total) * 100}%` }} />}
      <div className={`blackout${black ? ' on' : ''}`} />
    </main>
  )
}
