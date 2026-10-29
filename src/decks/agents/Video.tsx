import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { BPM, music, SILENT, type Mix } from './music'
import { Bot, Html, Mono, OpenBox, Typed } from './ui'

/**
 * The opening video (≈3 min): a music video about what agents do. It plays on its own,
 * following the beat of the generated soundtrack; every cut is placed on a beat number.
 * The story is in STORY-agents-video.md.
 */

const BEAT = 60 / BPM
export const SONG_BEATS = 336 // 84 bars

// where each part of the song starts (in beats)
const PARTS = [0, 32, 96, 128, 192, 256, 288, 312]

const FULL: Mix['layers'] = { kick: 1, hat: 1, clap: 0.8, bass: 1, pad: 1, arp: 0.6, stab: 0.7 }
type Cue = { at: number; mix?: Mix; cut?: boolean; fx?: 'impact' | 'riser' | 'whoosh' }
const CUES: Cue[] = [
  { at: 0, mix: { layers: { pad: 1, kick: 0.5 }, level: 0.4, cutoff: 1600, half: true }, cut: true },
  { at: 16, mix: { layers: { pad: 1, kick: 0.6, hat: 0.5 }, level: 0.42, cutoff: 2600, half: true } },
  { at: 32, mix: { layers: { pad: 1, kick: 1, hat: 1, bass: 1 }, level: 0.45, cutoff: 5000 }, fx: 'whoosh' },
  { at: 64, mix: { layers: { pad: 1, kick: 1, hat: 1, bass: 1, clap: 0.8, arp: 0.6 }, level: 0.48, cutoff: 8000 } },
  { at: 96, mix: { layers: { pad: 1, arp: 0.5, hat: 0.4 }, level: 0.4, cutoff: 900 }, fx: 'whoosh' },
  { at: 120, fx: 'riser' },
  { at: 128, mix: { layers: FULL, level: 0.55, cutoff: 18000 }, cut: true, fx: 'impact' },
  { at: 192, mix: { layers: { pad: 1, kick: 1, hat: 1, bass: 1, arp: 1 }, level: 0.46, cutoff: 7000 }, fx: 'whoosh' },
  { at: 248, fx: 'riser' },
  { at: 256, mix: { layers: FULL, level: 0.6, cutoff: 18000 }, cut: true, fx: 'impact' },
  { at: 288, mix: SILENT, cut: true },
  { at: 312, mix: { layers: FULL, level: 0.6, cutoff: 18000 }, cut: true, fx: 'impact' },
  { at: 328, mix: { layers: { pad: 1, hat: 0.5, arp: 0.35 }, level: 0.25, cutoff: 1500 } },
]

/**
 * The song position in beats (quarter-beat steps), on the audio clock when there is sound.
 * For rehearsal, `?from=128` in the address starts the video at that beat.
 */
function useSongBeat(running: boolean) {
  const [beat, setBeat] = useState(0)
  useEffect(() => {
    if (!running) return
    music.startSong()
    const from = Number(new URLSearchParams(location.search).get('from')) || 0
    const t0 = performance.now() - from * BEAT * 1000
    let raf = 0
    let last = -1
    const tick = () => {
      const audio = music.songBeat()
      const b = Math.max(0, audio === null ? (performance.now() - t0) / 1000 / BEAT : audio + from)
      const q = Math.min(Math.floor(b * 4) / 4, SONG_BEATS)
      if (q !== last) { last = q; setBeat(q) }
      if (q < SONG_BEATS) raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [running])
  return beat
}

// ---------- pieces ----------

const H = 'font-extrabold leading-[0.95] tracking-[-0.04em]'
const PINK = 'text-bot [text-shadow:0_0_28px_rgba(255,93,143,0.55)]'

/** A headline that types itself when it appears. */
const Head = ({ text, className, hl }: { text: string; className: string; hl?: string }) => (
  <Typed key={text} text={text} speed={32} hl={hl} className={`absolute ${H} ${className}`} />
)

const Caret = ({ className }: { className: string }) => (
  <span className={`absolute inline-block w-0 ${className}`}><span className="caret" /></span>
)

/** A white UI card (the "real life" things the agent deals with). */
const Card = ({ label, children, className = '', style }: { label: string; children: ReactNode; className?: string; style?: CSSProperties }) => (
  <div className={`absolute w-[400px] rounded-2xl border-2 border-ink/15 bg-snow p-6 text-ink shadow-[0_24px_60px_rgba(5,10,60,0.45)] ${className}`} style={style}>
    <Mono className="mb-3 border-b-2 border-ink/10 pb-2 text-[17px] text-ink/50">{label}</Mono>
    {children}
  </div>
)

const CHAOS = [
  { at: 32, head: '*47* emails.' },
  { at: 40, head: 'a trip to *plan.*' },
  { at: 48, head: 'homework due *Friday.*' },
  { at: 56, head: 'a game to *build.*' },
  { at: 64, head: '*3* group chats.' },
  { at: 72, head: '*1* dentist appointment.' },
]
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
        <svg width="350" height="70"><path d="M15,50 C110,-10 240,90 335,20" fill="none" stroke="#121845" strokeWidth="4" strokeDasharray="10 10" /><circle cx="15" cy="50" r="9" fill="#121845" /><circle cx="335" cy="20" r="9" fill="#ff5d8f" /></svg>
        <div className={mono}>SAT → SUN · €??</div>
      </Card>
    )
    case 2: return (
      <Card label="Homework" className="drop" style={style}>
        <div className="flex gap-2">
          {['MON', 'TUE', 'WED', 'THU', 'FRI'].map((d) => (
            <div key={d} className={`flex-1 rounded-lg border-2 py-2 text-center font-mono text-[18px] ${d === 'FRI' ? 'border-bot bg-bot text-snow' : 'border-ink/20'}`}>{d}</div>
          ))}
        </div>
        <div className={`${mono} mt-2 text-bot`}>due friday!</div>
      </Card>
    )
    case 3: return (
      <Card label="game.js" className="drop" style={style}>
        <div className={`${mono} text-[22px]`}>function party() {'{'}<br />&nbsp;&nbsp;<span className="text-ink/45">// TODO: everything</span><br />{'}'}</div>
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
  const active = Math.floor(b) % 4
  const a = ((b % 4) / 4) * Math.PI * 2 - Math.PI / 2
  return (
    <>
      <svg width="1600" height="900" className="pop absolute left-0 top-0">
        <circle cx="1050" cy="520" r="250" fill="none" stroke="rgba(243,246,255,0.7)" strokeWidth="4" />
        <circle cx="1050" cy="520" r="232" fill="none" stroke="rgba(243,246,255,0.2)" strokeWidth="2" />
        <circle cx={1050 + Math.cos(a) * 250} cy={520 + Math.sin(a) * 250} r="16" fill="#3dffc8" />
      </svg>
      {LOOP_POS.map(([name, x, y], i) => (
        <div key={name} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 px-6 py-1 text-[62px] font-extrabold transition-all duration-150"
          style={{ left: x, top: y, background: i === active ? '#3dffc8' : '#0d1660', color: i === active ? '#0d1660' : '#f3f6ff', borderColor: i === active ? '#3dffc8' : 'rgba(243,246,255,0.6)', transform: `translate(-50%,-50%) scale(${i === active ? 1.12 : 1})` }}>
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
    <div className="absolute left-[820px] top-[150px] w-[680px] rounded-2xl border-2 border-ink/15 bg-snow p-8 text-ink shadow-[0_24px_60px_rgba(5,10,60,0.45)] transition-opacity duration-500" style={{ opacity: b >= 240 ? 0 : 1 }}>
      <Mono className="mb-4 border-b-2 border-ink/10 pb-2 text-[18px] text-green">Agent · trip_prague.md</Mono>
      <div className="font-mono text-[18px] text-ink/45">GOAL</div>
      <Typed text="weekend in Prague, under €150" speed={30} className="mb-4 font-mono text-[30px]" />
      {b >= 200 && <div className="font-mono text-[18px] text-ink/45">PLAN</div>}
      {PLAN.map((p, i) => b >= 200 + i * 4 && (
        <div key={p} className="pop font-mono text-[30px] leading-[1.5]">
          <span className={b >= 216 + i * 4 ? 'text-green' : 'text-ink/30'}>{b >= 216 + i * 4 ? '[✓]' : '[ ]'}</span> {p}
        </div>
      ))}
      <div className="mt-4 flex gap-3">
        {TOOLS.map((t, i) => b >= 212 + i * 4 && <span key={t} className="pop rounded-lg bg-[#0d1660] px-4 py-1 font-mono text-[22px] uppercase tracking-[0.12em] text-mint">{t}</span>)}
      </div>
      {b >= 228 && (
        <div className="pop mt-5 flex items-baseline justify-between border-t-2 border-ink/10 pt-3">
          <span className="font-mono text-[26px] text-ink/50">TOTAL</span>
          <span className={`text-[72px] font-extrabold ${total === 142 ? 'text-green' : ''}`}>€{total}{total === 142 && ' ✓'}</span>
        </div>
      )}
    </div>
  )
}

function DoneCard({ i, b }: { i: number; b: number }) {
  const style = { left: 110, top: 250, '--r': `${i % 2 ? 3 : -3}deg` } as CSSProperties
  const mono = 'font-mono text-[30px] leading-[1.6]'
  switch (i) {
    case 0: return <Card key={i} label="Inbox" className="drop w-[540px]" style={style}><div className="text-[110px] font-extrabold leading-none">{Math.max(0, 47 - Math.floor((b - 256) * 12))}</div><div className={mono}>unread · replies drafted</div></Card>
    case 1: return <Card key={i} label="Calendar" className="drop w-[540px]" style={style}>{['MON  gym', 'TUE  study', 'FRI  homework ✓'].map((r) => <div key={r} className={mono}>{r}</div>)}</Card>
    case 2: return <Card key={i} label="Homework" className="drop w-[540px]" style={style}><div className={mono}>5 sources</div><div className={mono}>summary ready ✓</div></Card>
    default: return <Card key={i} label="game.js" className="drop w-[540px]" style={style}><div className={mono}>tests: 12 / 12</div><div className={`${mono} text-green`}>passing ✓</div></Card>
  }
}

/** Pixel-block burst on every new part of the song. */
function Burst() {
  const cells = useMemo(() => Array.from({ length: 144 }, () => ({
    color: Math.random() < 0.5 ? 'transparent' : ['#2a40e0', '#3dffc8', '#0b1250', '#d3dcff', '#ff5d8f'][Math.floor(Math.random() * 5)],
    delay: Math.random() * 0.2,
  })), [])
  return <div className="pixels">{cells.map((c, i) => <i key={i} style={{ background: c.color, animationDelay: `${c.delay}s` }} />)}</div>
}

// ---------- the timeline ----------

function Frame({ b }: { b: number }) {
  const in_ = (a: number, z: number) => b >= a && b < z
  const part = PARTS.filter((p) => p <= b).length - 1
  const chaos = CHAOS.filter((c) => c.at <= b)
  const verb = Math.floor((b - 136) / 4)
  const hit = Math.floor((b - 256) / 8)

  return (
    <Html>
      {/* 1 · intro: it's Monday */}
      {in_(0, 8) && <Caret className="left-[110px] top-[330px] h-[150px] text-[150px]" />}
      {in_(8, 32) && <Head text="it's *Monday.*" className="left-[100px] top-[280px] text-[170px]" />}
      {in_(16, 32) && <Clock ring={b >= 24} />}
      {in_(20, 32) && <Typed text="8:00 AM." speed={60} className="absolute left-[110px] top-[480px] font-mono text-[64px] text-snow/70" />}

      {/* 2 · verse: the chaos piles up */}
      {in_(32, 128) && (
        <div className={b >= 80 && b < 96 ? 'shake' : ''} style={{ opacity: b >= 96 ? 0.22 : 1, transition: 'opacity 0.6s' }}>
          {chaos.map((_, i) => <ChaosCard key={i} i={i} b={b} />)}
        </div>
      )}
      {in_(32, 80) && <Head text={chaos[chaos.length - 1]?.head ?? ''} className="left-[100px] top-[300px] w-[860px] text-[118px]" />}
      {in_(80, 96) && <Head text="too *much.*" hl={PINK} className="left-[100px] top-[300px] text-[180px]" />}

      {/* 3 · pre-chorus: a chatbot only gives advice */}
      {in_(96, 104) && <Head text="so you ask a *chatbot.*" className="left-[100px] top-[150px] w-[900px] text-[118px]" />}
      {in_(104, 116) && (
        <div className="absolute left-[110px] top-[200px] w-[820px]">
          <Mono className="mb-3 text-[18px] text-snow/60">Chat · just now</Mono>
          <div className="rounded-2xl border-[3px] border-snow/80 bg-[#0d1660]/80 px-8 py-6">
            <Typed text="help me." caret speed={90} className="font-mono text-[64px] text-mint" />
          </div>
          {b >= 108 && (
            <div className="pop mt-8 flex items-end gap-5">
              <Bot px={8} />
              <div className="rounded-2xl rounded-bl-sm bg-snow px-7 py-4 text-[40px] text-ink">Here are 5 tips for your week…</div>
            </div>
          )}
        </div>
      )}
      {in_(116, 128) && <Head text="…the work is still *yours.*" hl={PINK} className="left-[100px] top-[150px] w-[960px] text-[118px]" />}
      {in_(116, 128) && <StickFigure />}

      {/* 4 · chorus: meet your agent */}
      {in_(128, 136) && (
        <>
          <Head text="meet your *agent.*" className="inset-x-0 top-[200px] text-center text-[170px]" />
          <div className="pop absolute left-[730px] top-[540px]"><div className="hop"><Bot px={16} /></div></div>
        </>
      )}
      {in_(136, 160) && (
        <div key={verb} className="pop absolute inset-x-0 top-[250px] text-center">
          <Mono className="mb-4 text-mint">Tool call 0{verb + 1} / 06</Mono>
          <div className={`${H} text-[230px]`}>it <span className="text-mint [text-shadow:0_0_40px_rgba(61,255,200,0.6)]">{VERBS[verb]}.</span></div>
        </div>
      )}
      {in_(136, 160) && <div className="hop absolute left-[120px] top-[700px]"><Bot px={9} /></div>}
      {in_(160, 192) && (
        <>
          <Head text={'on\n*repeat.*'} className="left-[100px] top-[180px] text-[128px]" />
          <LoopDiagram b={b} />
        </>
      )}

      {/* 5 · verse 2: watch it work (one task up close) */}
      {in_(192, 240) && (
        <div className="absolute left-[110px] top-[300px]">
          {(['Goal', 'Plan', 'Act', 'Check'] as const).map((s, i) => {
            const from = [192, 200, 212, 228][i]
            const to = [200, 212, 228, 240][i]
            return in_(from, to) && (
              <div key={s}>
                <Mono className="mb-2 text-mint">Step 0{i + 1} / 04</Mono>
                <Typed text={`*${s}.*`} speed={50} className={`${H} text-[180px]`} />
              </div>
            )
          })}
        </div>
      )}
      {in_(192, 256) && <Console b={b} />}
      {in_(240, 256) && (
        <>
          <Head text={'it\n*remembers*\nyou.'} className="left-[100px] top-[180px] text-[128px]" />
          <div className="absolute left-[860px] top-[300px] flex flex-col items-start gap-6">
            {MEMORY.map((m, i) => b >= 242 + i * 4 && <span key={m} className="pop rounded-xl border-2 border-mint bg-[#0d1660] px-8 py-3 font-mono text-[48px] text-mint">+ {m}</span>)}
          </div>
        </>
      )}

      {/* 6 · chorus 2: everything done */}
      {in_(256, 288) && (
        <>
          <DoneCard key={hit} i={hit} b={b} />
          <div key={Math.floor(b)} className="thump absolute left-[740px] top-[300px] text-[220px] font-extrabold leading-none tracking-[-0.04em] text-mint [text-shadow:0_0_50px_rgba(61,255,200,0.6)]">Done ✓</div>
        </>
      )}

      {/* 7 · bridge: the music stops */}
      {in_(288, 294) && <div className={`absolute inset-x-0 top-[330px] text-center text-[220px] ${H} text-mint ${b >= 291 ? 'glitchy' : ''}`}>Done ✓</div>}
      {in_(294, 302) && <Head text="…but is it *right?*" hl={PINK} className="inset-x-0 top-[330px] text-center text-[150px]" />}
      {in_(302, 308) && <Head text="…who *decides?*" hl={PINK} className="inset-x-0 top-[330px] text-center text-[150px]" />}
      {in_(308, 312) && <Caret className="left-[790px] top-[360px] h-[150px] text-[150px]" />}

      {/* 8 · final: you do */}
      {in_(312, 316) && <div className="pop absolute inset-x-0 top-[260px] text-center"><span className={`${H} text-[300px]`}>You <span className="text-mint [text-shadow:0_0_50px_rgba(61,255,200,0.6)]">do.</span></span></div>}
      {in_(316, 324) && <Head text={'Goal: *you.*\nCheck: *you.*'} className="left-[100px] top-[230px] text-[180px]" />}
      {b >= 324 && (
        <>
          <div className="pop absolute left-[110px] top-[230px]"><Mono className="text-mint">Class · Cumorah Academy</Mono></div>
          <Typed text={'Everyday\nAI *agents*'} speed={50} className={`absolute left-[100px] top-[280px] text-[190px] ${H} leading-[0.92]`} />
          <div className="pop absolute left-[1240px] top-[760px]"><Bot px={11} /></div>
        </>
      )}

      {part > 0 && b < SONG_BEATS && <Burst key={part} />}
    </Html>
  )
}

/** Plays at step 1 (one click), shows the title at step 2. Calls `onEnd` when the song is over. */
export default function OpeningVideo({ step, onEnd }: { step: number; onEnd: () => void }) {
  const running = step === 1
  const beat = useSongBeat(running)
  const fired = useRef(-1)
  const ended = useRef(false)

  // music cues on their beats
  useEffect(() => {
    if (!running) { fired.current = -1; ended.current = false; return }
    CUES.forEach((c, i) => {
      if (i <= fired.current || c.at > beat) return
      fired.current = i
      if (c.mix) music.setMix(c.mix, c.cut)
      if (c.fx === 'impact') music.impact()
      if (c.fx === 'whoosh') music.whoosh()
      if (c.fx === 'riser') music.riser(8 * BEAT)
    })
    if (beat >= SONG_BEATS && !ended.current) { ended.current = true; onEnd() }
  }, [beat, running, onEnd])

  if (step < 1) return null
  const b = running ? beat : SONG_BEATS
  return (
    <>
      {b >= 324 && <g className="pop"><OpenBox /></g>}
      <Frame b={b} />
    </>
  )
}
