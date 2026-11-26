import './christlike.css'
import { useContext, type CSSProperties } from 'react'
import { D, StepContext, T } from '../../components/Draw'
import type { SlideDef } from '../../deck'
import { Sketch, type SketchName } from './Sketches'

// "What Christlike Leadership Means", told as a journey, in pencil on paper (the style of the first talk).
// The script is in SCRIPT.md; the author's notes in NOTES.md.

/**
 * How a screen sets out its words:
 * top = words at the top and a drawing under them · center = a question alone in the middle ·
 * panel = a framed comic panel with the words written under it.
 */
type Layout = 'top' | 'center' | 'panel'

/** `then`: one more line, in orange, written in on the next click of the same screen. */
/** `ink`: the main lines in another colour (e.g. red). */
/** `wait`: the main lines come in on the next click; first only the drawing and the over-line. With `then` too, the orange line comes one click later. */
/** `x`: where the words are centred across the screen (800 = the middle). */
type Scene = { lines: string[]; x?: number; over?: string; overSize?: number; layout?: Layout; sketch?: SketchName; then?: string; wait?: boolean; shift?: number; cross?: boolean; check?: boolean; keys?: string[]; ink?: string }

const screen = (lines: string[], o: Omit<Scene, 'lines'> = {}): Scene => ({ lines, ...o })

/** The talk, 6 words or fewer per screen. SCRIPT.md says what to say on each one. */
export const SCENES: Scene[] = [
  // a light start: everybody wants to lead, we even fight over it… but why?
  screen(['Everybody wants to lead, right?'], { layout: 'panel', sketch: 'leader' }),
  screen(['Sometimes we even fight for it.'], { layout: 'panel', sketch: 'fight' }),
  screen(['Why do I want to lead?'], { layout: 'panel', sketch: 'think' }),

  // what many leaders want: one desire per panel, then the question behind them
  screen(['Fame and applause?'], { layout: 'panel', sketch: 'fame' }),
  screen(['Power and authority?'], { layout: 'panel', sketch: 'power' }),
  screen(['Money and riches?'], { layout: 'panel', sketch: 'money' }),
  screen(['Or a greater purpose?'], { layout: 'center', keys: ['greater', 'purpose'] }),
  // the greater purpose: one we're destined for, one that fulfills us, one that stays remarkable
  screen(["A purpose we’re", "destined for."], { layout: 'center', keys: ['purpose', 'destined'] }),
  screen(['A purpose that', 'fulfills us.'], { layout: 'center', keys: ['purpose', 'fulfills'] }),
  screen(['A purpose that', 'stays remarkable.'], { layout: 'center', keys: ['purpose', 'remarkable'] }),

  // what leadership really is
  screen(['So… what is it?'], { layout: 'center' }),
  screen(['Serve others.'], { layout: 'center', then: 'Serve God.' }),
  screen(['This is what', 'Christlike means.'], { layout: 'center', sketch: 'jesus', x: 540 }),
  // discipleship: we are on a road, learning to lead the way He did
  screen(['Following Jesus,', 'learning to lead.'], { sketch: 'path' }),
  screen(['Who can I lift?'], { sketch: 'lift' }),
  screen(['Every day,', 'an opportunity'], { sketch: 'calendar' }),

  // my road
  screen(['The worst time.'], { over: 'Venezuela', overSize: 96, layout: 'center', sketch: 'flag', wait: true, shift: 202, then: 'The best time.' }),
  // what normal looks like, then what it became
  screen(['Three meals,', 'every day.'], { sketch: 'fullPlates' }),
  screen(['One meal.'], { sketch: 'plates' }),
  screen([], { sketch: 'missionaryPhoto' }),
  screen([], { sketch: 'bags' }),
  screen(['We gave our dinner.'], { sketch: 'dinner' }),
  screen(['Love in action.'], { sketch: 'heart' }),
  // the blackouts: the street with the power on, then the same street dark
  screen([], { sketch: 'cityOn' }),
  screen([], { sketch: 'cityOff' }),

  // what the road taught me
  screen(['One candle', 'lights another'], { sketch: 'candles' }),
  // what we don't need: each click crosses one out with a red X
  screen(['Riches.', 'Power.', 'Authority.'], { layout: 'center', cross: true }),
  screen(['Love in action.'], { sketch: 'heart' }),
  screen([], { sketch: 'rubblePhoto' }),
  screen([], { sketch: 'helpersPhoto' }),
  screen([], { sketch: 'donationsPhoto' }),
  screen([], { sketch: 'neighboursPhoto' }),
  // what we do need: each click puts a green tick beside one
  screen(['Love.', 'Faith.', 'Hope.'], { layout: 'center', check: true }),
  screen(['This is what', 'Christlike leadership means.'], { layout: 'center', keys: ['christlike', 'leadership', 'means'] }),
  screen(['Christlike means', 'always ready to serve.'], { layout: 'center', keys: ['always', 'ready', 'to', 'serve'], sketch: 'infinity', shift: -70 }),
  screen(['In every', 'circumstance.'], { layout: 'center', keys: ['circumstance'], sketch: 'weather', shift: -70 }),
  screen(['In every place.'], { layout: 'center', keys: ['place'], sketch: 'globe', shift: -60 }),
  screen(['For everyone.'], { layout: 'center', then: "We don’t have enemies." }),
  screen(['Leadership', 'with a small l'], { sketch: 'small' }),

  // the best time
  screen(['The worst time.'], { layout: 'center', then: 'The best time.' }),
  // the worst person is crossed out, then the best person is written in
  screen(['The worst person.'], { layout: 'center', cross: true, then: 'The best person.' }),
  screen(['Because Jesus', 'chose you.'], { layout: 'center', keys: ['chose', 'you'] }),
  // Isaiah 6:8: the answer to being chosen
  screen(['ISAIAH'], { layout: 'center', then: 'Here am I; send me.', ink: '#d0021b' }),

  // the close
  screen(['What kind', 'of leader?'], { sketch: 'ahead' }),
  screen(['A leader like', 'Jesus Christ.'], { layout: 'center', sketch: 'jesus', x: 540 }),
  screen(['Thank you', 'for leading like Christ.'], { layout: 'center', keys: ['like', 'christ'] }),
]

/** A line of words; the key words (scene.keys, matched by their start) are written in orange. */
const marked = (line: string, keys?: string[]) =>
  !keys ? line : line.split(' ').map((w, i) => (
    <tspan key={i} style={keys.some((k) => w.toLowerCase().startsWith(k)) ? { fill: 'var(--accent)' } : undefined}>{(i ? ' ' : '') + w}</tspan>
  ))

/** The words of a screen, written in by hand. */
function Words({ scene }: { scene: Scene }) {
  const { over, overSize = 54, layout = 'top', then, wait, shift = 0, x = 800 } = scene
  // the extra line counts from the start, so the first lines don't move when it arrives
  const lines = then ? [...scene.lines, then] : scene.lines
  if (layout === 'panel') return <T x={800} y={740} size={92} delay={0.4}>{lines[0]}</T>
  const size = layout === 'center' ? 134 : 112
  const gap = size * 1.08
  // centre the block (over-line included) in the middle of the screen, or keep it at the top
  const first = layout === 'center'
    ? 470 - ((lines.length - 1) * gap) / 2 + (over ? 40 : 0) + shift
    : over ? 230 : 190
  return (
    <>
      {over && <T x={x} y={first - size * (overSize > 54 ? 1.05 : 0.95)} size={overSize} accent>{over}</T>}
      {scene.cross && scene.lines.map((l, i) => {
        const y = first + i * gap - size * 0.32
        const half = l.length * size * 0.17
        return (
          <g key={`x${i}`} style={{ '--ink': '#d0021b' } as CSSProperties}>
            <D d={`M${x - half},${y - size * 0.4} L${x + half},${y + size * 0.4}`} at={i + 1} width={10} dur={0.35} />
            <D d={`M${x + half},${y - size * 0.4} L${x - half},${y + size * 0.4}`} at={i + 1} width={10} delay={0.2} dur={0.35} />
          </g>
        )
      })}
      {scene.check && lines.map((l, i) => {
        const y = first + i * gap - size * 0.3
        const a = x - l.length * size * 0.2 - 90
        return (
          <g key={`v${i}`} style={{ '--ink': '#2e9e4f' } as CSSProperties}>
            <D d={`M${a},${y} L${a + 24},${y + 28} L${a + 68},${y - 34}`} at={i + 1} width={12} dur={0.4} />
          </g>
        )
      })}
      {lines.map((l, i) => l === then
        ? <T key={l} x={x} y={first + i * gap} size={size} at={wait ? 2 : scene.cross ? scene.lines.length + 1 : 1} accent>{l}</T>
        : <g key={l} style={scene.ink ? { '--ink': scene.ink } as CSSProperties : undefined}><T x={x} y={first + i * gap} size={size} at={wait ? 1 : 0} delay={wait ? 0 : (over ? 0.3 : 0) + i * 0.5}>{marked(l, scene.keys)}</T></g>)}
    </>
  )
}

// Everything on a screen is drawn 15% bigger around the centre, so words and drawings fill more of the projector.
const Screen = ({ scene }: { scene: Scene }) => (
  <g transform="translate(800 450) scale(1.15) translate(-800 -450)">
    {scene.sketch && <Sketch name={scene.sketch} />}
    <Words scene={scene} />
  </g>
)

export const slides: SlideDef[] = SCENES.map((scene, i): SlideDef => i === 0
  ? {
    // blank paper while the speaker walks up; the first click brings the first drawing
    steps: 1,
    Slide: () => (useContext(StepContext) >= 1 ? <Screen scene={scene} /> : null),
  }
  : { steps: scene.cross || scene.check ? scene.lines.length + (scene.then ? 1 : 0) : scene.then && scene.wait ? 2 : scene.then || scene.wait ? 1 : 0, Slide: () => <Screen scene={scene} /> })
