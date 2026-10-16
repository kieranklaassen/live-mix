// The truth of the Ear Shift display: the arithmetic it is drawn from against
// the compiled device at 48 kHz (the frequency a tone has in each ear, how much
// of each copy an ear takes, the level in each ear and of the two together
// over time, and how much of each frequency is shifted), the drawing against
// that arithmetic, the points that are dragged, and the timed draw: nothing on
// it turns back more than six times in any second, whatever the Beat.

import { describe, expect, it } from 'vitest'

import { EAR_SHIFT_PARAMS } from '../../dsp/devices/ear-shift.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { INK, PLAIN_COLOURS, fillRect, ground, hzText, xOfHz } from '../components/display-kit'
import {
  EAR_SHIFT_FACES,
  EAR_SHIFT_MARGIN,
  EAR_SHIFT_MAX_HZ,
  EAR_SHIFT_MIN_HZ,
  EAR_SHIFT_REACH_HZ,
  EAR_SHIFT_SCALE_MARKS,
  earShiftBandShare,
  earShiftCopies,
  earShiftCurvePoints,
  earShiftEarLevel,
  earShiftEarPoints,
  earShiftEdges,
  earShiftFoldLevel,
  earShiftFoldPoints,
  earShiftHertz,
  earShiftHertzText,
  earShiftLayout,
  earShiftLevelY,
  earShiftScaleX,
  earShiftSettings,
  earShiftShareY,
  earShiftShares,
  earShiftSpan,
  earShiftSpanText,
  type EarShiftSettings,
} from '../components/displays/ear-shift'
import { plateDisplay, type DisplayHandle, type PlateDisplay } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  testLevel,
  testSignal,
  viewOf,
  type DrawnPath,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const TWO_PI = Math.PI * 2
const display = EAR_SHIFT_FACES['ear-shift'].display

// The device's own numbers, copied from `cpp/kit/band.h`.
/** `kit::ThreeBand::kMargin`: High is held half an octave over Low at the least. */
const MARGIN = 1.41421356
/** `kit::ThreeBand::kLeastHz` and `kMostOfRate`: where the edges may lie at all. */
const LEAST_HZ = 20
const MOST_OF_RATE = 0.45

type Values = Readonly<Record<string, number>>

const valueOf =
  (values: Values = {}) =>
  (name: string): number =>
    values[name] ?? EAR_SHIFT_PARAMS[name as keyof typeof EAR_SHIFT_PARAMS].default

const settingsOf = (values: Values = {}): EarShiftSettings =>
  earShiftSettings(valueOf(values), RATE)

async function deviceAt(values: Values): Promise<WasmDeviceHarness> {
  const device = await loadWasmDevice('ear-shift', RATE)
  for (const [name, value] of Object.entries(values))
    device.set(EAR_SHIFT_PARAMS[name as keyof typeof EAR_SHIFT_PARAMS], value)
  return device
}

/** What the device makes of `seconds` of an input that is the same on both sides: its two ears. */
function render(
  device: WasmDeviceHarness,
  seconds: number,
  input: (n: number) => number,
): { left: Float32Array; right: Float32Array } {
  const total = Math.round(seconds * RATE)
  const left = new Float32Array(total)
  const right = new Float32Array(total)
  const block = new Float32Array(128)
  for (let done = 0; done < total; done += 128) {
    const frames = Math.min(128, total - done)
    for (let i = 0; i < frames; i++) block[i] = input(done + i)
    device.processBlock(block.subarray(0, frames))
    left.set(device.view(device.device.device_out_left(), frames), done)
    right.set(device.view(device.device.device_out_right(), frames), done)
  }
  return { left, right }
}

/** A sine of `hz` and `level`, from the first sample the device is given. */
const tone =
  (hz: number, level: number) =>
  (n: number): number =>
    level * Math.sin((TWO_PI * hz * n) / RATE)

/**
 * The frequency of a steady tone between two samples, in hertz: for a sine,
 * x[n+1] + x[n-1] is 2 cos Ω x[n], and Ω is read off the whole stretch at once.
 */
function frequencyOf(x: Float32Array, from: number, to: number): number {
  let cross = 0
  let power = 0
  for (let n = from; n < to; n++) {
    cross += x[n] * (x[n + 1] + x[n - 1])
    power += x[n] * x[n]
  }
  return (Math.acos(cross / (2 * power)) * RATE) / TWO_PI
}

/** How much of `x` is a sine at `hz`, over `count` samples from `from`: its amplitude there. */
function amplitudeAt(x: Float32Array, hz: number, from: number, count = RATE): number {
  let re = 0
  let im = 0
  for (let n = from; n < from + count; n++) {
    const turn = (TWO_PI * hz * n) / RATE
    re += x[n] * Math.cos(turn)
    im += x[n] * Math.sin(turn)
  }
  return (2 * Math.hypot(re, im)) / count
}

/**
 * The level of a tone near `hz` at sample `n`: the sample and, a quarter
 * turn off, its slope, which for a sine are the two legs of its amplitude.
 */
function levelAt(x: Float32Array, n: number, hz: number): number {
  const other = (x[n + 1] - x[n - 1]) / (2 * Math.sin((TWO_PI * hz) / RATE))
  return Math.hypot(x[n], other)
}

/** The two sides folded to one. */
function fold(sides: { left: Float32Array; right: Float32Array }): Float32Array {
  const mid = new Float32Array(sides.left.length)
  for (let n = 0; n < mid.length; n++) mid[n] = 0.5 * (sides.left[n] + sides.right[n])
  return mid
}

/** How high a line through points stands at `x`. */
function heightAt(points: readonly (readonly [number, number])[], x: number): number {
  if (x <= points[0][0]) return points[0][1]
  for (let i = 1; i < points.length; i++) {
    const [from, to] = [points[i - 1], points[i]]
    if (x > to[0]) continue
    return to[0] === from[0]
      ? to[1]
      : from[1] + ((to[1] - from[1]) * (x - from[0])) / (to[0] - from[0])
  }
  return points[points.length - 1][1]
}

/** The three lines a drawing strokes through many points: the hump, each ear's level, and the two together. */
function lines(drawn: RecordingContext): { curve: DrawnPath; ear: DrawnPath; both: DrawnPath } {
  const long = drawnPaths(drawn).filter((path) => path.kind === 'stroke' && path.points.length > 4)
  const [curve, ear] = long.filter((path) => path.width === 1.5)
  const [both] = long.filter((path) => path.width === 1)
  return { curve, ear, both }
}

/** The copies: every rectangle two pixels wide filled in the ink, with how strongly. */
function copiesDrawn(
  drawn: RecordingContext,
): { x: number; y: number; h: number; strength: number }[] {
  const all: { x: number; y: number; h: number; strength: number }[] = []
  let colour = ''
  let strength = 1
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') strength = call.args[0] as number
    else if (call.name === 'fillRect' && colour === PLAIN_COLOURS.ink && call.args[2] === 2)
      all.push({
        x: (call.args[0] as number) + 1,
        y: call.args[1] as number,
        h: call.args[3] as number,
        strength,
      })
  }
  return all
}

function handlesAt(values: Values = {}, size?: { width: number; height: number }) {
  const all = display.handles?.(viewOf(display, EAR_SHIFT_PARAMS, { values, ...size })) ?? []
  const byKey = (key: string): DisplayHandle => {
    const found = all.find((handle) => handle.key === key)
    if (!found) throw new Error(`no handle ${key}`)
    return found
  }
  return { low: byKey('low'), high: byKey('high') }
}

/** How far a tone wavers in one ear over a whole turn of the clock, in decibels. */
function waverDb(share: number, ears = 1): number {
  let low = Infinity
  let high = 0
  for (let i = 0; i <= 400; i++) {
    const level = earShiftEarLevel(i / 200, ears, share)
    low = Math.min(low, level)
    high = Math.max(high, level)
  }
  return 20 * Math.log10(high / low)
}

describe('the arithmetic of the Ear Shift display against the device', () => {
  it('moves the left ear up by half of Beat and the right ear down by half', () => {
    expect(earShiftHertz(6)).toEqual({ left: 3, right: -3 })
    expect(earShiftHertz(0.5)).toEqual({ left: 0.25, right: -0.25 })
    expect(earShiftHertz(40)).toEqual({ left: 20, right: -20 })
    // The two ears are Beat apart, the left the higher, at every setting.
    for (const beat of [0.5, 1.7, 6, 13, 40]) {
      const { left, right } = earShiftHertz(beat)
      expect(left - right).toBeCloseTo(beat, 12)
      expect(left).toBeGreaterThan(right)
    }
  })

  it('reads Ears as the kit does: same is (1 + e) / 2 and other (1 - e) / 2', () => {
    expect(earShiftShares(1)).toEqual({ same: 1, other: 0 })
    expect(earShiftShares(0)).toEqual({ same: 0.5, other: 0.5 })
    expect(earShiftShares(0.8).same).toBeCloseTo(0.9, 12)
    expect(earShiftShares(0.8).other).toBeCloseTo(0.1, 12)
    for (const ears of [-1, 0, 0.3, 1, 2]) {
      const { same, other } = earShiftShares(ears)
      expect(same + other).toBeCloseTo(1, 12)
      expect(other).toBeGreaterThanOrEqual(0)
    }
  })

  it('holds the top of the band half an octave over its bottom, as the split does', () => {
    expect(EAR_SHIFT_MARGIN).toBe(MARGIN)
    expect(earShiftEdges(60, 1000)).toEqual({ low: 60, high: 1000 })
    // Low and High can both be set to 400 Hz: the split holds High at 566.
    expect(earShiftEdges(400, 400).high).toBeCloseTo(400 * MARGIN, 9)
    expect(earShiftEdges(300, 400).high).toBeCloseTo(300 * MARGIN, 9)
    expect(earShiftEdges(5, 1000).low).toBe(LEAST_HZ)
    expect(earShiftEdges(60, 1e6).high).toBe(MOST_OF_RATE * RATE)
    expect(settingsOf({ low: 400, high: 400 }).high).toBeCloseTo(400 * MARGIN, 9)
  })

  it('shifts half of a tone on an edge, four fifths half an octave inside and all but a seventeenth an octave inside', () => {
    // With the other edge far off: 60 Hz to 4 kHz, read round the lower one.
    const share = (hz: number): number => earShiftBandShare(hz, 60, 4000, RATE)
    expect(share(60)).toBeCloseTo(0.5, 3)
    expect(share(60 * Math.SQRT2)).toBeCloseTo(0.8, 3)
    expect(share(120)).toBeCloseTo(16 / 17, 3)
    expect(share(30)).toBeCloseTo(1 / 17, 3)
    // What the checker measured of the device: on the edge a note falls to
    // silence in each ear, half an octave away it wavers 4.4 dB, an octave away 1.1 dB.
    expect(earShiftEarLevel(1, 1, share(60))).toBeLessThan(0.001)
    expect(waverDb(share(60 * Math.SQRT2))).toBeCloseTo(4.4, 1)
    expect(waverDb(share(120))).toBeCloseTo(1.1, 1)
    // And it wavers at half of Beat: the level comes round after two beats, not one.
    const edge = share(60 * Math.SQRT2)
    expect(earShiftEarLevel(1, 1, edge)).toBeCloseTo(0.6, 3)
    expect(earShiftEarLevel(2, 1, edge)).toBeCloseTo(1, 9)
    // Far outside nothing is shifted, and inside a wide band everything.
    expect(earShiftBandShare(20, 150, 1000, RATE)).toBeLessThan(0.001)
    expect(earShiftBandShare(8000, 150, 1000, RATE)).toBeLessThan(0.001)
    expect(earShiftBandShare(350, 60, 2000, RATE)).toBeGreaterThan(0.998)
  })

  it('keeps each ear level at Ears 1 and pulses both alike at Ears 0, the two together pulsing at every Ears', () => {
    for (const beats of [0, 0.25, 0.5, 0.8, 1, 1.5, 2.3]) {
      expect(earShiftEarLevel(beats, 1)).toBeCloseTo(1, 12)
      expect(earShiftEarLevel(beats, 0)).toBeCloseTo(Math.abs(Math.cos(Math.PI * beats)), 12)
      expect(earShiftFoldLevel(beats)).toBeCloseTo(Math.abs(Math.cos(Math.PI * beats)), 12)
    }
    // Half way between two crests an ear is left with Ears of the tone.
    expect(earShiftEarLevel(0.5, 0.5)).toBeCloseTo(0.5, 12)
    expect(earShiftEarLevel(0.5, 0.8)).toBeCloseTo(0.8, 12)
    expect(earShiftFoldLevel(0.5)).toBeCloseTo(0, 12)
  })

  it('writes a shift with its sign and no more figures than it has', () => {
    expect(earShiftHertzText(3)).toBe('+3 Hz')
    expect(earShiftHertzText(-3)).toBe('−3 Hz')
    expect(earShiftHertzText(0.25)).toBe('+0.25 Hz')
    expect(earShiftHertzText(-2.5)).toBe('−2.5 Hz')
    expect(earShiftHertzText(1.7361)).toBe('+1.74 Hz')
    expect(earShiftHertzText(-12.34)).toBe('−12.3 Hz')
    expect(earShiftHertzText(20)).toBe('+20 Hz')
    expect(earShiftHertzText(10)).toBe('+10 Hz')
  })

  it('shows two to five whole beats over a round length of time, and writes that time', () => {
    expect(earShiftSpan(0.5)).toBe(4)
    expect(earShiftSpan(6)).toBe(0.5)
    expect(earShiftSpan(10)).toBe(0.2)
    expect(earShiftSpan(40)).toBe(0.05)
    for (let step = 0; step <= 200; step++) {
      const beat = 0.5 * 80 ** (step / 200)
      const beats = earShiftSpan(beat) * beat
      expect(beats, `${beat} Hz`).toBeGreaterThanOrEqual(2 - 1e-9)
      expect(beats, `${beat} Hz`).toBeLessThanOrEqual(5)
    }
    expect(earShiftSpanText(0.05)).toBe('50 ms')
    expect(earShiftSpanText(0.5)).toBe('500 ms')
    expect(earShiftSpanText(4)).toBe('4 s')
  })
})

describe('what the Ear Shift display says is heard, against the device at 48 kHz', () => {
  const LEVEL = 0.5
  /** Whole seconds, so that tones a whole number of hertz apart are told apart exactly. */
  const SECOND = RATE

  it('writes for each ear the frequency a 440 Hz tone has there', async () => {
    for (const beat of [0.5, 6, 10, 40]) {
      const values = { beat, ears: 1, high: 2000 }
      const device = await deviceAt(values)
      const heard = render(device, 3, tone(440, LEVEL))
      const left = frequencyOf(heard.left, SECOND, 3 * SECOND - 1)
      const right = frequencyOf(heard.right, SECOND, 3 * SECOND - 1)
      const says = earShiftHertz(beat)
      expect(left - 440, `left ear at Beat ${beat}`).toBeCloseTo(says.left, 2)
      expect(right - 440, `right ear at Beat ${beat}`).toBeCloseTo(says.right, 2)
      // And those are the two figures on the display, to the figure they are written to.
      const words = drawDisplay(display, EAR_SHIFT_PARAMS, { values }).words()
      expect(words).toContain(`L ${earShiftHertzText(Number((left - 440).toFixed(2)))}`)
      expect(words).toContain(`R ${earShiftHertzText(Number((right - 440).toFixed(2)))}`)
    }
    // The plainest case, as the device's own harness reads it: 443 Hz and 437 Hz at Beat 6.
    const device = await deviceAt({})
    const heard = render(device, 3, tone(440, LEVEL))
    expect(frequencyOf(heard.left, SECOND, 3 * SECOND - 1)).toBeCloseTo(443, 1)
    expect(frequencyOf(heard.right, SECOND, 3 * SECOND - 1)).toBeCloseTo(437, 1)
  })

  it('stands in each ear as much of each copy as the device puts there, at every Ears', async () => {
    const layout = earShiftLayout(viewOf(display, EAR_SHIFT_PARAMS))
    for (const ears of [0, 0.25, 0.5, 0.8, 1]) {
      const values = { beat: 6, ears, high: 2000 }
      const device = await deviceAt(values)
      const heard = render(device, 2, tone(440, LEVEL))
      const set = settingsOf(values)
      const inBand = earShiftBandShare(440, set.low, set.high, RATE)
      expect(inBand).toBeGreaterThan(0.99)
      for (const copy of earShiftCopies(set, layout)) {
        const side = copy.ear === 'left' ? heard.left : heard.right
        const there = amplitudeAt(side, 440 + copy.hz, SECOND) / (LEVEL * inBand)
        // The other sideband is 44 dB under at the least: half a hundredth of the tone.
        expect(there, `${copy.ear} ear at ${440 + copy.hz} Hz, Ears ${ears}`).toBeCloseTo(
          copy.share,
          2,
        )
        // As tall on the display as its share of the ear.
        expect((copy.foot - copy.top) / layout.tall).toBeCloseTo(copy.share, 12)
      }
      // What is left at 440 Hz itself is the part of the tone outside the band.
      expect(amplitudeAt(heard.left, 440, SECOND) / LEVEL).toBeCloseTo(1 - inBand, 2)
    }
  })

  it('draws over time the level the device gives each ear, and the level of the two together', async () => {
    const layout = earShiftLayout(viewOf(display, EAR_SHIFT_PARAMS))
    for (const beat of [2, 6]) {
      for (const ears of [0, 0.5, 1]) {
        const values = { beat, ears, high: 2000 }
        const device = await deviceAt(values)
        const heard = render(device, 2.5, tone(440, LEVEL))
        const mid = fold(heard)
        const set = settingsOf(values)
        const inBand = earShiftBandShare(440, set.low, set.high, RATE)
        const earLine = earShiftEarPoints(set, layout)
        const bothLine = earShiftFoldPoints(set, layout)
        const span = earShiftSpan(beat)
        let worst = 0
        let worstDrawn = 0
        // From a whole number of beats on, so that the picture's left end is the crest it is drawn from.
        for (let n = SECOND; n < SECOND + Math.round(span * RATE) - 1; n += 7) {
          const beats = (beat * n) / RATE
          const left = levelAt(heard.left, n, 440) / LEVEL
          const right = levelAt(heard.right, n, 440) / LEVEL
          const both = levelAt(mid, n, 440) / LEVEL
          worst = Math.max(
            worst,
            Math.abs(left - earShiftEarLevel(beats, ears, inBand)),
            Math.abs(right - earShiftEarLevel(beats, ears, inBand)),
            Math.abs(both - earShiftFoldLevel(beats, inBand)),
          )
          // The same moment on the picture: so far along the time axis.
          const x = layout.time.x + ((n - SECOND) / (span * RATE)) * layout.time.w
          const drawnEar = (layout.time.y + layout.time.h - heightAt(earLine, x)) / layout.time.h
          const drawnBoth = (layout.time.y + layout.time.h - heightAt(bothLine, x)) / layout.time.h
          worstDrawn = Math.max(worstDrawn, Math.abs(left - drawnEar), Math.abs(both - drawnBoth))
        }
        expect(worst, `the law at Beat ${beat}, Ears ${ears}`).toBeLessThan(0.02)
        // The picture is a note wholly in the band, read every pixel and a half.
        expect(worstDrawn, `the picture at Beat ${beat}, Ears ${ears}`).toBeLessThan(0.04)
      }
    }
  })

  it('falls silent in the air Beat times a second at Ears 0, as often as the display draws it', async () => {
    const layout = earShiftLayout(viewOf(display, EAR_SHIFT_PARAMS))
    for (const beat of [2, 6, 10]) {
      const values = { beat, ears: 0, high: 2000 }
      const device = await deviceAt(values)
      const heard = render(device, 2.5, tone(440, LEVEL))
      // The two sides are one sound.
      let apart = 0
      for (let n = 0; n < heard.left.length; n++)
        apart = Math.max(apart, Math.abs(heard.left[n] - heard.right[n]))
      expect(apart).toBe(0)
      // Count the silences of the mono sum over one second.
      const mid = fold(heard)
      let silences = 0
      let under = false
      for (let n = SECOND; n < 2 * SECOND; n++) {
        const quiet = levelAt(mid, n, 440) < 0.1 * LEVEL
        if (quiet && !under) silences += 1
        under = quiet
      }
      expect(silences, `silences a second at Beat ${beat}`).toBe(beat)
      // The display's line for the two together touches the foot once a beat.
      const foot = layout.time.y + layout.time.h
      const touches = earShiftFoldPoints(settingsOf(values), layout).filter(
        ([, y]) => Math.abs(y - foot) < 1e-9,
      ).length
      expect(touches / earShiftSpan(beat), `silences a second drawn at Beat ${beat}`).toBeCloseTo(
        silences,
        9,
      )
    }
  })

  it('shifts of a tone as much as the hump says and leaves the rest where it was', async () => {
    const bands: Values[] = [{}, { low: 150 }, { low: 300, high: 700 }, { low: 400, high: 400 }]
    for (const band of bands) {
      const set = settingsOf({ ...band, beat: 2, ears: 1 })
      for (const hz of [60, 85, 150, 212, 300, 440, 566, 700, 1000, 1414, 2000, 3000]) {
        // Beat 2: the left ear's copy is one hertz over the tone, so a second tells the two apart.
        const device = await deviceAt({ ...band, beat: 2, ears: 1 })
        const heard = render(device, 3, tone(hz, LEVEL))
        const says = earShiftBandShare(hz, set.low, set.high, RATE)
        const what = `${hz} Hz in ${set.low.toFixed(0)} to ${set.high.toFixed(0)} Hz`
        expect(amplitudeAt(heard.left, hz + 1, 2 * SECOND) / LEVEL, `shifted, ${what}`).toBeCloseTo(
          says,
          2,
        )
        expect(amplitudeAt(heard.left, hz, 2 * SECOND) / LEVEL, `left alone, ${what}`).toBeCloseTo(
          1 - says,
          2,
        )
        expect(
          amplitudeAt(heard.right, hz - 1, 2 * SECOND) / LEVEL,
          `shifted down in the right ear, ${what}`,
        ).toBeCloseTo(says, 2)
      }
    }
  }, 60000)
})

describe('the Ear Shift display', () => {
  const view = viewOf(display, EAR_SHIFT_PARAMS)
  const layout = earShiftLayout(view)
  const { plot, scale, time } = layout

  it('is laid out from the size it is given: the frequency axis above, the two ears, the time axis below', () => {
    expect([view.width, view.height]).toEqual([176, 100])
    expect(plot.x).toBe(6)
    expect(plot.x + plot.w).toBe(170)
    // Top to foot: the axis, the line of words, the left ear, the right ear, the time axis.
    expect(plot.y + plot.h).toBeLessThan(layout.base - 8)
    expect(layout.base).toBeLessThan(layout.leftFoot - layout.tall)
    expect(layout.leftFoot).toBeLessThan(layout.rightFoot - layout.tall)
    expect(layout.rightFoot + 2.5).toBeLessThan(time.y)
    expect(time.y + time.h).toBeLessThanOrEqual(view.height - 6)
    // The two ears and the time axis stand in one column, beside their words.
    expect(scale.x).toBe(time.x)
    expect(scale.w).toBe(time.w)
    expect(scale.x - layout.left).toBeGreaterThanOrEqual(46)
    // Wider, as on an opened or an upright plate, everything is wider and no higher.
    const wide = earShiftLayout({ width: 389, height: 100 })
    expect(wide.plot.w).toBe(377)
    expect(wide.time.w).toBe(wide.scale.w)
    expect(wide.time.y).toBe(time.y)
    expect(wide.leftFoot).toBe(layout.leftFoot)
  })

  it('draws how much of each frequency is shifted, the hump between Low and High', () => {
    for (const values of [
      {},
      { low: 150 },
      { low: 300, high: 700 },
      { low: 400, high: 400 },
    ] as Values[]) {
      const set = settingsOf(values)
      const { curve } = lines(drawDisplay(display, EAR_SHIFT_PARAMS, { values }))
      expect(curve.points).toEqual(earShiftCurvePoints(set, layout, RATE))
      expect(curve.points[0][0]).toBe(plot.x)
      expect(curve.points[curve.points.length - 1][0]).toBeCloseTo(plot.x + plot.w, 9)
      // The line stands, at any frequency, as high as that much of a tone is shifted.
      for (const hz of [40, 60, 150, 300, 440, 700, 1000, 2000, 3500]) {
        const x = xOfHz(hz, plot, EAR_SHIFT_MIN_HZ, EAR_SHIFT_MAX_HZ)
        const drawn = (plot.y + plot.h - heightAt(curve.points, x)) / plot.h
        expect(drawn, `${hz} Hz`).toBeCloseTo(earShiftBandShare(hz, set.low, set.high, RATE), 1)
      }
      // Half a tone at each edge when the other is far, less where the two are close.
      const atLow = earShiftBandShare(set.low, set.low, set.high, RATE)
      expect(atLow).toBeLessThanOrEqual(0.5)
      expect(atLow).toBeGreaterThanOrEqual(0.4 - 1e-3)
    }
    expect(earShiftShareY(1, plot)).toBe(plot.y)
    expect(earShiftShareY(0, plot)).toBe(plot.y + plot.h)
  })

  it('writes the two edges under the axis as the split holds them', () => {
    expect(drawDisplay(display, EAR_SHIFT_PARAMS).words()).toEqual(
      expect.arrayContaining(['60 Hz', '1 kHz']),
    )
    const held = drawDisplay(display, EAR_SHIFT_PARAMS, { values: { low: 400, high: 400 } })
    expect(held.words()).toEqual(expect.arrayContaining(['400 Hz', hzText(400 * MARGIN)]))
    expect(hzText(400 * MARGIN)).toBe('566 Hz')
  })

  it('stretches the scale of hertz round the note, so that a quarter of a hertz and twenty are both seen', () => {
    const middle = earShiftScaleX(0, layout)
    expect(middle).toBe(scale.x + scale.w / 2)
    // The same either side, further out for more hertz, the ends at twenty.
    let before = middle
    for (const hz of [0.25, 0.5, 1, 3, 5, 10, 20]) {
      const x = earShiftScaleX(hz, layout)
      expect(x, `${hz} Hz`).toBeGreaterThan(before + 2)
      expect(earShiftScaleX(-hz, layout) - middle).toBeCloseTo(middle - x, 9)
      before = x
    }
    expect(earShiftScaleX(EAR_SHIFT_REACH_HZ, layout)).toBeCloseTo(scale.x + scale.w - 3, 9)
    expect(earShiftScaleX(99, layout)).toBe(earShiftScaleX(EAR_SHIFT_REACH_HZ, layout))
    // The slowest Beat puts the two ears six pixels apart or more.
    const slowest = earShiftHertz(EAR_SHIFT_PARAMS.beat.min)
    expect(
      earShiftScaleX(slowest.left, layout) - earShiftScaleX(slowest.right, layout),
    ).toBeGreaterThanOrEqual(6)
    expect(EAR_SHIFT_SCALE_MARKS).toEqual([1, 10, 20])
  })

  it("stands each ear's copies on the scale where they are in hertz, as tall as the ear takes of them", () => {
    for (const values of [
      {},
      { beat: 0.5, ears: 0.25 },
      { beat: 40, ears: 0 },
      { ears: 0.8 },
    ] as Values[]) {
      const set = settingsOf(values)
      const copies = earShiftCopies(set, layout)
      const hertz = earShiftHertz(set.beat)
      const shares = earShiftShares(set.ears)
      expect(copies.map((copy) => [copy.ear, copy.hz, copy.share])).toEqual([
        ['left', hertz.left, shares.same],
        ['left', hertz.right, shares.other],
        ['right', hertz.right, shares.same],
        ['right', hertz.left, shares.other],
      ])
      for (const copy of copies) {
        expect(copy.x).toBe(earShiftScaleX(copy.hz, layout))
        expect(copy.foot).toBe(copy.ear === 'left' ? layout.leftFoot : layout.rightFoot)
        expect(copy.foot - copy.top).toBeCloseTo(copy.share * layout.tall, 12)
      }
      // Drawn: every copy an ear has any of, its own in full ink and the other's standing back.
      const drawn = copiesDrawn(drawDisplay(display, EAR_SHIFT_PARAMS, { values }))
      const shown = copies.filter((copy) => copy.share > 0.03)
      expect(drawn).toHaveLength(shown.length)
      shown.forEach((copy, i) => {
        expect(drawn[i].x).toBeCloseTo(copy.x, 9)
        expect(drawn[i].y).toBeCloseTo(copy.top, 9)
        expect(drawn[i].h).toBeCloseTo(copy.foot - copy.top, 9)
        const own = copy.hz === (copy.ear === 'left' ? hertz.left : hertz.right)
        expect(drawn[i].strength).toBe(own ? 1 : INK.text)
      })
    }
    // At Ears 1 an ear has its own copy alone: the left above the note, the right below it.
    const apart = copiesDrawn(drawDisplay(display, EAR_SHIFT_PARAMS))
    const middle = earShiftScaleX(0, layout)
    expect(apart).toHaveLength(2)
    expect(apart[0].x).toBeGreaterThan(middle)
    expect(apart[0].y + apart[0].h).toBeCloseTo(layout.leftFoot, 9)
    expect(apart[1].x).toBeLessThan(middle)
    expect(apart[1].y + apart[1].h).toBeCloseTo(layout.rightFoot, 9)
    // At Ears 0 both ears have both copies at half: the two ears are drawn alike.
    const alike = copiesDrawn(drawDisplay(display, EAR_SHIFT_PARAMS, { values: { ears: 0 } }))
    expect(alike).toHaveLength(4)
    expect(alike.map((copy) => copy.h)).toEqual(alike.map(() => layout.tall / 2))
    expect(
      alike
        .slice(0, 2)
        .map((copy) => copy.x)
        .sort(),
    ).toEqual(
      alike
        .slice(2)
        .map((copy) => copy.x)
        .sort(),
    )
  })

  it('writes beside each ear how many hertz it is from the note, and the length of the time axis', () => {
    expect(drawDisplay(display, EAR_SHIFT_PARAMS).words()).toEqual([
      '60 Hz',
      '1 kHz',
      'L +3 Hz',
      'R −3 Hz',
      '500 ms',
    ])
    expect(
      drawDisplay(display, EAR_SHIFT_PARAMS, { values: { beat: 0.5, high: 2000 } }).words(),
    ).toEqual(['60 Hz', '2 kHz', 'L +0.25 Hz', 'R −0.25 Hz', '4 s'])
    expect(drawDisplay(display, EAR_SHIFT_PARAMS, { values: { beat: 40 } }).words()).toEqual(
      expect.arrayContaining(['L +20 Hz', 'R −20 Hz', '50 ms']),
    )
  })

  it("draws the level over time: each ear's line over the line of the two together", () => {
    for (const values of [
      {},
      { ears: 0 },
      { beat: 0.5, ears: 0.5 },
      { beat: 40, ears: 0.8 },
    ] as Values[]) {
      const set = settingsOf(values)
      const { ear, both } = lines(drawDisplay(display, EAR_SHIFT_PARAMS, { values }))
      expect(ear.points).toEqual(earShiftEarPoints(set, layout))
      expect(both.points).toEqual(earShiftFoldPoints(set, layout))
      expect(both.alpha).toBe(INK.back)
      const beats = earShiftSpan(set.beat) * set.beat
      const foot = time.y + time.h
      for (const points of [ear.points, both.points]) {
        expect(points[0][0]).toBe(time.x)
        expect(points[points.length - 1][0]).toBeCloseTo(time.x + time.w, 9)
        // Left to right, and never two readings in one place.
        for (let i = 1; i < points.length; i++)
          expect(points[i][0]).toBeGreaterThan(points[i - 1][0])
      }
      // Both lines are the display's own law at every reading.
      for (const [x, y] of ear.points) {
        const at = ((x - time.x) / time.w) * beats
        expect((foot - y) / time.h).toBeCloseTo(earShiftEarLevel(at, set.ears), 6)
      }
      for (const [x, y] of both.points) {
        const at = ((x - time.x) / time.w) * beats
        expect((foot - y) / time.h).toBeCloseTo(earShiftFoldLevel(at), 6)
      }
      // The clock stands at a crest at the left end, and the two together reach the foot between crests.
      expect(both.points[0][1]).toBe(time.y)
      expect(Math.max(...both.points.map(([, y]) => y))).toBeCloseTo(foot, 9)
      // An ear is never under the two together.
      for (const [x, y] of ear.points)
        expect(y).toBeLessThanOrEqual(heightAt(both.points, x) + 1e-9)
    }
    expect(earShiftLevelY(1, time)).toBe(time.y)
    expect(earShiftLevelY(0, time)).toBe(time.y + time.h)
    // At Ears 1 the line of an ear lies along the top; at Ears 0 it is the line of the two together.
    const apart = lines(drawDisplay(display, EAR_SHIFT_PARAMS))
    for (const [, y] of apart.ear.points) expect(y).toBeCloseTo(time.y, 9)
    const alike = lines(drawDisplay(display, EAR_SHIFT_PARAMS, { values: { ears: 0 } }))
    alike.ear.points.forEach(([, y], i) => expect(y).toBeCloseTo(alike.both.points[i][1], 9))
  })
})

describe('the points of the Ear Shift display', () => {
  const sizes = [undefined, { width: 389, height: 100 }]

  it('has two, Low and High, standing on the line at the two edges of the band', () => {
    for (const size of sizes) {
      const { plot } = earShiftLayout(viewOf(display, EAR_SHIFT_PARAMS, { ...size }))
      const x = (hz: number): number => xOfHz(hz, plot, EAR_SHIFT_MIN_HZ, EAR_SHIFT_MAX_HZ)
      for (const values of [{}, { low: 150, high: 700 }, { low: 400, high: 2000 }] as Values[]) {
        const set = settingsOf(values)
        const { low, high } = handlesAt(values, size)
        expect([low.name, high.name]).toEqual(['Low', 'High'])
        expect(low.x).toBeCloseTo(x(set.low), 9)
        expect(high.x).toBeCloseTo(x(set.high), 9)
        expect(low.x).toBeLessThan(high.x)
        const { curve } = lines(drawDisplay(display, EAR_SHIFT_PARAMS, { values, ...size }))
        expect(Math.abs(heightAt(curve.points, low.x) - low.y)).toBeLessThan(0.3)
        expect(Math.abs(heightAt(curve.points, high.x) - high.y)).toBeLessThan(0.3)
        // A tone on an edge is half shifted, a little less where the other edge is near.
        for (const ring of [low, high]) {
          expect(ring.y).toBeGreaterThanOrEqual(earShiftShareY(0.5, plot) - 1e-9)
          expect(ring.y).toBeLessThan(earShiftShareY(0.4, plot))
        }
      }
    }
  })

  it('draws them where they stand', () => {
    for (const values of [{}, { low: 300, high: 500, beat: 40, ears: 0 }] as Values[]) {
      const rings = drawDisplay(display, EAR_SHIFT_PARAMS, { values })
        .calls.filter((call) => call.name === 'arc' && call.args[2] === 3.5)
        .map((call) => [call.args[0], call.args[1]])
      const { low, high } = handlesAt(values)
      expect(rings).toEqual([
        [low.x, low.y],
        [high.x, high.y],
      ])
    }
  })

  it('moves Low and High across the frequency axis, each inside its own range', () => {
    for (const size of sizes) {
      const view = viewOf(display, EAR_SHIFT_PARAMS, { ...size })
      const { plot } = earShiftLayout(view)
      const x = (hz: number): number => xOfHz(hz, plot, EAR_SHIFT_MIN_HZ, EAR_SHIFT_MAX_HZ)
      const { low, high } = handlesAt({}, size)
      expect(low.drag(x(100), 0).low).toBeCloseTo(100, 6)
      expect(Object.keys(low.drag(x(100), 0))).toEqual(['low'])
      expect(low.drag(0, 0)).toEqual({ low: 60 })
      expect(low.drag(x(2000), 0)).toEqual({ low: 400 })
      expect(high.drag(x(1500), 0).high).toBeCloseTo(1500, 6)
      expect(Object.keys(high.drag(x(1500), 0))).toEqual(['high'])
      expect(high.drag(view.width, 0)).toEqual({ high: 2000 })
      expect(high.drag(0, 0)).toEqual({ high: 400 })
      // Up and down does nothing: the rings are moved across only.
      expect(low.drag(x(100), 50)).toEqual(low.drag(x(100), 0))
      // Taken and not moved they stay where they are, and a double press puts them back.
      expect(low.drag(low.x, low.y)).toEqual({ low: 60 })
      expect(high.drag(high.x, high.y)).toEqual({ high: 1000 })
      const moved = handlesAt({ low: 220, high: 1700 }, size)
      expect(moved.low.drag(moved.low.x, moved.low.y)).toEqual({ low: 220 })
      expect(moved.high.drag(moved.high.x, moved.high.y)).toEqual({ high: 1700 })
      expect(moved.low.reset?.()).toEqual({ low: 60 })
      expect(moved.high.reset?.()).toEqual({ high: 1000 })
    }
  })

  it('stands High where the split holds it, and leaves its setting alone when it is taken and not moved', () => {
    const view = viewOf(display, EAR_SHIFT_PARAMS)
    const { plot } = earShiftLayout(view)
    const x = (hz: number): number => xOfHz(hz, plot, EAR_SHIFT_MIN_HZ, EAR_SHIFT_MAX_HZ)
    const { low, high } = handlesAt({ low: 400, high: 400 })
    expect(low.x).toBeCloseTo(x(400), 9)
    expect(high.x).toBeCloseTo(x(400 * MARGIN), 6)
    expect(high.drag(high.x, high.y)).toEqual({ high: 400 })
    // Moved, it sets the frequency under the hand.
    expect(high.drag(x(800), 0).high).toBeCloseTo(800, 6)
  })
})

describe('the Ear Shift display in time', () => {
  const wrap = (cycles: number): number => cycles - Math.floor(cycles)

  /**
   * A display drawn as the plate draws it for two seconds at 30 frames a
   * second, with the device's own beat at `beat` in the level of the sound
   * (the two ears together, which fall to nothing once a beat) and in the
   * readings it is handed: every number of every frame, in the order drawn
   * (each coordinate, each width, each strength an ink is laid at).
   */
  function timed(shown: PlateDisplay, beat: number, values: Values = {}): number[][] {
    const state = shown.init?.()
    const frames: number[][] = []
    for (let n = 0; n < 60; n++) {
      const time = n / 30
      const level = earShiftFoldLevel(time * beat)
      const signal = { ...testSignal(0.5, 0.35 * level), right: testLevel(0.35 * level) }
      const drawn = drawDisplay(shown, EAR_SHIFT_PARAMS, {
        values: { ...values, beat },
        meters: { place: wrap(0.5 * time * beat), level },
        signal,
        state,
        now: 10 + time,
        dt: n === 0 ? 0 : 1 / 30,
      })
      frames.push(drawn.numbers().map(({ value }) => value))
    }
    return frames
  }

  /**
   * The most times anything drawn turns back within any one second: each
   * number of a frame is followed from frame to frame, and so is how many
   * numbers a frame has (a mark that comes and goes).
   */
  function mostTurns(frames: readonly (readonly number[])[], fps = 30): number {
    const slots = Math.max(...frames.map((frame) => frame.length))
    let most = 0
    for (let slot = -1; slot < slots; slot++) {
      const series = frames.map((frame) => (slot < 0 ? frame.length : (frame[slot] ?? 0)))
      const turns: number[] = []
      let way = 0
      for (let n = 1; n < series.length; n++) {
        const step = Math.sign(series[n] - series[n - 1])
        if (step === 0) continue
        if (way !== 0 && step !== way) turns.push(n)
        way = step
      }
      for (let first = 0; first < turns.length; first++) {
        let last = first
        while (last < turns.length && turns[last] - turns[first] < fps) last++
        most = Math.max(most, last - first)
      }
    }
    return most
  }

  /** What the display must never be: a patch as bright as the two ears together are loud now. */
  const flashing = plateDisplay({
    place: 'window',
    columns: 1,
    params: ['beat'],
    live: { signal: true },
    info: 'A patch that is as bright as the sound is loud at this moment.',
    draw(frame) {
      ground(frame)
      // Told apart to a thousandth, so that two frames at one level are one level.
      const level = Math.round(((frame.signal?.output.peak ?? 0) / 0.35) * 1000) / 1000
      fillRect(frame.ctx, { x: 10, y: 10, w: 20, h: 20 }, frame.colours.ink, level)
    },
  })

  it('is counted rightly: a patch that follows the beat turns back far more than six times a second', () => {
    // Six a second seen at 30 frames a second is five frames a beat: down and up twelve times.
    expect(mostTurns(timed(flashing, 6))).toBe(12)
    expect(mostTurns(timed(flashing, 10))).toBe(20)
    // Forty a second is seen as ten: a frame is one and a third beats.
    expect(mostTurns(timed(flashing, 40))).toBe(20)
    // A beat every two seconds turns once in the two, which is slow enough to follow.
    expect(mostTurns(timed(flashing, 0.5))).toBeLessThanOrEqual(1)
  })

  it('never turns back more than six times in any second, at a Beat of a half, six, ten and forty', () => {
    const settings: Values[] = [
      {},
      { ears: 0 },
      { ears: 0.5, low: 400, high: 400 },
      { ears: 0.8, low: 150, high: 2000 },
    ]
    for (const beat of [0.5, 6, 10, 40]) {
      for (const values of settings) {
        const frames = timed(display, beat, values)
        expect(frames.length).toBe(60)
        expect(frames[0].length).toBeGreaterThan(100)
        expect(mostTurns(frames), `Beat ${beat} ${JSON.stringify(values)}`).toBeLessThanOrEqual(6)
      }
    }
  })

  it('takes no readings and no signal: the plate has no need to draw it again until a control moves', () => {
    expect(display.live).toBeUndefined()
    const still = drawDisplay(display, EAR_SHIFT_PARAMS).print()
    const fed = drawDisplay(display, EAR_SHIFT_PARAMS, {
      meters: { place: 0.3, level: 0.2 },
      signal: testSignal(0.5, 0.1),
      now: 99,
      dt: 1 / 30,
    }).print()
    expect(fed).toBe(still)
    // So over two seconds of a sound that beats, nothing on it moves at all.
    for (const beat of [0.5, 6, 10, 40]) {
      const frames = timed(display, beat, { ears: 0.5 })
      for (const frame of frames) expect(frame).toEqual(frames[0])
    }
  })
})
