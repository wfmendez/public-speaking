import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { BPM, music, SILENT, type Mix } from './music'
import { SONG, preloadSong, singLine, type SungLine } from './song'
import { Bot, Html, Mono, OpenBox, Typed } from './ui'
import { hush, LINES, preloadVoice, shout } from './voice'

/**
 * The opening video (≈3 min): a sung music video about what agents do. It plays on its own,
 * following the beat of the generated soundtrack; the song is sung line by line (song.json) and
 * the lyrics light up word by word as they are sung. The story is in STORY-agents-video.md.
 */

const BEAT = 60 / BPM
export const SONG_BEATS = 336 // 84 bars

// where each part of the song starts (in beats)
const PARTS = [0, 32, 96, 128, 192, 256, 288, 312]
const PART_NAMES = ['intro', 'verse 1 · monday', 'pre-chorus · the chatbot', 'chorus · the agent', 'verse 2 · watch it work', 'chorus 2 · done', 'bridge', 'final · you']
const ROOMS = ['#monday', '#monday', 'chat · just now', '#agent', 'trip_prague.md', '#done', '…', '#you']

// a bright dance-pop band under the voice: octave bass, offbeat piano, shaker (no synth lead: the voice sings the melody)
const BAND: Mix['layers'] = { kick: 1, hat: 0.8, clap: 0.9, bounce: 1, piano: 1, shaker: 1 }
const FULL: Mix['layers'] = { ...BAND, pluck: 1, pad: 0.3 }
type Cue = { at: number; mix?: Mix; cut?: boolean; fx?: 'impact' | 'riser' | 'whoosh' }
const CUES: Cue[] = [
  { at: 0, mix: { layers: { piano: 1, shaker: 0.8 }, level: 0.36, cutoff: 2400 }, cut: true },
  { at: 16, mix: { layers: { piano: 1, shaker: 1, kick: 0.8, bounce: 0.7 }, level: 0.4, cutoff: 4500 } },
  { at: 32, mix: { layers: BAND, level: 0.44, cutoff: 9000 }, fx: 'whoosh' },
  { at: 64, mix: { layers: { ...BAND, pluck: 0.6 }, level: 0.46, cutoff: 12000 } },
  { at: 96, mix: { layers: { piano: 1, shaker: 0.8, kick: 0.7, pluck: 0.5 }, level: 0.4, cutoff: 1400, half: true }, fx: 'whoosh' },
  { at: 128, mix: { layers: FULL, level: 0.52, cutoff: 18000 }, cut: true, fx: 'impact' },
  { at: 192, mix: { layers: BAND, level: 0.45, cutoff: 10000 }, fx: 'whoosh' },
  { at: 256, mix: { layers: FULL, level: 0.54, cutoff: 18000 }, cut: true, fx: 'impact' },
  { at: 288, mix: SILENT, cut: true },
  { at: 312, mix: { layers: FULL, level: 0.54, cutoff: 18000 }, cut: true, fx: 'impact' },
  { at: 328, mix: { layers: { piano: 0.8, shaker: 0.6, pluck: 0.4 }, level: 0.25, cutoff: 3000 } },
]

/** Effects placed exactly on the audio clock (scheduled a beat ahead): a build (riser + snare roll) and a crash on each drop. */
type Fx = { at: number; fx: 'build' | 'drop' }
const FX: Fx[] = [
  { at: 120, fx: 'build' }, { at: 128, fx: 'drop' },
  { at: 248, fx: 'build' }, { at: 256, fx: 'drop' },
  { at: 312, fx: 'drop' },
]

/**
 * The song position in beats (eighth-beat steps), on the audio clock when there is sound.
 * For rehearsal, `?from=128` in the address starts the video at that beat.
 */
function useSongBeat(running: boolean) {
  const [beat, setBeat] = useState(0)
  useEffect(() => {
    if (!running) return
    const from = Number(new URLSearchParams(location.search).get('from')) || 0
    music.startSong(from)
    const t0 = performance.now() - from * BEAT * 1000
    let raf = 0
    let last = -1
    const tick = () => {
      const audio = music.songBeat()
      const b = Math.max(0, audio === null ? (performance.now() - t0) / 1000 / BEAT : audio)
      const q = Math.min(Math.floor(b * 8) / 8, SONG_BEATS)
      if (q !== last) { last = q; setBeat(q) }
      if (q < SONG_BEATS) raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [running])
  return beat
}

// ---------- the sung lyrics ----------

/** Where the lyrics are written, from a beat on (null = the picture already says it). `hot` lights the sung word pink. */
type Slot = { x: number; y: number; w: number; size: number; center?: boolean; hot?: boolean } | null
const SLOTS: [number, Slot][] = [
  [0, { x: 100, y: 260, w: 880, size: 110 }],
  [32, { x: 100, y: 280, w: 840, size: 96 }],
  [80, { x: 100, y: 250, w: 860, size: 128, hot: true }],
  [96, { x: 100, y: 300, w: 660, size: 104 }],
  [116, { x: 100, y: 150, w: 960, size: 108, hot: true }],
  [128, { x: 100, y: 190, w: 1400, size: 150, center: true }],
  [136, null], // the verbs slam in on their own
  [160, { x: 100, y: 180, w: 600, size: 96 }],
  [192, { x: 100, y: 330, w: 660, size: 80 }],
  [240, { x: 100, y: 180, w: 700, size: 96 }],
  [256, { x: 100, y: 640, w: 1400, size: 90 }],
  [288, null], // "Done ✓" glitches by itself
  [294, { x: 100, y: 330, w: 1400, size: 150, center: true, hot: true }],
  [312, { x: 100, y: 250, w: 1400, size: 300, center: true }],
  [316, { x: 100, y: 230, w: 1300, size: 170 }],
  [324, null], // the title types itself
]
const slotAt = (b: number) => SLOTS.filter(([at]) => at <= b).pop()?.[1] ?? null

/** The line being sung: from its first word until the next line (or a few beats after its last note). */
function lineAt(b: number): SungLine | null {
  const i = SONG.findIndex((l, k) => l.at <= b && (k === SONG.length - 1 || SONG[k + 1].at > b))
  return i >= 0 && b < SONG[i].end + 3 ? SONG[i] : null
}

/** Karaoke: each word appears as it is sung and the word being sung lights up. */
function Karaoke({ line, b, slot }: { line: SungLine; b: number; slot: NonNullable<Slot> }) {
  const now = line.words.filter((w) => w.at <= b).length - 1
  return (
    <div
      className={`karaoke absolute font-extrabold leading-[1.02] tracking-[-0.04em] ${slot.hot ? 'hot' : ''}`}
      style={{ left: slot.x, top: slot.y, width: slot.w, fontSize: slot.size, textAlign: slot.center ? 'center' : 'left' }}
    >
      {line.words.map((w, i) => (
        <Fragment key={i}>
          <span className={`w ${i === now ? 'now' : ''}`} style={{ visibility: i <= now ? 'visible' : 'hidden' }}>{w.text}</span>
          {i < line.words.length - 1 && ' '}
        </Fragment>
      ))}
    </div>
  )
}

// ---------- pieces ----------

const H = 'font-extrabold leading-[0.95] tracking-[-0.04em]'

/** A dark app panel (the "real life" things the agent deals with). */
const Card = ({ label, children, className = '', style }: { label: string; children: ReactNode; className?: string; style?: CSSProperties }) => (
  <div className={`absolute w-[400px] rounded-2xl border border-snow/15 bg-[#12161d] p-6 text-snow shadow-[0_30px_90px_rgba(0,0,0,0.55)] ${className}`} style={style}>
    <Mono className="mb-3 border-b border-snow/10 pb-2 text-[17px] text-snow/50">{label}</Mono>
    {children}
  </div>
)

const CHAOS_AT = [32, 40, 48, 56, 64, 72]
const PILE: [number, number, number][] = [[1020, 140, -4], [1090, 240, 5], [990, 320, -6], [1070, 410, 3], [1000, 500, -3], [1090, 580, 6]]

function ChaosCard({ i, b }: { i: number; b: number }) {
  const [x, y, r] = PILE[i]
  const style = { left: x, top: y, '--r': `${r}deg` } as CSSProperties
  const mono = 'font-mono text-[26px] leading-[1.5]'
  switch (i) {
    case 0: return (
      <Card label="Inbox" className="drop" style={style}>
        <div className="flex items-baseline gap-4"><span className="text-[84px] font-extrabold leading-none">{Math.min(47, Math.floor((b - 32) * 8))}</span><span className={mono}>unread</span></div>
      </Card>
    )
    case 1: return (
      <Card label="Trip · Prague" className="drop" style={style}>
        <svg width="350" height="70"><path d="M15,50 C110,-10 240,90 335,20" fill="none" stroke="#f3f6ff" strokeWidth="4" strokeDasharray="10 10" /><circle cx="15" cy="50" r="9" fill="#f3f6ff" /><circle cx="335" cy="20" r="9" fill="#ff5d8f" /></svg>
        <div className={mono}>SAT → SUN · €??</div>
      </Card>
    )
    case 2: return (
      <Card label="Homework" className="drop" style={style}>
        <div className="flex gap-2">
          {['MON', 'TUE', 'WED', 'THU', 'FRI'].map((d) => (
            <div key={d} className={`flex-1 rounded-lg border-2 py-2 text-center font-mono text-[18px] ${d === 'FRI' ? 'border-bot bg-bot text-snow' : 'border-snow/20'}`}>{d}</div>
          ))}
        </div>
        <div className={`${mono} mt-2 text-bot`}>due friday!</div>
      </Card>
    )
    case 3: return (
      <Card label="game.js" className="drop" style={style}>
        <div className={`${mono} text-[22px]`}>function party() {'{'}<br />&nbsp;&nbsp;<span className="text-snow/45">// TODO: everything</span><br />{'}'}</div>
      </Card>
    )
    case 4: return (
      <Card label="Chats" className="drop" style={style}>
        {[['Class 4B', 31], ['Family', 12], ['Team', 8]].map(([n, c]) => (
          <div key={n} className={`${mono} flex justify-between`}><span>{n}</span><span className="rounded-full bg-bot px-3 text-[20px] text-snow">{c}</span></div>
        ))}
      </Card>
    )
    default: return (
      <Card label="Dentist" className="drop" style={style}>
        <div className="text-[64px] font-extrabold leading-none">??:??</div>
        <div className={mono}>call before 5 PM</div>
      </Card>
    )
  }
}

function Clock({ ring }: { ring: boolean }) {
  return (
    <svg width="420" height="420" viewBox="0 0 420 420" className={`pop absolute left-[1020px] top-[200px] ${ring ? 'shake' : ''}`}>
      <g fill="none" stroke="#f3f6ff" strokeLinecap="round">
        <circle cx="210" cy="220" r="160" strokeWidth="6" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2
          return <line key={i} x1={210 + Math.sin(a) * 135} y1={220 - Math.cos(a) * 135} x2={210 + Math.sin(a) * 150} y2={220 - Math.cos(a) * 150} strokeWidth="5" />
        })}
        <line x1="210" y1="220" x2={210 + Math.sin((240 * Math.PI) / 180) * 80} y2={220 - Math.cos((240 * Math.PI) / 180) * 80} strokeWidth="10" />
        <line x1="210" y1="220" x2="210" y2="95" strokeWidth="6" />
        <path d="M95,75 l-40,-30 M325,75 l40,-30" strokeWidth="8" />
        {ring && <path d="M60,130 a170,170 0 0,1 40,-60 M360,130 a170,170 0 0,0 -40,-60" stroke="#3dffc8" strokeWidth="5" />}
      </g>
    </svg>
  )
}

const StickFigure = () => (
  <svg width="160" height="260" viewBox="0 0 160 260" className="pop absolute left-[560px] top-[560px]">
    <g fill="none" stroke="#f3f6ff" strokeWidth="6" strokeLinecap="round">
      <circle cx="80" cy="40" r="30" />
      <path d="M80,70 V170 M80,100 L35,150 M80,100 L125,150 M80,170 L45,250 M80,170 L115,250" />
    </g>
  </svg>
)

const VERBS = ['searches', 'plans', 'books', 'writes', 'tests', 'checks']
const LOOP_POS: [string, number, number][] = [['Goal', 1050, 250], ['Plan', 1320, 520], ['Act', 1050, 790], ['Check', 780, 520]]

function LoopDiagram({ b }: { b: number }) {
  const active = Math.floor(b / 2) % 4
  const a = ((b % 8) / 8) * Math.PI * 2 - Math.PI / 2
  return (
    <>
      <svg width="1600" height="900" className="pop absolute left-0 top-0">
        <circle cx="1050" cy="520" r="250" fill="none" stroke="rgba(243,246,255,0.5)" strokeWidth="3" />
        <circle cx="1050" cy="520" r="232" fill="none" stroke="rgba(243,246,255,0.15)" strokeWidth="2" />
        <circle cx={1050 + Math.cos(a) * 250} cy={520 + Math.sin(a) * 250} r="16" fill="#3dffc8" />
      </svg>
      {LOOP_POS.map(([name, x, y], i) => (
        <div key={name} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 px-6 py-1 text-[62px] font-extrabold transition-all duration-150"
          style={{ left: x, top: y, background: i === active ? '#3dffc8' : '#12161d', color: i === active ? '#0b0d11' : '#f3f6ff', borderColor: i === active ? '#3dffc8' : 'rgba(243,246,255,0.35)', transform: `translate(-50%,-50%) scale(${i === active ? 1.12 : 1})` }}>
          {name}
        </div>
      ))}
      <div className="hop absolute left-[1000px] top-[480px]"><Bot px={11} /></div>
    </>
  )
}

const PLAN = ['find trains', 'compare hostels', 'check the weather']
const TOOLS = ['Search', 'Calendar', 'Email']
const MEMORY = ['vegetarian', 'trains > buses', 'no 6 AM alarms']

function Console({ b }: { b: number }) {
  const total = Math.min(142, Math.max(0, Math.floor((b - 228) * 24)))
  return (
    <div className="absolute left-[820px] top-[150px] w-[680px] rounded-2xl border border-snow/15 bg-[#12161d] p-8 text-snow shadow-[0_30px_90px_rgba(0,0,0,0.55)] transition-opacity duration-500" style={{ opacity: b >= 240 ? 0 : 1 }}>
      <Mono className="mb-4 border-b border-snow/10 pb-2 text-[18px] text-mint">Agent · trip_prague.md</Mono>
      <div className="font-mono text-[18px] text-snow/45">GOAL</div>
      <Typed text="weekend in Prague, under €150" speed={30} className="mb-4 font-mono text-[30px]" />
      {b >= 200 && <div className="font-mono text-[18px] text-snow/45">PLAN</div>}
      {PLAN.map((p, i) => b >= 200 + i * 4 && (
        <div key={p} className="pop font-mono text-[30px] leading-[1.5]">
          <span className={b >= 216 + i * 4 ? 'text-mint' : 'text-snow/30'}>{b >= 216 + i * 4 ? '[✓]' : '[ ]'}</span> {p}
        </div>
      ))}
      <div className="mt-4 flex gap-3">
        {TOOLS.map((t, i) => b >= 212 + i * 4 && <span key={t} className="pop rounded-lg border border-mint/40 bg-mint/10 px-4 py-1 font-mono text-[22px] uppercase tracking-[0.12em] text-mint">{t}</span>)}
      </div>
      {b >= 228 && (
        <div className="pop mt-5 flex items-baseline justify-between border-t border-snow/10 pt-3">
          <span className="font-mono text-[26px] text-snow/50">TOTAL</span>
          <span className={`text-[72px] font-extrabold ${total === 142 ? 'text-mint' : ''}`}>€{total}{total === 142 && ' ✓'}</span>
        </div>
      )}
    </div>
  )
}

function DoneCard({ i, b }: { i: number; b: number }) {
  const style = { left: 110, top: 220, '--r': `${i % 2 ? 3 : -3}deg` } as CSSProperties
  const mono = 'font-mono text-[30px] leading-[1.6]'
  switch (i) {
    case 0: return <Card key={i} label="Inbox" className="drop w-[540px]" style={style}><div className="text-[110px] font-extrabold leading-none">{Math.max(0, 47 - Math.floor((b - 256) * 12))}</div><div className={mono}>unread · replies drafted</div></Card>
    case 1: return <Card key={i} label="Calendar" className="drop w-[540px]" style={style}>{['MON  gym', 'TUE  study', 'FRI  homework ✓'].map((r) => <div key={r} className={mono}>{r}</div>)}</Card>
    case 2: return <Card key={i} label="Homework" className="drop w-[540px]" style={style}><div className={mono}>5 sources</div><div className={mono}>summary ready ✓</div></Card>
    default: return <Card key={i} label="game.js" className="drop w-[540px]" style={style}><div className={mono}>tests: 12 / 12</div><div className={`${mono} text-mint`}>passing ✓</div></Card>
  }
}

/** Soft out-of-focus lights drifting behind everything. */
function Bokeh() {
  const lights = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    left: (i * 397) % 1600, top: (i * 251 + 60) % 900, size: 14 + ((i * 37) % 46),
    background: ['rgba(61,255,200,0.16)', 'rgba(255,93,143,0.13)', 'rgba(243,246,255,0.1)'][i % 3],
    '--d': `${9 + (i % 5) * 3}s`, '--x': `${((i * 53) % 90) - 45}px`, '--y': `${((i * 71) % 70) - 35}px`,
  }) as CSSProperties), [])
  return <div className="bokeh pointer-events-none absolute inset-0">{lights.map((s, i) => <i key={i} style={s} />)}</div>
}

/** Slices of colour sweep across on every new part of the song. */
const Slices = () => (
  <div className="slices">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ background: ['#3dffc8', '#0b0d11', '#f3f6ff'][(i * 2) % 3], animationDelay: `${((i * 5) % 9) * 0.022}s` }} />)}</div>
)

/** The bars along the top and bottom, like the screen of an app: what part we're in and how the day is going. */
function Hud({ b, part }: { b: number; part: number }) {
  // the trip is done at 234, then one task per hit of chorus 2; the dentist is still yours to call
  const done = (b >= 234 ? 1 : 0) + (b < 256 ? 0 : Math.min(4, Math.floor((b - 256) / 8) + 1))
  const open = CHAOS_AT.filter((a) => a <= b).length - done
  const you = b >= 312
  return (
    <div className="pointer-events-none absolute inset-0 font-mono text-[16px] uppercase tracking-[0.16em] text-snow/50">
      <div className="absolute inset-x-[48px] top-[30px] flex justify-between border-b border-snow/15 pb-3">
        <span><b className="font-bold text-snow">Everyday AI Agents</b> · {PART_NAMES[part]}</span>
        <span>tasks open: {open} · done by agent: <span className="text-mint">{done}</span> · decided by: <span className={you ? 'text-mint' : ''}>{you ? 'you' : '?'}</span></span>
      </div>
      <div className="absolute inset-x-[48px] bottom-[28px] flex justify-between">
        <span>{ROOMS[part]}</span>
        <span>♪ {BPM} bpm · BOT-001 online</span>
      </div>
    </div>
  )
}

/** Everything in front pumps on each kick drum and slowly drifts, like a camera on a dance floor. */
function Pulse({ children }: { children: ReactNode }) {
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => music.onBeat(() => {
    const d = el.current
    if (!d) return
    d.classList.add('kick')
    window.setTimeout(() => d.classList.remove('kick'), 110)
  }), [])
  return <div className="drift absolute inset-0"><div ref={el} className="vpulse absolute inset-0">{children}</div></div>
}

// ---------- the timeline ----------

function Frame({ b }: { b: number }) {
  const in_ = (a: number, z: number) => b >= a && b < z
  const part = PARTS.filter((p) => p <= b).length - 1
  const chaos = CHAOS_AT.filter((at) => at <= b)
  const verb = Math.floor((b - 136) / 4)
  const hit = Math.floor((b - 256) / 8)
  const line = b < SONG_BEATS ? lineAt(b) : null
  const slot = slotAt(b)

  return (
    <Html>
      <div className="mv-dark absolute inset-0" />
      <Bokeh />
      {[128, 256, 312].map((x) => in_(x, x + 1) && <div key={x} className="flash absolute inset-0 bg-snow" />)}
      <Pulse>
      {/* 1 · intro: it's Monday */}
      {in_(0, 8) && <span className="absolute left-[110px] top-[300px] inline-block h-[110px] w-0 text-[110px]"><span className="caret" /></span>}
      {in_(16, 32) && <Clock ring={b >= 18} />}
      {in_(4, 32) && <Typed text="8:00 AM." speed={60} className="absolute left-[110px] top-[560px] font-mono text-[56px] text-snow/60" />}

      {/* 2 · verse: the chaos piles up */}
      {in_(32, 128) && (
        <div className={b >= 80 && b < 96 ? 'shake' : ''} style={{ opacity: b >= 96 ? 0.18 : 1, transition: 'opacity 0.6s' }}>
          {chaos.map((_, i) => <ChaosCard key={i} i={i} b={b} />)}
        </div>
      )}

      {/* 3 · pre-chorus: a chatbot only gives advice */}
      {in_(104, 116) && (
        <div className="absolute left-[820px] top-[200px] w-[680px]">
          <Mono className="mb-3 text-[18px] text-snow/50">Chat · just now</Mono>
          <div className="rounded-2xl border border-snow/20 bg-[#12161d] px-8 py-6">
            <Typed text="help me." caret speed={90} className="font-mono text-[60px] text-mint" />
          </div>
          {b >= 108 && (
            <div className="pop mt-8 flex items-end gap-5">
              <Bot px={8} />
              <div className="rounded-2xl rounded-bl-sm bg-snow px-7 py-4 text-[38px] text-ink">Here are 5 tips for your week…</div>
            </div>
          )}
        </div>
      )}
      {in_(116, 128) && <StickFigure />}

      {/* 4 · chorus: meet your agent */}
      {in_(128, 136) && <div className="pop absolute left-[730px] top-[540px]"><div className="hop"><Bot px={16} /></div></div>}
      {in_(136, 160) && (
        <div key={verb} className="slam absolute inset-x-0 top-[250px] text-center">
          <Mono className="mb-4 text-mint">Tool call 0{verb + 1} / 06</Mono>
          <div className={`${H} text-[230px]`}>it <span className="text-mint [text-shadow:0_0_40px_rgba(61,255,200,0.6)]">{VERBS[verb]}.</span></div>
        </div>
      )}
      {in_(136, 160) && <div className="hop absolute left-[120px] top-[700px]"><Bot px={9} /></div>}
      {in_(160, 192) && <LoopDiagram b={b} />}

      {/* 5 · verse 2: watch it work (one task up close) */}
      {in_(192, 240) && (['Goal', 'Plan', 'Act', 'Check'] as const).map((s, i) => {
        const from = [192, 200, 212, 228][i]
        return in_(from, [200, 212, 228, 240][i]) && <Mono key={s} className="pop absolute left-[110px] top-[270px] text-mint">Step 0{i + 1} / 04 · {s}</Mono>
      })}
      {in_(192, 256) && <Console b={b} />}
      {in_(240, 256) && (
        <div className="absolute left-[860px] top-[300px] flex flex-col items-start gap-6">
          {MEMORY.map((m, i) => b >= 242 + i * 4 && <span key={m} className="pop rounded-xl border-2 border-mint bg-[#12161d] px-8 py-3 font-mono text-[48px] text-mint">+ {m}</span>)}
        </div>
      )}

      {/* 6 · chorus 2: everything done */}
      {in_(256, 288) && (
        <>
          <DoneCard key={hit} i={hit} b={b} />
          <div key={Math.floor(b)} className="thump absolute left-[740px] top-[260px] text-[220px] font-extrabold leading-none tracking-[-0.04em] text-mint [text-shadow:0_0_50px_rgba(61,255,200,0.6)]">Done ✓</div>
        </>
      )}

      {/* 7 · bridge: the music stops */}
      {in_(288, 294) && <div className={`absolute inset-x-0 top-[330px] text-center text-[220px] ${H} text-mint ${b >= 291 ? 'glitchy' : ''}`}>Done ✓</div>}
      {in_(310, 312) && <span className="absolute left-[790px] top-[360px] inline-block h-[150px] w-0 text-[150px]"><span className="caret" /></span>}

      {/* 8 · final: you do */}
      {b >= 324 && (
        <>
          <div className="pop absolute left-[110px] top-[230px]"><Mono className="text-mint">Class · Cumorah Academy</Mono></div>
          <Typed text={'Everyday\nAI *agents*'} speed={50} className={`absolute left-[100px] top-[280px] text-[190px] ${H} leading-[0.92]`} />
          <div className="pop absolute left-[1240px] top-[760px]"><Bot px={11} /></div>
        </>
      )}

      {line && slot && <Karaoke line={line} b={b} slot={slot} />}
      </Pulse>
      {b < SONG_BEATS && <Hud b={b} part={part} />}
      {part > 0 && b < SONG_BEATS && <Slices key={part} />}
    </Html>
  )
}

/** Plays at step 1 (one click), shows the title at step 2. Calls `onEnd` when the song is over. */
export default function OpeningVideo({ step, onEnd }: { step: number; onEnd: () => void }) {
  const running = step === 1
  const beat = useSongBeat(running)
  const fired = useRef(-1)
  const sung = useRef(-1)
  const said = useRef(-1)
  const fxDone = useRef(-1)
  const ended = useRef(false)

  // download the song and the bot's line as soon as the slide is on screen; decode once sound is unlocked
  useEffect(() => { preloadSong(); preloadVoice() }, [])
  useEffect(() => { if (running) music.decodeAll() }, [running])

  useEffect(() => {
    if (!running) { fired.current = -1; sung.current = -1; said.current = -1; fxDone.current = -1; ended.current = false; hush(); return }
    // the sung lines (and the bot's spoken one), scheduled a beat ahead so each lands on its beat (skipped if we're already late)
    SONG.forEach((l, i) => {
      if (i <= sung.current || l.at - 1 > beat) return
      sung.current = i
      if (beat - l.at < 0.5) singLine(l, music.timeAt(l.at))
    })
    LINES.forEach((l, i) => {
      if (i <= said.current || l.at - 1 > beat) return
      said.current = i
      if (beat - l.at < 0.5) shout(l, music.timeAt(l.at))
    })
    FX.forEach((f, i) => {
      if (i <= fxDone.current || f.at - 1 > beat) return
      fxDone.current = i
      if (beat > f.at) return
      const t = music.timeAt(f.at)
      if (f.fx === 'build') { music.riser(8 * BEAT); music.snareRoll(t, 8) }
      if (f.fx === 'drop') music.crash(t)
    })
    CUES.forEach((c, i) => {
      if (i <= fired.current || c.at > beat) return
      fired.current = i
      if (c.mix) music.setMix(c.mix, c.cut)
      if (c.fx === 'impact') music.impact()
      if (c.fx === 'whoosh') music.whoosh()
    })
    if (beat >= SONG_BEATS && !ended.current) { ended.current = true; onEnd() }
  }, [beat, running, onEnd])

  useEffect(() => hush, [])

  if (step < 1) return null
  const b = running ? beat : SONG_BEATS
  return (
    <>
      <Frame b={b} />
      {b >= 324 && <g className="pop"><OpenBox /></g>}
    </>
  )
}
