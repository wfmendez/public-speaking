import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EVERYDAY, LOOP, TOOLS } from './data'

/**
 * One persistent 3D world for the middle of the class, drawn as white line art on the blue
 * LED wall. Each zone sits in its own corner of the scene; slides only say where the camera
 * should be (`shotFor`) and the camera glides there.
 *
 *   core (0,0,0)    the agent loop: Goal → Plan → Act → Check
 *   tools (40,0,0)  cards the agent can use
 *   memory (0,0,-40) stacked context slabs
 *   versus (-40,0,0) chatbot (flat card) vs agent (spinning loop)
 *   everyday (0,0,40) carousel of real-life tasks
 */

type V3 = [number, number, number]
type Shot = { pos: V3; look: V3 }

const RING = 6
const nodePos = (i: number): V3 => {
  // on the diagonals, so from the front no node (or label) sits right in front of the centre
  const a = (i / LOOP.length) * Math.PI * 2 - (3 * Math.PI) / 4
  return [Math.cos(a) * RING, 0, Math.sin(a) * RING]
}

const FAR: Shot = { pos: [0, 30, 90], look: [0, 0, 0] }
const MINT = '#3dffc8'
const SNOW = '#f3f6ff'
const NAVY = '#0d1660'

/** Where the camera goes for each slide/step of the agents deck. 3D is visible for slides 5–9 and 11. */
export function shotFor(slide: number, step: number): Shot | null {
  switch (slide) {
    case 4: return { pos: [0, 6, 18], look: [0, 0, 0] }
    case 5: {
      if (step === 0) return { pos: [0, 15, 17], look: [0, -3.5, 0] }
      const [x, , z] = nodePos(step - 1)
      return { pos: [x * 2.9, 6, z * 2.9], look: [x * 0.8, 0, z * 0.8] }
    }
    case 6: return { pos: [40, 3, 22], look: [40, 0.5, 0] }
    case 7: return { pos: [12, 7, -26], look: [0, 2 + step * 0.6, -40] }
    case 8: return { pos: [-40, 3, 16], look: [-40, 0.5, 0] }
    case 10: return { pos: [0, 3, 58], look: [0, 1, 40] }
    default: return null
  }
}

// Canvas labels are painted before the web fonts may be ready; each registers a repaint here.
const repaints: (() => void)[] = []

/** Simple line icons drawn on a canvas (same stroke style as the slides). */
function drawIcon(g: CanvasRenderingContext2D, icon: string, cx: number, cy: number, s: number) {
  g.save()
  g.translate(cx, cy)
  g.scale(s / 100, s / 100)
  g.lineWidth = 7
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.beginPath()
  switch (icon) {
    case 'search': g.arc(-10, -10, 32, 0, Math.PI * 2); g.moveTo(14, 14); g.lineTo(44, 44); break
    case 'calendar':
      g.roundRect(-45, -38, 90, 80, 10); g.moveTo(-45, -14); g.lineTo(45, -14)
      g.moveTo(-22, -50); g.lineTo(-22, -28); g.moveTo(22, -50); g.lineTo(22, -28)
      for (const [x, y] of [[-22, 6], [0, 6], [22, 6], [-22, 24], [0, 24]]) { g.moveTo(x + 4, y); g.arc(x, y, 4, 0, Math.PI * 2) }
      break
    case 'email': g.roundRect(-48, -32, 96, 64, 8); g.moveTo(-48, -30); g.lineTo(0, 6); g.lineTo(48, -30); break
    case 'files': g.moveTo(-45, 38); g.lineTo(-45, -36); g.lineTo(-12, -36); g.lineTo(0, -24); g.lineTo(45, -24); g.lineTo(45, 38); g.closePath(); break
    case 'code': g.moveTo(-18, -30); g.lineTo(-48, 0); g.lineTo(-18, 30); g.moveTo(18, -30); g.lineTo(48, 0); g.lineTo(18, 30); g.moveTo(8, -40); g.lineTo(-8, 40); break
    case 'trip': g.moveTo(-48, 10); g.lineTo(48, -30); g.lineTo(20, 40); g.lineTo(4, 4); g.closePath(); g.moveTo(4, 4); g.lineTo(48, -30); break
    case 'inbox': g.roundRect(-48, -36, 96, 72, 8); g.moveTo(-48, 8); g.lineTo(-18, 8); g.lineTo(-10, 22); g.lineTo(10, 22); g.lineTo(18, 8); g.lineTo(48, 8); break
    case 'research': g.moveTo(0, -30); g.lineTo(-48, -40); g.lineTo(-48, 32); g.lineTo(0, 42); g.lineTo(48, 32); g.lineTo(48, -40); g.closePath(); g.moveTo(0, -30); g.lineTo(0, 42); break
    case 'game':
      g.roundRect(-50, -28, 100, 56, 28); g.moveTo(-28, -10); g.lineTo(-28, 10); g.moveTo(-38, 0); g.lineTo(-18, 0)
      g.moveTo(28, -6); g.arc(24, -6, 4, 0, Math.PI * 2); g.moveTo(40, 6); g.arc(36, 6, 4, 0, Math.PI * 2)
      break
  }
  g.stroke()
  g.restore()
}

/** A UI card: mono label, line icon, big name. White lines on navy, like the slides. */
function cardTexture(label: string, icon: string, name: string, w = 512, h = 640) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  const tex = new THREE.CanvasTexture(c)
  const paint = () => {
    g.clearRect(0, 0, w, h)
    g.fillStyle = NAVY
    g.strokeStyle = SNOW
    g.lineWidth = 6
    g.beginPath()
    g.roundRect(6, 6, w - 12, h - 12, 28)
    g.fill()
    g.stroke()
    g.fillStyle = MINT
    g.font = '500 28px "JetBrains Mono", monospace'
    g.textBaseline = 'top'
    g.fillText(label.toUpperCase(), 36, 34)
    g.fillRect(36, 80, w - 72, 3)
    g.strokeStyle = MINT
    drawIcon(g, icon, w / 2, h * 0.43, w * 0.42)
    g.fillStyle = SNOW
    g.textAlign = 'left'
    g.textBaseline = 'alphabetic'
    let size = Math.round(h * 0.11)
    g.font = `800 ${size}px "Inter Tight", sans-serif`
    while (g.measureText(name).width > w - 72 && size > 30) {
      size -= 4
      g.font = `800 ${size}px "Inter Tight", sans-serif`
    }
    g.fillText(name, 36, h - 48)
    tex.needsUpdate = true
  }
  paint()
  repaints.push(paint)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function textSprite(text: string, color: string, scale = 3) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 160
  const g = c.getContext('2d')!
  const tex = new THREE.CanvasTexture(c)
  const paint = () => {
    g.clearRect(0, 0, 512, 160)
    g.font = '800 100px "Inter Tight", sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = color
    g.fillText(text, 256, 80)
    tex.needsUpdate = true
  }
  paint()
  repaints.push(paint)
  tex.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }))
  sprite.scale.set(scale, (scale * 160) / 512, 1)
  return sprite
}

const lineMat = (color = SNOW, opacity = 0.9) => new THREE.LineBasicMaterial({ color, transparent: true, opacity })
/** Only the outline of a shape, plus a faint navy fill so lines behind it are hidden. */
function outlined(geo: THREE.BufferGeometry, color = SNOW, fill = NAVY, fillOpacity = 0.85) {
  const group = new THREE.Group()
  const body = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: fill, transparent: fillOpacity < 1, opacity: fillOpacity, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }))
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat(color))
  group.add(body, edges)
  return { group, edges }
}

function circle(radius: number, color = SNOW, opacity = 0.8) {
  const pts = Array.from({ length: 161 }, (_, i) => {
    const a = (i / 160) * Math.PI * 2
    return new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius)
  })
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(color, opacity))
}

export default function World({ slide, step }: { slide: number; step: number }) {
  const host = useRef<HTMLDivElement>(null)
  const state = useRef({ slide, step })
  state.current = { slide, step }
  const active = shotFor(slide, step) !== null

  useEffect(() => {
    const el = host.current!
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2('#1a2aa8', 0.014)
    const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 400)
    camera.position.set(...FAR.pos)
    const look = new THREE.Vector3(...FAR.look)

    // floor grid + a few drifting specks
    const grid = new THREE.GridHelper(260, 130, SNOW, SNOW)
    grid.position.y = -4
    ;(grid.material as THREE.Material).transparent = true
    ;(grid.material as THREE.Material).opacity = 0.13
    scene.add(grid)
    const pCount = 700
    const pGeo = new THREE.BufferGeometry()
    const pArr = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      pArr[i * 3] = (Math.random() - 0.5) * 220
      pArr[i * 3 + 1] = Math.random() * 60 - 4
      pArr[i * 3 + 2] = (Math.random() - 0.5) * 220
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3))
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: SNOW, size: 0.08, transparent: true, opacity: 0.45, depthWrite: false }))
    scene.add(particles)

    // --- core: the agent loop ---
    const core = new THREE.Group()
    const brain = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.9, 1)), lineMat(SNOW, 0.55))
    const heart = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 24), new THREE.MeshBasicMaterial({ color: MINT }))
    const ring = circle(RING, SNOW, 0.75)
    const ringInner = circle(RING - 0.35, SNOW, 0.2)
    core.add(brain, heart, ring, ringInner)
    const nodes = LOOP.map((name, i) => {
      const { group, edges } = outlined(new THREE.OctahedronGeometry(0.9, 0))
      group.position.set(...nodePos(i))
      const label = textSprite(name, SNOW, 3.4)
      label.position.set(nodePos(i)[0], 1.9, nodePos(i)[2])
      core.add(group, label)
      return { group, edges, label }
    })
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), new THREE.MeshBasicMaterial({ color: MINT }))
    core.add(pulse)
    scene.add(core)

    // --- tools: cards that flip in ---
    const side = new THREE.MeshBasicMaterial({ color: NAVY })
    const tools = TOOLS.map((t, i) => {
      const face = new THREE.MeshBasicMaterial({ map: cardTexture(`Tool 0${i + 1}`, t.icon, t.name), transparent: true })
      const card = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4, 0.12), [side, side, side, side, face, side])
      const a = ((i - 2) / 4) * 1.5
      card.position.set(40 + Math.sin(a) * 13, 0.5, -Math.cos(a) * 13 + 13)
      card.rotation.y = Math.PI
      scene.add(card)
      return { card, baseY: -a }
    })

    // --- memory: slabs that stack ---
    const slabs = [0, 1, 2].map((i) => {
      const { group } = outlined(new THREE.BoxGeometry(7 - i * 1.2, 0.7, 4.5 - i * 0.6), MINT, MINT, 0.14)
      group.position.set(0, -12, -40)
      scene.add(group)
      return group
    })
    const memoryBase = circle(5.2, SNOW, 0.6)
    memoryBase.position.set(0, -0.4, -40)
    scene.add(memoryBase)

    // --- versus: chatbot (flat, still) vs agent (alive loop) ---
    const chat = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4.25), new THREE.MeshBasicMaterial({ map: cardTexture('Chatbot', 'inbox', 'One answer'), transparent: true }))
    chat.position.set(-45, 1, 0)
    const agentKnot = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.TorusKnotGeometry(1.4, 0.38, 64, 6)), lineMat(MINT, 0.6))
    agentKnot.position.set(-35, 1, 0)
    scene.add(chat, agentKnot)

    // --- everyday: a carousel ---
    const carousel = new THREE.Group()
    carousel.position.set(0, 1, 40)
    EVERYDAY.forEach((e, i) => {
      const a = (i / EVERYDAY.length) * Math.PI * 2
      // two faces back to back, so the text reads correctly from either side
      const mat = new THREE.MeshBasicMaterial({ map: cardTexture(`Task 0${i + 1}`, e.icon, e.name), transparent: true })
      for (const flip of [0, Math.PI]) {
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(6, 7.5), mat)
        panel.position.set(Math.sin(a) * 8, 0, Math.cos(a) * 8)
        panel.rotation.y = a + flip
        carousel.add(panel)
      }
    })
    carousel.add(circle(8.6, SNOW, 0.4).translateY(-3.9))
    scene.add(carousel)

    // repaint the labels once the class fonts have loaded
    Promise.all([document.fonts.load('800 40px "Inter Tight"'), document.fonts.load('500 28px "JetBrains Mono"')])
      .then(() => repaints.splice(0).forEach((paint) => paint()))

    const resize = () => {
      const w = el.clientWidth || window.innerWidth
      const h = el.clientHeight || window.innerHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    window.addEventListener('resize', resize)

    const target = new THREE.Vector3()
    const targetLook = new THREE.Vector3()
    const one = new THREE.Vector3()
    const clock = new THREE.Clock()
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(clock.getDelta(), 0.05)
      const t = clock.elapsedTime
      const { slide: s, step: st } = state.current
      const shot = shotFor(s, st) ?? FAR
      target.set(...shot.pos)
      targetLook.set(...shot.look)
      const k = 1 - Math.exp(-dt * 1.8)
      camera.position.lerp(target, k)
      look.lerp(targetLook, k)
      camera.lookAt(look)

      // ambient motion
      brain.rotation.y += dt * 0.4
      brain.rotation.x += dt * 0.15
      heart.scale.setScalar(1 + Math.sin(t * Math.PI * (112 / 30)) * 0.08) // pulses at 112 BPM, like the music
      const pa = t * 0.9
      pulse.position.set(Math.cos(pa) * RING, 0, Math.sin(pa) * RING)
      nodes.forEach(({ group, edges, label }, i) => {
        group.rotation.y += dt
        const focus = s === 5 && st === i + 1
        group.scale.lerp(one.setScalar(focus ? 1.4 : 1), k)
        ;(edges.material as THREE.LineBasicMaterial).color.set(focus ? MINT : SNOW)
        // the slide caption names the node being visited, so its own label steps aside
        const lm = label.material as THREE.SpriteMaterial
        lm.opacity += ((focus ? 0 : 1) - lm.opacity) * k * 2
      })
      particles.rotation.y += dt * 0.01
      grid.position.z = (t * 2) % 2

      tools.forEach(({ card, baseY }, i) => {
        const shown = s > 6 || (s === 6 && st > i)
        const want = shown ? baseY : baseY + Math.PI
        card.rotation.y += (want - card.rotation.y) * k * 1.4
        card.position.y = 0.5 + Math.sin(t * 1.5 + i) * 0.15
      })
      slabs.forEach((sl, i) => {
        const shown = s > 7 || (s === 7 && st > i)
        const y = shown ? 0.2 + i * 1.1 : -12
        sl.position.y += (y - sl.position.y) * k * 1.4
        sl.visible = s >= 7 // hidden under the floor until the memory slide
        sl.rotation.y += dt * 0.2 * (i % 2 ? -1 : 1)
      })
      agentKnot.rotation.x += dt * 0.8
      agentKnot.rotation.y += dt * 1.1
      chat.position.y = 1 + Math.sin(t) * 0.05
      const turn = s === 10 ? -Math.max(st - 1, 0) * (Math.PI / 2) : 0
      carousel.rotation.y += (turn - carousel.rotation.y) * k
      carousel.visible = s >= 9 // keeps it out of the background of the loop shots

      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      renderer.dispose()
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh
        mesh.geometry?.dispose()
        const m = mesh.material
        ;(Array.isArray(m) ? m : m ? [m] : []).forEach((mm) => mm.dispose())
      })
      el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={host} className={`world${active ? ' on' : ''}`} />
}
