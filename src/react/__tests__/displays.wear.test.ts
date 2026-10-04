// The truth of the wear family's displays: each curve, floor and step against
// the numbers of the device's own DSP (the constants and comments of its
// `.h`), and each handle against what it stands for.

import { describe, expect, it } from 'vitest'

import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import {
  type DisplayHandle,
  type DisplaySignal,
  type DisplayView,
} from '../components/plate-display'
import {
  Bins,
  Counter,
  Tally,
  WEAR_FACES,
  codecBands,
  codecMonoHz,
  codecSeverity,
  codecThreshold,
  converterInput,
  converterOutputDb,
  converterStep,
  crackleSizes,
  foldedBins,
  humLines,
  loudestBin,
  noiseBedPower,
  noiseTonePower,
  patinaCurve,
  patinaHighHz,
  patinaNoisePower,
  patinaResponse,
  patinaTones,
  radioDialHz,
  radioEdges,
  radioFilter,
  radioStaticDb,
  risingEdge,
  samplerHold,
  samplerSteps,
  skyWaveDb,
  splitLow,
  tapeCutoffHz,
  tapeHissDb,
  tapeKeptDb,
  tapeResponseDb,
  vinylResponseDb,
  vinylSurfaceDb,
} from '../components/displays/wear'
import {
  displaySize,
  drawDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const SR = 48000
/** The analyser's bins at 48 kHz, and what one of them reads of a noise's power per sample. */
const BIN_HZ = SR / 2048
const NOISE_WINDOW = 0.3046 * (Math.PI / 4)

const db = (power: number): number => 10 * Math.log10(power)

function view(id: string, values: Record<string, number> = {}): DisplayView {
  const descriptor = stock.get(id)
  if (!descriptor) throw new Error(`no device ${id}`)
  return viewOf(WEAR_FACES[id].display, descriptor.params, { values })
}

function handleOf(id: string, key: string, values: Record<string, number> = {}): DisplayHandle {
  const handle = WEAR_FACES[id].display.handles?.(view(id, values)).find((h) => h.key === key)
  if (!handle) throw new Error(`${id} has no handle ${key}`)
  return handle
}

/**
 * The power per sample of a noise whose floor a display draws: what its bins
 * add up to between two frequencies, with the analyser's window taken back
 * out (a bin holds 1 / 2048 of the power, the spectrum shows half the bins).
 */
function floorPower(curve: (hz: number) => number, from = BIN_HZ, to = SR / 2): number {
  let sum = 0
  for (let hz = from; hz < to; hz += BIN_HZ) sum += Math.pow(10, curve(hz) / 10) / NOISE_WINDOW
  return 2 * sum
}

/** The mean of a power over the audio band at 48 kHz: what white noise of power 1 comes out as. */
function meanPower(power: (hz: number) => number, step = 5): number {
  let sum = 0
  let count = 0
  for (let hz = step; hz < SR / 2; hz += step) {
    sum += power(hz)
    count += 1
  }
  return sum / count
}

/**
 * A display run frame by frame on one state, as the plate runs it: `frame`
 * draws the next thirtieth of a second with the readings given, `rest` draws
 * it as the plate does when the display leaves the screen (no sound, no time).
 */
function running(id: string, values: Record<string, number> = {}) {
  const descriptor = stock.get(id)
  if (!descriptor) throw new Error(`no device ${id}`)
  const { display } = WEAR_FACES[id]
  const state: unknown = display.init?.()
  let now = 10
  const draw = (meters: Record<string, number>, live: boolean): RecordingContext => {
    now += 1 / 30
    return drawDisplay(display, descriptor.params, {
      values,
      meters,
      state,
      now,
      dt: live ? 1 / 30 : 0,
      signal: live ? testSignal() : null,
    })
  }
  return {
    frame: (meters: Record<string, number>) => draw(meters, true),
    rest: (meters: Record<string, number>) => draw(meters, false),
    /** The same readings for `seconds`; the last frame's drawing comes back. */
    hold(meters: Record<string, number>, seconds: number): RecordingContext {
      let last = draw(meters, true)
      for (let n = 1; n < Math.round(seconds * 30); n++) last = draw(meters, true)
      return last
    },
  }
}

/** How many lines were drawn in a colour at a width. */
function strokesOf(drawn: RecordingContext, colour: string, width: number): number {
  let stroke = ''
  let line = 0
  let count = 0
  for (const call of drawn.calls) {
    if (call.name === 'set strokeStyle') stroke = String(call.args[0])
    else if (call.name === 'set lineWidth') line = Number(call.args[0])
    else if (call.name === 'stroke' && stroke === colour && line === width) count += 1
  }
  return count
}

/** How many dots of a radius were drawn. */
const dotsOf = (drawn: RecordingContext, radius: number): number =>
  drawn.calls.filter((call) => call.name === 'arc' && call.args[2] === radius).length

/** The amplitude of the tone at `hz` in `wave`, read under a Hann window. */
function toneIn(wave: Float32Array, hz: number): number {
  let re = 0
  let im = 0
  let weight = 0
  for (let i = 0; i < wave.length; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / wave.length)
    re += wave[i] * w * Math.cos((2 * Math.PI * hz * i) / SR)
    im += wave[i] * w * Math.sin((2 * Math.PI * hz * i) / SR)
    weight += w
  }
  return (2 * Math.hypot(re, im)) / weight
}

/** Tones through the compiled device for `seconds`: the left side of what comes out. */
async function through(
  id: string,
  values: Record<string, number>,
  tones: readonly (readonly [number, number])[],
  seconds: number,
): Promise<Float32Array> {
  const params = stock.get(id)?.params ?? {}
  const host = await loadWasmDevice(id, SR)
  for (const [name, value] of Object.entries(values)) host.set(params[name], value)
  const total = Math.floor(seconds * SR)
  const out = new Float32Array(total)
  const block = new Float32Array(128)
  for (let done = 0; done + 128 <= total; done += 128) {
    for (let i = 0; i < 128; i++) {
      let sample = 0
      for (const [hz, amplitude] of tones)
        sample += amplitude * Math.sin((2 * Math.PI * hz * (done + i)) / SR + hz)
      block[i] = sample
    }
    host.processBlock(block)
    out.set(host.view(host.device.device_out_left(), 128), done)
  }
  return out
}

const decibels = (gain: number): number => 20 * Math.log10(Math.max(gain, 1e-9))

/** Across a window's band on the kit's scale of 20 Hz to 20 kHz. */
const xOf = (hz: number, x: number, w: number): number =>
  x + (Math.log(hz / 20) / Math.log(1000)) * w

describe('every wear display', () => {
  it('is a window with four knobs beside it, on a device of the family', () => {
    expect(Object.keys(WEAR_FACES).sort()).toEqual([
      'low-bitrate',
      'noise-floor',
      'patina',
      'radio',
      'tape',
      'vintage-digital',
      'vinyl',
    ])
    for (const [id, face] of Object.entries(WEAR_FACES)) {
      expect(face.display.place, id).toBe('window')
      expect(face.face?.length, id).toBe(2 * (face.display.columns ?? 2))
      for (const name of face.face ?? []) expect(stock.get(id)?.params, id).toHaveProperty(name)
    }
  })

  it('reads the meters its device reports', () => {
    const read: Record<string, string[]> = {
      tape: ['wow', 'flutter', 'flutterDepth', 'drops', 'dropDepth', 'hiss'],
      vinyl: ['pitch', 'turn', 'ticks', 'tickLevel', 'pops', 'noise'],
      patina: ['wow', 'flutter', 'flutterDepth', 'level', 'drops', 'noise'],
      radio: ['tuning', 'direct', 'lateRe', 'lateIm', 'delay', 'static'],
      'low-bitrate': ['packet', 'lost', 'stuck'],
      'noise-floor': ['gain', 'ticks', 'pops'],
    }
    for (const [id, names] of Object.entries(read)) {
      const meters = stock.get(id)?.meters ?? {}
      for (const name of names) expect(meters, `${id} reports ${name}`).toHaveProperty(name)
      expect(Object.keys(meters).length, `${id} has no more than six`).toBeLessThanOrEqual(6)
    }
  })
})

describe('every handle of the family', () => {
  /** The way each handle goes; the other way is not its own. */
  const ACROSS = new Set(['tone', 'tuning', 'bandwidth', 'loss', 'highCut', 'rate'])
  const SETTINGS: Record<string, Record<string, number>[]> = {
    tape: [{}, { tone: 1 }, { hiss: 0.02 }],
    vinyl: [{}, { surface: 0.01 }],
    patina: [{ medium: 0 }, { medium: 1 }, { medium: 2 }, { medium: 3 }, { medium: 4 }],
    radio: [{ band: 0 }, { band: 1 }, { band: 2 }, { band: 3 }, { band: 0, tuning: 1 }],
    'low-bitrate': [{}, { loss: 0 }],
    'vintage-digital': [{}, { bits: 16 }, { rate: 48000 }],
    'noise-floor': [{ type: 0 }, { type: 1 }, { type: 3 }, { type: 0, level: -72 }],
  }

  it('is left where it is by a hand that drifts the other way, wherever it stands', () => {
    for (const [id, face] of Object.entries(WEAR_FACES)) {
      for (const values of SETTINGS[id]) {
        const seen = view(id, values)
        for (const handle of face.display.handles?.(seen) ?? []) {
          const across = handle.key === 'wear' ? id === 'patina' : ACROSS.has(handle.key)
          for (const drift of [-9, -1, 1, 9]) {
            const set = across
              ? handle.drag(handle.x, handle.y + drift)
              : handle.drag(handle.x + drift, handle.y)
            for (const [name, value] of Object.entries(set))
              expect(value, `${id} ${JSON.stringify(values)} ${handle.key}`).toBe(seen.value(name))
          }
        }
      }
    }
  })

  it('stays where it is when pushed past an end of the picture it already stands at', () => {
    // New tape on the reel medium ends above the picture: its edge stands at the right, clamped.
    const wear = handleOf('patina', 'wear', { medium: 0 })
    expect(wear.x).toBe(displaySize(WEAR_FACES.patina.display).width - 4)
    expect(wear.drag(wear.x + 30, wear.y).wear).toBe(0.3)
    // And pulled into the picture it wears from there on, the further the more.
    const little = Number(wear.drag(wear.x - 2, wear.y).wear)
    expect(little).toBeGreaterThan(0.3)
    expect(Number(wear.drag(wear.x - 12, wear.y).wear)).toBeGreaterThan(little)
    // Sixteen bits have their grain under the picture: pushed down they stay sixteen.
    const bits = handleOf('vintage-digital', 'bits', { bits: 16 })
    expect(bits.drag(bits.x, bits.y + 30).bits).toBe(16)
    expect(Number(bits.drag(bits.x, bits.y - 6).bits)).toBeLessThan(16)
  })

  it('reaches both ends of what it sets where the picture holds them', () => {
    const wear = handleOf('vinyl', 'wear')
    expect(wear.drag(wear.x, wear.y - 60).wear).toBe(0)
    expect(wear.drag(wear.x, wear.y + 60).wear).toBe(1)
    const hiss = handleOf('tape', 'hiss')
    expect(hiss.drag(hiss.x, hiss.y + 60).hiss).toBe(0)
    expect(hiss.drag(hiss.x, hiss.y - 60).hiss).toBe(1)
    const level = handleOf('noise-floor', 'level')
    expect(level.drag(level.x, level.y + 60).level).toBe(-72)
    expect(level.drag(level.x, level.y - 60).level).toBe(-12)
  })
})

describe('the parts the family shares', () => {
  it('counts events into the slot of the time they fell in', () => {
    const tally = new Tally(1, 10)
    tally.push(0, 0)
    tally.push(0.05, 2)
    tally.push(0.07, 1)
    expect(tally.at(0)).toBe(3)
    tally.push(0.35, 4)
    expect(tally.at(0)).toBe(4)
    expect(tally.at(1)).toBe(0)
    expect(tally.at(3)).toBe(3)
    // After a second all of it has run out of the strip.
    tally.push(1.6, 0)
    for (let back = 0; back < 10; back++) expect(tally.at(back)).toBe(0)
    const box = { x: 10, y: 0, w: 90, h: 10 }
    expect(tally.x(0, box)).toBe(100)
    expect(tally.x(9, box)).toBe(10)
  })

  it('counts what a device counted between two running frames, and nothing else', () => {
    const counter = new Counter()
    // The first readings only set the mark: what the device counted before the display opened is not news.
    expect(counter.more(500, 10)).toBe(0)
    expect(counter.more(503, 10.1)).toBe(0)
    expect(counter.steady).toBe(false)
    // From a quarter of a second on, each frame has what was added since the one before.
    expect(counter.more(503, 10.3)).toBe(0)
    expect(counter.steady).toBe(true)
    expect(counter.more(505, 10.33)).toBe(2)
    expect(counter.more(505, 10.36)).toBe(0)
    // Off the screen the readings stop and read 0 until the first new one arrives: no burst of what was missed.
    counter.rest()
    expect(counter.more(0, 20)).toBe(0)
    expect(counter.more(0, 20.03)).toBe(0)
    expect(counter.more(940, 20.06)).toBe(0)
    expect(counter.more(940, 20.3)).toBe(0)
    expect(counter.more(941, 20.33)).toBe(1)
    // A page that was hidden draws no frames for a while: the first one back counts nothing either.
    expect(counter.more(990, 31)).toBe(0)
    expect(counter.more(990, 31.3)).toBe(0)
    expect(counter.more(993, 31.33)).toBe(3)
    // The device's counters wrap at 2^20.
    expect(counter.more(1048575, 31.36)).toBe(0)
    expect(counter.more(3, 31.4)).toBe(4)
    // A device that began again from nothing (a new bed of noise) has not counted a million events.
    expect(counter.more(4000, 31.43)).toBe(3997)
    expect(counter.more(0, 31.46)).toBe(0)
    expect(counter.more(2, 31.5)).toBe(2)
  })

  it('reads a tone at its level in the spectrum of what goes in', () => {
    const bins = new Bins(512)
    const wave = new Float32Array(2048)
    // On bin 32 of 512 at 48 kHz: 3 kHz, at half of full scale.
    for (let i = 0; i < wave.length; i++) wave[i] = 0.5 * Math.sin((2 * Math.PI * 32 * i) / 512)
    bins.read(wave, 0)
    expect(bins.db(32)).toBeCloseTo(-6.02, 1)
    expect(bins.at(3000, SR)).toBeCloseTo(-6.02, 1)
    expect(bins.db(40)).toBeLessThan(-80)
    // It is kept as a power: the square of the tone's amplitude.
    expect(bins.power[32]).toBeCloseTo(0.25, 3)
    // It falls 30 dB a second once the tone has gone.
    bins.read(new Float32Array(2048), 0.5)
    expect(bins.db(32)).toBeCloseTo(-21.02, 1)
    expect(db(loudestBin(bins.power, SR / 512, 2500, 3500))).toBeCloseTo(-21.02, 1)
    // Narrower than a bin: a reading between two of them.
    const between = 3045 / (SR / 512) - 32
    expect(loudestBin(bins.power, SR / 512, 3040, 3050)).toBeCloseTo(
      bins.power[32] + (bins.power[33] - bins.power[32]) * between,
      6,
    )
    // A wave shorter than the window is read as silence before it began.
    const short = new Bins(512)
    short.read(wave.subarray(0, 256), 0)
    expect(Number.isFinite(short.db(32))).toBe(true)
  })

  it('draws a wave from where it last rose through zero', () => {
    const wave = new Float32Array(400)
    for (let i = 0; i < wave.length; i++) wave[i] = Math.sin((2 * Math.PI * (i - 3.5)) / 100)
    // Up through zero before 4, 104, 204 and 304: the last that leaves 150 samples to draw is 204.
    expect(risingEdge(wave, 150)).toBe(204)
    expect(risingEdge(new Float32Array(400), 150)).toBe(249)
  })
})

describe('tape', () => {
  it('rolls off where the speed, Tone and Age put it', () => {
    expect(tapeCutoffHz(view('tape', { speed: 0, tone: 0.5, age: 0 }), SR)).toBeCloseTo(18000, 0)
    expect(tapeCutoffHz(view('tape', { speed: 1, tone: 0.5, age: 0 }), SR)).toBeCloseTo(13000, 0)
    // Cassette, an octave down by Tone and another by Age.
    expect(tapeCutoffHz(view('tape', { speed: 3, tone: 0, age: 1 }), SR)).toBeCloseTo(1375, 0)
    // Never past 0.45 of the rate.
    expect(tapeCutoffHz(view('tape', { speed: 0, tone: 1, age: 0 }), SR)).toBeCloseTo(21600, 0)
    const flat = view('tape', { speed: 0, tone: 0.5, age: 0, bump: 0, output: 0 })
    expect(tapeResponseDb(flat, 18000, SR)).toBeCloseTo(-3.01, 1)
    expect(tapeResponseDb(flat, 1000, SR)).toBeCloseTo(0, 1)
  })

  it('has its head bump at the speed, 5 dB at the most, and Output over all of it', () => {
    const bumps = [60, 70, 85, 100]
    for (let speed = 0; speed < 4; speed++) {
      const without = view('tape', { speed, bump: 0, output: 0 })
      const full = view('tape', { speed, bump: 1, output: 0 })
      const lift =
        tapeResponseDb(full, bumps[speed], SR) - tapeResponseDb(without, bumps[speed], SR)
      expect(lift).toBeCloseTo(5, 1)
    }
    const louder = view('tape', { output: 6 })
    expect(tapeResponseDb(louder, 1000, SR) - tapeResponseDb(view('tape'), 1000, SR)).toBeCloseTo(6)
  })

  it('keeps of a tone what the record stage does: quiet ones come up, loud highs go first', () => {
    for (const drive of [0, 0.5, 1]) {
      // Low in level the curve is straight and the make-up is all there is: √(1 + (0.25·gain)²).
      const gain = Math.pow(2, 4 * drive - 1)
      expect(tapeKeptDb(drive, 0, 1e-4, 100, SR)).toBeCloseTo(db(1 + 0.0625 * gain * gain), 1)
      // Louder is kept less, and at full level the treble less than the bass.
      expect(tapeKeptDb(drive, 0, 1, 100, SR)).toBeLessThan(tapeKeptDb(drive, 0, 0.25, 100, SR))
      expect(tapeKeptDb(drive, 0, 1, 10000, SR)).toBeLessThan(tapeKeptDb(drive, 0, 1, 100, SR) - 2)
    }
    // At Drive 0 a tone at the reference level, −12 dBFS, comes out as it went in.
    expect(tapeKeptDb(0, 0, 0.25, 100, SR)).toBeCloseTo(0, 1)
    // Age adds emphasis, so a worn tape dulls a loud high more.
    expect(tapeKeptDb(0.5, 1, 1, 10000, SR)).toBeLessThan(tapeKeptDb(0.5, 0, 1, 10000, SR))
  })

  it('has its hiss at −40 dBFS a side at Hiss 1 and 15 ips, and 3 dB more for each speed down', () => {
    const at = (speed: number): number => {
      const tape = view('tape', { speed, bump: 0, tone: 0.5, age: 0, output: 0 })
      // Both sides have their own hiss: the spectrum of their sum shows half of one.
      return db(2 * floorPower((hz) => tapeHissDb(tape, hz, SR, BIN_HZ)))
    }
    expect(at(0)).toBeCloseTo(-40, 0)
    // The slower speeds are noisier by 3 dB each, less what their narrower band takes off the top.
    expect(at(1)).toBeGreaterThan(at(0) + 1)
    expect(at(1)).toBeLessThan(at(0) + 3)
    // It rises with frequency: 0.3 of the level below the tilt's corner, all of it above.
    const tape = view('tape', { speed: 0, bump: 0 })
    expect(tapeHissDb(tape, 6000, SR, BIN_HZ) - tapeHissDb(tape, 200, SR, BIN_HZ)).toBeGreaterThan(
      8,
    )
  })

  it('hangs a dropout where it fell, and none for those it did not see', () => {
    const tape = running('tape')
    const reading = (drops: number, hiss = 1): Record<string, number> => ({
      wow: 0.1,
      flutter: 0.2,
      flutterDepth: 0.05,
      drops,
      dropDepth: 0.5,
      hiss,
    })
    const drops = (drawn: RecordingContext): number => strokesOf(drawn, PLAIN_COLOURS.accent, 1.5)
    // The device had counted 500 before the display opened: none of them is drawn.
    expect(drops(tape.hold(reading(500), 0.5))).toBe(0)
    expect(drops(tape.frame(reading(501)))).toBe(1)
    // Off the screen and back: the readings read 0 until the first arrives, then 30 more than before.
    tape.rest(reading(501))
    tape.frame(reading(0, 0))
    tape.frame(reading(0, 0))
    expect(drops(tape.hold(reading(531), 0.4))).toBe(1)
    expect(drops(tape.frame(reading(532)))).toBe(2)
  })

  it('holds the pitch still while the device sleeps', () => {
    // Asleep the readings stand where they stopped: a wow of 1 % is not being played.
    const tape = running('tape', { wow: 1, flutter: 1 })
    const asleep = { wow: 1, flutter: 0.2, flutterDepth: 0.3, drops: 0, dropDepth: 0, hiss: 0 }
    const size = displaySize(WEAR_FACES.tape.display)
    const middle = 4 + (size.height - 8) - 30 + 15
    const trace = (drawn: RecordingContext): number[] => {
      // The pitch trace is the last line of 150 points drawn.
      const ys: number[] = []
      for (const call of drawn.calls) {
        if (call.name === 'beginPath') ys.length = 0
        else if (call.name === 'moveTo' || call.name === 'lineTo') ys.push(Number(call.args[1]))
        else if (call.name === 'stroke' && ys.length === 150) return [...ys]
      }
      return []
    }
    const still = trace(tape.hold(asleep, 3.2))
    expect(still).toHaveLength(150)
    for (const y of still) expect(y).toBeCloseTo(middle, 6)
    // Awake, the same readings bend it.
    const awake = trace(tape.hold({ ...asleep, hiss: 1 }, 1))
    expect(Math.min(...awake)).toBeLessThan(middle - 3)
  })

  it('moves Tone and Hiss from their points', () => {
    const size = displaySize(WEAR_FACES.tape.display)
    const tone = handleOf('tape', 'tone', { speed: 0, age: 0 })
    // The band is the window less its margins; the point goes to 4.5 kHz, two octaves under 18 kHz.
    const set = tone.drag(xOf(4500, 4, size.width - 8), tone.y)
    expect(set.tone).toBeCloseTo(0, 2)
    expect(tone.reset?.().tone).toBe(0.5)
    const hiss = handleOf('tape', 'hiss')
    // 12 dB up the spectrum's scale is a doubling of the knob: Hiss is squared into a level.
    const scale = (size.height - 8 - 30 - 4) / 110
    expect(hiss.drag(hiss.x, hiss.y - 12.04 * scale).hiss).toBeCloseTo(0.5, 2)
  })
})

describe('vinyl', () => {
  it('takes up to 18 dB off the top with Wear, by the power of one and a half', () => {
    expect(vinylResponseDb(view('vinyl', { wear: 1 }), 16000, SR)).toBeCloseTo(-18, 0)
    expect(vinylResponseDb(view('vinyl', { wear: 0.25 }), 16000, SR)).toBeCloseTo(-18 / 8, 0)
    expect(vinylResponseDb(view('vinyl', { wear: 0 }), 16000, SR)).toBeCloseTo(0, 5)
    expect(vinylResponseDb(view('vinyl', { wear: 1 }), 200, SR)).toBeCloseTo(0, 1)
  })

  it('tilts with Tone and narrows to shellac on 78', () => {
    const bright = view('vinyl', { wear: 0, tone: 1 })
    expect(vinylResponseDb(bright, 16000, SR)).toBeCloseTo(6, 0)
    expect(vinylResponseDb(bright, 40, SR)).toBeCloseTo(-3.5, 0)
    const shellac = view('vinyl', { wear: 0, tone: 0, speed: 2 })
    // 150 Hz to 6 kHz, a lift of 3 dB at 1.1 kHz, all of it a decibel down.
    expect(vinylResponseDb(shellac, 1100, SR)).toBeCloseTo(2, 0)
    expect(vinylResponseDb(shellac, 150, SR)).toBeCloseTo(-4, 0)
    expect(vinylResponseDb(shellac, 6000, SR)).toBeCloseTo(-4, 0)
    expect(vinylResponseDb(shellac, 12000, SR)).toBeLessThan(-24)
  })

  it('has its surface where the device makes it: hiss at −40 dBFS a side, rumble under it', () => {
    const record = view('vinyl', { tone: 0, speed: 0 })
    const curve = (hz: number): number => vinylSurfaceDb(record, hz, SR, BIN_HZ)
    // Above the rumble only the hiss is left: pink over 200 Hz, a stream to each wall.
    const hiss = 2 * floorPower(curve, 400)
    expect(db(hiss)).toBeGreaterThan(-41.5)
    expect(db(hiss)).toBeLessThan(-40)
    // The rumble is what both walls share: −44 dBFS before its own cut under 20 Hz.
    const rumble = floorPower(curve, BIN_HZ, 150)
    expect(db(rumble)).toBeGreaterThan(-48)
    expect(db(rumble)).toBeLessThan(-44)
    // Shellac is 7 dB noisier in its band.
    const shellac = view('vinyl', { tone: 0, speed: 2 })
    expect(vinylSurfaceDb(shellac, 1100, SR, BIN_HZ) - curve(1100)).toBeCloseTo(7 + 2, 0)
  })

  it('sizes the crackle as the device does', () => {
    // At the default nothing is over −38 dBFS.
    const usual = crackleSizes(0.3)
    expect(20 * Math.log10(usual.ceiling)).toBeCloseTo(-38.2, 0)
    expect(usual.floor).toBeCloseTo(0.002 * Math.sqrt(0.3), 6)
    // Low on the control it is an even bed, twice the floor at most; at the top the spread is 42 dB.
    const low = crackleSizes(0.1)
    expect(low.ceiling).toBeCloseTo(2 * low.floor, 6)
    const top = crackleSizes(1)
    expect(20 * Math.log10(top.ceiling / top.floor)).toBeCloseTo(41.9, 0)
  })

  it('draws a pop only where Pops lets one sound', () => {
    const turning = (count: number): Record<string, number> => ({
      pitch: 0,
      turn: 0.3,
      ticks: 0,
      tickLevel: 0,
      pops: count,
      noise: 1,
    })
    // A scratch cut while Pops was up still comes round at Pops 0, counted by the device and silent.
    const silent = running('vinyl', { pops: 0 })
    silent.hold(turning(7), 0.5)
    silent.frame(turning(8))
    expect(dotsOf(silent.frame(turning(9)), 1.75)).toBe(0)
    const heard = running('vinyl', { pops: 0.5 })
    heard.hold(turning(7), 0.5)
    // Two frames, a slot of the strip apart, so two dots, and none for the seven before the display opened.
    heard.frame(turning(8))
    expect(dotsOf(heard.hold(turning(9), 0.1), 1.75)).toBe(2)
  })

  it('moves Wear from its point: the top of the band goes where the pointer is', () => {
    const size = displaySize(WEAR_FACES.vinyl.display)
    const wear = handleOf('vinyl', 'wear', { wear: 0, tone: 0 })
    // The band's curve runs from +12 dB at its top to −36 dB at its foot.
    const band = { y: 4, h: size.height - 8 - 36 - 4 }
    const down9 = band.y + ((12 + 9) / 48) * band.h
    const set = wear.drag(wear.x, down9)
    expect(vinylResponseDb(view('vinyl', { wear: set.wear, tone: 0 }), 11000, SR)).toBeCloseTo(
      -9,
      1,
    )
  })
})

describe('patina', () => {
  it('bends a tone at the reference level without changing how loud it is', () => {
    // The make-up holds a sine at −12 dBFS RMS where it came in, on every medium and at every Drive.
    for (const medium of [0, 1, 2, 3, 5]) {
      for (const drive of [0, 0.35, 1]) {
        const bent = patinaCurve(medium, drive)
        let sum = 0
        let squares = 0
        for (let k = 0; k < 256; k++) {
          const y = bent(0.3548 * Math.sin((2 * Math.PI * k) / 256))
          sum += y
          squares += y * y
        }
        const rms = Math.sqrt(squares / 256 - (sum / 256) ** 2)
        expect(rms / (0.3548 * Math.SQRT1_2), `medium ${medium} at ${drive}`).toBeCloseTo(1, 1)
        expect(bent(0)).toBeCloseTo(0, 6)
      }
    }
  })

  it('has each medium its own curve: the tape soft, the cassette clipped, the radio and valve lopsided', () => {
    // Driven hard, a clip is flat at the top and a soft curve still rises.
    const cassette = patinaCurve(1, 1)
    expect(cassette(1)).toBeCloseTo(cassette(0.6), 5)
    const reel = patinaCurve(0, 1)
    expect(reel(1)).toBeGreaterThan(reel(0.6))
    // The radio's detector and the valve end lower on one side than on the other.
    for (const medium of [3, 5]) {
      const bent = patinaCurve(medium, 1)
      expect(Math.abs(bent(-1))).not.toBeCloseTo(bent(1), 1)
    }
  })

  it('rounds the sampler on its square-root law, 18 bits down to 6', () => {
    expect(samplerSteps(0)).toBe(131072)
    expect(samplerSteps(1)).toBe(32)
    const coarse = patinaCurve(4, 1)
    // 32 steps to full scale: the levels are (k / 32)², fine near zero and coarse at the top.
    expect(coarse(0.25)).toBeCloseTo(0.25, 6)
    expect(coarse(0.26)).toBeCloseTo(0.25, 6)
    expect(coarse(0.27)).toBeCloseTo((17 / 32) ** 2, 6)
    expect(coarse(0.0012)).toBeCloseTo((1 / 32) ** 2, 6)
    expect(coarse(-0.0012)).toBeCloseTo(-((1 / 32) ** 2), 6)
    expect(coarse(0.0002)).toBe(0)
  })

  it('narrows to the band of each medium with Wear', () => {
    const ends: [number, number, number][] = [
      [0, 40, 7000],
      [1, 60, 4500],
      [2, 50, 9000],
      [3, 300, 3200],
      [5, 80, 6000],
    ]
    for (const [medium, , high] of ends) {
      const worn = view('patina', { medium, wear: 1, tone: 0.5, output: 0 })
      expect(patinaHighHz(worn, SR)).toBeCloseTo(high, 0)
      // Two poles are 3 dB down at the edge; the radio's four, on each side, too.
      expect(patinaResponse(worn, SR)(high)).toBeCloseTo(-3.01, 0)
    }
    const radio = patinaResponse(view('patina', { medium: 3, wear: 1, output: 0 }), SR)
    expect(radio(300)).toBeCloseTo(-3.01, 1)
    // Four poles: 24 dB an octave.
    expect(radio(150)).toBeLessThan(-22)
    expect(radio(6400)).toBeLessThan(-22)
    // New, a medium passes everything: within half a decibel from 40 Hz to 16 kHz.
    for (const medium of [0, 1, 2, 3, 5]) {
      const fresh = patinaResponse(view('patina', { medium, wear: 0, tone: 0.5, output: 0 }), SR)
      for (const hz of [40, 1000, 16000]) expect(Math.abs(fresh(hz))).toBeLessThan(0.5)
    }
    // The reel's head bump: 3 dB at 70 Hz worn through, less the 0.4 dB its low end has lost there.
    const reel = patinaResponse(view('patina', { medium: 0, wear: 1, output: 0 }), SR)
    expect(reel(70) - reel(1000)).toBeCloseTo(3 - 0.44, 1)
    // Output moves all of it.
    const louder = patinaResponse(view('patina', { medium: 0, wear: 1, output: -6 }), SR)
    expect(louder(1000) - reel(1000)).toBeCloseTo(-6, 6)
  })

  it('holds the sampler down to 6 kHz, and closes its output filter under the middle of Tone', () => {
    expect(samplerHold(1, SR)).toBeCloseTo(8, 6)
    expect(samplerHold(0, SR)).toBe(1)
    expect(patinaHighHz(view('patina', { medium: 4, tone: 0 }), SR)).toBeCloseTo(1486.5, 0)
    // A held sample droops 3.9 dB at half its rate and is gone at the rate itself.
    const held = patinaResponse(view('patina', { medium: 4, wear: 1, tone: 0.5, output: 0 }), SR)
    expect(held(3000)).toBeCloseTo(-3.92, 0)
    expect(held(6000)).toBeLessThan(-40)
  })

  it('has the noise of each medium at an RMS of 1 before its level, as the device scales it', () => {
    // Uniform noise has a third of its peak's power; a tone half the square of its amplitude.
    const whole = (medium: number): number =>
      (2 * meanPower((hz) => patinaNoisePower(medium, hz, SR))) / 3 +
      patinaTones(medium).reduce((sum, [, amplitude]) => sum + amplitude ** 2, 0)
    expect(whole(0)).toBeCloseTo(1, 1)
    expect(whole(1)).toBeCloseTo(1, 1)
    expect(whole(4)).toBeCloseTo(1, 1)
    expect(whole(5)).toBeCloseTo(1, 1)
    // Tape hiss rises with frequency; the valve's noise is nearly all hum.
    expect(patinaNoisePower(0, 8000, SR)).toBeGreaterThan(4 * patinaNoisePower(0, 100, SR))
    expect(patinaTones(5).map(([hz]) => hz)).toEqual([100, 200, 300, 500])
    expect(patinaTones(3).map(([hz]) => hz)).toEqual([50, 100, 150])
    expect(patinaTones(4)).toEqual([[3200, 1.64 * 0.3 * Math.SQRT1_2]])
  })

  it('says beside its strip what Wobble moves and how far', () => {
    const says = (values: Record<string, number>): string[] =>
      drawDisplay(WEAR_FACES.patina.display, stock.get('patina')?.params ?? {}, { values }).words()
    // The cassette's wow and flutter reach 1.2 % and 0.4 %; the radio fades by 9 dB; the valve gives way by 6.
    expect(says({ medium: 1, wobble: 1 })).toEqual(['±1.6%'])
    expect(says({ medium: 0, wobble: 0.5 })).toEqual(['±0.38%'])
    expect(says({ medium: 3, wobble: 1 })).toEqual(['−9 dB'])
    expect(says({ medium: 5, wobble: 1 })).toEqual(['−6 dB'])
    // The sampler's strip is its clock: the rate it is held down to.
    expect(says({ medium: 4, wear: 1 })).toEqual(['6 kHz'])
    expect(says({ medium: 4, wear: 0 })).toEqual(['48 kHz'])
  })

  it('moves Wear from the edge of the band', () => {
    const size = displaySize(WEAR_FACES.patina.display)
    const wear = handleOf('patina', 'wear', { medium: 1, tone: 0.5 })
    // The cassette's band ends at 4.5 kHz worn through: put the edge there.
    expect(wear.drag(xOf(4500, 4, size.width - 8), wear.y).wear).toBeCloseTo(1, 2)
    // The sampler's edge is half its rate: 3 kHz is a rate of 6 kHz.
    const rate = handleOf('patina', 'wear', { medium: 4 })
    expect(rate.drag(xOf(3000, 4, size.width - 8), rate.y).wear).toBeCloseTo(1, 2)
  })
})

describe('radio', () => {
  it('has the band of the receiver where Bandwidth puts it', () => {
    expect(radioEdges(view('radio', { band: 1, bandwidth: 0 }))).toEqual({ low: 330, high: 2400 })
    const wide = radioEdges(view('radio', { band: 1, bandwidth: 1 }))
    expect(wide.low).toBeCloseTo(155, 6)
    expect(wide.high).toBeCloseTo(5000, 6)
    const half = radioEdges(view('radio', { band: 0, bandwidth: 0.5 }))
    expect(half.high).toBeCloseTo(Math.sqrt(2800 * 6000), 3)
  })

  it('has a square-law dial where there is a carrier, and a straight one on Sideband', () => {
    expect(radioDialHz(view('radio', { band: 1, tuning: 0.5 }))).toBeCloseTo(1375, 6)
    expect(radioDialHz(view('radio', { band: 0, tuning: -1 }))).toBeCloseTo(-5500, 6)
    expect(radioDialHz(view('radio', { band: 2, tuning: -0.5 }))).toBeCloseTo(-200, 6)
  })

  it('puts the filter over the station with a carrier, and beside the missing one on Sideband', () => {
    const short = view('radio', { band: 1, bandwidth: 0 })
    expect(radioFilter(short, 1375)).toEqual({ centre: 1375, half: 2400 })
    const side = view('radio', { band: 2, bandwidth: 0 })
    // 350 Hz to 2.2 kHz, and the dial slides the programme the other way under it.
    expect(radioFilter(side, 0)).toEqual({ centre: 1275, half: 925 })
    expect(radioFilter(side, 400).centre).toBe(875)
  })

  it('hollows the signal where the late path cancels the direct one', () => {
    expect(skyWaveDb(1, 0, 0, 1, 1234)).toBeCloseTo(0, 6)
    // A late path as strong as the direct one, 1 ms behind: gone at 500 Hz, doubled at 1 kHz.
    expect(skyWaveDb(1, 1, 0, 1, 500)).toBeLessThan(-60)
    expect(skyWaveDb(1, 1, 0, 1, 1000)).toBeCloseTo(6.02, 1)
    expect(skyWaveDb(1, 1, 0, 1, -1000)).toBeCloseTo(6.02, 1)
    // Turned a quarter, the notch moves a quarter of the way along.
    expect(skyWaveDb(1, 0, -1, 1, 250)).toBeLessThan(-60)
    // A flat fade is the same everywhere.
    expect(skyWaveDb(0.1, 0, 0, 1, 3000)).toBeCloseTo(-20, 5)
  })

  it('reads the static as its spectrum would', () => {
    // Uniform noise of amplitude g on both parts: 2g² / 3 over the whole rate, a bin and a half of 512.
    expect(radioStaticDb(0.26)).toBeCloseTo(db(((2 * 0.26 * 0.26) / 3) * (1.5 / 512)), 6)
    expect(radioStaticDb(0.26) - radioStaticDb(0.026)).toBeCloseTo(20, 6)
  })

  it('tunes and sets the bandwidth from the filter', () => {
    const size = displaySize(WEAR_FACES.radio.display)
    // With a carrier the picture runs 10 kHz either side of the station.
    const across = (hz: number): number => 4 + ((hz + 10000) / 20000) * (size.width - 8)
    const tuning = handleOf('radio', 'tuning', { band: 1, tuning: 0 })
    expect(tuning.x).toBeCloseTo(across(0), 6)
    expect(tuning.drag(across(1375), tuning.y).tuning).toBeCloseTo(0.5, 6)
    expect(tuning.drag(across(-5500), tuning.y).tuning).toBeCloseTo(-1, 6)
    const bandwidth = handleOf('radio', 'bandwidth', { band: 1, tuning: 0, bandwidth: 0.5 })
    expect(bandwidth.x).toBeCloseTo(across(Math.sqrt(2400 * 5000)), 6)
    expect(bandwidth.drag(across(5000), bandwidth.y).bandwidth).toBeCloseTo(1, 6)
    expect(bandwidth.drag(across(2400), bandwidth.y).bandwidth).toBeCloseTo(0, 6)
  })
})

describe('low bitrate', () => {
  it('means by Loss what the codec does', () => {
    const none = codecSeverity(0)
    expect(none.marginDb).toBeCloseTo(62, 6)
    expect(none.floorDb).toBeCloseTo(96, 6)
    expect(none.cutHz).toBeCloseTo(22000, -1)
    const all = codecSeverity(1)
    expect(all.marginDb).toBeCloseTo(2, 6)
    expect(all.floorDb).toBeCloseTo(14, 6)
    expect(all.cutHz).toBeCloseTo(3500, -1)
    expect(codecSeverity(0.5).marginDb).toBeCloseTo(17, 6)
  })

  it('groups the coefficients into the critical bands, fewer in a short frame', () => {
    const long = codecBands(2, SR)
    expect(long[0]).toBe(0)
    expect(long[long.length - 1]).toBe(SR / 2)
    expect(long.length - 1).toBe(26)
    // 1024 coefficients are 23.4 Hz apart: the edge at 100 Hz is the fourth.
    expect(long[1]).toBeCloseTo(4 * (SR / 2048), 6)
    // 128 are 187.5 Hz apart, and a band holds four at the least.
    const short = codecBands(0, SR)
    expect(short[1]).toBeCloseTo(750, 6)
    expect(short.length).toBeLessThan(codecBands(1, SR).length)
    expect(codecBands(1, SR).length).toBeLessThan(long.length)
    // From 88.2 kHz up a frame holds twice the coefficients.
    expect(codecBands(2, 96000)[1]).toBeCloseTo(4 * (96000 / 4096), 6)
  })

  it('raises the threshold of a band by the loud bands beside it', () => {
    // Masking falls 8 dB a band upwards and 16 downwards.
    const up = Float32Array.from([0, -100, -100, -100])
    codecThreshold(up, 4, 10, -200)
    expect(Array.from(up)).toEqual([-10, -18, -26, -34])
    const down = Float32Array.from([-100, -100, -100, 0])
    codecThreshold(down, 4, 10, -200)
    expect(Array.from(down)).toEqual([-58, -42, -26, -10])
    // Nothing is kept under the floor below the stream's peak.
    const floor = Float32Array.from([0, -100, -100, -100])
    codecThreshold(floor, 4, 10, -20)
    expect(Array.from(floor)).toEqual([-10, -18, -20, -20])
  })

  it('keeps and throws away the tones the compiled codec does', async () => {
    // Five tones well apart, each in a band of its own: 0, −20, −40, −55 and −30 dB against the loudest.
    const loudest = 0.25
    const tones: [number, number][] = [
      [1000, 0],
      [1600, -20],
      [3000, -40],
      [6000, -55],
      [9000, -30],
    ]
    const edges = codecBands(2, SR)
    const bands = edges.length - 1
    const bandOf = (hz: number): number => edges.findIndex((_, i) => i < bands && hz < edges[i + 1])
    for (const loss of [0.5, 0.8]) {
      const severity = codecSeverity(loss)
      // The display's verdict: each band's loudest, then the line under which the codec drops what is in it.
      const limit = new Float32Array(32).fill(-200)
      for (const [hz, down] of tones) limit[bandOf(hz)] = decibels(loudest) + down
      codecThreshold(limit, bands, severity.marginDb, decibels(loudest) - severity.floorDb)
      const out = await through(
        'low-bitrate',
        { loss, frame: 2, mode: 0, mix: 1, stereo: 1, smear: 0, dropouts: 0, stutter: 0 },
        tones.map(([hz, down]) => [hz, loudest * Math.pow(10, down / 20)]),
        3,
      )
      const tail = out.subarray(out.length - 65536)
      let judged = 0
      for (const [hz, down] of tones) {
        const level = decibels(loudest) + down
        const over = level - limit[bandOf(hz)]
        const came = decibels(toneIn(tail, hz)) - level
        const what = `${hz} Hz at Loss ${loss}, ${over.toFixed(1)} dB over the line`
        if (hz > severity.cutHz || over < -3) expect(came, what).toBeLessThan(-40)
        else if (over > 3) expect(Math.abs(came), what).toBeLessThan(2)
        else continue
        judged += 1
      }
      expect(judged, `tones judged at Loss ${loss}`).toBeGreaterThanOrEqual(4)
    }
  })

  it('folds stereo to mono from the top down as far as Loss and Stereo say', () => {
    expect(codecMonoHz(0.5, 1)).toBeCloseTo(20000, -1)
    expect(codecMonoHz(0, 0)).toBeCloseTo(20000, -1)
    expect(codecMonoHz(1, 0)).toBeCloseTo(5, 1)
    expect(codecMonoHz(0.5, 0.7)).toBeCloseTo(20000 * Math.pow(2, -11.9658 * 0.15), -1)
  })

  it('shows a lost packet as a gap in the stream, and none where nothing goes in or comes out', () => {
    const descriptor = stock.get('low-bitrate')
    if (!descriptor) throw new Error('no low-bitrate')
    const { display } = WEAR_FACES['low-bitrate']
    /** Five seconds of a device that reports a lost packet; how wide the stream is drawn flowing at the end. */
    const flowing = (signal: DisplaySignal): number => {
      const state: unknown = display.init?.()
      let wide = 0
      for (let n = 1; n <= 150; n++) {
        const drawn = drawDisplay(display, descriptor.params, {
          meters: { packet: 1, lost: 3, stuck: 0 },
          state,
          now: 10 + n / 30,
          dt: 1 / 30,
          signal,
        })
        let alpha = 1
        wide = 0
        for (const call of drawn.calls) {
          if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
          else if (call.name === 'fillRect' && alpha === 0.42) wide += Number(call.args[2])
        }
      }
      return wide
    }
    const width = displaySize(display).width - 8
    // Sound goes in and the packets are lost: the whole of the last four seconds is a gap.
    expect(flowing(testSignal(0.5, 0))).toBe(0)
    // Nothing goes in: the device sleeps with its last reading standing, and the stream is whole.
    expect(flowing(testSignal(0, 0))).toBeCloseTo(width, 6)
  })

  it('moves Loss and High Cut from their edges', () => {
    const size = displaySize(WEAR_FACES['low-bitrate'].display)
    const loss = handleOf('low-bitrate', 'loss')
    const set = loss.drag(xOf(3500, 4, size.width - 8), loss.y)
    expect(set.loss).toBeCloseTo(1, 2)
    expect(codecSeverity(loss.drag(xOf(8000, 4, size.width - 8), loss.y).loss).cutHz).toBeCloseTo(
      8000,
      -1,
    )
    const highCut = handleOf('low-bitrate', 'highCut')
    expect(highCut.drag(xOf(5000, 4, size.width - 8), highCut.y).highCut).toBeCloseTo(5000, 0)
    expect(highCut.drag(0, highCut.y).highCut).toBe(1000)
  })
})

describe('vintage digital', () => {
  it('has the steep filter the device has: 0.1 dB of ripple, 80 dB down from 1.256 of its edge', () => {
    expect(db(splitLow(0))).toBeCloseTo(0, 6)
    let ripple = 0
    for (let ratio = 0; ratio <= 1; ratio += 0.001) ripple = Math.min(ripple, db(splitLow(ratio)))
    expect(ripple).toBeCloseTo(-0.1, 3)
    let stop = -200
    for (let ratio = 1.256; ratio < 40; ratio += 0.001) stop = Math.max(stop, db(splitLow(ratio)))
    expect(stop).toBeCloseTo(-80, 2)
  })

  it('lets in above half the rate what Aliasing says, and nothing at 0', () => {
    // The edge is at 0.44 of the rate: at 9 kHz, 6 kHz is well into the stopband.
    expect(db(converterInput(0, 6000, 9000, SR))).toBeLessThan(-79.9)
    expect(db(converterInput(1, 6000, 9000, SR))).toBeCloseTo(0, 6)
    // Aliasing is squared into a gain: a half lets a quarter through, 12 dB down.
    expect(db(converterInput(0.5, 6000, 9000, SR))).toBeCloseTo(-12.04, 1)
    // Under the edge everything passes whatever Aliasing is.
    expect(db(converterInput(0, 3000, 9000, SR))).toBeGreaterThan(-0.11)
  })

  it('droops as a held sample does, and filters after it', () => {
    // 3.9 dB at half the rate, nothing left at the rate itself.
    expect(converterOutputDb(0, 4500, 9000, SR)).toBeCloseTo(-3.92, 2)
    expect(converterOutputDb(0, 9000, 9000, SR)).toBeLessThan(-100)
    expect(converterOutputDb(0, 100, 9000, SR)).toBeCloseTo(0, 2)
    // Soft is two poles at half the rate: 3 dB more there. Steep is the elliptic filter again.
    expect(converterOutputDb(1, 4500, 9000, SR)).toBeCloseTo(-3.92 - 3.01, 1)
    expect(converterOutputDb(2, 6000, 9000, SR)).toBeLessThan(-80)
    expect(converterOutputDb(2, 3000, 9000, SR)).toBeCloseTo(
      converterOutputDb(0, 3000, 9000, SR),
      0,
    )
  })

  it('folds each bin to where a sampler puts it', () => {
    // 512 bins of 46.875 Hz, a sampler at 9 kHz: 6 kHz comes back at 3 kHz, 9 kHz at nothing, 4.5 kHz stays.
    const alias = new Uint16Array(513)
    foldedBins(alias, 9000, SR / 1024)
    expect(alias[128]).toBe(64)
    expect(alias[192]).toBe(0)
    expect(alias[96]).toBe(96)
    expect(alias[64]).toBe(64)
    // 12 kHz is 3 kHz from 9 kHz too, and nothing lands above half the rate.
    expect(alias[256]).toBe(64)
    expect(Math.max(...alias)).toBe(96)
  })

  it('puts the aliases and the images where the compiled converter does, at its levels', async () => {
    const amplitude = 0.125
    const cases: [number, number, number, number][] = [
      // Rate, the tone, Aliasing, the output filter.
      [9000, 6000, 1, 0],
      [9000, 6000, 0.5, 1],
      [4000, 5000, 1, 0],
    ]
    for (const [rate, tone, aliasing, filter] of cases) {
      const out = await through(
        'vintage-digital',
        { rate, aliasing, filter, bits: 16, jitter: 0, drive: 0, mix: 1, companding: 0 },
        [[tone, amplitude]],
        1.5,
      )
      const tail = out.subarray(out.length - 32768)
      // What Aliasing lets in of the tone, folded to its distance from the nearest multiple of the rate and its copies.
      const passed = decibels(amplitude) + 10 * Math.log10(converterInput(aliasing, tone, rate, SR))
      const alias = Math.abs(tone - Math.round(tone / rate) * rate)
      for (const hz of [alias, rate - alias, rate + alias, 2 * rate - alias]) {
        const says = passed + converterOutputDb(filter, hz, rate, SR)
        expect(
          decibels(toneIn(tail, hz)),
          `${hz} Hz of ${tone} Hz at a rate of ${rate}`,
        ).toBeCloseTo(says, 0)
      }
    }
  })

  it('steps by 2^(1 − Bits), and by mu-law finer near nothing and coarser at full scale', () => {
    expect(converterStep(12, false, 0.5)).toBe(Math.pow(2, -11))
    expect(converterStep(4, false, 0)).toBe(0.125)
    expect(20 * Math.log10(converterStep(8, true, 0) / converterStep(8, false, 0))).toBeCloseTo(
      -33.3,
      1,
    )
    expect(20 * Math.log10(converterStep(8, true, 1) / converterStep(8, false, 1))).toBeCloseTo(
      14.9,
      1,
    )
  })

  it('moves Rate from half the rate, and Bits by 6 dB a bit', () => {
    const size = displaySize(WEAR_FACES['vintage-digital'].display)
    const rate = handleOf('vintage-digital', 'rate')
    expect(rate.x).toBeCloseTo(xOf(4500, 4, size.width - 8), 6)
    expect(rate.drag(xOf(2000, 4, size.width - 8), rate.y).rate).toBeCloseTo(4000, 0)
    const bits = handleOf('vintage-digital', 'bits', { bits: 8 })
    const scale = (size.height - 8 - 28 - 4) / 110
    expect(bits.drag(bits.x, bits.y - 12.04 * scale).bits).toBeCloseTo(6, 2)
    expect(bits.drag(bits.x, bits.y + 12.04 * scale).bits).toBeCloseTo(10, 2)
  })
})

describe('noise floor', () => {
  it('has every bed at an RMS of 1 before Level, as the device scales them', () => {
    for (const bed of ['tape', 'vinyl', 'room', 'static', 'air'] as const)
      expect(
        meanPower((hz) => noiseBedPower(bed, hz, SR), 2),
        bed,
      ).toBeCloseTo(1, 1)
    // Hum is its harmonics, with a trace of hiss 26 dB under them.
    const lines = humLines(0).reduce((sum, amplitude) => sum + (amplitude * amplitude) / 2, 0)
    expect(lines + meanPower((hz) => noiseBedPower('hum50', hz, SR), 2)).toBeCloseTo(1, 2)
  })

  it('gives each bed its colour: hiss rises, rumble and room stay low, hum is forty lines', () => {
    expect(noiseBedPower('tape', 8000, SR)).toBeGreaterThan(10 * noiseBedPower('tape', 200, SR))
    expect(noiseBedPower('vinyl', 42, SR)).toBeGreaterThan(noiseBedPower('vinyl', 5000, SR))
    expect(noiseBedPower('room', 60, SR)).toBeGreaterThan(100 * noiseBedPower('room', 5000, SR))
    expect(noiseBedPower('air', 9000, SR)).toBeGreaterThan(50 * noiseBedPower('air', 500, SR))
    const lines = humLines(0)
    expect(lines).toHaveLength(40)
    // Tone up brings the buzz out over the body; down takes it away.
    expect(humLines(1)[9]).toBeGreaterThan(4 * lines[9])
    expect(humLines(-1)[9]).toBe(0)
  })

  it('leaves the level where it was as Tone turns', () => {
    for (let bed = 0; bed < 7; bed++)
      expect(noiseTonePower(bed, 0, 1000, SR), `bed ${bed}`).toBeCloseTo(1, 6)
    // Darkened, tape hiss loses its top and the rest comes up to make good.
    expect(noiseTonePower(0, -1, 12000, SR)).toBeLessThan(noiseTonePower(0, -1, 200, SR) / 10)
    expect(noiseTonePower(0, -1, 200, SR)).toBeGreaterThan(1)
  })

  it('moves Level from the floor, decibel for decibel', () => {
    const size = displaySize(WEAR_FACES['noise-floor'].display)
    const level = handleOf('noise-floor', 'level', { level: -42 })
    const scale = (size.height - 8 - 26 - 4) / 110
    expect(level.drag(level.x, level.y - 10 * scale).level).toBeCloseTo(-32, 3)
    expect(level.drag(level.x, level.y + 10 * scale).level).toBeCloseTo(-52, 3)
  })
})
