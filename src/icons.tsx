import { D } from './components/Draw'

/** Hand-drawn icons, each a list of strokes inside a 100×100 box centred on (0,0). */
export const ICONS = {
  ring: [
    'M-26,12 a26,26 0 1,0 52,0 a26,26 0 1,0 -52,0',
    'M-12,-14 L0,-32 L12,-14 L0,-6 Z',
  ],
  briefcase: [
    'M-40,-14 H40 V36 H-40 Z',
    'M-14,-14 V-27 H14 V-14',
    'M-40,6 H40',
  ],
  shop: [
    'M-42,-20 L-34,-40 H34 L42,-20 Z',
    'M-42,-20 q10.5,12 21,0 q10.5,12 21,0 q10.5,12 21,0 q10.5,12 21,0',
    'M-36,-12 V40 H36 V-12',
    'M-10,40 V12 H10 V40',
  ],
  cap: [
    'M0,-30 L46,-12 L0,6 L-46,-12 Z',
    'M-26,-3 V18 Q0,32 26,18 V-3',
    'M46,-12 V16',
  ],
  coins: [
    'M-30,-22 a30,10 0 1,0 60,0 a30,10 0 1,0 -60,0',
    'M-30,-22 V28 a30,10 0 0,0 60,0 V-22',
    'M-30,-2 a30,10 0 0,0 60,0',
    'M-30,13 a30,10 0 0,0 60,0',
  ],
  candle: [
    'M-14,-4 H14 V46 H-14 Z',
    'M0,-4 V-13',
    'M0,-15 C-11,-25 -7,-38 0,-48 C7,-38 11,-25 0,-15 Z',
  ],
  globe: [
    'M-40,0 a40,40 0 1,0 80,0 a40,40 0 1,0 -80,0',
    'M0,-40 a16,40 0 1,0 0,80 a16,40 0 1,0 0,-80',
    'M-40,0 H40',
    'M-34,-20 H34 M-34,20 H34',
  ],
  school: [
    'M-46,-14 L0,-42 L46,-14 Z',
    'M-40,-14 V36 H40 V-14',
    'M-22,-4 V28 M0,-4 V28 M22,-4 V28',
    'M-48,42 H48',
  ],
  heart: ['M0,36 C-52,4 -40,-40 0,-16 C40,-40 52,4 0,36 Z'],
  light: [
    'M-15,0 a15,15 0 1,0 30,0 a15,15 0 1,0 -30,0',
    'M0,-26 V-42 M0,26 V42 M-26,0 H-42 M26,0 H42 M-19,-19 L-30,-30 M19,19 L30,30 M19,-19 L30,-30 M-19,19 L-30,30',
  ],
  calendar: [
    'M-36,-28 H36 V40 H-36 Z',
    'M-36,-12 H36 M-18,-38 V-20 M18,-38 V-20',
    'M-26,6 l6,7 l10,-13 M2,6 l6,7 l10,-13 M-26,28 l6,7 l10,-13',
  ],
  book: [
    'M0,-24 C-14,-34 -34,-34 -46,-28 V30 C-34,24 -14,24 0,34 C14,24 34,24 46,30 V-28 C34,-34 14,-34 0,-24 Z',
    'M0,-24 V34',
  ],
  stairs: ['M-48,40 H-24 V18 H0 V-4 H24 V-26 H48', 'M10,-42 L32,-42 M24,-50 L32,-42 L24,-34'],
  flag: ['M-18,44 V-44', 'M-18,-44 H30 L20,-31 L30,-18 H-18'],
  cross: ['M-38,-36 L38,38', 'M36,-38 L-36,36'],
  check: ['M-16,0 L-4,13 L20,-16'],
} as const

export type IconName = keyof typeof ICONS

export function Icon({
  name, x, y, size = 1, at = 0, delay = 0, until, accent, soft, speed = 0.7,
}: {
  name: IconName; x: number; y: number; size?: number; at?: number; delay?: number
  until?: number; accent?: boolean; soft?: boolean; speed?: number
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      {ICONS[name].map((d, i) => (
        <D
          key={i} d={d} at={at} until={until} accent={accent} soft={soft}
          width={3.6 / size} delay={delay + i * speed * 0.6} dur={speed}
        />
      ))}
    </g>
  )
}
