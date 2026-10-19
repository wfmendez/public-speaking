# The Importance of Failure in Success — Slides

Hand-drawn style slides for a 5-minute speech. Built with Vite + React. Each slide draws itself as you click.
The full speech with click cues is in [SCRIPT.md](SCRIPT.md).

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

## Deploy to Vercel

Option A, from the terminal:

```bash
npx vercel --prod
```

Option B: push this folder to GitHub and import it at vercel.com/new. Vercel detects Vite automatically (build: `npm run build`, output: `dist`).

## Editing

- Slide content and timing: `src/slides.tsx` (keep each slide at 6 words or fewer)
- Icons: `src/icons.tsx`
- Colors and animation speed: `src/styles.css`
