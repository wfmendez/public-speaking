import '@fontsource/bebas-neue/400.css'
import './goals.css'
import { useContext } from 'react'
import { StepContext } from '../../components/Draw'
import type { SlideDef } from '../../deck'
import Garden from './Garden'
import { SCENES, type Scene } from './scenes'

// "A goal is like a seed": the words are film title cards, and the garden behind them grows screen by screen.

const Words = ({ scene }: { scene: Scene }) => (
  <foreignObject x={0} y={0} width={1600} height={900}>
    <div className="ci">
      <div className={`ci-text ${scene.top ? 'top' : ''}`}>
        {scene.over && <p className="ci-over">{scene.over}</p>}
        {scene.lines.map((l) => <p key={l} className="ci-title">{l}</p>)}
      </div>
    </div>
  </foreignObject>
)

export const slides: SlideDef[] = SCENES.map((scene, i): SlideDef => i === 0
  ? {
    // black while the speaker walks up; the first click drops the seed
    steps: 1,
    Slide: () => (useContext(StepContext) >= 1 ? <Words scene={scene} /> : null),
  }
  : { steps: 0, Slide: () => <Words scene={scene} /> })

export function GardenBackdrop({ slide, step }: { slide: number; step: number }) {
  return <Garden stage={slide === 0 && step === 0 ? null : SCENES[slide].stage} />
}
