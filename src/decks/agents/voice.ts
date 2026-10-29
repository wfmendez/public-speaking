import { music } from './music'

/**
 * The DJ / MC voice of the opening video: the browser's own speech synthesis shouting the
 * lines on the beat. It is a robot voice (it speaks in rhythm, it can't sing a melody).
 * It stays quiet while the music is muted (M).
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
