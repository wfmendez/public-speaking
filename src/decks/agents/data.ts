// Shared between the slides, the backdrop and the 3D world (kept apart so slides don't pull in Three.js).
import { SILENT, type Mix } from './music'

export const LOOP = ['Goal', 'Plan', 'Act', 'Check'] as const
export const TOOLS = [
  { icon: 'search', name: 'Search' },
  { icon: 'calendar', name: 'Calendar' },
  { icon: 'email', name: 'Email' },
  { icon: 'files', name: 'Files' },
  { icon: 'code', name: 'Code' },
]
export const EVERYDAY = [
  { icon: 'trip', name: 'Plan a trip' },
  { icon: 'inbox', name: 'Sort my inbox' },
  { icon: 'research', name: 'Research homework' },
  { icon: 'game', name: 'Build a game' },
]

/** Background of each slide: the blue LED wall or the light periwinkle page. */
export const SURFACE: ('dark' | 'light')[] = [
  'dark', 'light', 'dark', 'dark', 'dark', 'dark', 'dark', 'dark', 'dark', 'light', 'dark', 'dark', 'light', 'dark',
]

/** Small monospace labels in the corners (decoration, never needed to understand the slide). */
export const CHROME: [string, string][] = [
  ['opening · a song about agents', 'BOT-001 · online'],
  ['part 1 · what is an agent', 'BOT-001 · just now'],
  ['part 1 · the metaphor', 'mixer · 4 channels'],
  ['part 1 · the metaphor', 'crowd · live feedback'],
  ['part 2 · inside an agent', 'entering the agent'],
  ['part 2 · the loop', 'runs until done'],
  ['part 2 · tools', 'permissions required'],
  ['part 2 · memory', 'context window'],
  ['part 2 · compare', 'not to scale'],
  ['part 3 · your turn', 'hands up'],
  ['part 3 · everyday agents', 'already here'],
  ['part 4 · using agents well', 'rules.md · edited by you'],
  ['part 4 · the point', 'head of music: you'],
  ['part 4 · questions', 'BOT-001 · waiting for input'],
]

const TALK: Mix = { layers: { pad: 1, hat: 0.5, arp: 0.35 }, level: 0.2, cutoff: 1300 }
const FULL: Mix['layers'] = { kick: 1, hat: 1, clap: 0.8, bass: 1, pad: 1, arp: 0.6, stab: 0.7 }
const INSIDE: Mix = { layers: { pad: 1, bass: 0.7, kick: 0.6, hat: 0.4 }, level: 0.2, cutoff: 1500, half: true }

/**
 * What the music does on each slide/step. Loud when nobody is talking, soft under the voice.
 * null = leave it alone (the opening video drives the music itself).
 */
export function mixFor(slide: number, step: number): Mix | null {
  switch (slide) {
    case 0: return step === 0 ? SILENT : step === 1 ? null : TALK
    // the mixer slide: every fader the speaker "pushes up" adds a real layer to the music
    case 2: {
      const layers: Mix['layers'] = { pad: 1 }
      if (step >= 1) layers.hat = 1
      if (step >= 2) layers.bass = 1
      if (step >= 3) layers.arp = 0.8
      if (step >= 4) Object.assign(layers, { kick: 1, clap: 0.7 })
      return { layers, level: 0.32, cutoff: 9000 }
    }
    case 3: return { layers: FULL, level: 0.24, cutoff: 2200 }
    case 4: case 5: case 6: case 7: case 8: return INSIDE
    case 9: return { layers: { arp: 1, hat: 0.7, clap: 0.6, bass: 0.6 }, level: 0.22, cutoff: 4000 }
    case 10: return { ...INSIDE, layers: { ...INSIDE.layers, arp: 0.5 } }
    case 12: return { layers: FULL, level: 0.55, cutoff: 18000 }
    case 13: return { layers: { pad: 1, arp: 0.5 }, level: 0.2, cutoff: 2400 }
    default: return TALK
  }
}
