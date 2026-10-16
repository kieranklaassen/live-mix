import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { TruePeakDetector } from '../../../src/core/analysis/loudness.ts'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  click,
  dbToGain,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  peak,
  POINT_RATE,
  RATE,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

/** With SAY=1 a test prints what it measured: the numbers the lesson states were read here. */
const SAY = process.env.SAY === '1'
const say = (...words: unknown[]) => SAY && console.log(...words)

const most = (x: Float32Array) => x.reduce((top, v) => Math.max(top, v), -Infinity)
const least = (x: Float32Array) => x.reduce((low, v) => Math.min(low, v), Infinity)

/** The true peak of a loop as the engine's own meter reads it (src/core/analysis/loudness.ts), in dB. */
function meterDb(channels: Float32Array[]): number {
  let top = 0
  for (const x of channels) {
    const detector = new TruePeakDetector(RATE)
    // Twice round, so the filter's memory at the loop's start holds the loop's end.
    for (const v of x) detector.push(v)
    for (const v of x) top = Math.max(top, detector.push(v))
  }
  return gainToDb(top)
}

/**
 * The largest size of a loop's wave at `factor` points to the sample, in dB, by a ruler that owes
 * the device nothing: a sinc 32 samples long either side, under a Hann window.
 */
function sincDb(channels: Float32Array[], factor: number): number {
  const half = 32
  const tables = Array.from({ length: factor }, (_, p) => {
    const h = new Float64Array(2 * half)
    for (let k = -half + 1; k <= half; k += 1) {
      const t = k - p / factor
      const window = Math.abs(t) < half ? 0.5 + 0.5 * Math.cos((Math.PI * t) / half) : 0
      h[k + half - 1] = (t === 0 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t)) * window
    }
    return h
  })
  let top = 0
  for (const x of channels) {
    const n = x.length
    // The loop, with its end before its start and its start after its end.
    const round = new Float32Array(n + 2 * half)
    for (let i = 0; i < round.length; i += 1) round[i] = x[(i - half + n) % n]!
    for (let i = 0; i < n; i += 1) {
      for (const h of tables) {
        let y = 0
        for (let k = 0; k < 2 * half; k += 1) y += round[i + 1 + k]! * h[k]!
        top = Math.max(top, Math.abs(y))
      }
    }
  }
  return gainToDb(top)
}

/** The mean power of both channels, in dB. */
const levelDb = (channels: Float32Array[]) =>
  gainToDb(Math.sqrt(channels.reduce((sum, x) => sum + rms(x) ** 2, 0) / channels.length))

const sampleDb = (channels: Float32Array[]) => gainToDb(Math.max(...channels.map(peak)))

const sound = (result: RenderResult, id: string) => result.taps[id]!.channels_data
const value = (result: RenderResult, id: string) => result.taps[id]!.channels_data[0]!

/** A sine at a quarter of the sample rate, 12 kHz, sampled 45 degrees from its crests. */
function quarterTone(frames: number): Source {
  const source = silence(frames)
  for (let i = 0; i < frames; i += 1) {
    source.left[i] = Math.sin(2 * Math.PI * (0.25 * i + 0.125))
    source.right[i] = source.left[i]!
  }
  return source
}

/** A close view's points by their place in samples: 0 is the sample the peak comes out on. */
function near(tap: { channels_data: Float32Array[] }) {
  const data = tap.channels_data[0]!
  return (place: number) => data[place + 144]!
}

/**
 * What of a steady tone is not the tone, in dB against the tone: the second half of a render,
 * with the best sine at `hz` taken out of it. A clean tone leaves nothing; a bent one leaves
 * its new harmonics.
 */
function notTone(x: Float32Array, hz: number): number {
  const from = x.length / 2
  const count = x.length - from
  let sin = 0
  let cos = 0
  for (let i = from; i < x.length; i += 1) {
    const w = (2 * Math.PI * hz * i) / RATE
    sin += x[i]! * Math.sin(w)
    cos += x[i]! * Math.cos(w)
  }
  const a = (2 * sin) / count
  const b = (2 * cos) / count
  let rest = 0
  let tone = 0
  for (let i = from; i < x.length; i += 1) {
    const w = (2 * Math.PI * hz * i) / RATE
    const t = a * Math.sin(w) + b * Math.cos(w)
    rest += (x[i]! - t) ** 2
    tone += t * t
  }
  return 10 * Math.log10(rest / tone)
}

/** How far a steady gain swings once it has settled: the second half of a render, in dB. */
function swing(gain: Float32Array): number {
  const settled = gain.subarray(gain.length / 2)
  return most(settled) - least(settled)
}

/**
 * One click through the build so far, as the lab's two close views of it hold it: the sample
 * the gain first leaves 1 on and the sample the click comes out on, both counted from the
 * sample the click goes in on, and the largest move the gain makes in one sample.
 */
function builtClick(result: RenderResult) {
  const gain = value(result, 'builtClickGain')
  const out = value(result, 'builtClickOut')
  const goesIn = 48 // the lab puts the click 1 ms into a view of a point a sample
  let down = -1
  let step = 0
  for (let n = 1; n < gain.length; n += 1) {
    if (down < 0 && gain[n]! < 1) down = n
    step = Math.max(step, Math.abs(gain[n]! - gain[n - 1]!))
  }
  const comesOut = out.findIndex((v) => Math.abs(v) > 1e-6)
  return {
    down: down < 0 ? Number.NaN : down - goesIn,
    out: comesOut - goesIn,
    step,
    lowest: least(gain),
    height: most(out),
  }
}

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings('limiting')!

/** A named set as its card plays it: on its own source, with `over` laid on its values. */
async function played(limiter: Lab, name: string, over: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source, tap } = resolveSet(limiter.description, set)
  const went = await benchSource(source!, seconds(4))
  return { result: limiter.render(went, { ...values, ...over }), went, tap: tap ?? 'out' }
}

/** How much louder a tap comes out than the loop went in, in mean power, in dB. */
const louder = (one: { result: RenderResult; went: Source }, id = 'out') =>
  levelDb(sound(one.result, id)) - levelDb([one.went.left, one.went.right])

describe('limiting and true peaks', () => {
  it('is a sound lab on the drums: every tap says something, loops, and answers to every control', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const result = limiter.render(drums, {})
    // The ceiling drawn across the close view is one value: that is what a ceiling is.
    expectSoundLab(limiter, drums, result, { quiet: ['nearCeiling'] })
  })

  it("builds a limiter in seven steps on the drums, and the seventh is within the lab's bound of the device", async () => {
    const limiter = await lab('limiting')
    expectBuild(limiter, await benchSource('drums', seconds(4)))
  })

  it("holds the drums pushed 12 dB to the ceiling on the engine's own meter, within 0.01 dB (claim ceiling-held): 0.001 dB over (claim own-ruler-over)", async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const out = sound(limiter.render(drums, { push: 12, ceiling: -1 }), 'out')
    const read = meterDb(out)
    say('ceiling-held: meter', read, 'samples', sampleDb(out))
    expectWritten(Math.abs(read + 1), 'less than 0.01 dB')
    // It is a thousandth of a decibel over, not under.
    expect(read + 1).toBeGreaterThan(0)
    expectWritten(read + 1, '0.001 dB')
    expect(sampleDb(out)).toBeLessThanOrEqual(-1)
    // And at other ceilings, on other sounds.
    for (const [id, ceiling] of [
      ['guitar', -6],
      ['noise', -1],
      ['saw', -12],
    ] as const) {
      const source = await benchSource(id, seconds(2))
      const other = limiter.render(source, { push: 18, ceiling })
      expect(meterDb(sound(other, 'out'))).toBeLessThanOrEqual(ceiling + 0.01)
    }
  })

  it("draws the true peak of what comes out under the ceiling, by the device's own four points", async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const out = limiter.render(drums, { push: 12, ceiling: -1 })
    expect(most(value(out, 'outPeak'))).toBeLessThanOrEqual(-1 + 0.01)
    expect(most(value(out, 'peak'))).toBeGreaterThan(8)
  })

  it('reads 0.14 dB over the ceiling on those drums by a long sinc at 4 points to the sample (claim sharper-ruler-4) and 0.17 dB at 16 (claim sharper-ruler-16)', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const out = sound(limiter.render(drums, { push: 12, ceiling: -1 }), 'out')
    const four = sincDb(out, 4) + 1
    const sixteen = sincDb(out, 16) + 1
    say('sharper-ruler', four, sixteen)
    expectWritten(four, '0.14 dB')
    expectWritten(sixteen, '0.17 dB')
  })

  it('delays a click by 77 samples, the latency the device reports (claim delay-77)', async () => {
    const limiter = await lab('limiting')
    // Half full scale under a ceiling of 0 dB: nothing to turn down.
    const out = limiter.render(click(seconds(0.5), 5000, 0.5), { push: 0, ceiling: 0 })
    for (const data of sound(out, 'out')) {
      expect(data[5077]).toBe(0.5)
      expect(data.filter((v) => v !== 0).length).toBe(1)
      expectWritten(data.findIndex((v) => v !== 0) - 5000, '77 samples')
    }
    expectWritten(out.checks.latency!, '77 samples')
  })

  it('passes drums that stay under the ceiling unchanged but 77 samples late, sample for sample (claim under-unchanged)', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const out = limiter.render(drums, { push: 0, ceiling: 0 })
    const frames = drums.left.length
    const late = (x: Float32Array) => (_: number, i: number) => x[(i - 77 + frames) % frames]!
    expect(sound(out, 'out')[0]).toEqual(drums.left.map(late(drums.left)))
    expect(sound(out, 'out')[1]).toEqual(drums.right.map(late(drums.right)))
    expect(value(out, 'gain').every((v) => v === 0)).toBe(true)
    // What was taken away is exact silence.
    expect(sound(out, 'removed').every((data) => data.every((v) => v === 0))).toBe(true)
  })

  it('finds the highest sample of the drums 18.7 dB over their level (claim crest), and 8.2 dB over full scale once they are pushed 12 dB (claim over-full)', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const went = [drums.left, drums.right]
    say('crest', sampleDb(went) - levelDb(went))
    expectWritten(sampleDb(went) - levelDb(went), '18.7 dB')
    const out = limiter.render(drums, { push: 12, ceiling: -1 })
    say('over-full', sampleDb(sound(out, 'pushed')))
    expectWritten(sampleDb(sound(out, 'pushed')), '8.2 dB')
    // The pushed tap is the input times the push, and nothing else.
    expectWritten(levelDb(sound(out, 'pushed')) - levelDb(went), '12.0 dB')
  })

  it('turns the loudest hit of the drums pushed 12 dB down 9.3 dB (claim deepest), and brings the loop out 6.1 dB higher in mean power (claim louder) with its highest sample 2.8 dB higher (claim peak-rise), and has no point of the gain above 0 dB (claim only-down)', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const out = limiter.render(drums, { push: 12, ceiling: -1 })
    const went = [drums.left, drums.right]
    const deepest = least(value(out, 'gain'))
    const more = levelDb(sound(out, 'out')) - levelDb(went)
    const rise = sampleDb(sound(out, 'out')) - sampleDb(went)
    say('deepest', deepest, 'louder', more, 'rise', rise)
    expectWritten(-deepest, '9.3 dB')
    expectWritten(more, '6.1 dB')
    expectWritten(rise, '2.8 dB')
    // The gain only turns down, here and with everything pushed as far as it goes.
    expectWritten(most(value(out, 'gain')), 'at most 0 dB')
    const hard = limiter.render(drums, { push: 24, ceiling: -20, release: 10 })
    expectWritten(most(value(hard, 'gain')), 'at most 0 dB')
  })

  it("shows the drums' largest peak close to: the delayed sound at 2.56, the gain at 0.34, the output at 0.88 under a ceiling of 0.89 (claim picture-reads), with the gain already down from 0.89 to 0.61 where the hit starts to come out, 1.4 ms before its peak (claim dips-first)", async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const out = limiter.render(drums, {})
    const delayed = near(out.taps.nearDelayed!)
    const gain = near(out.taps.nearGain!)
    const came = near(out.taps.nearOut!)
    expect(out.taps.nearGain!.x0).toBe(-3)
    expect(out.taps.nearGain!.x1).toBe(2)
    expectWritten(delayed(0), '2.56')
    expectWritten(gain(0), '0.34')
    expectWritten(came(0), '0.88')
    expectWritten(near(out.taps.nearCeiling!)(0), '0.89')
    // The output there is the delayed sound times the gain.
    expect(came(0)).toBeCloseTo(delayed(0) * gain(0), 6)
    // The gain is at its lowest on that sample.
    expect(gain(0)).toBe(least(value(out, 'nearGain')))
    // Where the delayed line first leaves zero: the first sample a twentieth of the peak high.
    let starts = -144
    while (Math.abs(delayed(starts)) < 0.05 * delayed(0)) starts += 1
    say('dips-first: starts at', starts, (starts * 1000) / RATE, 'gain there', gain(starts))
    say(
      'dips-first: the gain along the left of the view',
      [-144, -130, -120, -116, -112, -108, -100].map((n) => gain(n)),
    )
    expectWritten((-starts * 1000) / RATE, '1.4 ms')
    expectWritten(gain(starts), '0.61')
    // At the left of the view, 3 ms before the peak, it had not begun to fall.
    expectWritten(gain(-144), '0.89')
    expect(gain(-120)).toBeGreaterThanOrEqual(gain(-144))
    // The clipped copy of the same peak is flat at the ceiling wherever the delayed one is over it.
    const clipped = near(out.taps.nearClipped!)
    const top = near(out.taps.nearCeiling!)(0)
    for (let n = -144; n <= 96; n += 1) {
      expect(clipped(n)).toBe(Math.max(-top, Math.min(top, delayed(n))))
    }
    // What the picture's caption invites. Push at its lowest: the gain is 1 all across, and
    // Output is Delayed.
    const low = limiter.render(drums, { push: -12 })
    expect(value(low, 'nearGain').every((v) => v === 1)).toBe(true)
    expect(value(low, 'nearOut')).toEqual(value(low, 'nearDelayed'))
    // Release at its longest: the gain begins the picture lower, not yet back from the hit before.
    const long = near(limiter.render(drums, { release: 2000 }).taps.nearGain!)
    say('picture: the gain at the left of the view at a release of 2 s', long(-144))
    expect(long(-144)).toBeLessThan(gain(-144) - 0.25)
  })

  it('finds a 12 kHz sine sampled 45 degrees off its crests 3.01 dB over its samples by trigonometry (claim quarter-rate), reads it 3.05 dB over them (claim detector-reads), and turns it down 1.04 dB under a ceiling 2 dB above every sample (claim unseen)', async () => {
    const limiter = await lab('limiting')
    const tone = quarterTone(seconds(0.5))
    expectWritten(-gainToDb(peak(tone.left)), '3.01 dB')
    // The crest is at 0 dB: the long sinc finds it.
    expect(sincDb([tone.left], 16)).toBeCloseTo(0, 2)
    const open = limiter.render(tone, { push: 0, ceiling: 0 })
    const reads = most(value(open, 'peak')) - gainToDb(peak(tone.left))
    say('detector-reads', reads, 'overshoot check', open.checks.overshoot)
    expectWritten(reads, '3.05 dB')
    expectWritten(open.checks.overshoot!, '3.05 dB')
    const shut = limiter.render(tone, { push: 0, ceiling: -1 })
    const gain = value(shut, 'gain')
    say('unseen', least(gain), most(gain))
    expect(sampleDb([tone.left])).toBeLessThan(-1 - 2)
    expectWritten(-least(gain), '1.04 dB')
    expectWritten(-most(gain), '1.04 dB')
  })

  it('puts its four points an eighth, three, five and seven eighths of the way across each gap (claim eighths)', async () => {
    const limiter = await lab('limiting')
    const out = limiter.render(quarterTone(seconds(0.5)), { push: 0, ceiling: 0 })
    const points = value(out, 'toneBetween')
    const samples = value(out, 'toneSamples')
    expect(samples[0]).toBeCloseTo(Math.SQRT1_2, 5)
    expect(samples[1]).toBeCloseTo(Math.SQRT1_2, 5)
    // Between two equal samples the four are a mirror of themselves, and each is the sine there.
    expect(points[0]).toBeCloseTo(points[3]!, 5)
    expect(points[1]).toBeCloseTo(points[2]!, 5)
    const tone = (place: number) => Math.sin(2 * Math.PI * (0.25 * place + 0.125))
    /** The furthest any of the first eight points lies from the tone, were the first at `from`. */
    const worst = (from: number) =>
      Math.max(...[0, 1, 2, 3, 4, 5, 6, 7].map((q) => Math.abs(points[q]! - tone(from + q / 4))))
    say('eighths', worst(0.125), 'were they quarters', worst(0), worst(0.25))
    expect(worst(0.125)).toBeLessThan(0.03)
    // Were they at quarters of the gap, on the sample or a quarter after it, they would not
    // fit the tone: the first point would be a sample, or the last would.
    expect(worst(0)).toBeGreaterThan(0.1)
    expect(worst(0.25)).toBeGreaterThan(0.1)
    // And the lab draws them where they are.
    expect(out.taps.toneBetween!.x0).toBe(0.125)
    expect(out.taps.toneSamples!.x0).toBe(0)
  })

  it('reads twelve samples of size 1, their signs chosen against it, 6.12 dB over them (claim worst-case)', async () => {
    const limiter = await lab('limiting')
    // The signs of the second row of the filter's table, latest sample first.
    const signs = [-1, 1, -1, 1, -1, 1, 1, -1, 1, -1, 1, -1]
    const source = silence(seconds(0.5))
    signs.forEach((sign, i) => {
      source.left[4011 - i] = sign
      source.right[4011 - i] = sign
    })
    const out = limiter.render(source, { push: 0, ceiling: 0 })
    say('worst-case', most(value(out, 'peak')))
    expectWritten(most(value(out, 'peak')), '6.12 dB')
  })

  it('gives both channels one gain: a loud left turns a quiet right down by as much (claim linked)', async () => {
    const limiter = await lab('limiting')
    const frames = seconds(1)
    const source: Source = {
      left: sine(1000, dbToGain(5), frames).left,
      right: sine(300, dbToGain(-20), frames).left,
    }
    const out = limiter.render(source, { push: 0, ceiling: -1 })
    // The left is 6 dB over the ceiling. The right, alone, is 19 dB under it.
    const gain = value(out, 'gain')
    const right = gainToDb(peak(sound(out, 'out')[1]!)) + 20
    say('linked', right, least(gain), most(gain))
    expectWritten(-least(gain), '6.0 dB')
    expect(Math.abs(right - least(gain))).toBeLessThan(1e-5)
    // Sample by sample, each side comes out of the delay times the same number.
    const came = sound(out, 'out')
    const delayed = sound(out, 'delayed')
    let apart = 0
    for (let i = 0; i < frames; i += 1) {
      if (Math.abs(delayed[0]![i]!) < 0.2 || Math.abs(delayed[1]![i]!) < 0.02) continue
      const sides = [0, 1].map((c) => gainToDb(came[c]![i]! / delayed[c]![i]!))
      apart = Math.max(apart, Math.abs(sides[0]! - sides[1]!))
    }
    say('linked: the most the two sides differ on one sample, in dB', apart)
    expect(apart).toBeLessThan(1e-5)
  })

  it('brings a 1 kHz tone 12 dB over the ceiling out at the ceiling, within 0.01 dB (claim at-the-ceiling)', async () => {
    const limiter = await lab('limiting')
    const out = limiter.render(sine(1000, dbToGain(11), seconds(1)), { push: 0, ceiling: -1 })
    const at = sampleDb(sound(out, 'out'))
    say('at-the-ceiling', at)
    expect(at).toBeLessThanOrEqual(-1)
    expectWritten(-1 - at, 'less than 0.01 dB')
  })

  it('measures the curve the formula draws, within 0.01 dB (claim curve-error)', async () => {
    const limiter = await lab('limiting')
    const quiet = silence(seconds(0.25))
    for (const values of [{}, { ceiling: -12, release: 10 }, { ceiling: 0, release: 2000 }]) {
      expectWritten(limiter.render(quiet, values).checks.curveError!, 'less than 0.01 dB')
    }
    // The curve follows Ceiling, and Push does not reach it: it is measured with no push.
    const low = value(limiter.render(quiet, { ceiling: -12 }), 'curve')
    const same = value(limiter.render(quiet, { ceiling: -12, push: 0 }), 'curve')
    expect(most(low)).toBeLessThanOrEqual(-12)
    expect(most(low)).toBeGreaterThan(-12.01)
    expect(same).toEqual(low)
  })

  it('has the gain 63 % of the way back 101 ms after its lowest, at a release of 100 ms (claim release-100)', async () => {
    const limiter = await lab('limiting')
    const out = limiter.render(click(seconds(4), seconds(1)), {
      push: 12,
      ceiling: -1,
      release: 100,
    })
    const gain = Array.from(value(out, 'gain'), dbToGain)
    const lowest = gain.indexOf(Math.min(...gain))
    const back = 1 - (1 - gain[lowest]!) * Math.exp(-1)
    let k = lowest
    while (k < gain.length && gain[k]! < back) k += 1
    const ms = ((k - lowest) * 1000) / POINT_RATE
    say('release-100', ms)
    expectWritten(ms, '101 ms')
  })

  it('comes to rest 0.0012 dB short of no reduction at a release of 100 ms (claim rests-short)', async () => {
    const limiter = await lab('limiting')
    const out = limiter.render(click(seconds(4), seconds(1)), {
      push: 12,
      ceiling: -1,
      release: 100,
    })
    const gain = value(out, 'gain')
    const rest = gain[gain.length - 1]!
    say('rests-short', rest)
    expectWritten(-rest, '0.0012 dB')
    // It has stopped: the last second is one value.
    expect(gain.subarray(gain.length - 3000).every((v) => v === rest)).toBe(true)
  })

  it('holds the lowest gain a click asks for through 73 samples (claim held-73)', async () => {
    const limiter = await lab('limiting')
    // A loop long enough for the gain to be at rest again when the click comes round.
    const out = limiter.render(click(seconds(2), 5000), { push: 12, ceiling: -1 })
    // In the loop, and in the lab's own view of one click through a second device.
    for (const id of ['nearMinimum', 'clickMinimum']) {
      const minimum = value(out, id)
      const lowest = least(minimum)
      const held = Array.from(minimum.keys()).filter((p) => minimum[p] === lowest)
      say('held-73', id, held.length, held[0]! - 144, held[held.length - 1]! - 144)
      expectWritten(held.length, '73 samples')
      expect(held[0]! - 144).toBe(-71)
      expect(held[held.length - 1]! - 144).toBe(1)
    }
  })

  it('starts the gain down 72 samples before a click comes out (claim ramp-72), in a straight line (claim ramp-straight), and reaches the lowest on the sample it comes out and the one after (claim bottom-on-peak)', async () => {
    const limiter = await lab('limiting')
    const out = limiter.render(click(seconds(2), 5000), { push: 12, ceiling: -1 })
    // The click goes in 77 samples before it comes out, four times its size after the push.
    expect(near(out.taps.nearPushed!)(-77)).toBeCloseTo(dbToGain(12), 4)
    expect(near(out.taps.nearDelayed!)(0)).toBeCloseTo(dbToGain(12), 4)
    // It comes out on the ceiling.
    expect(near(out.taps.nearOut!)(0)).toBeCloseTo(dbToGain(-1), 6)
    // In the loop the click is 13 dB over the ceiling; the lab's own click is four times it.
    for (const [id, depth] of [
      ['nearGain', dbToGain(-13)],
      ['clickGain', 0.25],
    ] as const) {
      const gain = near(out.taps[id]!)
      // Before the ramp the gain stands still. The first sample lower than the one before it,
      // counted back from the sample the click comes out on:
      let first = -143
      while (first < 0 && gain(first) >= gain(first - 1)) first += 1
      expectWritten(-first, '72 samples')
      expect(gain(-73)).toBe(gain(-74))
      // From there every sample is lower than the last.
      for (let n = -72; n <= 0; n += 1) expect(gain(n)).toBeLessThan(gain(n - 1))
      // The lowest is what the click asks for: on the sample it comes out, and on the next.
      const lowest = least(value(out, id))
      expect(lowest).toBeCloseTo(depth, 5)
      expect(gain(0)).toBe(lowest)
      expect(gain(1)).toBe(lowest)
      expect(gain(-1)).toBeGreaterThan(lowest)
      expect(gain(2)).toBeGreaterThan(lowest)
      // A straight line in gain: of the 70 steps between, none differs from their mean by 1 %.
      // (The detector catches the click a step early and a little short, through the last
      // point of the gap before it, so the first step and the last are smaller ones.)
      const mean = (gain(-71) - gain(-1)) / 70
      for (let n = -70; n <= -1; n += 1) {
        expect(Math.abs(gain(n - 1) - gain(n) - mean)).toBeLessThan(0.01 * mean)
      }
      expect(mean).toBeCloseTo((1 - lowest) / 72, 4)
      say('ramp', id, gain(-73), gain(-72), gain(-71), gain(-36), lowest, mean)
    }
  })

  it("works the gain out again from the detector's reading with no difference from the device's (claim rebuilt-zero)", async () => {
    const limiter = await lab('limiting')
    for (const id of ['drums', 'noise', 'clicks', 'chords']) {
      const source = await benchSource(id, seconds(4))
      expect(limiter.render(source, {}).checks.rebuilt).toBe(0)
      expect(limiter.render(source, { push: 24, ceiling: -12, release: 10 }).checks.rebuilt).toBe(0)
    }
  })

  it('never needs its last clip on the drums pushed 12 dB: it changes no sample (claim clip-idle)', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const out = limiter.render(drums, { push: 12, ceiling: -1 })
    expect(out.checks.clipped).toBe(0)
    // The gain did the work: there was plenty to turn down.
    expect(least(value(out, 'gain'))).toBeLessThan(-9)
  })

  it('meets only rounding at its last clip on the drums pushed 24 dB: one sample, less than a millionth of a decibel over (claim clip-rounding)', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const out = limiter.render(drums, { push: 24, ceiling: -1 })
    say('clip-rounding', out.checks.clipped, out.checks.clipDepth)
    expect(out.checks.clipped).toBe(1)
    expect(out.checks.clipDepth).toBeGreaterThan(0)
    expect(out.checks.clipDepth).toBeLessThan(1e-6)
  })

  it('swings the gain 3.0 dB inside each half cycle of a 55 Hz tone 7 dB over the ceiling at a release of 10 ms (claim low-10), and 0.57 dB at 100 ms (claim low-100)', async () => {
    const limiter = await lab('limiting')
    const tone = sine(55, dbToGain(6), seconds(2))
    const at = (release: number) =>
      swing(value(limiter.render(tone, { push: 0, ceiling: -1, release }), 'gain'))
    say('low', at(10), at(100))
    expectWritten(at(10), '3.0 dB')
    expectWritten(at(100), '0.57 dB')
  })

  it("lets white noise pushed 12 dB read 1.8 dB over the ceiling on the long sinc while the engine's meter reads it within 0.01 dB of the ceiling (claim noise-over)", async () => {
    const limiter = await lab('limiting')
    const source = await benchSource('noise', seconds(4))
    const out = sound(limiter.render(source, { push: 12, ceiling: -1 }), 'out')
    const over = sincDb(out, 16) + 1
    say('noise-over', over, meterDb(out))
    expectWritten(over, '1.8 dB')
    expectWritten(Math.abs(meterDb(out) + 1), 'less than 0.01 dB')
    // The wave between the samples of noise stands further over them than that of the drums,
    // and that of the bench's sine hardly at all, as the caption of stage 2's picture says.
    const overshoot = async (id: string) =>
      limiter.render(await benchSource(id, seconds(4)), {}).checks.overshoot!
    const [drums, noise, tone] = [
      await overshoot('drums'),
      await overshoot('noise'),
      await overshoot('sine'),
    ]
    say('overshoot at the spot shown: drums, noise, sine', drums, noise, tone)
    expect(noise).toBeGreaterThan(drums + 2)
    expect(tone).toBeLessThan(0.1)
  })

  it('keeps a tone within 0.3 dB up to 20 kHz in its two middle points and loses 3.0 dB of it at 22 kHz (claim inner-22k), and 0.5 dB in the two nearest a sample (claim outer-22k)', async () => {
    const limiter = await lab('limiting')
    const out = limiter.render(silence(seconds(0.25)), {})
    const inner = out.taps.responseInner!
    const outer = out.taps.responseOuter!
    expect(inner.x1).toBe(24)
    // A point every 250 Hz: 22 kHz is the 88th.
    say(
      'response',
      inner.channels_data[0]![88],
      outer.channels_data[0]![88],
      most(inner.channels_data[0]!.subarray(0, 81)),
      least(inner.channels_data[0]!.subarray(0, 81)),
    )
    expectWritten(-inner.channels_data[0]![88]!, '3.0 dB')
    expectWritten(-outer.channels_data[0]![88]!, '0.5 dB')
    for (const row of [inner, outer]) {
      const upTo20k = row.channels_data[0]!.subarray(0, 81)
      expectWritten(Math.max(most(upTo20k), -least(upTo20k)), 'less than 0.3 dB')
    }
  })

  // The build part. Its test signals: a tone on both channels 6 dB over a ceiling of −1 dB with
  // nothing pushed, one click through the pieces (the lab's own close view), and the 12 kHz tone.
  const over = (hz: number) => sine(hz, dbToGain(5), seconds(2))
  const plain = { push: 0, ceiling: -1, release: 100 }
  /** What is not the tone, in dB under a 100 Hz tone 6 dB over the ceiling, at a build step. */
  const bends = (limiter: Lab, step: number) =>
    -notTone(sound(limiter.render(over(100), { ...plain, build: step }), 'built')[0]!, 100)
  /** The lowest gain the build puts on a signal at a step, in dB down. */
  const dips = (limiter: Lab, source: Source, step: number) =>
    0 - least(value(limiter.render(source, { ...plain, build: step }), 'builtGain'))
  /** One click through the build at a step. */
  const clicks = (limiter: Lab, step: number) =>
    builtClick(limiter.render(silence(seconds(0.25)), { ...plain, build: step }))

  it('at the second step cuts the drums pushed 12 dB off at −1.0 dB, where the first left them 8.2 dB over full scale (claim built-clip), and leaves of a 100 Hz tone 6 dB over the ceiling a part that is not the tone 12.7 dB under it (claim clip-tone)', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const top = (step: number) => most(value(limiter.render(drums, { build: step }), 'builtPeak'))
    say('built-clip', top(0), top(1), 'clip-tone', bends(limiter, 0), bends(limiter, 1))
    expectWritten(top(1), '−1.0 dB')
    expectWritten(top(0), '8.2 dB')
    // The piece switched off: the step before it lets the drums through as they were pushed.
    expect(matchesWritten(top(0), '−1.0 dB')).toBe(false)
    expectWritten(bends(limiter, 1), '12.7 dB')
    // Turned up and nothing else, the tone is whole: what is not the tone is rounding.
    expect(matchesWritten(bends(limiter, 0), '12.7 dB')).toBe(false)
    expect(bends(limiter, 0)).toBeGreaterThan(120)
    // The step is the main path's clipped tap, sample for sample.
    const one = limiter.render(drums, { build: 1 })
    expect(sound(one, 'built')).toEqual(sound(one, 'clipOnly'))
  })

  it('at the third step asks 6.0 dB less gain of that tone, where the step before asked nothing (claim built-gain), and makes the wave the clip made, still 12.7 dB short of a tone (claim gain-is-clip)', async () => {
    const limiter = await lab('limiting')
    const tone = over(100)
    say('built-gain', dips(limiter, tone, 1), dips(limiter, tone, 2), bends(limiter, 2))
    expectWritten(dips(limiter, tone, 2), '6.0 dB')
    expect(dips(limiter, tone, 1)).toBe(0)
    expect(matchesWritten(dips(limiter, tone, 1), '6.0 dB')).toBe(false)
    expectWritten(bends(limiter, 2), '12.7 dB')
    const clip = sound(limiter.render(tone, { ...plain, build: 1 }), 'built')[0]!
    const gain = sound(limiter.render(tone, { ...plain, build: 2 }), 'built')[0]!
    let apart = 0
    for (let i = 0; i < clip.length; i += 1) apart = Math.max(apart, Math.abs(clip[i]! - gain[i]!))
    say('gain-is-clip: the most a sample differs', apart)
    expect(apart).toBeLessThan(1e-6)
  })

  it('at the fourth step, at a release of 100 ms, leaves what is not the tone 37.3 dB under it, where the step before left it 12.7 dB under (claim built-release)', async () => {
    const limiter = await lab('limiting')
    say('built-release', bends(limiter, 2), bends(limiter, 3))
    expectWritten(bends(limiter, 3), '37.3 dB')
    expectWritten(bends(limiter, 2), '12.7 dB')
    expect(matchesWritten(bends(limiter, 2), '37.3 dB')).toBe(false)
    // The gain now stays down between the crests: it moves through less than half a decibel.
    const gain = value(limiter.render(over(100), { ...plain, build: 3 }), 'builtGain')
    expect(swing(gain)).toBeLessThan(0.5)
    // And it answers to Release: shorter, and the tone is bent more.
    const short = sound(limiter.render(over(100), { ...plain, release: 10, build: 3 }), 'built')
    expect(-notTone(short[0]!, 100)).toBeLessThan(bends(limiter, 3) - 6)
  })

  it('at the fourth step still presses the samples on the way up to every crest of that tone flat against the ceiling (claim built-late)', async () => {
    const limiter = await lab('limiting')
    const tone = over(100)
    const top = dbToGain(-1)
    /** Samples of the settled second half that lie on the ceiling, and how many of them rise. */
    const pressed = (step: number) => {
      const built = sound(limiter.render(tone, { ...plain, build: step }), 'built')[0]!
      let flat = 0
      let rising = 0
      for (let i = built.length / 2; i < built.length; i += 1) {
        if (Math.abs(Math.abs(built[i]!) - top) > 1e-6) continue
        flat += 1
        // No wait yet at this step: the sample out is the sample in, times the gain.
        if (Math.abs(tone.left[i]!) >= Math.abs(tone.left[i - 1]!)) rising += 1
      }
      return { flat, rising }
    }
    const crests = 2 * 100 // a 100 Hz tone has two crests a cycle, over one second
    const late = pressed(3)
    const ramped = pressed(5)
    say(
      'built-late: samples on the ceiling in a second, at the release and at the ramp',
      late,
      ramped,
    )
    // More than twenty to a crest on the way up. One more follows each crest: the gain has
    // begun to climb by then, faster than the tone falls, and is taken down again.
    expect(late.rising).toBeGreaterThan(20 * crests)
    expect(late.flat - late.rising).toBeLessThanOrEqual(crests)
    // With the wait, the hold and the ramp in, a crest touches the ceiling and no more.
    expect(ramped.flat).toBeLessThanOrEqual(crests)
  })

  it('at the fifth step has the gain down 72 samples before a click comes out, where the step before had it down only on the sample itself (claim built-hold), and still drops it 75 % of the way in one sample (claim built-cliff)', async () => {
    const limiter = await lab('limiting')
    const before = clicks(limiter, 3)
    const held = clicks(limiter, 4)
    say('built-hold', before, held)
    expectWritten(held.out - held.down, '72 samples')
    expect(before.out - before.down).toBe(0)
    expect(matchesWritten(before.out - before.down, '72 samples')).toBe(false)
    expectWritten(100 * held.step, '75 %')
    // The click comes out on the ceiling at both steps: the hold changes when, not how far.
    for (const one of [before, held]) {
      expect(one.height).toBeCloseTo(dbToGain(-1), 6)
      expect(one.lowest).toBeCloseTo(0.25, 6)
    }
    // The sound now waits: the click comes out 72 samples after it went in.
    expect(before.out).toBe(0)
    expect(held.out).toBe(72)
  })

  it('at the sixth step moves the gain 1.04 % of the way in a sample at most, where the step before moved it 75 % at once (claim built-ramp)', async () => {
    const limiter = await lab('limiting')
    const held = clicks(limiter, 4)
    const ramped = clicks(limiter, 5)
    say('built-ramp', held.step, ramped.step)
    expectWritten(100 * ramped.step, '1.04 %')
    expectWritten(100 * held.step, '75 %')
    expect(matchesWritten(100 * held.step, '1.04 %')).toBe(false)
    // It still starts 72 samples before the click comes out, and is at the bottom when it does.
    expect(ramped.out - ramped.down).toBe(72)
    const gain = value(
      limiter.render(silence(seconds(0.25)), { ...plain, build: 5 }),
      'builtClickGain',
    )
    expect(gain[48 + ramped.out]).toBeCloseTo(0.25, 6)
  })

  it('at the seventh step turns a 12 kHz tone sampled 45 degrees off its crests down 1.04 dB under a ceiling 2 dB above its samples, where the step before left it alone (claim built-between), and brings a click out 77 samples after it went in, where the step before took 72 samples (claim built-delay)', async () => {
    const limiter = await lab('limiting')
    const tone = quarterTone(seconds(0.5))
    say('built-between', dips(limiter, tone, 5), dips(limiter, tone, 6))
    expectWritten(dips(limiter, tone, 6), '1.04 dB')
    expect(dips(limiter, tone, 5)).toBe(0)
    expect(matchesWritten(dips(limiter, tone, 5), '1.04 dB')).toBe(false)
    const after = clicks(limiter, 6)
    const before = clicks(limiter, 5)
    say('built-delay', before, after)
    expectWritten(after.out, '77 samples')
    expectWritten(before.out, '72 samples')
    expect(matchesWritten(before.out, '77 samples')).toBe(false)
  })

  it('with all seven pieces is the device, sample for sample, on every loop and at every setting tried (claim build-same)', async () => {
    const limiter = await lab('limiting')
    for (const id of ['drums', 'pad', 'mix', 'noise', 'clicks']) {
      const source = await benchSource(id, seconds(id === 'drums' ? 4 : 2))
      for (const values of [
        {},
        { push: 24, ceiling: -12, release: 10 },
        { push: 0, ceiling: 0, release: 2000 },
      ]) {
        const result = limiter.render(source, { ...values, build: 6 })
        // −140 dB is the floor of the lab's reading: no difference at all.
        expect(result.checks.builtDifference, `${id} ${JSON.stringify(values)}`).toBe(-140)
        expect(sound(result, 'built')).toEqual(sound(result, 'out'))
        // The lane of the build's gain is the device's own.
        expect(value(result, 'builtGain')).toEqual(value(result, 'gain'))
      }
    }
  })

  it('with all seven pieces keeps the samples of noise further under the ceiling than the samples of the drums, as the last step of the build says of its second lane', async () => {
    const limiter = await lab('limiting')
    const under = async (id: string) => {
      const result = limiter.render(await benchSource(id, seconds(2)), { build: 6 })
      return -1 - most(value(result, 'builtPeak'))
    }
    const drums = await under('drums')
    const noise = await under('noise')
    say('samples under the ceiling', drums, noise)
    expect(drums).toBeGreaterThan(0)
    expect(drums).toBeLessThan(0.5)
    expect(noise).toBeGreaterThan(drums + 0.5)
  })

  // The cards.

  it('renders every named set: the tap its card plays is finite, and neither silent nor far over the rest', async () => {
    const limiter = await lab('limiting')
    for (const name of Object.keys(settings.sets)) {
      const one = await played(limiter, name)
      const data = sound(one.result, one.tap)
      expect(data.every((channel) => channel.every((v) => Number.isFinite(v)))).toBe(true)
      say('set', name, one.tap, 'level', levelDb(data), 'highest sample', sampleDb(data))
      expect(levelDb(data), name).toBeGreaterThan(-36)
      expect(levelDb(data), name).toBeLessThan(-5)
    }
  })

  it('on the drums lets the gain back to less than 0.1 dB down at its highest, in the widest spaces of the loop, and has it more than 1 dB down for 50 % of the loop (claim use-drums)', async () => {
    const limiter = await lab('limiting')
    const gain = value((await played(limiter, 'drums')).result, 'gain')
    const share = (100 * gain.filter((v) => v < -1).length) / gain.length
    say('use-drums', most(gain), share)
    expectWritten(-most(gain), 'less than 0.1 dB')
    expectWritten(share, '50 %')
    // It gets that far in some of the spaces and not in all: count the stretches it does.
    let stretches = 0
    for (let k = 1; k < gain.length; k += 1) {
      if (gain[k]! > -0.1 && gain[k - 1]! <= -0.1) stretches += 1
    }
    say('use-drums: stretches less than 0.1 dB down', stretches)
    expect(stretches).toBeGreaterThanOrEqual(2)
    expect(stretches).toBeLessThanOrEqual(6)
  })

  it('on the bass at a release of 400 ms moves the gain between 0.7 dB and 6.1 dB down (claim use-bass)', async () => {
    const limiter = await lab('limiting')
    const gain = value((await played(limiter, 'bass')).result, 'gain')
    say('use-bass', most(gain), least(gain))
    expectWritten(-most(gain), '0.7 dB')
    expectWritten(-least(gain), '6.1 dB')
  })

  it('on the mix takes 5.8 dB off the loudest moment and brings the loop out 6.5 dB louder (claim use-mix)', async () => {
    const limiter = await lab('limiting')
    const one = await played(limiter, 'mix')
    say('use-mix', least(value(one.result, 'gain')), louder(one))
    expectWritten(-least(value(one.result, 'gain')), '5.8 dB')
    expectWritten(louder(one), '6.5 dB')
  })

  it('does nothing to a pad that stays under the ceiling: the gain is exactly 0 dB, and the loop comes out as it was pushed, 77 samples late (claim use-guard)', async () => {
    const limiter = await lab('limiting')
    const one = await played(limiter, 'guard')
    expect(value(one.result, 'gain').every((v) => v === 0)).toBe(true)
    expect(sound(one.result, 'out')).toEqual(sound(one.result, 'delayed'))
    const frames = one.went.left.length
    const out = sound(one.result, 'out')[0]!
    const pushed = sound(one.result, 'pushed')[0]!
    for (let i = 0; i < frames; i += 97) expect(out[i]).toBe(pushed[(i - 77 + frames) % frames])
    expectWritten(louder(one), '6.0 dB')
  })

  it('leaves the mix alone with Push at 0 dB and at 3 dB: its highest sample is 4.2 dB under full scale, and at 4 dB the deepest dip is 0.8 dB (claim way-safety)', async () => {
    const limiter = await lab('limiting')
    const one = await played(limiter, 'safety')
    expectWritten(-sampleDb([one.went.left, one.went.right]), '4.2 dB')
    expect(value(one.result, 'gain').every((v) => v === 0)).toBe(true)
    const three = await played(limiter, 'safety', { push: 3 })
    expect(value(three.result, 'gain').every((v) => v === 0)).toBe(true)
    const four = await played(limiter, 'safety', { push: 4 })
    say('way-safety', least(value(four.result, 'gain')))
    expectWritten(-least(value(four.result, 'gain')), '0.8 dB')
  })

  it("holds the mix to a ceiling of −2 dB within 0.01 dB on the engine's meter, and the long sinc at 16 points reads it 1.8 dB under full scale (claim way-room)", async () => {
    const limiter = await lab('limiting')
    const out = sound((await played(limiter, 'room')).result, 'out')
    say('way-room', meterDb(out), sincDb(out, 16))
    expectWritten(Math.abs(meterDb(out) + 2), 'less than 0.01 dB')
    expectWritten(-sincDb(out, 16), '1.8 dB')
  })

  it('takes away 11.9 dB less than it lets through on the drums pushed 6 dB, and as much as it lets through, within 0.3 dB, pushed 12 dB (claim way-taken)', async () => {
    const limiter = await lab('limiting')
    const under = (one: { result: RenderResult }) =>
      levelDb(sound(one.result, 'out')) - levelDb(sound(one.result, 'removed'))
    const six = await played(limiter, 'taken', { push: 6 })
    const twelve = await played(limiter, 'taken')
    say('way-taken', under(six), under(twelve))
    expectWritten(under(six), '11.9 dB')
    expectWritten(Math.abs(under(twelve)), 'less than 0.3 dB')
    // What was taken away and what came out add up to the delayed sound.
    const result = twelve.result
    for (let c = 0; c < 2; c += 1) {
      const sum = sound(result, 'out')[c]!.map((v, i) => v + sound(result, 'removed')[c]![i]!)
      const delayed = sound(result, 'delayed')[c]!
      expect(sum.every((v, i) => Math.abs(v - delayed[i]!) < 1e-6)).toBe(true)
    }
  })

  it('on a held pad moves the limiter alone through 7.7 dB of gain; with the slow gain in front, that gain stays between 7.7 dB and 9.2 dB down and the limiter behind it goes no deeper than 1.4 dB (claim way-ridden)', async () => {
    const limiter = await lab('limiting')
    const alone = value((await played(limiter, 'alone')).result, 'gain')
    const ridden = (await played(limiter, 'ridden')).result
    const ride = value(ridden, 'rideGain')
    const wall = value(ridden, 'wallGain')
    say(
      'way-ridden',
      least(alone),
      most(alone),
      'ride',
      least(ride),
      most(ride),
      'wall',
      least(wall),
    )
    expectWritten(most(alone) - least(alone), '7.7 dB')
    expectWritten(-most(ride), '7.7 dB')
    expectWritten(-least(ride), '9.2 dB')
    expectWritten(-least(wall), '1.4 dB')
    // Both are held to the ceiling of the set, as the engine's meter reads them.
    expect(meterDb(sound(ridden, 'ambient'))).toBeLessThanOrEqual(-7 + 0.01)
    expect(meterDb(sound(ridden, 'out'))).toBeLessThanOrEqual(-7 + 0.01)
  })

  it('swings the gain 4.2 dB in every cycle of the saw at a release of 10 ms, and 0.5 dB at 400 ms (claim fault-bent)', async () => {
    const limiter = await lab('limiting')
    const short = swing(value((await played(limiter, 'bent')).result, 'gain'))
    const long = swing(value((await played(limiter, 'bent', { release: 400 })).result, 'gain'))
    say('fault-bent', short, long)
    expectWritten(short, '4.2 dB')
    expectWritten(long, '0.5 dB')
  })

  it('at a release of 2 s keeps the gain on the drums at least 7.7 dB down all through the loop, and brings them out 4.6 dB louder where a release of 100 ms brings them out 8.5 dB louder (claim fault-ducked)', async () => {
    const limiter = await lab('limiting')
    const long = await played(limiter, 'ducked')
    const short = await played(limiter, 'ducked', { release: 100 })
    say('fault-ducked', most(value(long.result, 'gain')), louder(long), louder(short))
    expectWritten(-most(value(long.result, 'gain')), '7.7 dB')
    expectWritten(louder(long), '4.6 dB')
    expectWritten(louder(short), '8.5 dB')
  })

  it('pushed 24 dB leaves the highest sample of the drums 11.0 dB over their level, where it stood 18.7 dB over it, with the gain at least 0.4 dB down all through the loop and more than 11 dB more taken away than let through (claim fault-flat)', async () => {
    const limiter = await lab('limiting')
    const one = await played(limiter, 'flat')
    const out = sound(one.result, 'out')
    const went = [one.went.left, one.went.right]
    const taken = levelDb(sound(one.result, 'removed')) - levelDb(out)
    say('fault-flat', sampleDb(out) - levelDb(out), most(value(one.result, 'gain')), taken)
    expectWritten(sampleDb(out) - levelDb(out), '11.0 dB')
    expectWritten(sampleDb(went) - levelDb(went), '18.7 dB')
    expectWritten(-most(value(one.result, 'gain')), '0.4 dB')
    expectWritten(taken, 'more than 11 dB')
  })

  it('has the gain more than 0.1 dB down for 90 % of the drums loop as the page opens (claim mostly-down)', async () => {
    const limiter = await lab('limiting')
    const gain = value(limiter.render(await benchSource('drums', seconds(4)), {}), 'gain')
    const share = (100 * gain.filter((v) => v < -0.1).length) / gain.length
    say('mostly-down', share)
    expectWritten(share, '90 %')
  })

  // The Ambient Limiter beside it.

  it('is the Ambient Limiter with Ride at 0, at a release of 80 ms: the two outputs are the same on the drums, sample for sample (claim ambient-same)', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const result = limiter.render(drums, { push: 12, ceiling: -1, release: 80, ride: 0 })
    expect(sound(result, 'ambient')).toEqual(sound(result, 'out'))
    expect(value(result, 'rideGain').every((v) => v === 0)).toBe(true)
    expect(value(result, 'wallGain')).toEqual(value(result, 'gain'))
    // At the release the page opens on, they are not the same.
    const other = limiter.render(drums, { push: 12, ceiling: -1, release: 100, ride: 0 })
    expect(sound(other, 'ambient')).not.toEqual(sound(other, 'out'))
  })

  it('with Ride at 1 on the drums pushed 12 dB has the slow gain between 3.1 dB and 5.0 dB down, leaves its limiter 6.2 dB to take at the deepest, and comes out 1.2 dB quieter than the limiter alone (claim ambient-drums)', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const result = limiter.render(drums, { push: 12, ceiling: -1, ride: 1 })
    const ride = value(result, 'rideGain')
    const quieter = levelDb(sound(result, 'out')) - levelDb(sound(result, 'ambient'))
    say('ambient-drums', most(ride), least(ride), least(value(result, 'wallGain')), quieter)
    expectWritten(-most(ride), '3.1 dB')
    expectWritten(-least(ride), '5.0 dB')
    expectWritten(-least(value(result, 'wallGain')), '6.2 dB')
    expectWritten(quieter, '1.2 dB')
    expect(meterDb(sound(result, 'ambient'))).toBeLessThanOrEqual(-1 + 0.01)
  })

  it("with Ceiling at −20 dB holds the drums to −20.0 dB by the engine's meter, where the Ambient Limiter, whose Ceiling stops higher, holds them to −12.0 dB (claim ambient-ceiling)", async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    for (const values of [{ ceiling: -20 }, { ceiling: -20, release: 80, ride: 0 }]) {
      const result = limiter.render(drums, values)
      say(
        'ambient-ceiling',
        JSON.stringify(values),
        meterDb(sound(result, 'out')),
        meterDb(sound(result, 'ambient')),
      )
      expectWritten(meterDb(sound(result, 'out')), '−20.0 dB')
      expectWritten(meterDb(sound(result, 'ambient')), '−12.0 dB')
    }
    // Down to where the device's Ceiling stops, the two are still one limiter at Ride 0.
    const edge = limiter.render(drums, { ceiling: -12, release: 80, ride: 0 })
    expect(sound(edge, 'ambient')).toEqual(sound(edge, 'out'))
    // And at both ends of Push.
    for (const push of [-12, 24]) {
      const result = limiter.render(drums, { push, release: 80, ride: 0 })
      expect(sound(result, 'ambient'), `push ${push}`).toEqual(sound(result, 'out'))
    }
  })

  it("differs from the Ambient Limiter as the lesson's last part says: that device's controls, read from its descriptor, against this page's", async () => {
    const limiter = await lab('limiting')
    const read = (file: string) =>
      fs.readFileSync(fileURLToPath(new URL(`../../../${file}`, import.meta.url)), 'utf8')
    const device = JSON.parse(read('cpp/devices/ambient-limiter/device.json')) as {
      params: { key: string; min: number; max: number; default: number; unit?: string }[]
    }
    const theirs = Object.fromEntries(device.params.map((one) => [one.key, one]))
    const ours = Object.fromEntries(limiter.description.controls.map((one) => [one.id, one]))
    expect(Object.keys(theirs)).toEqual(['ceiling', 'gain', 'release', 'ride', 'autoGain'])
    // Gain is Push, with the same reach; it starts at 0 dB where the page's Push starts at 12 dB.
    expect([theirs.gain!.min, theirs.gain!.max]).toEqual([ours.push!.min, ours.push!.max])
    expect(theirs.gain!.default).toBe(0)
    expect(ours.push!.initial).toBe(12)
    // Ride starts at 1, there and on this page.
    expect(theirs.ride!.default).toBe(1)
    expect(ours.ride!.initial).toBe(1)
    // Release is another thing: seconds of the slow gain, where the page's is the limiter's own.
    expect(theirs.release!.unit).toBe('s')
    expect(theirs.release!.default).toBe(1.5)
    expect(ours.release!.unit).toBe('ms')
    // Ceiling stops at −12 dB there and at −20 dB here; both start at −1 dB.
    expect(theirs.ceiling!.min).toBe(-12)
    expect(ours.ceiling!.min).toBe(-20)
    expect(theirs.ceiling!.default).toBe(ours.ceiling!.initial)
    // Auto gain is off where it starts.
    expect(theirs.autoGain!.default).toBe(0)
    // The plate opens as the lesson's note says: Ride at 0, Gain at the page's Push.
    const lesson = read('site/src/content/lessons/limiting.mdx')
    expect(lesson).toContain('params: { ceiling: -1, gain: 12, ride: 0 }')
  })

  it('moves only the lanes the caption of "All eight at once" says: Push every lane but the first, Ceiling the gains from the fourth lane down, Release from the fifth, and neither the sound after the wait', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const lanes = [
      'in',
      'pushed',
      'peak',
      'required',
      'released',
      'minimum',
      'gain',
      'delayed',
      'out',
    ]
    const start = limiter.render(drums, {})
    const moved = (values: Record<string, number>) => {
      const other = limiter.render(drums, values)
      return lanes.filter((id) =>
        sound(other, id).some((data, c) => data.some((v, i) => v !== sound(start, id)[c]![i])),
      )
    }
    expect(moved({ push: 6 })).toEqual(lanes.slice(1))
    expect(moved({ ceiling: -6 })).toEqual(['required', 'released', 'minimum', 'gain', 'out'])
    expect(moved({ release: 400 })).toEqual(['released', 'minimum', 'gain', 'out'])
    // Ride is the other device's: it moves none of them.
    expect(moved({ ride: 0 })).toEqual([])
  })
})
