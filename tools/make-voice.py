"""
Generates the DJ voice clips of the agents class from src/decks/agents/lyrics.json.

Uses Kokoro (open-source neural text-to-speech, runs offline) and ffmpeg.
Setup, once (kept out of git in .voice-tools/):
    python -m venv .voice-tools/env
    .voice-tools/env/Scripts/python -m pip install kokoro-onnx soundfile
    download kokoro-v1.0.onnx and voices-v1.0.bin from
    https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0 into .voice-tools/
Run:
    .voice-tools/env/Scripts/python tools/make-voice.py            # all clips
    .voice-tools/env/Scripts/python tools/make-voice.py --preview  # one line in several voices
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / '.voice-tools'
OUT = ROOT / 'public' / 'agents' / 'voice'
LYRICS = json.loads((ROOT / 'src' / 'decks' / 'agents' / 'lyrics.json').read_text(encoding='utf-8'))

# speed per tone: the DJ pushes, the bridge slows down
SPEED = {'hype': 1.12, 'bot': 1.25, 'low': 0.85}


def clip_id(text: str, tone: str) -> str:
    """Same rule as clipId() in Video.tsx."""
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-') + ('' if tone == 'hype' else '-' + tone)


def render(kokoro: Kokoro, text: str, voice: str, speed: float, dest: Path):
    samples, rate = kokoro.create(text, voice=voice, speed=speed, lang='en-us')
    wav = TOOLS / 'tmp' / 'clip.wav'
    wav.parent.mkdir(parents=True, exist_ok=True)
    sf.write(wav, samples, rate)
    # trim the silence at the start so the word lands right on the beat; mono mp3
    subprocess.run([
        'ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav),
        '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,loudnorm=I=-14:TP=-1',
        '-ac', '1', '-b:a', '96k', str(dest),
    ], check=True)


def main():
    kokoro = Kokoro(str(TOOLS / 'kokoro-v1.0.onnx'), str(TOOLS / 'voices-v1.0.bin'))
    if '--preview' in sys.argv:
        dest = TOOLS / 'previews'
        dest.mkdir(exist_ok=True)
        for v in ['af_bella', 'af_heart', 'am_michael', 'am_fenrir', 'am_puck', 'am_onyx']:
            render(kokoro, 'Meet your agent! It searches! It plans! Make some noise!', v, SPEED['hype'], dest / f'{v}.mp3')
            print('preview', v)
        return
    OUT.mkdir(parents=True, exist_ok=True)
    voices = LYRICS['voices']
    lines = [(l['text'], l.get('tone', 'hype')) for l in LYRICS['lines'] + LYRICS['extra']]
    done = set()
    for text, tone in lines:
        cid = clip_id(text, tone)
        if cid in done:
            continue
        done.add(cid)
        render(kokoro, text, voices['bot' if tone == 'bot' else 'dj'], SPEED[tone], OUT / f'{cid}.mp3')
        print(cid)


if __name__ == '__main__':
    main()
