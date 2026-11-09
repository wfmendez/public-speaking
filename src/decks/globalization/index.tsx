import './globalization.css'
import { useEffect, useRef, useState } from 'react'
import type { SlideDef } from '../../deck'
import { Flag, type Country } from './Flag'

/*
 * "Globalisation is a Myth": the whole talk is one airport departure board.
 * The board stays on screen between slides (it is the deck's Backdrop); on every click its split-flap
 * tiles flip from the old text to the new one, then everything stays still while you speak.
 * Never more than six words on the board at once. The script is in SCRIPT.md.
 */

const COLS = 20
const ROWS = 6

type Color = 'y' | 'w' | 'r' | 'g'
type Row = { text?: string; right?: string; color?: Color; rightColor?: Color; flag?: Country }
type Screen = { clock: string; rows: Row[] }

const center = (text: string, color?: Color): Row => ({ text, color })

/** A board for one moment of the talk: the clock and up to six rows. */
const S = (clock: string, ...rows: (Row | null)[]): Screen => ({ clock, rows: rows.map((r) => r ?? {}) })
const _ = null

// One list per slide; one screen per click.
const SCREENS: Screen[][] = [
  // 0 · Title: an empty board flips to the title
  [
    S('08:59'),
    S('09:00', _, center('GLOBALISATION'), _, center('IS A MYTH', 'r')),
  ],
  // 1 · Set-up
  [
    S('09:00', _, center('DIFFERENT COUNTRIES'), _, center('ONE ACADEMY', 'w')),
    S('09:00', _, _, center('GLOBAL NOW?', 'w')),
  ],
  // 2 · Proposition
  [
    S('09:00', _, center('PASSPORTS TRAVEL')),
    S('09:00', _, center('PASSPORTS TRAVEL'), _, center('HEARTS STAY HOME', 'r')),
  ],
  // 3 · Objections: on paper, everything happens in English
  [
    S('09:00', _, { text: 'CLASS', right: 'ENGLISH', rightColor: 'g' }),
    S('13:00', _, { text: 'CLASS', right: 'ENGLISH', rightColor: 'g' }, { text: 'LUNCH', right: 'ENGLISH', rightColor: 'g' }),
    S('18:00', _, { text: 'CLASS', right: 'ENGLISH', rightColor: 'g' }, { text: 'LUNCH', right: 'ENGLISH', rightColor: 'g' }, { text: 'TRIPS', right: 'DEPENDS', rightColor: 'w' }),
  ],
  // 4 · Evidence 1: the 7:01 PM clock
  [
    S('19:00', _, { text: 'ENGLISH', right: 'ON TIME', rightColor: 'g' }),
    S('19:01', _, { text: 'ENGLISH', right: 'CANCELLED', color: 'w', rightColor: 'r' },
      { text: 'ESPAÑOL', right: 'BOARDING', rightColor: 'g', flag: 've' },
      { text: 'PORTUGUÊS', right: 'BOARDING', rightColor: 'g', flag: 'br' }),
  ],
  // 5 · Evidence 2: our stomachs have a flag
  [
    S('20:00', _, { text: 'MATE', flag: 'ar' }, { text: 'PÃO DE QUEIJO', flag: 'br' }),
    S('20:00', _, { text: 'MATE', flag: 'ar' }, { text: 'PÃO DE QUEIJO', flag: 'br' }, { text: 'CEVICHE', flag: 'pe' }, { text: 'AREPA', flag: 've' }, { text: 'TACOS', flag: 'mx' }),
  ],
  // 6 · Evidence 3: the party test (the bars are the energy on the dance floor)
  [
    S('22:00', _, { text: 'POP', right: '#      ', rightColor: 'w' }),
    S('22:00', _, { text: 'POP', right: '#      ', rightColor: 'w' }, { text: 'FUNK', right: '#####  ', rightColor: 'g', flag: 'br' }),
    S('22:00', _, { text: 'POP', right: '#      ', rightColor: 'w' }, { text: 'FUNK', right: '#####  ', rightColor: 'g', flag: 'br' }, { text: 'REGGAETON', right: '#######', rightColor: 'r', flag: 've' }),
  ],
  // 7 · Wrap-up
  [
    S('23:59', _, center('HOME TRAVELS'), _, center('WITH US', 'w')),
    S('23:59', _, center('THE CHOICE'), _, center('IS OURS', 'g')),
  ],
]

export const slides: SlideDef[] = SCREENS.map((s) => ({ steps: s.length - 1, Slide: () => null }))

/** The characters a tile can show, in the order the flaps fall. "#" is a solid tile. */
const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZÃÊÑ0123456789:?.-#"

function flapPath(from: string, to: string) {
  const t = CHARS.indexOf(to)
  if (t < 0) return [to]
  let f = CHARS.indexOf(from)
  if (f < 0) f = t
  const out: string[] = []
  for (let i = f; i !== t; ) { i = (i + 1) % CHARS.length; out.push(CHARS[i]) }
  return out.slice(-9)
}

/** One split-flap tile: on a new character it flips through the letters before it, then stops. */
function Flap({ ch, color, delay }: { ch: string; color: Color; delay: number }) {
  const [shown, setShown] = useState(' ')
  const cur = useRef(' ')
  useEffect(() => {
    if (cur.current === ch) return
    const seq = flapPath(cur.current, ch)
    let i = 0
    let iv = 0
    const to = window.setTimeout(() => {
      iv = window.setInterval(() => {
        cur.current = seq[i]
        setShown(seq[i])
        if (++i >= seq.length) window.clearInterval(iv)
      }, 42)
    }, delay)
    return () => { window.clearTimeout(to); window.clearInterval(iv) }
  }, [ch, delay])
  return (
    <div className={`tile c-${color}${shown === '#' ? ' solid' : ''}`}>
      <span key={shown}>{shown === '#' ? '' : shown}</span>
    </div>
  )
}

/** Lays a row out on the 20 tiles: centred text, or text on the left and a status on the right. */
function layout(row: Row) {
  const chars: string[] = Array(COLS).fill(' ')
  const colors: Color[] = Array(COLS).fill(row.color ?? 'y')
  if (row.right !== undefined) {
    ;[...(row.text ?? '')].forEach((c, i) => { chars[i] = c })
    const r = [...row.right]
    r.forEach((c, i) => { chars[COLS - r.length + i] = c; colors[COLS - r.length + i] = row.rightColor ?? 'y' })
  } else if (row.text) {
    const t = [...row.text]
    const start = Math.floor((COLS - t.length) / 2)
    t.forEach((c, i) => { chars[start + i] = c })
  }
  return { chars, colors }
}

export function BoardBackdrop({ slide, step }: { slide: number; step: number }) {
  const list = SCREENS[slide] ?? SCREENS[0]
  const screen = list[Math.min(step, list.length - 1)]
  const rows = Array.from({ length: ROWS }, (_, i) => screen.rows[i] ?? {})
  return (
    <div className="fb-wrap">
      <div className="fb">
        <div className="fb-top">
          <svg className="plane" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
          <div className="fb-clock">
            {[...screen.clock].map((c, i) => <Flap key={i} ch={c} color="w" delay={i * 30} />)}
          </div>
        </div>
        {rows.map((row, r) => {
          const { chars, colors } = layout(row)
          return (
            <div className="fb-row" key={r}>
              <div className="fb-flag">{row.flag && <span key={row.flag} className="flag-in"><Flag c={row.flag} size={70} /></span>}</div>
              {chars.map((c, i) => <Flap key={i} ch={c} color={colors[i]} delay={r * 45 + i * 22} />)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
