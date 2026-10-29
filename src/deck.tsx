import type { ComponentType } from 'react'
import { G } from './components/Draw'

/** `steps` = extra clicks inside the slide before moving on. */
export type SlideDef = { steps: number; Slide: ComponentType }

export const Dot = ({ x, y, at = 0, delay = 0, accent }: { x: number; y: number; at?: number; delay?: number; accent?: boolean }) => (
  <G at={at} delay={delay} dur={0.4}>
    <circle cx={x} cy={y} r={9} style={{ fill: accent ? 'var(--accent)' : 'var(--ink)' }} />
  </G>
)

export type DeckDef = { path: string; title: string; minutes: number; accent?: string; slides: SlideDef[] }
