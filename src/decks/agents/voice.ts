import { music } from './music'
import lyrics from './lyrics.json'

/**
 * The DJ / MC voice of the opening video. The lines are real recordings made with a neural
 * voice (tools/make-voice.py → public/agents/voice/*.mp3) and played on the beat with DJ effects.
 * If a clip is missing, the browser's own (robotic) speech says the line instead.
 * Everything stays quiet while the music is muted (M).
 */

export type Tone = 'hype' | 'bot' | 'low'

const TONES: Record<Tone, { rate: number; pitch: number }> = {
  hype: { rate: 1.12, pitch: 0.9 }, // the DJ shouting over the beat
  bot: { rate: 1.2, pitch: 1.7 }, // the chatbot's thin little voice
  low: { rate: 0.8, pitch: 0.6 }, // the bridge, when the music stops
}

let chosen: SpeechSynthesisVoice | null | undefined

/** Prefer an English male voice (sounds more like an MC); any English voice otherwise. */
function pickVoice() {
  if (chosen !== undefined) return chosen
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  const en = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))
  chosen = en.find((v) => /guy|david|mark|daniel|male|christopher|eric|roger/i.test(v.name)) ?? en[0] ?? null
  return chosen
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => { chosen = undefined; pickVoice() })
}

export function say(text: string, tone: Tone = 'hype') {
  if (!('speechSynthesis' in window) || music.isMuted()) return
  const synth = window.speechSynthesis
  synth.cancel() // the next line always wins, so the voice stays on the beat
  const u = new SpeechSynthesisUtterance(text)
  const v = pickVoice()
  if (v) u.voice = v
  u.lang = v?.lang ?? 'en-US'
  u.rate = TONES[tone].rate
  u.pitch = TONES[tone].pitch
  u.volume = 1
  synth.speak(u)
}

export function hush() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

export type Line = { at: number; text: string; tone?: Tone; fx?: 'echo' | 'stutter' | 'scratch' }

/** Same rule as clip_id() in tools/make-voice.py. */
const clipUrl = (text: string, tone: Tone = 'hype') =>
  `/agents/voice/${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}${tone === 'hype' ? '' : `-${tone}`}.mp3`

export const LINES = lyrics.lines as Line[]
const EXTRA = lyrics.extra as (Omit<Line, 'at'> & { id: string })[]

export function preloadVoice() {
  music.preload([...LINES, ...EXTRA].map((l) => clipUrl(l.text, l.tone)))
}

/** Plays a line at audio time `when` (now if omitted); falls back to speech synthesis. */
export function shout(line: Omit<Line, 'at'>, when?: number) {
  const ok = music.playClip(clipUrl(line.text, line.tone), when ?? 0, line.fx)
  if (!ok) say(line.text, line.tone)
}

/** A line from the "extra" list (used by the class slides), by id. */
export function shoutExtra(id: string) {
  const l = EXTRA.find((e) => e.id === id)
  if (l) shout(l)
}
