/**
 * A small generative soundtrack (Web Audio, no audio files) that follows the class:
 * each slide asks for a "mix" (which layers play, how loud, how muffled) and the music
 * moves there on the beat. Clicks also fire short cues (whoosh, blip, chime, typing ticks).
 *
 * Browsers only allow sound after a user gesture; the first clicker press unlocks it.
 */

export type Layer = 'kick' | 'hat' | 'clap' | 'bass' | 'pad' | 'arp' | 'stab' | 'lead' | 'bounce' | 'piano' | 'pluck' | 'shaker'
export type Mix = {
  layers: Partial<Record<Layer, number>>
  /** overall loudness 0..1 (kept low while the speaker talks) */
  level: number
  /** master low-pass in Hz: low = "music in the next room", high = full and bright */
  cutoff: number
  /** kick on beats 1 and 3 only */
  half?: boolean
}

export const BPM = 120
const SIXTEENTH = 60 / BPM / 4
const LAYERS: Layer[] = ['kick', 'hat', 'clap', 'bass', 'pad', 'arp', 'stab', 'lead', 'bounce', 'piano', 'pluck', 'shaker']

// A minor loop: Am – F – C – G (one chord per bar)
const CHORDS = [
  { root: 33, notes: [57, 60, 64] },
  { root: 29, notes: [57, 60, 65] },
  { root: 36, notes: [55, 60, 64] },
  { root: 31, notes: [55, 59, 62] },
]
// the hook: a rising, hopeful line over the chords (eighth notes, 0 = rest)
const LEAD = [
  [76, 0, 76, 74, 76, 0, 79, 76],
  [77, 0, 76, 72, 69, 0, 72, 0],
  [76, 0, 76, 74, 72, 0, 67, 0],
  [74, 0, 74, 76, 79, 0, 81, 79],
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
  private songStart = 0
  private songFrom = 0
  private vduck!: GainNode
  private voice!: GainNode
  private echo!: GainNode
  private room!: GainNode
  private clips = new Map<string, Promise<ArrayBuffer | null>>()
  private decoded = new Map<string, AudioBuffer>()
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
    // the music dips a little whenever the DJ voice speaks
    this.vduck = ctx.createGain()
    this.vduck.connect(this.master)
    this.filter.connect(this.vduck)

    // DJ voice: its own bus (never muffled by the music filter) plus a tempo echo
    this.voice = ctx.createGain()
    this.voice.connect(comp)
    const delay = ctx.createDelay(2)
    delay.delayTime.value = SIXTEENTH * 3
    const feedback = ctx.createGain()
    feedback.gain.value = 0.38
    const tone = ctx.createBiquadFilter()
    tone.type = 'highpass'
    tone.frequency.value = 700
    this.echo = ctx.createGain()
    this.echo.connect(delay)
    delay.connect(tone)
    tone.connect(feedback)
    feedback.connect(delay)
    tone.connect(this.voice)
    // a room for the sung lines: a 2-second reverb made of fading noise
    const verb = ctx.createConvolver()
    const ir = ctx.createBuffer(2, ctx.sampleRate * 2, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c)
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3
    }
    verb.buffer = ir
    this.room = ctx.createGain()
    this.room.connect(verb)
    verb.connect(this.voice)
    // pad, bass and arp "pump" under the kick
    this.duck = ctx.createGain()
    this.duck.connect(this.filter)
    for (const l of LAYERS) {
      const g = ctx.createGain()
      g.gain.value = 0
      g.connect(l === 'pad' || l === 'bass' || l === 'arp' || l === 'bounce' || l === 'piano' ? this.duck : this.filter)
      this.gains[l] = g
    }

    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = this.noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

    this.nextTime = ctx.currentTime + 0.1
    this.timer = window.setInterval(() => this.schedule(), 25)
    this.apply(true)
  }

  /** `cut` jumps straight to the new mix (a hard stop or a drop) instead of easing into it. */
  setMix(mix: Mix, cut = false) {
    this.mix = mix
    this.apply(cut)
  }

  /**
   * Restarts the pattern on bar 1 so a timeline (the opening video) can follow the beat.
   * `from` starts the song at a later beat (for rehearsal).
   */
  startSong(from = 0) {
    const ctx = this.ctx
    if (!ctx) return
    this.songFrom = from
    this.sixteenth = Math.round(from * 4) % 64
    this.nextTime = ctx.currentTime + 0.05
    this.songStart = this.nextTime
  }

  /** Song position in beats, on the audio clock; null when there is no sound. */
  songBeat(): number | null {
    return this.ctx ? (this.ctx.currentTime - this.songStart) / (60 / BPM) + this.songFrom : null
  }

  /** The audio-clock time of a song beat (for scheduling sounds exactly on it). */
  timeAt(beat: number) {
    return this.songStart + (beat - this.songFrom) * (60 / BPM)
  }

  // ---------- DJ voice clips ----------

  /** Starts downloading clips early (before sound is unlocked); decoding happens later. */
  preload(urls: string[]) {
    for (const u of urls) {
      if (!this.clips.has(u)) this.clips.set(u, fetch(u).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null))
    }
  }

  /** Decodes every preloaded clip once sound is available. */
  async decodeAll() {
    const ctx = this.ctx
    if (!ctx) return
    await Promise.all([...this.clips].map(async ([u, p]) => {
      if (this.decoded.has(u)) return
      const data = await p
      if (!data) return
      try { this.decoded.set(u, await ctx.decodeAudioData(data.slice(0))) } catch { /* bad file: the caller falls back */ }
    }))
  }

  hasClip(url: string) { return this.decoded.has(url) }

  /**
   * Plays a voice clip at audio time `when`, with an optional DJ effect:
   * echo (repeats on the beat), stutter (the first syllable three times, "a-a-a-"), scratch (pitch wobble),
   * sing (a sung line: room reverb).
   */
  playClip(url: string, when: number, fx?: 'echo' | 'stutter' | 'scratch' | 'sing') {
    const ctx = this.ctx
    const buf = this.decoded.get(url)
    if (!ctx || !buf || this.muted) return false
    const t = Math.max(when, ctx.currentTime)
    const out = ctx.createGain()
    out.gain.value = 1
    out.connect(this.voice)
    if (fx === 'echo') {
      const send = ctx.createGain()
      send.gain.value = 0.55
      out.connect(send)
      send.connect(this.echo)
    }
    if (fx === 'stutter') {
      for (let i = 3; i >= 1; i--) {
        const s = ctx.createBufferSource()
        s.buffer = buf
        s.connect(out)
        s.start(Math.max(ctx.currentTime, t - i * SIXTEENTH), 0, SIXTEENTH * 0.8)
      }
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(out)
    if (fx === 'scratch') {
      const r = src.playbackRate
      r.setValueAtTime(1, t)
      r.linearRampToValueAtTime(0.35, t + 0.07)
      r.linearRampToValueAtTime(1.8, t + 0.14)
      r.linearRampToValueAtTime(0.5, t + 0.2)
      r.linearRampToValueAtTime(1, t + 0.28)
    }
    if (fx === 'sing') {
      const send = ctx.createGain()
      send.gain.value = 0.3
      out.connect(send)
      send.connect(this.room)
    }
    src.start(t)
    // duck the music under the voice (only a little under singing, so the song doesn't pump)
    const g = this.vduck.gain
    g.setTargetAtTime(fx === 'sing' ? 0.8 : 0.5, t, 0.03)
    g.setTargetAtTime(1, t + buf.duration, 0.2)
    return true
  }

  toggleMute() {
    this.muted = !this.muted
    this.apply(false)
    this.muteListeners.forEach((f) => f(this.muted))
  }

  isMuted() { return this.muted }

  onBeat(f: () => void) { this.beatListeners.add(f); return () => { this.beatListeners.delete(f) } }
  onMute(f: (muted: boolean) => void) { this.muteListeners.add(f); return () => { this.muteListeners.delete(f) } }

  /** Moves every layer and the master toward the current mix. */
  private apply(now: boolean) {
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const k = now ? 0.01 : 0.35
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.mix.level, t, k)
    this.voice.gain.setTargetAtTime(this.muted ? 0 : 1, t, 0.02)
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
    if (this.on('lead') && s % 2 === 0) {
      const note = LEAD[Math.floor(n / 16)][s / 2]
      if (note) this.lead(t, note)
    }
    // the dance-pop layers of the opening song: octave bass, offbeat piano, a high sparkle, a shaker
    if (this.on('bounce') && s % 2 === 0) this.bounce(t, chord.root + (s % 4 === 2 ? 24 : 12))
    if (this.on('piano') && s % 4 === 2) this.piano(t, chord.notes)
    if (this.on('pluck')) this.pluck(t, [...chord.notes, chord.notes[0] + 12][[0, 1, 2, 3, 2, 1, 2, 3][s % 8]] + 24)
    if (this.on('shaker')) this.shaker(t, s % 4 === 2 ? 0.16 : s % 2 ? 0.07 : 0.04)
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
    src.loop = true
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

  private lead(t: number, note: number) {
    const lp = this.ctx!.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 3800
    lp.connect(this.env(t, 0.09, 0.32, this.gains.lead, 0.01))
    for (const d of [-12, 0, 12]) this.osc('sawtooth', hz(note), t, 0.36, lp, d)
  }

  private stab(t: number, notes: number[]) {
    const lp = this.ctx!.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 2200
    lp.connect(this.env(t, 0.12, 0.16, this.gains.stab))
    for (const n of notes) this.osc('square', hz(n + 12), t, 0.18, lp)
  }

  /** Bass that bounces between octaves: a saw whose filter snaps shut, so every note plucks. */
  private bounce(t: number, note: number) {
    const lp = this.ctx!.createBiquadFilter()
    lp.type = 'lowpass'
    lp.Q.value = 4
    lp.frequency.setValueAtTime(1800, t)
    lp.frequency.exponentialRampToValueAtTime(220, t + 0.14)
    lp.connect(this.env(t, 0.42, 0.2, this.gains.bounce))
    this.osc('sawtooth', hz(note), t, 0.22, lp)
    this.osc('square', hz(note - 12), t, 0.22, lp)
  }

  /** House piano on the offbeats: short, bright chords with a bit of hammer. */
  private piano(t: number, notes: number[]) {
    const lp = this.ctx!.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 4200
    lp.connect(this.env(t, 0.13, 0.28, this.gains.piano, 0.002))
    for (const n of [...notes, notes[0] + 12]) {
      this.osc('triangle', hz(n + 12), t, 0.3, lp)
      this.osc('square', hz(n + 12), t, 0.1, this.env(t, 0.25, 0.06, lp))
    }
  }

  /** A fast, quiet arpeggio high above the voice. */
  private pluck(t: number, note: number) {
    this.osc('triangle', hz(note), t, 0.12, this.env(t, 0.1, 0.1, this.gains.pluck))
    this.osc('square', hz(note), t, 0.1, this.env(t, 0.04, 0.06, this.gains.pluck))
  }

  private shaker(t: number, peak: number) {
    const hp = this.ctx!.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 9000
    hp.connect(this.env(t, peak, 0.035, this.gains.shaker, 0.006))
    this.noiseBurst(t, 0.05, hp)
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

  /** A noise sweep that rises for `seconds` (the build before a drop). */
  riser(seconds: number) {
    const ctx = this.ctx
    if (!ctx || this.muted) return
    const t = ctx.currentTime
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 2
    bp.frequency.setValueAtTime(200, t)
    bp.frequency.exponentialRampToValueAtTime(8000, t + seconds)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.14, t + seconds * 0.95)
    g.gain.linearRampToValueAtTime(0, t + seconds)
    g.connect(this.cueOut(1))
    bp.connect(g)
    for (let i = 0; i < Math.ceil(seconds / 0.9); i++) this.noiseBurst(t + i * 0.9, 0.95, bp)
  }

  /** A snare roll that speeds up (8ths → 16ths → 32nds) and gets louder, ending at `when + beats`. */
  snareRoll(when: number, beats: number) {
    const ctx = this.ctx
    if (!ctx || this.muted) return
    when = Math.max(when, ctx.currentTime)
    const beat = 60 / BPM
    const end = when + beats * beat
    let t = when
    while (t < end - 0.001) {
      const f = (t - when) / (end - when)
      const step = f < 0.5 ? beat / 2 : f < 0.75 ? beat / 4 : beat / 8
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 1800 + f * 1500
      bp.connect(this.env(t, 0.12 + f * 0.4, 0.09, this.cueOut(1)))
      this.noiseBurst(t, 0.1, bp)
      this.osc('triangle', 190, t, 0.06, this.env(t, 0.1 + f * 0.2, 0.05, this.cueOut(1)))
      t += step
    }
  }

  /** A crash cymbal for the drops. */
  crash(when: number) {
    const ctx = this.ctx
    if (!ctx || this.muted) return
    when = Math.max(when, ctx.currentTime)
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 5000
    hp.connect(this.env(when, 0.3, 1.8, this.cueOut(1)))
    this.noiseBurst(when, 2, hp)
  }

  /** The classic DJ air horn: baap, baap, baaaap. */
  airhorn(when: number) {
    const ctx = this.ctx
    if (!ctx || this.muted) return
    when = Math.max(when, ctx.currentTime)
    const shaper = ctx.createWaveShaper()
    const curve = new Float32Array(256)
    for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 3) }
    shaper.curve = curve
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1400
    bp.Q.value = 0.8
    shaper.connect(bp)
    const out = this.cueOut(1)
    for (const [start, len] of [[0, 0.14], [0.19, 0.14], [0.38, 0.62]]) {
      const t = when + start
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.16, t + 0.015)
      g.gain.setValueAtTime(0.16, t + len - 0.04)
      g.gain.linearRampToValueAtTime(0, t + len)
      g.connect(out)
      bp.connect(g)
      for (const f of [466, 470, 932]) {
        const o = this.osc('sawtooth', f * 1.04, t, len, shaper)
        o.frequency.setValueAtTime(f * 1.04, t)
        o.frequency.exponentialRampToValueAtTime(f, t + 0.06)
      }
    }
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
