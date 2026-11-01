import '@fontsource/bebas-neue/400.css'
import './goals.css'
import { useContext, type ReactNode } from 'react'
import { StepContext } from '../../components/Draw'
import type { SlideDef } from '../../deck'

// "How am I going to achieve my Cumorah Academy goals?" as film title cards: 6 words or fewer on every screen.

const Card = ({ children }: { children: ReactNode }) => (
  <foreignObject x={0} y={0} width={1600} height={900}><div className="ci">{children}</div></foreignObject>
)

/** A title on its own. `over` is the small line above it; each entry of `lines` is one line. */
const title = (lines: string[], over?: string): SlideDef => ({
  steps: 0,
  Slide: () => (
    <Card>
      {over && <p className="ci-over">{over}</p>}
      {lines.map((l) => <p key={l} className="ci-title">{l}</p>)}
    </Card>
  ),
})

const GOALS_REACHED = ['Help others', 'Networking', 'Freelance', 'Travel']
const LINKS: [string, string][] = [['Websites', 'Proof'], ['Network', 'Doors'], ['C1', 'Interviews']]

export const slides: SlideDef[] = [
  // 1 · Black while the speaker walks up; the first click asks the question
  {
    steps: 1,
    Slide: () => {
      const step = useContext(StepContext)
      return <Card>{step >= 1 && <><p className="ci-title">Where are</p><p className="ci-title">you going?</p></>}</Card>
    },
  },

  // 2 · The four goals already reached, one per click
  {
    steps: 3,
    Slide: () => {
      const step = useContext(StepContext)
      return <Card>{GOALS_REACHED.map((g, i) => step >= i && <p key={g} className="ci-title small">{g}</p>)}</Card>
    },
  },

  // 3 · The turn of the talk
  {
    steps: 1,
    Slide: () => (
      <Card>
        <p className="ci-over">Four down</p>
        {useContext(StepContext) >= 1 && <p className="ci-title">Two to go</p>}
      </Card>
    ),
  },

  // 4-7 · The first goal and its three steps
  title(['C1 Cambridge'], 'One'),
  title(['Book the exam']),
  title(['Practise', 'every day']),
  title(['One mock test', 'monthly']),

  // 8-11 · The second goal and its three steps
  title(['A better job'], 'Two'),
  title(['Show real', 'projects']),
  title(['Ask my', 'network']),
  title(['Apply in', 'English']),

  // 12-13 · Why it can work: the goals feed each other
  title(['Everything', 'connects']),
  {
    steps: 2,
    Slide: () => {
      const step = useContext(StepContext)
      return (
        <Card>
          {LINKS.map(([from, to], i) => step >= i && <div key={from} className="ci-pair"><span>{from}</span><i /><b>{to}</b></div>)}
        </Card>
      )
    },
  },

  // 14 · The commitment
  title(['I book', 'my exam'], 'This week'),

  // 15-16 · The opening question, now asked to the room
  title(['Where are', 'you going?']),
  title(['Thank you']),
]
