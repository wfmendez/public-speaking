import type { ComponentType } from 'react'
import { D, G, T } from './components/Draw'
import { Icon, type IconName } from './icons'

/** `steps` = extra clicks inside the slide before moving on. */
type SlideDef = { steps: number; Slide: ComponentType }

// Shapes traced from the user's sketches ("how people believe is success" / "true success").
const STRAIGHT = 'M150,780 C520,730 700,610 880,470 S1250,280 1466,236'
const TANGLE =
  'M150,780 C300,760 385,700 390,600 C395,480 330,425 450,405 C700,360 1000,385 1050,470 ' +
  'C1100,560 900,640 700,620 C520,600 420,520 520,470 C640,410 820,430 860,520 ' +
  'C900,610 820,705 720,690 C600,675 560,560 650,510 C760,450 1000,470 1080,560 ' +
  'C1150,640 1120,705 1060,665 C980,605 1050,470 1120,430 C1200,385 1330,300 1466,236'

// The losses, in the order they happened.
const LIFE: IconName[] = ['ring', 'shop', 'cap', 'briefcase', 'briefcase', 'coins']
const slot = (i: number) => 300 + i * 200

const DESCENT =
  'M150,330 Q205,280 260,285 Q320,300 380,440 Q425,385 475,390 Q540,410 600,550 ' +
  'Q645,495 695,500 Q760,520 830,660 Q870,615 915,620 Q990,640 1080,790'

const Dot = ({ x, y, at = 0, delay = 0, accent }: { x: number; y: number; at?: number; delay?: number; accent?: boolean }) => (
  <G at={at} delay={delay} dur={0.4}>
    <circle cx={x} cy={y} r={9} style={{ fill: accent ? 'var(--accent)' : 'var(--ink)' }} />
  </G>
)

export const slides: SlideDef[] = [
  // 1 · Title
  {
    steps: 0,
    Slide: () => (
      <>
        <T x={800} y={390} size={104} dur={1.2}>The Importance of</T>
        <T x={800} y={530} size={136} delay={0.9} dur={1.3} weight={600}>
          <tspan style={{ fill: 'var(--accent)' }}>Failure</tspan> in Success
        </T>
        <D d="M470,575 C560,592 650,560 740,580" accent width={5} delay={2.1} dur={0.8} />
      </>
    ),
  },

  // 2 · The original Paint sketches — the opening joke ("luckily, I'm a programmer")
  {
    steps: 0,
    Slide: () => (
      <>
        {([
          ['/sketches/expectation.png', 90, 250, -2.5, 0.3],
          ['/sketches/reality.png', 830, 270, 2, 1],
        ] as const).map(([src, x, y, tilt, delay]) => (
          <G key={src} delay={delay} dur={0.7} transform={`rotate(${tilt} ${x + 340} ${y + 191})`}>
            <rect x={x - 12} y={y - 12} width={704} height={406} className="sheet" />
            <image href={src} x={x} y={y} width={680} height={382} />
          </G>
        ))}
      </>
    ),
  },

  // 3 · What people think success is → what it really is
  {
    steps: 1,
    Slide: () => (
      <>
        <T x={800} y={150} size={88} until={1}>What people think success is</T>
        <T x={800} y={150} size={88} at={1} delay={0.4}>What success really is</T>
        <Dot x={150} y={780} />
        <D d={STRAIGHT} dur={2.2} delay={0.5} until={1} />
        <Icon name="flag" x={1484} y={192} size={0.8} delay={2.5} speed={0.5} />
        <D d={TANGLE} at={1} dur={5} delay={0.9} />
      </>
    ),
  },

  // 4 · Everything was fine
  {
    steps: 0,
    Slide: () => (
      <>
        <T x={800} y={190} size={100}>Everything was fine.</T>
        {LIFE.map((name, i) => (
          <g key={i}>
            <Icon name={name} x={slot(i)} y={470} size={1.1} delay={0.8 + i * 0.45} speed={0.5} />
            <Icon name="check" x={slot(i)} y={600} size={0.9} accent delay={1.5 + i * 0.45} speed={0.4} />
          </g>
        ))}
      </>
    ),
  },

  // 5 · One by one — each click breaks one thing; the last click is the aunt
  {
    steps: 6,
    Slide: () => (
      <>
        <T x={800} y={190} size={100}>One by one.</T>
        <G until={6} dur={0.2}>
          {LIFE.map((name, i) => (
            <Icon key={i} name={name} x={slot(i)} y={470} size={1.1} delay={i * 0.12} speed={0.35} />
          ))}
          {[1, 2, 3, 4, 4, 5].map((at, i) => (
            <Icon key={i} name="cross" x={slot(i)} y={470} size={0.85} accent at={at} delay={i === 4 ? 0.35 : 0} speed={0.45} />
          ))}
        </G>
        <Icon name="candle" x={800} y={720} size={1.15} at={6} delay={0.6} speed={1.1} />
      </>
    ),
  },

  // 6 · The gradual descent
  {
    steps: 0,
    Slide: () => (
      <>
        <T x={1050} y={190} size={96}>Every time I rose, I fell.</T>
        <D d={DESCENT} dur={4.2} delay={0.6} />
        <Dot x={1080} y={790} delay={4.7} accent />
      </>
    ),
  },

  // 7 · The Dip (Seth Godin)
  {
    steps: 1,
    Slide: () => (
      <>
        <T x={800} y={170} size={100}>Every path has a Dip.</T>
        <D d="M150,560 C260,400 400,360 520,410 C650,470 700,740 860,740 C1020,740 1100,420 1450,230" dur={3} delay={0.5} />
        {/* quit: slide out of the Dip */}
        <D d="M820,760 Q720,805 640,835" soft at={1} dur={0.8} width={4} />
        <Icon name="cross" x={608} y={845} size={0.3} soft at={1} delay={0.7} speed={0.3} />
        {/* push: climb through it */}
        <D d="M905,712 Q985,660 1058,560" accent at={1} delay={0.9} dur={0.9} width={5} />
        <D d="M1026,572 L1060,556 L1066,594" accent at={1} delay={1.7} dur={0.4} width={5} />
      </>
    ),
  },

  // 8 · Grit (Angela Duckworth)
  {
    steps: 2,
    Slide: () => (
      <>
        <T x={800} y={360} size={190} weight={600} accent dur={1}>Grit</T>
        <D d="M690,400 C760,418 840,392 910,408" accent width={5} delay={0.9} dur={0.6} />
        <T x={800} y={570} size={112} at={1}>= Passion</T>
        <T x={800} y={720} size={112} at={2}>+ Perseverance</T>
      </>
    ),
  },

  // 9 · How I climbed out
  {
    steps: 3,
    Slide: () => (
      <>
        {([
          ['light', 'Faith.'],
          ['calendar', 'Habits.'],
          ['book', 'Mentors.'],
          ['stairs', 'Small steps.'],
        ] as const).map(([icon, word], i) => (
          <g key={word}>
            <Icon name={icon} x={260 + i * 360} y={400} size={1.4} at={i} speed={0.6} />
            <T x={260 + i * 360} y={600} size={92} at={i} delay={0.9}>{word}</T>
          </g>
        ))}
      </>
    ),
  },

  // 10 · I didn't quit — the climb out of the Dip
  {
    steps: 1,
    Slide: () => (
      <>
        <T x={420} y={170} size={100}>I didn't quit.</T>
        <g transform="translate(60 170) scale(0.75)">
          <D d={DESCENT} soft dur={1.6} width={5} />
        </g>
        <D d="M870,762 C950,700 990,640 1060,600 S1180,470 1250,420 S1400,260 1500,190" accent at={1} dur={2.6} width={5} />
        <Icon name="briefcase" x={990} y={520} size={0.7} at={1} delay={0.9} speed={0.5} />
        <Icon name="globe" x={1170} y={360} size={0.7} at={1} delay={1.6} speed={0.5} />
        <Icon name="school" x={1340} y={250} size={0.7} at={1} delay={2.3} speed={0.5} />
        <Icon name="heart" x={1500} y={100} size={0.6} at={1} delay={3} speed={0.6} accent />
      </>
    ),
  },

  // 11 · What failure gave me
  {
    steps: 3,
    Slide: () => (
      <>
        <T x={800} y={220} size={100}>Failure gave me:</T>
        {['Gratitude', 'Hope', 'Others'].map((word, i) => (
          <g key={word}>
            <T x={360 + i * 440} y={540} size={124} at={i + 1} accent={i === 1} weight={600}>{word}</T>
            <D d={`M${270 + i * 440},585 C${330 + i * 440},600 ${400 + i * 440},572 ${450 + i * 440},588`} accent at={i + 1} delay={0.8} dur={0.5} />
          </g>
        ))}
      </>
    ),
  },

  // 12 · Close — back to the "true success" drawing, now it's my story
  {
    steps: 1,
    Slide: () => (
      <>
        <Dot x={150} y={780} />
        <D d={TANGLE} dur={5} delay={0.3} />
        <Icon name="flag" x={1484} y={192} size={0.8} delay={5} speed={0.5} accent />
        <Icon name="ring" x={330} y={440} size={0.42} delay={1.1} speed={0.4} soft />
        <Icon name="shop" x={1120} y={380} size={0.42} delay={1.8} speed={0.4} soft />
        <Icon name="cap" x={440} y={560} size={0.42} delay={2.4} speed={0.4} soft />
        <Icon name="briefcase" x={930} y={480} size={0.42} delay={3} speed={0.4} soft />
        <Icon name="candle" x={1150} y={640} size={0.42} delay={3.8} speed={0.4} soft />
        <T x={800} y={170} size={104} at={1} weight={600}>
          Failure was the <tspan style={{ fill: 'var(--accent)' }}>material.</tspan>
        </T>
      </>
    ),
  },
]
