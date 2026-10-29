import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EVERYDAY, LOOP, LOOP_COLORS, TOOLS } from './data'

/**
 * One persistent 3D world for the middle of the class. Each zone sits in its own corner of the
 * scene; slides only say where the camera should be (`SHOTS`) and the camera glides there.
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
  const a = (i / LOOP.length) * Math.PI * 2 - Math.PI / 2
  return [Math.cos(a) * RING, 0, Math.sin(a) * RING]
}

const FAR: Shot = { pos: [0, 30, 90], look: [0, 0, 0] }

/** Where the camera goes for each slide/step of the agents deck. 3D is visible for slides 4–11. */
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
    case 9: return { pos: [-10, 38, 50], look: [-10, 46, 0] } // quiz: up into the stars, nothing behind the text
    case 10: return { pos: [0, 3, 58], look: [0, 1, 40] }
    case 11: return { pos: [0.1, 78, 6], look: [0, 0, 0] }
    default: return null
  }
}

// Canvas labels are painted before the web font may be ready; each registers a repaint here.
const repaints: (() => void)[] = []

/** A canvas texture with an emoji/icon and a label, in the class font. */
function labelTexture(icon: string, text: string, color: string, w = 512, h = 640) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  const tex = new THREE.CanvasTexture(c)
  const paint = () => {
  g.clearRect(0, 0, w, h)
  const grad = g.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, 'rgba(20,18,40,0.95)')
  grad.addColorStop(1, 'rgba(8,7,20,0.95)')
  g.fillStyle = grad
  g.beginPath()
  g.roundRect(8, 8, w - 16, h - 16, 40)
  g.fill()
  g.lineWidth = 8
  g.strokeStyle = color
  g.shadowColor = color
  g.shadowBlur = 30
  g.stroke()
  g.shadowBlur = 0
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `${Math.round(h * 0.3)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`
  g.fillText(icon, w / 2, h * 0.4)
  g.fillStyle = '#eaf2ff'
  g.font = `600 ${Math.round(h * 0.085)}px "Space Grotesk", sans-serif`
  g.fillText(text, w / 2, h * 0.78)
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
    g.font = '700 96px "Space Grotesk", sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.shadowColor = color
    g.shadowBlur = 24
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

const glow = (color: string, intensity = 1.6) =>
  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.3, metalness: 0.2 })

export default function World({ slide, step }: { slide: number; step: number }) {
  const host = useRef<HTMLDivElement>(null)
  const state = useRef({ slide, step })
  state.current = { slide, step }
  const active = shotFor(slide, step) !== null

  useEffect(() => {
    const el = host.current!
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2('#06050d', 0.012)
    const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 400)
    camera.position.set(...FAR.pos)
    const look = new THREE.Vector3(...FAR.look)

    scene.add(new THREE.AmbientLight('#6a5cff', 0.6))
    const key = new THREE.PointLight('#00e5ff', 400, 120)
    key.position.set(10, 20, 20)
    const rim = new THREE.PointLight('#ff2bd6', 400, 120)
    rim.position.set(-20, 10, -20)
    scene.add(key, rim)

    // floor grid + drifting particles
    const grid = new THREE.GridHelper(260, 130, '#1f3a66', '#1f3a66')
    grid.position.y = -4
    ;(grid.material as THREE.Material).transparent = true
    ;(grid.material as THREE.Material).opacity = 0.35
    scene.add(grid)
    const pCount = 1600
    const pGeo = new THREE.BufferGeometry()
    const pArr = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      pArr[i * 3] = (Math.random() - 0.5) * 220
      pArr[i * 3 + 1] = Math.random() * 60 - 4
      pArr[i * 3 + 2] = (Math.random() - 0.5) * 220
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3))
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: '#9fdcff', size: 0.12, transparent: true, opacity: 0.7, depthWrite: false }))
    scene.add(particles)

    // --- core: the agent loop ---
    const core = new THREE.Group()
    const brain = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8, 1), new THREE.MeshStandardMaterial({ color: '#7b5cff', emissive: '#3b1cff', emissiveIntensity: 0.8, wireframe: true }))
    const heart = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), glow('#00e5ff', 2.2))
    const ring = new THREE.Mesh(new THREE.TorusGeometry(RING, 0.06, 12, 160), glow('#eaf2ff', 0.8))
    ring.rotation.x = Math.PI / 2
    core.add(brain, heart, ring)
    const nodes = LOOP.map((name, i) => {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), glow(LOOP_COLORS[i], 2))
      m.position.set(...nodePos(i))
      const label = textSprite(name, LOOP_COLORS[i], 4)
      label.position.set(nodePos(i)[0], 1.9, nodePos(i)[2])
      core.add(m, label)
      return m
    })
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), glow('#ffffff', 3))
    core.add(pulse)
    scene.add(core)

    // --- tools: cards that flip in ---
    const tools = TOOLS.map((t, i) => {
      const mat = new THREE.MeshBasicMaterial({ map: labelTexture(t.icon, t.name, LOOP_COLORS[i % 4]), transparent: true })
      const card = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4, 0.12), [glow('#1a1636', 0.2), glow('#1a1636', 0.2), glow('#1a1636', 0.2), glow('#1a1636', 0.2), mat, glow('#1a1636', 0.2)])
      const a = ((i - 2) / 4) * 1.5
      card.position.set(40 + Math.sin(a) * 13, 0.5, -Math.cos(a) * 13 + 13)
      card.rotation.y = Math.PI
      scene.add(card)
      return { card, baseY: -a }
    })

    // --- memory: slabs that stack ---
    const slabs = [0, 1, 2].map((i) => {
      const s = new THREE.Mesh(
        new THREE.BoxGeometry(7 - i * 1.2, 0.7, 4.5 - i * 0.6),
        new THREE.MeshStandardMaterial({ color: '#00e5ff', emissive: '#00e5ff', emissiveIntensity: 0.5, transparent: true, opacity: 0.55 }),
      )
      s.position.set(0, -12, -40)
      scene.add(s)
      return s
    })
    const memoryBase = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.4, 0.4, 48), glow('#2a2060', 0.4))
    memoryBase.position.set(0, -0.6, -40)
    scene.add(memoryBase)

    // --- versus: chatbot (flat, still) vs agent (alive loop) ---
    const chat = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3), new THREE.MeshBasicMaterial({ map: labelTexture('💬', 'Answers', '#9aa4c7', 640, 440), transparent: true }))
    chat.position.set(-45, 1, 0)
    const agentKnot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.4, 0.38, 180, 20), glow('#ff2bd6', 1.4))
    agentKnot.position.set(-35, 1, 0)
    scene.add(chat, agentKnot)

    // --- everyday: a carousel ---
    const carousel = new THREE.Group()
    carousel.position.set(0, 1, 40)
    EVERYDAY.forEach((e, i) => {
      const a = (i / EVERYDAY.length) * Math.PI * 2
      // two faces back to back, so the text reads correctly from either side
      const mat = new THREE.MeshBasicMaterial({ map: labelTexture(e.icon, e.name, LOOP_COLORS[i]), transparent: true })
      for (const flip of [0, Math.PI]) {
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(6, 7.5), mat)
        panel.position.set(Math.sin(a) * 8, 0, Math.cos(a) * 8)
        panel.rotation.y = a + flip
        carousel.add(panel)
      }
    })
    scene.add(carousel)

    // repaint the labels once the class font has loaded
    Promise.all([document.fonts.load('600 40px "Space Grotesk"'), document.fonts.load('700 40px "Space Grotesk"')])
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
      heart.scale.setScalar(1 + Math.sin(t * Math.PI * 4) * 0.08) // 120 BPM heartbeat
      const pa = t * 0.9
      pulse.position.set(Math.cos(pa) * RING, 0, Math.sin(pa) * RING)
      nodes.forEach((n, i) => {
        n.rotation.y += dt
        const focus = s === 5 && st === i + 1
        n.scale.lerp(new THREE.Vector3().setScalar(focus ? 1.35 : 1), k)
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
        sl.rotation.y += dt * 0.2 * (i % 2 ? -1 : 1)
      })
      agentKnot.rotation.x += dt * 0.8
      agentKnot.rotation.y += dt * 1.1
      chat.position.y = 1 + Math.sin(t) * 0.05
      const turn = s === 10 ? -Math.max(st - 1, 0) * (Math.PI / 2) : 0
      carousel.rotation.y += (turn - carousel.rotation.y) * k
      core.rotation.y = s === 11 ? core.rotation.y + dt * 0.15 : core.rotation.y * (1 - k)

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
