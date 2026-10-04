// The truth of the wear family's displays: each curve, floor and step against
// the numbers of the device's own DSP (the constants and comments of its
// `.h`), and each handle against what it stands for.

import { describe, expect, it } from 'vitest'

import { type DisplayHandle, type DisplayView } from '../components/plate-display'
import {
  Bins,
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
import { displaySize, stockDescriptors, viewOf } from './display-harness'

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

  it('reads a tone at its level in the spectrum of what goes in', () => {
    const bins = new Bins(512)
    const wave = new Float32Array(2048)
    // On bin 32 of 512 at 48 kHz: 3 kHz, at half of full scale.
    for (let i = 0; i < wave.length; i++) wave[i] = 0.5 * Math.sin((2 * Math.PI * 32 * i) / 512)
    bins.read(wave, 0)
    expect(bins.db[32]).toBeCloseTo(-6.02, 1)
    expect(bins.at(3000, SR)).toBeCloseTo(-6.02, 1)
    expect(bins.db[40]).toBeLessThan(-80)
    // It falls 30 dB a second once the tone has gone.
    bins.read(new Float32Array(2048), 0.5)
    expect(bins.db[32]).toBeCloseTo(-21.02, 1)
    expect(loudestBin(bins.db, SR / 512, 2500, 3500)).toBeCloseTo(-21.02, 1)
    // Narrower than a bin: a reading between two of them.
    expect(loudestBin(bins.db, SR / 512, 3040, 3050)).toBeCloseTo(
      (bins.db[32] + bins.db[33]) / 2,
      0,
    )
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

  it('folds stereo to mono from the top down as far as Loss and Stereo say', () => {
    expect(codecMonoHz(0.5, 1)).toBeCloseTo(20000, -1)
    expect(codecMonoHz(0, 0)).toBeCloseTo(20000, -1)
    expect(codecMonoHz(1, 0)).toBeCloseTo(5, 1)
    expect(codecMonoHz(0.5, 0.7)).toBeCloseTo(20000 * Math.pow(2, -11.9658 * 0.15), -1)
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
