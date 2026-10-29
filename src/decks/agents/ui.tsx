import { useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { D, G, StepContext } from '../../components/Draw'
import { music } from './music'

// Building blocks shared by the slides and the opening video.

export const useStep = () => useContext(StepContext)

/** HTML overlay (styled with Tailwind) inside the 1600×900 slide, so it scales with everything else. */
export const Html = ({ light, children }: { light?: boolean; children: ReactNode }) => (
  <foreignObject x={0} y={0} width={1600} height={900}>
    <div className={`relative h-[900px] w-[1600px] font-tight ${light ? 'text-ink' : 'text-snow'}`}>{children}</div>
  </foreignObject>
)

/** Fades/slides in at step `at`, out at step `until`. `blur` arrives out of a blur instead. */
export function Reveal({ at = 0, until, delay = 0, blur, className = '', children }: {
  at?: number; until?: number; delay?: number; blur?: boolean; className?: string; children: ReactNode
}) {
  const step = useStep()
  const state = step >= (until ?? Infinity) ? 'out' : step >= at ? 'in' : ''
  return (
    <div className={`${blur ? 'blurin' : 'reveal'} ${state} ${className}`} style={{ transitionDelay: state === 'in' ? `${delay}s` : '0s' }}>
      {children}
    </div>
  )
}

type Ch = { c: string; hl: boolean; i: number }

/** "Inside an *agent*" → lines of words of characters; *stars* mark the highlighted words. */
export function parse(text: string) {
  let hl = false
  let i = 0
  return text.split('\n').map((line) => {
    const words: Ch[][] = [[]]
    for (const c of line) {
      if (c === '*') { hl = !hl; continue }
      if (c === ' ') { words.push([{ c, hl, i: i++ }], []); continue }
      words[words.length - 1].push({ c, hl, i: i++ })
    }
    return words.filter((w) => w.length)
  })
}

/**
 * Kinetic type: the text types itself, letter by letter, with a block cursor.
 * Highlighted words (between *stars*) take the `hl` colour.
 */
export function Typed({ text, active = true, delay = 0, speed = 42, className = '', hl = 'text-mint [text-shadow:0_0_28px_rgba(61,255,200,0.55)]', caret = false }: {
  text: string; active?: boolean; delay?: number; speed?: number; className?: string; hl?: string; caret?: boolean
}) {
  const lines = useMemo(() => parse(text), [text])
  const total = lines.flat(2).length
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!active) { setN(0); return }
    let i = 0
    let timer = 0
    const start = window.setTimeout(() => {
      timer = window.setInterval(() => {
        i += 1
        setN(i)
        if (i % 2) music.type()
        if (i >= total) window.clearInterval(timer)
      }, speed)
    }, delay * 1000)
    return () => { window.clearTimeout(start); window.clearInterval(timer) }
  }, [active, total, delay, speed])

  const showCaret = active && (n < total || caret)
  return (
    <div className={className}>
      {lines.map((words, li) => (
        <span key={li} className="block">
          {words.map((w) => (
            <span key={w[0].i} className={w[0].c === ' ' ? '' : 'inline-block whitespace-pre'}>
              {w.map(({ c, hl: h, i }) => (
                <span key={i} className={`relative ${h ? hl : ''}`} style={{ visibility: i < n ? 'visible' : 'hidden' }}>
                  {c}
                  {showCaret && i === n && <span className="caret" style={{ visibility: 'visible' }} />}
                </span>
              ))}
              {showCaret && n === total && w[w.length - 1].i === total - 1 && <span className="relative"><span className="caret" /></span>}
            </span>
          ))}
        </span>
      ))}
    </div>
  )
}

export const Mono = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <div className={`font-mono text-[24px] uppercase tracking-[0.18em] ${className}`}>{children}</div>
)

// A tiny pixel robot (our own mascot). e = eye.
const BOT = ['....x....', '..xxxxx..', '.xxxxxxx.', '.xexxxex.', '.xxxxxxx.', 'xx.xxx.xx', '..x...x..']

export function Bot({ px = 12, color = '#ff5d8f', className = '' }: { px?: number; color?: string; className?: string }) {
  return (
    <div className={`grid ${className}`} style={{ gridTemplateColumns: `repeat(9, ${px}px)`, gridAutoRows: `${px}px` }}>
      {BOT.join('').split('').map((c, i) => (
        <div key={i} style={{ background: c === '.' ? 'transparent' : color }}>
          {c === 'e' && <div className="blink h-full w-full bg-[#0b1250]" />}
        </div>
      ))}
    </div>
  )
}

/** UI panel used for captions over the 3D world. */
export const Panel = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <div className={`rounded-2xl border-2 border-snow/60 bg-[#0d1660]/85 ${className}`}>{children}</div>
)

/** Wireframe open box: the agent, ready to be filled with tools. */
export function OpenBox() {
  const hatch = [0.2, 0.35, 0.5, 0.65, 0.8].map((f) => {
    const x = 1040 + f * 160
    const yTop = 430 + f * 70
    return `M${x},${yTop} V${yTop + 220}`
  })
  return (
    <g>
      <G at={1} delay={1.6} dimTo={1}><polygon points="1040,430 1200,360 1360,430 1200,500" style={{ fill: 'var(--accent)', opacity: 0.18 }} /></G>
      <D at={1} delay={0.3} width={3} d="M1040,430 L1200,500 L1360,430 M1040,430 V650 L1200,720 L1360,650 V430 M1200,500 V720" />
      <D at={1} delay={0.9} width={3} d="M1040,430 L1200,360 L1360,430" soft />
      <D at={1} delay={1.2} width={3} d="M1040,430 L980,300 L1140,232 L1200,360" />
      <D at={1} delay={1.4} width={3} d="M1360,430 L1450,322 L1290,252 L1200,360" />
      {hatch.map((d, i) => <D key={d} at={1} delay={1.5 + i * 0.08} width={2} soft d={d} />)}
      <D at={1} delay={1.9} width={2} soft d="M860,520 H1010 M820,600 H1015 M880,680 H1020" />
    </g>
  )
}

/** Typed text driven by the clicker: types at step `at`, disappears at `until`. */
export function Type({ at = 0, until, ...rest }: Omit<Parameters<typeof Typed>[0], 'active'> & { at?: number; until?: number }) {
  const step = useStep()
  return <Typed active={step >= at && step < (until ?? Infinity)} {...rest} />
}
