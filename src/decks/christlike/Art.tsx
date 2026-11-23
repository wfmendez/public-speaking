import type { CSSProperties, ReactElement } from 'react'

/*
 * Small line drawings under the words, in candle gold. Each one traces itself once when its screen
 * arrives (all done within about three seconds) and then stays still while the speaker talks.
 */

const time = (delay: number, dur: number) => ({ '--delay': `${delay}s`, '--dur': `${dur}s` }) as CSSProperties

type Tone = 'warm' | 'dim' | 'shade'

/** A stroke that draws itself. */
const L = ({ d, delay = 0, dur = 1, tone }: { d: string; delay?: number; dur?: number; tone?: Tone }) => (
  <path d={d} pathLength={1} className={tone ? `cd-draw ${tone}` : 'cd-draw'} style={time(delay, dur)} />
)

const ring = (x: number, y: number, rx: number, ry = rx) => `M${x - rx},${y} a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0`
/** A person: a head and shoulders standing on y + 72. */
const person = (x: number, y: number) => [ring(x, y, 14), `M${x - 24},${y + 72} C${x - 24},${y + 28} ${x + 24},${y + 28} ${x + 24},${y + 72}`]
/** A hand on a clock face at the given hour (0–12), from the centre out to r. */
const tick = (x: number, y: number, hour: number, r0: number, r1: number) => {
  const a = (hour / 12) * Math.PI * 2
  return `M${x + Math.sin(a) * r0},${y - Math.cos(a) * r0} L${x + Math.sin(a) * r1},${y - Math.cos(a) * r1}`
}
const fish = (x: number, y: number) => [
  `M${x},${y} C${x + 40},${y - 32} ${x + 100},${y - 32} ${x + 130},${y} C${x + 100},${y + 32} ${x + 40},${y + 32} ${x},${y} Z`,
  `M${x + 130},${y} L${x + 165},${y - 22} L${x + 158},${y} L${x + 165},${y + 22} Z`,
  ring(x + 30, y - 6, 4),
]

const ART = {
  // three plates: one served, two empty
  plates: () => (
    <g>
      {[200, 370, 540].map((x, i) => (
        <g key={x}>
          <L d={ring(x, 690, 64)} delay={0.3 + i * 0.3} tone={i ? 'dim' : undefined} />
          <L d={ring(x, 690, 40)} delay={0.45 + i * 0.3} tone={i ? 'dim' : undefined} />
        </g>
      ))}
    </g>
  ),
  // ten people, six of them hungry
  hungry: () => (
    <g>
      {Array.from({ length: 10 }, (_, i) => person(170 + i * 76, 640).map((d, j) => (
        <L key={`${i}-${j}`} d={d} delay={0.3 + i * 0.12} dur={0.6} tone={i < 6 ? 'warm' : 'dim'} />
      )))}
    </g>
  ),
  // an arepa and a mango
  arepa: () => (
    <g>
      <L d={ring(250, 690, 72)} delay={0.3} />
      {['M200,690 L250,640', 'M222,722 L282,662', 'M250,744 L300,694'].map((d, i) => <L key={d} d={d} delay={0.9 + i * 0.12} dur={0.4} />)}
      <L d="M470,620 C530,630 560,700 520,750 C480,790 410,760 420,700 C428,655 445,625 470,620 Z" delay={0.7} tone="warm" />
      <L d="M470,620 C480,595 505,585 525,590 C512,610 492,620 470,620 Z" delay={1.4} dur={0.5} tone="warm" />
    </g>
  ),
  // a line of people under the sun
  queue: () => (
    <g>
      <L d="M140,790 H960" delay={0.2} dur={0.8} tone="dim" />
      <L d={ring(900, 600, 30)} delay={0.3} tone="warm" />
      {Array.from({ length: 8 }, (_, i) => <L key={i} d={tick(900, 600, i * 1.5, 42, 58)} delay={0.9 + i * 0.05} dur={0.3} tone="warm" />)}
      {Array.from({ length: 7 }, (_, i) => person(190 + i * 90, 706).map((d, j) => <L key={`${i}-${j}`} d={d} delay={0.4 + i * 0.15} dur={0.6} />))}
    </g>
  ),
  // a phone with the message, and people running
  phone: () => (
    <g>
      <L d="M188,560 H302 A18,18 0 0 1 320,578 V802 A18,18 0 0 1 302,820 H188 A18,18 0 0 1 170,802 V578 A18,18 0 0 1 188,560 Z" delay={0.3} />
      <L d="M206,612 H290 A12,12 0 0 1 302,624 V650 A12,12 0 0 1 290,662 H222 L206,678 V624 A12,12 0 0 1 218,612" delay={0.9} dur={0.7} tone="warm" />
      <L d="M220,630 H284" delay={1.4} dur={0.3} tone="warm" />
      <L d="M220,646 H262" delay={1.5} dur={0.3} tone="warm" />
      {['M370,640 H440', 'M385,690 H475', 'M370,740 H440'].map((d, i) => <L key={d} d={d} delay={1.6 + i * 0.15} dur={0.4} tone="dim" />)}
    </g>
  ),
  // a clock that goes dark, hour by hour, all the way round
  clock: () => (
    <g>
      <L d={ring(300, 680, 110)} delay={0.2} />
      {Array.from({ length: 12 }, (_, h) => <L key={h} d={tick(300, 680, h, 96, 108)} delay={0.7 + h * 0.04} dur={0.2} />)}
      <L d="M300,608 A72,72 0 1,1 300,752 A72,72 0 1,1 300,608" delay={1} dur={2} tone="shade" />
    </g>
  ),
  // five loaves and two fish
  loaves: () => (
    <g>
      {[[180, 650], [290, 640], [400, 655], [235, 725], [345, 730]].map(([x, y], i) => (
        <g key={i}>
          <L d={ring(x, y, 46, 26)} delay={0.3 + i * 0.15} dur={0.7} />
          <L d={`M${x - 14},${y - 12} q8,12 0,24 M${x + 8},${y - 12} q8,12 0,24`} delay={0.8 + i * 0.15} dur={0.4} />
        </g>
      ))}
      {[[540, 650], [560, 735]].map(([x, y], i) => fish(x, y).map((d, j) => <L key={`${i}-${j}`} d={d} delay={1.2 + i * 0.3} dur={0.8} tone="warm" />))}
    </g>
  ),
  // a basin of water and a towel
  basin: () => (
    <g>
      <L d={ring(330, 650, 150, 30)} delay={0.3} />
      <L d="M180,650 C195,745 465,745 480,650" delay={0.6} />
      <L d="M285,738 L275,772 H385 L375,738" delay={0.9} dur={0.5} />
      <L d="M240,652 q25,-8 50,0 t50,0 t50,0" delay={1.2} dur={0.6} tone="warm" />
      <L d="M540,600 H640 V740 Q590,765 540,740 Z" delay={1.1} dur={0.8} />
      <L d="M562,600 V735" delay={1.6} dur={0.4} tone="dim" />
    </g>
  ),
  // five people the same size, holding hands
  equals: () => (
    <g>
      {Array.from({ length: 5 }, (_, i) => person(220 + i * 120, 640).map((d, j) => <L key={`${i}-${j}`} d={d} delay={0.3 + i * 0.15} dur={0.6} />))}
      {Array.from({ length: 4 }, (_, i) => <L key={i} d={`M${244 + i * 120},700 H${316 + i * 120}`} delay={1.2 + i * 0.12} dur={0.3} tone="warm" />)}
    </g>
  ),
  // a clock whose minute hand moves on a quarter of an hour
  quarter: () => (
    <g>
      <L d={ring(300, 670, 100)} delay={0.2} />
      {[0, 3, 6, 9].map((h) => <L key={h} d={tick(300, 670, h, 84, 98)} delay={0.6 + h * 0.03} dur={0.25} />)}
      <L d="M300,600 A70,70 0 0,1 370,670" delay={0.7} dur={1.5} tone="warm" />
      <g className="cd-hand"><L d="M300,670 V606" delay={0.4} dur={0.3} /></g>
      <L d="M300,670 L336,700" delay={0.5} dur={0.3} />
    </g>
  ),
} satisfies Record<string, () => ReactElement>

export type ArtName = keyof typeof ART

export const Art = ({ name }: { name: ArtName }) => ART[name]()
