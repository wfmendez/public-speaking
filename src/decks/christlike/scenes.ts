import type { ArtName } from './Art'

/** How much candlelight a screen has: 0 = one unlit candle in the dark, 1 = it burns, 2 = it has lit a second one, 3 = a crowd of candles. */
export type Light = 0 | 1 | 2 | 3

export type Scene = {
  lines: string[]
  over?: string
  /** a line drawing under the words */
  art?: ArtName
  /** the first screen of a part: it comes up from black */
  part?: boolean
  light: Light
  /** the figure of Christ in light, behind the candles */
  christ: boolean
}

type Options = { over?: string; art?: ArtName; part?: boolean; light?: Light; christ?: boolean }

let light: Light = 0
let christ = true
/** A screen: its words, and the light and the figure, which stay as they are until a screen changes them. */
const screen = (lines: string[], o: Options = {}): Scene => {
  if (o.light !== undefined) light = o.light
  if (o.christ !== undefined) christ = o.christ
  return { lines, over: o.over, art: o.art, part: o.part, light, christ }
}

/** The talk, 6 words or fewer per screen. SCRIPT.md says what to say on each one. */
export const SCENES: Scene[] = [
  screen(['What Christlike', 'Leadership Means']),
  screen(['The worst time.'], { over: 'Venezuela', christ: false }),
  screen(['The worst time.', 'The best time.']),

  // hunger and queues
  screen(['Three meals:', 'a privilege'], { over: 'Caracas, 2016', art: 'plates', part: true }),
  screen(['Six in ten', 'slept hungry'], { over: '2017', art: 'hungry' }),
  screen(['Pumpkin arepas.', 'Mango dinners.'], { art: 'arepa' }),
  screen(['We queued', 'by ID number'], { art: 'queue' }),
  screen(['“The flour', 'is here!”'], { art: 'phone' }),
  screen(['Same queue.', 'Two kinds of people.']),

  // the blackouts, until the candle lights
  screen(['Two hours. Four.', 'Eight. Twelve.'], { art: 'clock', part: true }),
  screen(['Days in', 'the dark'], { over: '2019' }),
  screen(['So we lit', 'candles.'], { light: 1 }),

  // one: share the little
  screen(['Share', 'the little'], { over: 'One', part: true }),
  screen(['Five loaves.', 'Two fish.'], { art: 'loaves' }),
  screen(['Stretch the flour.', 'Stretch our love.']),

  // two: hope, even when hungry
  screen(['Hope, even', 'when hungry'], { over: 'Two', part: true }),
  screen(['He washed', 'their feet.'], { art: 'basin' }),

  // three: no money, no title
  screen(['No money.', 'No title.'], { over: 'Three', part: true }),
  screen(['Nobody was', 'the boss.'], { art: 'equals' }),
  screen(['One candle', 'lights another'], { light: 2 }),
  screen(['It loses', 'nothing.']),

  // the best time
  screen(['People became', 'the light.'], { light: 3 }),
  screen(['Every fifteen minutes,', 'someone new.'], { over: '2026', art: 'quarter' }),
  screen(['The best time.'], { over: 'Venezuela' }),

  // your candle: His light comes back
  screen(['Let your light', 'so shine'], { christ: true }),
  screen(['Not a spotlight.', 'A candle.']),
  screen(['Who is in', 'the dark?']),
  screen(['Thank you.']),
]
