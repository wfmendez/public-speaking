/** What the garden shows on one screen; each value eases towards the next screen's. */
export type Stage = {
  /** where the base of the plant sits on the 1600×900 slide, and how close the camera is */
  x: number
  ground: number
  zoom: number
  /** 0 = the seed lies on the ground, 1 = it is buried */
  buried: number
  soil: number
  roots: number
  /** 0 = nothing above ground, 1 = a full tree */
  tree: number
  fruit: number
  forest: number
  wind: number
  rain: 'none' | 'drops' | 'storm'
  /** the fruit falls and leaves new seeds */
  drop: boolean
  /** the roots light up */
  glow: boolean
}

export type Scene = { lines: string[]; over?: string; top?: boolean; stage: Stage }

const start: Stage = { x: 1120, ground: 640, zoom: 5, buried: 0, soil: 0, roots: 0, tree: 0, fruit: 0, forest: 0, wind: 0, rain: 'none', drop: false, glow: false }

let stage = start
/** A screen: its words, and only what changes in the garden since the last one. */
const screen = (lines: string[], change: Partial<Stage> = {}, extra: Pick<Scene, 'over' | 'top'> = {}): Scene => {
  stage = { ...stage, ...change }
  return { lines, stage, ...extra }
}

/** The talk, 6 words or fewer per screen. The garden follows it across the slides. */
export const SCENES: Scene[] = [
  screen(['A goal is', 'like a seed']),
  screen(['It starts', 'small'], { zoom: 1, ground: 720 }),

  screen(['Plant it'], { zoom: 3, ground: 560, buried: 1 }, { over: 'One' }),
  screen(['Choose', 'one goal']),
  screen(['Give it', 'a date']),
  screen(['Good people', 'are like soil'], { soil: 1 }),

  screen(['Water it'], { rain: 'drops' }, { over: 'Two' }),
  screen(['Small habits', 'are like water'], { roots: 0.12 }),

  screen(['Nothing', 'happens'], { rain: 'none' }, { over: 'Three' }),
  screen(['Progress is like roots'], { x: 800, ground: 250, zoom: 2.1, roots: 0.7 }, { top: true }),
  screen(['Keep watering'], { rain: 'drops', roots: 0.9 }, { top: true }),
  screen(['Then it', 'breaks through'], { x: 1180, ground: 640, zoom: 2.5, rain: 'none', tree: 0.05 }),

  screen(['Hard days are', 'like storms'], { rain: 'storm', wind: 1, tree: 0.08 }, { over: 'Four' }),
  screen(['Roots hold'], { ground: 400, zoom: 1.7, wind: 0.45, glow: true, roots: 1 }),

  screen(['It grows'], { x: 1180, ground: 770, zoom: 1, rain: 'none', wind: 0, tree: 1, glow: false }, { over: 'Five' }),
  screen(['Success is', 'like fruit'], { fruit: 1 }),
  screen(['Fruit holds', 'new seeds'], { drop: true }),
  screen(['One seed.', 'Many trees.'], { forest: 1 }),
  screen(['What will', 'you plant?']),
  screen(['Thank you']),
]
