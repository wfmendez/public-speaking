// Small drawn flags: Windows shows flag emoji as two letters ("BR"), so they are drawn here instead.

export type Country = 'ar' | 'br' | 'us' | 've' | 'pe' | 'cz' | 'de' | 'mx'

const W = 30
const H = 20

function Art({ c }: { c: Country }) {
  switch (c) {
    case 'ar':
      return <><rect width={W} height={H} fill="#74acdf" /><rect y={H / 3} width={W} height={H / 3} fill="#fff" /><circle cx={15} cy={10} r={2.2} fill="#f6b40e" /></>
    case 'br':
      return <><rect width={W} height={H} fill="#009c3b" /><path d="M15 2 L28 10 L15 18 L2 10 Z" fill="#ffdf00" /><circle cx={15} cy={10} r={4.6} fill="#002776" /></>
    case 'us':
      return <>{[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} y={(i * H) / 7} width={W} height={H / 7} fill={i % 2 ? '#fff' : '#b22234'} />)}<rect width={13} height={(H / 7) * 4} fill="#3c3b6e" /></>
    case 've':
      return <><rect width={W} height={H / 3} fill="#ffcc00" /><rect y={H / 3} width={W} height={H / 3} fill="#00247d" /><rect y={(2 * H) / 3} width={W} height={H / 3} fill="#cf142b" />{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = Math.PI * (0.15 + (i * 0.7) / 7); return <circle key={i} cx={15 - Math.cos(a) * 5} cy={11.5 - Math.sin(a) * 4} r={0.6} fill="#fff" /> })}</>
    case 'pe':
      return <><rect width={W} height={H} fill="#d91023" /><rect x={W / 3} width={W / 3} height={H} fill="#fff" /></>
    case 'cz':
      return <><rect width={W} height={H / 2} fill="#fff" /><rect y={H / 2} width={W} height={H / 2} fill="#d7141a" /><path d={`M0 0 L15 10 L0 20 Z`} fill="#11457e" /></>
    case 'mx':
      return <><rect width={W} height={H} fill="#fff" /><rect width={W / 3} height={H} fill="#006847" /><rect x={(2 * W) / 3} width={W / 3} height={H} fill="#ce1126" /><circle cx={15} cy={10} r={2.4} fill="#8c5a2b" /></>
    case 'de':
      return <><rect width={W} height={H / 3} fill="#000" /><rect y={H / 3} width={W} height={H / 3} fill="#dd0000" /><rect y={(2 * H) / 3} width={W} height={H / 3} fill="#ffce00" /></>
  }
}

export function Flag({ c, size = 30 }: { c: Country; size?: number }) {
  return (
    <svg className="flag" viewBox={`0 0 ${W} ${H}`} width={size} height={(size * H) / W}>
      <Art c={c} />
    </svg>
  )
}
