/**
 * A small generative soundtrack (Web Audio, no audio files) that follows the class:
 * each slide asks for a "mix" (which layers play, how loud, how muffled) and the music
 * moves there on the beat. Clicks also fire short cues (whoosh, blip, chime, typing ticks).
 *
 * Browsers only allow sound after a user gesture; the first clicker press unlocks it.
 */

export type Layer = 'kick' | 'hat' | 'clap' | 'bass' | 'pad' | 'arp' | 'stab'
export type Mix = {
  layers: Partial<Record<Layer, number>>
  /** overall loudness 0..1 (kept low while the speaker talks) */
  level: number
  /** master low-pass in Hz: low = "music in the next room", high = full and bright */
  cutoff: number
  /** kick on beats 1 and 3 only */
  half?: boolean
}

export const BPM = 112
const SIXTEENTH = 60 / BPM / 4
const LAYERS: Layer[] = ['kick', 'hat', 'clap', 'bass', 'pad', 'arp', 'stab']

// A minor loop: Am – F – C – G (one chord per bar)
const CHORDS = [
  { root: 33, notes: [57, 60, 64] },
  { root: 29, notes: [57, 60, 65] },
  { root: 36, notes: [55, 60, 64] },
  { root: 31, notes: [55, 59, 62] },
]
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

export const SILENT: Mix = { layers: {}, level: 0, cutoff: 800 }

class Music {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private filter!: BiquadFilterNode
  private duck!: GainNode
  private gains = {} as Record<Layer, GainNode>
  private noise!: AudioBuffer
  private mix: Mix = SILENT
  private timer = 0
  private nextTime = 0
  private sixteenth = 0
  private muted = false
  private beatListeners = new Set<() => void>()
  private muteListeners = new Set<(muted: boolean) => void>()

  /** Call from a user gesture (key, click, touch). Safe to call many times. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    this.ctx = ctx

    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.ratio.value = 4
    comp.connect(ctx.destination)
    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(comp)
    this.filter = ctx.createBiquadFilter()
    this.filter.type = 'lowpass'
    this.filter.Q.value = 0.7
    this.filter.frequency.value = 800
    this.filter.connect(this.master)
    // pad, bass and arp "pump" under the kick
    this.duck = ctx.createGain()
    this.duck.connect(this.filter)
    for (const l of LAYERS) {
      const g = ctx.createGain()
      g.gain.value = 0
      g.connect(l === 'pad' || l === 'bass' || l === 'arp' ? this.duck : this.filter)
      this.gains[l] = g
    }

    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = this.noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

    this.nextTime = ctx.currentTime + 0.1
    this.timer = window.setInterval(() => this.schedule(), 25)
    this.apply(true)
  }

  setMix(mix: Mix) {
    this.mix = mix
    this.apply(false)
  }

  toggleMute() {
    this.muted = !this.muted
    this.apply(false)
    this.muteListeners.forEach((f) => f(this.muted))
  }

  onBeat(f: () => void) { this.beatListeners.add(f); return () => { this.beatListeners.delete(f) } }
  onMute(f: (muted: boolean) => void) { this.muteListeners.add(f); return () => { this.muteListeners.delete(f) } }

  /** Moves every layer and the master toward the current mix. */
  private apply(now: boolean) {
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const k = now ? 0.01 : 0.35
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.mix.level, t, k)
    this.filter.frequency.setTargetAtTime(this.mix.cutoff, t, k)
    for (const l of LAYERS) this.gains[l].gain.setTargetAtTime(this.mix.layers[l] ?? 0, t, k * 0.6)
  }

  private schedule() {
    const ctx = this.ctx!
    while (this.nextTime < ctx.currentTime + 0.12) {
      this.play16(this.sixteenth, this.nextTime)
      this.nextTime += SIXTEENTH
      this.sixteenth = (this.sixteenth + 1) % 64
    }
  }

  private on(l: Layer) { return (this.mix.layers[l] ?? 0) > 0.001 && !this.muted && this.mix.level > 0 }

  private play16(n: number, t: number) {
    const s = n % 16
    const chord = CHORDS[Math.floor(n / 16)]
    if (s % 4 === 0 && this.on('kick')) {
      const delay = Math.max(0, (t - this.ctx!.currentTime) * 1000)
      window.setTimeout(() => this.beatListeners.forEach((f) => f()), delay)
    }
    if (this.on('kick') && (this.mix.half ? s % 8 === 0 : s % 4 === 0)) this.kick(t)
    if (this.on('hat')) {
      if (s % 4 === 2) this.hat(t, 0.35)
      else if (s % 2 === 1) this.hat(t, 0.1)
    }
    if (this.on('clap') && (s === 4 || s === 12)) this.clap(t)
    if (this.on('bass') && s % 4 === 2) this.bass(t, chord.root)
    if (this.on('pad') && s === 0) this.pad(t, chord.notes)
    if (this.on('arp') && s % 2 === 0) this.arp(t, chord.notes[(s / 2) % 3] + 12 + (s >= 8 ? 12 : 0))
    if (this.on('stab') && (s === 0 || s === 6 || s === 10)) this.stab(t, chord.notes)
  }

  // ---------- instruments ----------

  private env(t: number, peak: number, decay: number, out: AudioNode, attack = 0.003) {
    const g = this.ctx!.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(peak, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
    g.connect(out)
    return g
  }

  private osc(type: OscillatorType, freq: number, t: number, dur: number, out: AudioNode, detune = 0) {
    const o = this.ctx!.createOscillator()
    o.type = type
    o.frequency.value = freq
    o.detune.value = detune
    o.connect(out)
    o.start(t)
    o.stop(t + dur + 0.05)
    return o
  }

  private noiseBurst(t: number, dur: number, out: AudioNode) {
    const src = this.ctx!.createBufferSource()
    src.buffer = this.noise
    src.connect(out)
    src.start(t, Math.random() * 0.5)
    src.stop(t + dur + 0.05)
  }

  private kick(t: number) {
    const o = this.osc('sine', 150, t, 0.4, this.env(t, 1, 0.38, this.gains.kick))
    o.frequency.setValueAtTime(150, t)
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12)
    this.duck.gain.cancelScheduledValues(t)
    this.duck.gain.setValueAtTime(0.35, t)
    this.duck.gain.linearRampToValueAtTime(1, t + 0.26)
  }

  private hat(t: number, peak: number) {
    const hp = this.ctx!.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 7500
    hp.connect(this.env(t, peak, 0.05, this.gains.hat))
    this.noiseBurst(t, 0.06, hp)
  }

  private clap(t: number) {
    const bp = this.ctx!.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1600
    bp.Q.value = 0.9
    bp.connect(this.env(t, 0.7, 0.18, this.gains.clap))
    this.noiseBurst(t, 0.2, bp)
  }

  private bass(t: number, root: number) {
    const lp = this.ctx!.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 520
    lp.connect(this.env(t, 0.55, 0.22, this.gains.bass))
    this.osc('sawtooth', hz(root + 12), t, 0.25, lp)
  }

  private pad(t: number, notes: number[]) {
    const bar = SIXTEENTH * 16
    const lp = this.ctx!.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1300
    const g = this.ctx!.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.09, t + 0.5)
    g.gain.setValueAtTime(0.09, t + bar - 0.3)
    g.gain.linearRampToValueAtTime(0, t + bar + 0.2)
    g.connect(this.gains.pad)
    lp.connect(g)
    for (const n of notes) for (const d of [-8, 8]) this.osc('sawtooth', hz(n), t, bar + 0.25, lp, d)
  }

  private arp(t: number, note: number) {
    this.osc('triangle', hz(note), t, 0.2, this.env(t, 0.22, 0.18, this.gains.arp))
  }

  private stab(t: number, notes: number[]) {
    const lp = this.ctx!.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 2200
    lp.connect(this.env(t, 0.12, 0.16, this.gains.stab))
    for (const n of notes) this.osc('square', hz(n + 12), t, 0.18, lp)
  }

  // ---------- cues (played straight away, outside the mix filter) ----------

  private cueOut(peak: number) {
    const g = this.ctx!.createGain()
    g.gain.value = this.muted ? 0 : peak
    g.connect(this.master.context.destination)
    return g
  }

  /** Slide change: a short rising noise sweep. */
  whoosh() {
    const ctx = this.ctx
    if (!ctx || this.muted) return
    const t = ctx.currentTime
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 1.4
    bp.frequency.setValueAtTime(300, t)
    bp.frequency.exponentialRampToValueAtTime(5000, t + 0.45)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.16, t + 0.3)
    g.gain.linearRampToValueAtTime(0, t + 0.5)
    g.connect(this.cueOut(1))
    bp.connect(g)
    this.noiseBurst(t, 0.55, bp)
  }

  /** Step inside a slide: a soft blip. */
  blip() {
    const ctx = this.ctx
    if (!ctx || this.muted) return
    const t = ctx.currentTime
    this.osc('sine', 1320, t, 0.12, this.env(t, 0.06, 0.1, this.cueOut(1)))
  }

  /** A typed character: a tiny click. */
  type() {
    const ctx = this.ctx
    if (!ctx || this.muted) return
    const t = ctx.currentTime
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 3000
    hp.connect(this.env(t, 0.035, 0.02, this.cueOut(1)))
    this.noiseBurst(t, 0.03, hp)
  }

  /** Quiz answer / big moment: two rising notes. */
  chime() {
    const ctx = this.ctx
    if (!ctx || this.muted) return
    const t = ctx.currentTime
    this.osc('triangle', hz(76), t, 0.3, this.env(t, 0.12, 0.28, this.cueOut(1)))
    this.osc('triangle', hz(83), t + 0.11, 0.4, this.env(t + 0.11, 0.12, 0.38, this.cueOut(1)))
  }

  /** The drop: a deep boom. */
  impact() {
    const ctx = this.ctx
    if (!ctx || this.muted) return
    const t = ctx.currentTime
    const o = this.osc('sine', 90, t, 1.2, this.env(t, 0.5, 1.1, this.cueOut(1)))
    o.frequency.exponentialRampToValueAtTime(30, t + 1)
  }

  stop() {
    window.clearInterval(this.timer)
    this.ctx?.close()
    this.ctx = null
  }
}

export const music = new Music()
