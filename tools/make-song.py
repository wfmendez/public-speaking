"""
Sings the opening video's song (src/decks/agents/song.json) into public/agents/song/*.mp3, one clip per line.

Kokoro (offline text-to-speech) says each word, slower when its notes are long; Praat (parselmouth) then
stretches the word over its notes (vowels, not consonants) and moves its pitch onto the melody (PSOLA).
To sound sung rather than read: consonants start a little before the beat so the vowel lands on it, the
pitch glides from one word into the next, long notes get a vibrato that fades in, and every word is
brought to the same loudness. Each line is doubled by a second voice on the left and right, lines
marked `harmony` get a third above, and the result is EQ'd and compressed like a pop vocal. Needs ffmpeg.

Setup, once (in the same env as tools/make-voice.py):
    .voice-tools/env/Scripts/python -m pip install praat-parselmouth
Run:
    .voice-tools/env/Scripts/python tools/make-song.py            # all clips
    .voice-tools/env/Scripts/python tools/make-song.py --preview  # also the whole vocal track in .voice-tools/previews/
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import parselmouth
import soundfile as sf
from kokoro_onnx import Kokoro
from parselmouth.praat import call

ROOT = Path(__file__).resolve().parent.parent
TOOLS = Path(os.environ.get('VOICE_TOOLS', ROOT / '.voice-tools'))
SONG = json.loads((ROOT / 'src' / 'decks' / 'agents' / 'song.json').read_text(encoding='utf-8'))
OUT = ROOT / 'public' / 'agents' / 'song'
BEAT = 60 / SONG['bpm']
RATE = 24000
STEPS = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
MINOR = [9, 11, 0, 2, 4, 5, 7]  # A minor, for the harmony
LEAD, DOUBLE = SONG['voices']  # the lead singer, and the voice that doubles her


def midi(name: str) -> int:
    m = re.fullmatch(r'([A-G])([#b]?)(\d)', name)
    return 12 * (int(m[3]) + 1) + STEPS[m[1]] + {'#': 1, 'b': -1, '': 0}[m[2]]


def parse(notes: str):
    """'Meet=E4:.5 agent=A4:.5,C5:2.5 _=.5' → [(word, [(midi | None, beats)])]"""
    words = []
    for token in notes.split():
        word, spec = token.rsplit('=', 1)
        if word == '_':
            words.append((word, [(None, float(spec))]))
        else:
            words.append((word, [(midi(n), float(b)) for n, b in (p.split(':') for p in spec.split(','))]))
    return words


def clip_id(at: int, words) -> str:
    """Same rule as clipUrl() in src/decks/agents/song.ts."""
    text = ' '.join(w for w, _ in words if w != '_')
    return f'{at:03d}-' + re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def third_above(m: int) -> int:
    pc = m % 12
    if pc not in MINOR:
        return m + 4
    i = MINOR.index(pc)
    return m + (MINOR[(i + 2) % 7] - pc) % 12


hz = lambda m: 440 * 2 ** ((m - 69) / 12)
_said = {}


def say(kokoro: Kokoro, word: str, voice: str, speed: float):
    """The word spoken on its own, with the silence around it trimmed."""
    key = (word.strip('“”"'), voice, speed)
    if key not in _said:
        samples, rate = kokoro.create(key[0], voice=voice, speed=speed, lang='en-us')
        assert rate == RATE
        loud = np.where(np.abs(samples) > np.abs(samples).max() * 0.03)[0]
        _said[key] = samples[max(0, loud[0] - 120): loud[-1] + 240].astype(np.float64)
    return _said[key]


def voicing(snd):
    pitch = snd.to_pitch(time_step=0.01, pitch_floor=75, pitch_ceiling=500)
    return pitch.xs(), pitch.selected_array['frequency']


def take(kokoro: Kokoro, word: str, voice: str, length: float):
    """Says the word slower when it has to last much longer than it takes to say (less stretching later)."""
    natural = say(kokoro, word, voice, 1.0)
    ratio = length / (len(natural) / RATE)
    speed = 1.0 if ratio < 1.3 else max(0.6, round(1.25 / ratio * 20) / 20)
    return say(kokoro, word, voice, speed)


def sing(samples, notes, glide_from: float | None, cents=0.0):
    """
    Sings a spoken word over `notes`. Returns (audio, lead-in): the lead-in is how long the word's first
    consonant lasts, so the caller can start it that much before the beat.
    """
    snd = parselmouth.Sound(samples, RATE)
    ts, f0 = voicing(snd)
    voiced_at = ts[np.argmax(f0 > 0)] if (f0 > 0).any() else 0.0
    lead_in = min(0.09, max(0.0, voiced_at - 0.01))
    length = sum(b for _, b in notes) * BEAT
    target = lead_in + length + 0.03  # a little overlap into the next word, for legato
    voiced = (f0 > 0).sum() * 0.01
    unvoiced = snd.duration - voiced
    if target > unvoiced + 0.04 and voiced > 0.02:
        kv, ku = (target - unvoiced) / voiced, 1.0  # consonants keep their length, vowels take the rest
    else:
        kv = ku = target / snd.duration
    m = call(snd, 'To Manipulation', 0.01, 75, 600)
    tier = call('Create DurationTier', 'duration', 0, snd.duration)
    for t, f in zip(ts, f0):
        call(tier, 'Add point', t, kv if f > 0 else ku)
    call([m, tier], 'Replace duration tier')
    long = call(m, 'Get resynthesis (overlap-add)')

    m = call(long, 'To Manipulation', 0.01, 75, 600)
    tier = call('Create PitchTier', 'pitch', 0, long.duration)
    scale = long.duration / target
    t = lead_in * scale
    shift = 2 ** (cents / 1200)
    prev = glide_from * shift if glide_from else None
    for note, beats in notes:
        d = beats * BEAT * scale
        f = hz(note) * shift
        # glide in from the previous note, or scoop up into the first one
        call(tier, 'Add point', t, prev if prev else f * 2 ** (-0.45 / 12))
        call(tier, 'Add point', t + min(0.07, d * 0.3), f)
        v = t + 0.25
        while v < t + d - 0.05:  # vibrato that fades in on long notes
            depth = min(1.0, (v - t - 0.25) / 0.25) * 0.25
            call(tier, 'Add point', v, f * 2 ** (depth * np.sin(2 * np.pi * 5.3 * (v - t)) / 12))
            v += 0.02
        call(tier, 'Add point', t + d - 0.02, f)
        prev = f
        t += d
    call([m, tier], 'Replace pitch tier')
    audio = call(m, 'Get resynthesis (overlap-add)').values[0]
    # every word as loud as the others (measured on its vowels)
    body = audio[int(lead_in * scale * RATE):]
    rms = np.sqrt(np.mean(body ** 2)) if len(body) else 1.0
    return audio * (0.1 / max(rms, 1e-4)), lead_in * scale


def place(buf, audio, start, gains):
    i = max(0, int(start * RATE))
    n = min(len(audio), buf.shape[0] - i)
    if n <= 0:
        return
    fade = np.ones(n)
    fi, fo = min(60, n // 4), min(480, n // 4)  # quick in, 20 ms out
    fade[:fi] = np.linspace(0, 1, fi)
    fade[n - fo:] = np.linspace(1, 0, fo)
    for ch, g in enumerate(gains):
        buf[i:i + n, ch] += audio[:n] * fade * g


def render_part(kokoro: Kokoro, buf, words, voice: str, gains, cents=0.0, delay=0.0, transpose=lambda n: n):
    pos = 0.0
    prev = None
    for word, notes in words:
        if word == '_':
            prev = None
        else:
            notes = [(transpose(n), b) for n, b in notes]
            spoken = take(kokoro, word, voice, sum(b for _, b in notes) * BEAT)
            audio, lead_in = sing(spoken, notes, hz(prev) if prev else None, cents)
            place(buf, audio, 0.1 + pos * BEAT - lead_in + delay, gains)
            prev = notes[-1][0]
        pos += sum(b for _, b in notes)


def render_line(kokoro: Kokoro, line):
    """A stereo line: the lead in the middle, the second voice doubling it left and right, harmony if asked."""
    words = parse(line['notes'])
    beats = sum(b for _, notes in words for _, b in notes)
    buf = np.zeros((int((0.1 + beats * BEAT + 0.6) * RATE), 2))
    render_part(kokoro, buf, words, LEAD, (1.0, 1.0))
    render_part(kokoro, buf, words, DOUBLE, (0.42, 0.12), cents=7, delay=0.012)
    render_part(kokoro, buf, words, LEAD, (0.12, 0.42), cents=-7, delay=0.022)
    if line.get('harmony'):
        render_part(kokoro, buf, words, DOUBLE, (0.18, 0.4), cents=4, delay=0.008, transpose=third_above)
        render_part(kokoro, buf, words, LEAD, (0.36, 0.16), cents=-4, delay=0.016, transpose=third_above)
    return buf[int(0.1 * RATE) - int(0.09 * RATE):] / max(1e-6, np.abs(buf).max()) * 0.9, words


def to_mp3(wav: Path, dest: Path):
    # a pop vocal chain: no rumble, less mud, some presence, compressed, then to a steady loudness
    chain = ('highpass=f=110,equalizer=f=280:t=q:w=1:g=-2.5,equalizer=f=3200:t=q:w=1.2:g=3,'
             'acompressor=threshold=-20dB:ratio=3:attack=5:release=90:makeup=2,loudnorm=I=-15:TP=-1')
    subprocess.run([
        'ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav),
        '-af', chain, '-ar', '44100', '-b:a', '160k', str(dest),
    ], check=True)


def main():
    kokoro = Kokoro(str(TOOLS / 'kokoro-v1.0.onnx'), str(TOOLS / 'voices-v1.0.bin'))
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob('*.mp3'):
        old.unlink()
    tmp = TOOLS / 'tmp' / 'line.wav'
    tmp.parent.mkdir(parents=True, exist_ok=True)
    track = np.zeros((int((340 * BEAT + 4) * RATE), 2)) if '--preview' in sys.argv else None
    for line in SONG['lines']:
        audio, words = render_line(kokoro, line)
        sf.write(tmp, audio, RATE)
        cid = clip_id(line['at'], words)
        to_mp3(tmp, OUT / f'{cid}.mp3')
        if track is not None:
            i = int((line['at'] * BEAT - 0.09) * RATE)
            track[i:i + len(audio)] += audio[:len(track) - i] * 0.8
        print(cid)
    if track is not None:
        dest = TOOLS / 'previews'
        dest.mkdir(exist_ok=True)
        sf.write(dest / 'song-vocals.wav', track, RATE)
        print('preview', dest / 'song-vocals.wav')


if __name__ == '__main__':
    main()
