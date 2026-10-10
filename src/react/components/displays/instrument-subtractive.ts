// Displays of the synthesizers that filter an oscillator.
//
// Each is the sound seen as the instrument makes it: what the oscillators put
// out, the filter over it where the knobs and the note's envelope hold it, and
// the envelope the note rides. What the knobs set is in the ink; what a played
// note does to it is in the accent, for as long as the device's own envelope
// says the note sounds.

import {
  INK,
  clamp,
  clipped,
  crisp,
  dot,
  fillRect,
  ground,
  handle,
  hzOfX,
  hzText,
  lerp,
  rule,
  text,
  xOfHz,
  yOfDb,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, outShare, pitchName } from './instrument-parts'

type Size = Pick<DisplayView, 'width' | 'height'>
type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>
type Words = Pick<DisplayFrame, 'ctx' | 'colours' | 'fontFamily'>

/** A pitch as the devices count it: a key number with a fraction, 69 at 440 Hz. */
const pitchOfHz = (hz: number): number => 69 + 12 * Math.log2(Math.max(hz, 1e-3) / 440)
const hzOfPitch = (pitch: number): number => 440 * Math.pow(2, (pitch - 69) / 12)

/** The note a display stands on while none is played: the C below middle C, low enough that its overtones fill the scale. */
/** A time as it is said: whole milliseconds under a second ("5 ms"), tenths of a second from there ("3.0 s"), whole seconds from ten. */
function timeText(seconds: number): string {
  if (seconds < 0.9995) return `${Math.round(seconds * 1000)} ms`
  return seconds < 9.95 ? `${seconds.toFixed(1)} s` : `${Math.round(seconds)} s`
}

/** The pitches a scale line stands at. */
const DECADES_HZ = [100, 1000, 10000] as const
const REST_HZ = 130.81

/** The levels a spectrum is drawn between, in dB against a wave at full swing. */
const TOP_DB = 18
const BOTTOM_DB = -54

// --- What the four share ----------------------------------------------------

/**
 * The envelope three of the four are built on: `kit/env.h` (`kit::Adsr`) and
 * Ember's own `Adsr.h`, which are one envelope. The attack aims 30 % past the
 * peak and is cut off there, so it is at the peak after exactly the attack
 * time; decay and release cover 60 dB of their way in their time and go on to
 * `kIdleLevel`, where the envelope ends.
 */
const ADSR_OVERSHOOT = 0.3
const SIXTY_DB = 6.907755279
const ADSR_IDLE = 1e-5
const IDLE = 0
const ATTACK = 1
const DECAY = 2
const SUSTAIN = 3
const RELEASE = 4

export interface AdsrTimes {
  attack: number
  decay: number
  sustain: number
  release: number
}

/** An envelope where it stands: `Adsr`'s stage and level, and how long it has been falling since the key went up. */
export interface AdsrEnvelope {
  stage: number
  level: number
  fallen: number
}

export const adsrEnvelope = (): AdsrEnvelope => ({ stage: IDLE, level: 0, fallen: 0 })

/** `Adsr::noteOn`: the attack begins from wherever the level stands. */
export function adsrKeyDown(env: AdsrEnvelope): void {
  env.stage = ATTACK
  env.fallen = 0
}

/** `Adsr::noteOff`. */
export function adsrKeyUp(env: AdsrEnvelope): void {
  if (env.stage !== IDLE) env.stage = RELEASE
  env.fallen = 0
}

/** `Adsr::next`, `seconds` of it at once. */
export function adsrRun(env: AdsrEnvelope, seconds: number, times: AdsrTimes): void {
  let left = seconds
  const reach = Math.log(ADSR_OVERSHOOT / (1 + ADSR_OVERSHOOT))
  while (left > 0 && env.stage !== IDLE) {
    if (env.stage === ATTACK) {
      // What is left to the aim shrinks to 0.3 / 1.3 of itself in every attack time; at 0.3 it is the peak.
      const aim = 1 + ADSR_OVERSHOOT
      const need =
        env.level >= 1 ? 0 : (times.attack * Math.log(ADSR_OVERSHOOT / (aim - env.level))) / reach
      if (left < need) {
        env.level = aim - (aim - env.level) * Math.exp((reach * left) / times.attack)
        left = 0
      } else {
        env.level = 1
        env.stage = DECAY
        left -= need
      }
    } else if (env.stage === DECAY) {
      const over = env.level - times.sustain
      const need = over < ADSR_IDLE ? 0 : (times.decay * Math.log(over / ADSR_IDLE)) / SIXTY_DB
      if (left < need) {
        env.level = times.sustain + over * Math.exp((-SIXTY_DB * left) / times.decay)
        left = 0
      } else {
        env.level = times.sustain
        env.stage = SUSTAIN
        left -= need
      }
    } else if (env.stage === SUSTAIN) {
      env.level = times.sustain
      left = 0
    } else {
      env.level *= Math.exp((-SIXTY_DB * left) / times.release)
      env.fallen += left
      left = 0
      if (env.level < ADSR_IDLE) {
        env.level = 0
        env.stage = IDLE
      }
    }
  }
}

const adsrScratch = adsrEnvelope()

/**
 * Where an envelope of a voice started from silence stands: its key went down
 * `age` seconds ago and up `released` seconds ago (null while it is held).
 * 0 once the envelope has ended and the device has let the voice go.
 */
export function adsrLevel(times: AdsrTimes, age: number, released: number | null): number {
  const env = adsrScratch
  env.stage = IDLE
  env.level = 0
  adsrKeyDown(env)
  adsrRun(env, released === null ? age : age - released, times)
  if (released !== null) {
    adsrKeyUp(env)
    adsrRun(env, released, times)
  }
  return env.stage === IDLE ? 0 : env.level
}

/**
 * How wide a time is drawn on an envelope: short times are given room and long
 * ones are not let run off, so a pluck and a slow pad both show their shape.
 */
const SPAN_SEC = 0.02
const timeSpan = (seconds: number): number => Math.log(1 + seconds / SPAN_SEC)
const spanSeconds = (span: number): number => SPAN_SEC * (Math.exp(span) - 1)
/** The room a held key is given between decay and release, and the room an envelope panel has in all, in the same measure. */
const HOLD_SPAN = 1.2
const PANEL_SPAN = 16

/** A panel's ground: a shade of the ink and a line under it. */
function panelGround(frame: Paint, box: Box): void {
  fillRect(frame.ctx, box, frame.colours.ink, 0.07)
  rule(frame.ctx, box.x, box.y + box.h, box.x + box.w, box.y + box.h, {
    colour: frame.colours.ink,
    alpha: INK.rule,
  })
}

/**
 * An envelope as its four knobs set it: attack, decay, a held key, release.
 * `share` is how much of the panel's height it uses (the filter's is its
 * Amount of six octaves; under zero it hangs from the top), with the full
 * shape dashed behind it.
 */
function envelopePanel(
  frame: Words,
  box: Box,
  times: AdsrTimes,
  unit: number,
  share: number,
  word: string,
): void {
  const { ctx, colours } = frame
  panelGround(frame, box)
  const high = box.h - 3
  const down = share < 0
  const yOf = (level: number, size: number): number =>
    down ? box.y + level * size * high : box.y + box.h - level * size * high
  const reach = Math.log(ADSR_OVERSHOOT / (1 + ADSR_OVERSHOOT))
  const path = (size: number): void => {
    ctx.beginPath()
    ctx.moveTo(box.x, yOf(0, size))
    let x = box.x
    // A point every pixel and a half along each stage, at the time that stands there.
    const stage = (seconds: number, level: (at: number) => number): void => {
      const wide = timeSpan(seconds) * unit
      const steps = Math.max(1, Math.ceil(wide / 1.5))
      for (let s = 1; s <= steps; s++) {
        const at = s === steps ? seconds : spanSeconds(((s / steps) * wide) / unit)
        ctx.lineTo(x + (s / steps) * wide, yOf(level(at), size))
      }
      x += wide
    }
    stage(times.attack, (at) =>
      Math.min(1, (1 + ADSR_OVERSHOOT) * (1 - Math.exp((reach * at) / times.attack))),
    )
    stage(
      times.decay,
      (at) => times.sustain + (1 - times.sustain) * Math.exp((-SIXTY_DB * at) / times.decay),
    )
    x += HOLD_SPAN * unit
    ctx.lineTo(x, yOf(times.sustain, size))
    stage(times.release, (at) => times.sustain * Math.exp((-SIXTY_DB * at) / times.release))
  }
  clipped(ctx, { x: box.x, y: box.y - 1, w: box.w, h: box.h + 2 }, () => {
    if (Math.abs(share) < 1) {
      path(1)
      ctx.globalAlpha = INK.back
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.setLineDash([1, 2])
      ctx.stroke()
      ctx.setLineDash([])
    }
    path(Math.abs(share))
    ctx.globalAlpha = INK.trace
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1
  })
  text(frame, word, box.x + box.w - 2, down ? box.y + box.h - 3 : box.y + 8, { align: 'right' })
}

/** Where a time into each stage stands across an envelope panel. */
function envelopeX(box: Box, times: AdsrTimes, unit: number, env: AdsrEnvelope): number {
  const attack = timeSpan(times.attack) * unit
  const decay = timeSpan(times.decay) * unit
  const reach = Math.log(ADSR_OVERSHOOT / (1 + ADSR_OVERSHOOT))
  if (env.stage === ATTACK) {
    // The time an attack from silence would have taken to this level.
    const into =
      (times.attack * Math.log((1 + ADSR_OVERSHOOT - env.level) / (1 + ADSR_OVERSHOOT))) / reach
    return box.x + timeSpan(clamp(into, 0, times.attack)) * unit
  }
  if (env.stage === DECAY) {
    const over = Math.max(env.level - times.sustain, ADSR_IDLE)
    const into =
      1 - times.sustain > ADSR_IDLE
        ? (times.decay * Math.log((1 - times.sustain) / over)) / SIXTY_DB
        : times.decay
    return box.x + attack + timeSpan(clamp(into, 0, times.decay)) * unit
  }
  const held = box.x + attack + decay + HOLD_SPAN * unit
  if (env.stage === SUSTAIN) return held
  return Math.min(box.x + box.w, held + timeSpan(env.fallen) * unit)
}

/** A note that sounds, on an envelope: a dot where its envelope stands, on a stem. */
function envelopeRider(
  frame: Words,
  box: Box,
  times: AdsrTimes,
  unit: number,
  env: AdsrEnvelope,
  share: number,
  down: boolean,
): void {
  const { ctx, colours } = frame
  if (env.stage === IDLE) return
  const x = clamp(envelopeX(box, times, unit, env), box.x, box.x + box.w)
  const high = box.h - 3
  const zero = down ? box.y : box.y + box.h
  const y = down ? box.y + env.level * share * high : box.y + box.h - env.level * share * high
  ctx.beginPath()
  ctx.moveTo(x, zero)
  ctx.lineTo(x, y)
  ctx.globalAlpha = 1
  ctx.strokeStyle = colours.accent
  ctx.lineWidth = 1
  ctx.stroke()
  dot(ctx, x, y, 2, colours.accent)
}

/** A key going down or up: when (seconds, under zero for the past), and which of the notes. */
interface KeyEvent {
  at: number
  down: boolean
  index: number
}

/**
 * Every key down and key up of `notes` in the order they came, written into
 * `into`, which is kept between frames: the count comes back. A voice that
 * takes one key at a time is played through them again.
 */
function keyEvents(notes: readonly DisplayNote[], into: KeyEvent[]): number {
  let count = 0
  const put = (at: number, down: boolean, index: number): void => {
    if (count === into.length) into.push({ at: 0, down: false, index: 0 })
    const event = into[count++]
    event.at = at
    event.down = down
    event.index = index
  }
  notes.forEach((note, index) => {
    put(-note.age, true, index)
    if (note.released !== null) put(-note.released, false, index)
  })
  // The ones left over from a fuller frame go to the end.
  for (let i = count; i < into.length; i++) into[i].at = Infinity
  into.sort((a, b) => a.at - b.at || Number(b.down) - Number(a.down) || a.index - b.index)
  return count
}

// --- Ember -------------------------------------------------------------------

/** `ember_voice.h`: how far a full filter envelope, a full velocity and a full LFO move the cutoff, and a full LFO the pitch. */
const EMBER_ENV_OCTAVES = 6
const EMBER_VEL_OCTAVES = 4
const EMBER_LFO_OCTAVES = 5
const EMBER_LFO_SEMITONES = 12
/** `ember_voice.h`, `kMaxVoices`, and the cutoff's two ends. */
const EMBER_VOICES = 16
const EMBER_CUT_LOW = 20
const EMBER_CUT_HIGH = 20000
/**
 * `Ember::refresh_controls`: an oscillator in the middle of the field reaches
 * each side's filter at √½ of its swing, and the unison copies share that
 * power between them, each a little out of tune. The sub and the noise go to
 * both sides whole, so they stand 3 dB higher beside the oscillators than
 * their knobs say.
 */
const EMBER_SIDE = Math.SQRT1_2
const EMBER_UNISON = 8

/** Where unison copy `u` of `count` stands, from −1 to 1: that far across the field at a full Spread, and that many times Detune out of tune. */
export const emberCopyPlace = (u: number, count: number): number =>
  count > 1 ? (u / (count - 1) - 0.5) * 2 : 0

/** How strong each of `count` unison copies of an oscillator is at one side's filter, 1 being the oscillator's full swing. */
export const emberCopyLevel = (count: number): number => EMBER_SIDE / Math.sqrt(Math.max(1, count))

/**
 * `PolyBlepOsc::naive`: one cycle of an oscillator's wave, `t` from 0 to 1.
 * The device takes a pulse's mean off it, which moves the wave and none of
 * its overtones.
 */
export function emberWave(shape: number, t: number, pw: number): number {
  switch (shape) {
    case 0:
      return 2 * t - 1
    case 1:
      return t < pw ? 1 : -1
    case 2:
      return t < 0.5 ? 4 * t - 1 : 3 - 4 * t
    default:
      return Math.sin(2 * Math.PI * t)
  }
}

/**
 * The share of that wave's overtone `n` that is a cosine and the share that is
 * a sine (its Fourier series): the two together say how strong the overtone
 * is and where in the cycle it stands, so two waves on one pitch can be added.
 */
function emberCos(shape: number, n: number, pw: number): number {
  if (shape === 1) return (2 * Math.sin(2 * Math.PI * n * pw)) / (Math.PI * n)
  if (shape === 2) return n % 2 === 1 ? -8 / (Math.PI * Math.PI * n * n) : 0
  return 0
}
function emberSin(shape: number, n: number, pw: number): number {
  if (shape === 0) return -2 / (Math.PI * n)
  if (shape === 1) return (2 * (1 - Math.cos(2 * Math.PI * n * pw))) / (Math.PI * n)
  if (shape === 3) return n === 1 ? 1 : 0
  return 0
}

/** How strong overtone `n` of an oscillator's wave is, 1 being a sine at full swing. */
export function emberOvertone(shape: number, n: number, pw: number): number {
  return Math.hypot(emberCos(shape, n, pw), emberSin(shape, n, pw))
}

/** The overtones an oscillator is drawn with: the four hundredth of a saw is under the picture's floor. */
const EMBER_OVERTONES = 400

/**
 * `PolyBlepOsc::next` with `hardSyncAt`: oscillator 2 starts its cycle again
 * with every cycle of oscillator 1, so it runs `ratio` of its own cycles in one
 * of the master's and is cut off there. Its overtones lie on the master's
 * pitch: the cosine and the sine share of each in turn, as many as `into`
 * holds. The wave is straight between its corners, so each stretch's share is
 * worked out as it is and not from samples.
 */
export function emberSynced(shape: number, pw: number, ratio: number, into: Float32Array): void {
  into.fill(0)
  const most = Math.floor(into.length / 2) - 1
  // Where a cycle has its corner: a pulse at its width, a triangle in its middle, a saw at its end.
  const corner = shape === 1 ? pw : shape === 2 ? 0.5 : 1
  for (let cycle = 0; cycle < ratio; cycle++) {
    for (let piece = 0; piece < 2; piece++) {
      const from = piece === 0 ? 0 : corner
      const to = piece === 0 ? corner : 1
      const u0 = (cycle + from) / ratio
      if (to <= from || u0 >= 1) continue
      const u1 = Math.min(1, (cycle + to) / ratio)
      const v0 = emberWave(shape, from, pw)
      // How fast the stretch climbs, along the master's cycle.
      const slope = ((emberWave(shape, (from + to) / 2, pw) - v0) / ((to - from) / 2)) * ratio
      const v1 = v0 + slope * (u1 - u0)
      for (let n = 1; n <= most; n++) {
        const w = 2 * Math.PI * n
        const c0 = Math.cos(w * u0)
        const s0 = Math.sin(w * u0)
        const c1 = Math.cos(w * u1)
        const s1 = Math.sin(w * u1)
        into[n * 2] += 2 * ((v1 * s1 - v0 * s0) / w + (slope * (c1 - c0)) / (w * w))
        into[n * 2 + 1] += 2 * ((v0 * c0 - v1 * c1) / w + (slope * (s1 - s0)) / (w * w))
      }
    }
  }
}

/**
 * `SvfTptSynth`: what the filter does to a frequency, in dB. The voices run at
 * twice the sample rate (`voiceRate`); Resonance takes the damping from 2 down
 * to 0.1, and the 24 dB slope is the same stage twice.
 */
export function emberFilterDb(
  type: number,
  fourPole: boolean,
  cutoffHz: number,
  resonance: number,
  hz: number,
  voiceRate: number,
): number {
  const g = Math.tan((Math.PI * Math.min(cutoffHz, voiceRate * 0.245)) / voiceRate)
  const w = Math.tan((Math.PI * Math.min(hz, voiceRate * 0.49)) / voiceRate) / g
  const k = 2 - 1.9 * clamp(resonance, 0, 1)
  const w2 = w * w
  const under = (1 - w2) * (1 - w2) + k * k * w2
  const power = (type === 1 ? w2 * w2 : type === 2 ? k * k * w2 : 1) / under
  const db = power > 1e-12 ? 10 * Math.log10(power) : -120
  return fourPole ? db * 2 : db
}

/**
 * `Voice::render`'s drive, in front of the filter: what comes out for a level
 * `x` going in. Drive fades from the sound as it is to a `fastTanh` of it
 * pushed up to sixteen times and brought back down by the root of that, so a
 * full Drive squares a wave off at a quarter of full swing.
 */
export function emberDrive(drive: number, x: number): number {
  if (drive <= 0) return x
  const push = 1 + 15 * drive
  const t = clamp(x * push, -3, 3)
  const bent = (t * (27 + t * t)) / (27 + 9 * t * t)
  return x + drive * (bent / Math.sqrt(push) - x)
}

/** `Lfo::next` (`ember_lfo.h`): one cycle of an LFO's shape at `phase`, between −1 and 1; the last shape holds a new chance value every cycle. */
export function emberLfo(shape: number, phase: number): number {
  const p = phase - Math.floor(phase)
  switch (shape) {
    case 0:
      return Math.sin(2 * Math.PI * p)
    case 1:
      return p < 0.5 ? 4 * p - 1 : 3 - 4 * p
    case 2:
      return 1 - 2 * p
    case 3:
      return p < 0.5 ? 1 : -1
    default:
      return EMBER_HELD[Math.floor(phase) % EMBER_HELD.length]
  }
}

/** `Lfo::next_random` from the seed `Lfo::reset` sets: the values sample and hold steps through, in the device's own order. */
const EMBER_HELD: readonly number[] = (() => {
  const held: number[] = []
  let seed = 0x9e3779b9
  for (let i = 0; i < 64; i++) {
    seed = (seed ^ (seed << 13)) >>> 0
    seed = (seed ^ (seed >>> 17)) >>> 0
    seed = (seed ^ (seed << 5)) >>> 0
    held.push((seed & 0xffffff) / 8388607.5 - 1)
  }
  return held
})()

/** A voice that sounds, as `Voice::render` holds it on this frame. */
export interface EmberVoice {
  /** Where its pitch is now, on the way to its key when it glides, and the key it was played on. */
  pitch: number
  key: number
  velocity: number
  amp: AdsrEnvelope
  filter: AdsrEnvelope
}

const emberVoice = (): EmberVoice => ({
  pitch: 60,
  key: 60,
  velocity: 1,
  amp: adsrEnvelope(),
  filter: adsrEnvelope(),
})

export interface EmberPlaying {
  voices: EmberVoice[]
  count: number
  events: KeyEvent[]
  held: number[]
}

export const emberPlaying = (): EmberPlaying => ({ voices: [], count: 0, events: [], held: [] })

/** `Ember::note_on`: the key a frequency is played on, a number with a fraction between 0 and 127. */
const emberKey = (hz: number): number => clamp(pitchOfHz(clamp(hz, 8, 13000)), 0, 127)

export interface EmberSetting {
  /** 0 poly, 1 mono, 2 legato. */
  mode: number
  glide: number
  amp: AdsrTimes
  filter: AdsrTimes
  /** Vel > Amp: a voice is as loud as its envelope and its touch make it, which is what is weighed when one must be taken. */
  velToAmp: number
}

/**
 * The voices that sound now, oldest first, from the notes the instrument was
 * sent: `Ember::note_on` and `note_off` played through again. In poly every
 * note has a voice of its own that glides in from the note before it; in mono
 * and legato one voice follows the last key held, falls back to the one held
 * before it, and legato leaves the envelopes running.
 */
export function emberVoices(
  notes: readonly DisplayNote[],
  setting: EmberSetting,
  into: EmberPlaying,
): EmberPlaying {
  into.count = 0
  const take = (): EmberVoice => {
    if (into.count === into.voices.length) into.voices.push(emberVoice())
    return into.voices[into.count++]
  }
  if (setting.mode === 0) {
    let before = -1
    for (const note of notes) {
      const key = emberKey(note.frequency)
      const voice = take()
      voice.amp.stage = voice.filter.stage = IDLE
      voice.amp.level = voice.filter.level = 0
      adsrKeyDown(voice.amp)
      adsrKeyDown(voice.filter)
      const held = note.released === null ? note.age : note.age - note.released
      adsrRun(voice.amp, held, setting.amp)
      adsrRun(voice.filter, held, setting.filter)
      if (note.released !== null) {
        adsrKeyUp(voice.amp)
        adsrKeyUp(voice.filter)
        adsrRun(voice.amp, note.released, setting.amp)
        adsrRun(voice.filter, note.released, setting.filter)
      }
      voice.key = key
      voice.velocity = clamp(note.gain, 0, 1)
      // `Voice::start`: from the key before it, straight in pitch, over the glide time.
      voice.pitch =
        setting.glide > 0 && before >= 0
          ? before + (key - before) * clamp(note.age / setting.glide, 0, 1)
          : key
      before = key
      // The voice was let go when its amp envelope ended; one held at no level makes no sound either.
      if (voice.amp.level < ADSR_IDLE) into.count--
    }
    // Sixteen voices. `VoiceAllocator::allocate`: a note that finds them all busy takes the quietest that
    // has been let go, and the quietest of all only when none has been; of two as quiet, the older. Which
    // were the quietest is judged as they stand now, and the newest note keeps the voice it took.
    const voices = into.voices
    while (into.count > EMBER_VOICES) {
      let taken = -1
      let lowest = Infinity
      for (let pass = 0; pass < 2 && taken < 0; pass++)
        for (let v = 0; v < into.count - 1; v++) {
          if (pass === 0 && voices[v].amp.stage !== RELEASE) continue
          const level =
            voices[v].amp.level * emberVelocityGain(setting.velToAmp, voices[v].velocity)
          if (level < lowest) {
            lowest = level
            taken = v
          }
        }
      const gone = voices[taken]
      for (let v = taken; v < voices.length - 1; v++) voices[v] = voices[v + 1]
      voices[voices.length - 1] = gone
      into.count--
    }
    return into
  }

  // Mono and legato: every key down and key up in the order they came.
  const events = into.events
  const count = keyEvents(notes, events)

  const voice = take()
  voice.amp.stage = voice.filter.stage = IDLE
  voice.amp.level = voice.filter.level = 0
  const held = into.held
  held.length = 0
  let clock = -Infinity
  let active = false
  let releasing = false
  let playing = -1
  let lastKey = -1
  let lastVelocity = 1
  // The glide: from a pitch at a time, to the voice's key.
  let glideFrom = 60
  let glideAt = 0
  let gliding = false
  const pitchAt = (at: number): number =>
    gliding
      ? glideFrom + (voice.key - glideFrom) * clamp((at - glideAt) / setting.glide, 0, 1)
      : voice.key
  const run = (to: number): void => {
    if (active) {
      adsrRun(voice.amp, to - clock, setting.amp)
      adsrRun(voice.filter, to - clock, setting.filter)
      if (voice.amp.stage === IDLE) active = false
    }
    clock = to
  }
  const start = (key: number, velocity: number, from: number, at: number): void => {
    voice.velocity = velocity
    gliding = from >= 0 && setting.glide > 0
    glideFrom = from
    glideAt = at
    voice.key = key
    adsrKeyDown(voice.amp)
    adsrKeyDown(voice.filter)
  }
  // `Voice::retarget`: a new pitch under envelopes that run on.
  const retarget = (key: number, at: number): void => {
    glideFrom = pitchAt(at)
    glideAt = at
    gliding = setting.glide > 0
    voice.key = key
  }
  for (let e = 0; e < count; e++) {
    const { at, down, index } = events[e]
    const key = emberKey(notes[index].frequency)
    run(at)
    const stacked = held.indexOf(index)
    if (stacked >= 0) held.splice(stacked, 1)
    if (down) {
      const velocity = clamp(notes[index].gain, 0, 1)
      held.push(index)
      if (active && !releasing) {
        if (setting.mode === 2) retarget(key, at)
        else start(key, velocity, pitchAt(at), at)
      } else {
        const from = active ? pitchAt(at) : lastKey
        start(key, velocity, setting.glide > 0 ? from : -1, at)
      }
      active = true
      releasing = false
      playing = index
      lastKey = key
      lastVelocity = velocity
    } else if (active && playing === index) {
      if (held.length > 0) {
        // Back to the key held before this one.
        const previous = held[held.length - 1]
        const back = emberKey(notes[previous].frequency)
        if (setting.mode === 2) retarget(back, at)
        else start(back, lastVelocity, pitchAt(at), at)
        playing = previous
        lastKey = back
      } else {
        adsrKeyUp(voice.amp)
        adsrKeyUp(voice.filter)
        releasing = true
      }
    }
  }
  run(0)
  voice.pitch = pitchAt(0)
  if (!active || voice.amp.level < ADSR_IDLE) into.count = 0
  return into
}

/** `Voice::render`: how loud a voice is for its velocity, and where its cutoff stands, in Hz. */
export function emberVelocityGain(velToAmp: number, velocity: number): number {
  return 1 - velToAmp + velToAmp * velocity
}
export function emberCutoffHz(
  cutoff: number,
  keyTrack: number,
  key: number,
  envAmount: number,
  env: number,
  velToFilter: number,
  velocity: number,
): number {
  const octaves =
    Math.log2(Math.max(cutoff, 1)) +
    (keyTrack * (key - 60)) / 12 +
    envAmount * EMBER_ENV_OCTAVES * env +
    velToFilter * EMBER_VEL_OCTAVES * (velocity - 0.5)
  return clamp(Math.pow(2, octaves), EMBER_CUT_LOW, EMBER_CUT_HIGH)
}

/** The seconds an LFO's lane shows. */
const EMBER_LFO_SEC = 2

const EMBER_MODES = ['Poly', 'Mono', 'Legato'] as const
const EMBER_DESTS = ['Pit', 'Cut', 'Amp', 'Pan', 'PW'] as const
const EMBER_DEST_NAMES = ['Pitch', 'Cutoff', 'Amp', 'Pan', 'Width'] as const

interface EmberParts {
  /** The two oscillators' waves, one over the other. */
  oscillators: readonly [Box, Box]
  /** Drive's curve: between the oscillators and the filter where there is a column for it, else a mark in the row of words. */
  drive: Box
  /** The overtones and the filter over them. */
  spectrum: Box
  filterEnv: Box
  ampEnv: Box
  lfos: readonly [Box, Box]
  /** The LFOs have a panel each beside the envelopes; else a lane each under the picture. */
  roomy: boolean
  foot: Box
}

/**
 * The sound's way from left to right, as the knobs stand on the plate: the
 * oscillators, Drive, what they put out under the filter, the two envelopes,
 * the LFOs. A narrow display has no column for Drive or the LFOs: Drive is a
 * mark in the row of words, and the LFOs lie under the rest.
 */
function emberParts(view: Size): EmberParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const roomy = view.width >= 300
  const gap = view.width >= 160 ? 6 : 4
  const top = all.y + 11
  const bottom = all.y + all.h - 8 - (roomy ? 0 : 12)
  const oscWide = Math.round(clamp(view.width * 0.15, 20, 46))
  const envWide = Math.round(clamp(view.width * 0.3, 38, 100))
  const lfoWide = roomy ? Math.round(view.width * 0.15) : 0
  const driveWide = roomy ? 18 : 0
  const high = Math.floor((bottom - top - 4) / 2)
  const pair = (x: number, w: number): [Box, Box] => [
    { x, y: top, w, h: high },
    { x, y: bottom - high, w, h: high },
  ]
  const driveX = all.x + 1 + oscWide + gap
  const spectrum: Box = {
    x: driveX + (roomy ? driveWide + gap : 0),
    y: top,
    w: all.w - 2 - oscWide - gap - envWide - gap - (roomy ? driveWide + lfoWide + 2 * gap : 0),
    h: bottom - top,
  }
  const envX = spectrum.x + spectrum.w + gap
  const [filterEnv, ampEnv] = pair(envX, envWide)
  const half = Math.floor((all.w - 2 - gap) / 2)
  return {
    oscillators: pair(all.x + 1, oscWide),
    // A square, so a sound left as it is runs corner to corner; its word stands over it in the column.
    drive: roomy
      ? {
          x: driveX,
          y: top + Math.round((bottom - top - driveWide) / 2) + 5,
          w: driveWide,
          h: driveWide,
        }
      : { x: all.x + 55, y: all.y - 1, w: 9, h: 9 },
    spectrum,
    filterEnv,
    ampEnv,
    lfos: roomy
      ? pair(envX + envWide + gap, lfoWide)
      : [
          { x: all.x + 1, y: bottom + 3, w: half, h: 8 },
          { x: all.x + 1 + half + gap, y: bottom + 3, w: half, h: 8 },
        ],
    roomy,
    foot: { x: all.x, y: all.y + all.h - 6, w: all.w, h: 5 },
  }
}

interface EmberState {
  playing: EmberPlaying
  /** The power of what the oscillators put out, by pixel column of the spectrum. */
  power: Float32Array
  /** A synced oscillator 2's overtones and what they were worked out for. */
  synced: Float32Array
  syncedFor: string
  /** How far each unison copy is off the pitch, as a ratio. */
  copies: Float32Array
}

/** The note the picture stands on, and what the filter makes of it. */
interface EmberNote {
  hz: number
  key: number
  cutoff: number
}

const ember = plateDisplay<EmberState>({
  place: 'window',
  columns: 2,
  params: [
    'osc1Shape',
    'osc1Coarse',
    'osc1Fine',
    'osc1Pw',
    'osc2Shape',
    'osc2Coarse',
    'osc2Fine',
    'osc2Pw',
    'osc2Sync',
    'oscMix',
    'subLevel',
    'noiseLevel',
    'filterType',
    'filterSlope',
    'cutoff',
    'resonance',
    'filterDrive',
    'keyTrack',
    'filterEnvAmount',
    'velToFilter',
    'filterAttack',
    'filterDecay',
    'filterSustain',
    'filterRelease',
    'ampAttack',
    'ampDecay',
    'ampSustain',
    'ampRelease',
    'velToAmp',
    'lfo1Shape',
    'lfo1Rate',
    'lfo1Dest',
    'lfo1Amount',
    'lfo2Shape',
    'lfo2Rate',
    'lfo2Dest',
    'lfo2Amount',
    'voiceMode',
    'glide',
    'unisonVoices',
    'unisonDetune',
    'unisonSpread',
  ],
  live: { signal: true, notes: true },
  info: 'What the oscillators send to the filter for the last note, with the filter curve over it, lit where it gets through. The bent line is Drive. Beside them the two envelopes with a dot for each note that sounds, and the LFOs as set. Drag the handle for Cutoff, turn the wheel on it for Resonance.',
  init: () => ({
    playing: emberPlaying(),
    power: new Float32Array(1024),
    synced: new Float32Array((EMBER_OVERTONES + 1) * 2),
    syncedFor: '',
    copies: new Float32Array(EMBER_UNISON),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const parts = emberParts(frame)
    const { spectrum, filterEnv, ampEnv, foot } = parts
    const voiceRate = frame.sampleRate * 2
    const amp: AdsrTimes = {
      attack: frame.value('ampAttack'),
      decay: frame.value('ampDecay'),
      sustain: clamp(frame.value('ampSustain'), 0, 1),
      release: frame.value('ampRelease'),
    }
    const filter: AdsrTimes = {
      attack: frame.value('filterAttack'),
      decay: frame.value('filterDecay'),
      sustain: clamp(frame.value('filterSustain'), 0, 1),
      release: frame.value('filterRelease'),
    }
    const mode = clamp(Math.round(frame.value('voiceMode')), 0, 2)
    const type = clamp(Math.round(frame.value('filterType')), 0, 2)
    const fourPole = Math.round(frame.value('filterSlope')) !== 0
    const resonance = frame.value('resonance')
    const envAmount = frame.value('filterEnvAmount')
    const velToAmp = frame.value('velToAmp')

    // The voices that sound, and the one the picture stands on: the last played.
    const playing = emberVoices(
      frame.notes,
      { mode, glide: frame.value('glide'), amp, filter, velToAmp },
      state.playing,
    )
    const last = playing.count > 0 ? playing.voices[playing.count - 1] : null
    const rest = emberNoteOf(frame, null)
    const now = last ? emberNoteOf(frame, last) : rest

    // --- The oscillators' waves, the bend Drive gives them, then what they put out, by column.
    for (const n of [1, 2]) emberOscillator(frame, parts.oscillators[n - 1], n)
    emberDriveCurve(frame, parts.drive, frame.value('filterDrive'), parts.roomy)
    emberPower(frame, now.hz, spectrum, state)
    const feet = spectrum.y + spectrum.h
    const columns = Math.min(state.power.length, Math.floor(spectrum.w))
    const restDb = (hz: number): number =>
      emberFilterDb(type, fourPole, rest.cutoff, resonance, hz, voiceRate)
    const nowDb = (hz: number): number =>
      emberFilterDb(type, fourPole, now.cutoff, resonance, hz, voiceRate)
    const gain = last ? last.amp.level * emberVelocityGain(velToAmp, last.velocity) : 0
    panelGround(frame, spectrum)
    // A line at every decade, as the effects' curves have them.
    for (const hz of DECADES_HZ) {
      const x = xOfHz(hz, spectrum)
      rule(ctx, x, spectrum.y, x, feet, { colour: colours.ink, alpha: INK.grid })
    }
    clipped(ctx, spectrum, () => {
      // Faint: everything the oscillators make. Strong: what the filter lets through where the knobs rest it.
      for (const passed of [false, true]) {
        ctx.beginPath()
        for (let c = 0; c < columns; c++) {
          const power = state.power[c]
          if (power <= 0) continue
          const x = spectrum.x + c + 0.5
          const db = 10 * Math.log10(power) + (passed ? restDb(hzOfX(x, spectrum)) : 0)
          if (db <= BOTTOM_DB) continue
          ctx.moveTo(x, feet)
          ctx.lineTo(x, yOfDb(db, spectrum, TOP_DB, BOTTOM_DB))
        }
        ctx.globalAlpha = passed ? (last ? INK.back : INK.text) : 0.3
        ctx.strokeStyle = colours.ink
        ctx.lineWidth = 1
        ctx.stroke()
      }
      // The noise is a floor under the overtones: as much of it as lies between two of them.
      const noise = frame.value('noiseLevel')
      const floorDb = noise > 0 ? emberNoiseDb(noise, now.hz, frame.sampleRate) : -Infinity
      if (floorDb > BOTTOM_DB - 30) {
        emberCurve(ctx, spectrum, (hz) => floorDb + restDb(hz))
        ctx.globalAlpha = last ? INK.back : INK.text
        ctx.strokeStyle = colours.ink
        ctx.lineWidth = 1
        ctx.setLineDash([1, 2])
        ctx.stroke()
        ctx.setLineDash([])
      }
      // The filter where the knobs rest it for this note.
      emberCurve(ctx, spectrum, restDb)
      ctx.globalAlpha = last ? INK.back : INK.trace
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = last ? 1 : 1.5
      ctx.lineJoin = 'round'
      ctx.stroke()

      if (last && gain > 0) {
        // What gets through now: the same overtones under the filter where the note's envelope holds it, as loud as the note is.
        const gainDb = 20 * Math.log10(gain)
        ctx.beginPath()
        for (let c = 0; c < columns; c++) {
          const power = state.power[c]
          if (power <= 0) continue
          const x = spectrum.x + c + 0.5
          const db = 10 * Math.log10(power) + nowDb(hzOfX(x, spectrum)) + gainDb
          if (db <= BOTTOM_DB) continue
          ctx.moveTo(x, feet)
          ctx.lineTo(x, yOfDb(db, spectrum, TOP_DB, BOTTOM_DB))
        }
        ctx.globalAlpha = 1
        ctx.strokeStyle = colours.accent
        ctx.lineWidth = 1
        ctx.stroke()
        if (floorDb > BOTTOM_DB - 30) {
          emberCurve(ctx, spectrum, (hz) => floorDb + nowDb(hz) + gainDb)
          ctx.setLineDash([1, 2])
          ctx.stroke()
          ctx.setLineDash([])
        }
        emberCurve(ctx, spectrum, nowDb)
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    })

    // How far the filter envelope carries the cutoff at its peak, and how far the LFOs swing it and the pitch.
    const peak = emberCutoffHz(
      frame.value('cutoff'),
      frame.value('keyTrack'),
      rest.key,
      envAmount,
      1,
      0,
      0.5,
    )
    const restX = xOfHz(rest.cutoff, spectrum)
    const peakX = xOfHz(peak, spectrum)
    if (Math.abs(peakX - restX) >= 1) {
      const y = spectrum.y + 2.5
      rule(ctx, restX, y, peakX, y, { colour: colours.ink, alpha: INK.text, dash: [2, 2] })
      rule(ctx, peakX, spectrum.y, peakX, spectrum.y + 6, { colour: colours.ink, alpha: INK.text })
    }
    let cutSwing = 0
    let pitchSwing = 0
    for (const n of [1, 2]) {
      const dest = Math.round(frame.value(`lfo${n}Dest`))
      const amount = Math.abs(frame.value(`lfo${n}Amount`))
      if (dest === 1) cutSwing += amount * EMBER_LFO_OCTAVES
      if (dest === 0) pitchSwing += amount * EMBER_LFO_SEMITONES
    }
    // A soft touch and a hard one stand the cutoff two octaves either side of a middling one, at full.
    const touch = frame.value('velToFilter') * EMBER_VEL_OCTAVES * 0.5
    if (touch > 0) {
      const from = xOfHz(Math.max(EMBER_CUT_LOW, rest.cutoff * Math.pow(2, -touch)), spectrum)
      const to = xOfHz(Math.min(EMBER_CUT_HIGH, rest.cutoff * Math.pow(2, touch)), spectrum)
      emberBracket(frame, from, to, spectrum.y + 13.5, -2)
    }
    if (cutSwing > 0) {
      const from = xOfHz(Math.max(EMBER_CUT_LOW, rest.cutoff * Math.pow(2, -cutSwing)), spectrum)
      const to = xOfHz(Math.min(EMBER_CUT_HIGH, rest.cutoff * Math.pow(2, cutSwing)), spectrum)
      emberBracket(frame, from, to, spectrum.y + 8.5, 2)
    }
    if (pitchSwing > 0) {
      const from = xOfHz(now.hz * Math.pow(2, -pitchSwing / 12), spectrum)
      const to = xOfHz(now.hz * Math.pow(2, pitchSwing / 12), spectrum)
      emberBracket(frame, from, to, feet - 2.5, -2)
    }

    // Every other note that sounds, where its pitch is, as high as it is loud.
    for (let v = 0; v < playing.count - 1; v++) {
      const voice = playing.voices[v]
      const x = crisp(xOfHz(hzOfPitch(voice.pitch), spectrum))
      const level = voice.amp.level * emberVelocityGain(velToAmp, voice.velocity)
      ctx.beginPath()
      ctx.moveTo(x, feet)
      ctx.lineTo(x, feet - 2 - 5 * clamp(level, 0, 1))
      ctx.globalAlpha = 1
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // --- The two envelopes, by their own times on one scale.
    const total = (times: AdsrTimes): number =>
      timeSpan(times.attack) + timeSpan(times.decay) + HOLD_SPAN + timeSpan(times.release)
    const unit = ampEnv.w / Math.max(PANEL_SPAN, total(amp), total(filter))
    envelopePanel(frame, filterEnv, filter, unit, envAmount, parts.roomy ? 'Filter' : 'F')
    envelopePanel(frame, ampEnv, amp, unit, 1, parts.roomy ? 'Amp' : 'A')
    for (let v = 0; v < playing.count; v++) {
      const voice = playing.voices[v]
      envelopeRider(
        frame,
        ampEnv,
        amp,
        unit,
        voice.amp,
        emberVelocityGain(velToAmp, voice.velocity),
        false,
      )
      if (envAmount !== 0)
        envelopeRider(
          frame,
          filterEnv,
          filter,
          unit,
          voice.filter,
          Math.abs(envAmount),
          envAmount < 0,
        )
    }

    // --- The LFOs: each as its shape runs over two seconds, as tall as its amount.
    for (const n of [1, 2]) emberLfoLane(frame, parts.lfos[n - 1], n, parts.roomy)

    levelFoot(frame, foot, outShare(frame))

    // The words: how the keys are taken, the unison copies, and the note with its cutoff.
    const top = spectrum.y - 4
    const word = EMBER_MODES[mode]
    text(frame, word, foot.x, top)
    ctx.font = `8px ${frame.fontFamily}`
    emberUnison(frame, foot.x + ctx.measureText(word).width + 6, top - 3)
    text(frame, `${pitchName(hzOfPitch(now.key))} ${hzText(now.cutoff)}`, foot.x + foot.w, top, {
      align: 'right',
    })

    for (const point of emberHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: emberHandles,
})

/** The note a voice plays and where its cutoff stands; with no voice, the note the picture rests on, at a middling touch. */
function emberNoteOf(view: DisplayView, voice: EmberVoice | null): EmberNote {
  const key = voice ? voice.key : pitchOfHz(REST_HZ)
  return {
    hz: voice ? hzOfPitch(voice.pitch) : REST_HZ,
    key,
    cutoff: emberCutoffHz(
      view.value('cutoff'),
      view.value('keyTrack'),
      key,
      view.value('filterEnvAmount'),
      voice ? voice.filter.level : 0,
      view.value('velToFilter'),
      voice ? voice.velocity : 0.5,
    ),
  }
}

/** `Voice::render`'s noise, as a floor: white between ±Noise, and of that what lies in the width between two overtones, as the sine that would be as strong. */
export function emberNoiseDb(noise: number, hz: number, sampleRate: number): number {
  return 10 * Math.log10(((2 * noise * noise) / 3) * (hz / sampleRate))
}

/** A curve of levels across a spectrum box, one point every second pixel, left as the path. */
function emberCurve(ctx: CanvasRenderingContext2D, box: Box, db: (hz: number) => number): void {
  ctx.beginPath()
  for (let x = 0; x <= box.w; x += 2) {
    const level = clamp(db(hzOfX(box.x + x, box)), BOTTOM_DB - 24, TOP_DB + 24)
    const y = yOfDb(level, box, TOP_DB, BOTTOM_DB)
    if (x === 0) ctx.moveTo(box.x + x, y)
    else ctx.lineTo(box.x + x, y)
  }
}

/** A span with a foot at each end: how far something swings. */
function emberBracket(frame: Paint, from: number, to: number, y: number, feet: number): void {
  const { ctx, colours } = frame
  ctx.beginPath()
  ctx.moveTo(from, y + feet)
  ctx.lineTo(from, y)
  ctx.lineTo(Math.max(to, from + 1), y)
  ctx.lineTo(Math.max(to, from + 1), y + feet)
  ctx.globalAlpha = INK.text
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** The cycles of the note an oscillator's panel shows: two, which is one of the sub's. */
const EMBER_WAVE_CYCLES = 2

/**
 * An oscillator's wave as its knobs set it, over two cycles of the note: its
 * shape and width, as many cycles as its tuning makes of them, and oscillator
 * 2 cut off and begun again with every cycle of oscillator 1 when it is
 * synced. It is as strong as its share of the mix.
 */
function emberOscillator(frame: DisplayFrame<EmberState>, box: Box, n: number): void {
  const { ctx, colours } = frame
  const shape = clamp(Math.round(frame.value(`osc${n}Shape`)), 0, 3)
  const pw = clamp(frame.value(`osc${n}Pw`), 0.05, 0.95)
  const tune = (which: number): number =>
    Math.pow(
      2,
      (Math.round(frame.value(`osc${which}Coarse`)) + frame.value(`osc${which}Fine`) * 0.01) / 12,
    )
  const ratio = tune(n)
  const master = tune(1)
  const synced = n === 2 && Math.round(frame.value('osc2Sync')) !== 0 && shape !== 3
  const mix = clamp(frame.value('oscMix'), 0, 1)
  panelGround(frame, box)
  const middle = box.y + box.h / 2
  const reach = box.h / 2 - 3
  const steps = Math.max(2, Math.floor(box.w * 2))
  ctx.beginPath()
  let before = 0
  for (let s = 0; s <= steps; s++) {
    const t = (s / steps) * EMBER_WAVE_CYCLES
    const turns = t * master
    const phase = synced ? ((turns - Math.floor(turns)) / master) * ratio : t * ratio
    const value = emberWave(shape, phase - Math.floor(phase), pw)
    const x = box.x + (s / steps) * box.w
    if (s === 0) ctx.moveTo(x, middle - value * reach)
    else {
      // An edge is upright: the level before it is carried to where it jumps.
      if (Math.abs(value - before) > 1) ctx.lineTo(x, middle - before * reach)
      ctx.lineTo(x, middle - value * reach)
    }
    before = value
  }
  ctx.globalAlpha = 0.35 + 0.65 * (n === 1 ? 1 - mix : mix)
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.globalAlpha = 1
  if (synced) {
    // A tie down from oscillator 1 wherever its cycle begins: there this one is begun again.
    ctx.beginPath()
    for (let k = 0; k / master < EMBER_WAVE_CYCLES; k++) {
      const x = crisp(box.x + (k / master / EMBER_WAVE_CYCLES) * (box.w - 1))
      ctx.moveTo(x, box.y - 4)
      ctx.lineTo(x, box.y + 3)
    }
    ctx.globalAlpha = INK.text
    ctx.stroke()
    ctx.globalAlpha = 1
  }
}

/**
 * What one voice's oscillators send to one side's filter, as power by pixel
 * column: both oscillators' overtones at their own tunings and in the mix,
 * each unison copy's share where the copy is tuned, and the sub an octave
 * under the note. Two oscillators on one pitch, or one synced to the other,
 * are added wave to wave; apart, each has its own overtones. On one pitch
 * they are taken to run in step, as they do from the start (`Voice::prepare`)
 * until a tuning knob has set them apart once.
 */
function emberPower(
  frame: DisplayFrame<EmberState>,
  hz: number,
  box: Box,
  state: EmberState,
): void {
  const power = state.power
  power.fill(0)
  const shape1 = clamp(Math.round(frame.value('osc1Shape')), 0, 3)
  const shape2 = clamp(Math.round(frame.value('osc2Shape')), 0, 3)
  const pw1 = clamp(frame.value('osc1Pw'), 0.05, 0.95)
  const pw2 = clamp(frame.value('osc2Pw'), 0.05, 0.95)
  // `Ember::refresh_controls`: semitones and cents to a ratio.
  const tune1 = Math.round(frame.value('osc1Coarse')) + frame.value('osc1Fine') * 0.01
  const tune2 = Math.round(frame.value('osc2Coarse')) + frame.value('osc2Fine') * 0.01
  const hz1 = hz * Math.pow(2, tune1 / 12)
  const hz2 = hz * Math.pow(2, tune2 / 12)
  const mix = clamp(frame.value('oscMix'), 0, 1)
  // A sine has no edge to start again at: `PolyBlepOsc::next` leaves it alone.
  const synced = Math.round(frame.value('osc2Sync')) !== 0 && shape2 !== 3
  const columns = Math.min(power.length, Math.floor(box.w))
  const add = (at: number, level: number): void => {
    if (at < 20 || at > 20000) return
    const column = Math.min(columns - 1, Math.floor(xOfHz(at, box) - box.x))
    if (column >= 0) power[column] += level * level
  }
  // `Ember::refresh_controls`: the unison copies, each off the pitch by its place times Detune.
  const count = clamp(Math.round(frame.value('unisonVoices')), 1, EMBER_UNISON)
  const detune = frame.value('unisonDetune')
  const apart = count > 1 && detune > 0
  for (let u = 0; u < count; u++)
    state.copies[u] = Math.pow(2, (emberCopyPlace(u, count) * detune) / 1200)
  // An oscillator's overtone: every copy's share of it where the copy is tuned, or all of them as one on the pitch.
  const voiced = (at: number, level: number): void => {
    if (!apart) add(at, level * emberCopyLevel(1))
    else for (let u = 0; u < count; u++) add(at * state.copies[u], level * emberCopyLevel(count))
  }
  if (synced) {
    const ratio = hz2 / hz1
    const key = `${shape2} ${pw2} ${ratio}`
    if (state.syncedFor !== key) {
      emberSynced(shape2, pw2, ratio, state.synced)
      state.syncedFor = key
    }
  }
  const together = synced || tune1 === tune2
  for (let n = 1; n * hz1 <= 20000 && n <= EMBER_OVERTONES; n++) {
    let cos = (1 - mix) * emberCos(shape1, n, pw1)
    let sin = (1 - mix) * emberSin(shape1, n, pw1)
    if (synced) {
      cos += mix * state.synced[n * 2]
      sin += mix * state.synced[n * 2 + 1]
    } else if (together) {
      cos += mix * emberCos(shape2, n, pw2)
      sin += mix * emberSin(shape2, n, pw2)
    }
    voiced(n * hz1, Math.hypot(cos, sin))
  }
  if (!together)
    for (let n = 1; n * hz2 <= 20000 && n <= EMBER_OVERTONES; n++)
      voiced(n * hz2, mix * emberOvertone(shape2, n, pw2))
  // The sub is one sine for all the copies, and is not shared out between the sides.
  add(hz * 0.5, clamp(frame.value('subLevel'), 0, 1))
}

/**
 * Drive as it bends a level: in across, out upwards, both from full swing down
 * to full swing up, so a sound left as it is runs straight from corner to
 * corner. It is drawn as a curve and not on the overtones: what it adds to
 * them depends on how the oscillators, the sub and the noise stand against
 * each other at each moment, which the display cannot know.
 */
function emberDriveCurve(frame: Words, box: Box, drive: number, worded: boolean): void {
  const { ctx, colours } = frame
  panelGround(frame, box)
  const middle = box.y + box.h / 2
  const reach = box.h / 2 - 1
  const steps = Math.max(2, Math.floor(box.w * 2))
  ctx.beginPath()
  for (let s = 0; s <= steps; s++) {
    const x = box.x + (s / steps) * box.w
    const y = middle - emberDrive(drive, (s / steps) * 2 - 1) * reach
    if (s === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.globalAlpha = drive > 0 ? INK.trace : INK.back
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.globalAlpha = 1
  if (worded) text(frame, 'Drive', box.x + box.w / 2, box.y - 3, { align: 'center' })
}

/** An LFO's rate as it is said: "0.13 Hz", "5.5 Hz", "40 Hz". */
const emberRateText = (hz: number): string =>
  `${hz < 1 ? hz.toFixed(2) : hz < 10 ? hz.toFixed(1).replace(/\.0$/, '') : Math.round(hz)} Hz`

/** One LFO as it is set: where it goes, and its shape over two seconds from the start of a cycle, as tall as its amount. It runs free, so where it is now is not drawn. */
function emberLfoLane(frame: DisplayFrame<EmberState>, box: Box, n: number, roomy: boolean): void {
  const { ctx, colours } = frame
  const shape = clamp(Math.round(frame.value(`lfo${n}Shape`)), 0, 4)
  const rate = frame.value(`lfo${n}Rate`)
  const dest = clamp(Math.round(frame.value(`lfo${n}Dest`)), 0, 4)
  const amount = clamp(frame.value(`lfo${n}Amount`), -1, 1)
  let wave: Box
  if (roomy) {
    panelGround(frame, box)
    text(frame, EMBER_DEST_NAMES[dest], box.x + 2, box.y + 8)
    text(frame, emberRateText(rate), box.x + box.w - 2, box.y + 8, { align: 'right' })
    wave = { x: box.x, y: box.y + 11, w: box.w, h: box.h - 12 }
  } else {
    text(frame, EMBER_DESTS[dest], box.x, box.y + box.h - 1)
    wave = { x: box.x + 17, y: box.y, w: box.w - 17, h: box.h }
  }
  const middle = wave.y + wave.h / 2
  rule(ctx, wave.x, middle, wave.x + wave.w, middle, { colour: colours.ink, alpha: INK.grid })
  const reach = (wave.h / 2 - 0.5) * amount
  // Cycles nearer than two pixels cannot be told apart, and points taken along them would draw a slower wave that is not there: the band they fill stands for them.
  if (EMBER_LFO_SEC * rate * 2 > wave.w && amount !== 0) {
    const tall = Math.abs(reach)
    fillRect(ctx, { x: wave.x, y: middle - tall, w: wave.w, h: 2 * tall }, colours.ink, INK.back)
    return
  }
  ctx.beginPath()
  // A point each half pixel, so a square keeps its corners and a fast LFO its teeth.
  const steps = Math.max(2, Math.floor(wave.w * 2))
  let before = 0
  for (let s = 0; s <= steps; s++) {
    const phase = (s / steps) * EMBER_LFO_SEC * rate
    const value = emberLfo(shape, phase)
    const x = wave.x + (s / steps) * wave.w
    if (s === 0) ctx.moveTo(x, middle - value * reach)
    else {
      // A step is upright: the level before it is carried to where it jumps.
      if (Math.abs(value - before) > 1 || shape === 4) ctx.lineTo(x, middle - before * reach)
      ctx.lineTo(x, middle - value * reach)
    }
    before = value
  }
  ctx.globalAlpha = amount === 0 ? INK.back : INK.trace
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** The unison copies as `Ember::refresh_controls` lays them out: across the field by Spread, and apart in tune by Detune, a hundred cents the height of the word. */
function emberUnison(frame: DisplayFrame<EmberState>, x: number, y: number): void {
  const count = clamp(Math.round(frame.value('unisonVoices')), 1, EMBER_UNISON)
  const detune = frame.value('unisonDetune')
  const spread = clamp(frame.value('unisonSpread'), 0, 1)
  const wide = 9
  for (let u = 0; u < count; u++) {
    const at = emberCopyPlace(u, count)
    dot(
      frame.ctx,
      x + wide + at * spread * wide,
      y - at * (detune / 100) * 3.5,
      1,
      frame.colours.ink,
    )
  }
}

function emberHandles(view: DisplayView): DisplayHandle[] {
  const { spectrum } = emberParts(view)
  const rest = emberNoteOf(view, null)
  const type = clamp(Math.round(view.value('filterType')), 0, 2)
  const fourPole = Math.round(view.value('filterSlope')) !== 0
  const resonance = view.value('resonance')
  // The picture rests on a note under middle C, which key tracking moves the cutoff for.
  const tracked = Math.pow(2, (view.value('keyTrack') * (rest.key - 60)) / 12)
  const db = emberFilterDb(type, fourPole, rest.cutoff, resonance, rest.cutoff, 96000)
  return [
    {
      key: 'cutoff',
      name: 'Cutoff',
      x: xOfHz(rest.cutoff, spectrum),
      y: clamp(yOfDb(db, spectrum, TOP_DB, BOTTOM_DB), spectrum.y + 2, spectrum.y + spectrum.h - 2),
      drag: (toX) => ({ cutoff: hzOfX(toX, spectrum) / tracked }),
      wheel: (steps) => ({ resonance: clamp(resonance + steps * 0.05, 0, 1) }),
      reset: () => ({ cutoff: view.spec('cutoff')?.default ?? 20000 }),
    },
  ]
}

// --- Dusk --------------------------------------------------------------------

/** `dusk.h`: the keys it can sound, the pitch Cutoff is named at, the octaves a full Envelope moves the cutoff, where a held note settles, the loop gain at full Resonance and where the loop begins to sing, and the pulse's sweep. */
const DUSK_VOICES = 10
const DUSK_KEY_HZ = 261.6256
const DUSK_ENV_OCTAVES = 6
const DUSK_SUSTAIN = 0.7
const DUSK_MAX_FEEDBACK = 4.3
const DUSK_SINGS = 4
/** `Dusk::kDrive`: how small the oscillator goes into the filter, which keeps the filter clean. */
const DUSK_DRIVE = 0.12
/** `kit::fast_tanh` up to its first bend is x − (8/27) x³: a sine of height `a` comes out of it 1 − (2/9) a² as tall. */
const DUSK_BEND = 2 / 9
const DUSK_PULSE_HZ = 0.6
const DUSK_PULSE_SWEEP = 0.38
const DUSK_LOW_CUT_HZ = [10, 120, 350, 800] as const
/** `dusk_chorus.h`, `kSettings`: how fast the one triangle runs, the delays it moves the two lines between, and whether the right line goes with the left or against it. */
const DUSK_CHORUS = [
  { name: 'off', rate: 0.513, shortest: 0.00166, longest: 0.00535, against: true },
  { name: 'I', rate: 0.513, shortest: 0.00166, longest: 0.00535, against: true },
  { name: 'II', rate: 0.863, shortest: 0.00166, longest: 0.00535, against: true },
  { name: 'I + II', rate: 9.75, shortest: 0.0033, longest: 0.0037, against: false },
] as const
/** How long a note that was let go stays in `frame.notes`: `PLAYED_KEPT_MS` in `WasmDevice.ts`. */
const NOTES_KEPT_SEC = 60

/** `Dusk::set_envelope`: one envelope for level and filter; the decay takes the Release time and settles at a fixed level. */
export function duskTimes(attack: number, release: number): AdsrTimes {
  return { attack, decay: release, sustain: DUSK_SUSTAIN, release }
}

/** `Dusk::cutoff_hz`: where a key's filter stands, the envelope at `level`. It follows the keyboard fully around middle C. */
export function duskCutoffHz(
  cutoff: number,
  envelope: number,
  level: number,
  hz: number,
  sampleRate: number,
): number {
  const corner = cutoff * Math.pow(2, envelope * DUSK_ENV_OCTAVES * level) * (hz / DUSK_KEY_HZ)
  return clamp(corner, 16, sampleRate * 0.45)
}

/** `Dusk::apply`, `kWave`: which of the three waves each choice plays, and whether the pulse moves. */
export function duskWaves(wave: number): { saw: number; pulse: number; moving: boolean } {
  const choice = clamp(Math.round(wave), 0, 4)
  return {
    saw: choice === 0 || choice === 2 || choice === 4 ? 1 : 0,
    pulse: choice === 0 ? 0 : 1,
    moving: choice === 3 || choice === 4,
  }
}

/** `Dusk::process`: the share of the cycle a moving pulse is high, `seconds` after the sweep began. It leaves the half and comes back, never crossing it. */
export function duskWidth(seconds: number): number {
  const phase = seconds * DUSK_PULSE_HZ - Math.floor(seconds * DUSK_PULSE_HZ)
  return 0.5 + DUSK_PULSE_SWEEP * (phase < 0.5 ? 2 * phase : 2 - 2 * phase)
}

/** `TwoLineChorus::process`: the delays of the left and the right line in seconds, `seconds` after the sweep began. */
export function duskDelays(mode: number, seconds: number): [number, number] {
  const setting = DUSK_CHORUS[clamp(Math.round(mode), 0, 3)]
  const phase = seconds * setting.rate - Math.floor(seconds * setting.rate)
  const triangle = phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase
  const centre = 0.5 * (setting.shortest + setting.longest)
  const sweep = 0.5 * (setting.longest - setting.shortest) * triangle
  return [centre + sweep, centre + (setting.against ? -sweep : sweep)]
}

/**
 * `Dusk::restart`: seconds since the sweeps of the pulse and the chorus began
 * again, which is at the first key after every voice has ended. Null with no
 * note, and when it cannot be known: a note let go too long ago to be among
 * `notes` could still have sounded when the first of them was played.
 */
export function duskSweepAge(notes: readonly DisplayNote[], times: AdsrTimes): number | null {
  let began: number | null = null
  // Seconds ago that the last of the voices so far ended; under zero while one still sounds.
  let ended = Infinity
  const tail = (level: number): number =>
    level > ADSR_IDLE ? (times.release * Math.log(level / ADSR_IDLE)) / SIXTY_DB : 0
  for (const note of notes) {
    if (began === null || note.age <= ended) began = note.age
    if (note.released === null) {
      // A held note has ended only if it never sounded for want of a sustain; Dusk's is fixed above zero.
      ended = -Infinity
    } else {
      const env = adsrScratch
      env.stage = IDLE
      env.level = 0
      adsrKeyDown(env)
      adsrRun(env, note.age - note.released, times)
      ended = Math.min(ended, note.released - tail(env.level))
    }
  }
  if (began === null) return null
  return began < NOTES_KEPT_SEC - tail(1) ? began : null
}

/**
 * `SingingLadder::process`, its four one-pole stages alone: what they do to a
 * frequency, as two numbers written at `at` in `out`, the part in step with
 * what went in and the part a quarter cycle behind, so a wave can be put
 * together again after them.
 */
function duskStages(
  hz: number,
  cutoffHz: number,
  sampleRate: number,
  out: Float32Array,
  at: number,
): void {
  const w =
    Math.tan((Math.PI * Math.min(hz, sampleRate * 0.49)) / sampleRate) /
    Math.tan((Math.PI * cutoffHz) / sampleRate)
  // One stage is 1 / (1 + jw); four of them in a row.
  const under = 1 + w * w
  const re = 1 / under
  const im = -w / under
  const re2 = re * re - im * im
  const im2 = 2 * re * im
  out[at] = re2 * re2 - im2 * im2
  out[at + 1] = 2 * re2 * im2
}

/** The loop around the stages: what comes out of them (`re`, `im`) with `loop` times it taken from what goes in, into `duskPair`. */
function duskLooped(re: number, im: number, loop: number): void {
  const loopRe = 1 + loop * re
  const loopIm = loop * im
  const size = Math.max(loopRe * loopRe + loopIm * loopIm, 1e-9)
  duskPair[0] = (re * loopRe + im * loopIm) / size
  duskPair[1] = (im * loopRe - re * loopIm) / size
}

/** How much of a frequency the filter lets through, as a gain, for a wave too small to reach its saturator and a loop that does not sing. */
export function duskLadderGain(
  hz: number,
  cutoffHz: number,
  feedback: number,
  sampleRate: number,
): number {
  duskStages(hz, cutoffHz, sampleRate, duskPair, 0)
  duskLooped(duskPair[0], duskPair[1], feedback)
  return Math.hypot(duskPair[0], duskPair[1])
}
const duskPair = new Float32Array(2)

/** The samples a wave is kept in, over two cycles of the note (one of the sub's), and the partials of the sub's pitch it is put together from. */
const DUSK_SAMPLES = 256
const DUSK_PARTIALS = 96
const DUSK_SINES = Float32Array.from({ length: DUSK_SAMPLES }, (_, i) =>
  Math.sin((2 * Math.PI * i) / DUSK_SAMPLES),
)

export interface DuskSetting {
  saw: number
  pulse: number
  /** The share of the cycle the pulse is high. */
  width: number
  sub: number
  feedback: number
  lowCutHz: number
  sampleRate: number
}

/** What each partial of the sub's pitch goes into the filter as (in step, a quarter cycle behind), and what the four stages alone do to it. */
const duskIn = new Float32Array(2 * (DUSK_PARTIALS + 1))
const duskStage = new Float32Array(2 * (DUSK_PARTIALS + 1))

/** How tall the wave stands at the filter's saturator, squared, with the loop `loop` times around: the first `count` partials as the loop leaves them there, `drive` times what the oscillator put out. */
function duskSwing(loop: number, count: number, drive: number): number {
  let sum = 0
  for (let k = 1; k <= count; k++) {
    const size = duskIn[2 * k] * duskIn[2 * k] + duskIn[2 * k + 1] * duskIn[2 * k + 1]
    if (size === 0) continue
    const re = 1 + loop * duskStage[2 * k]
    const im = loop * duskStage[2 * k + 1]
    sum += size / Math.max(re * re + im * im, 1e-9)
  }
  return sum * drive * drive
}

/**
 * Two cycles of what one key puts out after its filter and the low cut,
 * written into `into`: `LockedOsc::next`'s sawtooth, pulse and the square an
 * octave under them, all on one phase, each partial through
 * `SingingLadder::process` at `cutoffHz`.
 *
 * The saturator in front of the stages is taken as the one gain it comes to
 * for a wave of the height that stands there, which is what holds a partial
 * on the cutoff down as Resonance rises. From a loop gain of four the loop
 * sings a note of its own at the cutoff, as tall as the saturator has room
 * left for; it belongs to no cycle of the key, so it is not in `into`: its
 * height comes back, in the measure of the wave, and 0 while the loop holds.
 */
export function duskWave(
  hz: number,
  cutoffHz: number,
  setting: DuskSetting,
  into: Float32Array,
): number {
  into.fill(0)
  // `Dusk::apply`, `kResonance`: the input makes up half of what the loop takes from the pass band.
  const makeUp = Math.sqrt(1 + setting.feedback)
  let count = 0
  for (let k = 1; k <= DUSK_PARTIALS; k++) {
    const partialHz = (k * hz) / 2
    if (partialHz > 16000) break
    count = k
    let cos = 0
    let sin = 0
    if (k % 2 === 1) {
      // The sub: a square on every other cycle.
      sin = (setting.sub * 4) / (Math.PI * k)
    } else {
      const n = k / 2
      const turn = 2 * Math.PI * n * setting.width
      cos = (setting.pulse * 2 * Math.sin(turn)) / (Math.PI * n)
      sin = (setting.pulse * 2 * (1 - Math.cos(turn)) - setting.saw * 2) / (Math.PI * n)
    }
    duskIn[2 * k] = cos
    duskIn[2 * k + 1] = sin
    duskStages(partialHz, cutoffHz, setting.sampleRate, duskStage, 2 * k)
  }

  // The saturator's gain: no more than leaves the loop four times around, and no more than the
  // wave standing at it lets through.
  const drive = DUSK_DRIVE * makeUp
  const most = Math.min(1, DUSK_SINGS / setting.feedback)
  const spare = 1 - most - DUSK_BEND * duskSwing(setting.feedback * most, count, drive)
  let gain = most
  let sung = 0
  if (spare < 0) {
    // The wave alone bends it further: the gain at which the two agree lies under `most`.
    let under = 0
    for (let step = 0; step < 20; step++) {
      const middle = (under + gain) / 2
      if (1 - middle - DUSK_BEND * duskSwing(setting.feedback * middle, count, drive) < 0)
        gain = middle
      else under = middle
    }
  } else if (setting.feedback > DUSK_SINGS) {
    // The loop fills what is left with its own note: so tall at the saturator, a quarter of it after the stages.
    const v = cutoffHz / setting.lowCutHz
    sung =
      ((Math.sqrt(spare / DUSK_BEND) * most) / 4 / DUSK_DRIVE) * Math.sqrt((v * v) / (1 + v * v))
  }

  for (let k = 1; k <= count; k++) {
    const cos = duskIn[2 * k]
    const sin = duskIn[2 * k + 1]
    if (cos === 0 && sin === 0) continue
    duskLooped(duskStage[2 * k], duskStage[2 * k + 1], setting.feedback * gain)
    // The low cut: one first-order high pass on the sum of the keys.
    const v = (k * hz) / 2 / setting.lowCutHz
    const cutRe = (v * v) / (1 + v * v)
    const cutIm = v / (1 + v * v)
    const re = (duskPair[0] * cutRe - duskPair[1] * cutIm) * makeUp * gain
    const im = (duskPair[0] * cutIm + duskPair[1] * cutRe) * makeUp * gain
    const a = cos * re + sin * im
    const b = sin * re - cos * im
    for (let i = 0; i < DUSK_SAMPLES; i++) {
      const at = (k * i) % DUSK_SAMPLES
      into[i] += a * DUSK_SINES[(at + DUSK_SAMPLES / 4) % DUSK_SAMPLES] + b * DUSK_SINES[at]
    }
  }
  return sung
}

interface DuskParts {
  /** The left line's copy, the dry wave, the right line's copy. */
  left: Box
  dry: Box
  right: Box
  envelope: Box
  foot: Box
}

function duskParts(view: Size): DuskParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const gap = view.width >= 160 ? 6 : 4
  const top = all.y + 11
  const bottom = all.y + all.h - 8
  const envWide = Math.round(clamp(view.width * 0.3, 36, 72))
  const x = all.x + 1
  const w = all.w - 2 - envWide - gap
  const side = Math.floor((bottom - top) * 0.23)
  return {
    left: { x, y: top, w, h: side },
    dry: { x, y: top + side + 3, w, h: bottom - top - 2 * side - 6 },
    right: { x, y: bottom - side, w, h: side },
    envelope: { x: x + w + gap, y: top, w: envWide, h: bottom - top },
    foot: { x: all.x, y: all.y + all.h - 6, w: all.w, h: 5 },
  }
}

interface DuskState {
  /** The wave where the knobs rest it, at the envelope's peak, and as the last note sounds now. */
  rest: Float32Array
  peak: Float32Array
  lit: Float32Array
  env: AdsrEnvelope
  /** The chorus as it was on the frame before, and the sweep it was changed in: from there its place is not known. */
  mode: number
  changedIn: number | null
}

/** A wave's height in a lane. The sawtooth and the pulse run against each other, so the two together stand little higher than one; a ringing filter stands higher and is cut off at the lane's edge. */
const DUSK_WAVE_REACH = 1.6

/** The fewest pixels a cycle of the filter's own note is drawn as a wave in; closer than that it is a band as tall. */
const DUSK_SUNG_PX = 4
const DUSK_PEAK_DASH = [1, 2]
const NO_DASH: number[] = []

/**
 * A kept wave across a lane, from `from` seconds into the window on: the same
 * wave `from` later. The note the filter sings (`sung` tall, at `sungHz`)
 * rides on it at its own pitch; where in its cycle it is cannot be known and
 * it stands as it would from the window's first moment.
 */
function duskTrace(
  ctx: CanvasRenderingContext2D,
  box: Box,
  wave: Float32Array,
  hz: number,
  windowSec: number,
  from: number,
  gain: number,
  sung: number,
  sungHz: number,
): void {
  const middle = box.y + box.h / 2
  const reach = ((box.h / 2 - 1) / DUSK_WAVE_REACH) * gain
  const start = Math.ceil((from / windowSec) * box.w)
  // A sung note is given eight points a cycle, down to two a pixel.
  const perCycle = box.w / (windowSec * Math.max(sungHz, 1))
  const step = sung > 0 ? clamp(perCycle / 8, 0.5, 1) : 1
  ctx.beginPath()
  for (let n = 0, x = start; x <= box.w; n++, x = start + n * step) {
    const seconds = (x / box.w) * windowSec - from
    const cycles = seconds * hz * 0.5
    const at = (cycles - Math.floor(cycles)) * DUSK_SAMPLES
    const low = Math.floor(at)
    let value = lerp(wave[low % DUSK_SAMPLES], wave[(low + 1) % DUSK_SAMPLES], at - low)
    if (sung > 0)
      value +=
        sung *
        (perCycle >= DUSK_SUNG_PX ? Math.sin(2 * Math.PI * sungHz * seconds) : n % 2 ? 1 : -1)
    const y = clamp(middle - value * reach, box.y, box.y + box.h)
    if (n === 0) ctx.moveTo(box.x + x, y)
    else ctx.lineTo(box.x + x, y)
  }
}

const dusk = plateDisplay<DuskState>({
  place: 'window',
  columns: 2,
  params: [
    'wave',
    'sub',
    'lowCut',
    'cutoff',
    'resonance',
    'envelope',
    'attack',
    'release',
    'chorus',
  ],
  live: { signal: true, notes: true },
  info: 'The wave of one key after the filter, with the note the filter sings at the top of Resonance, between the copies the chorus lays left and right, each as late as its line holds it. A played note lights them and the copies slide. Beside them the envelope, with a dot for each note that sounds.',
  init: () => ({
    rest: new Float32Array(DUSK_SAMPLES),
    peak: new Float32Array(DUSK_SAMPLES),
    lit: new Float32Array(DUSK_SAMPLES),
    env: adsrEnvelope(),
    mode: -1,
    changedIn: null,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const parts = duskParts(frame)
    const times = duskTimes(frame.value('attack'), frame.value('release'))
    const waves = duskWaves(frame.value('wave'))
    const mode = clamp(Math.round(frame.value('chorus')), 0, 3)
    const chorus = DUSK_CHORUS[mode]
    const cutoff = frame.value('cutoff')
    const envelope = frame.value('envelope')
    const feedback = clamp(frame.value('resonance'), 0, 1) * DUSK_MAX_FEEDBACK

    // The notes that sound, each on the envelope; the last of them is the one the waves show.
    const unit =
      parts.envelope.w /
      Math.max(
        PANEL_SPAN,
        timeSpan(times.attack) + timeSpan(times.decay) + HOLD_SPAN + timeSpan(times.release),
      )
    envelopePanel(frame, parts.envelope, times, unit, 1, '')
    let last: DisplayNote | null = null
    let lastLevel = 0
    let sounding = 0
    for (let i = frame.notes.length - 1; i >= 0 && sounding < DUSK_VOICES; i--) {
      const note = frame.notes[i]
      const env = state.env
      env.stage = IDLE
      env.level = 0
      adsrKeyDown(env)
      adsrRun(env, note.released === null ? note.age : note.age - note.released, times)
      if (note.released !== null) {
        adsrKeyUp(env)
        adsrRun(env, note.released, times)
      }
      if (env.level < ADSR_IDLE) continue
      sounding++
      // `Dusk::note_on`: the touch moves the level only, and gently.
      const touch = 0.5 + 0.5 * clamp(note.gain, 0, 1)
      envelopeRider(frame, parts.envelope, times, unit, env, touch, false)
      if (!last) {
        last = note
        lastLevel = env.level
      }
    }

    // When the sweeps began: the pulse's width and the chorus's lines are told from it.
    const sweep = last ? duskSweepAge(frame.notes, times) : null
    const began = sweep === null ? null : frame.now - sweep
    if (state.mode !== mode) {
      // A chorus changed while it runs goes on from where the other had it, which was not seen.
      if (state.mode >= 0 && began !== null) state.changedIn = began
      state.mode = mode
    }
    if (state.changedIn !== null && (began === null || Math.abs(began - state.changedIn) > 0.05))
      state.changedIn = null
    const linesKnown = sweep !== null && state.changedIn === null

    const hz = last ? clamp(last.frequency, 8, 12000) : REST_HZ
    const setting: DuskSetting = {
      saw: waves.saw,
      pulse: waves.pulse,
      // At rest a moving pulse stands in the middle of its sweep.
      width: !waves.moving ? 0.5 : sweep === null ? 0.5 + DUSK_PULSE_SWEEP / 2 : duskWidth(sweep),
      sub: clamp(frame.value('sub'), 0, 1),
      feedback,
      lowCutHz: DUSK_LOW_CUT_HZ[clamp(Math.round(frame.value('lowCut')), 0, 3)],
      sampleRate: frame.sampleRate,
    }
    const cutoffAt = (level: number): number =>
      duskCutoffHz(cutoff, envelope, level, hz, frame.sampleRate)
    // Each wave, and how tall the filter's own note rides on it: from a loop gain of four it sings at the cutoff.
    const restSung = duskWave(hz, cutoffAt(0), setting, state.rest)
    const peakSung = envelope !== 0 ? duskWave(hz, cutoffAt(1), setting, state.peak) : 0
    const litSung = last ? duskWave(hz, cutoffAt(lastLevel), setting, state.lit) : 0
    const gain = last ? lastLevel * (0.5 + 0.5 * clamp(last.gain, 0, 1)) : 0

    // The window: twelve milliseconds, or two cycles of a low note, so the chorus's few milliseconds are a length on it.
    const windowSec = Math.max(0.012, 2 / hz)
    const delays = duskDelays(mode, linesKnown && sweep !== null ? sweep : 0.25 / chorus.rate)
    const lanes = [parts.left, parts.dry, parts.right]
    lanes.forEach((lane, index) => {
      const copy = index !== 1
      panelGround(frame, lane)
      if (copy && mode === 0) return
      const from = copy ? delays[index === 0 ? 0 : 1] : 0
      const x = lane.x + (from / windowSec) * lane.w
      clipped(ctx, lane, () => {
        if (!copy && envelope !== 0 && !last) {
          // Faint: the wave with the filter where the envelope's peak takes it.
          duskTrace(ctx, lane, state.peak, hz, windowSec, 0, 1, peakSung, cutoffAt(1))
          ctx.globalAlpha = INK.back
          ctx.strokeStyle = colours.ink
          ctx.lineWidth = 1
          ctx.setLineDash(DUSK_PEAK_DASH)
          ctx.stroke()
          ctx.setLineDash(NO_DASH)
        }
        duskTrace(ctx, lane, state.rest, hz, windowSec, from, 1, restSung, cutoffAt(0))
        ctx.globalAlpha = last ? 0.4 : copy ? INK.back : INK.trace
        ctx.strokeStyle = colours.ink
        ctx.lineWidth = copy ? 1 : 1.5
        ctx.lineJoin = 'round'
        ctx.stroke()
        if (last && gain > 0) {
          duskTrace(ctx, lane, state.lit, hz, windowSec, from, gain, litSung, cutoffAt(lastLevel))
          ctx.globalAlpha = 1
          ctx.strokeStyle = colours.accent
          ctx.lineWidth = copy ? 1 : 1.5
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      })
      if (copy) {
        // The delays the line is moved between, along the lane's foot, and where it is.
        const shortest = lane.x + (chorus.shortest / windowSec) * lane.w
        const longest = lane.x + (chorus.longest / windowSec) * lane.w
        emberBracket(frame, shortest, longest, lane.y + lane.h - 0.5, -3)
        if (shortest - lane.x >= 9) text(frame, index === 0 ? 'L' : 'R', lane.x + 2, lane.y + 9)
        rule(ctx, x, lane.y, x, lane.y + lane.h, {
          colour: last && linesKnown ? colours.accent : colours.ink,
          alpha: last && linesKnown ? 1 : INK.text,
        })
      }
    })

    levelFoot(frame, parts.foot, outShare(frame))

    // The words: the chorus, and the key with where its filter stands, or the note the filter sings there.
    const top = parts.left.y - 4
    // An overtone that stands on the cutoff is the note it sings: the loop takes it up and no second one rides beside it.
    const stands = cutoffAt(lastLevel)
    const sings = feedback > DUSK_SINGS
    const key = `${pitchName(hz)} ${sings ? `sings ${pitchName(stands)}` : hzText(stands)}`
    const named = `Chorus ${chorus.name}`
    // On a narrow display the chorus is named by its number alone where both would meet.
    ctx.font = `8px ${frame.fontFamily}`
    const room = parts.foot.w - ctx.measureText(key).width - 6
    text(frame, ctx.measureText(named).width <= room ? named : chorus.name, parts.foot.x, top)
    text(frame, key, parts.foot.x + parts.foot.w, top, { align: 'right' })
  },
})

// --- Ladder Bass ---------------------------------------------------------------

/** `ladder_bass.h`: the key Cutoff is named at, how far a full Contour opens the filter, the gains of the oscillators, the square and the sub, and the contour's own times. */
const BASS_PIVOT_HZ = 65.40639
const BASS_CONTOUR_OCTAVES = 5
const BASS_MAX_CUTOFF_HZ = 18000
const BASS_MAX_DRIVE_DB = 24
const BASS_OSC_GAIN = 0.2
const BASS_SQUARE_LEVEL = 0.7
const BASS_SUB_GAIN = 0.4
const BASS_OUT_GAIN = 1.25
const BASS_HOLD_FROM_SEC = 9.9
const BASS_MAX_RELEASE_SEC = 0.8
const BASS_STRIKE_SEC = 0.002
const BASS_SILENT = 1e-5

/**
 * `LadderBass::advance_contour`: the one contour that shapes loudness and
 * filter, `since` seconds after the last key was struck; `up` is how long ago
 * the last key held went up, null while one is down. A strike of 2 ms, a fall
 * of 60 dB in the Decay time (none with Decay at the top, while a key is
 * down), and from the key up a fall in Decay or 0.8 s, whichever is shorter.
 */
export function bassContour(since: number, up: number | null, decay: number): number {
  if (since < 0) return 0
  if (since < BASS_STRIKE_SEC)
    return Math.min(
      1,
      (1 + ADSR_OVERSHOOT) *
        (1 - Math.pow(ADSR_OVERSHOOT / (1 + ADSR_OVERSHOOT), since / BASS_STRIKE_SEC)),
    )
  const after = since - BASS_STRIKE_SEC
  const released = up === null ? 0 : Math.min(up, after)
  const held = after - released
  const fall =
    (decay >= BASS_HOLD_FROM_SEC ? 0 : held / decay) +
    released / Math.min(decay, BASS_MAX_RELEASE_SEC)
  const level = Math.exp(-SIXTY_DB * fall)
  return level < BASS_SILENT ? 0 : level
}

/** `LadderBass::process`: where the filter stands. It follows the keyboard by half around C2 and opens with the contour. */
export function bassCutoffHz(cutoff: number, contour: number, level: number, hz: number): number {
  const tracking = Math.sqrt(hz / BASS_PIVOT_HZ)
  return Math.min(
    cutoff * tracking * Math.pow(2, contour * BASS_CONTOUR_OCTAVES * level),
    BASS_MAX_CUTOFF_HZ,
  )
}

/**
 * `WaveOsc::next` as `LadderBass::process` blends it: one cycle of an
 * oscillator, a sawtooth that rises and a square that starts high. The two
 * run against each other, so on the way from one to the other the note's own
 * pitch and its odd overtones thin out and come back: near 0.42 only the even
 * ones are left, a sawtooth an octave up.
 */
export function bassWave(wave: number, t: number): number {
  return (1 - wave) * (2 * t - 1) + BASS_SQUARE_LEVEL * wave * (t < 0.5 ? 1 : -1)
}

/** How strong overtone `n` of that blend is, 1 being a sine at full swing. */
export function bassOvertone(wave: number, n: number): number {
  const saw = (-2 * (1 - wave)) / (Math.PI * n)
  const square = n % 2 === 1 ? (4 * BASS_SQUARE_LEVEL * wave) / (Math.PI * n) : 0
  return Math.abs(saw + square)
}

/** `LadderBass::control`: how often the two oscillators, Beat cents apart, swell and fade against each other at the note's own pitch. */
export function bassBeatHz(beat: number, hz: number): number {
  return hz * (Math.pow(2, beat / 2400) - Math.pow(2, -beat / 2400))
}

/** `LadderBass::apply`, `kDrive`: the gain into the filter, and what comes back off after it. */
export function bassDrive(drive: number): { gain: number; makeUp: number } {
  const db = drive * BASS_MAX_DRIVE_DB
  return { gain: Math.pow(10, db / 20), makeUp: BASS_OUT_GAIN * Math.pow(10, -db / 40) }
}

/**
 * `kit::Ladder` without its saturator: how much of a frequency the four
 * stages with Emphasis around them let through, as a gain; `ratio` is the
 * frequency over the cutoff. The loop takes from the pass band what it gives
 * the peak. At full Emphasis the loop is at the edge of singing, where only
 * its saturator holds it: the peak is drawn just short of that.
 */
export function bassLadderGain(ratio: number, emphasis: number): number {
  const k = Math.min(4 * clamp(emphasis, 0, 1), 3.8)
  const w2 = ratio * ratio
  const re = 1 - 6 * w2 + w2 * w2 + k
  const im = 4 * ratio * (1 - w2)
  return 1 / Math.sqrt(re * re + im * im)
}

/** `kit::fast_tanh`: what a level comes out of the filter's saturator at. */
const fastTanh = (x: number): number => {
  const c = clamp(x, -3, 3)
  return (c * (27 + c * c)) / (27 + 9 * c * c)
}

/** The samples two cycles of the note are kept in (one of the sub's), and the partials of the sub's pitch read off them. */
const BASS_SAMPLES = 512
const BASS_PARTIALS = 128

/** The cosine at each of twice as many points around the circle: the partials are read with it. */
const BASS_COS = Float64Array.from({ length: 2 * BASS_SAMPLES }, (_, i) =>
  Math.cos((Math.PI * i) / BASS_SAMPLES),
)
/**
 * The places the second oscillator is tried at against the first, evenly over
 * half a cycle: as far behind is the same wave as as far ahead, begun later.
 * Around the whole cycle that is more places than overtones are read, so that
 * none of them meets itself in step at every place.
 */
const BASS_PLACES = BASS_PARTIALS / 4 + 1
/** The share of a cycle the sub is moved on from one place to the next: no two places find it where another did. */
const BASS_SUB_TURN = 0.6180339887

const bassRe = new Float64Array(BASS_SAMPLES)
const bassIm = new Float64Array(BASS_SAMPLES)

/** The two parts of every partial of the wave in `re`, by halves: `re` and `im` hold them afterwards. */
function bassTransform(re: Float64Array, im: Float64Array): void {
  const n = BASS_SAMPLES
  im.fill(0)
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      const keep = re[i]
      re[i] = re[j]
      re[j] = keep
    }
  }
  for (let size = 2; size <= n; size *= 2) {
    const stride = (2 * n) / size
    for (let k = 0; k < size / 2; k++) {
      const cos = BASS_COS[k * stride]
      const sin = BASS_COS[(k * stride + 3 * (n / 2)) % (2 * n)]
      for (let a = k; a < n; a += size) {
        const b = a + size / 2
        const turnedRe = re[b] * cos + im[b] * sin
        const turnedIm = im[b] * cos - re[b] * sin
        re[b] = re[a] - turnedRe
        im[b] = im[a] - turnedIm
        re[a] += turnedRe
        im[a] += turnedIm
      }
    }
  }
}

/**
 * `LadderBass::process`: how strong each partial of the sub's pitch is in what
 * goes into the filter's stages, written into `partials` (the note's own
 * overtones are the even ones). Both oscillators and the sub go through Drive
 * and the saturator together, as if Emphasis took nothing from them first.
 *
 * The oscillators are never set in step: they run on from wherever they were,
 * Beat turns one against the other all the time, and at Beat 0 they stay as
 * they were left, which nothing here can know. So each partial is as strong
 * as it is over a whole turn of the one against the other and of the sub
 * against both: its power, added up over every place they can stand at.
 * Two oscillators come to the root of two of one, not to twice one.
 */
export function bassPartials(
  waveKnob: number,
  sub: number,
  drive: number,
  partials: Float32Array,
): void {
  const { gain } = bassDrive(drive)
  partials.fill(0)
  for (let place = 0; place < BASS_PLACES; place++) {
    const apart = (place + 0.5) / (2 * BASS_PLACES)
    const under = place * BASS_SUB_TURN
    for (let i = 0; i < BASS_SAMPLES; i++) {
      const q = (i + 0.5) / BASS_SAMPLES
      const one = 2 * q - Math.floor(2 * q)
      const other = 2 * q + apart - Math.floor(2 * q + apart)
      const mixed =
        BASS_OSC_GAIN * (bassWave(waveKnob, one) + bassWave(waveKnob, other)) +
        BASS_SUB_GAIN * sub * Math.sin(2 * Math.PI * (q + under))
      bassRe[i] = fastTanh(mixed * gain)
    }
    bassTransform(bassRe, bassIm)
    for (let k = 1; k <= BASS_PARTIALS; k++)
      partials[k] += bassRe[k] * bassRe[k] + bassIm[k] * bassIm[k]
  }
  for (let k = 1; k <= BASS_PARTIALS; k++)
    partials[k] = (2 * Math.sqrt(partials[k] / BASS_PLACES)) / BASS_SAMPLES
}

/** A change of pitch after a strike: from one pitch to another (log2 of Hz), in so many seconds, so long after the strike. */
interface BassMove {
  at: number
  from: number
  to: number
  seconds: number
}

/** The one voice as the keys leave it. */
export interface BassVoice {
  /** Seconds since the last key was struck, and since the last key held went up (null while one is down); `since` is under zero when no key was struck. */
  since: number
  up: number | null
  /** `LadderBass::note_on`: the level of the key that plays, from how hard it was struck. */
  touch: number
  moves: BassMove[]
  moveCount: number
  events: KeyEvent[]
  held: number[]
}

export const bassVoice = (): BassVoice => ({
  since: -1,
  up: null,
  touch: 1,
  moves: [],
  moveCount: 0,
  events: [],
  held: [],
})

/** Where the voice's pitch is, `after` seconds after the last strike, as log2 of Hz. */
export function bassPitch(voice: BassVoice, after: number): number {
  let pitch = Math.log2(BASS_PIVOT_HZ)
  for (let m = 0; m < voice.moveCount; m++) {
    const move = voice.moves[m]
    if (move.at > after) break
    const share = move.seconds > 0 ? clamp((after - move.at) / move.seconds, 0, 1) : 1
    pitch = move.from + (move.to - move.from) * share
  }
  return pitch
}

/**
 * `LadderBass::note_on` and `note_off` played through again: the keys held
 * sit on a stack and the newest plays, every new key strikes the contour, and
 * the pitch slides only from a key that is still held (or back to one), in a
 * straight line that arrives in the Glide time.
 */
export function bassPlay(
  notes: readonly DisplayNote[],
  decay: number,
  glide: number,
  into: BassVoice,
): BassVoice {
  const count = keyEvents(notes, into.events)
  const held = into.held
  held.length = 0
  into.moveCount = 0
  into.touch = 1
  let struck: number | null = null
  let emptied: number | null = null
  // Whether anything sounded when the last strike came. A strike starts from wherever the contour
  // is, so keys that land with it find what it found: a chord out of silence has nothing to slide from.
  let struckInSilence = true
  const keyOf = (index: number): number => Math.log2(clamp(notes[index].frequency, 8, 12000))
  const touchOf = (index: number): number => 0.35 + 0.65 * clamp(notes[index].gain, 0, 1)
  const level = (at: number): number =>
    struck === null ? 0 : bassContour(at - struck, emptied === null ? null : at - emptied, decay)
  const soundingAt = (at: number): boolean =>
    struck === null ? false : at <= struck ? !struckInSilence : level(at) > 0
  const move = (at: number, from: number, to: number, seconds: number): void => {
    if (into.moveCount === into.moves.length) into.moves.push({ at: 0, from: 0, to: 0, seconds: 0 })
    const next = into.moves[into.moveCount++]
    next.at = at
    next.from = from
    next.to = to
    next.seconds = seconds
  }
  for (let e = 0; e < count; e++) {
    const { at, down, index } = into.events[e]
    const stacked = held.indexOf(index)
    if (down) {
      const sounding = soundingAt(at)
      const unheard = struck !== null && at - struck < BASS_STRIKE_SEC && !sounding
      const slide = held.length > 0 && !unheard && glide > 0
      const from = struck === null ? keyOf(index) : bassPitch(into, at - struck)
      held.push(index)
      into.moveCount = 0
      move(0, slide ? from : keyOf(index), keyOf(index), slide ? glide : 0)
      into.touch = touchOf(index)
      struckInSilence = !sounding
      struck = at
      emptied = null
    } else if (stacked >= 0 && struck !== null) {
      const playing = stacked === held.length - 1
      held.splice(stacked, 1)
      if (playing && held.length > 0) {
        // Back to the key still held under it, sliding if anything still sounds.
        const under = held[held.length - 1]
        const from = bassPitch(into, at - struck)
        move(at - struck, from, keyOf(under), soundingAt(at) ? glide : 0)
        into.touch = touchOf(under)
      }
      if (held.length === 0) emptied = at
    }
  }
  into.since = struck === null ? -1 : -struck
  into.up = emptied === null ? null : -emptied
  return into
}

/** The times a note's picture runs between, strike at the left, on a scale of ratios; and the pitches it stands between. */
const BASS_SHORT_SEC = 0.003
const BASS_LONG_SEC = 12
const BASS_LOW_HZ = 25
const BASS_HIGH_HZ = 18000
/** The times a scale line stands at. */
const BASS_DECADES_SEC = [0.01, 0.1, 1, 10] as const
/** The levels a partial is drawn from and to, in dB, and how strongly in each quarter of the way between. */
const BASS_FAINT_DB = -52
const BASS_STEP_DB = 10
const BASS_INKS = [0, 0.2, 0.38, 0.62, 1] as const
/** How much of a rung's ink a row of partials is drawn in. */
const BASS_ROW_INK = 0.6
/** How wide a step in time is drawn, in pixels. */
const BASS_STEP_PX = 3

const bassX = (seconds: number, box: Box): number =>
  box.x +
  clamp(Math.log(seconds / BASS_SHORT_SEC) / Math.log(BASS_LONG_SEC / BASS_SHORT_SEC), 0, 1) * box.w
const bassSeconds = (x: number, box: Box): number =>
  BASS_SHORT_SEC * Math.pow(BASS_LONG_SEC / BASS_SHORT_SEC, clamp((x - box.x) / box.w, 0, 1))
const bassY = (hz: number, box: Box): number =>
  box.y +
  box.h -
  clamp(Math.log(hz / BASS_LOW_HZ) / Math.log(BASS_HIGH_HZ / BASS_LOW_HZ), 0, 1) * box.h
const bassHz = (y: number, box: Box): number =>
  BASS_LOW_HZ * Math.pow(BASS_HIGH_HZ / BASS_LOW_HZ, clamp((box.y + box.h - y) / box.h, 0, 1))

interface BassParts {
  /** The note in time and pitch. */
  note: Box
  /** The scale of seconds under it. */
  scale: Box
  /** The line of words over it, with the wave that goes into the filter between them. */
  words: Box
  foot: Box
}

function bassParts(view: Size): BassParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const top = all.y + 11
  const bottom = all.y + all.h - 8
  const note: Box = { x: all.x + 1, y: top, w: all.w - 2, h: bottom - top - 9 }
  return {
    note,
    scale: { x: note.x, y: note.y + note.h, w: note.w, h: 9 },
    words: { x: all.x, y: all.y, w: all.w, h: 9 },
    foot: { x: all.x, y: all.y + all.h - 6, w: all.w, h: 5 },
  }
}

interface BassState {
  voice: BassVoice
  /** How strong each partial is going into the filter, and the Wave, Sub and Drive it was worked out for. */
  partials: Float32Array
  sourceFor: Float64Array
  /** The strongest of each partial and the three over it: what a row of many partials shows. */
  strongest: Float32Array
  /** How strongly each line is drawn at each step in time: one of `BASS_INKS`. */
  inks: Uint8Array
  /** The pitch, the cutoff and the loudness at each step in time. */
  stepHz: Float32Array
  stepCutoff: Float32Array
  stepLoud: Float32Array
}

interface BassSetting {
  cutoff: number
  emphasis: number
  contour: number
  makeUp: number
}

/** The lines a note is drawn in, and the steps in time: what `BassState.inks` has room for. */
const BASS_LINES = 128
const BASS_STEPS = 160
/** From this partial up the wave's jumps alone set the level: it falls as one over the partial's number. */
const BASS_TOP = BASS_PARTIALS - 3

/**
 * A note as rungs: every partial a line along time at its pitch, as strong as
 * it comes through the filter at that moment and as the contour leaves it.
 * The low partials are a rung each; from where they stand less than a pixel
 * apart they are drawn row by row, each row as strong as the strongest partial
 * in it. `contourAt` and `pitchAt` say where the contour and the pitch stood so
 * long after the strike; the rungs run until `until`.
 */
function bassRungs(
  frame: DisplayFrame<BassState>,
  box: Box,
  setting: BassSetting,
  touch: number,
  contourAt: (seconds: number) => number,
  pitchAt: (seconds: number) => number,
  until: number,
  colour: string,
): void {
  const { ctx, state } = frame
  const { inks, partials, strongest, stepHz, stepCutoff, stepLoud } = state
  const steps = Math.min(Math.ceil(box.w / BASS_STEP_PX), BASS_STEPS)
  const last = Math.min(steps, Math.ceil((bassX(until, box) - box.x) / BASS_STEP_PX))
  if (last <= 0) return
  const octave = box.h / Math.log2(BASS_HIGH_HZ / BASS_LOW_HZ)
  const singles = clamp(Math.floor(1 / (Math.pow(2, 1 / octave) - 1)), 2, 24)
  let lowest = Infinity
  for (let s = 0; s < last; s++) {
    const seconds = bassSeconds(box.x + (s + 0.5) * BASS_STEP_PX, box)
    const level = contourAt(seconds)
    stepHz[s] = Math.pow(2, pitchAt(seconds))
    stepCutoff[s] = bassCutoffHz(setting.cutoff, setting.contour, level, stepHz[s])
    stepLoud[s] = level * touch * setting.makeUp
    lowest = Math.min(lowest, stepHz[s])
  }
  // The rows begin over the last single rung, where the note is lowest.
  const firstRow = Math.floor(bassY((singles / 2) * lowest, box)) - 1
  const rows = clamp(firstRow - Math.ceil(box.y) + 1, 0, BASS_LINES - singles)
  const inkOf = (gain: number): number =>
    gain > 1e-6 ? clamp(Math.ceil((20 * Math.log10(gain) - BASS_FAINT_DB) / BASS_STEP_DB), 0, 4) : 0
  for (let s = 0; s < last; s++) {
    for (let k = 1; k <= singles; k++) {
      const hz = (k / 2) * stepHz[s]
      const gain = partials[k] * stepLoud[s] * bassLadderGain(hz / stepCutoff[s], setting.emphasis)
      inks[(k - 1) * steps + s] = hz > BASS_HIGH_HZ ? 0 : inkOf(gain)
    }
    for (let r = 0; r < rows; r++) {
      const hz = bassHz(firstRow - r + 0.5, box)
      const k = Math.round((2 * hz) / stepHz[s])
      const made =
        k <= singles ? 0 : k <= BASS_TOP ? strongest[k] : (strongest[BASS_TOP] * BASS_TOP) / k
      const gain = made * stepLoud[s] * bassLadderGain(hz / stepCutoff[s], setting.emphasis)
      inks[(singles + r) * steps + s] = inkOf(gain)
    }
  }
  const edge = Math.min(box.x + box.w, bassX(until, box))
  clipped(ctx, box, () => {
    // The rungs first, then the rows: a row is all ink where a rung is a hair, so it is drawn fainter.
    for (let pass = 0; pass < 8; pass++) {
      const ink = 1 + (pass % 4)
      const inRows = pass >= 4
      ctx.beginPath()
      for (let line = inRows ? singles : 0; line < (inRows ? singles + rows : singles); line++) {
        const y = firstRow - (line - singles) + 0.5
        // A run of steps in one ink is one line; a point is set only where the rung bends.
        let open = false
        let toX = 0
        let toY = 0
        for (let s = 0; s < last; s++) {
          if (inks[line * steps + s] !== ink) {
            if (open) ctx.lineTo(toX, toY)
            open = false
            continue
          }
          const from = box.x + s * BASS_STEP_PX
          const to = Math.min(edge, from + BASS_STEP_PX)
          const hz = ((line + 1) / 2) * Math.pow(2, pitchAt(bassSeconds(to, box)))
          const next = inRows ? y : bassY(hz, box)
          if (!open) {
            const before = ((line + 1) / 2) * Math.pow(2, pitchAt(bassSeconds(from, box)))
            ctx.moveTo(from, inRows ? y : bassY(before, box))
            open = true
          } else if (next !== toY) {
            ctx.lineTo(toX, toY)
          }
          toX = to
          toY = next
        }
        if (open) ctx.lineTo(toX, toY)
      }
      ctx.globalAlpha = BASS_INKS[ink] * (inRows ? BASS_ROW_INK : 1)
      ctx.strokeStyle = colour
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  })
}

/** The cutoff along time as a path, until `until`. */
function bassCurve(
  ctx: CanvasRenderingContext2D,
  box: Box,
  setting: BassSetting,
  contourAt: (seconds: number) => number,
  pitchAt: (seconds: number) => number,
  until: number,
): void {
  const edge = Math.min(box.x + box.w, bassX(until, box))
  ctx.beginPath()
  for (let x = box.x; ; x = Math.min(edge, x + 2)) {
    const seconds = bassSeconds(x, box)
    const cutoff = bassCutoffHz(
      setting.cutoff,
      setting.contour,
      contourAt(seconds),
      Math.pow(2, pitchAt(seconds)),
    )
    if (x === box.x) ctx.moveTo(x, bassY(cutoff, box))
    else ctx.lineTo(x, bassY(cutoff, box))
    if (x >= edge) break
  }
}

const ladderBass = plateDisplay<BassState>({
  place: 'window',
  columns: 2,
  params: ['wave', 'beat', 'sub', 'cutoff', 'emphasis', 'contour', 'decay', 'drive', 'glide'],
  live: { signal: true, notes: true },
  info: 'One note from its strike on, time across and pitch upward: its partials as rungs under the line of the cutoff, as strong as a whole beat of the two oscillators leaves them. A played note runs along it in the accent. The pin is how long one beat takes. Drag the handles for Cutoff and Decay.',
  init: () => ({
    voice: bassVoice(),
    partials: new Float32Array(BASS_PARTIALS + 1),
    sourceFor: new Float64Array([-1, -1, -1]),
    strongest: new Float32Array(BASS_PARTIALS + 1),
    inks: new Uint8Array(BASS_LINES * BASS_STEPS),
    stepHz: new Float32Array(BASS_STEPS),
    stepCutoff: new Float32Array(BASS_STEPS),
    stepLoud: new Float32Array(BASS_STEPS),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const parts = bassParts(frame)
    const box = parts.note
    const decay = frame.value('decay')
    const glide = frame.value('glide')
    const beat = frame.value('beat')
    const waveKnob = clamp(frame.value('wave'), 0, 1)
    const sub = clamp(frame.value('sub'), 0, 1)
    const drive = clamp(frame.value('drive'), 0, 1)
    const setting: BassSetting = {
      cutoff: frame.value('cutoff'),
      emphasis: frame.value('emphasis'),
      contour: clamp(frame.value('contour'), 0, 1),
      makeUp: bassDrive(drive).makeUp,
    }
    const made = state.sourceFor
    if (made[0] !== waveKnob || made[1] !== sub || made[2] !== drive) {
      bassPartials(waveKnob, sub, drive, state.partials)
      for (let k = 1; k <= BASS_PARTIALS; k++) {
        let most = 0
        for (let n = k; n <= Math.min(k + 3, BASS_PARTIALS); n++)
          most = Math.max(most, state.partials[n])
        state.strongest[k] = most
      }
      made[0] = waveKnob
      made[1] = sub
      made[2] = drive
    }

    // The voice as the keys leave it, and whether it still sounds.
    const voice = bassPlay(frame.notes, decay, glide, state.voice)
    const now = voice.since < 0 ? 0 : bassContour(voice.since, voice.up, decay)
    const sounding = now > 0
    const restPitch = Math.log2(BASS_PIVOT_HZ)
    const held = (seconds: number): number => bassContour(seconds, null, decay)
    const rest = (): number => restPitch

    panelGround(frame, box)
    // A line at 0.1 s, 1 s and 10 s, said under them; and at 100 Hz, 1 kHz and 10 kHz.
    for (const seconds of BASS_DECADES_SEC) {
      const x = bassX(seconds, box)
      rule(ctx, x, box.y, x, box.y + box.h, { colour: colours.ink, alpha: INK.grid })
    }
    for (const hz of DECADES_HZ) {
      const y = bassY(hz, box)
      rule(ctx, box.x, y, box.x + box.w, y, { colour: colours.ink, alpha: INK.grid })
    }
    text(frame, '0.1 s', bassX(0.1, box), parts.scale.y + 8, { align: 'center' })
    text(frame, '1 s', bassX(1, box), parts.scale.y + 8, { align: 'center' })
    text(frame, '10 s', box.x + box.w, parts.scale.y + 8, { align: 'right' })

    // At rest: a key held at C2, where Cutoff is the cutoff, as the knobs set it.
    if (!sounding) bassRungs(frame, box, setting, 1, held, rest, BASS_LONG_SEC, colours.ink)
    clipped(ctx, box, () => {
      bassCurve(ctx, box, setting, held, rest, BASS_LONG_SEC)
      ctx.globalAlpha = sounding ? INK.back : INK.trace
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = sounding ? 1 : 1.5
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.globalAlpha = 1
    })

    // The two oscillators swell and fade against each other once in this long, at the note's own
    // pitch: a pin on the scale of seconds. Where in a swell they are cannot be known, they never stop.
    const pitchNow = sounding ? bassPitch(voice, voice.since) : restPitch
    const beatHz = bassBeatHz(beat, Math.pow(2, pitchNow))
    if (beatHz > 0 && 1 / beatHz <= BASS_LONG_SEC) {
      const x = crisp(bassX(1 / beatHz, box))
      rule(ctx, x, box.y + box.h - 5, x, box.y + box.h, { colour: colours.ink, alpha: INK.text })
      dot(ctx, x, box.y + box.h - 6, 1.5, colours.ink)
    }

    if (sounding) {
      // The note that sounds, from its strike to now: its pitch as it slid, its contour as the keys left it.
      const up = voice.up === null ? Infinity : voice.since - voice.up
      const contourAt = (seconds: number): number =>
        bassContour(seconds, seconds > up ? seconds - up : null, decay)
      const pitchAt = (seconds: number): number => bassPitch(voice, seconds)
      bassRungs(frame, box, setting, voice.touch, contourAt, pitchAt, voice.since, colours.accent)
      const x = bassX(voice.since, box)
      clipped(ctx, box, () => {
        bassCurve(ctx, box, setting, contourAt, pitchAt, voice.since)
        ctx.strokeStyle = colours.accent
        ctx.lineWidth = 1.5
        ctx.lineJoin = 'round'
        ctx.stroke()
      })
      rule(ctx, x, box.y, x, box.y + box.h, { colour: colours.accent, alpha: INK.back })
      const cutoff = bassCutoffHz(setting.cutoff, setting.contour, now, Math.pow(2, pitchNow))
      dot(ctx, x, bassY(cutoff, box), 2, colours.accent)
    }

    levelFoot(frame, parts.foot, outShare(frame))

    // The words: how long the note falls, and the note with where its filter stands.
    const words = parts.words
    const base = words.y + 8
    const fall = decay >= BASS_HOLD_FROM_SEC ? 'Hold' : timeText(decay)
    const hz = Math.pow(2, pitchNow)
    const stands = `${pitchName(hz)} ${hzText(bassCutoffHz(setting.cutoff, setting.contour, now, hz))}`
    text(frame, fall, words.x, base)
    text(frame, stands, words.x + words.w, base, { align: 'right' })

    // Between them, the wave Wave blends: two cycles of one oscillator. The two together have no
    // one shape to draw, they turn against each other all the time.
    ctx.font = `8px ${frame.fontFamily}`
    const from = words.x + ctx.measureText(fall).width + 6
    const to = words.x + words.w - ctx.measureText(stands).width - 6
    const wide = Math.min(48, to - from)
    if (wide >= 12) {
      const left = Math.round((from + to - wide) / 2)
      const middle = words.y + words.h / 2 + 0.5
      ctx.beginPath()
      for (let x = 0; x <= wide; x++) {
        const cycles = (2 * (x + 0.5)) / (wide + 1)
        const y = middle - bassWave(waveKnob, cycles - Math.floor(cycles)) * (words.h / 2 + 0.5)
        if (x === 0) ctx.moveTo(left, y)
        else ctx.lineTo(left + x, y)
      }
      ctx.globalAlpha = INK.text
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    for (const point of bassHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: bassHandles,
})

/** The contour is half way down this share of the Decay time after the strike: where the Decay handle stands on the line. */
const BASS_HALF_WAY = Math.LN2 / SIXTY_DB

function bassHandles(view: DisplayView): DisplayHandle[] {
  const { note } = bassParts(view)
  const cutoff = view.value('cutoff')
  const decay = view.value('decay')
  const contour = clamp(view.value('contour'), 0, 1)
  const half = BASS_STRIKE_SEC + decay * BASS_HALF_WAY
  const level = bassContour(half, null, decay)
  // Where the line ends: at Cutoff once the contour has fallen, above it while Decay holds.
  const end = bassContour(BASS_LONG_SEC, null, decay)
  return [
    {
      key: 'cutoff',
      name: 'Cutoff',
      x: note.x + note.w - 5,
      y: bassY(bassCutoffHz(cutoff, contour, end, BASS_PIVOT_HZ), note),
      drag: (_x, toY) => ({
        cutoff: bassHz(toY, note) / Math.pow(2, contour * BASS_CONTOUR_OCTAVES * end),
      }),
      reset: () => ({ cutoff: view.spec('cutoff')?.default ?? 500 }),
    },
    {
      key: 'decay',
      name: 'Decay',
      x: bassX(half, note),
      y: bassY(bassCutoffHz(cutoff, contour, level, BASS_PIVOT_HZ), note),
      drag: (toX) => ({
        decay: Math.max(0, bassSeconds(toX, note) - BASS_STRIKE_SEC) / BASS_HALF_WAY,
      }),
      reset: () => ({ decay: view.spec('decay')?.default ?? 0.6 }),
    },
  ]
}

// --- Aurora --------------------------------------------------------------------

/** `aurora.h`: the voices, the key both corners turn about, and what each constant there is named for. */
const AURORA_VOICES = 8
const AURORA_PIVOT_HZ = 261.6256
const AURORA_KEY_TRACK = 0.5
const AURORA_START_OCTAVES = 3
const AURORA_PEAK_OCTAVES = 2
const AURORA_SETTLE_SEC = 0.3
const AURORA_RELEASE_SHARE = 0.4
const AURORA_SWELL_SEC = 1.6
const AURORA_SWELL_OCTAVES = 1.5
const AURORA_SWELL_LEVEL = 0.6
const AURORA_SOFTEST = 0.35
const AURORA_VELOCITY_OCTAVES = 1.5
const AURORA_TOP_HZ = 16000
const AURORA_TWO_BRIGHT = 1.5
const AURORA_TWO_THIN = 2
const AURORA_TWO_LEVEL = 0.8
const AURORA_MIN_Q = 0.7071
const AURORA_Q_OCTAVES = 3.085
const AURORA_RESONANCE_TRIM = 0.5
const AURORA_RING_END_HZ = 35
const AURORA_RING_OCTAVES = 5.32
const AURORA_RING_SEC = 0.35
const AURORA_RING_PER_ATTACK = 1.2

/** `Aurora::start`: a voice's envelope rises in Attack, holds at full and falls in Release. */
export const auroraTimes = (attack: number, release: number): AdsrTimes => ({
  attack,
  decay: 0.01,
  sustain: 1,
  release,
})

/**
 * `Aurora::control`: the contour, in octaves from the resting corner with
 * Contour at 1. A key `held` so long starts three octaves under, rises in a
 * straight line to two over at the Attack time and settles back, more slowly
 * the slower the attack. Let go `released` seconds ago (null while down), it
 * glides back to where it started, so the note darkens as it fades.
 */
export function auroraShape(
  held: number,
  released: number | null,
  attack: number,
  release: number,
): number {
  const rise = Math.min(1, Math.max(0, held) / attack)
  const shape =
    rise < 1
      ? -AURORA_START_OCTAVES + (AURORA_START_OCTAVES + AURORA_PEAK_OCTAVES) * rise
      : AURORA_PEAK_OCTAVES * Math.exp(-(held - attack) / (AURORA_SETTLE_SEC + attack))
  if (released === null) return shape
  return (
    -AURORA_START_OCTAVES +
    (shape + AURORA_START_OCTAVES) * Math.exp(-released / (AURORA_RELEASE_SHARE * release))
  )
}

/** `Aurora::control`: how far a key held so long has leant into the note, 0..1. It starts once the attack is done and stays where it is when the key goes up. */
export function auroraSwell(held: number, attack: number): number {
  return held <= attack ? 0 : 1 - Math.exp(-(held - attack) / AURORA_SWELL_SEC)
}

/** `Aurora::tune`: the share of its full level a voice has at that lean. More Swell starts the note lower; the plateau is the same. */
export function auroraSwellLevel(swell: number, lean: number): number {
  return 1 - AURORA_SWELL_LEVEL * swell * (1 - lean)
}

/** `Aurora::start`: a note's level from how hard it was struck. */
export const auroraVelocity = (gain: number): number =>
  AURORA_SOFTEST + (1 - AURORA_SOFTEST) * clamp(gain, 0, 1)

/** What `Aurora::tune` reads from the knobs. */
export interface AuroraSetting {
  brilliance: number
  lowCut: number
  contour: number
  swell: number
}

/**
 * `Aurora::tune`: where layer I's low pass stands, in Hz. From Brilliance it
 * follows the keyboard by half around middle C, closes for a soft note, moves
 * with the contour and opens with the swell. Layer II's stands a fifth higher.
 */
export function auroraLowpassHz(
  setting: AuroraSetting,
  hz: number,
  gain: number,
  shape: number,
  lean: number,
): number {
  const octaves =
    AURORA_KEY_TRACK * Math.log2(hz / AURORA_PIVOT_HZ) +
    AURORA_VELOCITY_OCTAVES * (clamp(gain, 0, 1) - 1) +
    setting.contour * shape +
    setting.swell * AURORA_SWELL_OCTAVES * lean
  return Math.min(setting.brilliance * Math.pow(2, octaves), AURORA_TOP_HZ)
}

/** `Aurora::tune`: where layer I's high pass stands: Low cut, following the keyboard by half. Layer II's stands an octave higher. */
export function auroraHighpassHz(lowCut: number, hz: number): number {
  return lowCut * Math.pow(hz / AURORA_PIVOT_HZ, AURORA_KEY_TRACK)
}

/** `Aurora::resonate`: the Q of all four filters, from flat to 6. */
export const auroraQ = (resonance: number): number =>
  AURORA_MIN_Q * Math.pow(2, AURORA_Q_OCTAVES * clamp(resonance, 0, 1))

/** `Aurora::resonate`: the share of its level a voice keeps at that Resonance, down to two thirds. */
export const auroraTrim = (resonance: number): number =>
  1 / (1 + AURORA_RESONANCE_TRIM * clamp(resonance, 0, 1))

/** `Aurora::control`: what is left of the ring so long after the note began, 1..0. A slow attack keeps it longer. */
export function auroraZing(seconds: number, attack: number): number {
  return Math.exp(-Math.max(0, seconds) / (AURORA_RING_SEC + AURORA_RING_PER_ATTACK * attack))
}

/** `Aurora::tune`: the pitch of the ring at that much left of it: from 1.4 kHz down to 35 Hz. */
export const auroraRingHz = (zing: number): number =>
  AURORA_RING_END_HZ * Math.pow(2, AURORA_RING_OCTAVES * zing)

/** `Aurora::tune`, `cents_ratio`: how often the two layers, half of Detune under the note and half over, beat against each other. */
export function auroraBeatHz(detune: number, hz: number): number {
  return (hz * detune * Math.LN2) / 1200
}

/** A voice that sounds. */
export interface AuroraVoice {
  hz: number
  gain: number
  /** How long its key was down, and how long ago it went up (null while it is down). */
  held: number
  released: number | null
  /** Its envelope, 0..1. */
  envelope: number
}

const auroraVoice = (): AuroraVoice => ({ hz: 0, gain: 0, held: 0, released: null, envelope: 0 })

/**
 * The voices that sound, oldest first, written into `into` (kept between
 * frames; the count comes back). `kit::VoicePool::note_on`: with all eight
 * busy a new note takes the quietest voice that is fading, or the quietest of
 * all when none is. A voice ends when its envelope does.
 */
export function auroraVoices(
  notes: readonly DisplayNote[],
  attack: number,
  release: number,
  into: AuroraVoice[],
  live: number[],
): number {
  const times = auroraTimes(attack, release)
  // The envelope of a note, `ago` seconds back from now.
  const envelopeAt = (note: DisplayNote, ago: number): number =>
    adsrLevel(
      times,
      note.age - ago,
      note.released !== null && note.released >= ago ? note.released - ago : null,
    )
  live.length = 0
  for (let i = 0; i < notes.length; i++) {
    const ago = notes[i].age
    // The voices that are over by now are free; a key struck again gives up the voice it held.
    for (let v = live.length - 1; v >= 0; v--) {
      const note = notes[live[v]]
      const down = note.released === null || note.released < ago
      if (down ? note.id === notes[i].id : envelopeAt(note, ago) <= 0) live.splice(v, 1)
    }
    if (live.length >= AURORA_VOICES) {
      let taken = -1
      let fading = false
      let lowest = Infinity
      for (let v = 0; v < live.length; v++) {
        const note = notes[live[v]]
        const up = note.released !== null && note.released >= ago
        const level = envelopeAt(note, ago)
        if ((up && !fading) || (up === fading && level < lowest)) {
          taken = v
          fading = up
          lowest = level
        }
      }
      live.splice(taken, 1)
    }
    live.push(i)
  }
  let count = 0
  for (const index of live) {
    const note = notes[index]
    const envelope = envelopeAt(note, 0)
    if (note.released !== null && envelope <= 0) continue
    if (count === into.length) into.push(auroraVoice())
    const voice = into[count++]
    voice.hz = clamp(note.frequency, 8, 12000)
    voice.gain = clamp(note.gain, 0, 1)
    voice.held = note.released === null ? note.age : note.age - note.released
    voice.released = note.released
    voice.envelope = envelope
  }
  return count
}

/** The pitches the picture stands between, and how long a held key is drawn for after its attack. */
const AURORA_LOW_HZ = 20
const AURORA_HELD_SEC = 6
/** The room the held key is given across the picture, in the measure the attack and the release are drawn in. */
const AURORA_HELD_SPAN = 5
/** How wide a slice of the band is drawn, in pixels. */
const AURORA_SLICE_PX = 2
/** How strongly a layer's band is drawn at full level, and the octave beyond each corner where a 12 dB filter still lets a quarter through. */
const AURORA_BAND_INK = 0.3
const AURORA_SKIRT_INK = 0.1

const AURORA_ZONE_DASH = [2, 2] as const

/**
 * How strongly a level is drawn. A release falls by 60 dB and the ear follows
 * it most of the way down, so the ink falls off more slowly than the level:
 * a tenth of the level still has two fifths of the ink.
 */
const auroraInk = (level: number): number => Math.pow(clamp(level, 0, 1), 0.4)

interface AuroraParts {
  /** The note in time and pitch. */
  sky: Box
  /** The times under it. */
  scale: Box
  words: Box
  foot: Box
  /** Where the attack ends and where the release begins, and how wide each is. */
  attackEnd: number
  releaseStart: number
}

/** The room a time is given across the picture: the longest attack, a held key and the longest release fill it. */
const auroraUnit = (sky: Box): number => sky.w / (timeSpan(6) + AURORA_HELD_SPAN + timeSpan(12))

function auroraParts(view: Size, attack: number, release: number): AuroraParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const top = all.y + 11
  const bottom = all.y + all.h - 8
  const sky: Box = { x: all.x + 1, y: top, w: all.w - 2, h: bottom - top - 9 }
  const unit = auroraUnit(sky)
  return {
    sky,
    scale: { x: sky.x, y: sky.y + sky.h, w: sky.w, h: 9 },
    words: { x: all.x, y: all.y, w: all.w, h: 9 },
    foot: { x: all.x, y: all.y + all.h - 6, w: all.w, h: 5 },
    attackEnd: sky.x + unit * timeSpan(attack),
    releaseStart: sky.x + sky.w - unit * timeSpan(release),
  }
}

const auroraY = (hz: number, box: Box): number =>
  box.y +
  box.h -
  clamp(Math.log(hz / AURORA_LOW_HZ) / Math.log(AURORA_TOP_HZ / AURORA_LOW_HZ), 0, 1) * box.h
const auroraHz = (y: number, box: Box): number =>
  AURORA_LOW_HZ * Math.pow(AURORA_TOP_HZ / AURORA_LOW_HZ, clamp((box.y + box.h - y) / box.h, 0, 1))

/** Where a key held so long, or let go so long ago, stands across the picture. */
function auroraX(
  parts: AuroraParts,
  held: number,
  released: number | null,
  attack: number,
  release: number,
): number {
  const { sky, attackEnd, releaseStart } = parts
  if (released !== null)
    return releaseStart + clamp(released / release, 0, 1) * (sky.x + sky.w - releaseStart)
  if (held <= attack) return sky.x + (Math.max(0, held) / attack) * (attackEnd - sky.x)
  return attackEnd + clamp((held - attack) / AURORA_HELD_SEC, 0, 1) * (releaseStart - attackEnd)
}

/** The moment of a note that stands at `x`: how long its key has been down and, past the held key, how long it has been up. Written into `into`. */
function auroraMoment(
  parts: AuroraParts,
  x: number,
  attack: number,
  release: number,
  into: { held: number; released: number | null },
): void {
  const { sky, attackEnd, releaseStart } = parts
  if (x <= attackEnd) {
    into.held =
      attackEnd > sky.x
        ? (clamp(x - sky.x, 0, attackEnd - sky.x) / (attackEnd - sky.x)) * attack
        : attack
    into.released = null
  } else if (x <= releaseStart) {
    into.held = attack + ((x - attackEnd) / (releaseStart - attackEnd)) * AURORA_HELD_SEC
    into.released = null
  } else {
    into.held = attack + AURORA_HELD_SEC
    into.released = clamp((x - releaseStart) / (sky.x + sky.w - releaseStart), 0, 1) * release
  }
}

interface AuroraState {
  voices: AuroraVoice[]
  live: number[]
  moment: { held: number; released: number | null }
}

const aurora = plateDisplay<AuroraState>({
  place: 'window',
  columns: 2,
  params: [
    'brilliance',
    'lowCut',
    'resonance',
    'contour',
    'attack',
    'swell',
    'release',
    'detune',
    'ring',
  ],
  live: { signal: true, notes: true },
  info: 'A note from its attack through a held key to its release, pitch upward: the band its two layers let through, as strong as it is loud, and the ring falling through it. Each note that sounds rides it in the accent. The comb is how fast the layers beat. Drag the handles for Attack and Brilliance.',
  init: () => ({ voices: [], live: [], moment: { held: 0, released: null } }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const attack = frame.value('attack')
    const release = frame.value('release')
    const resonance = clamp(frame.value('resonance'), 0, 1)
    const ring = clamp(frame.value('ring'), 0, 1)
    const setting: AuroraSetting = {
      brilliance: frame.value('brilliance'),
      lowCut: frame.value('lowCut'),
      contour: clamp(frame.value('contour'), 0, 1),
      swell: clamp(frame.value('swell'), 0, 1),
    }
    const parts = auroraParts(frame, attack, release)
    const { sky, attackEnd, releaseStart } = parts
    const times = auroraTimes(attack, release)
    const moment = state.moment
    const right = sky.x + sky.w

    panelGround(frame, sky)
    for (const hz of DECADES_HZ) {
      const y = auroraY(hz, sky)
      rule(ctx, sky.x, y, right, y, { colour: colours.ink, alpha: INK.grid })
    }

    // At rest: middle C struck as hard as can be, where the resting corner is Brilliance itself,
    // held six seconds past its attack and let go. Slice by slice, each layer's band between its
    // two corners and a fainter octave beyond them, as strong as the note is loud there.
    const high = auroraHighpassHz(setting.lowCut, AURORA_PIVOT_HZ)
    const band = (x: number, wide: number, fromHz: number, toHz: number, alpha: number): void => {
      const top = auroraY(toHz, sky)
      const bottom = auroraY(fromHz, sky)
      if (bottom - top <= 0 || alpha <= 0.004) return
      ctx.globalAlpha = alpha
      ctx.fillRect(x, top, wide, bottom - top)
    }
    ctx.fillStyle = colours.ink
    for (let x = sky.x; x < right; x += AURORA_SLICE_PX) {
      const wide = Math.min(AURORA_SLICE_PX, right - x)
      auroraMoment(parts, x + wide / 2, attack, release, moment)
      const lean = auroraSwell(moment.held, attack)
      const level = auroraInk(
        adsrLevel(times, moment.held + (moment.released ?? 0), moment.released) *
          auroraSwellLevel(setting.swell, lean) *
          auroraTrim(resonance),
      )
      const shape = auroraShape(moment.held, moment.released, attack, release)
      const low = auroraLowpassHz(setting, AURORA_PIVOT_HZ, 1, shape, lean)
      const two = Math.min(low * AURORA_TWO_BRIGHT, AURORA_TOP_HZ)
      band(x, wide, high, low, AURORA_BAND_INK * level)
      band(x, wide, high / 2, Math.min(high, low), AURORA_SKIRT_INK * level)
      band(x, wide, Math.max(high, low), low * 2, AURORA_SKIRT_INK * level)
      band(x, wide, high * AURORA_TWO_THIN, two, AURORA_BAND_INK * AURORA_TWO_LEVEL * level)
      band(
        x,
        wide,
        Math.max(high * AURORA_TWO_THIN, two),
        two * 2,
        AURORA_SKIRT_INK * AURORA_TWO_LEVEL * level,
      )
    }
    ctx.globalAlpha = 1

    // The corners themselves: the low pass as it rises, overshoots, settles, swells and darkens;
    // the high pass under it. The more Resonance, the more they ring: the heavier the lines.
    const corner = (x: number): number => {
      auroraMoment(parts, x, attack, release, moment)
      return auroraLowpassHz(
        setting,
        AURORA_PIVOT_HZ,
        1,
        auroraShape(moment.held, moment.released, attack, release),
        auroraSwell(moment.held, attack),
      )
    }
    const weight = 1 + 1.5 * (Math.log2(auroraQ(resonance) / AURORA_MIN_Q) / AURORA_Q_OCTAVES)
    clipped(ctx, sky, () => {
      ctx.beginPath()
      for (let x = sky.x; ; x = Math.min(right, x + 2)) {
        if (x === sky.x) ctx.moveTo(x, auroraY(corner(x), sky))
        else ctx.lineTo(x, auroraY(corner(x), sky))
        if (x >= right) break
      }
      ctx.globalAlpha = INK.trace
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = weight
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.globalAlpha = 1
    })
    rule(ctx, sky.x, auroraY(high, sky), right, auroraY(high, sky), {
      colour: colours.ink,
      alpha: INK.back,
      width: weight,
    })

    // Where the attack ends and the release begins.
    const zone = { colour: colours.ink, alpha: INK.rule, dash: AURORA_ZONE_DASH }
    rule(ctx, crisp(attackEnd), sky.y, crisp(attackEnd), sky.y + sky.h, zone)
    rule(ctx, crisp(releaseStart), sky.y, crisp(releaseStart), sky.y + sky.h, zone)

    // The ring: a sine that multiplies the note, falling in pitch as it fades. Its line is as
    // strong as the ring is deep at that moment.
    if (ring > 0) {
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      let before = auroraY(auroraRingHz(1), sky)
      for (let x = sky.x; x < right; x += 3) {
        auroraMoment(parts, Math.min(right, x + 3), attack, release, moment)
        const zing = auroraZing(moment.held + (moment.released ?? 0), attack)
        const y = auroraY(auroraRingHz(zing), sky)
        if (ring * zing > 0.03) {
          ctx.beginPath()
          ctx.moveTo(x, before)
          ctx.lineTo(Math.min(right, x + 3), y)
          ctx.globalAlpha = clamp(0.25 + ring * zing, 0, 1)
          ctx.stroke()
        }
        before = y
      }
      ctx.globalAlpha = 1
    }

    // Every voice that sounds, where it is in its own life: a bar across its band, the way its
    // low pass came there, a dot on the corner; and a dot on the ring while it still rings.
    const count = auroraVoices(frame.notes, attack, release, state.voices, state.live)
    for (let v = 0; v < count; v++) {
      const voice = state.voices[v]
      const lean = auroraSwell(voice.held, attack)
      const level =
        voice.envelope *
        auroraSwellLevel(setting.swell, lean) *
        auroraVelocity(voice.gain) *
        auroraTrim(resonance)
      const strength = 0.3 + 0.7 * auroraInk(level)
      const x = auroraX(parts, voice.held, voice.released, attack, release)
      const lowAt = (px: number): number => {
        auroraMoment(parts, px, attack, release, moment)
        const held = voice.released === null ? Math.min(moment.held, voice.held) : voice.held
        const released =
          voice.released === null ? null : Math.min(moment.released ?? 0, voice.released)
        return auroraLowpassHz(
          setting,
          voice.hz,
          voice.gain,
          auroraShape(held, released, attack, release),
          auroraSwell(held, attack),
        )
      }
      const from = voice.released === null ? sky.x : releaseStart
      clipped(ctx, sky, () => {
        ctx.beginPath()
        for (let px = from; ; px = Math.min(x, px + 2)) {
          if (px === from) ctx.moveTo(px, auroraY(lowAt(px), sky))
          else ctx.lineTo(px, auroraY(lowAt(px), sky))
          if (px >= x) break
        }
        ctx.globalAlpha = strength
        ctx.strokeStyle = colours.accent
        ctx.lineWidth = 1.5
        ctx.lineJoin = 'round'
        ctx.stroke()
        ctx.globalAlpha = 1
      })
      const low = auroraLowpassHz(
        setting,
        voice.hz,
        voice.gain,
        auroraShape(voice.held, voice.released, attack, release),
        lean,
      )
      const top = auroraY(low, sky)
      rule(ctx, x, top, x, auroraY(auroraHighpassHz(setting.lowCut, voice.hz), sky), {
        colour: colours.accent,
        alpha: strength,
        width: 2,
      })
      dot(ctx, x, top, 2, colours.accent)
      const zing = auroraZing(voice.held + (voice.released ?? 0), attack)
      if (ring * zing > 0.03)
        dot(ctx, x, auroraY(auroraRingHz(zing), sky), 1.5, colours.accent, {
          alpha: clamp(0.25 + ring * zing, 0, 1),
        })
    }

    // The two layers beat against each other this often at the note's pitch: a comb along the
    // held key, a tooth a beat. Where in a beat a note starts is left to chance, so it stands still.
    const newest = count > 0 ? state.voices[count - 1] : null
    const hz = newest ? newest.hz : AURORA_PIVOT_HZ
    const beatHz = auroraBeatHz(frame.value('detune'), hz)
    if (beatHz > 0) {
      const apart = (releaseStart - attackEnd) / AURORA_HELD_SEC / beatHz
      ctx.beginPath()
      if (apart >= 2) {
        for (let x = attackEnd + apart; x < releaseStart - 0.5; x += apart) {
          ctx.moveTo(crisp(x), sky.y + sky.h)
          ctx.lineTo(crisp(x), sky.y + sky.h - 3)
        }
      } else {
        // Too fast to tell the teeth apart.
        ctx.moveTo(attackEnd, sky.y + sky.h - 1.5)
        ctx.lineTo(releaseStart, sky.y + sky.h - 1.5)
      }
      ctx.globalAlpha = INK.text
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = apart >= 2 ? 1 : 3
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    levelFoot(frame, parts.foot, outShare(frame))

    // The words: the note and where its low pass stands now; under the picture, the two times.
    auroraMoment(parts, releaseStart, attack, release, moment)
    const stands = newest
      ? auroraLowpassHz(
          setting,
          newest.hz,
          newest.gain,
          auroraShape(newest.held, newest.released, attack, release),
          auroraSwell(newest.held, attack),
        )
      : auroraLowpassHz(
          setting,
          AURORA_PIVOT_HZ,
          1,
          auroraShape(moment.held, null, attack, release),
          auroraSwell(moment.held, attack),
        )
    text(frame, pitchName(hz), parts.words.x, parts.words.y + 8)
    text(frame, hzText(stands), parts.words.x + parts.words.w, parts.words.y + 8, {
      align: 'right',
    })
    text(frame, timeText(attack), sky.x, parts.scale.y + 8)
    text(frame, timeText(release), right, parts.scale.y + 8, { align: 'right' })

    for (const point of auroraHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: auroraHandles,
})

function auroraHandles(view: DisplayView): DisplayHandle[] {
  const attack = view.value('attack')
  const release = view.value('release')
  const setting: AuroraSetting = {
    brilliance: view.value('brilliance'),
    lowCut: view.value('lowCut'),
    contour: clamp(view.value('contour'), 0, 1),
    swell: clamp(view.value('swell'), 0, 1),
  }
  const parts = auroraParts(view, attack, release)
  const { sky } = parts
  const unit = auroraUnit(sky)
  // The resting note at the end of its attack, and at the end of its held key.
  const peak = AURORA_PEAK_OCTAVES
  const held = attack + AURORA_HELD_SEC
  const settled =
    setting.contour * auroraShape(held, null, attack, release) +
    setting.swell * AURORA_SWELL_OCTAVES * auroraSwell(held, attack)
  return [
    {
      key: 'attack',
      name: 'Attack',
      x: parts.attackEnd,
      y: auroraY(auroraLowpassHz(setting, AURORA_PIVOT_HZ, 1, peak, 0), sky),
      drag: (toX) => ({ attack: spanSeconds(Math.max(0, toX - sky.x) / unit) }),
      reset: () => ({ attack: view.spec('attack')?.default ?? 0.4 }),
    },
    {
      key: 'brilliance',
      name: 'Brilliance',
      x: parts.releaseStart,
      y: auroraY(Math.min(setting.brilliance * Math.pow(2, settled), AURORA_TOP_HZ), sky),
      drag: (_x, toY) => ({ brilliance: auroraHz(toY, sky) / Math.pow(2, settled) }),
      reset: () => ({ brilliance: view.spec('brilliance')?.default ?? 1100 }),
    },
  ]
}

export const SUBTRACTIVE_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  ember: {
    display: ember,
    face: ['cutoff', 'resonance', 'filterEnvAmount', 'oscMix'],
    labels: { lfo1Dest: 'LFO 1 Dest', lfo2Dest: 'LFO 2 Dest' },
    sections: [
      ['osc1Shape', 'osc1Coarse', 'osc1Fine', 'osc1Pw'],
      ['osc2Shape', 'osc2Coarse', 'osc2Fine', 'osc2Pw', 'osc2Sync'],
      ['oscMix', 'subLevel', 'noiseLevel'],
      [
        'filterType',
        'filterSlope',
        'cutoff',
        'resonance',
        'filterDrive',
        'keyTrack',
        'filterEnvAmount',
        'velToFilter',
      ],
      ['filterAttack', 'filterDecay', 'filterSustain', 'filterRelease'],
      ['ampAttack', 'ampDecay', 'ampSustain', 'ampRelease', 'velToAmp'],
      ['lfo1Shape', 'lfo1Rate', 'lfo1Dest', 'lfo1Amount'],
      ['lfo2Shape', 'lfo2Rate', 'lfo2Dest', 'lfo2Amount'],
      ['voiceMode', 'glide', 'unisonVoices', 'unisonDetune', 'unisonSpread', 'volume'],
    ],
    wide: true,
  },
  dusk: { display: dusk, face: ['cutoff', 'resonance', 'chorus', 'attack'] },
  'ladder-bass': { display: ladderBass, face: ['cutoff', 'emphasis', 'contour', 'decay'] },
  aurora: { display: aurora, face: ['brilliance', 'contour', 'attack', 'swell'] },
}
