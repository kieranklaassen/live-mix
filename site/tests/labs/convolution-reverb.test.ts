import { describe, expect, it } from 'vitest'
import { roomImpulse, withRoom } from '../../src/lab/room.ts'
import type { RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  click,
  differenceDb,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  peak,
  RATE,
  rms,
  seconds,
} from './support.ts'

// The lab's starting controls, for asking the engine for the same room the lab is handed.
const START = { decay: 3, predelay: 20, swell: 40, bright: 7000, dark: 900, grain: 0 }

/** The loop the page plays: four seconds. */
const LOOP = seconds(4)

const room = async () => withRoom(await lab('convolution-reverb'))

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings('convolution-reverb')!

/** A named set as its card plays it: on its own source, with `over` laid on its values. */
async function played(name: string, over: Record<string, number> = {}) {
  const theLab = await room()
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(theLab.description, set)
  const dry = await benchSource(source!, LOOP)
  return { dry, result: theLab.render(dry, { ...values, ...over }), values }
}

const left = (result: RenderResult, id: string) => result.taps[id]!.channels_data[0]!
const right = (result: RenderResult, id: string) => result.taps[id]!.channels_data[1]!
const levelOf = (x: Float32Array) => gainToDb(rms(x))

/** The level of the quietest tenth of a second of a sound, in dB against full scale. */
function quietest(x: Float32Array): number {
  const window = seconds(0.1)
  let least = Infinity
  for (let from = 0; from + window <= x.length; from += seconds(0.01)) {
    least = Math.min(least, rms(x, from, from + window))
  }
  return gainToDb(least)
}

/** The level of the loudest hundredth of a second of a sound, as a plain size. */
function loudestHundredth(x: Float32Array): number {
  const window = seconds(0.01)
  let most = 0
  for (let from = 0; from + window <= x.length; from += seconds(0.001)) {
    most = Math.max(most, rms(x, from, from + window))
  }
  return most
}

/**
 * How many separate echoes an impulse holds: the runs of samples that stand over 15 % of its
 * largest, a run ending where half a millisecond passes with none.
 */
function echoes(h: Float32Array): number {
  const top = peak(h)
  let count = 0
  let last = -Infinity
  for (let i = 0; i < h.length; i += 1) {
    if (Math.abs(h[i]!) <= 0.15 * top) continue
    if (i - last > 24) count += 1
    last = i
  }
  return count
}

/** When the impulse has all but a millionth of its energy behind it, in seconds from its start. */
function energy60(result: RenderResult): number {
  const energy = result.taps.energy!
  const curve = energy.channels_data[0]!
  let k = 0
  while (k < curve.length && curve[k]! > -60) k += 1
  return energy.x0 + ((energy.x1 - energy.x0) * k) / (curve.length - 1)
}

/** The time for the level to fall 60 dB, from a line fitted to its level in dB over the middle of the tail. */
function fittedDecay(h: Float32Array, predelaySec: number, decaySec: number): number {
  const window = 2400 // 50 ms
  const ts: number[] = []
  const dbs: number[] = []
  for (let t = predelaySec + 0.1 * decaySec; t < predelaySec + 0.8 * decaySec; t += 0.05) {
    const at = seconds(t)
    ts.push(t)
    dbs.push(gainToDb(rms(h, at, at + window)))
  }
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const mt = mean(ts)
  const md = mean(dbs)
  let above = 0
  let below = 0
  for (let i = 0; i < ts.length; i += 1) {
    above += (ts[i]! - mt) * (dbs[i]! - md)
    below += (ts[i]! - mt) ** 2
  }
  return -60 / (above / below)
}

/** Roughly the band the engine sets the room's level in: a one-pole each way, twice over. */
function levelBand(x: Float32Array): Float32Array {
  const y = x.slice()
  for (let pass = 0; pass < 2; pass += 1) {
    const high = Math.exp((-2 * Math.PI * 150) / RATE)
    const low = 1 - Math.exp((-2 * Math.PI * 1500) / RATE)
    let highIn = 0
    let highOut = 0
    let lowOut = 0
    for (let i = 0; i < y.length; i += 1) {
      highOut = high * (highOut + y[i]! - highIn)
      highIn = y[i]!
      lowOut += low * (highOut - lowOut)
      y[i] = lowOut
    }
  }
  return y
}

/** The mean level, in dB, of a block of the impulse's picture: columns as parts of its length, rows in hertz. */
function pictureLevel(
  picture: { channels_data: Float32Array[]; columns: number },
  from: number,
  to: number,
  lowHz: number,
  highHz: number,
): number {
  const rows = 513
  const data = picture.channels_data[0]!
  let power = 0
  let count = 0
  for (
    let col = Math.round(from * picture.columns);
    col < Math.round(to * picture.columns);
    col += 1
  ) {
    for (let row = Math.round(lowHz / 46.875); row <= Math.round(highHz / 46.875); row += 1) {
      power += 10 ** (data[col * rows + row]! / 10)
      count += 1
    }
  }
  return 10 * Math.log10(power / count)
}

/** The build's sound at a step, with the lift the lab gave it taken off again: its true size. */
function builtAt(result: RenderResult, channel = 0): Float32Array {
  const lift = 10 ** ((result.checks.builtLift ?? 0) / 20)
  return result.taps.built!.channels_data[channel]!.map((v) => v / lift)
}

/** How far under the whole reverb a build step's sound is, in dB, on the left channel. */
const underTheWhole = (step: RenderResult) => levelOf(left(step, 'wet')) - levelOf(builtAt(step))

/**
 * The sum of every stamp at 64 moments spread over the loop, done term by term here, and how
 * far a build step's sound is from it there, in dB.
 */
function againstEveryStamp(step: RenderResult, dry: Float32Array): number {
  const h = left(step, 'impulse')
  const y = builtAt(step)
  const frames = dry.length
  let apart = 0
  let whole = 0
  for (let j = 0; j < 64; j += 1) {
    const n = Math.floor((j * frames) / 64) + 1234
    let sum = 0
    for (let k = 0; k < frames; k += 1) sum += h[k]! * dry[(n - k + frames) % frames]!
    apart += (y[n]! - sum) ** 2
    whole += sum * sum
  }
  return 10 * Math.log10(apart / whole)
}

describe('convolution reverb', () => {
  it('is a sound lab on the drums: every tap says something, loops, and answers to every control', async () => {
    const theLab = await room()
    const drums = await benchSource('drums', LOOP)
    expectSoundLab(theLab, drums, theLab.render(drums, {}))
  })

  it('builds the reverb a piece at a time, and its product of spectra returns the impulse the engine wrote', async () => {
    const theLab = await room()
    expectBuild(theLab, await benchSource('drums', LOOP))
  })

  it('is handed the same room for the same settings, sample for sample, and a different one left and right (claim same-room)', async () => {
    const theLab = await room()
    const drums = await benchSource('drums', LOOP)
    const first = theLab.render(drums, {}).taps.impulse!
    const again = theLab.render(drums, {}).taps.impulse!
    expect(again.channels_data[0]!.every((v, i) => v === first.channels_data[0]![i])).toBe(true)
    expect(again.channels_data[1]!.every((v, i) => v === first.channels_data[1]![i])).toBe(true)
    expect(differenceDb(first.channels_data[1]!, first.channels_data[0]!)).toBeGreaterThan(0)
  })

  it('gives back the impulse itself for a single sample in (claim click-returns-impulse)', async () => {
    const theLab = await room()
    const out = theLab.render(click(LOOP), {})
    for (const channel of [0, 1]) {
      const wet = out.taps.wet!.channels_data[channel]!
      const impulse = out.taps.impulse!.channels_data[channel]!
      expectWritten(-differenceDb(wet, impulse), 'more than 120 dB')
    }
  })

  it('leaves the gaps between the drum hits empty when dry, and fills them with the room (claim dry-gap, claim gap-filled)', async () => {
    const dry = await played('dry')
    expectWritten(quietest(dry.dry.left), '−104 dB')
    const hall = await played('hall')
    expectWritten(quietest(left(hall.result, 'out')), '−41 dB')
  })

  it('does not fill the gaps with ten echoes (claim few-echoes, claim echoes-gap)', async () => {
    const { result } = await played('echoes')
    expectWritten(echoes(left(result, 'impulse')), '10')
    expectWritten(quietest(left(result, 'out')), '−102 dB')
    // They are the hit again: all within a tenth of a second of it.
    const impulse = left(result, 'impulse')
    expect(impulse.subarray(seconds(0.1)).every((v) => v === 0)).toBe(true)
  })

  it('lays down a copy of the impulse for each sample set by hand, at its time and of its size (claim copy-scaled)', async () => {
    const theLab = await room()
    const drums = await benchSource('drums', LOOP)
    const out = theLab.render(drums, {})
    const one = left(out, 'stampOne')
    const two = left(out, 'stampTwo')
    // The three samples, where the lab puts them and as large as the controls say.
    const hand = left(out, 'hand')
    const set = [...hand].flatMap((v, i) => (v !== 0 ? [[i, v]] : []))
    expect(set).toEqual([
      [seconds(0.1), 1],
      [seconds(0.4), 0.5],
      [seconds(0.7), 0.75],
    ])
    // Copy two is copy one at half the size, as much later as sample two is after sample one.
    const later = set[1]![0]! - set[0]![0]!
    expectWritten(later / RATE, '0.3 s')
    expect(two.every((v, i) => v === Math.fround(0.5 * one[(i - later + LOOP) % LOOP]!))).toBe(true)
    // And copy one is the impulse as it is turned up, moved to where sample one is.
    const loud = left(out, 'room')
    expect(one.every((v, i) => v === loud[(i - set[0]![0]! + LOOP) % LOOP])).toBe(true)
  })

  it('adds the copies and nothing else: with sample two at 0 the sum is copies one and three, sample for sample (claim copies-add)', async () => {
    const theLab = await room()
    const drums = await benchSource('drums', LOOP)
    const sum = (out: RenderResult, ids: string[]) =>
      left(out, 'handSum').every(
        (v, i) => v === ids.reduce((total, id) => Math.fround(total + left(out, id)[i]!), 0),
      )
    expect(sum(theLab.render(drums, {}), ['stampOne', 'stampTwo', 'stampThree'])).toBe(true)
    const without = theLab.render(drums, { two: 0 })
    expect(left(without, 'stampTwo').every((v) => v === 0)).toBe(true)
    expect(sum(without, ['stampOne', 'stampThree'])).toBe(true)
  })

  it('turns the impulse and its copies up by 30.2 dB at the starting room, so the largest sample is one half (claim lift)', async () => {
    const theLab = await room()
    const out = theLab.render(await benchSource('drums', LOOP), {})
    expectWritten(out.checks.lift!, '30.2 dB')
    expect(Math.max(peak(left(out, 'room')), peak(right(out, 'room')))).toBeCloseTo(0.5, 5)
    const gain = 10 ** (out.checks.lift! / 20)
    expect(
      differenceDb(
        left(out, 'room'),
        left(out, 'impulse').map((v) => v * gain),
      ),
    ).toBeLessThan(-120)
  })

  // The build, a step at a time. Each number is measured on the drums at the starting room, on
  // the left channel, and then again with its piece switched off: at the step before.

  it("stamps the impulse once for one sample: the build's first step is the impulse times that sample, at its place (claim one-stamp)", async () => {
    const theLab = await room()
    const drums = await benchSource('drums', LOOP)
    const step = theLab.render(drums, { build: 0 })
    for (const channel of [0, 1]) {
      const stamped = step.taps.builtIn!.channels_data[channel]!
      const at = stamped.findIndex((v) => v !== 0)
      expect(stamped.filter((v) => v !== 0).length).toBe(1)
      expect(stamped[at]).toBe([drums.left, drums.right][channel]![at])
      const h = step.taps.impulse!.channels_data[channel]!
      const expected = h.map((_, n) => stamped[at]! * h[(n - at + LOOP) % LOOP]!)
      expect(differenceDb(builtAt(step, channel), expected)).toBeLessThan(-120)
    }
    expectWritten(underTheWhole(step), '36.5 dB')
  })

  it('adds three stamps for three samples, 31.6 dB under the whole reverb, and one stamp alone is not (claim three-stamps)', async () => {
    const theLab = await room()
    const drums = await benchSource('drums', LOOP)
    const step = theLab.render(drums, { build: 1 })
    const stamped = left(step, 'builtIn')
    expect(stamped.filter((v) => v !== 0).length).toBe(3)
    expectWritten(underTheWhole(step), '31.6 dB')
    // The piece switched off: the step before, one stamp.
    expect(matchesWritten(underTheWhole(theLab.render(drums, { build: 0 })), '31.6 dB')).toBe(false)
  })

  it('stamps a run of 240 samples, 5 ms of the loop, 13.7 dB under the whole reverb, and three stamps are not (claim run-of-stamps)', async () => {
    const theLab = await room()
    const drums = await benchSource('drums', LOOP)
    const step = theLab.render(drums, { build: 2 })
    const stamped = left(step, 'builtIn')
    const first = stamped.findIndex((v) => v !== 0)
    const last = stamped.findLastIndex((v) => v !== 0)
    expect(last - first + 1).toBeLessThanOrEqual(240)
    expect(last - first + 1).toBeGreaterThan(230)
    // The run is the loop's own samples, from the first one stamped on.
    expect(stamped.subarray(first, first + 240)).toEqual(drums.left.subarray(first, first + 240))
    expectWritten(240, '240 samples')
    expectWritten((240 * 1000) / RATE, '5 ms')
    expectWritten(underTheWhole(step), '13.7 dB')
    expect(matchesWritten(underTheWhole(theLab.render(drums, { build: 1 })), '13.7 dB')).toBe(false)
  })

  it('gets every stamp at once from the product of spectra: at 64 moments it is the sum done term by term, and the run of stamps is not (claim transform-agrees)', async () => {
    const theLab = await room()
    const drums = await benchSource('drums', LOOP)
    const step = theLab.render(drums, { build: 3 })
    expectWritten(againstEveryStamp(step, drums.left), 'less than −120 dB')
    expect(left(step, 'built')).toEqual(left(step, 'wet'))
    expect(
      matchesWritten(
        againstEveryStamp(theLab.render(drums, { build: 2 }), drums.left),
        'less than −120 dB',
      ),
    ).toBe(false)
  })

  it("returns the engine's impulse for one unit sample through the build's product of spectra, in every room and loop tried (claim unit-through)", async () => {
    const theLab = await room()
    const rooms = [
      {},
      { decay: 0.3 },
      { decay: 6 },
      { grain: 1 },
      { used: 100 },
      { predelay: 200, swell: 200 },
      { bright: 16000, dark: 7000 },
      { bright: 1000, dark: 200 },
    ]
    const drums = await benchSource('drums', LOOP)
    for (const values of rooms) {
      const out = theLab.render(drums, { ...values, build: 3 })
      expectWritten(-out.checks.builtDifference!, 'more than 130 dB')
    }
    for (const length of [1, 2, 6, 8]) {
      const loop = await benchSource('drums', seconds(length))
      const out = theLab.render(loop, { build: 3 }, seconds(length))
      expectWritten(-out.checks.builtDifference!, 'more than 130 dB')
    }
  })

  it('puts the dry drums beside their reverb: together 0.2 dB over the dry drums, where the reverb alone is 3.2 dB under (claim send-level)', async () => {
    const theLab = await room()
    const drums = await benchSource('drums', LOOP)
    const over = (step: RenderResult) => levelOf(builtAt(step)) - levelOf(drums.left)
    const beside = theLab.render(drums, { build: 4 })
    expectWritten(over(beside), '0.2 dB')
    expect(left(beside, 'built')).toEqual(left(beside, 'out'))
    // The piece switched off: the step before, the reverb alone.
    const alone = theLab.render(drums, { build: 3 })
    expectWritten(-over(alone), '3.2 dB')
    expect(matchesWritten(over(alone), '0.2 dB')).toBe(false)
  })

  it('counts what the sum costs as written, and what the transform costs (claim sum-cost, claim run-cost, claim transform-cost)', () => {
    const impulse = roomImpulse(START).left.length
    expectWritten(impulse, '144,960 samples')
    expectWritten(LOOP, '192,000 samples')
    expectWritten((LOOP * impulse) / 1e9, '27.8 billion')
    expectWritten((240 * impulse) / 1e6, '34.8 million')
    // The transform that holds the loop and its tail: the power of two that fits both.
    let size = 1
    while (size < 2 * LOOP - 1) size *= 2
    expectWritten(size, '524,288')
    expectWritten(((size / 2) * Math.log2(size)) / 1e6, '5.0 million')
  })

  it('gets the same answer from the product of spectra as from the sum done term by term (claim sums-agree)', async () => {
    const theLab = await room()
    for (const id of ['drums', 'guitar', 'noise']) {
      const source = await benchSource(id, LOOP)
      const out = theLab.render(source, {})
      expectWritten(out.checks.sums!, 'less than −110 dB')
      // And the two are not both nothing.
      expect(rms(out.taps.direct!.channels_data[0]!)).toBeGreaterThan(1e-4)
    }
  })

  it('keeps the loop as it sounds the tenth time round: on half a second of drums in a room of 0.3 s, the same as the sum over a loop that never stops (claim loop-wraps)', async () => {
    const theLab = await room()
    const frames = seconds(0.5)
    const drums = await benchSource('drums', frames)
    // A room of 0.3 s on a loop of half a second, so the sum term by term stays small enough to
    // do here. The tail of each pass is still ringing when the next begins.
    const out = theLab.render(drums, { decay: 0.3 }, frames)
    const taps = roomImpulse({ ...START, decay: 0.3 }).left
    const expected = new Float32Array(frames)
    for (let n = 0; n < frames; n += 1) {
      let sum = 0
      for (let k = 0; k < taps.length; k += 1)
        sum += taps[k]! * drums.left[(n - k + frames) % frames]!
      expected[n] = sum
    }
    expectWritten(differenceDb(out.taps.wet!.channels_data[0]!, expected), 'less than −110 dB')
  })

  it('folds an impulse longer than the loop back onto the loop', async () => {
    const theLab = await room()
    const frames = seconds(1)
    const out = theLab.render(click(frames), { decay: 3 }, frames)
    const h = roomImpulse(START).left
    const folded = new Float32Array(frames)
    for (let n = 0; n < h.length; n += 1) folded[n % frames]! += h[n]!
    expect(differenceDb(out.taps.impulse!.channels_data[0]!, folded)).toBeLessThan(-120)
    expect(differenceDb(out.taps.wet!.channels_data[0]!, folded)).toBeLessThan(-110)
  })

  // The room the engine writes.

  it('falls 60 dB in 2.95 s at the starting decay of 3 s, and within 5 % of the decay it is set to (claim decay-time)', () => {
    expectWritten(fittedDecay(roomImpulse(START).left, 0.02, 3), '2.95 s')
    for (const decay of [1, 3, 5]) {
      const h = roomImpulse({ ...START, decay }).left
      const measured = fittedDecay(h, 0.02, decay)
      expect(measured).toBeGreaterThan(decay * 0.95)
      expect(measured).toBeLessThan(decay * 1.05)
    }
  })

  it('has 60 dB of its energy behind it 2.7 s into the starting room (claim energy-60)', async () => {
    const theLab = await room()
    expectWritten(energy60(theLab.render(click(LOOP), {})), '2.7 s')
  })

  it('loses its top as it goes: 5 kHz against 500 Hz, a tenth of the way in and two thirds of the way in (claim dark-end)', async () => {
    const theLab = await room()
    const picture = theLab.render(click(LOOP), {}).taps.picture!
    const early =
      pictureLevel(picture, 0.05, 0.15, 4500, 5500) - pictureLevel(picture, 0.05, 0.15, 400, 600)
    const late =
      pictureLevel(picture, 0.6, 0.7, 4500, 5500) - pictureLevel(picture, 0.6, 0.7, 400, 600)
    expectWritten(-early, '4 dB')
    expectWritten(-late, '17 dB')
  })

  it('swells in: 95 % of the way up after the swell time (claim swell-95)', () => {
    // The same noise with a swell and without one: their ratio is the swell alone, but for the
    // level each was scaled to, which the ratio late in the tail gives.
    const pre = seconds(0.02)
    const flat = roomImpulse({ ...START, swell: 0 }).left
    for (const swell of [40, 200]) {
      const swelled = roomImpulse({ ...START, swell }).left
      const ratio = (sec: number) => swelled[pre + seconds(sec)]! / flat[pre + seconds(sec)]!
      expectWritten((100 * ratio(swell / 1000)) / ratio(2), '95 %')
    }
  })

  it('gives white noise back about 5 dB quieter than it went in (claim white-quieter)', async () => {
    const theLab = await room()
    const white = await benchSource('noise', LOOP)
    const wet = left(theLab.render(white, {}), 'wet')
    expectWritten(levelOf(white.left) - levelOf(wet), '5 dB')
  })

  it('gives noise in the low mids back as loud as it went in, within 1.5 dB (claim band-as-loud)', async () => {
    const theLab = await room()
    const white = await benchSource('noise', LOOP)
    const band = { left: levelBand(white.left), right: levelBand(white.right) }
    const out = theLab.render(band, {})
    for (const [channel, dry] of [band.left, band.right].entries()) {
      const change = gainToDb(rms(out.taps.wet!.channels_data[channel]!) / rms(dry))
      expectWritten(Math.abs(change), 'less than 1.5 dB')
    }
  })

  it('gives sines at 220, 440 and 1,000 Hz back anywhere from 4 dB quieter to 6 dB louder: a room of noise is ragged (claim tones-vary)', async () => {
    const theLab = await room()
    const changes = [220, 440, 1000].map((hz) => {
      const tone = {
        left: Float32Array.from(
          { length: LOOP },
          (_, i) => 0.5 * Math.sin((2 * Math.PI * hz * i) / RATE),
        ),
        right: Float32Array.from(
          { length: LOOP },
          (_, i) => 0.5 * Math.sin((2 * Math.PI * hz * i) / RATE),
        ),
      }
      return levelOf(left(theLab.render(tone, {}), 'wet')) - levelOf(tone.left)
    })
    expectWritten(-Math.min(...changes), '4 dB')
    expectWritten(Math.max(...changes), '6 dB')
  })

  it('has a response that is ragged bin by bin: between 150 Hz and 1,500 Hz from 18 dB under to 7 dB over (claim ragged)', async () => {
    const theLab = await room()
    const out = theLab.render(await benchSource('drums', LOOP), {})
    const response = out.taps.response!
    const bins = response.channels_data[0]!
    const mean = out.taps.responseMean!.channels_data[0]!
    const hz = (point: number) =>
      response.x0 * (response.x1 / response.x0) ** (point / (bins.length - 1))
    let least = Infinity
    let most = -Infinity
    let power = 0
    let count = 0
    for (let point = 0; point < bins.length; point += 1) {
      if (hz(point) < 150 || hz(point) > 1500) continue
      least = Math.min(least, bins[point]!)
      most = Math.max(most, bins[point]!)
      power += 10 ** (mean[point]! / 10)
      count += 1
    }
    expectWritten(-least, '18 dB')
    expectWritten(most, '7 dB')
    // Averaged, the band is near unit gain: that is the engine's rule for the room's level.
    expect(Math.abs(10 * Math.log10(power / count))).toBeLessThan(1.5)
  })

  it('returns a sine as a sine: what is not at its frequency is more than 120 dB under what is (claim no-new-tones)', async () => {
    const theLab = await room()
    const tone = await benchSource('sine', LOOP)
    const wet = left(theLab.render(tone, {}), 'wet')
    // What is left of the reverb once the best sine at 440 Hz has been taken out of it.
    const turn = (i: number) => (2 * Math.PI * 440 * i) / RATE
    let sin = 0
    let cos = 0
    for (let i = 0; i < LOOP; i += 1) {
      sin += wet[i]! * Math.sin(turn(i))
      cos += wet[i]! * Math.cos(turn(i))
    }
    sin *= 2 / LOOP
    cos *= 2 / LOOP
    let rest = 0
    let whole = 0
    for (let i = 0; i < LOOP; i += 1) {
      rest += (wet[i]! - sin * Math.sin(turn(i)) - cos * Math.cos(turn(i))) ** 2
      whole += wet[i]! ** 2
    }
    expect(whole).toBeGreaterThan(0)
    expectWritten(-10 * Math.log10(rest / whole), 'more than 120 dB')
  })

  it('comes back as loud whatever its length: white noise 4.9 dB quieter at a decay of 0.5 s and 5.0 dB quieter at 6 s (claim length-not-level)', async () => {
    const theLab = await room()
    const white = await benchSource('noise', LOOP)
    const quieter = (decay: number) =>
      levelOf(white.left) - levelOf(left(theLab.render(white, { decay }), 'wet'))
    expectWritten(quieter(0.5), '4.9 dB')
    expectWritten(quieter(6), '5.0 dB')
  })

  // The lesson's own controls.

  it('uses only as much of the impulse as it is told to (claim used-only)', async () => {
    const { result, values } = await played('cutroom')
    const impulse = left(result, 'impulse')
    const cut = seconds(values.used! / 1000)
    expect(impulse.subarray(cut).every((v) => v === 0)).toBe(true)
    expect(impulse.subarray(960, cut).some((v) => v !== 0)).toBe(true)
    // Under the pre-delay there is no impulse yet, and so no reverb.
    const theLab = await room()
    const drums = await benchSource('drums', LOOP)
    const none = theLab.render(drums, { used: 10 })
    expect(none.taps.wet!.channels_data[0]!.every((v) => v === 0)).toBe(true)
  })

  it('adds the reverb to the dry loop at the send level', async () => {
    const theLab = await room()
    const drums = await benchSource('drums', LOOP)
    const out = theLab.render(drums, { send: -6 })
    const gain = 10 ** (-6 / 20)
    const sum = out.taps.out!.channels_data[0]!
    const wet = out.taps.wet!.channels_data[0]!
    const expected = drums.left.map((x, i) => x + gain * wet[i]!)
    expect(differenceDb(sum, expected)).toBeLessThan(-120)
  })

  // The cards.

  it('renders every named set: a sound that is finite, not silent and under full scale', async () => {
    for (const name of Object.keys(settings.sets)) {
      const { result } = await played(name)
      const tap = settings.sets[name]!.tap ?? 'out'
      for (const data of result.taps[tap]!.channels_data) {
        expect(
          data.every((v) => Number.isFinite(v)),
          `${name} is finite`,
        ).toBe(true)
        expect(rms(data), `${name} is not silent`).toBeGreaterThan(1e-4)
        expect(peak(data), `${name} is under full scale`).toBeLessThan(1)
      }
    }
  })

  it('fills the gaps of the drums in a short room and leaves them far under the hits (claim use-drums)', async () => {
    const { result } = await played('drumroom')
    expectWritten(quietest(left(result, 'out')), '−52 dB')
  })

  it('gives a ringing line more reverb than it gives drums, before the send (claim use-line)', async () => {
    const line = await played('line')
    expectWritten(levelOf(left(line.result, 'wet')) - levelOf(line.dry.left), '0.3 dB')
    const drums = await played('drumroom')
    expectWritten(levelOf(drums.dry.left) - levelOf(left(drums.result, 'wet')), '2.9 dB')
  })

  it('makes the pad with its long room 1.7 dB louder than the pad alone (claim use-pad)', async () => {
    const { dry, result } = await played('wash')
    expectWritten(levelOf(left(result, 'out')) - levelOf(dry.left), '1.7 dB')
  })

  it('has the small room over in under half a second (claim use-small)', async () => {
    const { result } = await played('small')
    expectWritten(energy60(result), '0.46 s')
  })

  it('answers nothing for the whole of the pre-delay (claim pre-silent)', async () => {
    const { result, values } = await played('pre')
    const silent = seconds(values.predelay! / 1000)
    for (const channel of [0, 1]) {
      const impulse = result.taps.impulse!.channels_data[channel]!
      expect(impulse.subarray(0, silent).every((v) => v === 0)).toBe(true)
      expect(impulse.subarray(silent, silent + seconds(0.05)).some((v) => v !== 0)).toBe(true)
    }
  })

  it('stays as long when it is made darker: a decay of 2.9 s by the fitted line (claim darker-as-long)', async () => {
    const { values } = await played('darker')
    const h = roomImpulse({ ...START, bright: values.bright!, dark: values.dark! }).left
    expect(values.decay).toBe(3)
    expectWritten(fittedDecay(h, 0.02, 3), '2.9 s')
  })

  it('puts more room than sound with the send right up: the reverb 6.3 dB over the dry line (claim far-level)', async () => {
    const { dry, result, values } = await played('far')
    const gain = 10 ** (values.send! / 20)
    expectWritten(levelOf(left(result, 'wet').map((v) => v * gain)) - levelOf(dry.left), '6.3 dB')
  })

  it('leaves a mix no quiet moment under a long room sent loud (claim mud-gap)', async () => {
    const { dry, result } = await played('mud')
    expectWritten(quietest(dry.left), '−48 dB')
    expectWritten(quietest(left(result, 'out')), '−27 dB')
  })

  it('ends on a step when the impulse is cut before it has died, and on nothing when it is left whole (claim cut-step)', async () => {
    const { result, values } = await played('cuttail')
    const cut = seconds(values.used! / 1000)
    const impulse = left(result, 'impulse')
    const whole = roomImpulse(START).left
    const top = loudestHundredth(whole)
    const hundredth = seconds(0.01)
    expectWritten(gainToDb(top / rms(impulse, cut - hundredth, cut)), '9 dB')
    expect(impulse.subarray(cut).every((v) => v === 0)).toBe(true)
    expectWritten(gainToDb(top / rms(whole, whole.length - hundredth, whole.length)), '92 dB')
  })

  it('prints what the cards could say', async () => {
    for (const name of Object.keys(settings.sets)) {
      const { dry, result } = await played(name)
      const out = left(result, 'out')
      const wet = left(result, 'wet')
      console.log(
        name.padEnd(9),
        'in',
        levelOf(dry.left).toFixed(2),
        'wet',
        levelOf(wet).toFixed(2),
        'out',
        levelOf(out).toFixed(2),
        'out-in',
        (levelOf(out) - levelOf(dry.left)).toFixed(2),
        'wet-in',
        (levelOf(wet) - levelOf(dry.left)).toFixed(2),
        'gap in',
        quietest(dry.left).toFixed(2),
        'gap out',
        quietest(out).toFixed(2),
        'peak',
        Math.max(peak(out), peak(right(result, 'out'))).toFixed(3),
        'energy-60 at',
        energy60(result).toFixed(3),
        'lift',
        result.checks.lift!.toFixed(2),
      )
    }
  })
})
