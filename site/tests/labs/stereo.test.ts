import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  click,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  RATE,
  rms,
  seconds,
  sine,
  type Source,
} from './support.ts'

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings('stereo')!
const LOOP = seconds(4)

/** The steps of the build, by the number the `build` control gives each. */
const STEP = {
  line: 0,
  circle: 1,
  midSide: 2,
  width: 3,
  bass: 4,
  scatter: 5,
  delay: 6,
  mono: 7,
} as const

const tap = (result: RenderResult, id: string, channel = 0) =>
  result.taps[id]!.channels_data[channel]!
const levelDb = (x: Float32Array) => gainToDb(rms(x))
/** The power of a tap's two channels added, in dB. */
const together = (result: RenderResult, id: string) =>
  10 * Math.log10(rms(tap(result, id, 0)) ** 2 + rms(tap(result, id, 1)) ** 2)
/** How far the right channel of a tap is under its left, in dB. */
const rightUnderLeft = (result: RenderResult, id: string) =>
  levelDb(tap(result, id, 0)) - levelDb(tap(result, id, 1))
/** How alike two channels are: 1 the same, 0 unrelated, −1 one the other turned over. */
function alike(a: Float32Array, b: Float32Array): number {
  let both = 0
  let aa = 0
  let bb = 0
  for (let i = 0; i < a.length; i += 1) {
    both += a[i]! * b[i]!
    aa += a[i]! * a[i]!
    bb += b[i]! * b[i]!
  }
  return both / Math.sqrt(aa * bb)
}
/** Where a signal is largest. */
function largestAt(x: Float32Array, from = 0, to = x.length): number {
  let at = from
  for (let i = from; i < to; i += 1) if (Math.abs(x[i]!) > Math.abs(x[at]!)) at = i
  return at
}
/** Whether two signals are the same, sample for sample. */
const same = (a: Float32Array, b: Float32Array) =>
  a.length === b.length && a.every((v, i) => v === b[i])
/**
 * Where each run of samples over `floor` starts, counted from `from`. A run is over once `gap`
 * samples have stayed under the floor.
 */
function runStarts(x: Float32Array, from: number, floor = 0.002, gap = 150): number[] {
  const starts: number[] = []
  let last = -Infinity
  for (let i = from; i < x.length; i += 1) {
    if (Math.abs(x[i]!) <= floor) continue
    if (i - last > gap) starts.push(i - from)
    last = i
  }
  return starts
}
/** A tone on both channels at a peak of 0.5, a second long: it comes round whole. */
const tone = (hz = 1000): Source => sine(hz, 0.5, seconds(1))
/** One sample of 0.5 on both channels a quarter of a second into a second of silence. */
const AT = seconds(0.25)
const oneSample = (): Source => click(seconds(1), AT, 0.5)
const ms = (samples: number) => (samples * 1000) / RATE
/** The least the scatter adds to the pad placed halfway left at Width 1, in dB (5.0 measured). */
const SCATTER_ADDS = 3

/** A named set as its card plays it: on its own source, with `over` laid on its values. */
async function played(st: Lab, name: string, over: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(st.description, set)
  return st.render(await benchSource(source!, LOOP), { ...values, ...over })
}

describe('stereo lab', () => {
  it('renders every tap on the pad, loops, and answers every control', async () => {
    const st = await lab('stereo')
    const source = await benchSource('pad', LOOP)
    const result = st.render(source, {})
    // Two of the pan law's sums are level by design, and the second widener leaves one
    // speaker's share of every frequency as it came.
    expectSoundLab(st, source, result, { quiet: ['lawPower', 'lineSum', 'secondResponse'] })
  })

  it('builds the widener a piece at a time, each step changing the sound, and the six pieces the engine has land on the device', async () => {
    const st = await lab('stereo')
    // The scatter and the delay do nothing until the Width is over 0.75 and 0.85.
    expectBuild(st, await benchSource('pad', LOOP), { width: 1 })
    expectBuild(st, await benchSource('drums', LOOP), { width: 0.9, feed: 1, pan: 0.3 })
  })

  it("is the same as the device sample for sample with the engine's six pieces, on a loop placed by Pan (claim build-same)", async () => {
    const st = await lab('stereo')
    for (const id of ['pad', 'drums']) {
      const source = await benchSource(id, LOOP)
      for (const [pan, width] of [
        [-0.5, 0.75],
        [0.3, 0.9],
        [1, 1],
        [0, 0.2],
      ] as const) {
        const result = st.render(source, { feed: 1, pan, width, build: STEP.delay })
        for (const channel of [0, 1]) {
          const built = tap(result, 'built', channel)
          const out = tap(result, 'out', channel)
          let apart = 0
          for (let i = 0; i < out.length; i += 1) if (built[i] !== out[i]) apart += 1
          expect(apart, `${id} at Pan ${pan}, Width ${width}: samples that differ`).toBe(0)
        }
        // And the build's pan law is the kit's.
        expect(
          tap(st.render(source, { feed: 1, pan, width, build: STEP.circle }), 'built').every(
            (v, i) => v === tap(result, 'placed')[i],
          ),
        ).toBe(true)
      }
    }
  })
})

describe('the pan law', () => {
  it('gives each speaker 0.707 of a sound in the middle (claim law-centre)', async () => {
    const st = await lab('stereo')
    const result = st.render(tone(), {})
    const left = tap(result, 'lawLeft')
    const right = tap(result, 'lawRight')
    const centre = (left.length - 1) / 2
    expectWritten(left[centre]!, '0.707')
    expectWritten(right[centre]!, '0.707')
    // And all of it to one side at either end.
    expect(left[0]).toBeCloseTo(1, 6)
    expect(right[0]).toBeCloseTo(0, 6)
    expect(right[left.length - 1]).toBeCloseTo(1, 6)
  })

  it('keeps the power of the two channels together within less than 0.001 dB at five places from left to right, on a 1 kHz tone (claim law-power)', async () => {
    const st = await lab('stereo')
    const at = (pan: number) => together(st.render(tone(), { feed: 1, pan }), 'placed')
    const left = at(-1)
    for (const pan of [-0.5, 0, 0.5, 1]) {
      expectWritten(Math.abs(at(pan) - left), 'less than 0.001 dB')
    }
  })

  it('makes a sound in the middle 3.01 dB louder on one speaker than the same sound hard left (claim law-sum)', async () => {
    const st = await lab('stereo')
    const one = (pan: number) => levelDb(tap(st.render(tone(), { feed: 1, pan }), 'goingMid'))
    expectWritten(one(0) - one(-1), '3.01 dB')
    // The curve of the two gains added says the same.
    const sum = tap(st.render(tone(), {}), 'lawSum')
    expectWritten(sum[(sum.length - 1) / 2]! - sum[0]!, '3.01 dB')
  })

  it('carries 3.01 dB less power in the middle than at either end, on a 1 kHz tone, when the shares are a straight line, and the same to less than 0.001 dB once they are equal power (claim line-dip, claim build-line, claim build-circle)', async () => {
    const st = await lab('stereo')
    const at = (build: number, pan: number) => together(st.render(tone(), { build, pan }), 'built')
    const dip = at(STEP.line, -1) - at(STEP.line, 0)
    expectWritten(dip, '3.01 dB')
    expectWritten(at(STEP.line, 1) - at(STEP.line, 0), '3.01 dB')
    // The piece switched in: the next step has no dip, and the step before it is not level.
    const after = at(STEP.circle, -1) - at(STEP.circle, 0)
    expect(matchesWritten(after, '3.01 dB')).toBe(false)
    expectWritten(Math.abs(after), 'less than 0.001 dB')
    expectWritten(Math.abs(at(STEP.circle, 1) - at(STEP.circle, 0)), 'less than 0.001 dB')
    expect(matchesWritten(Math.abs(dip), 'less than 0.001 dB')).toBe(false)
    // The curves of the lab say the same of both laws.
    const result = st.render(tone(), {})
    const line = tap(result, 'linePower')
    expectWritten(line[0]! - line[(line.length - 1) / 2]!, '3.01 dB')
  })
})

describe('the widener', () => {
  it('raises the side of the pad by 2.9 dB at Width 0.75 and leaves one speaker 1.6 dB less (claim pad-side, claim pad-one, claim use-pad)', async () => {
    const st = await lab('stereo')
    const result = st.render(await benchSource('pad', LOOP), { width: 0.75 })
    expectWritten(levelDb(tap(result, 'outSide')) - levelDb(tap(result, 'goingSide')), '2.9 dB')
    expectWritten(levelDb(tap(result, 'goingMid')) - levelDb(tap(result, 'mono')), '1.6 dB')
    // The lab's own checks read the same.
    expectWritten(result.checks.sideChange!, '2.9 dB')
    expectWritten(-result.checks.monoChange!, '1.6 dB')
  })

  it("takes the pad's left and right from 0.48 alike to 0.01 alike at Width 0.75 (claim pad-alike-in, claim pad-alike-out)", async () => {
    const st = await lab('stereo')
    const result = st.render(await benchSource('pad', LOOP), { width: 0.75 })
    expectWritten(alike(tap(result, 'going', 0), tap(result, 'going', 1)), '0.48')
    expectWritten(alike(tap(result, 'out', 0), tap(result, 'out', 1)), '0.01')
    expectWritten(result.checks.alikeBefore!, '0.48')
    expectWritten(result.checks.alikeAfter!, '0.01')
  })

  it('turns a 1 kHz tone in the middle down by 2.9 dB at Width 0.75 and adds no side to it (claim tone-mid)', async () => {
    const st = await lab('stereo')
    const result = st.render(tone(), { feed: 1, pan: 0, width: 0.75 })
    expectWritten(levelDb(tap(result, 'going')) - levelDb(tap(result, 'out', 0)), '2.9 dB')
    expectWritten(levelDb(tap(result, 'going')) - levelDb(tap(result, 'out', 1)), '2.9 dB')
    // No wider: the two sides come out the same, sample for sample.
    expect(same(tap(result, 'out', 0), tap(result, 'out', 1))).toBe(true)
  })

  it('moves a 1 kHz tone placed halfway left from 7.7 dB between the speakers to 19.1 dB at Width 0.75 (claim tone-edge)', async () => {
    const st = await lab('stereo')
    const result = st.render(tone(), { feed: 1, pan: -0.5, width: 0.75 })
    expectWritten(rightUnderLeft(result, 'going'), '7.7 dB')
    expectWritten(rightUnderLeft(result, 'out'), '19.1 dB')
  })

  it('puts a 1 kHz tone that was hard left into the right speaker too, 7.5 dB under the left and −0.98 alike (claim tone-over)', async () => {
    const st = await lab('stereo')
    const result = st.render(tone(), { feed: 1, pan: -1, width: 0.75 })
    // Nothing on the right going in: every sample is 0.
    expect(tap(result, 'going', 1).every((v) => v === 0)).toBe(true)
    expectWritten(rightUnderLeft(result, 'out'), '7.5 dB')
    expectWritten(alike(tap(result, 'out', 0), tap(result, 'out', 1)), '−0.98')
  })

  it('leaves most of the side of the pad at Width 0: 4.2 dB less, and one speaker 2.0 dB more, with left and right 0.85 alike (claim zero-side, claim myth-zero)', async () => {
    const st = await lab('stereo')
    const result = await played(st, 'zero')
    expectWritten(levelDb(tap(result, 'goingSide')) - levelDb(tap(result, 'outSide')), '4.2 dB')
    expectWritten(levelDb(tap(result, 'mono')) - levelDb(tap(result, 'goingMid')), '2.0 dB')
    expectWritten(alike(tap(result, 'out', 0), tap(result, 'out', 1)), '0.85')
  })

  it("changes the pad at the device's own default of 0.5: its side 1.1 dB less, and one speaker within less than 0.001 dB (claim rest-side)", async () => {
    const st = await lab('stereo')
    const result = st.render(await benchSource('pad', LOOP), settings.defaults!.values)
    expectWritten(levelDb(tap(result, 'goingSide')) - levelDb(tap(result, 'outSide')), '1.1 dB')
    expectWritten(
      Math.abs(levelDb(tap(result, 'mono')) - levelDb(tap(result, 'goingMid'))),
      'less than 0.001 dB',
    )
  })

  it('brings the pad out 7.4 dB louder at Width 1, both channels counted, and 0.1 dB louder at Width 0.75: 7.3 dB between the two (claim full-loud, claim pad-level, claim fault-loud)', async () => {
    const st = await lab('stereo')
    const full = await played(st, 'full')
    const wider = await played(st, 'wider')
    const up = (result: RenderResult) => together(result, 'out') - together(result, 'going')
    expectWritten(up(full), '7.4 dB')
    expectWritten(up(wider), '0.1 dB')
    expectWritten(together(full, 'out') - together(wider, 'out'), '7.3 dB')
  })

  it('still has a 1 kHz tone in the bass it splits off, 14.1 dB under the tone (claim bass-slope)', async () => {
    const st = await lab('stereo')
    const result = st.render(tone(), { width: 0.75 })
    expectWritten(levelDb(tap(result, 'going')) - levelDb(tap(result, 'bass')), '14.1 dB')
    // And nearly all of a 60 Hz tone.
    const low = st.render(tone(60), { width: 0.75 })
    expect(levelDb(tap(low, 'going')) - levelDb(tap(low, 'bass'))).toBeLessThan(0.5)
  })

  it('gives the side a gain of 1.75 at Width 0.75 and 2.50 at Width 1, and the mid 1.41, 1.00, 0.70 and 0.53 at Widths of 0, one half, 0.75 and 1 (claim side-gain, claim mid-gain)', async () => {
    const st = await lab('stereo')
    const result = st.render(tone(), {})
    const at = (id: string, width: number) => {
      const curve = result.taps[id]!
      const x = ((width - curve.x0) / (curve.x1 - curve.x0)) * (curve.length - 1)
      expect(Math.abs(x - Math.round(x)), `${id} has a point at ${width}`).toBeLessThan(1e-4)
      return curve.channels_data[0]![Math.round(x)]!
    }
    expectWritten(at('sideGain', 0.75), '1.75')
    expectWritten(at('sideGain', 1), '2.50')
    expectWritten(at('sideGain', 0.5), '1.00')
    expectWritten(at('sideGain', 0), '0.00')
    expectWritten(at('midGain', 0), '1.41')
    expectWritten(at('midGain', 0.5), '1.00')
    expectWritten(at('midGain', 0.75), '0.70')
    expectWritten(at('midGain', 1), '0.53')
  })

  it('brings a 1 kHz tone that is hard right out of the right speaker 10.6 dB louder at Width 1 (claim full-tone)', async () => {
    const st = await lab('stereo')
    const result = st.render(tone(), { feed: 1, pan: 1, width: 1 })
    expectWritten(levelDb(tap(result, 'out', 1)) - levelDb(tap(result, 'going', 1)), '10.6 dB')
  })

  it('puts the largest copy of one sample out 2.71 ms late on the left and 4.25 ms late on the right at Width 1: 74 samples, 1.54 ms, between the two (claim lag)', async () => {
    const st = await lab('stereo')
    const result = st.render(oneSample(), { width: 1 })
    const left = largestAt(tap(result, 'out', 0)) - AT
    const right = largestAt(tap(result, 'out', 1)) - AT
    expectWritten(ms(left), '2.71 ms')
    expectWritten(ms(right), '4.25 ms')
    expectWritten(right - left, '74 samples')
    expectWritten(ms(right - left), '1.54 ms')
    // The picture of one sample in the lab is the same response.
    const picture = st.render(tone(), { width: 1 })
    expect(largestAt(tap(picture, 'clickLeft'))).toBe(left)
    expect(largestAt(tap(picture, 'clickRight'))).toBe(right)
  })

  it('sends the copies of one sample out in five groups 10.67 ms apart at Width 1 (claim groups)', async () => {
    const st = await lab('stereo')
    const result = st.render(oneSample(), { width: 1 })
    const left = tap(result, 'out', 0)
    // Where each group starts, by the first sample of it that is over a floor.
    const starts = runStarts(left, AT)
    expect(starts).toHaveLength(5)
    for (let k = 1; k < starts.length; k += 1) {
      expectWritten(ms(starts[k]! - starts[k - 1]!), '10.67 ms')
    }
    // On the right the first run starts with the bass, which is not delayed, and each of the
    // other four starts the delay's 38 samples after the left's: nearly the same places.
    const right = runStarts(tap(result, 'out', 1), AT)
    expect(right).toHaveLength(5)
    expect(right.slice(1).map((start, k) => start - starts[k + 1]!)).toEqual([38, 38, 38, 38])
    const loud = (from: number, to: number) => {
      let top = 0
      for (let i = AT + from; i < AT + to; i += 1) top = Math.max(top, Math.abs(left[i]!))
      return top
    }
    // Something in each stretch of 140 samples that starts a whole ring after the sample, and
    // next to nothing between the stretches (the bass, which is not scattered, dies away there).
    for (const group of [0, 1, 2, 3, 4]) {
      expect(loud(512 * group, 512 * group + 140), `group ${group}`).toBeGreaterThan(0.02)
      expect(loud(512 * group + 140, 512 * (group + 1))).toBeLessThan(0.004)
    }
    // And no sixth: after the fifth there is less than a hundredth of the sample left.
    expect(loud(512 * 5, 512 * 9)).toBeLessThan(0.005)
  })

  it('leaves the strum 3.9 dB quieter on one speaker at Width 0.9 (claim hollow)', async () => {
    const st = await lab('stereo')
    const result = await played(st, 'made-one')
    expectWritten(levelDb(tap(result, 'goingMid')) - levelDb(tap(result, 'mono')), '3.9 dB')
    expectWritten(-result.checks.monoChange!, '3.9 dB')
  })

  it('makes left and right of the strum, the same going in, 0.68 alike at Width 0.9 (claim made-alike)', async () => {
    const st = await lab('stereo')
    const result = await played(st, 'made')
    expect(alike(tap(result, 'going', 0), tap(result, 'going', 1))).toBeCloseTo(1, 6)
    expectWritten(alike(tap(result, 'out', 0), tap(result, 'out', 1)), '0.68')
  })

  it('leaves one speaker a gap over 25 dB deep between 1 kHz and 4 kHz at Width 0.9 (claim fault-gaps)', async () => {
    const st = await lab('stereo')
    const result = await played(st, 'made-one')
    const curve = result.taps.monoResponse!
    const response = curve.channels_data[0]!
    let deepest = 0
    for (let i = 0; i < response.length; i += 1) if (response[i]! < response[deepest]!) deepest = i
    const hz = curve.x0 * (curve.x1 / curve.x0) ** (deepest / (response.length - 1))
    expectWritten(-response[deepest]!, 'over 25 dB')
    expect(hz).toBeGreaterThan(1000)
    expect(hz).toBeLessThan(4000)
    // At Width 0.75, with no scatter, there is no such gap.
    const gentle = (await played(st, 'wider')).taps.monoResponse!.channels_data[0]!
    for (const v of gentle) expect(matchesWritten(-v, 'over 25 dB')).toBe(false)
  })

  it('leaves the strum, the same on both sides, with no side and 1.9 dB quieter at Width 0.75 (claim myth-mono)', async () => {
    const st = await lab('stereo')
    const result = st.render(await benchSource('chords', LOOP), { width: 0.75 })
    expect(same(tap(result, 'going', 0), tap(result, 'going', 1))).toBe(true)
    expect(same(tap(result, 'out', 0), tap(result, 'out', 1))).toBe(true)
    expectWritten(levelDb(tap(result, 'going')) - levelDb(tap(result, 'out', 0)), '1.9 dB')
    expectWritten(levelDb(tap(result, 'going')) - levelDb(tap(result, 'out', 1)), '1.9 dB')
  })
})

describe('the second widener', () => {
  it('leaves one speaker within less than 0.01 dB of what went in, on the pad and the strum at five widths (claim second-one)', async () => {
    const st = await lab('stereo')
    for (const id of ['pad', 'chords']) {
      const source = await benchSource(id, LOOP)
      for (const width of [0, 0.5, 0.75, 0.9, 1]) {
        const result = st.render(source, { width })
        const apart = levelDb(tap(result, 'secondMono')) - levelDb(tap(result, 'goingMid'))
        expectWritten(Math.abs(apart), 'less than 0.01 dB')
        expectWritten(Math.abs(result.checks.secondMonoChange!), 'less than 0.01 dB')
      }
    }
  })

  it('gives one speaker every frequency within less than 0.01 dB at Width 1, where the first widener leaves dips over 30 dB deep (claim second-flat)', async () => {
    const st = await lab('stereo')
    const result = st.render(tone(), { width: 1 })
    const second = tap(result, 'secondResponse')
    for (const v of second) expectWritten(Math.abs(v), 'less than 0.01 dB')
    const first = tap(result, 'monoResponse')
    let deepest = 0
    for (const v of first) deepest = Math.min(deepest, v)
    expectWritten(-deepest, 'over 30 dB')
  })

  it('still makes the strum wide: left and right come out 0.57 alike at Width 0.9 (claim second-wide)', async () => {
    const st = await lab('stereo')
    const result = await played(st, 'second')
    expectWritten(alike(tap(result, 'secondOut', 0), tap(result, 'secondOut', 1)), '0.57')
  })
})

describe('the build', () => {
  it('moves a 1 kHz tone placed halfway left from 7.7 dB between the speakers to 35.8 dB with the two gains alone at Width 0.75 (claim build-width)', async () => {
    const st = await lab('stereo')
    const at = (build: number) =>
      rightUnderLeft(st.render(tone(), { build, pan: -0.5, width: 0.75 }), 'built')
    expectWritten(at(STEP.width), '35.8 dB')
    // The piece switched off: the step before leaves the tone where Pan put it.
    expect(matchesWritten(at(STEP.midSide), '35.8 dB')).toBe(false)
    expectWritten(at(STEP.midSide), '7.7 dB')
  })

  it('brings a 60 Hz tone that was hard left out 0.55 alike on its two sides with the bass kept narrow, and −1.00 alike without (claim build-bass)', async () => {
    const st = await lab('stereo')
    const at = (build: number) => {
      const result = st.render(tone(60), { build, pan: -1, width: 0.75 })
      return alike(tap(result, 'built', 0), tap(result, 'built', 1))
    }
    expectWritten(at(STEP.bass), '0.55')
    expect(matchesWritten(at(STEP.width), '0.55')).toBe(false)
    expectWritten(at(STEP.width), '−1.00')
  })

  it('brings a 1 kHz tone that is hard right out of the right speaker 10.5 dB louder once the scatter is in, at Width 1, and 3.4 dB louder before (claim build-scatter)', async () => {
    const st = await lab('stereo')
    const at = (build: number) => {
      const result = st.render(tone(), { build, pan: 1, width: 1 })
      const placed = st.render(tone(), { build: STEP.circle, pan: 1, width: 1 })
      return levelDb(tap(result, 'built', 1)) - levelDb(tap(placed, 'built', 1))
    }
    expectWritten(at(STEP.scatter), '10.5 dB')
    expect(matchesWritten(at(STEP.bass), '10.5 dB')).toBe(false)
    expectWritten(at(STEP.bass), '3.4 dB')
  })

  it('sets the right 74 samples behind the left with the delay in, and 36 without it, on one sample in the middle at Width 1: 38 samples come of the delay (claim build-delay)', async () => {
    const st = await lab('stereo')
    const at = (build: number) => {
      const result = st.render(oneSample(), { build, pan: 0, width: 1 })
      return largestAt(tap(result, 'built', 1)) - largestAt(tap(result, 'built', 0))
    }
    expectWritten(at(STEP.delay), '74 samples')
    expect(matchesWritten(at(STEP.scatter), '74 samples')).toBe(false)
    expectWritten(at(STEP.scatter), '36 samples')
    expectWritten(at(STEP.delay) - at(STEP.scatter), '38 samples')
  })

  it('leaves the strum, placed in the middle and summed to one speaker, 3.9 dB under the same strum before it was widened, at Width 0.9 (claim build-one)', async () => {
    const st = await lab('stereo')
    const source = await benchSource('chords', LOOP)
    const values = { pan: 0, width: 0.9 }
    const summed = st.render(source, { ...values, build: STEP.mono })
    const before = st.render(source, { ...values, build: STEP.circle })
    // The sum is one sound on both sides.
    expect(tap(summed, 'built', 0).every((v, i) => v === tap(summed, 'built', 1)[i])).toBe(true)
    const one = (result: RenderResult) => {
      const left = tap(result, 'built', 0)
      const right = tap(result, 'built', 1)
      return levelDb(left.map((v, i) => 0.5 * (v + right[i]!)))
    }
    expectWritten(one(before) - levelDb(tap(summed, 'built')), '3.9 dB')
    // Before the sum, the step with the engine's six pieces has more level on each side than
    // one speaker gets of the two: the loss is in the adding.
    const wide = st.render(source, { ...values, build: STEP.delay })
    for (const channel of [0, 1]) {
      const lost = levelDb(tap(before, 'built', channel)) - levelDb(tap(wide, 'built', channel))
      expect(lost).toBeGreaterThan(0)
      expect(lost).toBeLessThan(one(before) - levelDb(tap(summed, 'built')))
      // The piece switched off: neither side of the step before is down by the sum's number.
      expect(matchesWritten(lost, '3.9 dB')).toBe(false)
    }
  })

  it('takes the pair apart and puts it back more than 140 dB under the sound, with the side the mid at one end of Pan, the mid turned over at the other and nothing in the middle (claim build-apart)', async () => {
    const st = await lab('stereo')
    const pad = await benchSource('pad', LOOP)
    for (const pan of [-0.5, 0.3]) {
      const before = st.render(pad, { build: STEP.circle, pan })
      const after = st.render(pad, { build: STEP.midSide, pan })
      let apart = 0
      let whole = 0
      for (const channel of [0, 1]) {
        const was = tap(before, 'built', channel)
        const is = tap(after, 'built', channel)
        for (let i = 0; i < was.length; i += 1) {
          apart += (was[i]! - is[i]!) ** 2
          whole += was[i]! ** 2
        }
      }
      expectWritten(10 * Math.log10(whole / apart), 'more than 140 dB')
    }
    // All the way left the side is the mid, sample for sample.
    const left = st.render(pad, { build: STEP.midSide, pan: -1 })
    expect(same(tap(left, 'builtSide'), tap(left, 'builtMid'))).toBe(true)
    // In the middle there is no side to speak of, and all the way right it is the mid turned
    // over: the two added leave next to nothing. (The cosine of a quarter turn is not quite 0
    // in single precision, so neither is held to the last bit.)
    const middle = st.render(pad, { build: STEP.midSide, pan: 0 })
    expect(levelDb(tap(middle, 'builtSide')) - levelDb(tap(middle, 'builtMid'))).toBeLessThan(-120)
    const right = st.render(pad, { build: STEP.midSide, pan: 1 })
    const added = tap(right, 'builtMid').map((v, i) => v + tap(right, 'builtSide')[i]!)
    expect(levelDb(added) - levelDb(tap(right, 'builtMid'))).toBeLessThan(-120)
  })

  it('changes nothing with the two gains at a Width of one half, comes out louder with the scatter in than without it at Width 1, and at Width 1 keeps each lane within 0.5 dB with the delay in', async () => {
    const st = await lab('stereo')
    const pad = await benchSource('pad', LOOP)
    // Width 0.5: both gains are 1, and the step is the step before it, sample for sample.
    for (const pan of [-0.5, 0.7]) {
      const before = st.render(pad, { build: STEP.midSide, pan, width: 0.5 })
      const after = st.render(pad, { build: STEP.width, pan, width: 0.5 })
      for (const channel of [0, 1]) {
        expect(same(tap(before, 'built', channel), tap(after, 'built', channel))).toBe(true)
      }
    }
    // Width 1, the pad in mono placed halfway left: the scatter's copies add power.
    const level = (build: number) => together(st.render(pad, { build, width: 1 }), 'built')
    expect(level(STEP.scatter) - level(STEP.bass)).toBeGreaterThan(SCATTER_ADDS)
    // At Width 1 the delay moves the right channel in time and leaves the size of each lane
    // nearly alone (0.18 dB at most, measured). Between 0.85 and 1 it does not make the side larger.
    for (const width of [0.9, 0.95, 1]) {
      const without = st.render(pad, { build: STEP.scatter, width })
      const withIt = st.render(pad, { build: STEP.delay, width })
      const change = (lane: string) => levelDb(tap(withIt, lane)) - levelDb(tap(without, lane))
      expect(change('builtSide')).toBeLessThan(0)
      if (width < 1) continue
      for (const lane of ['builtLeft', 'builtRight', 'builtMid', 'builtSide']) {
        expect(Math.abs(change(lane))).toBeLessThan(0.5)
      }
    }
  })
})

describe('the settings file', () => {
  it('renders every named set on its own source, and plays a tap that sounds', async () => {
    const st = await lab('stereo')
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = await played(st, name)
      const sounding = set.tap ?? 'out'
      expect(result.taps[sounding]!.kind, `${name} plays sound`).toBe('audio')
      const level = levelDb(tap(result, sounding))
      expect(level, `${name} is not silent`).toBeGreaterThan(-45)
      expect(level, `${name} is not at full scale`).toBeLessThan(-3)
    }
  })

  it('places the guitar as its cards say: the same on both sides in the middle, and 7.7 dB between them halfway left (claim card-placed)', async () => {
    const st = await lab('stereo')
    const middle = await played(st, 'middle')
    expectWritten(Math.abs(rightUnderLeft(middle, 'placed')), 'less than 0.001 dB')
    const placed = await played(st, 'placed')
    expectWritten(rightUnderLeft(placed, 'placed'), '7.7 dB')
  })

  it('moves the placed guitar from 7.7 dB between the speakers to only 9.1 dB at Width 0.75, where a 1 kHz tone at the same Pan goes to 19.1 dB (claim way-pushed)', async () => {
    const st = await lab('stereo')
    const pushed = await played(st, 'pushed')
    expectWritten(rightUnderLeft(pushed, 'going'), '7.7 dB')
    expectWritten(rightUnderLeft(pushed, 'out'), '9.1 dB')
    const { values } = resolveSet(st.description, settings.sets.pushed!)
    const result = st.render(tone(), values)
    expectWritten(rightUnderLeft(result, 'going'), '7.7 dB')
    expectWritten(rightUnderLeft(result, 'out'), '19.1 dB')
    // More of the guitar than of the tone is in the bass path, which Width does not push out.
    const underLeft = (r: RenderResult) => levelDb(tap(r, 'goingLeft')) - levelDb(tap(r, 'bass'))
    expect(underLeft(pushed)).toBeLessThan(6)
    expect(underLeft(result)).toBeGreaterThan(12)
  })

  it('puts the hard-left guitar in the right speaker 7.7 dB under the left and −0.71 alike at Width 0.75, and leaves one speaker 1.7 dB less of it (claim fault-over, claim fault-over-one)', async () => {
    const st = await lab('stereo')
    const over = await played(st, 'over')
    expect(tap(over, 'going', 1).every((v) => v === 0)).toBe(true)
    expectWritten(rightUnderLeft(over, 'out'), '7.7 dB')
    expectWritten(alike(tap(over, 'out', 0), tap(over, 'out', 1)), '−0.71')
    expectWritten(levelDb(tap(over, 'goingMid')) - levelDb(tap(over, 'mono')), '1.7 dB')
    // At the device's own default nothing is turned over: the right speaker has only what the
    // narrowed bass puts there, far under the left and the same way up.
    const rest = await played(st, 'over', settings.defaults!.values)
    expect(rightUnderLeft(rest, 'out')).toBeGreaterThan(15)
    expect(alike(tap(rest, 'out', 0), tap(rest, 'out', 1))).toBeGreaterThan(0)
  })

  it('pulls the pad in at Width 0.25: left and right 0.81 alike, from 0.48, its side 3.8 dB quieter and one speaker no quieter (claim tucked, claim way-tucked)', async () => {
    const st = await lab('stereo')
    const result = await played(st, 'tucked')
    expectWritten(alike(tap(result, 'going', 0), tap(result, 'going', 1)), '0.48')
    expectWritten(alike(tap(result, 'out', 0), tap(result, 'out', 1)), '0.81')
    expectWritten(levelDb(tap(result, 'goingSide')) - levelDb(tap(result, 'outSide')), '3.8 dB')
    expect(levelDb(tap(result, 'mono'))).toBeGreaterThanOrEqual(levelDb(tap(result, 'goingMid')))
  })

  it('widens the pad at Width 0.65 to 0.23 alike, from 0.48, for 1.0 dB on one speaker (claim way-gentle)', async () => {
    const st = await lab('stereo')
    const result = await played(st, 'gentle')
    expectWritten(alike(tap(result, 'going', 0), tap(result, 'going', 1)), '0.48')
    expectWritten(alike(tap(result, 'out', 0), tap(result, 'out', 1)), '0.23')
    expectWritten(levelDb(tap(result, 'goingMid')) - levelDb(tap(result, 'mono')), '1.0 dB')
  })

  it('plays the pad at Width 1 as one speaker gets it, 5.6 dB louder than one speaker got going in (claim way-one)', async () => {
    const st = await lab('stereo')
    const result = await played(st, 'full-one')
    expect(settings.sets['full-one']!.tap).toBe('mono')
    expectWritten(levelDb(tap(result, 'mono')) - levelDb(tap(result, 'goingMid')), '5.6 dB')
  })

  it('spreads each hit of the drums at Width 1: groups 10.67 ms apart, the last starting 42.67 ms after its sample on the left, the level within 0.1 dB and the loudest sample 2.2 dB higher (claim smear, claim loud-drums)', async () => {
    const st = await lab('stereo')
    const { values } = resolveSet(st.description, settings.sets.smear!)
    // One sample: where each of its five groups starts on the left.
    const starts = runStarts(tap(st.render(oneSample(), values), 'out'), AT)
    expect(starts).toHaveLength(5)
    expectWritten(ms(starts[1]! - starts[0]!), '10.67 ms')
    expectWritten(ms(starts[4]! - starts[3]!), '10.67 ms')
    expectWritten(ms(starts[4]!), '42.67 ms')
    // The drums.
    const result = await played(st, 'smear')
    const peakOf = (x: Float32Array) => x.reduce((top, v) => Math.max(top, Math.abs(v)), 0)
    const into = Math.max(peakOf(tap(result, 'going', 0)), peakOf(tap(result, 'going', 1)))
    const out = Math.max(peakOf(tap(result, 'out', 0)), peakOf(tap(result, 'out', 1)))
    expectWritten(gainToDb(out / into), '2.2 dB')
    expectWritten(Math.abs(together(result, 'out') - together(result, 'going')), 'less than 0.1 dB')
  })

  it("starts the page's device table from the device's own default: the settings file's Width is the one the device and its parameter table start at", async () => {
    const st = await lab('stereo')
    // This device's device.json names a parameter table and does not list the parameters, so
    // the default is read where the engine holds it: the device's header and that table.
    const read = (file: string) =>
      fs.readFileSync(fileURLToPath(new URL(`../../../${file}`, import.meta.url)), 'utf8')
    const device = JSON.parse(read('cpp/devices/stereo-widener/device.json')) as { params: string }
    const header = /kDefaultWidth = ([\d.]+)f/.exec(
      read('cpp/devices/stereo-widener/stereo_widener_device.h'),
    )
    const table = /width: \{[^}]*?default: ([\d.]+)/s.exec(read(device.params))
    expect(header, 'the header states the default').not.toBeNull()
    expect(table, 'the parameter table states the default').not.toBeNull()
    const { values } = resolveSet(st.description, { values: settings.defaults!.values })
    expect(values.width).toBe(Number(header![1]))
    expect(values.width).toBe(Number(table![1]))
    // Only what differs from the lab's start is written down, and only the device's parameter.
    expect(Object.keys(settings.defaults!.values)).toEqual(['width'])
    expect(st.description.controls.find((one) => one.id === 'width')!.initial).not.toBe(
      values.width,
    )
  })
})
