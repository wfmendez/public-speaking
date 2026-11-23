import type { CSSProperties } from 'react'
import type { Light } from './scenes'

/*
 * The candles beside the words. They stay on screen across the slides and change only on a click:
 * the first candle lights, then it lights a second one, then a crowd of small candles appears.
 * Each change is a CSS transition that is over within about two seconds; after that nothing moves
 * while the speaker talks, so there is no flicker.
 */

type Spot = { x: number; foot: number; w: number; h: number }

const MAIN: Spot = { x: 1300, foot: 780, w: 84, h: 330 }
const SECOND: Spot = { x: 1110, foot: 780, w: 62, h: 210 }
// the crowd at the end: x, foot, size (the smaller ones look further away)
const CROWD: [number, number, number][] = [
  [90, 868, 0.9], [175, 892, 0.7], [210, 828, 0.55], [305, 878, 1.05], [415, 842, 0.65], [520, 886, 0.95],
  [630, 832, 0.5], [735, 872, 0.85], [845, 848, 0.6], [945, 890, 1], [1000, 836, 0.5],
  [1400, 828, 0.5], [1445, 862, 0.75], [1545, 886, 0.95],
]

/** A flame standing on (x, y): round at the bottom, pointed at the top. */
const flame = (x: number, y: number, r: number, h: number) =>
  `M${x},${y} C${x + r * 1.35},${y} ${x + r * 0.9},${y - h * 0.55} ${x},${y - h} C${x - r * 0.9},${y - h * 0.55} ${x - r * 1.35},${y} ${x},${y}Z`

function Candle({ x, foot, w, h, lit, glow, delay = 0 }: Spot & { lit: boolean; glow: number; delay?: number }) {
  const top = foot - h
  const later: CSSProperties = { transitionDelay: `${delay}s` }
  const paint = (on: string, off: string): CSSProperties => ({ ...later, fill: lit ? on : off })
  return (
    <g>
      <circle className="cd-glow" cx={x} cy={top - w * 0.4} r={glow} fill="url(#cd-glow)" style={{ ...later, opacity: lit ? 1 : 0, transform: lit ? 'none' : 'scale(0.5)' }} />
      <ellipse className="cd-wax" cx={x} cy={foot} rx={w * 1.05} ry={w * 0.16} style={paint('#6e5434', '#1c1712')} />
      <rect className="cd-wax" x={x - w / 2} y={top} width={w} height={h} style={paint('#efe3c8', '#2b251f')} />
      <rect className="cd-wax" x={x + w * 0.2} y={top} width={w * 0.3} height={h} style={paint('#d8c6a2', '#231e19')} />
      <path className="cd-wax" d={`M${x - w * 0.36},${top} v${w * 0.5} a${w * 0.08},${w * 0.08} 0 0 0 ${w * 0.16},0 v${-w * 0.5}z`} style={paint('#f6ecd6', '#2f2922')} />
      <ellipse className="cd-wax" cx={x} cy={top} rx={w / 2} ry={w * 0.12} style={paint('#f8efdc', '#332c25')} />
      <line x1={x} y1={top} x2={x} y2={top - w * 0.14} stroke="#20160e" strokeWidth={Math.max(1.5, w * 0.04)} strokeLinecap="round" />
      <g className={`cd-flame${lit ? '' : ' off'}`} style={later}>
        <path d={flame(x, top - w * 0.1, w * 0.3, w * 0.95)} fill="#f2a33a" />
        <path d={flame(x, top - w * 0.12, w * 0.15, w * 0.5)} fill="#ffe6a8" />
      </g>
    </g>
  )
}

// The figure of Christ with open arms, in lines of light, standing behind the candles.
const CHRIST = [
  ring(1205, 150, 30, 38),
  'M1176,134 C1168,170 1166,205 1172,236', 'M1234,134 C1242,170 1244,205 1238,236',
  'M1150,262 C1162,240 1182,232 1205,232 C1228,232 1248,240 1260,262',
  'M1150,262 L1040,420', 'M1172,320 L1068,440', 'M1040,420 Q1050,438 1068,440',
  'M1260,262 L1370,420', 'M1238,320 L1342,440', 'M1370,420 Q1360,438 1342,440',
  ring(1048, 452, 13), ring(1362, 452, 13),
  'M1172,320 C1160,420 1146,540 1128,690', 'M1238,320 C1250,420 1264,540 1282,690', 'M1128,690 Q1205,712 1282,690',
  'M1182,244 C1214,320 1244,420 1262,560', 'M1205,330 C1200,450 1196,560 1190,690',
]

function ring(x: number, y: number, rx: number, ry = rx) {
  return `M${x - rx},${y} a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0`
}

export default function Candles({ light, christ }: { light: Light | null; christ: boolean }) {
  const level = light ?? 0
  return (
    <svg className="cd-candles" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true" style={{ opacity: light === null ? 0 : 1 }}>
      <defs>
        <radialGradient id="cd-glow">
          <stop offset="0%" stopColor="#ffb85c" stopOpacity="0.34" />
          <stop offset="45%" stopColor="#ff9f46" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ff9640" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="cd-christ" style={{ opacity: christ ? 1 : 0 }}>
        <circle className="cd-glow" cx={1205} cy={230} r={330} fill="url(#cd-glow)" style={{ opacity: christ ? 1 : 0 }} />
        {CHRIST.map((d, i) => (
          <path key={i} d={d} pathLength={1} className={`cd-line${christ ? ' on' : ''}`} style={{ '--d': `${0.2 + i * 0.09}s` } as CSSProperties} />
        ))}
      </g>
      {CROWD.map(([x, foot, s], i) => (
        <g key={i} className="cd-crowd" style={{ opacity: level >= 3 ? 1 : 0, transitionDelay: `${i * 0.1}s` }}>
          <Candle x={x} foot={foot} w={30 * s} h={66 * s} lit={level >= 3} glow={130 * s} delay={i * 0.1} />
        </g>
      ))}
      <Candle {...SECOND} lit={level >= 2} glow={300} delay={0.3} />
      <Candle {...MAIN} lit={level >= 1} glow={460} />
    </svg>
  )
}
