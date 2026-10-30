import { useEffect, useRef, type CSSProperties } from 'react'
import { decks } from './decks'

// Little static sketches for each card, in the same ink style as the slides.
const PREVIEWS: Record<string, string[]> = {
  '/failure': [
    'M20,150 C60,146 82,132 84,110 C86,86 70,76 96,72 C150,64 214,68 224,86 C234,104 192,120 150,116 C112,112 90,96 112,86 C138,74 176,78 184,96 C192,114 174,132 152,130 C126,128 118,104 138,94 C162,82 214,86 230,104 C244,120 238,132 226,124 C210,112 224,86 238,78 C254,68 280,56 300,48',
  ],
  '/design': [
    'M120,24 H200 Q216,24 216,40 V156 Q216,172 200,172 H120 Q104,172 104,156 V40 Q104,24 120,24 Z',
    'M114,44 H206 V138 H114 Z',
    'M152,155 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0',
    'M126,58 H146 V78 H126 Z M150,58 H170 V78 H150 Z M174,58 H194 V78 H174 Z M126,86 H146 V106 H126 Z M150,86 H170 V106 H150 Z',
  ],
  '/agents': [
    'M160,98 m-62,0 a62,62 0 1,0 124,0 a62,62 0 1,0 -124,0',
    'M160,26 l10,10 -10,10 -10,-10 Z M232,98 l10,10 -10,10 -10,-10 Z M160,150 l10,10 -10,10 -10,-10 Z M88,98 l10,10 -10,10 -10,-10 Z',
    'M144,98 a16,16 0 1,0 32,0 a16,16 0 1,0 -32,0',
  ],
  '/emotions': [
    'M160,18 C210,17 242,56 242,98 C243,142 208,178 160,178 C112,179 78,142 78,98 C77,56 112,19 160,18 Z',
    'M130,72 v10 M190,72 v10',
    'M118,116 Q160,156 202,116',
  ],
  '/leaders': [
    'M90,172 H230 V146 H90 Z',
    'M102,140 H218 V114 H102 Z',
    'M114,108 H206 V82 H114 Z',
    'M126,76 H194 V50 H126 Z',
    'M138,44 H182 V18 H138 Z',
  ],
}

// Clickers send PageDown/PageUp, so they can move between the cards too.
const NEXT = new Set(['ArrowRight', 'ArrowDown', 'PageDown', 'Tab'])
const PREV = new Set(['ArrowLeft', 'ArrowUp', 'PageUp'])

export default function Home() {
  const cards = useRef<(HTMLAnchorElement | null)[]>([])

  useEffect(() => {
    cards.current[0]?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return
      const i = cards.current.findIndex((c) => c === document.activeElement)
      const n = decks.length
      if (NEXT.has(e.key)) cards.current[(i + 1 + n) % n]?.focus()
      else if (PREV.has(e.key)) cards.current[(i - 1 + n) % n]?.focus()
      else if (e.key === ' ' || e.key === 'F5') cards.current[Math.max(i, 0)]?.click()
      else if (/^[1-9]$/.test(e.key)) cards.current[Number(e.key) - 1]?.click()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <main className="home">
      <h1>Choose a talk</h1>
      <div className="cards">
        {decks.map((d, i) => (
          <a
            key={d.path} href={d.path} className="card" ref={(el) => { cards.current[i] = el }}
            style={d.accent ? ({ '--accent': d.accent } as CSSProperties) : undefined}
          >
            <svg viewBox="0 0 320 196" aria-hidden="true">
              {PREVIEWS[d.path]?.map((p, j) => <path key={j} d={p} />)}
            </svg>
            <span className="card-title">{d.title}</span>
            <span className="card-meta">{d.minutes} min</span>
          </a>
        ))}
      </div>
    </main>
  )
}
