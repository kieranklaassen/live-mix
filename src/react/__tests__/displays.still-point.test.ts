// The truth of Still Point's display. Its figures against the header, its own
// working of the sweep from the notes (`stillPointReplay`) against what the
// compiled device reports and sounds at 48 kHz, the drawing against those
// figures, and a timed draw: two seconds at thirty frames a second with the
// sound and a reading pulsing at the beat, in which nothing drawn may turn
// more than six times in any second.

import { describe, expect, it } from 'vitest'

import { STILL_POINT_PARAMS } from '../../dsp/devices/still-point.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { INK, PLAIN_COLOURS } from '../components/display-kit'
import {
  STILL_POINT_FACES,
  STILL_POINT_FAINTEST,
  STILL_POINT_LEVEL_SECONDS,
  STILL_POINT_LIMIT_SECONDS,
  STILL_POINT_STEP_DB,
  STILL_POINT_TURN_SECONDS,
  stillPointAttack,
  stillPointBeat,
  stillPointFade,
  stillPointGlide,
  stillPointHz,
  stillPointKey,
  stillPointLayout,
  stillPointLevel,
  stillPointLevelStart,
  stillPointMeetings,
  stillPointPhase,
  stillPointPitch,
  stillPointRate,
  stillPointReplay,
  stillPointRings,
  stillPointSeconds,
  stillPointSpan,
  stillPointTriangle,
  stillPointUntil,
  type StillPointSetting,
} from '../components/displays/still-point'
import { type DisplayNote, type DisplaySignal } from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  drawnPaths,
  stockDescriptors,
  testLevel,
  type DrawnPath,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const BLOCK = 128
const display = STILL_POINT_FACES['still-point'].display
const params = stockDescriptors().get('still-point')?.params ?? {}
const { accent, ink, plate } = PLAIN_COLOURS
const size = displaySize(display)

type Values = Readonly<Record<string, number>>

/** The device's defaults, as the replay reads them. */
const settingOf = (values: Values = {}): StillPointSetting => ({
  time: values.time ?? STILL_POINT_PARAMS.time.default,
  reach: values.reach ?? STILL_POINT_PARAMS.reach.default,
  attack: values.attack ?? STILL_POINT_PARAMS.attack.default,
  release: values.release ?? STILL_POINT_PARAMS.release.default,
})

const hzOfKey = (key: number): number => 440 * Math.pow(2, (key - 69) / 12)

// --- The device, played -----------------------------------------------------------

interface KeyEvent {
  /** Seconds from the start; a whole number of blocks. */
  at: number
  key: number
  /** A gain strikes the key, null lets it go. */
  gain: number | null
}

interface Reading {
  /** Seconds from the start, at the end of a block. */
  at: number
  sine: number
  low: number
  high: number
  gate: number
}

interface Played {
  left: Float32Array
  right: Float32Array
  readings: Reading[]
}

async function deviceAt(values: Values): Promise<WasmDeviceHarness> {
  const device = await loadWasmDevice('still-point', RATE)
  for (const [name, value] of Object.entries(values))
    device.set(STILL_POINT_PARAMS[name as keyof typeof STILL_POINT_PARAMS], value)
  return device
}

/** Plays keys on the device for `seconds` and keeps its sound and what it reports after every block. */
async function play(values: Values, events: readonly KeyEvent[], seconds: number): Promise<Played> {
  const device = await deviceAt(values)
  const { device_note_on: on, device_note_off: off, device_meter: meter } = device.device
  if (!on || !off || !meter) throw new Error('the device takes no notes or reports no readings')
  const total = Math.round(seconds * RATE)
  const left = new Float32Array(total)
  const right = new Float32Array(total)
  const readings: Reading[] = []
  const due = [...events].sort((a, b) => a.at - b.at)
  let next = 0
  for (let done = 0; done < total; done += BLOCK) {
    while (next < due.length && Math.round(due[next].at * RATE) <= done) {
      const event = due[next++]
      if (event.gain === null) off(event.key)
      else on(event.key, hzOfKey(event.key), event.gain)
    }
    const frames = Math.min(BLOCK, total - done)
    device.device.device_process(frames)
    left.set(device.view(device.device.device_out_left(), frames), done)
    right.set(device.view(device.device.device_out_right(), frames), done)
    readings.push({
      at: (done + frames) / RATE,
      sine: meter(0),
      low: meter(1),
      high: meter(2),
      gate: meter(3),
    })
  }
  return { left, right, readings }
}

/** The reading taken at the end of the block that ends at `seconds`. */
function readingAt(played: Played, seconds: number): Reading {
  const index = Math.round((seconds * RATE) / BLOCK) - 1
  return played.readings[Math.max(0, Math.min(played.readings.length - 1, index))]
}

/** The notes as a display is handed them `now` seconds into a list of key events. */
function notesAt(events: readonly KeyEvent[], now: number): DisplayNote[] {
  const notes: DisplayNote[] = []
  for (const event of [...events].sort((a, b) => a.at - b.at)) {
    if (event.at > now) continue
    if (event.gain === null) {
      for (const note of notes)
        if (note.id === event.key && note.released === null) note.released = now - event.at
    } else {
      notes.push({
        id: event.key,
        frequency: hzOfKey(event.key),
        gain: event.gain,
        age: now - event.at,
        released: null,
      })
    }
  }
  return notes
}

/** The level of the sound in steps of a millisecond: the root mean square of the 20 ms about each. */
function envelope(sound: Float32Array): Float32Array {
  const step = RATE / 1000
  const half = 10 * step
  const squares = new Float64Array(sound.length + 1)
  for (let i = 0; i < sound.length; i++) squares[i + 1] = squares[i] + sound[i] * sound[i]
  const out = new Float32Array(Math.floor(sound.length / step))
  for (let ms = 0; ms < out.length; ms++) {
    const from = Math.max(0, ms * step - half)
    const to = Math.min(sound.length, ms * step + half)
    out[ms] = Math.sqrt((squares[to] - squares[from]) / Math.max(1, to - from))
  }
  return out
}

/**
 * Where a beat falls still, in seconds. The beat slows down into a meeting
 * and speeds up out of it at the same pace, so the level about the meeting is
 * its own mirror image and nowhere else is: the moment between `from` and
 * `to` about which the level `reach` seconds either way mirrors best.
 */
function stillAt(level: Float32Array, from: number, to: number, reach = 2.5): number {
  const span = Math.round(reach * 1000)
  let best = Infinity
  let at = from
  for (let ms = Math.round(from * 1000); ms <= Math.round(to * 1000); ms++) {
    let apart = 0
    for (let d = 1; d <= span; d++) {
      const gap = level[ms + d] - level[ms - d]
      apart += gap * gap
    }
    if (apart < best) [best, at] = [apart, ms / 1000]
  }
  return at
}

/** The moments the level is lowest between two swells, in seconds, from `from` to `to`. */
function nulls(level: Float32Array, from: number, to: number): number[] {
  let most = 0
  for (let ms = Math.round(from * 1000); ms < Math.round(to * 1000); ms++)
    most = Math.max(most, level[ms])
  const found: number[] = []
  let lowest = -1
  for (let ms = Math.round(from * 1000); ms < Math.round(to * 1000); ms++) {
    // A dip begins under three tenths of the most and ends over six: the ripple of a short window does not end it.
    if (level[ms] < 0.3 * most || (lowest >= 0 && level[ms] < 0.6 * most)) {
      if (lowest < 0 || level[ms] < level[lowest]) lowest = ms
    } else if (lowest >= 0) {
      found.push(lowest / 1000)
      lowest = -1
    }
  }
  return found
}

// --- The figures, against the header ------------------------------------------------

describe('the figures of Still Point', () => {
  it('are the header’s: a triangle between the limits, linear in pitch, a pass in Time', () => {
    // `triangle`: up to the turn at a half, and down again.
    expect(stillPointTriangle(0)).toBe(0)
    expect(stillPointTriangle(0.25)).toBe(0.5)
    expect(stillPointTriangle(0.5)).toBe(1)
    expect(stillPointTriangle(0.75)).toBe(0.5)
    // `control`: the clock turns 0.5 / Time times a second, so the upper limit is reached after Time.
    expect(stillPointPhase(12, 12)).toBeCloseTo(0.5, 12)
    expect(stillPointPhase(6, 12)).toBeCloseTo(0.25, 12)
    expect(stillPointPhase(30, 12)).toBeCloseTo(0.25, 12)
    // `pitch_at`.
    expect(stillPointPitch(0, 56.5, 57.5)).toBe(56.5)
    expect(stillPointPitch(0.25, 56.5, 57.5)).toBeCloseTo(57, 12)
    expect(stillPointPitch(0.5, 56.5, 57.5)).toBe(57.5)
    // `pitch_of` and `sine_increment_at`: 69 is the A at 440 Hz.
    expect(stillPointKey(440)).toBeCloseTo(69, 12)
    expect(stillPointKey(220)).toBeCloseTo(57, 12)
    expect(stillPointHz(57)).toBeCloseTo(220, 9)
  })

  it('glide the limits as two one poles of 0.4 s in a row, from no slope', () => {
    // `kLimitSeconds`, and what the header says a step becomes: 1 - (1 + t/T) e^(-t/T).
    expect(STILL_POINT_LIMIT_SECONDS).toBe(0.4)
    expect(stillPointGlide(0)).toBe(0)
    expect(stillPointGlide(0.4)).toBeCloseTo(1 - 2 / Math.E, 12)
    expect(stillPointGlide(0.8)).toBeCloseTo(1 - 3 * Math.exp(-2), 12)
    // No slope at the start: a hundredth of the time gives a ten-thousandth of the way, not a hundredth.
    expect(stillPointGlide(0.004)).toBeLessThan(1e-4)
    expect(stillPointGlide(4)).toBeGreaterThan(0.999)
  })

  it('fade a key in and out as `kit::Adsr` does', () => {
    // The attack aims at 1.3 and is cut off at full, where it arrives in the set time.
    expect(stillPointAttack(0, 1)).toBe(0)
    expect(stillPointAttack(1, 1)).toBeCloseTo(1, 9)
    expect(stillPointAttack(5, 1)).toBe(1)
    expect(stillPointAttack(0.5, 1)).toBeCloseTo(1.3 * (1 - Math.sqrt(0.3 / 1.3)), 12)
    // The release covers 60 dB in the set time, and the voice ends at 1e-5 of full.
    expect(stillPointFade(3, 3)).toBeCloseTo(1e-3, 9)
    expect(stillPointFade(0, 3)).toBe(1)
    expect(stillPointRings(1, 3)).toBeCloseTo(5, 6)
    expect(stillPointRings(1e-6, 3)).toBe(0)
  })

  it('find the meetings in a turn, and the wait for the next', () => {
    // One key in the middle of its limits: met a quarter and three quarters of the way through the turn.
    expect(stillPointMeetings(57, 56.5, 57.5, 12)).toEqual([6, 18])
    expect(stillPointMeetings(58, 56.5, 57.5, 12)).toBeNull()
    expect(stillPointUntil(57, 0, 56.5, 57.5, 12)).toBeCloseTo(6, 12)
    expect(stillPointUntil(57, 0.25, 56.5, 57.5, 12)).toBeCloseTo(0, 12)
    expect(stillPointUntil(57, 0.5, 56.5, 57.5, 12)).toBeCloseTo(6, 12)
    expect(stillPointUntil(57, 0.9, 56.5, 57.5, 12)).toBeCloseTo(2.4 + 6, 9)
    expect(stillPointUntil(60, 0.9, 56.5, 57.5, 12)).toBe(Infinity)
    // The beat is the difference of the two frequencies.
    expect(stillPointBeat(57, 57)).toBe(0)
    expect(stillPointBeat(69, 57)).toBeCloseTo(220, 9)
    expect(stillPointBeat(56, 57)).toBeCloseTo(220 - 220 / Math.pow(2, 1 / 12), 9)
  })
})

// --- The sweep worked out from the notes, against the device ------------------------

describe('the sweep of Still Point, against the device', () => {
  const A3 = 57

  it('follows one key through a whole turn as the device reports it', async () => {
    const events: KeyEvent[] = [{ at: 0, key: A3, gain: 0.8 }]
    const played = await play({}, events, 26)
    const set = settingOf()
    let moved = 0
    for (const seconds of [
      0.5, 1, 3, 5.9, 6, 6.1, 9, 11.9, 12, 12.1, 15, 18, 21, 23.9, 24.2, 25.5,
    ]) {
      const reading = readingAt(played, seconds)
      const run = stillPointReplay(notesAt(events, reading.at), set)
      expect(run, `a run at ${seconds} s`).not.toBeNull()
      if (!run) continue
      // The limits stand Reach under and over the key.
      expect(reading.low, `lower limit at ${seconds} s`).toBeCloseTo(A3 - 0.5, 4)
      expect(reading.high, `upper limit at ${seconds} s`).toBeCloseTo(A3 + 0.5, 4)
      expect(run.low).toBeCloseTo(reading.low, 4)
      expect(run.high).toBeCloseTo(reading.high, 4)
      // A semitone in twelve seconds: a block's worth of time is a ten-thousandth of a semitone.
      const pitch = stillPointPitch(run.phase, run.low, run.high)
      expect(Math.abs(pitch - reading.sine), `the sine at ${seconds} s`).toBeLessThan(5e-4)
      moved = Math.max(moved, Math.abs(reading.sine - (A3 - 0.5)))
    }
    // It did go all the way: up to the upper limit and back.
    expect(moved).toBeGreaterThan(0.99)
    expect(readingAt(played, 12).sine).toBeCloseTo(A3 + 0.5, 2)
    expect(readingAt(played, 24).sine).toBeCloseTo(A3 - 0.5, 2)
  })

  it('follows other settings too: a long pass with a far reach, a quick one close by', async () => {
    for (const values of [
      { time: 60, reach: 2 },
      { time: 4, reach: 0.1 },
      { time: 120, reach: 12 },
    ]) {
      const events: KeyEvent[] = [
        { at: 0, key: 50, gain: 0.8 },
        { at: 0, key: A3, gain: 0.6 },
      ]
      const played = await play(values, events, 10)
      const set = settingOf(values)
      for (const seconds of [0.2, 2, 4, 5, 7.5, 9.9]) {
        const reading = readingAt(played, seconds)
        const run = stillPointReplay(notesAt(events, reading.at), set)
        expect(run).not.toBeNull()
        if (!run) continue
        expect(run.low).toBeCloseTo(reading.low, 3)
        expect(run.high).toBeCloseTo(reading.high, 3)
        expect(reading.low).toBeCloseTo(50 - values.reach, 3)
        expect(reading.high).toBeCloseTo(A3 + values.reach, 3)
        const pitch = stillPointPitch(run.phase, run.low, run.high)
        const pace = (reading.high - reading.low) / values.time
        expect(
          Math.abs(pitch - reading.sine),
          `the sine at ${seconds} s of ${JSON.stringify(values)}`,
        ).toBeLessThan(1e-3 + 0.004 * pace)
      }
    }
  })

  it('says the meeting where the beat of the sound falls still', async () => {
    // A pure key and a sine as loud, both ears alike: the sound is the beat and nothing else.
    const values = { level: 1, warmth: 0, attack: 0.05 }
    const events: KeyEvent[] = [{ at: 0, key: A3, gain: 0.8 }]
    const played = await play(values, events, 22)
    const run = stillPointReplay(notesAt(events, 1), settingOf(values))
    expect(run).not.toBeNull()
    if (!run) return
    const meetings = stillPointMeetings(A3, run.low, run.high, 12)
    expect(meetings).toEqual([6, 18])
    const level = envelope(played.left)
    // Going up, and coming down: each within 50 ms of where the display's ring stands.
    expect(Math.abs(stillAt(level, 3, 9) - 6)).toBeLessThan(0.05)
    expect(Math.abs(stillAt(level, 15, 19.4) - 18)).toBeLessThan(0.05)
    // The same on a low key with a slow pass and a short reach, where a beat is seconds long.
    const slow = { ...values, time: 30, reach: 0.3 }
    const low: KeyEvent[] = [{ at: 0, key: 38, gain: 0.8 }]
    const deep = await play(slow, low, 30)
    const deepRun = stillPointReplay(notesAt(low, 1), settingOf(slow))
    const meeting = deepRun ? stillPointMeetings(38, deepRun.low, deepRun.high, 30) : null
    expect(meeting?.[0]).toBeCloseTo(15, 9)
    expect(Math.abs(stillAt(envelope(deep.left), 8, 22, 6) - 15)).toBeLessThan(0.1)
  })

  it('says the beat at the rate the sound beats at', async () => {
    const values = { level: 1, warmth: 0, attack: 0.05 }
    const events: KeyEvent[] = [{ at: 0, key: A3, gain: 0.8 }]
    const played = await play(values, events, 12)
    const set = settingOf(values)
    const level = envelope(played.left)
    const quiet = nulls(level, 1, 5.2)
    expect(quiet.length).toBeGreaterThan(6)
    for (let i = 1; i < quiet.length; i++) {
      // Between two nulls the sound beats once, and its pace falls evenly: the rate is the one half way.
      const middle = 0.5 * (quiet[i - 1] + quiet[i])
      const heard = 1 / (quiet[i] - quiet[i - 1])
      const run = stillPointReplay(notesAt(events, middle), set)
      expect(run).not.toBeNull()
      if (!run) continue
      const said = stillPointBeat(stillPointPitch(run.phase, run.low, run.high), A3)
      expect(Math.abs(said / heard - 1), `the beat at ${middle.toFixed(2)} s`).toBeLessThan(0.04)
    }
    // And it slows on the way to the meeting.
    expect(quiet[quiet.length - 1] - quiet[quiet.length - 2]).toBeGreaterThan(
      2 * (quiet[1] - quiet[0]),
    )
  })

  it('glides the limits to a key added in mid sweep, and back when it is let go', async () => {
    const events: KeyEvent[] = [
      { at: 0, key: 50, gain: 0.8 },
      { at: 0, key: A3, gain: 0.8 },
      { at: 3, key: 65, gain: 0.8 },
      { at: 6, key: 65, gain: null },
    ]
    const played = await play({}, events, 9)
    const set = settingOf()
    for (const seconds of [1, 2.9, 3.1, 3.2, 3.4, 3.8, 4.6, 5.9, 6.1, 6.4, 7, 8.9]) {
      const reading = readingAt(played, seconds)
      const run = stillPointReplay(notesAt(events, reading.at), set)
      expect(run).not.toBeNull()
      if (!run) continue
      expect(Math.abs(run.high - reading.high), `upper limit at ${seconds} s`).toBeLessThan(0.02)
      expect(Math.abs(run.low - reading.low), `lower limit at ${seconds} s`).toBeLessThan(1e-3)
      const pitch = stillPointPitch(run.phase, run.low, run.high)
      expect(Math.abs(pitch - reading.sine), `the sine at ${seconds} s`).toBeLessThan(0.02)
    }
    // The law itself: eight semitones to go, by the step of two poles.
    for (const after of [0.2, 0.4, 0.8, 1.6]) {
      const gone = (readingAt(played, 3 + after).high - (A3 + 0.5)) / 8
      expect(Math.abs(gone - stillPointGlide(after)), `${after} s after the key`).toBeLessThan(2e-3)
    }
    expect(readingAt(played, 5.9).high).toBeCloseTo(65.5, 1)
    expect(readingAt(played, 8.9).high).toBeCloseTo(A3 + 0.5, 1)
  })

  it('keeps the limits where they stood when every key is let go, until the voices end', async () => {
    const values = { release: 1, attack: 0.05 }
    const events: KeyEvent[] = [
      { at: 0, key: 50, gain: 0.8 },
      { at: 0, key: A3, gain: 0.5 },
      { at: 2, key: 50, gain: null },
      { at: 2, key: A3, gain: null },
    ]
    const played = await play(values, events, 5)
    const set = settingOf(values)
    for (const seconds of [1.9, 2.1, 2.5, 3, 3.5]) {
      const reading = readingAt(played, seconds)
      const run = stillPointReplay(notesAt(events, reading.at), set)
      expect(run, `sounding at ${seconds} s`).not.toBeNull()
      if (!run) continue
      expect(reading.gate, `the gate at ${seconds} s`).toBeGreaterThan(0)
      expect(run.low).toBeCloseTo(reading.low, 3)
      expect(run.high).toBeCloseTo(reading.high, 3)
      expect(reading.low).toBeCloseTo(49.5, 3)
      expect(reading.high).toBeCloseTo(57.5, 3)
      // The sine goes on while they ring.
      const pitch = stillPointPitch(run.phase, run.low, run.high)
      expect(Math.abs(pitch - reading.sine)).toBeLessThan(2e-3)
    }
    // A Release after the keys were let go the loudest is 60 dB down, as the display fades its line.
    expect(readingAt(played, 3).gate / 0.8).toBeCloseTo(stillPointFade(1, 1), 4)
    expect(readingAt(played, 2.5).gate / 0.8).toBeCloseTo(stillPointFade(0.5, 1), 3)
    // The voices end when the replay says they do: 1e-5 of full, five thirds of a Release.
    const ends = 2 + stillPointRings(1, 1)
    expect(ends).toBeCloseTo(3.667, 3)
    expect(readingAt(played, ends - 0.05).gate).toBeGreaterThan(0)
    expect(readingAt(played, ends + 0.05).gate).toBe(0)
    expect(stillPointReplay(notesAt(events, ends - 0.05), set)).not.toBeNull()
    expect(stillPointReplay(notesAt(events, ends + 0.05), set)).toBeNull()
  })

  it('begins the sweep again with a key that arrives out of silence, and not with one that joins', async () => {
    const values = { release: 0.2, attack: 0.05 }
    const events: KeyEvent[] = [
      { at: 0, key: 50, gain: 0.8 },
      { at: 2, key: 62, gain: 0.8 },
      { at: 4, key: 50, gain: null },
      { at: 4, key: 62, gain: null },
      { at: 6, key: 69, gain: 0.8 },
    ]
    const played = await play(values, events, 9)
    const set = settingOf(values)
    // The second key joined a sweep under way: the clock was not set back.
    const joined = stillPointReplay(notesAt(events, 3.5), set)
    expect(joined?.since).toBeCloseTo(3.5, 9)
    expect(Math.abs((joined?.high ?? 0) - readingAt(played, 3.5).high)).toBeLessThan(0.05)
    // The third found silence: the sweep is 2.5 s old at 8.5 s, from the lower limit of the new key.
    const fresh = stillPointReplay(notesAt(events, 8.5), set)
    expect(fresh?.since).toBeCloseTo(2.5, 9)
    const reading = readingAt(played, 8.5)
    expect(reading.low).toBeCloseTo(68.5, 4)
    expect(reading.high).toBeCloseTo(69.5, 4)
    expect(fresh?.low).toBeCloseTo(reading.low, 4)
    expect(fresh?.high).toBeCloseTo(reading.high, 4)
    const pitch = fresh ? stillPointPitch(fresh.phase, fresh.low, fresh.high) : 0
    expect(Math.abs(pitch - reading.sine)).toBeLessThan(5e-4)
    expect(reading.sine).toBeCloseTo(68.5 + 2.5 / 12, 3)
  })

  it('fades a key in as the gate rises: the loudest key’s attack times its gain', async () => {
    const values = { attack: 2 }
    const played = await play(values, [{ at: 0, key: A3, gain: 0.8 }], 4)
    for (const seconds of [0.25, 0.5, 1, 1.5, 2, 3])
      expect(readingAt(played, seconds).gate, `the gate at ${seconds} s`).toBeCloseTo(
        0.8 * stillPointAttack(seconds, 2),
        3,
      )
  })
})

// --- The drawing, against the figures ------------------------------------------------

interface Disc {
  x: number
  y: number
  radius: number
  colour: string
}

interface Patch {
  x: number
  y: number
  w: number
  h: number
  colour: string
  alpha: number
}

/** Every filled disc and every filled rectangle of a drawing, with the colour it was filled in. */
function fills(drawn: RecordingContext): { discs: Disc[]; patches: Patch[] } {
  const discs: Disc[] = []
  const patches: Patch[] = []
  let colour = ''
  let alpha = 1
  let arc: number[] | null = null
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = call.args[0] as number
    else if (call.name === 'beginPath') arc = null
    else if (call.name === 'arc') arc = call.args as number[]
    else if (call.name === 'fill' && arc)
      discs.push({ x: arc[0], y: arc[1], radius: arc[2], colour })
    else if (call.name === 'fillRect') {
      const [x, y, w, h] = call.args as number[]
      patches.push({ x, y, w, h, colour, alpha })
    }
  }
  return { discs, patches }
}

const level = (path: DrawnPath): boolean =>
  path.points.length === 2 && path.points[0][1] === path.points[1][1]
const upright = (path: DrawnPath): boolean =>
  path.points.length === 2 && path.points[0][0] === path.points[1][0]
const crisp = (value: number): number => Math.floor(value) + 0.5

/** A sound as loud as `rms` coming out, as the plate's tap hands it to a display. */
function soundOf(rms: number): DisplaySignal {
  return {
    input: null,
    output: testLevel(rms * Math.SQRT2),
    spectrum: null,
    binHz: RATE / 2048,
    left: null,
    right: null,
  }
}

const held = (key: number, age: number, gain = 0.8): DisplayNote => ({
  id: key,
  frequency: hzOfKey(key),
  gain,
  age,
  released: null,
})

const NO_READINGS = { sine: 0, low: 0, high: 0, gate: 0 }

describe('the drawing of Still Point', () => {
  const lay = stillPointLayout(size)
  const { plot } = lay
  const xOf = (seconds: number, time: number): number => plot.x + (seconds / (2 * time)) * plot.w
  const yIn = (span: { bottom: number; top: number }, pitch: number): number =>
    plot.y + ((span.top - pitch) / (span.top - span.bottom)) * plot.h

  it('shows a small reach as small: at least two semitones either side of the middle', () => {
    const narrow = stillPointSpan(56.9, 57.1, [57])
    expect(narrow.top - narrow.bottom).toBeCloseTo(4 * 1.12, 9)
    const wide = stillPointSpan(38, 77, [50, 65])
    expect(wide.bottom).toBeLessThan(38)
    expect(wide.top).toBeGreaterThan(77)
    // A key outside the limits is still on the picture.
    expect(stillPointSpan(56.5, 57.5, [72]).top).toBeGreaterThan(72)
  })

  it('at rest draws what the knobs set, with nothing lit and no mark', () => {
    const drawn = drawDisplay(display, params, { meters: NO_READINGS })
    expect(drawn.words()).toEqual(['12 s a pass', '0.5 st past'])
    const paths = drawnPaths(drawn)
    expect(paths.filter((path) => path.colour === accent)).toEqual([])
    const { discs, patches } = fills(drawn)
    expect(discs.filter((disc) => disc.colour === accent)).toEqual([])
    expect(patches.filter((patch) => patch.colour === accent)).toEqual([])
    // The limits, Reach either side of the key, dashed across the whole turn.
    const span = stillPointSpan(68.5, 69.5, [])
    const limits = paths.filter(
      (path) => path.kind === 'stroke' && level(path) && path.alpha === INK.back,
    )
    expect(limits.map((path) => path.points[0][1])).toEqual([
      crisp(yIn(span, 69.5)),
      crisp(yIn(span, 68.5)),
    ])
    for (const limit of limits) {
      expect(limit.points[0][0]).toBe(plot.x)
      expect(limit.points[1][0]).toBe(plot.x + plot.w)
    }
    // The path: from the lower limit up to the upper at the middle and down again.
    const [path] = paths.filter((each) => each.kind === 'stroke' && each.points.length === 3)
    expect(path.colour).toBe(ink)
    expect(path.points).toEqual([
      [plot.x, yIn(span, 68.5)],
      [plot.x + plot.w / 2, yIn(span, 69.5)],
      [plot.x + plot.w, yIn(span, 68.5)],
    ])
    // A ring where the sine would meet the key, on the way up and on the way down.
    const rings = discs.filter((disc) => disc.colour === plate)
    expect(rings.map((ring) => [ring.x, ring.y])).toEqual([
      [xOf(6, 12), yIn(span, 69)],
      [xOf(18, 12), yIn(span, 69)],
    ])
    // The words follow Time and Reach.
    expect(
      drawDisplay(display, params, {
        meters: NO_READINGS,
        values: { time: 120, reach: 12 },
      }).words(),
    ).toEqual(['120 s a pass', '12 st past'])
    expect(
      drawDisplay(display, params, {
        meters: NO_READINGS,
        values: { time: 4, reach: 0.1 },
      }).words(),
    ).toEqual(['4.0 s a pass', '0.1 st past'])
  })

  it('draws the device’s readings while it sounds: limits, key, rings, the sine now and what comes next', () => {
    const meters = { sine: 56.75, low: 56.5, high: 57.5, gate: 0.8 }
    const drawn = drawDisplay(display, params, {
      meters,
      notes: [held(57, 3)],
      signal: soundOf(0.1),
    })
    const span = stillPointSpan(56.5, 57.5, [57])
    const paths = drawnPaths(drawn)
    const limits = paths.filter(
      (path) => path.kind === 'stroke' && level(path) && path.alpha === INK.back,
    )
    expect(limits.map((path) => path.points[0][1])).toEqual([
      crisp(yIn(span, 57.5)),
      crisp(yIn(span, 56.5)),
    ])
    // The held key is lit from side to side, at its own pitch.
    const keys = paths.filter((path) => path.kind === 'stroke' && path.width === 1.25)
    expect(keys).toHaveLength(1)
    expect(keys[0].colour).toBe(accent)
    expect(keys[0].alpha).toBe(1)
    expect(keys[0].points).toEqual([
      [plot.x, yIn(span, 57)],
      [plot.x + plot.w, yIn(span, 57)],
    ])
    const { discs } = fills(drawn)
    expect(discs.filter((disc) => disc.colour === plate).map((ring) => [ring.x, ring.y])).toEqual([
      [xOf(6, 12), yIn(span, 57)],
      [xOf(18, 12), yIn(span, 57)],
    ])
    // The sine now: a quarter of the way up, three seconds into the turn, as large as Level makes it.
    const [mark] = discs.filter((disc) => disc.colour === accent)
    expect(mark.x).toBeCloseTo(xOf(3, 12), 9)
    expect(mark.y).toBeCloseTo(yIn(span, 56.75), 9)
    expect(mark.radius).toBe(2.5)
    const [line] = paths.filter((path) => path.colour === accent && upright(path))
    expect(line.points[0][0]).toBe(crisp(xOf(3, 12)))
    // Three seconds to the meeting, and the beat as the difference of the two frequencies says it.
    const beat = stillPointBeat(56.75, 57)
    expect(beat).toBeCloseTo(3.154, 3)
    expect(drawn.words()).toEqual(['A3', 'A3 in 3.0 s', `beat ${stillPointRate(beat)}`])
    expect(stillPointRate(beat)).toBe('3.2 Hz')
    expect(stillPointRate(41.3)).toBe('41 Hz')
    expect(stillPointSeconds(41.3)).toBe('41 s')
    // Level moves the mark's size and nothing else.
    const loud = drawDisplay(display, params, {
      meters,
      notes: [held(57, 3)],
      values: { level: 1 },
    })
    expect(fills(loud).discs.find((disc) => disc.colour === accent)?.radius).toBe(3.5)
  })

  it('draws from the notes alone until the first reading comes, and the same picture', () => {
    const notes = [held(57, 3)]
    const read = drawDisplay(display, params, {
      meters: { sine: 56.75, low: 56.5, high: 57.5, gate: 0.8 },
      notes,
    })
    const worked = drawDisplay(display, params, { meters: NO_READINGS, notes })
    expect(worked.print()).toBe(read.print())
    // Switched off it shows the knobs and no sweep.
    const off = drawDisplay(display, params, { meters: NO_READINGS, notes, powered: false })
    expect(off.words()).toEqual(['12 s a pass', '0.5 st past'])
  })

  it('tells the way up from the way down by the readings', () => {
    const state: unknown = display.init?.()
    const draw = (n: number, sine: number): Disc | undefined =>
      fills(
        drawDisplay(display, params, {
          state,
          now: 10 + n / 30,
          dt: n === 0 ? 0 : 1 / 30,
          meters: { sine, low: 56.5, high: 57.5, gate: 0.8 },
          notes: [held(57, 11.9 + n / 30)],
        }),
      ).discs.find((disc) => disc.colour === accent)
    const middle = plot.x + plot.w / 2
    // Rising to the turn: left of the middle. Falling from it: right of the middle, as far past as it was short.
    const rising = [57.47, 57.48, 57.49, 57.5].map((sine, n) => draw(n, sine))
    for (const mark of rising) expect(mark?.x).toBeLessThanOrEqual(middle)
    const falling = [57.49, 57.48, 57.47].map((sine, n) => draw(4 + n, sine))
    for (const mark of falling) expect(mark?.x).toBeGreaterThan(middle)
    expect((falling[2]?.x ?? 0) - middle).toBeCloseTo(middle - (rising[0]?.x ?? 0), 9)
    // While a limit glides the sine's place moves with it and says nothing of its way: the way is kept.
    const glide = fills(
      drawDisplay(display, params, {
        state,
        now: 10.3,
        dt: 1 / 30,
        meters: { sine: 57.465, low: 55, high: 57.5, gate: 0.8 },
        notes: [held(57, 12.2)],
      }),
    ).discs.find((disc) => disc.colour === accent)
    expect(glide?.x).toBeGreaterThan(middle)
  })

  it('lights a key while it is held, as strong as it has faded in, and leaves one let go in the ink', () => {
    const notes: DisplayNote[] = [
      { id: 60, frequency: hzOfKey(60), gain: 0.8, age: 5, released: 1 },
      { id: 62, frequency: hzOfKey(62), gain: 0.8, age: 9, released: 3.1 },
      held(57, 0.5),
    ]
    const drawn = drawDisplay(display, params, {
      notes,
      meters: { sine: 57, low: 56.5, high: 60.5, gate: 0.5 },
    })
    const keys = drawnPaths(drawn).filter((path) => path.kind === 'stroke' && path.width === 1.25)
    // The key let go more than a Release ago is 60 dB down and not drawn.
    expect(keys).toHaveLength(2)
    const [letGo, lit] = keys
    expect(letGo.colour).toBe(ink)
    expect(letGo.alpha).toBeCloseTo(
      STILL_POINT_FAINTEST + (1 - STILL_POINT_FAINTEST) * stillPointFade(1, 3),
      9,
    )
    expect(lit.colour).toBe(accent)
    expect(lit.alpha).toBeCloseTo(
      STILL_POINT_FAINTEST + (1 - STILL_POINT_FAINTEST) * stillPointAttack(0.5, 1),
      9,
    )
    // Held for longer than the Attack it is fully lit, and stays so: it is lit while held, not in pulses.
    for (const age of [1.5, 2, 7.3, 30]) {
      const later = drawDisplay(display, params, {
        notes: [held(57, age)],
        meters: { sine: 57, low: 56.5, high: 57.5, gate: 0.8 },
      })
      const [line] = drawnPaths(later).filter((path) => path.width === 1.25)
      expect(line.alpha).toBe(1)
    }
  })

  it('fills the foot with the mean level of the last second, not the level of the frame', () => {
    const state: unknown = display.init?.()
    const shares: number[] = []
    for (let n = 0; n < 60; n++) {
      // A sound that beats ten times a second, read thirty times a second: loud, soft, soft.
      const drawn = drawDisplay(display, params, {
        state,
        now: 10 + n / 30,
        dt: n === 0 ? 0 : 1 / 30,
        meters: NO_READINGS,
        signal: soundOf(n % 3 === 0 ? 0.2 : 0.1),
      })
      const [bar] = fills(drawn).patches.filter((patch) => patch.colour === accent)
      expect(bar.y).toBe(lay.foot.y)
      expect(bar.h).toBe(lay.foot.h)
      expect(bar.x + bar.w / 2).toBeCloseTo(lay.foot.x + lay.foot.w / 2, 9)
      shares.push(bar.w / lay.foot.w)
    }
    // The first frame has only itself to go by: 0.2 is 14 dB under full scale on a scale of 60.
    expect(shares[0]).toBeCloseTo(1 - (20 * Math.log10(0.2)) / -60, 9)
    // After a second it stands at the mean power, where the frames themselves swing between 0.67 and 0.77.
    const mean = (0.2 * 0.2 + 2 * 0.1 * 0.1) / 3
    const share = 1 - (10 * Math.log10(mean)) / -60
    expect(share).toBeCloseTo(0.717, 3)
    // It is drawn in steps of half a decibel, so it stands within one step and a little of the mean.
    const step = STILL_POINT_STEP_DB / 60
    for (const shown of shares.slice(30)) expect(Math.abs(shown - share)).toBeLessThan(step + 0.004)
    // And having got there it stays: the frames go on beating and the foot does not move at all.
    expect(new Set(shares.slice(31)).size).toBe(1)
    // With no sound read, and switched off, the foot is empty.
    const silent = drawDisplay(display, params, { state, now: 12, dt: 1 / 30, meters: NO_READINGS })
    expect(fills(silent).patches.filter((patch) => patch.colour === accent)).toEqual([])
    const off = drawDisplay(display, params, {
      state,
      now: 12.1,
      dt: 1 / 30,
      meters: NO_READINGS,
      signal: soundOf(0.2),
      powered: false,
    })
    expect(fills(off).patches.filter((patch) => patch.colour === accent)).toEqual([])
  })

  it('takes a second to empty the foot, and turns it four times a second at the most', () => {
    // Loud for a second, then nothing: half the second later half the power is left, a second later none.
    const fading = stillPointLevelStart()
    const after = new Map<number, number>()
    for (let n = 0; n <= 65; n++) after.set(n, stillPointLevel(fading, n / 30, n < 30 ? 0.3 : 0))
    const full = 1 - (20 * Math.log10(0.3)) / -60
    expect(after.get(29)).toBeCloseTo(full, 9)
    const halfway = 1 - (10 * Math.log10(0.09 * 0.5)) / -60
    expect(Math.abs((after.get(44) ?? 0) - halfway)).toBeLessThan(STILL_POINT_STEP_DB / 60 + 0.002)
    expect(after.get(30 + Math.round(30 * STILL_POINT_LEVEL_SECONDS) + 1)).toBe(0)
    // No reading at all empties it at once.
    expect(stillPointLevel(fading, 3, 0.3)).toBeGreaterThan(0)
    expect(stillPointLevel(fading, 3.03, null)).toBe(0)
    expect(fading.times).toEqual([])

    // On for a fifth of a second and off for a fifth: the mean of a second turns every fifth of a second.
    const level = stillPointLevelStart()
    const plain: number[] = []
    const shown: number[] = []
    for (let n = 0; n < 240; n++) {
      shown.push(stillPointLevel(level, n / 30, n % 12 < 6 ? 0.3 : 0.003))
      plain.push(level.powers.reduce((sum, power) => sum + power, 0) / level.powers.length)
    }
    const turnsOf = (series: readonly number[]): number[] => {
      const at: number[] = []
      let way = 0
      for (let n = 31; n < series.length; n++) {
        const now = Math.sign(series[n] - series[n - 1])
        if (now === 0) continue
        if (way !== 0 && now !== way) at.push(n / 30)
        way = now
      }
      return at
    }
    const wanted = turnsOf(plain)
    const made = turnsOf(shown)
    const gaps = (at: readonly number[]): number[] => at.slice(1).map((time, i) => time - at[i])
    expect(Math.max(...gaps(wanted))).toBeLessThan(STILL_POINT_TURN_SECONDS)
    expect(made.length).toBeGreaterThan(8)
    expect(Math.min(...gaps(made))).toBeGreaterThanOrEqual(STILL_POINT_TURN_SECONDS - 1e-9)
  })
})

// --- The timed draw -----------------------------------------------------------------

type Drawn = number | string

/**
 * Everything a run of frames handed the canvas, as one series for each thing
 * drawn: the nth call of a name and which of its arguments. A figure written
 * in words is a series of its own, and the words without their figures
 * another, so a number that flickers in a line of text is caught as well as
 * a bar that does.
 */
function seriesOf(frames: readonly RecordingContext[]): Map<string, (Drawn | undefined)[]> {
  const all = new Map<string, (Drawn | undefined)[]>()
  frames.forEach((drawn, n) => {
    const seen = new Map<string, number>()
    for (const call of drawn.calls) {
      const nth = seen.get(call.name) ?? 0
      seen.set(call.name, nth + 1)
      const parts: Drawn[] = []
      for (const arg of call.args) {
        if (typeof arg === 'number') parts.push(arg)
        else if (Array.isArray(arg)) {
          for (const each of arg as unknown[]) if (typeof each === 'number') parts.push(each)
        } else if (typeof arg === 'string' && call.name === 'fillText') {
          parts.push(arg.replace(/\d+(?:\.\d+)?/g, '#'))
          for (const figure of arg.match(/\d+(?:\.\d+)?/g) ?? []) parts.push(Number(figure))
        } else if (typeof arg === 'string') parts.push(arg)
      }
      parts.forEach((value, index) => {
        const key = `${call.name} ${nth} [${index}]`
        let series = all.get(key)
        if (!series) {
          series = new Array<Drawn | undefined>(frames.length).fill(undefined)
          all.set(key, series)
        }
        series[n] = value
      })
    }
  })
  return all
}

/** A move smaller than this is not one: a millionth of a pixel, of a strength, of a figure. */
const NO_MOVE = 1e-6

/**
 * The most times a series turns round within any `window` frames. A figure
 * turns when it goes back the way it came; a word, a colour or a mark that
 * comes and goes turns whenever it changes.
 */
function mostTurns(series: readonly (Drawn | undefined)[], window: number): number {
  const turned = new Array<number>(series.length).fill(0)
  let way = 0
  for (let n = 1; n < series.length; n++) {
    const before = series[n - 1]
    const now = series[n]
    if (typeof before === 'number' && typeof now === 'number') {
      const step = Math.abs(now - before) < NO_MOVE ? 0 : Math.sign(now - before)
      if (step === 0) continue
      if (way !== 0 && step !== way) turned[n] = 1
      way = step
    } else if (before !== now) turned[n] = 1
  }
  let most = 0
  for (let from = 0; from < series.length; from++) {
    let count = 0
    for (let n = from; n < Math.min(series.length, from + window); n++) count += turned[n]
    most = Math.max(most, count)
  }
  return most
}

const FPS = 30
/** A second of frames, both ends counted. */
const SECOND = FPS + 1
/** R10: nothing drawn may turn more often than this in any second. */
const MOST_TURNS = 6

/** Every series that turns more than six times in some second, with how often. */
function flicker(frames: readonly RecordingContext[]): string[] {
  const over: string[] = []
  for (const [key, series] of seriesOf(frames)) {
    const turns = mostTurns(series, SECOND)
    if (turns > MOST_TURNS) over.push(`${key}: ${turns} turns in a second`)
  }
  return over
}

/** Where the mark of the sine now is drawn in each frame. */
const marksOf = (frames: readonly RecordingContext[]): Disc[] =>
  frames.map((drawn) => {
    const [mark] = fills(drawn).discs.filter((disc) => disc.colour === accent)
    return mark
  })

describe('the display of Still Point, drawn in time', () => {
  const lay = stillPointLayout(size)
  const key = 57
  const values = { time: 12, reach: 4 }
  const low = key - values.reach
  const high = key + values.reach

  /**
   * Two seconds at thirty frames a second from the moment the sine, on its
   * way up, beats with the held key at `rate`: the sine and the limits read
   * as the device's law moves them, at its own pace, while the sound that
   * comes out and the gate reading pulse at that rate throughout.
   */
  function timed(rate: number, under: boolean, seconds = 2): RecordingContext[] {
    const from = stillPointKey(hzOfKey(key) + (under ? -rate : rate))
    const start = (0.5 * (from - low)) / (high - low)
    const state: unknown = display.init?.()
    const frames: RecordingContext[] = []
    for (let n = 0; n <= seconds * FPS; n++) {
      const t = n / FPS
      const phase = start + stillPointPhase(t, values.time)
      const options: FrameOptions = {
        state,
        values,
        now: 10 + t,
        dt: n === 0 ? 0 : 1 / FPS,
        notes: [held(key, start * 2 * values.time + t)],
        meters: {
          sine: stillPointPitch(phase, low, high),
          low,
          high,
          gate: 0.5 + 0.4 * Math.cos(2 * Math.PI * rate * t),
        },
        signal: soundOf(0.2 * Math.abs(Math.cos(Math.PI * rate * t))),
      }
      frames.push(drawDisplay(display, params, options))
    }
    return frames
  }

  it.each([
    [0.5, false],
    [6, false],
    [10, false],
    [40, false],
    [6.5, true],
    [13, true],
  ])(
    'turns nothing more than six times a second with the sound beating at %f Hz',
    (rate, under) => {
      const frames = timed(rate, under)
      expect(frames).toHaveLength(61)
      // The same things are drawn in every frame, so each has a series to follow.
      const made = frames.map((drawn) => drawn.calls.map((call) => call.name).join(' '))
      expect(new Set(made).size).toBe(1)
      expect(flicker(frames)).toEqual([])
      // The mark does move: across, a twelfth of the picture in two seconds of a turn of twenty four.
      const marks = marksOf(frames)
      for (let n = 1; n < marks.length; n++) expect(marks[n].x).toBeGreaterThan(marks[n - 1].x)
      expect(marks[60].x - marks[0].x).toBeCloseTo(lay.plot.w / 12, 6)
      // And the foot is filled: the sound is drawn, at its mean.
      const bar = fills(frames[60]).patches.find((patch) => patch.colour === accent)
      expect(bar?.w ?? 0).toBeGreaterThan(0.5 * lay.foot.w)
    },
  )

  it('turns nothing more than six times a second through a meeting, on the device’s own sound', async () => {
    // One key and a sine as loud, a pass in twelve seconds, four semitones either side: they meet at six
    // seconds, and for a second either side the sound beats, at nine to the second and slower.
    const settings = { ...values, level: 1, attack: 0.05 }
    const played = await play(settings, [{ at: 0, key, gain: 0.8 }], 7.2)
    const tap = 2048
    const frames: RecordingContext[] = []
    const levels: number[] = []
    const state: unknown = display.init?.()
    for (let n = 0; n <= 2 * FPS; n++) {
      const t = 5 + n / FPS
      const end = Math.round(t * RATE)
      let sum = 0
      for (let i = end - tap; i < end; i++) {
        const mid = 0.5 * (played.left[i] + played.right[i])
        sum += mid * mid
      }
      const rms = Math.sqrt(sum / tap)
      levels.push(rms)
      const reading = readingAt(played, t)
      frames.push(
        drawDisplay(display, params, {
          state,
          values: settings,
          now: 10 + t,
          dt: n === 0 ? 0 : 1 / FPS,
          notes: [held(key, t)],
          meters: { sine: reading.sine, low: reading.low, high: reading.high, gate: reading.gate },
          signal: soundOf(rms),
        }),
      )
    }
    // The sound itself does beat: read frame by frame it turns more than six times in a second.
    expect(mostTurns(levels, SECOND)).toBeGreaterThan(MOST_TURNS)
    expect(Math.min(...levels)).toBeLessThan(0.25 * Math.max(...levels))
    expect(flicker(frames)).toEqual([])
    const marks = marksOf(frames)
    for (let n = 1; n < marks.length; n++) expect(marks[n].x).toBeGreaterThan(marks[n - 1].x)
    // It passes the key's line on the way: under it before the meeting, over it after.
    const span = stillPointSpan(low, high, [key])
    const line = lay.plot.y + ((span.top - key) / (span.top - span.bottom)) * lay.plot.h
    expect(marks[0].y).toBeGreaterThan(line)
    expect(marks[60].y).toBeLessThan(line)
    expect(marks[30].y).toBeCloseTo(line, 0)
  })
})
