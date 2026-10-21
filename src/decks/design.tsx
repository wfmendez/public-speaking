import { D, G, T } from '../components/Draw'
import type { SlideDef } from '../deck'

// Four dates to remember: garage, Mac, iPhone, iPhone redesign.
const YEARS = [1976, 1984, 2007, 2013]
const yearX = (i: number) => 330 + i * 313

/** Thin timeline along the bottom; the current year is highlighted. */
function Timeline({ current, at = 0 }: { current: number | 'all'; at?: number }) {
  return (
    <>
      <D d="M240,835 H1360" soft width={3} at={at} dur={0.8} />
      {YEARS.map((year, i) => {
        const on = current === 'all' || current === i
        return (
          <G key={year} at={at} delay={0.3 + i * 0.1} dur={0.5}>
            <circle cx={yearX(i)} cy={835} r={on ? 10 : 6} style={{ fill: on ? 'var(--accent)' : 'var(--soft)' }} />
            <text
              x={yearX(i)} y={882} fontSize={on ? 40 : 30} textAnchor="middle" fontWeight={on ? 600 : 400}
              style={{ fill: on ? 'var(--accent)' : 'var(--soft)' }}
            >
              {year}
            </text>
          </G>
        )
      })}
    </>
  )
}

type Art = { at?: number; delay?: number; until?: number; w?: number }

// 1976 · the garage
const Garage = ({ at = 0, delay = 0, w = 4 }: Art) => (
  <>
    <D d="M480,640 H1120" width={w} at={at} delay={delay} dur={0.6} />
    <D d="M560,640 V420 L800,270 L1040,420 V640" width={w} at={at} delay={delay + 0.4} dur={1.2} />
    <D d="M640,640 V460 H960 V640" width={w} at={at} delay={delay + 1.4} dur={0.8} />
    <D d="M640,505 H960 M640,550 H960 M640,595 H960" width={w} at={at} delay={delay + 2} dur={0.8} />
  </>
)

// Apple I: a bare circuit board
const CHIPS = ['M580,350 H700 V420 H580 Z', 'M760,350 H880 V420 H760 Z', 'M940,350 H1030 V450 H940 Z', 'M600,510 H780 V580 H600 Z']
const pins = (x1: number, x2: number, y: number, dir: number) =>
  Array.from({ length: Math.floor((x2 - x1) / 20) }, (_, i) => `M${x1 + 10 + i * 20},${y} V${y + dir * 12}`).join(' ')
const Board = ({ at = 0, delay = 0, w = 4 }: Art) => (
  <>
    <D d="M520,300 H1080 V640 H520 Z" width={w} at={at} delay={delay} dur={1} />
    {CHIPS.map((d, i) => <D key={i} d={d} width={w} at={at} delay={delay + 0.8 + i * 0.25} dur={0.5} />)}
    <D
      d={[pins(580, 700, 350, -1), pins(580, 700, 420, 1), pins(760, 880, 350, -1), pins(760, 880, 420, 1), pins(600, 780, 580, 1)].join(' ')}
      width={w * 0.6} at={at} delay={delay + 1.8} dur={0.8}
    />
    <D d="M700,385 H760 M880,385 H940 M640,420 V510 M985,450 V545 H780 M1030,400 H1060 V600" accent width={w * 0.7} at={at} delay={delay + 2.2} dur={1} />
  </>
)

// 1984 · Macintosh and its mouse
const Mac = ({ at = 0, delay = 0, w = 4 }: Art) => (
  <>
    <D d="M640,230 H900 Q920,230 920,250 V640 Q920,660 900,660 H640 Q620,660 620,640 V250 Q620,230 640,230 Z" width={w} at={at} delay={delay} dur={1} />
    <D d="M660,270 H880 V470 H660 Z" width={w} at={at} delay={delay + 0.8} dur={0.6} />
    <D d="M780,545 H870 M650,610 H700" width={w} at={at} delay={delay + 1.3} dur={0.4} />
    <D d="M745,315 H795 V425 H745 Z M758,340 V352 M782,340 V352 M770,345 V378 H763 M757,398 Q770,410 783,398" width={w * 0.8} at={at} delay={delay + 1.7} dur={0.9} />
    <D d="M1040,520 Q1040,470 1080,470 Q1120,470 1120,520 V590 Q1120,630 1080,630 Q1040,630 1040,590 Z M1040,518 H1120" width={w} at={at} delay={delay + 2.3} dur={0.8} />
    <D d="M1080,470 C1080,410 1000,430 960,560 C950,592 935,610 920,612" width={w * 0.8} at={at} delay={delay + 2.9} dur={0.7} />
    <D d="M685,290 L685,326 L694,317 L701,332 L707,329 L700,314 L712,314 Z" accent width={w * 0.7} at={at} delay={delay + 3.4} dur={0.5} />
  </>
)

/** A phone body drawn around a screenshot of its home screen. */
function Phone({
  cx, src, ratio, at = 0, delay = 0, until, dimTo,
}: { cx: number; src: string; ratio: number; at?: number; delay?: number; until?: number; dimTo?: number }) {
  const ih = 520
  const iw = Math.round(ih * ratio)
  const x = cx - iw / 2
  const bx = x - 20
  const bw = iw + 40
  return (
    <G at={at} dur={0.01} until={until} dimTo={dimTo}>
      <D
        d={`M${bx + 46},110 H${bx + bw - 46} Q${bx + bw},110 ${bx + bw},156 V744 Q${bx + bw},790 ${bx + bw - 46},790 H${bx + 46} Q${bx},790 ${bx},744 V156 Q${bx},110 ${bx + 46},110 Z`}
        at={at} delay={delay} dur={1.1}
      />
      <D d={`M${cx - 30},142 H${cx + 30} M${cx - 22},750 a22,22 0 1,0 44,0 a22,22 0 1,0 -44,0`} at={at} delay={delay + 0.9} dur={0.5} />
      <G at={at} delay={delay + 1.1} dur={0.9}>
        <image href={src} x={x} y={170} width={iw} height={ih} preserveAspectRatio="xMidYMid slice" />
        <rect x={x} y={170} width={iw} height={ih} className="screen-edge" />
      </G>
    </G>
  )
}

// Screenshots: iPhone home screen before (skeuomorphic, 841×1280) and after the 2013 redesign (746×1333).
const BEFORE = { src: '/apple/before.png', ratio: 841 / 1280 }
const AFTER = { src: '/apple/after.png', ratio: 746 / 1333 }

export const slides: SlideDef[] = [
  // 1 · Blank while the speaker walks up; first click draws the garage
  {
    steps: 1,
    Slide: () => (
      <>
        <T x={800} y={170} size={96} at={1} delay={2.4}>Two friends. One garage.</T>
        <Garage at={1} />
        <Timeline current={0} at={1} />
      </>
    ),
  },

  // 2 · Apple I: a bare board, only for experts
  {
    steps: 0,
    Slide: () => (
      <>
        <T x={800} y={190} size={96}>Only experts could use it.</T>
        <Board delay={0.4} />
        <Timeline current={0} />
      </>
    ),
  },

  // 3 · 1984 Macintosh: point and click
  {
    steps: 0,
    Slide: () => (
      <>
        <T x={800} y={150} size={96} delay={3.4}>Point. Click. Done.</T>
        <g transform="translate(0 40)">
          <Mac />
        </g>
        <Timeline current={1} />
      </>
    ),
  },

  // 4 · 2007 iPhone: icons that looked like real things (Notes = a yellow notepad)
  {
    steps: 1,
    Slide: () => (
      <>
        <Phone cx={560} {...BEFORE} />
        <T x={1160} y={250} size={72} delay={1.8}>It looked like real things.</T>
        {/* the Notes icon, then a real notepad */}
        <D d="M392,425 a40,40 0 1,0 80,0 a40,40 0 1,0 -80,0" accent at={1} dur={0.6} width={5} />
        <D d="M478,410 C680,320 860,360 990,440" accent at={1} delay={0.5} dur={0.8} width={4} />
        <D d="M962,420 L992,442 L958,456" accent at={1} delay={1.2} dur={0.3} width={4} />
        <D d="M1030,330 H1290 V720 H1030 Z" at={1} delay={1.3} dur={0.9} />
        <D d="M1030,330 H1290 V378 H1030 Z" flame at={1} delay={1.9} dur={0.5} />
        <D d="M1050,430 H1270 M1050,480 H1270 M1050,530 H1270 M1050,580 H1270 M1050,630 H1270 M1050,680 H1270" soft at={1} delay={2.3} dur={0.8} />
        <D d="M1080,378 V720" accent at={1} delay={2.8} dur={0.4} width={3} />
        <Timeline current={2} />
      </>
    ),
  },

  // 5 · 2013 redesign: same meaning, less decoration
  {
    steps: 1,
    Slide: () => (
      <>
        <Phone cx={380} {...BEFORE} delay={0} until={1} dimTo={0.45} />
        <T x={800} y={420} size={92} at={1} delay={1.8} weight={600}>Less,</T>
        <T x={800} y={520} size={92} at={1} delay={2.2} weight={600} accent>but better.</T>
        <Phone cx={1220} {...AFTER} at={1} />
        <Timeline current={3} />
      </>
    ),
  },

  // 6 · Close: the principle, with the whole journey on the timeline
  {
    steps: 0,
    Slide: () => (
      <>
        <T x={800} y={210} size={96} weight={600} dur={1.4}>
          Good design makes a product <tspan style={{ fill: 'var(--accent)' }}>useful.</tspan>
        </T>
        <g transform="translate(90 379) scale(0.3)"><Board delay={0.8} w={10} /></g>
        <g transform="translate(365 378) scale(0.32)"><Mac delay={1.3} w={10} /></g>
        <g transform="translate(914 455) scale(0.42)">
          <D d="M0,0 H170 Q200,0 200,30 V280 Q200,310 170,310 H30 Q0,310 0,280 V30 Q0,0 30,0 Z M88,286 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0" width={9} delay={1.8} dur={1} />
          <D d="M30,40 H70 V80 H30 Z M80,40 H120 V80 H80 Z M130,40 H170 V80 H130 Z M30,95 H70 V135 H30 Z M80,95 H120 V135 H80 Z" width={7} delay={2.3} dur={0.8} />
        </g>
        <g transform="translate(1227 455) scale(0.42)">
          <D d="M0,0 H170 Q200,0 200,30 V280 Q200,310 170,310 H30 Q0,310 0,280 V30 Q0,0 30,0 Z M88,286 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0" width={9} delay={2.6} dur={1} />
          <D d="M30,40 H70 V80 H30 Z M80,40 H120 V80 H80 Z M130,40 H170 V80 H130 Z M30,95 H70 V135 H30 Z M80,95 H120 V135 H80 Z" accent width={7} delay={3.1} dur={0.8} />
        </g>
        <Timeline current="all" />
      </>
    ),
  },
]
