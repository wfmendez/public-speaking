import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { paintFace, skinOf, type Feeling, type Part, type Scene } from './faces'

/**
 * The 3D emojis, behind the text of the slides: glossy balls that fall in and bounce, blink, and move
 * the way each emotion feels. They look at the pointer, at each other and at whoever has just been named,
 * bump into their neighbours, and jump when clicked. Slide coordinates (1600×900) are used throughout.
 */

const FOV = 12
const GRAVITY = 26 // radii per second²
const CALM = matchMedia('(prefers-reduced-motion: reduce)').matches

type Pose = { x?: number; y?: number; rx?: number; ry?: number; rz?: number }
const { abs, sin, min, max, PI, random, atan2 } = Math

/** How each emotion moves when left alone (offsets in radii, angles in radians). */
const MOVES: Record<Feeling, (t: number) => Pose> = {
  happy: (t) => ({ y: abs(sin(t * 2.4)) * 0.12, rz: sin(t * 2.4) * 0.12 }),
  delighted: (t) => ({ y: abs(sin(t * 4.4)) * 0.28, rz: sin(t * 4.4) * 0.16 }),
  excited: (t) => ({ y: abs(sin(t * 6)) * 0.4, ry: t % 4 < 0.7 ? ((t % 4) / 0.7) * PI * 2 : 0 }),
  relaxed: (t) => ({ y: sin(t * 0.9) * 0.06, rz: sin(t * 0.7) * 0.14 }),
  sad: (t) => ({ y: -0.08 + sin(t * 1.1) * 0.03, rx: 0.3 + sin(t * 1.1) * 0.05 }),
  disappointed: (t) => ({ y: -0.1, rx: 0.42, rz: sin(t * 0.6) * 0.07 }),
  bored: (t) => ({ ry: sin(t * 0.5) * 0.5, rx: 0.1, rz: sin(t * 0.5) * 0.08 }),
  tired: (t) => ({ rx: t % 5 < 4 ? ((t % 5) / 4) * 0.75 : 0.75 * (5 - t % 5), y: -0.05 }),
  worried: (t) => ({ x: sin(t * 9) * 0.015, ry: sin(t * 1.3) * 0.35 }),
  scared: (t) => ({ x: sin(t * 38) * 0.03, y: sin(t * 31) * 0.015, rx: -0.1 }),
  terrified: (t) => ({ x: sin(t * 46) * 0.05, y: sin(t * 39) * 0.03, rx: -0.15 }),
  embarrassed: (t) => ({ ry: 0.5 + sin(t * 0.8) * 0.12, rx: 0.25 }),
  annoyed: (t) => ({ ry: -0.35 + sin(t * 0.7) * 0.06, rz: t % 3 < 1 ? sin(t * 14) * 0.05 : 0 }),
  angry: (t) => ({ x: sin(t * 20) * 0.03, rx: 0.15, rz: sin(t * 10) * 0.05 }),
  furious: (t) => ({ x: sin(t * 40) * 0.05, y: sin(t * 33) * 0.02, rx: 0.2 }),
  surprised: (t) => ({ y: t % 3.2 < 0.4 ? sin(((t % 3.2) / 0.4) * PI) * 0.5 : 0, rx: -0.15 }),
}

// ---------- small flying things ----------

function glyph(draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  draw(c.getContext('2d')!)
  const texture = new THREE.CanvasTexture(c)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const makeGlyphs = () => ({
  tear: glyph((g) => {
    g.fillStyle = '#7cc4ee'
    g.fill(new Path2D('M64,8 C44,50 28,74 28,92 A36,32 0 0,0 100,92 C100,74 84,50 64,8 Z'))
  }),
  steam: glyph((g) => {
    const r = g.createRadialGradient(64, 64, 4, 64, 64, 60)
    r.addColorStop(0, 'rgba(150,150,150,0.75)')
    r.addColorStop(1, 'rgba(190,190,190,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 128, 128)
  }),
  z: glyph((g) => {
    g.fillStyle = '#2c2a27'
    g.font = '600 120px Caveat, cursive'
    g.textAlign = 'center'
    g.fillText('z', 64, 100)
  }),
  star: glyph((g) => {
    g.fillStyle = '#f08a24'
    g.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = (i * PI) / 5 - PI / 2
      const k = i % 2 ? 24 : 58
      g.lineTo(64 + Math.cos(a) * k, 64 + Math.sin(a) * k)
    }
    g.fill()
  }),
})
type Glyphs = ReturnType<typeof makeGlyphs>

/** What an emotion gives off: `from` and `speed` are in radii from the centre; `flip` alternates left and right. */
const EXTRAS: Partial<Record<Feeling, { every: number; glyph: keyof Glyphs; from: [number, number]; speed: [number, number]; fall?: number; size: number; flip?: boolean }>> = {
  sad: { every: 1.3, glyph: 'tear', from: [0.42, -0.1], speed: [0, -0.2], fall: 3, size: 0.22 },
  worried: { every: 1.7, glyph: 'tear', from: [0.72, 0.55], speed: [0.2, 0], fall: 2.5, size: 0.18 },
  tired: { every: 1.4, glyph: 'z', from: [0.7, 0.7], speed: [0.4, 0.7], size: 0.36 },
  furious: { every: 0.12, glyph: 'steam', from: [0.8, 0.75], speed: [0.6, 1.3], size: 0.34, flip: true },
}

type Bit = { sprite: THREE.Sprite; vx: number; vy: number; fall: number; life: number; age: number }

// ---------- one emoji ----------

const FRONT = (() => {
  // the picture is wrapped from the front, so the face is not stretched as it would be on a globe
  const half = new THREE.SphereGeometry(1, 64, 48, 0, PI)
  const pos = half.attributes.position
  const uv = half.attributes.uv
  for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / 2, 0.5 + pos.getY(i) / 2)
  return half
})()
const BACK = new THREE.SphereGeometry(1, 64, 48, PI, PI)
const HAND = new THREE.SphereGeometry(1, 24, 18)

const pictures = new Map<string, THREE.Texture>()
function picture(name: Feeling, blink: boolean) {
  const key = `${name}${blink}`
  if (!pictures.has(key)) {
    const texture = new THREE.CanvasTexture(paintFace(name, blink))
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    pictures.set(key, texture)
  }
  return pictures.get(key)!
}

class Emoji {
  group = new THREE.Group()
  material: THREE.MeshPhysicalMaterial
  r: number
  x: number
  y: number
  hop = 7 // starts above the slide and falls in
  hopV = 0
  push = 0
  pushV = 0
  squash = 0
  squashV = 0
  yaw = 0
  pitch = 0
  gaze: Emoji | null = null
  gazeUntil = 0
  dash: Emoji | null = null
  landed = false
  blinkAt = 1 + random() * 3
  puffAt = 1 + random()
  side = 1
  seed = random() * 10

  constructor(public part: Part, public wait: number) {
    this.r = 86 * part.size
    this.x = part.x - 800
    this.y = 450 - part.y
    const gloss = { roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25 }
    this.material = new THREE.MeshPhysicalMaterial({ map: picture(part.name, false), ...gloss })
    const face = new THREE.Mesh(FRONT, this.material)
    const back = new THREE.Mesh(BACK, new THREE.MeshPhysicalMaterial({ color: skinOf(part.name), ...gloss }))
    face.castShadow = back.castShadow = true
    this.group.add(face, back)
    if (part.name === 'terrified') {
      for (const s of [-1, 1]) {
        const hand = new THREE.Mesh(HAND, new THREE.MeshPhysicalMaterial({ color: skinOf(part.name), roughness: 0.4 }))
        hand.scale.set(0.26, 0.42, 0.24)
        hand.position.set(s * 0.82, -0.38, 0.55)
        hand.rotation.z = s * 0.4
        hand.castShadow = true
        this.group.add(hand)
      }
    }
    this.group.visible = false
    this.group.scale.setScalar(this.r)
  }

  cheer(height = 9) {
    if (this.hop < 0.3) this.hopV = height
  }

  lookAt(other: Emoji, seconds: number, now: number) {
    this.gaze = other
    this.gazeUntil = now + seconds
  }

  /** Runs at a neighbour; `world` deals with the bump when they touch. */
  dashTo(other: Emoji, now: number) {
    this.dash = other
    this.lookAt(other, 1.5, now)
    other.lookAt(this, 1.5, now)
    const gap = (Math.abs(other.x - this.x) - this.r - other.r) / this.r
    this.pushV = Math.sign(other.x - this.x) * (4 + gap * 8)
  }

  update(dt: number, t: number, target: [number, number] | null) {
    this.group.visible = true
    let thud = false

    // falling and bouncing
    this.hopV -= GRAVITY * dt
    this.hop += this.hopV * dt
    if (this.hop < 0) {
      if (this.hopV < -4) {
        this.squashV += this.hopV * 0.5
        thud = !this.landed
        this.landed = true
      }
      this.hop = 0
      this.hopV = this.hopV < -4 ? -this.hopV * 0.38 : 0
    }

    // springs: sideways push and squash
    this.pushV += (-55 * this.push - 8 * this.pushV) * dt
    this.push += this.pushV * dt
    this.squashV += (-240 * this.squash - 15 * this.squashV) * dt
    this.squash += this.squashV * dt

    // where it looks
    const x = this.x + this.push * this.r
    const y = this.y + this.hop * this.r
    const seeing = t < this.gazeUntil && this.gaze ? [this.gaze.x, this.gaze.y] : target
    const yaw = seeing ? max(-0.75, min(0.75, atan2(seeing[0] - x, 600))) : 0
    const pitch = seeing ? max(-0.5, min(0.5, atan2(seeing[1] - y, 600))) : 0
    const ease = min(1, dt * 7)
    this.yaw += (yaw - this.yaw) * ease
    this.pitch += (pitch - this.pitch) * ease

    // the emotion's own movement
    const pose = CALM ? {} : MOVES[this.part.name](t + this.seed)
    this.group.position.set(x + (pose.x ?? 0) * this.r, y + (pose.y ?? 0) * this.r, 0)
    this.group.rotation.set((pose.rx ?? 0) - this.pitch, (pose.ry ?? 0) + this.yaw, pose.rz ?? 0)
    const s = max(-0.3, min(0.3, this.squash))
    this.group.scale.set(this.r * (1 - s * 0.7), this.r * (1 + s), this.r * (1 - s * 0.7))

    // blinking
    if (t > this.blinkAt) {
      const closed = this.material.map === picture(this.part.name, true)
      this.material.map = picture(this.part.name, !closed)
      this.blinkAt = t + (closed ? 1.5 + random() * 3.5 : 0.13)
    }
    return thud
  }
}

// ---------- the stage ----------

class World {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 100, 12000)
  renderer: THREE.WebGLRenderer
  glyphs = makeGlyphs()
  cast: Emoji[] = []
  bits: Bit[] = []
  shown: Scene | undefined
  step = -1
  units = 1
  shake = 0
  later: { at: number; run: () => void }[] = []
  idleAt = 3
  pointer: [number, number] | null = null
  pointerAt = -9
  clock = new THREE.Clock()
  frame = 0

  constructor(host: HTMLElement) {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    this.renderer = renderer
    renderer.setPixelRatio(min(devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    host.appendChild(renderer.domElement)

    const room = new THREE.PMREMGenerator(renderer)
    this.scene.environment = room.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.32
    room.dispose()

    const sun = new THREE.DirectionalLight('#fff4dd', 1.9)
    sun.position.set(-260, 380, 1100)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.radius = 9
    Object.assign(sun.shadow.camera, { left: -1000, right: 1000, top: 700, bottom: -700, near: 100, far: 3000 })
    this.scene.add(sun, new THREE.HemisphereLight('#ffffff', '#e0c98a', 0.8))

    // the paper: invisible, it only catches the shadows
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(5000, 3000), new THREE.ShadowMaterial({ opacity: 0.15 }))
    paper.position.z = -120
    paper.receiveShadow = true
    this.scene.add(paper)

    addEventListener('resize', this.fit)
    addEventListener('pointermove', this.onMove)
    addEventListener('click', this.onClick, true)
    this.fit()
    this.tick()
  }

  /** The slide is scaled to fit the window, so the emojis stay exactly where the text expects them. */
  fit = () => {
    const w = innerWidth
    const h = innerHeight
    this.renderer.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.position.z = max(450, 800 / this.camera.aspect) / Math.tan(((FOV / 2) * PI) / 180)
    this.camera.updateProjectionMatrix()
    this.units = min(w / 1600, h / 900)
  }

  toSlide(e: MouseEvent): [number, number] {
    return [(e.clientX - innerWidth / 2) / this.units, (innerHeight / 2 - e.clientY) / this.units]
  }

  onMove = (e: PointerEvent) => {
    this.pointer = this.toSlide(e)
    this.pointerAt = this.clock.elapsedTime
  }

  /** Clicking an emoji makes it jump (and does not change the slide). */
  onClick = (e: MouseEvent) => {
    const [x, y] = this.toSlide(e)
    const hit = this.cast.find((c) => (c.x - x) ** 2 + (c.y - y) ** 2 < c.r ** 2)
    if (!hit) return
    e.stopPropagation()
    this.celebrate(hit)
  }

  celebrate(who: Emoji, others = this.cast) {
    const now = this.clock.elapsedTime
    who.cheer()
    for (let i = 0; i < 7; i++) this.spawn('star', who.x, who.y + who.r, (random() - 0.5) * 7 * who.r, (2 + random() * 4) * who.r, who.r * 0.2, 0.9, 7 * who.r)
    for (const o of others) if (o !== who) o.lookAt(who, 1.8, now)
  }

  /** The cast of the slide at this click: newcomers fall in, and the others react. */
  show(scene: Scene | undefined, step: number) {
    if (scene !== this.shown) {
      for (const c of this.cast) this.scene.remove(c.group)
      this.cast = []
      this.later = []
      this.shown = scene
      this.step = -1
    }
    if (!scene) return
    const wanted = scene.parts.filter((p) => (p.at ?? 0) <= step)
    this.cast = this.cast.filter((c) => {
      if (wanted.includes(c.part)) return true
      this.scene.remove(c.group)
      return false
    })
    wanted.forEach((part, i) => {
      if (this.cast.some((c) => c.part === part)) return
      const emoji = new Emoji(part, this.step < 0 ? 0.15 + i * 0.16 : 0)
      this.cast.push(emoji)
      this.scene.add(emoji.group)
    })
    if (this.step >= 0 && step > this.step) this.react(scene, step)
    this.step = step
  }

  react(scene: Scene, step: number) {
    const now = this.clock.elapsedTime
    if (scene.play === 'row' && this.cast[step - 1]) this.celebrate(this.cast[step - 1])
    if (scene.play === 'pair') {
      const winner = this.cast[scene.winner ?? 0]
      const loser = this.cast.find((c) => c !== winner)!
      this.celebrate(winner)
      this.later.push({ at: now + 0.6, run: () => winner.dashTo(loser, this.clock.elapsedTime) })
    }
    if (scene.play === 'climb') {
      const newcomer = this.cast[this.cast.length - 1]
      for (const c of this.cast) if (c !== newcomer) { c.lookAt(newcomer, 2.5, now); c.cheer(5) }
    }
  }

  /** Every few seconds something happens by itself. */
  idle(t: number) {
    this.idleAt = t + 3 + random() * 2.5
    const cast = this.cast.filter((c) => c.landed)
    if (!cast.length) return
    if (this.shown?.play === 'wave') {
      cast.forEach((c, i) => this.later.push({ at: t + i * 0.14, run: () => c.cheer(8) }))
    } else if (cast.length === 1) {
      cast[0].cheer(5)
    } else {
      const i = Math.floor(random() * cast.length)
      const j = i === 0 ? 1 : i === cast.length - 1 ? i - 1 : i + (random() < 0.5 ? -1 : 1)
      cast[i].dashTo(cast[j], t)
    }
  }

  spawn(glyph: keyof Glyphs, x: number, y: number, vx: number, vy: number, size: number, life: number, fall = 0) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glyphs[glyph], transparent: true, depthWrite: false }))
    sprite.position.set(x, y, 120)
    sprite.scale.setScalar(size)
    this.scene.add(sprite)
    this.bits.push({ sprite, vx, vy, fall, life, age: 0 })
  }

  puff(c: Emoji, t: number) {
    const extra = EXTRAS[c.part.name]
    if (!extra || t < c.puffAt || CALM) return
    c.puffAt = t + extra.every
    if (extra.flip) c.side = -c.side
    const { x, y } = c.group.position
    this.spawn(extra.glyph, x + extra.from[0] * c.side * c.r, y + extra.from[1] * c.r, extra.speed[0] * c.side * c.r, extra.speed[1] * c.r, extra.size * c.r, 1.3, (extra.fall ?? 0) * c.r)
  }

  bump(a: Emoji, b: Emoji, t: number) {
    const dir = Math.sign(b.x - a.x)
    a.pushV = -dir * 4
    b.pushV += dir * 7
    a.dash = null
    b.squashV -= 2
    this.spawn('star', (a.x + b.x) / 2, a.y + a.r * 0.3, 0, 40, a.r * 0.3, 0.45)
    b.lookAt(a, 1.2, t)
  }

  tick = () => {
    this.frame = requestAnimationFrame(this.tick)
    const dt = min(this.clock.getDelta(), 0.05)
    const t = this.clock.elapsedTime
    if (t > this.idleAt) this.idle(t)
    this.later = this.later.filter((l) => {
      if (l.at > t) return true
      l.run()
      return false
    })

    const lookingAtPointer = t - this.pointerAt < 3
    this.cast.forEach((c, i) => {
      if (c.wait > 0) {
        c.wait -= dt
        return
      }
      const partner = this.shown?.play === 'pair' ? this.cast[1 - i] : undefined
      const target = lookingAtPointer ? this.pointer : partner ? ([partner.x, partner.y] as [number, number]) : null
      const thud = c.update(dt, t, target)
      if (thud && c.part.name === 'furious') {
        this.shake = 1
        for (const o of this.cast) if (o !== c) o.cheer(7)
      }
      this.puff(c, t)
      const other = c.dash
      if (other && Math.abs(c.group.position.x - other.group.position.x) < c.r + other.r) this.bump(c, other, t)
      else if (other && abs(c.pushV) < 0.5) c.dash = null
    })

    this.bits = this.bits.filter((b) => {
      b.age += dt
      b.vy -= b.fall * dt
      b.sprite.position.x += b.vx * dt
      b.sprite.position.y += b.vy * dt
      b.sprite.material.opacity = 1 - (b.age / b.life) ** 3
      if (b.age < b.life) return true
      this.scene.remove(b.sprite)
      b.sprite.material.dispose()
      return false
    })

    this.shake *= 0.9
    this.camera.position.x = (random() - 0.5) * 16 * this.shake
    this.camera.position.y = (random() - 0.5) * 16 * this.shake
    this.renderer.render(this.scene, this.camera)
  }

  stop() {
    cancelAnimationFrame(this.frame)
    removeEventListener('resize', this.fit)
    removeEventListener('pointermove', this.onMove)
    removeEventListener('click', this.onClick, true)
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}

export default function EmojiWorld({ scene, step }: { scene?: Scene; step: number }) {
  const host = useRef<HTMLDivElement>(null)
  const world = useRef<World | null>(null)

  useEffect(() => {
    const w = new World(host.current!)
    world.current = w
    return () => { w.stop(); world.current = null }
  }, [])

  useEffect(() => { world.current?.show(scene, step) }, [scene, step])

  return <div ref={host} className="emoji-world" />
}
