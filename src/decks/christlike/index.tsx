import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import './christlike.css'
import { Fragment, useContext } from 'react'
import { StepContext } from '../../components/Draw'
import type { SlideDef } from '../../deck'
import { Art } from './Art'
import Candles from './Candles'
import { SCENES, type Scene } from './scenes'

// "What Christlike Leadership Means": short lines in candlelight, beside candles that light as the story turns,
// with the figure of Christ at the start and the end. The script is in SCRIPT.md.

/** The words come up one by one; the first screen of a part comes up from black first. */
const Words = ({ scene }: { scene: Scene }) => {
  let n = 0
  const start = scene.part ? 0.75 : 0.15
  const reveal = (text: string) => text.split(' ').map((w, i) => (
    <Fragment key={i}>
      {i > 0 && ' '}
      <span className="cd-word" style={{ animationDelay: `${(start + n++ * 0.12).toFixed(2)}s` }}>{w}</span>
    </Fragment>
  ))
  return (
    <foreignObject x={0} y={0} width={1600} height={900}>
      <div className="cd">
        {scene.part && <div className="cd-veil" />}
        <div className="cd-text">
          {scene.over && <p className="cd-over">{reveal(scene.over)}</p>}
          {scene.lines.map((l) => <p key={l} className="cd-title">{reveal(l)}</p>)}
        </div>
      </div>
    </foreignObject>
  )
}

const Screen = ({ scene }: { scene: Scene }) => (
  <>
    {scene.art && <Art name={scene.art} />}
    <Words scene={scene} />
  </>
)

export const slides: SlideDef[] = SCENES.map((scene, i): SlideDef => i === 0
  ? {
    // black while the speaker walks up; the first click brings up the title, the figure and the unlit candles
    steps: 1,
    Slide: () => (useContext(StepContext) >= 1 ? <Screen scene={scene} /> : null),
  }
  : { steps: 0, Slide: () => <Screen scene={scene} /> })

export function CandleBackdrop({ slide, step }: { slide: number; step: number }) {
  const blank = slide === 0 && step === 0
  const scene = SCENES[slide]
  return <Candles light={blank ? null : scene.light} christ={!blank && scene.christ} />
}
