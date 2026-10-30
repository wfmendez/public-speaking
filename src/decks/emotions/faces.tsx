import { D, G } from '../../components/Draw'

/**
 * Our own hand-drawn emoji, shared by the slides and the printed sheets (so they look the same
 * on every computer and still read well on a black-and-white printer). Each face lives in a 200×200 box.
 */

export const FEELINGS = [
  'happy', 'delighted', 'excited', 'relaxed',
  'sad', 'disappointed', 'worried', 'scared',
  'terrified', 'annoyed', 'angry', 'furious',
  'bored', 'tired', 'surprised', 'embarrassed',
] as const
export type Feeling = (typeof FEELINGS)[number]

/**
 * One mark of a face: a pen stroke unless it has a `fill`; `bare` paints without an outline.
 * `eye` is an open eye (it can blink); `loose` sits off the head, so the 3D faces show it as a moving object instead.
 */
type Mark = { d: string; width?: number; fill?: string; bare?: boolean; eye?: [number, number, number]; loose?: boolean }

/** Who is on a slide in 3D: where (slide coordinates, as on a 1600×900 slide), how big, and from which click. */
export type Part = { name: Feeling; x: number; y: number; size: number; at?: number }
/** `row`: a word per click. `pair`: two faces compared; `winner` celebrates on the click. `climb`: each newcomer frightens the rest. `wave`: everybody together. */
export type Scene = { parts: Part[]; play: 'solo' | 'row' | 'pair' | 'climb' | 'wave'; winner?: number }

const INK = '#2c2a27'
const SKIN = '#ffdd66'
const FLUSHED = '#ff9a6a'
const TEAR = '#7cc4ee'
const BLUSH = '#f59a9a'
const MOUTH = '#8a3b2a'
const TONGUE = '#f2867e'
const WHITE = '#ffffff'

const HEAD = 'M100,15 C147,13 186,52 186,100 C187,148 148,186 100,186 C53,187 14,148 14,100 C13,53 53,16 100,15 Z'

const oval = (x: number, y: number, rx: number, ry = rx) =>
  `M${x - rx},${y} a${rx},${ry} 0 1,0 ${2 * rx},0 a${rx},${ry} 0 1,0 ${-2 * rx},0 Z`
const dot = (x: number, y: number, r = 7): Mark => ({ d: oval(x, y, r), fill: INK, bare: true, eye: [x, y, r + 6] })
const eye = (x: number, y: number, rx: number, ry: number): Mark[] => [{ d: oval(x, y, rx, ry), fill: WHITE, eye: [x, y, rx] }, { d: oval(x, y + 2, 6), fill: INK, bare: true, eye: [x, y, 0] }]
const drop = (x: number, y: number): Mark => ({ d: `M${x},${y} C${x - 10},${y + 20} ${x - 12},${y + 30} ${x},${y + 32} C${x + 12},${y + 30} ${x + 10},${y + 20} ${x},${y} Z`, fill: TEAR, loose: true })
const star = (x: number, y: number, r: number): Mark => {
  const points = Array.from({ length: 10 }, (_, i) => {
    const a = (i * Math.PI) / 5 - Math.PI / 2
    const k = i % 2 ? r * 0.45 : r
    return `${(x + Math.cos(a) * k).toFixed(1)},${(y + Math.sin(a) * k).toFixed(1)}`
  })
  return { d: `M${points.join(' L')} Z`, fill: '#f08a24' }
}
const COLD = { d: 'M60,36 V58 M80,26 V54 M100,22 V52 M120,26 V54 M140,36 V58', width: 3 }

const MARKS: Record<Feeling, Mark[]> = {
  happy: [dot(68, 84), dot(132, 84), { d: 'M60,122 Q100,164 140,122' }],
  delighted: [
    { d: 'M52,90 Q68,66 84,90' }, { d: 'M116,90 Q132,66 148,90' },
    { d: 'M48,112 Q100,124 152,112 Q148,172 100,172 Q52,172 48,112 Z', fill: WHITE }, { d: 'M51,134 Q100,144 149,134', width: 3 },
  ],
  excited: [
    star(68, 84, 23), star(132, 84, 23),
    { d: 'M54,118 Q100,128 146,118 Q140,174 100,174 Q60,174 54,118 Z', fill: MOUTH }, { d: 'M76,160 Q100,140 124,160 Q100,180 76,160 Z', fill: TONGUE, bare: true },
  ],
  relaxed: [{ d: 'M54,84 Q68,98 82,84' }, { d: 'M118,84 Q132,98 146,84' }, { d: 'M72,128 Q100,150 128,128' }],
  sad: [
    { d: 'M52,70 L82,56' }, { d: 'M148,70 L118,56' }, dot(68, 86), dot(132, 86),
    { d: 'M66,146 Q100,112 134,146' }, drop(146, 104),
  ],
  disappointed: [
    { d: 'M50,74 L84,62' }, { d: 'M150,74 L116,62' }, { d: 'M54,94 Q68,104 82,94' }, { d: 'M118,94 Q132,104 146,94' },
    { d: 'M74,144 Q100,126 126,144' },
  ],
  worried: [
    { d: 'M52,74 L82,58' }, { d: 'M148,74 L118,58' }, dot(68, 92, 8), dot(132, 92, 8),
    { d: 'M64,140 Q82,122 100,138 T136,134' }, drop(164, 50),
  ],
  scared: [
    COLD, ...eye(68, 92, 17, 19), ...eye(132, 92, 17, 19),
    { d: 'M70,154 Q100,112 130,154 Q100,142 70,154 Z', fill: MOUTH },
  ],
  terrified: [
    COLD, ...eye(70, 86, 19, 23), ...eye(130, 86, 19, 23),
    { d: 'M100,114 C126,114 128,178 100,178 C72,178 74,114 100,114 Z', fill: MOUTH },
    { d: 'M8,122 C2,98 20,92 32,106 L52,146 C54,178 18,178 8,122 Z', fill: SKIN, loose: true },
    { d: 'M192,122 C198,98 180,92 168,106 L148,146 C146,178 182,178 192,122 Z', fill: SKIN, loose: true },
  ],
  annoyed: [
    { d: 'M52,66 L84,74' }, { d: 'M148,66 L116,74' }, { d: 'M50,86 H88', width: 7 }, { d: 'M112,86 H150', width: 7 },
    dot(78, 94, 8), dot(140, 94, 8), { d: 'M72,140 Q100,128 132,138' },
  ],
  angry: [
    { d: 'M48,58 L86,80', width: 8 }, { d: 'M152,58 L114,80', width: 8 }, dot(70, 94), dot(130, 94),
    { d: 'M66,150 Q100,116 134,150' },
  ],
  furious: [
    { d: 'M44,54 L88,82', width: 10 }, { d: 'M156,54 L112,82', width: 10 }, dot(70, 96), dot(130, 96),
    { d: 'M58,126 H142 V158 H58 Z', fill: WHITE }, { d: 'M79,126 V158 M100,126 V158 M121,126 V158 M58,142 H142', width: 3 },
    { d: 'M2,44 q14,-10 8,-22 M20,34 q14,-10 8,-22', loose: true }, { d: 'M198,44 q-14,-10 -8,-22 M180,34 q-14,-10 -8,-22', loose: true },
  ],
  bored: [{ d: 'M52,88 H86', width: 7 }, { d: 'M114,88 H148', width: 7 }, { d: 'M72,138 H128' }],
  tired: [
    { d: 'M54,90 Q68,102 82,90' }, { d: 'M118,90 Q132,102 146,90' }, { d: oval(100, 142, 14, 18), fill: MOUTH },
    { d: 'M164,14 h18 l-18,20 h18', width: 4, loose: true }, { d: 'M186,-2 h13 l-13,14 h13', width: 3, loose: true },
  ],
  surprised: [
    { d: 'M50,60 Q68,44 86,60' }, { d: 'M114,60 Q132,44 150,60' }, ...eye(68, 90, 14, 16), ...eye(132, 90, 14, 16),
    { d: oval(100, 144, 17, 21), fill: MOUTH },
  ],
  embarrassed: [
    { d: oval(44, 118, 19, 12), fill: BLUSH, bare: true }, { d: oval(156, 118, 19, 12), fill: BLUSH, bare: true },
    ...eye(70, 84, 15, 17), ...eye(130, 84, 15, 17), { d: 'M82,142 Q91,132 100,142 T118,142' },
  ],
}

export const skinOf = (name: Feeling) => (name === 'furious' ? FLUSHED : SKIN)

/** The face as a square picture to wrap on a 3D ball (the head fills the square). `blink` closes the eyes. */
export function paintFace(name: Feeling, blink = false) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1024
  const g = canvas.getContext('2d')!
  g.fillStyle = skinOf(name)
  g.fillRect(0, 0, 1024, 1024)
  const k = 1024 / 172
  g.setTransform(k, 0, 0, k, -14 * k, -14 * k)
  g.lineCap = g.lineJoin = 'round'
  g.strokeStyle = INK
  for (const m of MARKS[name]) {
    if (m.loose) continue
    if (blink && m.eye) {
      const [x, y, r] = m.eye
      if (r) {
        g.lineWidth = 5
        g.beginPath()
        g.moveTo(x - r, y)
        g.quadraticCurveTo(x, y + 6, x + r, y)
        g.stroke()
      }
      continue
    }
    const path = new Path2D(m.d)
    if (m.fill) {
      g.fillStyle = m.fill
      g.fill(path)
    }
    if (!m.bare) {
      g.lineWidth = m.width ?? 5
      g.stroke(path)
    }
  }
  return canvas
}

/** A finished face, for the printed sheets. */
export function Face({ name, size }: { name: Feeling; size: string }) {
  return (
    <svg viewBox="-4 -4 208 208" style={{ width: size, height: size, display: 'block' }} role="img" aria-label={name}>
      <path d={HEAD} fill={skinOf(name)} stroke={INK} strokeWidth={5} />
      {MARKS[name].map((m, i) => (
        <path
          key={i} d={m.d} fill={m.fill ?? 'none'} stroke={m.bare ? 'none' : INK}
          strokeWidth={m.width ?? 5} strokeLinecap="round" strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

/** A face that draws itself on a slide: the outline first, then the features. Centred on (x, y). */
export function DrawnFace({ name, x, y, size = 1, at = 0, delay = 0 }: {
  name: Feeling; x: number; y: number; size?: number; at?: number; delay?: number
}) {
  return (
    <g transform={`translate(${x - 100 * size} ${y - 100 * size}) scale(${size})`}>
      <G at={at} delay={delay + 0.25} dur={0.5}><path d={HEAD} fill={skinOf(name)} /></G>
      <D d={HEAD} at={at} delay={delay} dur={0.6} width={5} />
      {MARKS[name].map((m, i) => (m.fill ? (
        <G key={i} at={at} delay={delay + 0.5 + i * 0.05} dur={0.3}>
          <path d={m.d} fill={m.fill} stroke={m.bare ? 'none' : INK} strokeWidth={m.width ?? 5} strokeLinejoin="round" />
        </G>
      ) : (
        <D key={i} d={m.d} at={at} delay={delay + 0.5 + i * 0.05} dur={0.3} width={m.width ?? 5} />
      )))}
    </g>
  )
}
