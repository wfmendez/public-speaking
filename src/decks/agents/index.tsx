import '@fontsource/inter-tight/500.css'
import '@fontsource/inter-tight/700.css'
import '@fontsource/inter-tight/800.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import './agents.css'
import { lazy, Suspense, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { D, G, StepContext } from '../../components/Draw'
import type { SlideDef } from '../../deck'
import { BPM, music } from './music'
import { CHROME, LOOP, mixFor, SURFACE, TOOLS, EVERYDAY } from './data'

// Three.js is only downloaded when this class is opened.
const World = lazy(() => import('./World'))

const useStep = () => useContext(StepContext)

/** HTML overlay (styled with Tailwind) inside the 1600×900 slide, so it scales with everything else. */
const Html = ({ light, children }: { light?: boolean; children: ReactNode }) => (
  <foreignObject x={0} y={0} width={1600} height={900}>
    <div className={`relative h-[900px] w-[1600px] font-tight ${light ? 'text-ink' : 'text-snow'}`}>{children}</div>
  </foreignObject>
)

/** Fades/slides in at step `at`, out at step `until`. `blur` arrives out of a blur instead. */
function Reveal({ at = 0, until, delay = 0, blur, className = '', children }: {
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
function parse(text: string) {
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
function Type({ text, at = 0, until, delay = 0, speed = 42, className = '', hl = 'text-mint [text-shadow:0_0_28px_rgba(61,255,200,0.55)]', caret = false }: {
  text: string; at?: number; until?: number; delay?: number; speed?: number; className?: string; hl?: string; caret?: boolean
}) {
  const step = useStep()
  const active = step >= at && step < (until ?? Infinity)
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

  const showCaret = active && (n < total || caret) && (n > 0 || step >= at)
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

const Mono = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <div className={`font-mono text-[24px] uppercase tracking-[0.18em] ${className}`}>{children}</div>
)

// A tiny pixel robot (our own mascot). e = eye.
const BOT = ['....x....', '..xxxxx..', '.xxxxxxx.', '.xexxxex.', '.xxxxxxx.', 'xx.xxx.xx', '..x...x..']

function Bot({ px = 12, color = '#ff5d8f', className = '' }: { px?: number; color?: string; className?: string }) {
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
const Panel = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <div className={`rounded-2xl border-2 border-snow/60 bg-[#0d1660]/85 ${className}`}>{children}</div>
)

// ---------- line art ----------

const CHANNELS = ['SEARCH', 'CALENDAR', 'EMAIL', 'CODE']

/** A wireframe DJ mixer; `up` faders are pushed up (and their meters dance). */
function Mixer({ x, y, up, at = 0 }: { x: number; y: number; up: number; at?: number }) {
  return (
    <g>
      {CHANNELS.map((name, i) => {
        const cx = x + i * 175
        const on = up > i
        const circle = (cy: number) => `M${cx + 70},${cy - 22} a22,22 0 1,0 0.01,0`
        return (
          <g key={name}>
            <D at={at} delay={0.2 + i * 0.12} width={3} d={`M${cx},${y} H${cx + 140} V${y + 560} H${cx} Z`} />
            <D at={at} delay={0.5 + i * 0.12} width={3} soft d={circle(y + 60)} />
            <D at={at} delay={0.6 + i * 0.12} width={3} soft d={circle(y + 125)} />
            <D at={at} delay={0.7 + i * 0.12} width={3} soft d={`M${cx + 70},${y + 190} V${y + 470}`} />
            {[0, 1, 2, 3, 4, 5].map((b) => (
              <rect
                key={b} x={cx + 108} y={y + 440 - b * 44} width={16} height={36} rx={3}
                className={on ? 'meter' : ''}
                style={{ fill: b > 3 ? '#ff5d8f' : 'var(--accent)', opacity: on ? 0.9 : 0.12, animationDelay: `${(b * 0.07 + i * 0.11) % 0.27}s`, transition: 'opacity 0.4s' }}
              />
            ))}
            <G at={at} delay={0.9 + i * 0.12}>
              <g style={{ transform: `translateY(${on ? -240 : 0}px)`, transition: 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
                <rect x={cx + 35} y={y + 440} width={70} height={34} rx={6} style={{ fill: on ? 'var(--accent)' : 'var(--paper)', stroke: 'var(--ink)', strokeWidth: 3, transition: 'fill 0.4s' }} />
              </g>
              <text x={cx + 70} y={y + 532} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} style={{ fill: 'var(--ink)', opacity: on ? 1 : 0.55 }}>{name}</text>
            </G>
          </g>
        )
      })}
    </g>
  )
}

/** Wireframe open box: the agent, ready to be filled with tools. */
function OpenBox() {
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

/** A wireframe club: speaker stacks, a floor in perspective and a crowd that moves to the beat. */
function Club() {
  const floor = [-600, -300, 0, 300, 600, 900, 1200, 1500, 1800, 2100].map((x) => `M800,520 L${x},900`).join(' ')
  const stack = (x: number) => [0, 1, 2, 3].map((r) => `M${x},${300 + r * 85} h150 v80 h-150 Z M${x + 75},${340 + r * 85} m-26,0 a26,26 0 1,0 52,0 a26,26 0 1,0 -52,0`).join(' ')
  return (
    <g>
      <D soft width={2} d={floor} dur={1.4} />
      <D soft width={2} d="M0,640 H1600 M0,720 H1600 M0,820 H1600" dur={1.2} delay={0.2} />
      <D width={3} d={stack(70)} delay={0.3} dur={1.4} />
      <D width={3} d={stack(1380)} delay={0.3} dur={1.4} />
      <G delay={0.8}>
        {Array.from({ length: 13 }, (_, i) => {
          const x = 140 + i * 110
          return (
            <g key={i} className="beat" style={{ animationDelay: `${(i % 2) * 0.268}s` }}>
              <path d={`M${x},720 m-28,0 a28,28 0 1,0 56,0 a28,28 0 1,0 -56,0 M${x - 50},830 C${x - 50},765 ${x + 50},765 ${x + 50},830 Z`} style={{ fill: '#1a2aa8', stroke: 'var(--ink)', strokeWidth: 3 }} />
            </g>
          )
        })}
      </G>
    </g>
  )
}

// ---------- the backdrop: background, 3D world, music, transitions ----------

const PIXEL_COLORS = ['#2a40e0', '#3dffc8', '#0b1250', '#d3dcff', '#ff5d8f']

export function AgentsBackdrop({ slide, step }: { slide: number; step: number }) {
  const light = SURFACE[slide] === 'light'
  const blank = slide === 0 && step === 0
  const [muted, setMuted] = useState(false)
  const [wipe, setWipe] = useState(0)
  const glow = useRef<HTMLDivElement>(null)
  const last = useRef({ slide, step })

  // Sound needs a user gesture: the first clicker press unlocks it. M mutes/unmutes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      music.unlock()
      if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.repeat && e.key.toLowerCase() === 'm') music.toggleMute()
    }
    const onPointer = () => music.unlock()
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('pointerdown', onPointer, true)
    const offMute = music.onMute(setMuted)
    const offBeat = music.onBeat(() => {
      const el = glow.current
      if (!el) return
      el.classList.add('kick')
      window.setTimeout(() => el.classList.remove('kick'), 90)
    })
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('pointerdown', onPointer, true)
      offMute()
      offBeat()
      music.stop()
    }
  }, [])

  // The music follows the class: each slide/step has its own mix, and every click has a cue.
  useEffect(() => {
    music.setMix(mixFor(slide, step))
    const was = last.current
    if (slide !== was.slide) {
      setWipe((w) => w + 1)
      music.whoosh()
      if (slide === 12 && slide > was.slide) music.impact()
    } else if (step > was.step) {
      if (slide === 0 && step === 1) music.impact()
      else if (slide === 9 && step % 2 === 1) music.chime()
      else music.blip()
    }
    last.current = { slide, step }
  }, [slide, step])

  const pixels = useMemo(() => Array.from({ length: 144 }, () => ({
    color: Math.random() < 0.45 ? 'transparent' : PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)],
    delay: Math.random() * 0.25,
  })), [wipe])

  const [part, note] = CHROME[slide]
  const tone = light ? 'text-ink/55 border-ink/25' : 'text-snow/55 border-snow/25'
  return (
    <>
      <div className="surface dark"><div ref={glow} className="glow" /></div>
      <div className="surface light" style={{ opacity: light ? 1 : 0 }} />
      <Suspense fallback={null}><World slide={slide} step={step} /></Suspense>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="chrome" style={{ opacity: blank ? 0 : 1 }}>
        <foreignObject x={0} y={0} width={1600} height={900}>
          <div className={`relative h-[900px] w-[1600px] font-mono text-[17px] uppercase tracking-[0.16em] ${tone}`}>
            <div className={`absolute inset-x-[48px] top-[34px] flex justify-between border-b pb-3 ${tone}`}>
              <span><b className="font-bold">Everyday AI Agents</b> · {part}</span>
              <span>{String(slide + 1).padStart(2, '0')} / {SURFACE.length}</span>
            </div>
            <div className="absolute inset-x-[48px] bottom-[30px] flex justify-between">
              <span>{note}</span>
              <span>{muted ? '♪ muted' : `♪ ${BPM} bpm`}</span>
            </div>
          </div>
        </foreignObject>
      </svg>
      {wipe > 0 && (
        <div key={wipe} className="pixels">
          {pixels.map((p, i) => <i key={i} style={{ background: p.color, animationDelay: `${p.delay}s` }} />)}
        </div>
      )}
      <div className="scan" />
    </>
  )
}

// ---------- slides ----------

export const slides: SlideDef[] = [
  // 1 · Blank blue wall, then the title types itself and the music starts
  {
    steps: 1,
    Slide: () => (
      <>
        <OpenBox />
        <Html>
          <Reveal at={1} delay={0.2} className="absolute left-[110px] top-[230px]">
            <Mono className="text-mint">Class · Cumorah Academy</Mono>
          </Reveal>
          <Type at={1} delay={0.5} speed={60} text={'Everyday\nAI *agents*'} className="absolute left-[100px] top-[280px] text-[190px] font-extrabold leading-[0.92] tracking-[-0.04em]" />
          <Reveal at={1} delay={2.2} className="absolute left-[1240px] top-[760px]"><Bot px={11} /></Reveal>
        </Html>
      </>
    ),
  },

  // 2 · A chatbot talks. An agent does.
  {
    steps: 1,
    Slide: () => (
      <Html light>
        <Type text={'A chatbot\n*talks.*'} delay={0.3} hl="text-ink/45" className="absolute left-[110px] top-[140px] text-[120px] font-extrabold leading-[0.95] tracking-[-0.035em]" />
        <Reveal delay={1.3} className="absolute left-[110px] top-[470px] w-[620px]">
          <div className="rounded-2xl border-2 border-ink/20 bg-white/55 p-7">
            <Mono className="mb-5 text-[18px] text-ink/50">Chat · just now</Mono>
            <div className="ml-auto mb-4 w-fit rounded-2xl rounded-br-sm bg-ink px-6 py-3 text-[30px] text-snow">Plan my weekend in Prague.</div>
            <div className="flex items-end gap-4">
              <Bot px={5} />
              <div className="rounded-2xl rounded-bl-sm border-2 border-ink/20 bg-white px-6 py-3 text-[30px]">Here are 5 tips for Prague…</div>
            </div>
          </div>
        </Reveal>
        <Type at={1} delay={0.2} text={'An agent\n*does.*'} hl="text-green" className="absolute left-[860px] top-[140px] text-[120px] font-extrabold leading-[0.95] tracking-[-0.035em]" />
        <Reveal at={1} delay={1.1} className="absolute left-[860px] top-[470px] w-[620px]">
          <div className="rounded-2xl border-2 border-green/60 bg-white/55 p-7">
            <Mono className="mb-4 text-[18px] text-green">Agent · running</Mono>
            {['searched trains', 'compared hostels', 'booked under €150'].map((t, i) => (
              <Reveal key={t} at={1} delay={1.5 + i * 0.45}>
                <div className="font-mono text-[28px] leading-[1.7]"><span className="text-green">✓</span> {t}</div>
              </Reveal>
            ))}
            <Reveal at={1} blur delay={3} className="mt-2 text-[64px] font-extrabold text-green">Done! ✓</Reveal>
          </div>
        </Reveal>
      </Html>
    ),
  },

  // 3 · Agent = DJ, tools = tracks. Each fader up adds a layer to the music.
  {
    steps: 4,
    Slide: () => (
      <>
        <Mixer x={860} y={170} up={useStep()} />
        <Html>
          <Type delay={0.3} text={'Agent = *DJ.*\nTools = *tracks.*'} className="absolute left-[100px] top-[270px] text-[100px] font-extrabold leading-[1.02] tracking-[-0.035em]" />
        </Html>
      </>
    ),
  },

  // 4 · Read the crowd. Adjust the mix.
  {
    steps: 0,
    Slide: () => (
      <>
        <Club />
        <Html>
          <Type delay={0.6} text={'Read the *crowd.*\nAdjust the *mix.*'} className="absolute inset-x-0 top-[150px] text-center text-[118px] font-extrabold leading-[1.02] tracking-[-0.035em]" />
        </Html>
      </>
    ),
  },

  // 5 · Into the 3D world: inside an agent
  {
    steps: 0,
    Slide: () => (
      <Html>
        <Reveal delay={1.1} className="absolute bottom-[200px] left-[110px]"><Mono className="text-mint">Part 2</Mono></Reveal>
        <Type delay={1.3} text="Inside an *agent*" className="absolute bottom-[80px] left-[100px] text-[130px] font-extrabold tracking-[-0.035em]" />
      </Html>
    ),
  },

  // 6 · The loop: Goal → Plan → Act → Check (camera visits each node)
  {
    steps: 4,
    Slide: () => {
      const lines = ['what you want.', 'break it down.', 'use the tools.', 'did it work?']
      return (
        <Html>
          <Type until={1} delay={0.4} text="The agent *loop*" className="absolute bottom-[80px] left-[100px] text-[120px] font-extrabold tracking-[-0.035em]" />
          {LOOP.map((name, i) => (
            <Reveal key={name} at={i + 1} until={i + 2} delay={0.6} className="absolute bottom-[90px] left-[110px]">
              <Panel className="px-12 py-7">
                <Mono className="text-[20px] text-mint">Step 0{i + 1} / 04</Mono>
                <span className="text-[100px] font-extrabold tracking-[-0.03em]">{name}</span>
                <span className="ml-6 text-[56px] font-medium text-snow/75">{lines[i]}</span>
              </Panel>
            </Reveal>
          ))}
        </Html>
      )
    },
  },

  // 7 · Tools are its hands (cards flip in, one per click)
  {
    steps: TOOLS.length,
    Slide: () => (
      <Html>
        <Type delay={0.9} text="Tools are its *hands.*" className="absolute inset-x-0 top-[120px] text-center text-[110px] font-extrabold tracking-[-0.035em]" />
      </Html>
    ),
  },

  // 8 · Memory keeps the context (slabs stack)
  {
    steps: 3,
    Slide: () => (
      <Html>
        <Type delay={0.9} text={'Memory keeps\nthe *context.*'} className="absolute left-[100px] top-[130px] text-[110px] font-extrabold leading-[1] tracking-[-0.035em]" />
        <div className="absolute bottom-[110px] left-[110px] flex flex-col gap-4">
          {['You', 'History', 'Preferences'].map((c, i) => (
            <Reveal key={c} at={i + 1} delay={0.3}>
              <span className="rounded-xl border-2 border-mint/70 bg-[#0d1660]/80 px-7 py-2 font-mono text-[36px] text-mint">+ {c}</span>
            </Reveal>
          ))}
        </div>
      </Html>
    ),
  },

  // 9 · Chatbot vs agent
  {
    steps: 1,
    Slide: () => (
      <Html>
        <Reveal delay={0.9} className="absolute bottom-[130px] left-[150px] w-[580px]">
          <Panel className="px-10 py-7">
            <Mono className="text-[20px] text-snow/60">Chatbot</Mono>
            <div className="text-[58px] font-extrabold leading-tight text-snow/70">answers once.</div>
          </Panel>
        </Reveal>
        <Reveal at={1} className="absolute bottom-[130px] right-[150px] w-[580px]">
          <Panel className="border-mint px-10 py-7">
            <Mono className="text-[20px] text-mint">Agent</Mono>
            <div className="text-[58px] font-extrabold leading-tight">loops <span className="text-mint">until done.</span></div>
          </Panel>
        </Reveal>
      </Html>
    ),
  },

  // 10 · Quiz: chatbot or agent? (each request types into a box, then the answer)
  {
    steps: 5,
    Slide: () => {
      const qs = [
        ['Explain photosynthesis.', 'Chatbot'],
        ['Book my dentist appointment.', 'Agent'],
        ['Fix my code and test it.', 'Agent'],
      ]
      return (
        <Html light>
          <Reveal className="absolute left-[110px] top-[150px]"><Mono className="text-green">Your turn · hands up</Mono></Reveal>
          <Type delay={0.3} text="Chatbot or *agent?*" hl="text-green" className="absolute left-[100px] top-[190px] text-[120px] font-extrabold tracking-[-0.035em]" />
          {qs.map(([q, a], i) => (
            <Reveal key={q} at={i * 2} until={i * 2 + 2} delay={i === 0 ? 1.1 : 0.1} className="absolute inset-x-[110px] top-[420px]">
              <Mono className="mb-3 text-[20px] text-ink/50">Request 0{i + 1} / 03</Mono>
              <div className="rounded-2xl border-[3px] border-ink bg-white/60 px-10 py-7">
                <Type at={i * 2} until={i * 2 + 2} delay={i === 0 ? 1.5 : 0.4} caret text={q} className="font-mono text-[60px] text-ink" />
              </div>
              <Reveal at={i * 2 + 1} blur className="mt-10 flex items-center gap-8">
                <span className={`rounded-xl px-10 py-3 text-[64px] font-extrabold uppercase tracking-[0.06em] ${a === 'Agent' ? 'bg-green text-snow' : 'bg-ink/80 text-snow'}`}>
                  {a === 'Agent' ? 'Agent ✓' : 'Chatbot'}
                </span>
                {a === 'Agent' && <Bot px={9} color="#0e9f6e" />}
              </Reveal>
            </Reveal>
          ))}
        </Html>
      )
    },
  },

  // 11 · Agents in everyday life (the carousel turns per click)
  {
    steps: EVERYDAY.length,
    Slide: () => (
      <Html>
        <Reveal delay={0.8} until={1} className="absolute inset-x-0 top-[120px]">
          <Type delay={0.9} until={1} text="Agents in *everyday life*" className="text-center text-[110px] font-extrabold tracking-[-0.035em]" />
        </Reveal>
      </Html>
    ),
  },

  // 12 · You stay in charge: three rules, typed one per click
  {
    steps: 3,
    Slide: () => {
      const step = useStep()
      const rules = ['Give a clear goal.', 'Check the work.', 'Protect private data.']
      return (
        <Html>
          <Type delay={0.3} text={'You stay\nin *charge.*'} className="absolute left-[100px] top-[220px] text-[130px] font-extrabold leading-[0.98] tracking-[-0.035em]" />
          <Reveal delay={0.9} className="absolute left-[820px] top-[200px] w-[680px]">
            <Mono className="border-b-2 border-snow/30 pb-3 text-[20px] text-snow/60">rules.md · 3 rules</Mono>
          </Reveal>
          {rules.map((r, i) => (
            <div key={r} className="absolute left-[820px] flex items-baseline gap-6" style={{ top: 290 + i * 150, opacity: step > i + 1 ? 0.4 : 1, transition: 'opacity 0.5s' }}>
              <Reveal at={i + 1}><span className="font-mono text-[34px] text-mint">0{i + 1}</span></Reveal>
              <Type at={i + 1} delay={0.15} text={r} className="text-[70px] font-extrabold tracking-[-0.03em]" />
            </div>
          ))}
        </Html>
      )
    },
  },

  // 13 · You are the DJ (the drop)
  {
    steps: 0,
    Slide: () => (
      <>
        <g className="light-ink"><g transform="translate(615,545) scale(0.52)"><Mixer x={0} y={0} up={4} /></g></g>
        <Html light>
          <Type delay={0.4} speed={70} text={'You are\nthe *DJ.*'} hl="text-green" className="absolute inset-x-0 top-[90px] text-center text-[200px] font-extrabold leading-[0.9] tracking-[-0.045em]" />
          <Reveal delay={1.6} className="absolute left-[1040px] top-[760px]"><div className="beat"><Bot px={10} color="#0e9f6e" /></div></Reveal>
        </Html>
      </>
    ),
  },

  // 14 · Questions
  {
    steps: 0,
    Slide: () => (
      <Html>
        <Type delay={0.3} speed={60} text="*Questions?*" className="absolute inset-x-0 top-[200px] text-center text-[190px] font-extrabold tracking-[-0.045em]" />
        <Reveal delay={1.2} className="absolute inset-x-0 top-[560px] flex items-center justify-center gap-8">
          <Bot px={13} />
          <div className="dots rounded-2xl border-2 border-snow/60 bg-[#0d1660]/70 px-8 py-4 text-[56px] leading-none text-snow"><i>•</i><i>•</i><i>•</i></div>
        </Reveal>
      </Html>
    ),
  },
]
