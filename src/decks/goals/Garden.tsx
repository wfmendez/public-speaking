import { useEffect, useRef } from 'react'
import type { Stage } from './scenes'

/**
 * The living drawing behind the words: a seed that falls, roots under the ground, a tree that bends in the
 * storm, fruit that falls and a forest. It stays on screen across the slides, drawn on a canvas each frame;
 * the plant's height, the roots and the camera all ease towards what the current screen asks for.
 * World units match the slide at zoom 1, with (0, 0) at the foot of the plant and y going up.
 */

const { sin, cos, min, max, exp, PI, abs, floor, round } = Math
const clamp = (v: number) => min(1, max(0, v))
const CALM = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

const AMBER = '#ffc72c'
const BARK = [156, 118, 80]
const STEM = [150, 224, 160]
const SHADE = '#1d6340'
const CANOPY = '#2f9158'
const LEAVES = ['#55bd72', '#79d68d', '#a9eab6']

/** Random numbers that are the same on every run, so the tree always grows the same way. */
const dice = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

type Branch = { len: number; turn: number; bend: number; width: number; from: number; to: number; depth: number; kids: Branch[]; tip: number }

/** `leaders` is how many levels always fork in three: a limb up the middle fills the crown. */
function makeBranch(rand: () => number, depth: number, deepest: number, len: number, width: number, turn: number, fan: number, leaders: number, counter: { tips: number }): Branch {
  const share = 1 / (deepest + 1)
  const kids: Branch[] = []
  if (depth < deepest) {
    const count = depth < leaders || rand() < 0.32 ? 3 : 2
    for (let i = 0; i < count; i++) {
      const side = count === 2 ? i * 2 - 1 : i - 1
      const angle = side * fan * (0.7 + rand() * 0.6) + (rand() - 0.5) * 0.3
      const shrink = (side === 0 ? 0.82 : 0.74) * (0.88 + rand() * 0.24)
      kids.push(makeBranch(rand, depth + 1, deepest, len * shrink, width * 0.68, angle, fan * 1.02, leaders, counter))
    }
  }
  const tip = depth >= deepest - 2 ? counter.tips++ : -1 // the last three levels carry leaves
  return { len, turn, bend: (rand() - 0.5) * 0.3, width, from: depth * share * 0.9, to: (depth + 1.4) * share, depth, kids, tip }
}

const tree = (seed: number, deepest: number) => makeBranch(dice(seed), 0, deepest, 172, 30, 0, 0.6, 2, { tips: 0 })
const roots = (() => {
  const rand = dice(11)
  return [-1.15, -0.55, 0.1, 0.7, 1.25].map((turn, i) => makeBranch(rand, 0, 6, 92 - (i % 2) * 18, 8, turn, 0.3, 0, { tips: 0 }))
})()
const OAK = tree(91, 6)
const SAPLING = tree(23, 4)
const bears = (tip: number) => tip % 11 === 0 // one twig in eleven carries fruit
const FOREST: [number, number][] = [[-1090, 0.3], [-930, 0.22], [-770, 0.34], [-590, 0.25], [-430, 0.36], [-250, 0.24], [250, 0.28], [340, 0.2]]
const SPECKS = (() => {
  const rand = dice(5)
  return Array.from({ length: 170 }, () => [(rand() - 0.5) * 2600, -8 - rand() * 460, 1 + rand() * 2.2] as const)
})()
const STREAKS = (() => {
  const rand = dice(3)
  return Array.from({ length: 210 }, () => [rand(), rand(), 0.7 + rand() * 0.6] as const)
})()

type Fallen = { x: number; y: number; vy: number; wait: number }

export default function Garden({ stage }: { stage: Stage | null }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const wanted = useRef(stage)
  wanted.current = stage

  useEffect(() => {
    const el = canvas.current!
    const g = el.getContext('2d')!
    let frame = 0
    let last = performance.now()
    let W = 0
    let H = 0
    let units = 1

    const fit = () => {
      const dpr = min(devicePixelRatio, 2)
      W = innerWidth
      H = innerHeight
      el.width = W * dpr
      el.height = H * dpr
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      units = min(W / 1600, H / 900)
    }
    addEventListener('resize', fit)
    fit()

    // the values on screen, easing towards the wanted stage
    const now = { x: 1120, ground: 640, zoom: 5, buried: 0, soil: 0, roots: 0, tree: 0, fruit: 0, forest: 0, wind: 0, storm: 0, glow: 0, show: 0 }
    let seedY = 620
    let seedV = 0
    let flash = 0
    let flashAt = 3
    let bolt: [number, number][] = []
    let drops: { x: number; y: number }[] = []
    let dropAt = 0
    let rings: { x: number; age: number }[] = []
    let fallen: Fallen[] = []
    let landed: number[] = []
    let dropped = false
    const fruitAt = new Map<number, [number, number]>()

    const paint = (t: number) => {
      frame = requestAnimationFrame(paint)
      const dt = min((t - last) / 1000, 0.05)
      last = t
      const time = t / 1000
      const aim = wanted.current
      const ease = (v: number, to: number, speed: number) => v + (to - v) * (1 - exp(-dt * speed))

      if (aim) {
        now.x = ease(now.x, aim.x, 1.5)
        now.ground = ease(now.ground, aim.ground, 1.5)
        now.zoom = ease(now.zoom, aim.zoom, 1.5)
        now.buried = ease(now.buried, aim.buried, 1.6)
        now.soil = ease(now.soil, aim.soil, 1.2)
        now.roots = ease(now.roots, aim.roots, 0.8)
        now.tree = ease(now.tree, aim.tree, 0.75)
        now.fruit = ease(now.fruit, aim.fruit, 1.6)
        now.forest = ease(now.forest, aim.forest, 0.7)
        now.wind = ease(now.wind, CALM ? 0 : aim.wind, 1.4)
        now.storm = ease(now.storm, aim.rain === 'storm' ? 1 : 0, 2.2)
        now.glow = ease(now.glow, aim.glow ? 1 : 0, 2)
        now.show = ease(now.show, 1, 2)
      }

      const scale = units * now.zoom
      const ox = W / 2 + (now.x - 800) * units
      const oy = H / 2 + (now.ground - 450) * units
      const X = (x: number) => ox + x * scale
      const Y = (y: number) => oy - y * scale
      const line = (x0: number, y0: number, x1: number, y1: number, width: number, color: string) => {
        g.strokeStyle = color
        g.lineWidth = max(0.6, width * scale)
        g.beginPath()
        g.moveTo(X(x0), Y(y0))
        g.lineTo(X(x1), Y(y1))
        g.stroke()
      }

      g.clearRect(0, 0, W, H)
      if (!aim) return
      g.globalAlpha = now.show
      g.lineCap = 'round'

      // the soil
      g.fillStyle = `rgb(${10 + 26 * now.soil},${8 + 16 * now.soil},${6 + 8 * now.soil})`
      g.fillRect(0, Y(0), W, H)
      g.fillStyle = `rgba(190,150,105,${0.08 + 0.2 * now.soil})`
      for (const [x, y, r] of SPECKS) {
        g.beginPath()
        g.arc(X(x), Y(y), r * units * 1.4, 0, PI * 2)
        g.fill()
      }

      // the roots, first of all
      if (now.roots > 0.002) {
        const color = now.glow > 0.5 ? AMBER : `rgba(226,196,150,${0.75 + 0.25 * now.glow})`
        const walk = (b: Branch, x: number, y: number, angle: number) => {
          const k = clamp((now.roots - b.from) / (b.to - b.from))
          if (k <= 0) return
          const a = angle + b.turn
          const x1 = x + sin(a) * b.len * k
          const y1 = min(-3, y - cos(a) * b.len * k) // roots never come out of the ground
          line(x, y, x1, y1, b.width * (1 + now.glow * 0.25), color)
          if (k === 1) for (const kid of b.kids) walk(kid, x1, y1, a)
        }
        for (const r of roots) walk(r, 0, -4, 0)
      }

      // the ground
      g.strokeStyle = '#8c8880'
      g.lineWidth = 2 * units
      g.beginPath()
      g.moveTo(0, Y(0))
      g.lineTo(W, Y(0))
      g.stroke()

      // the seed, until the plant takes over
      const rest = -18 * now.buried + 5 * (1 - now.buried)
      seedV -= 900 * dt
      seedY += seedV * dt
      if (seedY < rest) {
        seedY = rest
        seedV = seedV < -130 ? -seedV * 0.3 : 0
      }
      const seedAlpha = 1 - clamp(now.tree * 9)
      if (seedAlpha > 0) {
        g.save()
        g.globalAlpha = now.show * seedAlpha
        g.translate(X(0), Y(seedY))
        g.rotate(-0.35)
        g.fillStyle = AMBER
        g.beginPath()
        g.ellipse(0, 0, 8 * scale, 5 * scale, 0, 0, PI * 2)
        g.fill()
        g.restore()
      }

      // a tree: first its shape, swaying more the higher it is, then dark leaves, wood and light leaves on top
      const grow = (top: Branch, size: number, footX: number, height: number, phase: number, big: boolean) => {
        const leafy = clamp((height - 0.55) / 0.35)
        const age = clamp((height - 0.08) / 0.25)
        const wood = `rgb(${BARK.map((c, i) => STEM[i] + (c - STEM[i]) * age).join(',')})`
        const thin = 0.12 + 0.88 * clamp((height - 0.06) / 0.75)
        const pieces = new Map<number, Path2D>() // branches of one thickness share a single stroke, so frames stay quick
        const spots: [number, number, number][] = []
        const walk = (b: Branch, x: number, y: number, angle: number) => {
          const k = clamp((height - b.from) / (b.to - b.from))
          if (k <= 0) return
          const sway = (sin(time * 1.1 + b.depth * 0.5 + phase) * 0.012 + now.wind * (0.13 + sin(time * 3 + b.depth * 0.7 + phase) * 0.06)) * (b.depth + 1)
          const a = (angle + b.turn) * 0.72 + sway // limbs reach back up towards the light
          const parts = b.depth < 2 ? 4 : 2
          const step = (b.len * size * k) / parts
          let px = x
          let py = y
          for (let i = 0; i < parts; i++) {
            const along = (i + 0.5) / parts
            const curve = a + b.bend * (along * 2 - 1)
            const nx = px + sin(curve) * step
            const ny = py + cos(curve) * step
            const width = max(1, round(b.width * size * (1 - 0.32 * along) * thin * scale * 2)) / 2
            if (!pieces.has(width)) pieces.set(width, new Path2D())
            const piece = pieces.get(width)!
            piece.moveTo(X(px), Y(py))
            piece.lineTo(X(nx), Y(ny))
            px = nx
            py = ny
          }
          if (b.depth === 0 && k < 1) sprout(px, py, a)
          if (k === 1) for (const kid of b.kids) walk(kid, px, py, a)
          if (b.tip >= 0) spots.push([px, py, b.tip])
        }
        walk(top, footX, 0, 0)

        const radius = (tip: number) => (36 + (tip % 5) * 5) * size * leafy
        const blobs = (color: string, grow: number, dx: number, dy: number) => {
          g.fillStyle = color
          g.beginPath()
          for (const [x, y, tip] of spots) {
            if (big && tip % 2) continue // the big crown is dense enough with half of them
            const r = radius(tip) * grow * scale
            g.moveTo(X(x + dx * radius(tip)) + r, Y(y + dy * radius(tip)))
            g.arc(X(x + dx * radius(tip)), Y(y + dy * radius(tip)), r, 0, PI * 2)
          }
          g.fill()
        }
        if (leafy > 0) blobs(SHADE, 1.08, -0.1, -0.16)
        g.strokeStyle = wood
        pieces.forEach((piece, width) => {
          g.lineWidth = width
          g.stroke(piece)
        })
        if (leafy > 0) {
          blobs(CANOPY, 0.78, 0.06, 0.14)
          // the light comes from above: pale leaves on top, darker ones below
          const low = min(...spots.map((s) => s[1]))
          const high = max(...spots.map((s) => s[1]))
          const shadeOf = (y: number, tip: number) => min(2, max(0, floor(((y - low) / (high - low) + (tip % 4 - 1.5) * 0.12) * 3)))
          LEAVES.forEach((color, shade) => {
            g.fillStyle = color
            g.beginPath()
            for (const [x, y, tip] of spots) {
              if (shadeOf(y, tip) !== shade) continue
              const count = big ? 5 : 3
              for (let n = 0; n < count; n++) {
                const turn = tip * 1.7 + n * 1.26
                const reach = radius(tip) * (0.3 + (n % 3) * 0.28)
                const lx = X(x + cos(turn) * reach)
                const ly = Y(y + sin(turn) * reach + radius(tip) * 0.2)
                const long = 13 * max(size, 0.55) * leafy * scale
                const tilt = turn + sin(time * 2 + tip + n) * (0.12 + now.wind * 0.4)
                const ax = cos(tilt) * long
                const ay = sin(tilt) * long
                g.moveTo(lx + ax, ly + ay) // a leaf: a pointed diamond, far quicker to fill than an ellipse
                g.lineTo(lx - ay * 0.45, ly + ax * 0.45)
                g.lineTo(lx - ax, ly - ay)
                g.lineTo(lx + ay * 0.45, ly - ax * 0.45)
                g.closePath()
              }
            }
            g.fill()
          })
        }
        if (big) {
          for (const [x, y, tip] of spots) {
            fruitAt.set(tip, [x, y])
            if (bears(tip) && now.fruit > 0.01 && !dropped) {
              g.fillStyle = AMBER
              g.beginPath()
              g.arc(X(x), Y(y - 4), 12 * now.fruit * scale, 0, PI * 2)
              g.fill()
            }
          }
        }
      }
      /** Two small leaves on the tip while the stem is young. */
      const sprout = (x: number, y: number, angle: number) => {
        const size = clamp(now.tree * 14)
        g.fillStyle = LEAVES[0]
        for (const side of [-1, 1]) {
          g.save()
          g.translate(X(x), Y(y))
          g.rotate(-angle + side * (0.85 + now.wind * 0.4))
          g.beginPath()
          g.ellipse(0, -11 * scale * size, 6 * scale * size, 11 * scale * size, 0, 0, PI * 2)
          g.fill()
          g.restore()
        }
      }
      if (now.tree > 0.004) grow(OAK, 0.92, 0, now.tree, 0, true)
      if (now.forest > 0.01) {
        FOREST.forEach(([x, size], i) => grow(SAPLING, size * 1.5, x, clamp(now.forest * 1.3 - i * 0.04), i, false))
      }

      // the fruit falls and stays as new seeds
      if (aim.drop && !dropped) {
        dropped = true
        let n = 0
        fruitAt.forEach(([x, y], tip) => {
          if (bears(tip)) fallen.push({ x, y, vy: 0, wait: 0.15 * n++ })
        })
      }
      if (!aim.drop && dropped) {
        dropped = false
        fallen = []
        landed = []
      }
      fallen = fallen.filter((f) => {
        if (f.wait > 0) f.wait -= dt
        else {
          f.vy -= 620 * dt
          f.y += f.vy * dt
        }
        g.fillStyle = AMBER
        g.beginPath()
        g.arc(X(f.x), Y(f.y), 11 * scale, 0, PI * 2)
        g.fill()
        if (f.y > 6) return true
        landed.push(f.x)
        return false
      })
      // each seed is used up as the new trees come out
      const left = 1 - clamp(now.forest * 3)
      if (left > 0) {
        g.fillStyle = AMBER
        for (const x of landed) {
          g.beginPath()
          g.ellipse(X(x), Y(5 * left), 8 * left * scale, 5 * left * scale, 0, 0, PI * 2)
          g.fill()
        }
      }

      // watering: big, slow drops
      if (aim.rain === 'drops' && t > dropAt) {
        dropAt = t + 420
        drops.push({ x: (sin(time * 37) * 0.5) * 70, y: 450 / now.zoom + 60 })
      }
      drops = drops.filter((d) => {
        d.y -= (340 / now.zoom + 120) * dt
        g.fillStyle = '#7cc4ee'
        g.beginPath()
        g.ellipse(X(d.x), Y(d.y), 3.2 * scale, 5 * scale, 0, 0, PI * 2)
        g.fill()
        if (d.y > 0) return true
        rings.push({ x: d.x, age: 0 })
        return false
      })
      rings = rings.filter((r) => {
        r.age += dt
        g.strokeStyle = `rgba(124,196,238,${1 - r.age / 0.6})`
        g.lineWidth = 2 * units
        g.beginPath()
        g.ellipse(X(r.x), Y(0), (5 + r.age * 40) * scale, (1 + r.age * 8) * scale, 0, 0, PI * 2)
        g.stroke()
        return r.age < 0.6
      })

      // the storm: slanted rain and, now and then, lightning
      if (now.storm > 0.01) {
        g.strokeStyle = `rgba(190,215,240,${0.5 * now.storm})`
        g.lineWidth = 1.6 * units
        g.beginPath()
        for (const [sx, sy, speed] of STREAKS) {
          const y = ((sy + time * 1.5 * speed) % 1) * (Y(0) + 30) - 30
          const x = ((sx - time * 0.3 * speed) % 1 + 1) % 1
          g.moveTo(x * W, y)
          g.lineTo(x * W - 13 * units, y + 34 * units)
        }
        g.stroke()
        if (!CALM && aim.rain === 'storm' && time > flashAt) {
          flash = 1
          flashAt = time + 2.6 + abs(sin(time * 13)) * 3
          const startX = W * (0.1 + abs(sin(time * 7)) * 0.5)
          bolt = [[startX, 0]]
          for (let i = 1; i < 8; i++) bolt.push([startX + sin(time * (i + 3)) * 60 * units + i * 14 * units, (Y(0) * i) / 8])
        }
      }
      if (flash > 0.01) {
        flash *= exp(-dt * 7)
        g.fillStyle = `rgba(220,230,255,${flash * 0.16})`
        g.fillRect(0, 0, W, H)
        g.strokeStyle = `rgba(255,255,255,${flash})`
        g.lineWidth = 3 * units
        g.beginPath()
        bolt.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
        g.stroke()
      }
      g.globalAlpha = 1
    }
    frame = requestAnimationFrame(paint)

    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('resize', fit)
    }
  }, [])

  return <canvas ref={canvas} className="ci-garden" />
}
