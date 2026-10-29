# Talks — hand-drawn slides

Hand-drawn style slides that draw themselves as you click. Built with Vite + React.
The home page (`/`) lists every talk made so far:

| Talk | Link | Script |
|---|---|---|
| The Importance of Failure in Success (5 min) | `/failure` | [SCRIPT.md](SCRIPT.md) |
| Good Design Makes a Product Useful (3 min) | `/design` | [SCRIPT-design.md](SCRIPT-design.md) |
| Homeless to Leaders (2 min, red accent) | `/leaders` | [SCRIPT-leaders.md](SCRIPT-leaders.md) |
| Everyday AI Agents (20 min class: a 3-min opening music video, kinetic type + 3D line art with Three.js and Tailwind, live music — M mutes; story in [STORY-agents-video.md](STORY-agents-video.md)) | `/agents` | [SCRIPT-agents.md](SCRIPT-agents.md) |

On the home page, use the mouse, or the arrows/clicker to move between cards and Space/Enter to open one (or press `1`–`4`).
To get back to the list from a talk, use the browser's back button.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 and press `F` for fullscreen.

## Controls (works with a presentation clicker)

| Action | Keys |
|---|---|
| Next | `→` `↓` `PageDown` `Space` `Enter` · mouse click |
| Back | `←` `↑` `PageUp` `Backspace` · right click |
| Fullscreen | `F` (or `F5`) |
| Black screen | `B` or `.`; any key brings it back |
| Show/hide progress bar | `P` |
| First / last slide | `Home` / `End` |

The URL remembers where you are (`#/slide/step`), so if the page reloads you stay on the same slide.

Holding a clicker button down only moves one step, and the click that brings the window back into focus does not advance a slide.

## Before going live (checklist)

1. **Test your own clicker** on the presentation computer: press next/back a few times and make sure the slides move. Most clickers send `PageDown`/`PageUp`, which work. Then press `Home` to go back to the blank screen.
2. **Click once on the page** before you start, so it has keyboard focus. That click won't move the slides. If the clicker stops responding mid-talk, click the page once more.
3. Press `F` for fullscreen. `Esc` exits fullscreen; press `F` again to return.
4. Turn off sleep, screen saver and notifications on the laptop.
5. Once the page has loaded it doesn't need internet again: fonts and images are already in the browser. Load it before you start, not while you walk up.
6. **Backup without internet:** in this folder run `npm run build` and then `npm run preview`, and open the address it prints (http://localhost:4173).

## Deploy to Vercel

Option A, from the terminal:

```bash
npx vercel --prod
```

Option B: push this folder to GitHub and import it at vercel.com/new. Vercel detects Vite automatically (build: `npm run build`, output: `dist`).

## Editing

- Slide content and timing: `src/decks/*.tsx` (keep each slide at 6 words or fewer)
- Talk list for the home page: `src/decks/index.ts`
- Icons: `src/icons.tsx`
- Colors and animation speed: `src/styles.css`

## Agents class: DJ voice

The opening video's DJ voice is made of real recordings in `public/agents/voice/*.mp3`, generated with
[Kokoro](https://github.com/thewh1teagle/kokoro-onnx) (open-source neural voice, runs offline). The lines,
their beats and their effects (echo, stutter, scratch) live in `src/decks/agents/lyrics.json`.

To change a line or the voice (`"voices": { "dj": "af_bella" }`), edit `lyrics.json` and regenerate:

```bash
python -m venv .voice-tools/env
.voice-tools/env/Scripts/python -m pip install kokoro-onnx soundfile
# put kokoro-v1.0.onnx and voices-v1.0.bin (from the kokoro-onnx "model-files-v1.0" release) in .voice-tools/
.voice-tools/env/Scripts/python tools/make-voice.py
```

`--preview` renders one line in several voices into `.voice-tools/previews/`. Needs ffmpeg.
