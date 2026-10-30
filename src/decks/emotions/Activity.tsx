import '@fontsource/inter-tight/500.css'
import '@fontsource/inter-tight/700.css'
import './activity.css'
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { Face, FEELINGS, type Feeling } from './faces'
import { FORMS, MATCH_FACES, PAIRS, PICK, STRONGER } from './tasks'

/**
 * The lesson's activity on a phone, at /feel (about 4 minutes): match, fill in, tap the right emoji, climb
 * the ladder, and draw one emoji with a finger. A wrong tap can be tried again, but only a clean answer
 * scores. No account and nothing is sent anywhere: the last screen is what the student shows the teacher.
 */

type Fill = { kind: 'fill'; part: string; before: string; after: string; options: string[]; answer: string }
type Who = { kind: 'who'; part: string; left: [string, Feeling]; right: [string, Feeling]; question: string; winner: string; sentence: string }
type Step =
  | { kind: 'match'; part: string; faces: Feeling[] }
  | Fill
  | Who
  | { kind: 'order'; part: string; order: Feeling[] }

/** A task's answer callbacks: `tried` after each tap, `done` with the points when it is finished. */
type Play = { tried: (right: boolean) => void; done: (points: number) => void }

const shuffle = <T,>(items: T[]) => {
  const list = [...items]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}
const pick = <T,>(items: T[], n: number) => shuffle(items).slice(0, n)
const isFeeling = (w: string): w is Feeling => (FEELINGS as readonly string[]).includes(w)

const LADDERS = STRONGER.map((s) => s.order).filter((o) => o.every(isFeeling)) as Feeling[][]
const FORM_WORDS = ['happy', 'excited', 'bad']
const FEEL_MORE = ['happier', 'sadder', 'calmer', 'more excited', 'more tired', 'more worried']

const makeSteps = (): Step[] => [
  { kind: 'match', part: 'Match the emojis', faces: pick(MATCH_FACES, 4) },
  ...pick(PICK, 3).map(([before, a, b, after, answer]): Step => ({ kind: 'fill', part: '-ed or -ing?', before, after, options: [a, b], answer })),
  ...FORMS.filter(([w]) => FORM_WORDS.includes(w)).map(([word, answer, x, y]): Step => ({
    kind: 'fill', part: 'Make the comparative', before: `${word} →`, after: '', options: shuffle([answer, x, y]), answer,
  })),
  ...pick(PAIRS, 3).map(({ left, right, answer }): Step => {
    const [, winner, more] = answer.match(/^(\w+) is (.+) than/)!
    return { kind: 'who', part: 'Compare the emojis', left, right, question: `Who is ${more}?`, winner, sentence: answer }
  }),
  { kind: 'order', part: 'Which is stronger?', order: pick(LADDERS, 1)[0] },
]

const TOTAL = 14 // four pairs, then one point for each other answer
const after = (run: () => void) => window.setTimeout(run, 950)

/** Tap an emoji, tap its word (or the other way round). */
function Match({ step, tried, done }: Play & { step: Extract<Step, { kind: 'match' }> }) {
  const words = useMemo(() => shuffle(step.faces), [step])
  const [face, setFace] = useState<Feeling | null>(null)
  const [word, setWord] = useState<Feeling | null>(null)
  const [paired, setPaired] = useState<Feeling[]>([])
  const [shake, setShake] = useState(0)
  const misses = useRef(0)

  const check = (f: Feeling | null, w: Feeling | null) => {
    setFace(f)
    setWord(w)
    if (!f || !w) return
    const right = f === w
    tried(right)
    setFace(null)
    setWord(null)
    if (!right) {
      misses.current++
      setShake((n) => n + 1)
      return
    }
    const now = [...paired, f]
    setPaired(now)
    if (now.length === step.faces.length) after(() => done(Math.max(0, step.faces.length - misses.current)))
  }

  return (
    <>
      <p className="ac-hint">Tap an emoji, then its word.</p>
      <div className={`ac-board ${shake ? 'miss' : ''}`} key={shake}>
        <div className="ac-faces">
          {step.faces.map((f) => (
            <button key={f} className={`ac-facebtn ${face === f ? 'on' : ''} ${paired.includes(f) ? 'paired' : ''}`} disabled={paired.includes(f)} onClick={() => check(f, word)}>
              <Face name={f} size="68px" />
            </button>
          ))}
        </div>
        <div className="ac-words">
          {words.map((w) => (
            <button key={w} className={`ac-option ${word === w ? 'on' : ''} ${paired.includes(w) ? 'right' : ''}`} disabled={paired.includes(w)} onClick={() => check(face, w)}>{w}</button>
          ))}
        </div>
      </div>
    </>
  )
}

/** A sentence with a gap: the right word jumps into it. */
function FillIn({ step, tried, done }: Play & { step: Fill }) {
  const [wrong, setWrong] = useState<string[]>([])
  const [solved, setSolved] = useState(false)
  const tap = (o: string) => {
    const right = o === step.answer
    tried(right)
    if (!right) { setWrong([...wrong, o]); return }
    setSolved(true)
    after(() => done(wrong.length ? 0 : 1))
  }
  return (
    <>
      <p className="ac-line">
        {step.before} {solved ? <b className="ac-filled">{step.answer}</b> : <u>______</u>}{step.after}
      </p>
      <div className="ac-options">
        {step.options.map((o) => (
          <button key={o} className={`ac-option ${wrong.includes(o) ? 'wrong' : ''} ${solved ? (o === step.answer ? 'right' : 'off') : ''}`} disabled={solved || wrong.includes(o)} onClick={() => tap(o)}>{o}</button>
        ))}
      </div>
    </>
  )
}

/** Two people: tap the one the question is about, and it jumps. */
function WhoIs({ step, tried, done }: Play & { step: Who }) {
  const [wrong, setWrong] = useState<string[]>([])
  const [solved, setSolved] = useState(false)
  const tap = (who: string) => {
    const right = who === step.winner
    tried(right)
    if (!right) { setWrong([...wrong, who]); return }
    setSolved(true)
    after(() => done(wrong.length ? 0 : 1))
  }
  return (
    <>
      <p className="ac-line">{step.question}</p>
      <div className="ac-pair">
        {[step.left, step.right].map(([who, f]) => (
          <button key={who} className={`ac-facebtn ${solved && who === step.winner ? 'hop' : ''} ${wrong.includes(who) ? 'miss' : ''}`} disabled={solved || wrong.includes(who)} onClick={() => tap(who)}>
            <Face name={f} size="112px" /><span>{who}</span>
          </button>
        ))}
      </div>
      {solved && <p className="ac-said">{step.sentence}</p>}
    </>
  )
}

/** Tap the emojis from weak to strong: each one climbs to its step. */
function Ladder({ step, tried, done }: Play & { step: Extract<Step, { kind: 'order' }> }) {
  const mixed = useMemo(() => shuffle(step.order), [step])
  const [climbed, setClimbed] = useState<Feeling[]>([])
  const [shake, setShake] = useState<Feeling | null>(null)
  const misses = useRef(0)
  const tap = (f: Feeling) => {
    const right = f === step.order[climbed.length]
    tried(right)
    if (!right) {
      misses.current++
      setShake(f)
      window.setTimeout(() => setShake(null), 350)
      return
    }
    const now = [...climbed, f]
    setClimbed(now)
    if (now.length === step.order.length) after(() => done(misses.current ? 0 : 1))
  }
  return (
    <>
      <p className="ac-hint">Tap from <b>weak</b> to <b>strong</b>.</p>
      <div className="ac-ladder">
        {step.order.map((_, i) => (
          <span key={i} className="ac-rung">{climbed[i] && <i className="ac-climb"><Face name={climbed[i]} size={`${58 + i * 22}px`} /></i>}</span>
        ))}
      </div>
      <div className="ac-pair">
        {mixed.map((f) => (
          <button key={f} className={`ac-facebtn ${shake === f ? 'miss' : ''}`} disabled={climbed.includes(f)} style={{ opacity: climbed.includes(f) ? 0.2 : 1 }} onClick={() => tap(f)}>
            <Face name={f} size="82px" /><span>{f}</span>
          </button>
        ))}
      </div>
    </>
  )
}

/** One emoji drawn with a finger on a blank yellow face, and a sentence to go with it. */
function Draw({ finish }: { finish: (picture: string, word: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const last = useRef<[number, number] | null>(null)
  const [strokes, setStrokes] = useState(0)
  const [word, setWord] = useState('')

  const blank = () => {
    const g = canvas.current!.getContext('2d')!
    g.clearRect(0, 0, 600, 600)
    g.fillStyle = '#ffdd66'
    g.strokeStyle = '#2c2a27'
    g.lineWidth = 10
    g.beginPath()
    g.arc(300, 300, 285, 0, Math.PI * 2)
    g.fill()
    g.stroke()
    g.lineWidth = 16
    g.lineCap = g.lineJoin = 'round'
    setStrokes(0)
  }
  useEffect(blank, [])

  const at = (e: PointerEvent): [number, number] => {
    const box = canvas.current!.getBoundingClientRect()
    return [((e.clientX - box.left) / box.width) * 600, ((e.clientY - box.top) / box.height) * 600]
  }
  const line = (to: [number, number]) => {
    const g = canvas.current!.getContext('2d')!
    const from = last.current ?? to
    g.beginPath()
    g.moveTo(...from)
    g.lineTo(to[0] + 0.1, to[1])
    g.stroke()
    last.current = to
  }
  const down = (e: PointerEvent) => {
    canvas.current!.setPointerCapture(e.pointerId)
    last.current = null
    line(at(e))
    setStrokes((n) => n + 1)
  }
  const move = (e: PointerEvent) => { if (last.current) line(at(e)) }
  const up = () => { last.current = null }

  return (
    <>
      <p className="ac-hint">Draw how you feel today with your finger.</p>
      <canvas ref={canvas} className="ac-canvas" width={600} height={600} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
      <button className="ac-link" onClick={blank} disabled={!strokes}>Start again</button>
      <p className="ac-line small">Today I feel {word ? <b className="ac-filled">{word}</b> : <u>______</u>} than yesterday.</p>
      <div className="ac-chips">
        {FEEL_MORE.map((w) => <button key={w} className={`ac-option ${w === word ? 'right' : ''}`} onClick={() => setWord(w)}>{w}</button>)}
      </div>
      <button className="ac-next" disabled={!strokes || !word} onClick={() => finish(canvas.current!.toDataURL('image/png'), word)}>Finish</button>
    </>
  )
}

export default function EmotionsActivity() {
  const [round, setRound] = useState(0)
  const steps = useMemo(makeSteps, [round])
  const [name, setName] = useState('')
  const [at, setAt] = useState(-1)
  const [score, setScore] = useState(0)
  const [mood, setMood] = useState({ face: 'happy' as Feeling, cls: '', n: 0 })
  const [work, setWork] = useState<{ picture: string; word: string } | null>(null)

  useEffect(() => { document.title = 'How do you feel? Activity' }, [])
  useEffect(() => { scrollTo(0, 0) }, [at])

  const tried = (right: boolean) => setMood((m) => ({ face: right ? 'delighted' : 'worried', cls: right ? 'hop' : 'miss', n: m.n + 1 }))
  const done = (points: number) => {
    setScore((s) => s + points)
    setMood((m) => ({ face: 'happy', cls: '', n: m.n + 1 }))
    setAt((n) => n + 1)
  }
  const again = () => {
    setRound((r) => r + 1)
    setAt(0)
    setScore(0)
    setWork(null)
  }

  const step = steps[at]
  const play = { tried, done }
  const stepsLeft = steps.length + 1
  const share = score / TOTAL
  return (
    <main className="ac">
      {at >= 0 && !work && <div className="ac-bar"><i style={{ width: `${(at / stepsLeft) * 100}%` }} /></div>}
      {at < 0 && (
        <>
          <div className="ac-face"><Face name="happy" size="150px" /></div>
          <h1>How do you feel?</h1>
          <p className="ac-hint">Play with emotions and comparatives, then draw your own emoji. About 4 minutes.</p>
          <label className="ac-write">Your name<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" /></label>
          <button className="ac-next" onClick={() => setAt(0)}>Start</button>
        </>
      )}
      {step && (
        <>
          <div key={`mood${mood.n}`} className={`ac-mood ${mood.cls}`}><Face name={mood.face} size="64px" /></div>
          <p className="ac-part">{step.part}</p>
          {step.kind === 'match' && <Match key={at} step={step} {...play} />}
          {step.kind === 'fill' && <FillIn key={at} step={step} {...play} />}
          {step.kind === 'who' && <WhoIs key={at} step={step} {...play} />}
          {step.kind === 'order' && <Ladder key={at} step={step} {...play} />}
        </>
      )}
      {at === steps.length && !work && (
        <>
          <p className="ac-part">Your emoji</p>
          <Draw finish={(picture, word) => setWork({ picture, word })} />
        </>
      )}
      {work && (
        <>
          <img className="ac-drawn" src={work.picture} alt="The emoji you drew" />
          <p className="ac-said">Today I feel <b>{work.word}</b> than yesterday.</p>
          <h1>{share >= 0.7 ? 'Well done' : 'Good try'}{name.trim() ? `, ${name.trim()}` : ''}!</h1>
          <p className="ac-score">{score} / {TOTAL}</p>
          <p className="ac-hint">Show this screen to your teacher.</p>
          <button className="ac-next ghost" onClick={again}>Play again</button>
        </>
      )}
    </main>
  )
}
