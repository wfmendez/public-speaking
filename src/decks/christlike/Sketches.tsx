import type { CSSProperties, ReactElement } from 'react'
import { D, G } from '../../components/Draw'
import { Icon } from '../../icons'

/*
 * Pencil drawings for the talk, in the same ink-on-paper style as the first talk.
 * Each one draws itself stroke by stroke when its slide arrives (all done within about three
 * seconds) and then stays still while the speaker talks.
 */

/** `color`: a line in its own colour (e.g. a brown cane) instead of pencil grey. */
type Stroke = { d: string; accent?: boolean; soft?: boolean; w?: number; fill?: string; color?: string }

const BROWN = '#8b5a2b'

// flat colours painted under the pencil lines
const SKIN = '#f1c9a5'
const GOLD = '#f2c230'
const RED = '#d94b3d'
const WHITE = '#ffffff'
const SAND = '#ddd0b6'

/** The colour under a stroke: it fades in just after the line has drawn itself. */
const Fill = ({ s, at }: { s: Stroke; at: number }) =>
  s.fill ? <path d={s.d} fill={s.fill} className="cl-fill" style={{ '--fd': `${at}s` } as CSSProperties} /> : null

const ring = (x: number, y: number, rx: number, ry = rx) =>
  `M${x - rx},${y} a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0`

/** A standing person whose feet are on (x, y), about 102·s tall. */
function person(x: number, y: number, s = 1, arms: 'down' | 'up' | 'out' = 'down'): Stroke[] {
  const k = (n: number) => n * s
  const hands = {
    down: `M${x - k(20)},${y - k(40)} L${x},${y - k(62)} L${x + k(20)},${y - k(40)}`,
    up: `M${x - k(24)},${y - k(96)} L${x},${y - k(62)} L${x + k(24)},${y - k(96)}`,
    out: `M${x - k(34)},${y - k(62)} H${x + k(34)}`,
  }[arms]
  return [
    { d: ring(x, y - k(86), k(16)) },
    { d: `M${x},${y - k(70)} V${y - k(34)}` },
    { d: `M${x - k(14)},${y} L${x},${y - k(34)} L${x + k(14)},${y}` },
    { d: hands },
  ]
}

/** Strokes drawn one after another, all finished within about three seconds. */
function Strokes({ list, start = 0.5, width = 4 }: { list: Stroke[]; start?: number; width?: number }) {
  const step = Math.min(0.14, 2 / list.length)
  return (
    <>
      {list.map((s, i) => (
        <g key={i} style={s.color ? ({ '--ink': s.color } as CSSProperties) : undefined}><Fill s={s} at={start + i * step + 0.5} /><D d={s.d} accent={s.accent} soft={s.soft} width={s.w ?? width} delay={start + i * step} dur={0.7} /></g>
      ))}
    </>
  )
}

/**
 * A drawing in parts. Every stroke still draws itself in turn; a part with an action (cls) then
 * does one short thing, once, starting at `at` seconds: a hop, a shake, a bow, a coin dropping.
 * Everything starts right after the click and is over within about two seconds; then nothing moves.
 */
type Part = { list: Stroke[]; cls?: string; at?: number; origin?: string; from?: string }

function Parts({ parts, start = 0 }: { parts: Part[]; start?: number }) {
  const step = Math.min(0.05, 0.6 / parts.reduce((n, p) => n + p.list.length, 0))
  let n = 0
  return (
    <>
      {parts.map((p, k) => {
        const strokes = p.list.map((s) => {
          const i = n++
          return <g key={i}><Fill s={s} at={start + i * step + 0.35} /><D d={s.d} accent={s.accent} soft={s.soft} width={s.w ?? 4} delay={start + i * step} dur={0.5} /></g>
        })
        if (!p.cls) return <g key={k}>{strokes}</g>
        const style = { '--at': `${p.at ?? 2}s`, '--from': p.from, transformOrigin: p.origin } as CSSProperties
        return <g key={k} className={`cl-act ${p.cls}`} style={style}>{strokes}</g>
      })}
    </>
  )
}

// The comic panel the opening is drawn in, with the question written underneath.
const FRAME: Stroke = { d: 'M380,90 H1220 V600 H380 Z', w: 5 }

// A very happy, very powerful leader on a pedestal: crown, cape, hands on hips. He hops for joy.
const LEADER: Part[] = [
  { list: [FRAME, { d: 'M660,600 V520 H940 V600' }] },
  {
    cls: 'cl-hop', at: 0.5,
    list: [
      { d: 'M784,350 C760,400 736,450 718,488 C744,500 770,486 796,498 C820,510 846,496 866,486 C852,440 834,396 816,350 Z', accent: true },
      { d: ring(800, 300, 30) },
      { d: 'M786,292 v5 M814,292 v5' },
      { d: 'M782,308 C790,324 810,324 818,308' },
      { d: 'M772,272 L766,240 L786,256 L800,232 L814,256 L834,240 L828,272 Z', accent: true },
      { d: 'M800,330 V440' },
      { d: 'M768,520 L800,440 L832,520' },
      { d: 'M800,356 L756,384 L780,428 M800,356 L844,384 L820,428' },
    ],
  },
  { cls: 'cl-pop', at: 0.7, list: [{ d: 'M690,250 l-34,-16 M910,250 l34,-16 M800,206 v-30 M680,322 h-38 M920,322 h38' }] },
]

// A cartoon fight: a dust cloud with fists and feet sticking out. It shakes, and the crown flies off.
const FIGHT: Part[] = [
  { list: [FRAME] },
  {
    cls: 'cl-shake', at: 0.3,
    list: [
      { d: 'M640,420 A50,50 0 0,1 680,330 A60,60 0 0,1 780,290 A60,60 0 0,1 890,310 A55,55 0 0,1 950,390 A50,50 0 0,1 910,480 A60,60 0 0,1 800,510 A60,60 0 0,1 690,490 A45,45 0 0,1 640,420 Z' },
      { d: 'M652,362 L594,334' },
      { d: ring(584, 330, 13) },
      { d: 'M944,352 L1008,322' },
      { d: ring(1018, 318, 13) },
      { d: 'M806,292 L816,222' },
      { d: ring(818, 210, 13) },
      { d: 'M724,500 L702,572 L678,578' },
      { d: 'M878,500 L904,570 L930,574' },
      { d: 'M556,240 l24,24 M580,240 l-24,24 M1020,430 l24,24 M1044,430 l-24,24 M700,230 l16,16 M716,230 l-16,16' },
    ],
  },
  {
    cls: 'cl-fly', at: 0.9,
    list: [
      { d: 'M1012,206 L1004,168 L1028,184 L1046,154 L1062,182 L1088,170 L1082,208 Z', accent: true },
      { d: 'M988,222 l-34,12 M994,240 l-34,12', soft: true },
    ],
  },
]

// Someone thinking it over, hand on chin. The head tilts, and the question pops into the bubble.
const THINK: Part[] = [
  { list: [FRAME] },
  { cls: 'cl-tilt', at: 0.5, list: [{ d: ring(680, 300, 32) }, { d: 'M670,292 v5 M692,290 v5' }, { d: 'M672,314 H690' }] },
  { list: [{ d: 'M680,332 V450' }, { d: 'M654,570 L680,450 L706,570' }, { d: 'M680,360 L720,404 L700,328' }, { d: 'M680,362 L648,426' }] },
  { list: [{ d: ring(742, 262, 8) }, { d: ring(770, 226, 13) }, { d: ring(910, 180, 120, 74) }] },
  {
    cls: 'cl-pop', at: 0.8,
    list: [
      { d: 'M878,150 C878,116 942,116 942,150 C942,176 910,176 910,204', accent: true, w: 6 },
      { d: 'M910,226 v4', accent: true, w: 8 },
    ],
  },
]

// Fame: someone on a stage under a spotlight that shines straight down on them. The light flickers on, they hop, and the crowd waves.
const AUDIENCE = [470, 560, 650, 740, 870, 960, 1050, 1140]
const FAME: Part[] = [
  { list: [FRAME, { d: 'M805,92 V108' }, { d: 'M780,108 H830 L840,140 H770 Z' }] },
  { cls: 'cl-flash', at: 0.4, list: [{ d: 'M772,142 L675,462', accent: true }, { d: 'M838,142 L935,462', accent: true }, { d: ring(805, 462, 130, 24), accent: true }] },
  { cls: 'cl-hop', at: 0.5, list: person(805, 452, 1.4, 'up') },
  { list: [{ d: 'M722,300 l-24,-12 M888,300 l24,-12 M805,268 v-26' }, ...AUDIENCE.map((x) => ({ d: `M${x - 26},600 a26,26 0 0,1 52,0` }))] },
  ...AUDIENCE.filter((_, i) => i % 2 === 0).map((x, i): Part => ({
    cls: 'cl-wave', at: 0.5 + i * 0.08, list: [{ d: `M${x + 22},580 l14,-36 M${x + 44},540 l9,-7` }],
  })),
]

/** A person bowing low, feet on (x, y), facing right (dir 1) or left (dir -1): they bow down once. */
function bowing(x: number, y: number, dir: 1 | -1, at: number): Part[] {
  const f = (n: number) => x + n * dir
  return [
    { list: [{ d: `M${f(-10)},${y} L${x},${y - 56} L${f(10)},${y}` }] },
    {
      cls: 'cl-bow', at, origin: `${x}px ${y - 56}px`, from: `rotate(${-50 * dir}deg)`,
      list: [{ d: `M${x},${y - 56} L${f(42)},${y - 92}` }, { d: ring(f(58), y - 88, 14) }, { d: `M${f(36)},${y - 86} L${f(44)},${y - 50}` }],
    },
  ]
}

// Power and authority: a king on a throne, with crown and sceptre; people on both sides bow low.
const POWER: Part[] = [
  {
    list: [
      FRAME,
      { d: 'M610,600 V560 H990 V600' },
      { d: 'M650,560 V528 H950 V560' },
      { d: 'M720,528 V236 C756,206 844,206 880,236 V528' },
      { d: 'M704,440 H896 M704,440 V404 H740 M896,440 V404 H860' },
      { d: ring(800, 306, 26) },
      { d: 'M776,282 L770,252 L788,266 L800,244 L812,266 L830,252 L824,282 Z', accent: true },
      { d: 'M789,302 h7 M804,302 h7' },
      { d: 'M790,318 C796,322 804,322 810,318' },
      { d: 'M800,332 V420' },
      { d: 'M800,420 L772,440 V526 M800,420 L828,440 V526' },
      { d: 'M800,354 L846,392 M800,354 L752,396' },
      { d: 'M856,300 V470', accent: true },
      { d: ring(856, 290, 10), accent: true },
    ],
  },
  ...bowing(450, 600, 1, 0.4),
  ...bowing(530, 600, 1, 0.55),
  ...bowing(1150, 600, -1, 0.45),
  ...bowing(1070, 600, -1, 0.6),
]

// Money: a very happy person hugging a sack of money, hopping for joy, while coins drop from above.
const COINS: [number, number, number][] = [[560, 180, 18], [642, 128, 16], [1080, 170, 18], [1000, 240, 15], [540, 300, 15]]
const MONEY: Part[] = [
  {
    list: [
      FRAME,
      { d: 'M720,590 C590,590 590,440 690,400 L668,352 H772 L750,400 C850,440 850,590 720,590 Z' },
      { d: 'M676,374 H764' },
      { d: 'M748,452 C730,436 694,442 698,466 C702,488 746,484 748,508 C750,532 712,540 692,522', accent: true },
      { d: 'M720,428 V548', accent: true },
    ],
  },
  {
    cls: 'cl-hop', at: 0.6,
    list: [
      { d: ring(918, 330, 22) },
      { d: 'M905,327 C908,320 913,320 916,327 M921,327 C924,320 929,320 932,327' },
      { d: 'M905,337 H931 C929,353 907,353 905,337 Z' },
      { d: 'M914,352 L906,440' },
      { d: 'M886,590 L906,440 L930,590' },
      { d: 'M910,376 C880,396 830,410 792,432 M910,388 C872,422 836,452 806,476' },
      { d: 'M966,292 C960,282 946,286 950,298 L966,312 L982,298 C986,286 972,282 966,292 Z', accent: true },
    ],
  },
  { list: [0, 1, 2].map((k): Stroke => ({ d: ring(1070, 576 - k * 25, 44, 12) })).concat([{ d: ring(1150, 576, 40, 11) }, { d: ring(1150, 552, 40, 11) }]) },
  ...COINS.map(([x, y, r], i): Part => ({ cls: 'cl-drop', at: 0.2 + i * 0.12, list: [{ d: ring(x, y, r), accent: true }] })),
  { list: [{ d: 'M610,380 l-22,-16 M598,432 l-28,0' }] },
]

/** Someone on hands and knees, seen from the side, head to the left (dir -1) or right (dir 1). */
function crouching(x: number, dir: 1 | -1): Stroke[] {
  const f = (n: number) => x + n * dir
  return [
    { d: `M${f(-55)},515 L${f(55)},515` },
    { d: ring(f(72), 506, 15) },
    { d: `M${f(64)},515 C${f(68)},510 ${f(76)},510 ${f(80)},515` },
    { d: `M${f(50)},515 L${f(56)},590 M${f(38)},515 L${f(32)},590` },
    { d: `M${f(-55)},515 L${f(-50)},588 L${f(-95)},588` },
  ]
}

// Climbing on others: someone stands on two people's backs to reach the crown.
const CLIMB: Stroke[] = [
  FRAME,
  ...crouching(640, -1),
  ...crouching(860, 1),
  { d: 'M690,513 L750,425 L810,513' },
  { d: 'M750,425 V335' },
  { d: ring(750, 310, 24) },
  { d: 'M741,304 v4 M759,304 v4' },
  { d: 'M738,316 C744,326 756,326 762,316' },
  { d: 'M750,356 L796,262 M750,356 L714,300' },
  { d: 'M786,236 L780,202 L800,216 L812,192 L824,216 L844,202 L838,236 Z', accent: true },
  { d: 'M866,198 l16,-8 M864,222 h18' },
]

// Lifting someone up: one person stands and reaches down; the other, sitting on the ground, reaches up. The hands meet.
const LIFT: Stroke[] = [
  { d: 'M460,700 H1140' },
  { d: ring(720, 440, 26) },
  { d: 'M708,446 C714,454 726,454 732,446' },
  { d: 'M722,466 L716,590' },
  { d: 'M690,700 L716,590 L742,700' },
  { d: 'M719,500 L686,566' },
  { d: 'M719,500 L826,556', accent: true },
  { d: ring(912, 566, 24) },
  { d: 'M904,584 L922,660' },
  { d: 'M922,660 L1010,672 L1026,700 M922,660 L980,700' },
  { d: 'M910,606 L838,560', accent: true },
  { d: ring(832, 558, 11), accent: true },
]

/** A plate seen from above; a full plate has a big fried egg on it, an empty one is just the plate. */
const plate = (x: number, full: boolean): Stroke[] => {
  const y = 560
  const k = 1.5
  return [
    { d: ring(x, y, 100) },
    ...(full
      ? [
        { d: `M${x - 46 * k},${y - 6 * k} C${x - 50 * k},${y - 40 * k} ${x - 6 * k},${y - 50 * k} ${x + 12 * k},${y - 34 * k} C${x + 40 * k},${y - 38 * k} ${x + 52 * k},${y - 4 * k} ${x + 34 * k},${y + 14 * k} C${x + 30 * k},${y + 44 * k} ${x - 14 * k},${y + 46 * k} ${x - 26 * k},${y + 28 * k} C${x - 48 * k},${y + 26 * k} ${x - 52 * k},${y + 10 * k} ${x - 46 * k},${y - 6 * k} Z` },
        { d: ring(x - 3, y - 3, 13), accent: true, w: 24 },
      ]
      : []),
  ]
}

const fish = (x: number, y: number): Stroke[] => [
  { d: `M${x},${y} C${x + 40},${y - 32} ${x + 100},${y - 32} ${x + 130},${y} C${x + 100},${y + 32} ${x + 40},${y + 32} ${x},${y} Z`, accent: true },
  { d: `M${x + 130},${y} L${x + 165},${y - 22} L${x + 158},${y} L${x + 165},${y + 22} Z`, accent: true },
]

const tick = (x: number, y: number, hour: number, r0: number, r1: number) => {
  const a = (hour / 12) * Math.PI * 2
  return `M${x + Math.sin(a) * r0},${y - Math.cos(a) * r0} L${x + Math.sin(a) * r1},${y - Math.cos(a) * r1}`
}

/** A full trash bag standing on the ground (y), tied at the top. */
const bag = (x: number, y = 720, s = 1): Stroke[] => {
  const k = (n: number) => n * s
  return [
    { d: `M${x - k(62)},${y} C${x - k(86)},${y - k(60)} ${x - k(66)},${y - k(132)} ${x - k(22)},${y - k(150)} H${x + k(22)} C${x + k(66)},${y - k(132)} ${x + k(86)},${y - k(60)} ${x + k(62)},${y} Z` },
    { d: `M${x - k(22)},${y - k(150)} L${x - k(30)},${y - k(172)} M${x + k(22)},${y - k(150)} L${x + k(30)},${y - k(172)}` },
    { d: `M${x - k(30)},${y - k(70)} C${x - k(10)},${y - k(80)} ${x + k(14)},${y - k(60)} ${x + k(34)},${y - k(74)}`, soft: true },
  ]
}

/** A street trash can, 90 tall; open ones have the lid off on the ground and rubbish sticking out of the top. */
const bin = (x: number, open = false): Stroke[] => [
  { d: `M${x - 46},720 L${x - 40},630 H${x + 40} L${x + 46},720 Z`, fill: '#a9b2b6' },
  { d: `M${x - 16},640 V710 M${x + 16},640 V710`, soft: true },
  ...(open
    ? [
      { d: `M${x - 28},630 l8,-16 l9,12 l9,-18 l9,14 l9,-10 l8,18` },
    ]
    : [
      { d: `M${x - 50},630 H${x + 50} M${x - 40},630 C${x - 32},612 ${x + 32},612 ${x + 40},630` },
      { d: `M${x - 10},616 C${x - 10},606 ${x + 10},606 ${x + 10},616` },
    ]),
]

/** A full black rubbish bag for the pile: a round lumpy body, the plastic gathered into a neck and tied in a knot with two ears. */
const blackBag = (x: number, y: number, s: number, tilt = 0): Stroke[] => {
  const k = (n: number) => n * s
  const n = x + k(tilt) // the neck leans a little to one side
  return [
    { d: `M${x - k(72)},${y} C${x - k(100)},${y - k(36)} ${x - k(86)},${y - k(92)} ${x - k(34)},${y - k(108)} C${n - k(16)},${y - k(116)} ${n - k(8)},${y - k(122)} ${n - k(7)},${y - k(132)} L${n + k(7)},${y - k(132)} C${n + k(8)},${y - k(122)} ${n + k(16)},${y - k(116)} ${x + k(34)},${y - k(108)} C${x + k(86)},${y - k(92)} ${x + k(100)},${y - k(36)} ${x + k(72)},${y} C${x + k(40)},${y + k(10)} ${x + k(10)},${y + k(4)} ${x - k(8)},${y + k(8)} C${x - k(30)},${y + k(12)} ${x - k(54)},${y + k(6)} ${x - k(72)},${y} Z`, fill: '#2b2b2b', color: '#111' },
    { d: `M${n - k(4)},${y - k(134)} C${n - k(26)},${y - k(156)} ${n - k(40)},${y - k(144)} ${n - k(22)},${y - k(134)} Z M${n + k(4)},${y - k(134)} C${n + k(24)},${y - k(160)} ${n + k(40)},${y - k(150)} ${n + k(20)},${y - k(134)} Z`, fill: '#2b2b2b', color: '#111' },
    { d: `M${n - k(4)},${y - k(124)} C${x - k(18)},${y - k(100)} ${x - k(30)},${y - k(84)} ${x - k(40)},${y - k(62)} M${n + k(4)},${y - k(124)} C${x + k(14)},${y - k(104)} ${x + k(22)},${y - k(90)} ${x + k(30)},${y - k(70)} M${n},${y - k(122)} C${x - k(2)},${y - k(100)} ${x - k(4)},${y - k(86)} ${x - k(6)},${y - k(70)}`, color: '#5e5e5e', w: 1.6 },
    { d: `M${x - k(70)},${y - k(30)} C${x - k(72)},${y - k(58)} ${x - k(60)},${y - k(80)} ${x - k(42)},${y - k(92)}`, color: '#a3a3a3', w: 2 },
  ]
}

const fly = (x: number, y: number): Stroke => ({ d: `${ring(x, y, 3)} M${x - 3},${y - 3} c-7,-9 -14,-2 -7,3 M${x + 3},${y - 3} c7,-9 14,-2 7,3` })

/** Someone bent over, reaching down into a bag; facing right (dir 1) or left (dir -1). Older people get a cane. */
function stooping(x: number, dir: 1 | -1, s: number, old = false, y = 720, head = 1): Stroke[] {
  const k = (n: number) => n * s
  const f = (n: number) => x + k(n) * dir
  return [
    { d: `M${f(-12)},${y} L${x},${y - k(62)} L${f(12)},${y}` },
    { d: old ? `M${x},${y - k(62)} C${f(6)},${y - k(98)} ${f(34)},${y - k(108)} ${f(46)},${y - k(98)}` : `M${x},${y - k(62)} L${f(42)},${y - k(102)}` },
    { d: ring(f(58), y - k(100), k(15) * head) },
    { d: `M${f(52)},${y - k(103)} v${k(2)} M${f(63)},${y - k(103)} v${k(2)}` },
    { d: `M${f(52)},${y - k(92)} C${f(55)},${y - k(96)} ${f(61)},${y - k(96)} ${f(64)},${y - k(92)}` },
    { d: `M${f(38)},${y - k(96)} L${f(72)},${y - k(50)}` },
    ...(old ? [{ d: `M${f(30)},${y - k(92)} L${f(10)},${y - k(60)}` }, { d: `M${f(10)},${y - k(60)} V${y}`, color: BROWN, w: 5 }] : []),
  ]
}

/** A small child standing, sad, with a big head and short body (a child, not a small adult). */
const kid = (x: number, y = 720): Stroke[] => [
  { d: ring(x, y - 66, 22) },
  { d: `M${x - 8},${y - 70} v3 M${x + 8},${y - 70} v3` },
  { d: `M${x - 8},${y - 56} C${x - 4},${y - 61} ${x + 4},${y - 61} ${x + 8},${y - 56}` },
  { d: `M${x},${y - 44} V${y - 20}` },
  { d: `M${x - 10},${y} L${x},${y - 20} L${x + 10},${y}` },
  { d: `M${x - 14},${y - 26} L${x},${y - 38} L${x + 14},${y - 26}` },
]

/** A grandparent standing hunched over a cane, sad; facing right (dir 1) or left (dir -1). */
function elder(x: number, dir: 1 | -1, y = 720): Stroke[] {
  const f = (n: number) => x + n * dir
  return [
    { d: ring(f(14), y - 128, 17) },
    { d: `M${f(6)},${y - 132} v3 M${f(20)},${y - 132} v3` },
    { d: `M${f(7)},${y - 118} C${f(10)},${y - 123} ${f(18)},${y - 123} ${f(21)},${y - 118}` },
    { d: `M${f(2)},${y - 140} C${f(10)},${y - 150} ${f(24)},${y - 148} ${f(30)},${y - 136}`, soft: true },
    { d: `M${f(6)},${y - 111} C${f(-6)},${y - 90} ${f(-4)},${y - 70} ${f(0)},${y - 56}` },
    { d: `M${f(-12)},${y} L${f(0)},${y - 56} L${f(12)},${y}` },
    { d: `M${f(2)},${y - 96} L${f(26)},${y - 70}` },
    { d: `M${f(26)},${y - 70} V${y}`, color: BROWN, w: 5 },
  ]
}

/** A missionary in a white shirt: tie and name tag, one arm held out with a plate. */
function missionary(x: number, dir: 1 | -1): Stroke[] {
  const f = (n: number) => x + n * dir
  return [
    { d: ring(x, 592, 20) },
    { d: `M${x},612 V658` },
    { d: `M${x - 16},700 L${x},658 L${x + 16},700` },
    { d: `M${x},624 L${f(48)},612 M${x},624 L${f(-22)},652` },
    { d: `M${x - 5},616 L${x},640 L${x + 5},616 Z`, accent: true },
    { d: `M${x + 5},626 h11 v7 h-11 Z`, soft: true },
  ]
}

const servedPlate = (x: number): Stroke[] => [
  { d: ring(x, 612, 26, 7), accent: true },
  { d: ring(x, 609, 4), accent: true, w: 5 },
]

/** Draws a small scene 1.6 times bigger around (800, 700); its strokes are drawn thinner (width 2.5) so they look the usual thickness. */
const Big = ({ children }: { children: ReactElement }) => (
  <g transform="translate(800 700) scale(1.6) translate(-800 -700)">{children}</g>
)

/** A fuller person in colour, feet on (x, y), s = size: skin-coloured head, a shirt and trousers. Arms are added by the scene. */
function figure(x: number, y: number, s: number, shirt: string, pants: string): Stroke[] {
  const k = (n: number) => n * s
  return [
    { d: `M${x - k(26)},${y - k(110)} H${x + k(26)} L${x + k(22)},${y} H${x + k(4)} L${x},${y - k(70)} L${x - k(4)},${y} H${x - k(22)} Z` },
    { d: `M${x - k(34)},${y - k(200)} H${x + k(34)} L${x + k(30)},${y - k(110)} H${x - k(30)} Z` },
    { d: ring(x, y - k(232), k(28)) },
  ]
}

/** A plate with a fried egg, held out at (x, y). */
const heldPlate = (x: number, y: number): Stroke[] => [
  { d: ring(x, y, 36, 10) },
  { d: ring(x, y - 2, 18, 6) },
  { d: ring(x, y - 3, 6, 3), accent: true },
]

/** Someone walking towards a house with a lit candle held out in front (dir 1 right, -1 left). */
function candleBearer(x: number, dir: 1 | -1): Stroke[] {
  const f = (n: number) => x + n * dir
  return [
    { d: ring(x, 720 - 77, 14) },
    { d: `M${x},${720 - 63} V${720 - 31}` },
    { d: `M${x - 12},720 L${x},${720 - 31} L${x + 12},720` },
    { d: `M${x},${720 - 56} L${f(-16)},${720 - 34}` },
    { d: ring(f(34), 720 - 104, 26), fill: '#fbe7a6', soft: true },
    { d: `M${x},${720 - 56} L${f(28)},${720 - 64}` },
    { d: `M${f(28)},${720 - 92} h12 v34 h-12 Z`, fill: '#ffffff' },
    { d: `M${f(34)},${720 - 92} v-6` },
    { d: `M${f(34)},${720 - 98} C${f(26)},${720 - 108} ${f(28)},${720 - 120} ${f(34)},${720 - 128} C${f(40)},${720 - 120} ${f(42)},${720 - 108} ${f(34)},${720 - 98} Z`, accent: true, fill: '#f6d365' },
  ]
}

/** A street: two houses, and an apartment building. With the power on the windows glow yellow; off, they are dark and the moon is out. */
/** `candlelit`: a few dark windows glow orange, where people have brought candles. */
function city(on: boolean, candlelit: string[] = []): Stroke[] {
  const win = on ? '#f6d365' : '#2b3550'
  const w = (x: number, y: number, sw = 36, sh = 36): Stroke => ({ d: `M${x},${y} h${sw} v${sh} h${-sw} Z`, fill: candlelit.includes(`${x},${y}`) ? '#f2a33a' : win })
  const house = (x: number): Stroke[] => [
    { d: `M${x},720 V600 H${x + 140} V720` },
    { d: `M${x - 15},600 L${x + 70},530 L${x + 155},600 Z` },
    w(x + 20, 630), w(x + 85, 630),
    { d: `M${x + 55},720 V672 H${x + 85} V720` },
  ]
  return [
    { d: 'M380,720 H1220', soft: true },
    ...house(460),
    { d: 'M680,720 V450 H860 V720 Z' },
    ...[470, 530, 590, 650].flatMap((y) => [702, 752, 802].map((x) => w(x, y))),
    ...house(920),
    ...(on
      ? []
      : [
        { d: 'M1100,430 C1060,440 1052,500 1096,520 C1070,492 1072,452 1100,430 Z', fill: '#f2e6b8' },
        { d: 'M600,470 l3,8 l8,0 l-6,5 l2,8 l-7,-5 l-7,5 l2,-8 l-6,-5 l8,0 Z M1100,480 l3,8 l8,0 l-6,5 l2,8 l-7,-5 l-7,5 l2,-8 l-6,-5 l8,0 Z', soft: true },
      ]),
  ]
}

const SKETCHES = {
  leader: () => <Parts parts={LEADER} />,
  fight: () => <Parts parts={FIGHT} />,
  think: () => <Parts parts={THINK} />,
  fame: () => <Parts parts={FAME} />,
  power: () => <Parts parts={POWER} />,
  money: () => <Parts parts={MONEY} />,
  climb: () => <Strokes list={CLIMB} start={0.2} />,
  lift: () => <Strokes list={LIFT} />,
  // a path across the page: someone walks from the left, following His footsteps towards Him (His full photo) on the right
  path: () => (
    <>
      <G delay={0.5} dur={0.9}>
        <rect x={1030} y={380} width={250} height={370} className="sheet" />
        <image href="/christlike/jesus.jpg" x={1038} y={388} width={234} height={354} preserveAspectRatio="xMidYMid slice" />
      </G>
      <Strokes
        start={0.2}
        list={[
          { d: 'M400,690 C560,670 700,700 840,676 C920,662 980,660 1010,656' },
          { d: 'M400,746 C560,726 700,756 840,732 C920,718 980,716 1010,712' },
          ...[[620, 708], [700, 718], [780, 706], [860, 696], [940, 690]].map(([x, y]) => ({ d: ring(x, y, 11, 6), soft: true })),
          ...person(500, 716, 1.1),
        ]}
      />
    </>
  ),
  // a month on the wall: the days gone by are ticked, today is circled
  calendar: () => {
    const col = (c: number) => 620 + c * (360 / 7)
    const done = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [0, 1], [1, 1], [2, 1]]
    return (
      <Strokes
        start={0.3}
        list={[
          { d: 'M620,420 H980 V720 H620 Z' },
          { d: 'M700,396 V440 M900,396 V440' },
          { d: 'M620,480 H980', w: 6 },
          { d: [540, 600, 660].map((y) => `M620,${y} H980`).join(' ') + ' ' + [1, 2, 3, 4, 5, 6].map((c) => `M${col(c)},480 V720`).join(' '), soft: true, w: 3 },
          ...done.map(([c, r]) => ({ d: `M${col(c) + 15},${512 + r * 60} l9,10 l16,-20`, w: 3.5 })),
          { d: ring(col(3) + 25.7, 570, 22, 22), accent: true, w: 5 },
        ]}
      />
    )
  },
  // the flag of Venezuela, with its seven stars, drawn in ink and coloured in
  flag: () => {
    const star = (cx: number, cy: number, r: number) =>
      Array.from({ length: 10 }, (_, k) => {
        const a = -Math.PI / 2 + (k * Math.PI) / 5
        const rr = k % 2 ? r * 0.42 : r
        return `${k ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`
      }).join(' ') + ' Z'
    const stars = Array.from({ length: 7 }, (_, k) => {
      const a = Math.PI * (1.12 + (k * 0.76) / 6)
      return star(800 + Math.cos(a) * 74, 328 + Math.sin(a) * 40, 10)
    })
    return (
      <>
        <G delay={0.1} dur={0.6}>
          <rect x={560} y={200} width={480} height={64} fill="#f2c230" />
          <rect x={560} y={264} width={480} height={64} fill="#1f4fa3" />
          <rect x={560} y={328} width={480} height={64} fill="#c8102e" />
          {stars.map((d) => <path key={d} d={d} fill="#fff" />)}
        </G>
        <D d="M560,200 H1040 V392 H560 Z" width={4} delay={0} dur={0.6} />
      </>
    )
  },
  fullPlates: () => <Strokes list={[...plate(500, true), ...plate(800, true), ...plate(1100, true)]} />,
  // the photo of Jesus, framed, on the right of the words
  jesus: () => (
    <G delay={0.3} dur={0.9}>
      <rect x={1010} y={150} width={400} height={602} className="sheet" />
      <image href="/christlike/jesus.jpg" x={1020} y={160} width={380} height={572} preserveAspectRatio="xMidYMid slice" />
    </G>
  ),
  // me as a missionary, framed in the middle
  missionaryPhoto: () => (
    <G delay={0.2} dur={0.9}>
      <rect x={572} y={62} width={456} height={776} className="sheet" />
      <image href="/christlike/missionary.jpg" x={582} y={72} width={436} height={756} preserveAspectRatio="xMidYMid slice" />
    </G>
  ),
  // a photo of collapsed buildings and the people searching the rubble
  rubblePhoto: () => (
    <G delay={0.2} dur={0.9}>
      <rect x={110} y={170} width={1380} height={616} className="sheet" />
      <image href="/christlike/rubble.webp" x={120} y={180} width={1360} height={596} preserveAspectRatio="xMidYMid slice" />
    </G>
  ),
  // a photo of the volunteers in yellow vests who came to help
  helpersPhoto: () => (
    <G delay={0.2} dur={0.9}>
      <rect x={366} y={105} width={868} height={690} className="sheet" />
      <image href="/christlike/volunteers.jpg" x={376} y={115} width={848} height={670} preserveAspectRatio="xMidYMid slice" />
    </G>
  ),
  // a photo of the warehouse piled high with the donated bags
  donationsPhoto: () => (
    <G delay={0.2} dur={0.9}>
      <rect x={386} y={105} width={828} height={690} className="sheet" />
      <image href="/christlike/donations.jpg" x={396} y={115} width={808} height={670} preserveAspectRatio="xMidYMid slice" />
    </G>
  ),
  // a photo with the elderly neighbours we helped
  neighboursPhoto: () => (
    <G delay={0.2} dur={0.9}>
      <rect x={340} y={105} width={920} height={690} className="sheet" />
      <image href="/christlike/neighbours.jpg" x={350} y={115} width={900} height={670} preserveAspectRatio="xMidYMid slice" />
    </G>
  ),
  // an infinity sign under the words: always
  infinity: () => <Strokes width={6} list={[{ d: 'M800,690 C850,620 960,620 960,690 C960,760 850,760 800,690 C750,620 640,620 640,690 C640,760 750,760 800,690 Z', accent: true }]} start={0.9} />,
  // every circumstance: a sun for the good days and a rain cloud for the hard ones
  weather: () => (
    <Strokes width={5} start={0.9} list={[
      { d: ring(670, 680, 34), accent: true },
      ...Array.from({ length: 8 }, (_, k) => {
        const a = (k * Math.PI) / 4
        return { d: `M${670 + Math.cos(a) * 48},${680 + Math.sin(a) * 48} L${670 + Math.cos(a) * 66},${680 + Math.sin(a) * 66}`, accent: true }
      }),
      { d: 'M860,700 C830,700 830,660 862,658 C866,628 910,622 922,648 C940,630 976,644 970,670 C996,672 996,700 970,700 Z' },
      { d: 'M880,722 l-8,22 M914,722 l-8,22 M948,722 l-8,22', soft: true },
    ]} />
  ),
  // every place: the Earth from the Atlantic side, the Americas on the left and Europe and Africa on the right
  globe: () => (
    <Strokes width={4} start={0.9} list={[
      { d: ring(800, 640, 110), fill: '#d6e8f5', w: 5 },
      { d: ring(800, 640, 48, 110), soft: true, w: 2.5 },
      { d: 'M690,640 H910 M708,586 C770,600 830,600 892,586 M708,694 C770,680 830,680 892,694', soft: true, w: 2.5 },
      { d: 'M767,535 L769,535 L764,538 L762,540 L767,541 L771,543 L771,546 L765,554 L752,559 L752,569 L772,560 L773,568 L776,576 L761,582 L753,586 L743,592 L741,597 L732,602 L730,613 L729,605 L722,601 L713,604 L710,613 L716,617 L719,618 L716,627 L721,631 L719,640 L726,646 L723,645 L716,635 L711,627 L708,624 L703,613 L704,607 L707,592 L708,587 L710,581 L716,572 L726,561 L737,552 L747,544 L750,542 L758,538 Z', fill: '#a9cf8e' },
      { d: 'M786,541 L794,538 L801,538 L807,544 L808,550 L793,562 L787,559 L787,549 L789,543 Z', fill: '#a9cf8e' },
      { d: 'M726,646 L735,640 L751,647 L768,658 L772,668 L783,672 L800,678 L800,685 L793,695 L791,706 L778,712 L772,722 L766,726 L762,728 L761,733 L761,737 L765,741 L757,737 L751,731 L746,722 L744,713 L740,695 L730,687 L721,671 L722,662 Z', fill: '#a9cf8e' },
      { d: 'M832,627 L836,613 L839,606 L843,598 L862,592 L866,599 L877,599 L887,595 L891,599 L905,624 L907,620 L909,634 L906,653 L905,666 L897,685 L892,696 L881,710 L874,714 L876,708 L875,705 L877,690 L881,674 L876,662 L876,653 L870,651 L856,655 L850,658 L841,651 L833,641 Z', fill: '#a9cf8e' },
      { d: 'M839,596 L835,586 L843,583 L838,577 L842,572 L843,568 L841,562 L846,566 L849,565 L850,560 L847,556 L840,550 L831,546 L832,544 L834,544 L840,544 L854,550 L870,560 L875,570 L873,572 L875,580 L874,582 L875,590 L869,584 L867,589 L860,583 L854,581 L850,584 L849,595 Z', fill: '#a9cf8e' },
      { d: 'M835,574 L841,572 L840,569 L834,565 L831,563 L829,564 L832,569 L835,570 Z', fill: '#a9cf8e' },
      { d: ring(800, 640, 110), w: 5 },
    ]} />
  ),
  cityOn: () => <Strokes list={city(true)} />,
  cityOff: () => <Strokes list={city(false)} />,
  // the same dark street: people carry candles to the houses, and some windows glow again
  candles: () => <Strokes list={[...city(false, ['480,630', '545,630', '752,590', '802,650']), ...candleBearer(640, 1), ...candleBearer(895, 1)]} />,
  plates: () => <Strokes list={[...plate(500, true), ...plate(800, false), ...plate(1100, false)]} />,
  // trash cans on the street, with flies
  // a mountain of black rubbish bags, piled up unevenly on a dark heap that fills the gaps, with flies buzzing over it
  bags: () => {
    // [x, y, size, lean]: from the back and top of the pile down to the front, so the front bags cover the ones behind
    const heap: [number, number, number, number][] = [
      [800, 500, 0.42, 10], [748, 538, 0.46, -12], [858, 532, 0.44, 14],
      [690, 586, 0.5, -10], [790, 580, 0.52, 16], [900, 590, 0.48, -14],
      [630, 640, 0.52, 12], [730, 632, 0.56, -16], [842, 640, 0.54, 10], [950, 646, 0.5, -12],
      [560, 712, 0.5, -10], [660, 704, 0.58, 14], [772, 712, 0.6, -12], [884, 706, 0.56, 16], [1000, 714, 0.52, -14], [1080, 720, 0.4, 10],
    ]
    return (
      <Big>
        <Strokes width={2.5} list={[
          { d: 'M420,722 H1180', soft: true },
          { d: 'M560,722 C620,640 700,540 800,490 C900,540 980,640 1030,722 Z', fill: '#2b2b2b', soft: true },
          ...heap.flatMap(([x, y, k, t]) => blackBag(x, y, k, t)),
          fly(740, 440), fly(810, 404), fly(880, 450), fly(660, 520), fly(960, 540), fly(700, 470), fly(915, 410), fly(770, 380), fly(850, 370), fly(610, 580), fly(1010, 600), fly(1040, 560), fly(560, 640), fly(990, 480), fly(640, 450),
          { d: 'M770,380 c20,-18 40,8 60,-10 M960,540 c18,10 30,-12 50,0 M610,580 c-14,-20 -30,-4 -44,-22', soft: true },
        ]} />
      </Big>
    )
  },
  // children bent over the bags, looking for food
  children: () => (
    <Big><Strokes list={[{ d: 'M400,720 H1200', soft: true }, ...bin(650, true), ...bin(950, true), ...stooping(528, 1, 0.75, false, 720, 1.5), ...stooping(1072, -1, 0.75, false, 720, 1.5), ...kid(770), ...kid(830), fly(650, 580), fly(950, 570)]} width={2.5} /></Big>
  ),
  // grandparents bent over the bags, with their canes
  elders: () => (
    <Big><Strokes list={[{ d: 'M400,720 H1200', soft: true }, ...bin(650, true), ...bin(950, true), ...stooping(530, 1, 1.25, true), ...stooping(1070, -1, 1.25, true), ...elder(748, 1), ...elder(866, -1), fly(650, 580), fly(950, 570)]} width={2.5} /></Big>
  ),
  // my companion and I, missionaries in white shirts and ties, give our dinner to a child and to a grandfather
  dinner: () => (
    <Strokes
      width={3.5}
      list={[
        { d: 'M360,760 H1240', soft: true },
        ...figure(460, 760, 0.62, '#5aa0d8', '#3b4a6b'),
        { d: 'M478,646 L516,600 M442,646 L432,690' },
        ...figure(650, 760, 1, WHITE, '#2f3542'),
        { d: 'M644,562 L650,610 L656,562 Z' },
        { d: 'M664,575 h20 v9 h-20 Z' },
        { d: 'M618,570 L560,592 M682,570 L690,650' },
        ...heldPlate(532, 596),
        ...figure(950, 760, 1, WHITE, '#2f3542'),
        { d: 'M944,562 L950,610 L956,562 Z' },
        { d: 'M914,575 h20 v9 h-20 Z' },
        { d: 'M982,570 L1040,592 M918,570 L910,650' },
        ...heldPlate(1068, 596),
        ...figure(1150, 760, 0.95, '#8a6d4b', '#5b4a3a'),
        { d: 'M1120,580 L1090,600 M1180,582 L1204,650' },
        { d: 'M1204,650 L1214,760', w: 6, color: BROWN },
        { d: 'M1128,522 C1136,510 1164,510 1172,522', soft: true },
      ]}
    />
  ),
  // the blackouts: the light bulb is off, and half the clock is dark (twelve hours without light)
  clock: () => (
    <Strokes
      list={[
        { d: 'M600,640 C560,600 548,530 620,500 C692,530 680,600 640,640 Z' },
        { d: 'M604,640 H636 V676 H604 Z' },
        { d: 'M600,520 L640,610 M640,520 L600,610', soft: true },
        { d: ring(940, 570, 120) },
        { d: 'M940,570 L940,450 A120,120 0 0,1 940,690 Z' },
        ...Array.from({ length: 12 }, (_, h) => ({ d: tick(940, 570, h, 104, 118) })),
        { d: 'M940,570 L940,486 M940,570 L1000,606', w: 5 },
      ]}
    />
  ),
  candle: () => <Icon name="candle" x={800} y={560} size={2.4} delay={0.5} />,
  loaves: () => (
    <Strokes
      list={[
        ...[[560, 520], [680, 506], [800, 522], [620, 600], [740, 604]].map(([x, y]) => ({ d: ring(x, y, 52, 28) })),
        ...fish(900, 520),
        ...fish(920, 610),
      ]}
    />
  ),
  heart: () => <Icon name="heart" x={800} y={540} size={2.6} accent delay={0.5} />,
  basin: () => (
    <Strokes
      list={[
        { d: ring(740, 520, 150, 30) },
        { d: 'M590,520 C605,615 875,615 890,520' },
        { d: 'M695,608 L685,642 H795 L785,608' },
        { d: 'M650,522 q25,-8 50,0 t50,0 t50,0', accent: true },
        { d: 'M960,470 H1060 V612 Q1010,637 960,612 Z' },
        { d: 'M982,470 V605', soft: true },
      ]}
    />
  ),
  // a big L and a small l
  small: () => (
    <Strokes
      list={[
        { d: 'M620,400 V664 H820', soft: true, w: 16 },
        { d: 'M980,520 V650 Q980,666 996,660', accent: true, w: 12 },
      ]}
    />
  ),
  // one candle lights another
  share: () => (
    <>
      <Icon name="candle" x={680} y={560} size={2.2} delay={0.4} />
      <Icon name="candle" x={920} y={590} size={1.8} delay={1.2} />
      <D d="M700,420 C760,390 860,420 916,470" accent width={3} delay={1} dur={0.8} />
    </>
  ),
  many: () => (
    <>
      {[460, 570, 680, 790, 900, 1010, 1120].map((x, i) => (
        <Icon key={x} name="candle" x={x} y={580 + (i % 2) * 30} size={1.2} delay={0.3 + i * 0.2} speed={0.5} />
      ))}
    </>
  ),
  // someone at the start of the road, looking ahead
  ahead: () => (
    <Strokes
      list={[
        ...person(660, 668, 1.3),
        { d: 'M780,560 H1020 M992,534 L1020,560 L992,586', accent: true },
      ]}
    />
  ),
} satisfies Record<string, () => ReactElement>

export type SketchName = keyof typeof SKETCHES

export const Sketch = ({ name }: { name: SketchName }) => SKETCHES[name]()
