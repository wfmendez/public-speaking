import { music } from './music'
import song from './song.json'

/**
 * The opening video's song. Every line is sung offline (tools/make-song.py → public/agents/song/*.mp3):
 * Kokoro says each word and Praat moves it onto the melody written in song.json. Because the melody
 * says when each word starts, the lyrics on screen light up word by word exactly as they are sung.
 */

export type Word = { text: string; at: number }
export type SungLine = { at: number; end: number; words: Word[]; url: string }

/** 'Meet=E4:.5 agent=A4:.5,C5:2.5 _=.5' → each word with the beat it starts on (`_` is a rest). */
export const SONG: SungLine[] = song.lines.map(({ at, notes }) => {
  const words: Word[] = []
  let beat = at
  for (const token of notes.split(' ').filter(Boolean)) {
    const cut = token.lastIndexOf('=')
    const word = token.slice(0, cut)
    if (word !== '_') words.push({ text: word, at: beat })
    beat += token.slice(cut + 1).split(',').reduce((n, note) => n + Number(note.split(':').pop()), 0)
  }
  // same rule as clip_id() in tools/make-song.py
  const id = words.map((w) => w.text).join(' ').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return { at, end: beat, words, url: `/agents/song/${String(at).padStart(3, '0')}-${id}.mp3` }
})

export function preloadSong() {
  music.preload(SONG.map((l) => l.url))
}

/** Each clip starts this long before its first beat: the first consonant comes in early so the vowel lands on the beat. */
const LEAD_IN = 0.09

/** Plays a sung line whose first beat falls at audio time `when`, with a little room reverb. */
export function singLine(line: SungLine, when: number) {
  music.playClip(line.url, when - LEAD_IN, 'sing')
}
