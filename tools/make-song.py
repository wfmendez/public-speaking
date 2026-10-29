"""
Sings the opening video's song (src/decks/agents/song.json) into public/agents/song/*.mp3, one clip per line.

Kokoro (offline text-to-speech) says each word; Praat (parselmouth) then stretches the word to the length of
its notes and moves its pitch onto the melody (PSOLA), with a glide into each note and vibrato on long ones.
Every line is double-tracked, and lines marked `harmony` get a third above. Needs ffmpeg.

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
    up = (MINOR[(i + 2) % 7] - pc) % 12
    return m + up


hz = lambda m: 440 * 2 ** ((m - 69) / 12)
_said = {}


def say(kokoro: Kokoro, word: str):
    """The word spoken on its own, with the silence around it trimmed."""
    text = word.strip('“”"')
    if text not in _said:
        samples, rate = kokoro.create(text, voice=SONG['voice'], speed=1.0, lang='en-us')
        assert rate == RATE
        loud = np.where(np.abs(samples) > np.abs(samples).max() * 0.03)[0]
        _said[text] = samples[max(0, loud[0] - 240): loud[-1] + 240].astype(np.float64)
    return _said[text]


def sing(samples, notes, cents=0.0):
    """Stretches a spoken word over `notes` (mostly its vowels) and sets its pitch to the melody."""
    target = sum(b for _, b in notes) * BEAT * 0.96
    snd = parselmouth.Sound(samples, RATE)
    pitch = snd.to_pitch(time_step=0.01, pitch_floor=75, pitch_ceiling=500)
    f0 = pitch.selected_array['frequency']
    voiced = (f0 > 0).sum() * 0.01
    unvoiced = snd.duration - voiced
    if target > unvoiced + 0.04 and voiced > 0.02:
        kv, ku = (target - unvoiced) / voiced, 1.0  # consonants keep their length, vowels take the rest
    else:
        kv = ku = target / snd.duration
    m = call(snd, 'To Manipulation', 0.01, 75, 600)
    tier = call('Create DurationTier', 'duration', 0, snd.duration)
    for t, f in zip(pitch.xs(), f0):
        call(tier, 'Add point', t, kv if f > 0 else ku)
    call([m, tier], 'Replace duration tier')
    long = call(m, 'Get resynthesis (overlap-add)')

    m = call(long, 'To Manipulation', 0.01, 75, 600)
    tier = call('Create PitchTier', 'pitch', 0, long.duration)
    scale = long.duration / (target / 0.96)
    t = 0.0
    for note, beats in notes:
        d = beats * BEAT * scale
        f = hz(note) * 2 ** (cents / 1200)
        call(tier, 'Add point', t + min(0.035, d * 0.2), f)
        v = t + 0.16
        while v < t + d - 0.03:  # vibrato that fades in
            depth = min(1.0, (v - t - 0.16) / 0.2) * 0.35
            call(tier, 'Add point', v, f * 2 ** (depth * np.sin(2 * np.pi * 5.5 * (v - t)) / 12))
            v += 0.02
        call(tier, 'Add point', t + d - 0.01, f)
        t += d
    call([m, tier], 'Replace pitch tier')
    return call(m, 'Get resynthesis (overlap-add)').values[0]


def place(buf, audio, start, gain):
    i = int(start * RATE)
    n = min(len(audio), len(buf) - i)
    if n <= 0:
        return
    fade = np.ones(n)
    f = min(120, n // 4)
    fade[:f] = np.linspace(0, 1, f)
    fade[n - f:] = np.linspace(1, 0, f)
    buf[i:i + n] += audio[:n] * fade * gain


def render_line(kokoro: Kokoro, line):
    words = parse(line['notes'])
    beats = sum(b for _, notes in words for _, b in notes)
    buf = np.zeros(int((beats * BEAT + 0.6) * RATE))
    pos = 0.0
    for word, notes in words:
        if word != '_':
            spoken = say(kokoro, word)
            place(buf, sing(spoken, notes), pos * BEAT, 1.0)
            place(buf, sing(spoken, notes, cents=9), pos * BEAT + 0.018, 0.45)  # double track
            if line.get('harmony'):
                place(buf, sing(spoken, [(third_above(n), b) for n, b in notes], cents=-6), pos * BEAT + 0.008, 0.4)
        pos += sum(b for _, b in notes)
    return buf / max(1e-6, np.abs(buf).max()) * 0.9, words


def to_mp3(wav: Path, dest: Path):
    subprocess.run([
        'ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav),
        '-af', 'loudnorm=I=-15:TP=-1', '-ac', '1', '-ar', '44100', '-b:a', '112k', str(dest),
    ], check=True)


def main():
    kokoro = Kokoro(str(TOOLS / 'kokoro-v1.0.onnx'), str(TOOLS / 'voices-v1.0.bin'))
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob('*.mp3'):
        old.unlink()
    tmp = TOOLS / 'tmp' / 'line.wav'
    tmp.parent.mkdir(parents=True, exist_ok=True)
    track = np.zeros(int((340 * BEAT + 4) * RATE)) if '--preview' in sys.argv else None
    for line in SONG['lines']:
        audio, words = render_line(kokoro, line)
        sf.write(tmp, audio, RATE)
        cid = clip_id(line['at'], words)
        to_mp3(tmp, OUT / f'{cid}.mp3')
        if track is not None:
            place(track, audio, line['at'] * BEAT, 0.8)
        print(cid)
    if track is not None:
        dest = TOOLS / 'previews'
        dest.mkdir(exist_ok=True)
        sf.write(dest / 'song-vocals.wav', track, RATE)
        print('preview', dest / 'song-vocals.wav')


if __name__ == '__main__':
    main()
