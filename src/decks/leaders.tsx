import { D, T } from '../components/Draw'
import type { SlideDef } from '../deck'

// The tower: level 1 at the bottom (widest), level 5 at the top.
const LEVELS = ['Stability', 'Skills', 'Work', 'Mentor', 'Leader']
const block = (i: number) => {
  const w = 640 - i * 100
  const top = 770 - (i + 1) * 104
  return { x: 800 - w / 2, w, top, mid: top + 52 }
}
const blockPath = (i: number) => {
  const { x, w, top } = block(i)
  return `M${x},${top} H${x + w} V${top + 92} H${x} Z`
}

/** The 5-level tower; `labels` writes the level names, `teach` draws the "teaches the level below" arrows. */
function Tower({ at = 0, step = false, labels = false, teach }: {
  at?: number; step?: boolean; labels?: boolean; teach?: number
}) {
  return (
    <>
      {LEVELS.map((name, i) => {
        const b = block(i)
        const levelAt = step ? at + i : at
        return (
          <g key={name}>
            <D d={blockPath(i)} at={levelAt} delay={step ? 0 : i * 0.35} dur={0.7} accent={i === 4} width={5} />
            {labels && (
              <T x={800} y={b.mid + 18} size={50} at={levelAt} delay={step ? 0.5 : 0.6 + i * 0.35} accent={i === 4}>
                {i + 1} · {name}
              </T>
            )}
            {teach !== undefined && i > 0 && (
              <>
                <D
                  d={`M${b.x + b.w + 14},${b.mid} C${b.x + b.w + 110},${b.mid} ${b.x + b.w + 130},${b.mid + 104} ${block(i - 1).x + block(i - 1).w + 14},${b.mid + 104}`}
                  accent at={teach} delay={(4 - i) * 0.5} dur={0.6} width={4}
                />
                <D
                  d={`M${block(i - 1).x + block(i - 1).w + 34},${b.mid + 92} L${block(i - 1).x + block(i - 1).w + 14},${b.mid + 104} L${block(i - 1).x + block(i - 1).w + 34},${b.mid + 116}`}
                  accent at={teach} delay={(4 - i) * 0.5 + 0.5} dur={0.2} width={4}
                />
              </>
            )}
          </g>
        )
      })}
    </>
  )
}

const Label = ({ children }: { children: string }) => (
  <T x={800} y={110} size={56} accent weight={600}>{children}</T>
)

export const slides: SlideDef[] = [
  // 1 · Blank, then the title and the tower
  {
    steps: 1,
    Slide: () => (
      <>
        <T x={800} y={130} size={100} weight={600} at={1}>
          Homeless to <tspan style={{ fill: 'var(--accent)' }}>Leaders</tspan>
        </T>
        <Tower at={1} />
      </>
    ),
  },

  // 2 · Purpose: what problem are we solving?
  {
    steps: 0,
    Slide: () => (
      <>
        <Label>Purpose</Label>
        <T x={800} y={430} size={104} delay={0.6}>No ladder out of homelessness.</T>
        <D d="M520,500 C700,520 900,486 1080,506" accent width={5} delay={1.6} dur={0.7} />
      </>
    ),
  },

  // 3 · People: who will benefit?
  {
    steps: 0,
    Slide: () => (
      <>
        <Label>People</Label>
        <T x={800} y={400} size={104} delay={0.6}>Homeless people.</T>
        <T x={800} y={540} size={84} delay={1.4}>Their families. Our community.</T>
      </>
    ),
  },

  // 4 · How: 5 levels, one per click; then each level teaches the one below
  {
    steps: 5,
    Slide: () => (
      <>
        <T x={800} y={110} size={64} until={5}>5 levels</T>
        <T x={800} y={110} size={64} at={5} delay={0.3} accent weight={600}>Finish a level, teach it.</T>
        <Tower at={0} step labels teach={5} />
      </>
    ),
  },

  // 5 · Vision: what will the world look like if we succeed?
  {
    steps: 0,
    Slide: () => (
      <>
        <Label>Vision</Label>
        <T x={800} y={400} size={110} delay={0.6}>Every student</T>
        <T x={800} y={540} size={110} delay={1.4} accent weight={600}>becomes a teacher.</T>
      </>
    ),
  },

  // 6 · Plan: the first 3 steps
  {
    steps: 2,
    Slide: () => (
      <>
        <Label>Plan</Label>
        {['1 · Partner with a shelter', '2 · Pilot level 1', '3 · Train first mentors'].map((t, i) => (
          <T key={t} x={420} y={340 + i * 150} size={84} anchor="start" at={i}>{t}</T>
        ))}
      </>
    ),
  },
]
