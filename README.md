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

- Slide content and timing: `src/slides.tsx` (keep each slide at 6 words or fewer)
- Icons: `src/icons.tsx`
- Colors and animation speed: `src/styles.css`
