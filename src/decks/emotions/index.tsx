import './emotions.css'
import { lazy, Suspense } from 'react'
import { D, G, T } from '../../components/Draw'
import type { SlideDef } from '../../deck'
import { DrawnFace, type Feeling, type Part, type Scene } from './faces'

// An English lesson: emotions through emojis, then comparatives. No sound: the teacher does the talking.

// Three.js is only downloaded when this lesson is opened.
const EmojiWorld = lazy(() => import('./World'))

const Title = ({ children }: { children: string }) => (
  <T x={800} y={120} size={84} accent weight={600}>{children}</T>
)

type Lesson = SlideDef & { scene?: Scene }

const ROW_X = [230, 610, 990, 1370]

/** Four emojis; each click writes one word, so the class can guess first. */
const faceRow = (title: string, feelings: Feeling[]): Lesson => ({
  steps: feelings.length,
  scene: { play: 'row', parts: feelings.map((name, i) => ({ name, x: ROW_X[i], y: 400, size: 1.3 })) },
  Slide: () => (
    <>
      <Title>{title}</Title>
      {feelings.map((f, i) => <T key={f} x={ROW_X[i]} y={660} size={76} at={i + 1}>{f}</T>)}
    </>
  ),
})

/** Rule lines, one per click, each with a small emoji beside it. */
const rule = (title: string, lines: [string, string, Feeling][], example: string): Lesson => ({
  steps: lines.length,
  scene: { play: 'solo', parts: lines.map(([, , name], i) => ({ name, x: 1190, y: 268 + i * 130, size: 0.56, at: i })) },
  Slide: () => (
    <>
      <Title>{title}</Title>
      {lines.map(([plain, hot], i) => (
        <T key={hot} x={800} y={300 + i * 130} size={96} at={i} delay={i === 0 ? 0.5 : 0}>
          {plain}<tspan style={{ fill: 'var(--accent)' }}>{hot}</tspan>
        </T>
      ))}
      <T x={800} y={760} size={70} at={lines.length}>{example}</T>
    </>
  ),
})

/** Two people to compare: the class says the sentence, the click writes it and the winner celebrates. */
const compare = (question: string, left: [string, Feeling], right: [string, Feeling], answer: string, winner: 0 | 1): Lesson => ({
  steps: 1,
  scene: { play: 'pair', winner, parts: [left, right].map(([, name], i) => ({ name, x: 520 + i * 560, y: 370, size: 1.3 })) },
  Slide: () => (
    <>
      <Title>{question}</Title>
      {[left, right].map(([who], i) => <T key={who} x={520 + i * 560} y={610} size={68} delay={0.9 + i * 0.3}>{who}</T>)}
      <T x={800} y={760} size={92} at={1} accent weight={600}>{answer}</T>
    </>
  ),
})

const STAIRS: Part[] = [
  { name: 'annoyed', x: 330, y: 590, size: 0.8, at: 0 },
  { name: 'angry', x: 780, y: 480, size: 1.05, at: 1 },
  { name: 'furious', x: 1250, y: 370, size: 1.35, at: 2 },
]
const GOODBYE: Feeling[] = ['delighted', 'relaxed', 'tired', 'surprised', 'excited']

const lesson: Lesson[] = [
  // 1 · Blank paper, then an emoji falls in and asks the question
  {
    steps: 1,
    scene: { play: 'solo', parts: [{ name: 'happy', x: 800, y: 350, size: 1.9, at: 1 }] },
    Slide: () => <T x={800} y={720} size={130} at={1} delay={0.9} weight={600}>How do you feel?</T>,
  },

  // 2 · Where the word comes from
  {
    steps: 2,
    Slide: () => (
      <>
        <Title>Emoji is Japanese</Title>
        <T x={500} y={400} size={170}>絵</T>
        <T x={800} y={390} size={120} delay={0.3}>+</T>
        <T x={1100} y={400} size={170} delay={0.5}>文字</T>
        <T x={500} y={560} size={100} at={1} accent weight={600}>e</T>
        <T x={500} y={670} size={84} at={1} delay={0.4}>picture</T>
        <T x={1100} y={560} size={100} at={2} accent weight={600}>moji</T>
        <T x={1100} y={670} size={84} at={2} delay={0.4}>character</T>
      </>
    ),
  },

  // 3-6 · The sixteen emotions (the same ones as the cards)
  faceRow('Feeling good', ['happy', 'delighted', 'excited', 'relaxed']),
  faceRow('Feeling down', ['sad', 'disappointed', 'bored', 'tired']),
  faceRow('Uh-oh!', ['worried', 'scared', 'terrified', 'embarrassed']),
  faceRow('Grrr… or wow!', ['annoyed', 'angry', 'furious', 'surprised']),

  // 7 · -ed is how you feel, -ing is what makes you feel that way
  {
    steps: 2,
    scene: { play: 'solo', parts: [{ name: 'bored', x: 420, y: 370, size: 1.2 }] },
    Slide: () => (
      <>
        <Title>-ed or -ing?</Title>
        <T x={420} y={610} size={84} delay={0.9}>I am bor<tspan style={{ fill: 'var(--accent)' }}>ed</tspan>.</T>
        <D d="M980,270 H1400 V470 H980 Z" at={1} dur={0.7} />
        <D d="M1030,330 H1340 M1030,380 H1290" at={1} delay={0.6} dur={0.5} soft />
        <T x={1190} y={610} size={84} at={1} delay={0.5}>This class is bor<tspan style={{ fill: 'var(--accent)' }}>ing</tspan>.</T>
        <T x={420} y={760} size={68} at={2}>how you feel</T>
        <T x={1190} y={760} size={68} at={2} delay={0.3}>what makes you feel it</T>
      </>
    ),
  },

  // 8 · The idea of a comparative
  compare('Who is happier?', ['Ana', 'happy'], ['Ben', 'delighted'], 'Ben is happier than Ana.', 1),

  // 9-11 · The rules
  rule('Short: add -er', [['calm', 'er', 'relaxed'], ['sad', 'der', 'sad'], ['happ', 'ier', 'delighted']], 'I am calmer today.'),
  rule('Long or -ed: more', [['', 'more excited', 'excited'], ['', 'more worried', 'worried'], ['', 'more annoyed', 'annoyed']], 'She is more worried than me.'),
  rule('Irregular', [['good → ', 'better', 'happy'], ['bad → ', 'worse', 'disappointed']], 'I feel better today.'),

  // 12 · Stronger and stronger: each newcomer frightens the rest, and furious shakes the screen
  {
    steps: 3,
    scene: { play: 'climb', parts: STAIRS },
    Slide: () => (
      <>
        <T x={800} y={120} size={84} accent weight={600} until={3}>Which is stronger?</T>
        <T x={800} y={120} size={84} accent weight={600} at={3} delay={0.3}>Furious is stronger than angry.</T>
        {STAIRS.map(({ name, x, y, size, at }) => <T key={name} x={x} y={y + 100 * size + 72} size={70} at={at} delay={0.7}>{name}</T>)}
      </>
    ),
  },

  // 13-15 · The class compares
  compare('Who is more scared?', ['Lily', 'terrified'], ['Sam', 'worried'], 'Lily is more scared than Sam.', 0),
  compare('Who is more tired?', ['Omar', 'tired'], ['Nina', 'relaxed'], 'Omar is more tired than Nina.', 0),
  compare('Who is angrier?', ['Lucia', 'furious'], ['Jay', 'annoyed'], 'Lucia is angrier than Jay.', 0),

  // 16 · The activity on the students' phones: they scan the code or type the link
  {
    steps: 0,
    Slide: () => (
      <>
        <Title>On your phone</Title>
        <G delay={0.4}><image href="/emotions/feel-qr.svg" x={590} y={190} width={420} height={420} /></G>
        <T x={800} y={720} size={84} delay={0.8} weight={600}>public-speaking-drab.vercel.app/feel</T>
      </>
    ),
  },

  // 17 · The same question as the first slide, with everybody doing the wave
  {
    steps: 0,
    scene: { play: 'wave', parts: GOODBYE.map((name, i) => ({ name, x: 260 + i * 270, y: 330, size: 1 })) },
    Slide: () => <T x={800} y={640} size={130} delay={1.8} weight={600}>How do you feel now?</T>,
  },
]

let webgl: boolean | undefined
const hasWebGL = () => {
  if (webgl === undefined) {
    try { webgl = !!document.createElement('canvas').getContext('webgl2') } catch { webgl = false }
  }
  return webgl
}

/** Without WebGL (an old computer) the emojis are the flat ones that draw themselves. */
const FlatCast = ({ scene }: { scene: Scene }) => (
  <>{scene.parts.map((p) => <DrawnFace key={p.name} {...p} delay={0.3} />)}</>
)

export const slides: SlideDef[] = lesson.map(({ steps, Slide, scene }) => ({
  steps,
  Slide: () => (
    <>
      {scene && !hasWebGL() && <FlatCast scene={scene} />}
      <Slide />
    </>
  ),
}))

export function EmotionsBackdrop({ slide, step }: { slide: number; step: number }) {
  if (!hasWebGL()) return null
  return <Suspense fallback={null}><EmojiWorld scene={lesson[slide].scene} step={step} /></Suspense>
}
