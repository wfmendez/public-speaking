import '@fontsource/inter-tight/500.css'
import '@fontsource/inter-tight/700.css'
import '@fontsource/inter-tight/800.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import './agents.css'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { D, G } from '../../components/Draw'
import type { SlideDef } from '../../deck'
import { BPM, music } from './music'
import { CHROME, LOOP, mixFor, SURFACE, TOOLS, EVERYDAY } from './data'
import { Bot, Html, Mono, Panel, Reveal, Type, useStep } from './ui'
import OpeningVideo from './Video'

// When the video ends by itself, move to its last step (the title) as if the clicker was pressed.
const toTitle = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }))

// Three.js is only downloaded when this class is opened.
const World = lazy(() => import('./World'))


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
    const mix = mixFor(slide, step)
    if (mix) music.setMix(mix)
    const was = last.current
    if (slide !== was.slide) {
      setWipe((w) => w + 1)
      music.whoosh()
      if (slide === 11 && slide > was.slide) music.impact()
    } else if (step > was.step) {
      if (slide === 0) { if (step === 2) music.whoosh() } // the video plays its own cues
      else if (slide === 8 && step % 2 === 1) music.chime()
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
  // 1 · Blank blue wall → (click) the ≈3 min opening video plays on its own → the title
  {
    steps: 2,
    Slide: () => <OpeningVideo step={useStep()} onEnd={toTitle} />,
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

  // 4 · Into the 3D world: inside an agent
  {
    steps: 0,
    Slide: () => (
      <Html>
        <Reveal delay={1.1} className="absolute bottom-[200px] left-[110px]"><Mono className="text-mint">Part 2</Mono></Reveal>
        <Type delay={1.3} text="Inside an *agent*" className="absolute bottom-[80px] left-[100px] text-[130px] font-extrabold tracking-[-0.035em]" />
      </Html>
    ),
  },

  // 5 · The loop: Goal → Plan → Act → Check (camera visits each node)
  {
    steps: 4,
    Slide: () => {
      const lines = ['a party game.', 'rules, screens, scores.', 'writes the code.', 'runs the tests.']
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

  // 6 · Tools are its hands (cards flip in, one per click)
  {
    steps: TOOLS.length,
    Slide: () => (
      <Html>
        <Type delay={0.9} text="Tools are its *hands.*" className="absolute inset-x-0 top-[120px] text-center text-[110px] font-extrabold tracking-[-0.035em]" />
      </Html>
    ),
  },

  // 7 · Memory keeps the context (slabs stack)
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

  // 8 · The twist: the agent says "Done ✓"… but was it right?
  {
    steps: 2,
    Slide: () => {
      const step = useStep()
      return (
        <Html>
          <Reveal until={2} className="absolute inset-x-0 top-[170px] text-center"><Mono className="text-mint">BOT-001 · tests: 12 / 12 passing</Mono></Reveal>
          <div
            className={`absolute inset-x-0 top-[230px] text-center text-[230px] font-extrabold leading-none tracking-[-0.04em] text-mint [text-shadow:0_0_50px_rgba(61,255,200,0.6)] ${step === 1 ? 'glitchy' : ''}`}
            style={{ opacity: step >= 2 ? 0 : 1, transition: 'opacity 0.5s' }}
          >
            Done ✓
          </div>
          <Type at={1} until={2} delay={0.5} hl="text-bot [text-shadow:0_0_28px_rgba(255,93,143,0.55)]" text="…but was it *right?*" className="absolute inset-x-0 top-[520px] text-center text-[110px] font-extrabold tracking-[-0.035em]" />
          <Reveal at={1} until={2} delay={1.6} className="absolute inset-x-0 top-[690px] text-center"><Mono className="text-bot">20 players joined → the game froze</Mono></Reveal>
          <Type at={2} delay={0.2} text={'*You* test.\n*You* decide.'} className="absolute inset-x-0 top-[160px] text-center text-[150px] font-extrabold leading-[0.95] tracking-[-0.04em]" />
        </Html>
      )
    },
  },

  // 9 · Quiz: chatbot or agent? (each request types into a box, then the answer)
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

  // 10 · Agents in everyday life (the carousel turns per click)
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

  // 11 · You stay in charge: three rules, typed one per click
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

  // 12 · You are the DJ (the drop)
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

  // 13 · Questions
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
