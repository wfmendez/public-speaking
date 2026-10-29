import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/bungee/400.css'
import './agents.css'
import { lazy, Suspense, useContext, type ReactNode } from 'react'
import { StepContext } from '../../components/Draw'
import type { SlideDef } from '../../deck'
import { EVERYDAY, LOOP, TOOLS } from './data'

// Three.js is only downloaded when this class is opened.
const World = lazy(() => import('./World'))
export const AgentsWorld = (props: { slide: number; step: number }) => (
  <Suspense fallback={null}><World {...props} /></Suspense>
)

const useStep = () => useContext(StepContext)

/** HTML overlay (styled with Tailwind) inside the 1600×900 slide, so it scales with everything else. */
const Html = ({ children }: { children: ReactNode }) => (
  <foreignObject x={0} y={0} width={1600} height={900}>
    <div className="relative h-[900px] w-[1600px] font-grotesk text-[#eaf2ff]">{children}</div>
  </foreignObject>
)

/** Fades/slides in at step `at`, out at step `until`. */
function Reveal({ at = 0, until, delay = 0, className = '', children }: {
  at?: number; until?: number; delay?: number; className?: string; children: ReactNode
}) {
  const step = useStep()
  const state = step >= (until ?? Infinity) ? 'out' : step >= at ? 'in' : ''
  return <div className={`reveal ${state} ${className}`} style={{ transitionDelay: state === 'in' ? `${delay}s` : '0s' }}>{children}</div>
}

const Glass = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <div className={`rounded-3xl border border-white/15 bg-white/[0.06] shadow-[0_0_60px_rgba(0,229,255,0.12)] backdrop-blur-md ${className}`}>{children}</div>
)

const Kicker = ({ children }: { children: ReactNode }) => (
  <div className="mb-4 text-[26px] font-semibold uppercase tracking-[0.35em] text-neon">{children}</div>
)

// ---------- DJ booth (SVG + CSS animation, 120 BPM) ----------

function Turntable({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 190} y={cy - 170} width={380} height={340} rx={28} fill="#0e0c1f" stroke="rgba(0,229,255,0.35)" strokeWidth={3} />
      <g className="vinyl">
        <circle cx={cx} cy={cy} r={140} fill="#06050d" stroke="#2a2550" strokeWidth={4} />
        {[120, 100, 80, 62].map((r) => <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(234,242,255,0.10)" strokeWidth={2} />)}
        <circle cx={cx} cy={cy} r={40} fill="var(--pink)" />
        <rect x={cx - 4} y={cy - 40} width={8} height={26} fill="#06050d" />
        <circle cx={cx} cy={cy} r={6} fill="#06050d" />
      </g>
      <path d={`M${cx + 150},${cy - 130} L${cx + 120},${cy + 10} L${cx + 70},${cy + 40}`} fill="none" stroke="#cfd6ff" strokeWidth={8} strokeLinecap="round" />
    </g>
  )
}

function Equalizer({ x, y, w, bars = 24, h = 160 }: { x: number; y: number; w: number; bars?: number; h?: number }) {
  const bw = w / bars
  return (
    <g>
      {Array.from({ length: bars }, (_, i) => (
        <rect
          key={i} className="eq-bar" x={x + i * bw + 3} y={y - h} width={bw - 6} height={h} rx={4}
          fill={i % 3 === 0 ? 'var(--pink)' : i % 3 === 1 ? 'var(--accent)' : 'var(--lime)'}
          style={{ animationDelay: `${(i * 137) % 500 / 1000}s`, animationDuration: `${0.35 + ((i * 53) % 30) / 100}s`, opacity: 0.85 }}
        />
      ))}
    </g>
  )
}

function Beams() {
  return (
    <g opacity={0.55}>
      <defs>
        <linearGradient id="beam-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#00e5ff" stopOpacity="0.55" /><stop offset="1" stopColor="#00e5ff" stopOpacity="0" /></linearGradient>
        <linearGradient id="beam-p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff2bd6" stopOpacity="0.55" /><stop offset="1" stopColor="#ff2bd6" stopOpacity="0" /></linearGradient>
      </defs>
      {[200, 560, 1040, 1400].map((x, i) => (
        <polygon key={x} className="beam" points={`${x},-20 ${x - 140},900 ${x + 140},900`} fill={`url(#beam-${i % 2 ? 'p' : 'c'})`} style={{ animationDelay: `${-i * 1.3}s` }} />
      ))}
    </g>
  )
}

/** The whole booth: light beams, two decks and an equalizer. */
const Booth = ({ dim = false }: { dim?: boolean }) => (
  <g opacity={dim ? 0.35 : 1}>
    <Beams />
    <Equalizer x={420} y={880} w={760} bars={28} h={190} />
    <Turntable cx={250} cy={700} />
    <Turntable cx={1350} cy={700} />
  </g>
)

/** Big neon title with a chromatic-aberration glitch. */
const NeonTitle = ({ children, size = 150 }: { children: ReactNode; size?: number }) => (
  <div className="glitch relative text-center font-dj leading-[0.95]" style={{ fontSize: size }}>
    <span className="absolute inset-0 translate-x-[-4px] text-pink opacity-80 mix-blend-screen">{children}</span>
    <span className="absolute inset-0 translate-x-[4px] text-neon opacity-80 mix-blend-screen">{children}</span>
    <span className="relative text-white [text-shadow:0_0_24px_rgba(0,229,255,0.8)]">{children}</span>
  </div>
)

// ---------- slides ----------

export const slides: SlideDef[] = [
  // 1 · Dark room, then the booth lights up with the title
  {
    steps: 1,
    Slide: () => {
      const on = useStep() >= 1
      return (
        <>
          <g style={{ opacity: on ? 1 : 0, transition: 'opacity 1.2s ease' }}><Booth /></g>
          <Html>
            <Reveal at={1} delay={0.4} className="absolute inset-x-0 top-[170px]">
              <Kicker><span className="block text-center">Class · Cumorah Academy</span></Kicker>
              <NeonTitle>EVERYDAY<br />AI AGENTS</NeonTitle>
            </Reveal>
          </Html>
        </>
      )
    },
  },

  // 2 · Chatbot talks. Agent does.
  {
    steps: 1,
    Slide: () => (
      <>
        <Booth dim />
        <Html>
          <div className="absolute inset-0 grid grid-cols-2 gap-12 px-[120px] pt-[180px]">
            <Reveal>
              <Glass className="h-[460px] p-12">
                <div className="text-[120px] leading-none">💬</div>
                <div className="mt-10 text-[84px] font-bold">Chatbot <span className="text-white/50">talks.</span></div>
              </Glass>
            </Reveal>
            <Reveal at={1}>
              <Glass className="h-[460px] border-pink/60 p-12 shadow-[0_0_80px_rgba(255,43,214,0.35)]">
                <div className="flex gap-6 text-[84px] leading-none">
                  {['🔍', '📅', '✉️'].map((i, n) => (
                    <Reveal key={i} at={1} delay={0.4 + n * 0.35}><span>{i}<span className="ml-1 align-top text-[40px] text-lime">✓</span></span></Reveal>
                  ))}
                </div>
                <div className="mt-12 text-[84px] font-bold">Agent <span className="text-pink [text-shadow:0_0_24px_#ff2bd6]">does.</span></div>
              </Glass>
            </Reveal>
          </div>
        </Html>
      </>
    ),
  },

  // 3 · The agent is the DJ; the tools are its tracks (one fader up per click)
  {
    steps: 4,
    Slide: () => {
      const step = useStep()
      const channels = ['Search', 'Calendar', 'Email', 'Code']
      return (
        <>
          <Beams />
          <Html>
            <Reveal className="absolute inset-x-0 top-[90px] text-center text-[92px] font-bold">
              Agent = <span className="text-neon [text-shadow:0_0_24px_#00e5ff]">DJ</span>. Tools = <span className="text-pink [text-shadow:0_0_24px_#ff2bd6]">tracks</span>.
            </Reveal>
            <Reveal delay={0.3} className="absolute left-[330px] top-[300px]">
              <Glass className="flex h-[520px] w-[940px] items-end justify-around px-10 pb-10">
                {channels.map((c, i) => {
                  const up = step > i
                  return (
                    <div key={c} className="flex h-full flex-col items-center justify-end gap-5">
                      <div className={`h-6 w-6 rounded-full transition-all duration-500 ${up ? 'bg-lime shadow-[0_0_24px_#b6ff3b]' : 'bg-white/15'}`} />
                      <div className="relative h-[300px] w-3 rounded-full bg-white/15">
                        <div
                          className="absolute left-1/2 h-12 w-24 -translate-x-1/2 rounded-xl border border-white/30 bg-gradient-to-b from-white/90 to-white/50 transition-all duration-700"
                          style={{ bottom: up ? 250 : 0, boxShadow: up ? '0 0 30px rgba(0,229,255,0.7)' : 'none' }}
                        />
                      </div>
                      <div className={`text-[34px] font-semibold transition-colors duration-500 ${up ? 'text-white' : 'text-white/40'}`}>{c}</div>
                    </div>
                  )
                })}
              </Glass>
            </Reveal>
          </Html>
        </>
      )
    },
  },

  // 4 · Read the crowd, adjust the mix (the feedback loop)
  {
    steps: 0,
    Slide: () => (
      <>
        <Beams />
        <g>
          {Array.from({ length: 13 }, (_, i) => (
            <g key={i} className="bounce" style={{ animationDelay: `${(i % 4) * 0.12}s` }}>
              <circle cx={130 + i * 112} cy={760} r={34} fill="#1b1838" stroke="rgba(0,229,255,0.4)" strokeWidth={3} />
              <rect x={90 + i * 112} y={800} width={80} height={120} rx={36} fill="#1b1838" stroke="rgba(0,229,255,0.4)" strokeWidth={3} />
            </g>
          ))}
        </g>
        <path d="M560,560 C420,480 420,330 640,300" fill="none" stroke="var(--accent)" strokeWidth={6} strokeLinecap="round" className="pulse" style={{ filter: 'drop-shadow(0 0 10px #00e5ff)' }} />
        <path d="M960,300 C1180,330 1180,480 1040,560" fill="none" stroke="var(--pink)" strokeWidth={6} strokeLinecap="round" className="pulse" style={{ filter: 'drop-shadow(0 0 10px #ff2bd6)' }} />
        <Html>
          <Reveal className="absolute inset-x-0 top-[200px] text-center">
            <div className="text-[104px] font-bold leading-tight">Read the crowd.</div>
            <div className="text-[104px] font-bold leading-tight text-lime [text-shadow:0_0_24px_#b6ff3b]">Adjust the mix.</div>
          </Reveal>
        </Html>
      </>
    ),
  },

  // 5 · Into the 3D world: inside an agent
  {
    steps: 0,
    Slide: () => (
      <Html>
        <Reveal delay={1.2} className="absolute bottom-[90px] left-[110px]">
          <Kicker>Part 2</Kicker>
          <div className="text-[110px] font-bold leading-none">Inside an agent</div>
        </Reveal>
      </Html>
    ),
  },

  // 6 · The loop: Goal → Plan → Act → Check (camera visits each node)
  {
    steps: 4,
    Slide: () => {
      const lines = ['what you want.', 'break it down.', 'use the tools.', 'did it work?']
      const colors = ['text-neon', 'text-lime', 'text-pink', 'text-[#ffd23f]']
      return (
        <Html>
          <Reveal until={1} className="absolute bottom-[90px] left-[110px] text-[100px] font-bold">The agent loop</Reveal>
          {LOOP.map((name, i) => (
            <Reveal key={name} at={i + 1} until={i + 2} delay={0.6} className="absolute bottom-[90px] left-[110px]">
              <Glass className="px-12 py-8">
                <span className={`text-[96px] font-bold ${colors[i]}`}>{name}</span>
                <span className="ml-6 text-[64px] text-white/80">— {lines[i]}</span>
              </Glass>
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
        <Reveal delay={0.8} className="absolute inset-x-0 top-[70px] text-center text-[96px] font-bold">
          Tools are its <span className="text-neon [text-shadow:0_0_24px_#00e5ff]">hands.</span>
        </Reveal>
      </Html>
    ),
  },

  // 8 · Memory keeps the context (slabs stack)
  {
    steps: 3,
    Slide: () => (
      <Html>
        <Reveal delay={0.8} className="absolute left-[110px] top-[90px] text-[96px] font-bold leading-tight">
          Memory keeps<br /><span className="text-neon [text-shadow:0_0_24px_#00e5ff]">the context.</span>
        </Reveal>
        <div className="absolute bottom-[110px] left-[110px] flex flex-col gap-4">
          {['You', 'History', 'Preferences'].map((c, i) => (
            <Reveal key={c} at={i + 1} delay={0.3}>
              <span className="rounded-full border border-neon/60 bg-neon/10 px-8 py-3 text-[44px] font-semibold">{c}</span>
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
        <Reveal delay={0.8} className="absolute bottom-[150px] left-[170px] w-[560px] text-center">
          <Glass className="px-8 py-6 text-[54px] font-bold leading-tight">Chatbot:<br /><span className="text-white/60">answers once.</span></Glass>
        </Reveal>
        <Reveal at={1} className="absolute bottom-[150px] right-[170px] w-[560px] text-center">
          <Glass className="border-pink/60 px-8 py-6 text-[54px] font-bold leading-tight">Agent:<br /><span className="text-pink">loops until done.</span></Glass>
        </Reveal>
      </Html>
    ),
  },

  // 10 · Quiz: chatbot or agent? (show, then reveal ×3)
  {
    steps: 5,
    Slide: () => {
      const qs = [
        ['“Explain photosynthesis.”', 'Chatbot'],
        ['“Book my dentist appointment.”', 'Agent'],
        ['“Fix my code and test it.”', 'Agent'],
      ]
      return (
        <Html>
          <Reveal delay={0.6} className="absolute inset-x-0 top-[80px] text-center">
            <Kicker>Your turn</Kicker>
            <div className="text-[96px] font-bold">Chatbot or agent?</div>
          </Reveal>
          {qs.map(([q, a], i) => (
            <Reveal key={q} at={i * 2} until={i * 2 + 2} delay={i === 0 ? 1 : 0.2} className="absolute inset-x-0 top-[430px] flex flex-col items-center gap-10">
              <Glass className="px-14 py-8 text-[76px] font-semibold">{q}</Glass>
              <Reveal at={i * 2 + 1}>
                <span className={`rounded-full px-12 py-4 text-[60px] font-bold uppercase tracking-widest ${a === 'Agent' ? 'bg-pink text-night shadow-[0_0_50px_#ff2bd6]' : 'bg-white/80 text-night'}`}>{a}</span>
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
        <Reveal delay={0.8} until={1} className="absolute inset-x-0 top-[80px] text-center text-[96px] font-bold">
          Agents in <span className="text-lime [text-shadow:0_0_24px_#b6ff3b]">everyday life</span>
        </Reveal>
      </Html>
    ),
  },

  // 12 · You stay in charge (top view of the whole world)
  {
    steps: 3,
    Slide: () => {
      const lines: [string, string][] = [
        ['You stay', 'in charge.'],
        ['Give a', 'clear goal.'],
        ['Check', 'the work.'],
        ['Protect', 'private data.'],
      ]
      return (
        <Html>
          {lines.map(([a, b], i) => (
            <Reveal key={a} at={i} until={i + 1} delay={i === 0 ? 1.4 : 0.3} className="absolute inset-0 flex items-center justify-center">
              <Glass className="px-16 py-10 text-center">
                <div className="text-[110px] font-bold leading-none">{a}</div>
                <div className="text-[110px] font-bold leading-none text-neon [text-shadow:0_0_24px_#00e5ff]">{b}</div>
              </Glass>
            </Reveal>
          ))}
        </Html>
      )
    },
  },

  // 13 · Back to the booth: you are the DJ
  {
    steps: 0,
    Slide: () => (
      <>
        <Booth />
        <Html>
          <Reveal delay={0.5} className="absolute inset-x-0 top-[220px]">
            <NeonTitle size={170}>YOU ARE<br />THE DJ.</NeonTitle>
          </Reveal>
        </Html>
      </>
    ),
  },

  // 14 · Questions
  {
    steps: 0,
    Slide: () => (
      <>
        <Booth dim />
        <Html>
          <Reveal delay={0.3} className="absolute inset-x-0 top-[300px]">
            <NeonTitle size={160}>Questions?</NeonTitle>
          </Reveal>
        </Html>
      </>
    ),
  },
]
