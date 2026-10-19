import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'

/** Current step of the slide being shown. -1 means "nothing revealed yet". */
export const StepContext = createContext(-1)

const useOn = (at: number) => useContext(StepContext) >= at

type Timing = { at?: number; delay?: number; dur?: number }

const timing = (delay = 0, dur = 1): CSSProperties =>
  ({ '--delay': `${delay}s`, '--dur': `${dur}s` }) as CSSProperties

/** A stroke that draws itself when its step is reached (and greys out at `until`). */
export function D({
  d, at = 0, delay = 0, dur = 1, accent, soft, flame, width = 4, until,
}: Timing & { d: string; accent?: boolean; soft?: boolean; flame?: boolean; width?: number; until?: number }) {
  const on = useOn(at)
  const dim = useOn(until ?? Infinity)
  const cls = ['draw', on && 'on', accent && 'accent', soft && 'soft', flame && 'flame', dim && 'dim']
  return (
    <path
      d={d}
      pathLength={1}
      className={cls.filter(Boolean).join(' ')}
      strokeWidth={width}
      style={timing(delay, dur)}
    />
  )
}

/** Handwritten text that wipes in from left to right (and wipes away at `until`). */
export function T({
  x, y, children, size = 80, at = 0, delay = 0, dur = 0.9, accent, anchor = 'middle', until, weight = 400,
}: Timing & {
  x: number; y: number; children: ReactNode; size?: number; accent?: boolean
  anchor?: 'start' | 'middle' | 'end'; until?: number; weight?: number
}) {
  const on = useOn(at)
  const gone = useOn(until ?? Infinity)
  const cls = ['write', on && !gone && 'on', accent && 'accent']
  return (
    <text
      x={x} y={y} fontSize={size} textAnchor={anchor} fontWeight={weight}
      className={cls.filter(Boolean).join(' ')}
      style={timing(gone ? 0 : delay, dur)}
    >
      {children}
    </text>
  )
}

/** A group that fades in at a step (and dims at `until`). */
export function G({
  at = 0, delay = 0, dur = 0.8, until, dimTo = 0.25, transform, children,
}: Timing & { until?: number; dimTo?: number; transform?: string; children: ReactNode }) {
  const on = useOn(at)
  const dim = useOn(until ?? Infinity)
  const cls = ['fade', on && 'on', dim && 'dim']
  return (
    <g
      className={cls.filter(Boolean).join(' ')}
      transform={transform}
      style={{ ...timing(delay, dur), '--dim': dimTo } as CSSProperties}
    >
      {children}
    </g>
  )
}
