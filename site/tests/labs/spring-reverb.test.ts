import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
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
  noise,
  peak,
  range,
  RATE,
  rms,
  seconds,
  silence,
  sine,
} from './support.ts'

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings('spring-reverb')!

/** A named set as its card plays it: on its own source, with `over` laid on its values. */
async function played(tank: Lab, name: string, over: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(tank.description, set)
  return tank.render(await benchSource(source!, seconds(4)), { ...values, ...over })
}

const tap = (result: RenderResult, id: string, channel = 0) =>
  result.taps[id]!.channels_data[channel]!
/** A stretch of sound's level, in dB against full scale. */
const levelOf = (x: Float32Array, from = 0, to = x.length) => gainToDb(rms(x, from, to))
/** A tap's level over the loop and both of its sides, in dB against full scale. */
const levelOfBoth = (result: RenderResult, id: string) =>
  gainToDb(Math.hypot(rms(tap(result, id, 0)), rms(tap(result, id, 1))) / Math.SQRT2)
const ms = (samples: number) => (samples * 1000) / RATE

/**
 * How much of `x` lies round `hz`, moment by moment: the wave times a vector turning at `hz`,
 * averaged under a Hann window `width` samples long (10 ms when left out, which is 400 Hz wide).
 */
function band(x: Float32Array, hz: number, width = 480): Float32Array {
  const n = x.length
  const re = new Float64Array(n)
  const im = new Float64Array(n)
  const turn = (2 * Math.PI * hz) / RATE
  for (let i = 0; i < n; i += 1) {
    re[i] = x[i]! * Math.cos(turn * i)
    im[i] = -x[i]! * Math.sin(turn * i)
  }
  const shape = new Float64Array(width)
  let whole = 0
  for (let k = 0; k < width; k += 1) {
    shape[k] = 0.5 - 0.5 * Math.cos((2 * Math.PI * (k + 0.5)) / width)
    whole += shape[k]!
  }
  const out = new Float32Array(n)
  const half = width >> 1
  for (let i = 0; i < n; i += 1) {
    let a = 0
    let b = 0
    for (let k = Math.max(0, half - i); k < width && i - half + k < n; k += 1) {
      a += re[i - half + k]! * shape[k]!
      b += im[i - half + k]! * shape[k]!
    }
    out[i] = (2 * Math.hypot(a, b)) / whole
  }
  return out
}

/** Where `x` is largest from `from` up to `to`. */
function largest(x: Float32Array, from = 0, to = x.length): number {
  let at = from
  for (let i = from; i < Math.min(to, x.length); i += 1) if (x[i]! > x[at]!) at = i
  return at
}

/**
 * The first `count` echoes of a click in the part of a sound round `hz`: when each is at its
 * largest, in milliseconds from the start of `x`, and how large, in dB. The first is looked for
 * in the 45 ms from `from`, and each one after it between 30 and 60 ms after the one before,
 * which holds the round trip of every spring of the device.
 */
function echoes(x: Float32Array, hz: number, count: number, from = 0) {
  const size = band(x, hz)
  const found: { at: number; level: number }[] = []
  let lo = from
  let hi = from + seconds(0.045)
  for (let k = 0; k < count; k += 1) {
    const at = largest(size, lo, hi)
    found.push({ at: ms(at), level: gainToDb(size[at]!) })
    lo = at + seconds(0.03)
    hi = at + seconds(0.06)
  }
  return found
}

/**
 * The springs' answer to one click, as the lab's second device gives it whatever plays: the
 * taps `hitLeft` and `hitRight`, 140 ms at the page's rate, written as the answer to a click of
 * full scale. Nothing need go in for it, so a second of silence does.
 */
const answer = (tank: Lab, values: Record<string, number> = {}) =>
  tank.render(silence(seconds(1)), values)

/** One click a tenth of full scale, half a second into four seconds of silence. */
const CLICK_AT = seconds(0.5)
const oneClick = () => click(seconds(4), CLICK_AT, 0.1)

/** What the tank so far makes of that click, from the click on: the left side of `built`. */
const builtFromClick = (tank: Lab, build: number, values: Record<string, number> = {}) =>
  tap(tank.render(oneClick(), { ...values, build }), 'built').subarray(CLICK_AT)

/**
 * How fast the part of a click's tail round `hz` dies away, in dB a second: its level from 0.2 s
 * to 0.6 s after the click, less its level a second later.
 */
function fallRate(tail: Float32Array, hz: number): number {
  const size = band(tail.subarray(0, seconds(1.7)), hz, 960)
  return levelOf(size, seconds(0.2), seconds(0.6)) - levelOf(size, seconds(1.2), seconds(1.6))
}

/**
 * How alike two stretches of a sound are once the highs are averaged away (a mean over 2 ms):
 * 1 when the second is the first again, −1 when it is the first turned upside down.
 */
function likeness(x: Float32Array, first: number, second: number, length: number): number {
  const smooth = (i: number) => {
    let sum = 0
    for (let k = -48; k <= 48; k += 1) sum += x[i + k] ?? 0
    return sum
  }
  let both = 0
  let one = 0
  let other = 0
  for (let i = 0; i < length; i += 1) {
    const a = smooth(first + i)
    const b = smooth(second + i)
    both += a * b
    one += a * a
    other += b * b
  }
  return both / Math.sqrt(one * other)
}

/** The stretch of `length` samples in which a sound is quietest, looked for every 10 ms. */
function quietest(x: Float32Array, length: number): number {
  let at = 0
  let least = Infinity
  for (let i = 0; i + length <= x.length; i += 480) {
    const here = rms(x, i, i + length)
    if (here < least) {
      least = here
      at = i
    }
  }
  return at
}

const LOOPS = ['drums', 'guitar', 'chords', 'bass', 'pad', 'mix']
/** Every sound the lesson's page offers: its `sources`. */
const PAGE_LOOPS = ['drums', 'guitar', 'chords', 'pad', 'bass', 'mix', 'clicks', 'noise']

describe('the spring reverb lab', () => {
  it('is a sound lab on the drums: every tap says something, every sound loops, every control moves the main path', async () => {
    const tank = await lab('spring-reverb')
    const drums = await benchSource('drums', seconds(4))
    expectSoundLab(tank, drums, tank.render(drums, {}))
  })

  it('builds a piece at a time, and the whole build is the tank of the device', async () => {
    const tank = await lab('spring-reverb')
    const drums = await benchSource('drums', seconds(4))
    // On Two, where the lab starts, the third spring is fed nothing: Three lets its lane speak.
    expectBuild(tank, drums, { springs: 2 })
  })

  it('finds the drums at −85 dB in their quietest fifth of a second (claim dry-gap)', async () => {
    const tank = await lab('spring-reverb')
    const dry = tap(await played(tank, 'dry'), 'in')
    const at = quietest(dry, seconds(0.2))
    expectWritten(levelOf(dry, at, at + seconds(0.2)), '−85 dB')
  })

  it('with the springs at the device’s own settings fills that quietest stretch of the drums to −33 dB (claim sprung-gap)', async () => {
    const tank = await lab('spring-reverb')
    const result = await played(tank, 'sprung')
    const at = quietest(tap(result, 'in'), seconds(0.2))
    expectWritten(levelOf(tap(result, 'out'), at, at + seconds(0.2)), '−33 dB')
    // The card is the device as it starts: the settings file's defaults.
    const { values } = resolveSet(tank.description, settings.sets.sprung!)
    expect(values).toEqual(
      resolveSet(tank.description, { values: settings.defaults!.values }).values,
    )
  })

  it('brings the part of the first echo round 500 Hz at 23.8 ms and the part round 3 kHz at 28.6 ms, which is 4.8 ms later (claim low-first)', async () => {
    const tank = await lab('spring-reverb')
    const left = tap(answer(tank), 'hitLeft')
    const low = echoes(left, 500, 1)[0]!.at
    const high = echoes(left, 3000, 1)[0]!.at
    expectWritten(low, '23.8 ms')
    expectWritten(high, '28.6 ms')
    expectWritten(high - low, '4.8 ms')
    // And every part between them in its turn: the higher, the later.
    const arrivals = [500, 1000, 1500, 2000, 2500, 3000, 3500].map(
      (hz) => echoes(left, hz, 1)[0]!.at,
    )
    for (let k = 1; k < arrivals.length; k += 1)
      expect(arrivals[k]!, `part ${k} of ${arrivals.join(', ')}`).toBeGreaterThan(arrivals[k - 1]!)
  })

  it('stretches each echo further than the last: 3 kHz trails 500 Hz by 9.3 ms in the second and by 13.9 ms in the third (claim stretch)', async () => {
    const tank = await lab('spring-reverb')
    const left = tap(answer(tank), 'hitLeft')
    const low = echoes(left, 500, 3)
    const high = echoes(left, 3000, 3)
    expectWritten(high[1]!.at - low[1]!.at, '9.3 ms')
    expectWritten(high[2]!.at - low[2]!.at, '13.9 ms')
  })

  it('draws the feet of the first three strokes, round 300 Hz, at 24 ms, 65 ms and 106 ms, and their parts round 3 kHz at 29 ms, 74 ms and 120 ms (claim strokes)', async () => {
    const tank = await lab('spring-reverb')
    const left = tap(answer(tank), 'hitLeft')
    const feet = echoes(left, 300, 3)
    const tops = echoes(left, 3000, 3)
    for (const [k, written] of ['24 ms', '65 ms', '106 ms'].entries())
      expectWritten(feet[k]!.at, written)
    for (const [k, written] of ['29 ms', '74 ms', '120 ms'].entries())
      expectWritten(tops[k]!.at, written)
    // The picture is of the same answer: its loudest cell in the first 45 ms lies under 1 kHz
    // earlier than its loudest cell between 2.5 and 3.5 kHz.
    const picture = answer(tank).taps.chirps!
    const cells = picture.channels_data[0]!
    const rows = cells.length / picture.columns
    const loudestColumn = (lowHz: number, highHz: number) => {
      let best = -Infinity
      let at = 0
      for (let col = 0; col < Math.round((0.045 / 0.35) * picture.columns); col += 1) {
        for (
          let row = Math.round((lowHz / 24000) * (rows - 1));
          row <= (highHz / 24000) * (rows - 1);
          row += 1
        ) {
          if (cells[col * rows + row]! > best) {
            best = cells[col * rows + row]!
            at = col
          }
        }
      }
      return at
    }
    expect(rows).toBe(513)
    expect(loudestColumn(100, 1000)).toBeLessThan(loudestColumn(2500, 3500))
  })

  it('on the kit card fills the quietest fifth of a second between the hits to −41 dB, where the drums alone stood at −85 dB (claim use-kit)', async () => {
    const tank = await lab('spring-reverb')
    const result = await played(tank, 'kit')
    const dry = tap(result, 'in')
    const at = quietest(dry, seconds(0.2))
    expectWritten(levelOf(dry, at, at + seconds(0.2)), '−85 dB')
    expectWritten(levelOf(tap(result, 'out'), at, at + seconds(0.2)), '−41 dB')
  })

  it('on the guitar card adds springs that stand 0.1 dB over the dry line, measured over the loop and both sides (claim use-guitar)', async () => {
    const tank = await lab('spring-reverb')
    const result = await played(tank, 'guitar')
    expectWritten(levelOfBoth(result, 'added') - dryLevel(result), '0.1 dB')
  })

  it('on the chords card, with Pre-delay at 30 ms, brings the foot of the first echo at 55 ms, where with none it stood at 25 ms (claim use-chords)', async () => {
    const tank = await lab('spring-reverb')
    const { values } = resolveSet(tank.description, settings.sets.chords!)
    expect(values.predelay).toBe(30)
    const foot = (predelay: number) =>
      echoes(
        tap(answer(tank, { ...values, predelay }), 'hitLeft'),
        300,
        1,
        seconds(predelay / 1000),
      )[0]!.at
    expectWritten(foot(30), '55 ms')
    expectWritten(foot(0), '25 ms')
  })

  describe('the build', () => {
    it('with a line and a pickup alone gives a click back once, 21.3 ms after it went in (claim build-line)', async () => {
      const tank = await lab('spring-reverb')
      const heard = builtFromClick(tank, 0)
      const size = Float32Array.from(heard, Math.abs)
      const at = largest(size)
      expectWritten(ms(at), '21.3 ms')
      // Once: from 20 ms after it, where the next piece's echoes will come, there is next to nothing.
      const later = at + seconds(0.02)
      const rest = rms(heard, later) * Math.sqrt(heard.length - later)
      const whole = rms(heard) * Math.sqrt(heard.length)
      expect(gainToDb(rest / whole)).toBeLessThan(-60)
    })

    it('with the all-passes brings the part of a click round 3 kHz 4.8 ms after the part round 500 Hz, where the line alone brought them 0.3 ms apart (claim build-disperse)', async () => {
      const tank = await lab('spring-reverb')
      const apart = (build: number) => {
        const heard = builtFromClick(tank, build)
        return echoes(heard, 3000, 1)[0]!.at - echoes(heard, 500, 1)[0]!.at
      }
      expectWritten(apart(1), '4.8 ms')
      // The piece switched off: the step before.
      expectWritten(apart(0), '0.3 ms')
      expect(matchesWritten(apart(0), '4.8 ms')).toBe(false)
      // An all-pass passes every frequency at full level: neither part is louder or quieter.
      for (const hz of [500, 1000, 2000, 3000]) {
        const before = echoes(builtFromClick(tank, 0), hz, 1)[0]!.level
        const after = echoes(builtFromClick(tank, 1), hz, 1)[0]!.level
        expect(Math.abs(after - before)).toBeLessThan(0.1)
      }
    })

    it('with feedback brings the click back every 41 ms round 500 Hz, each time 1.0 dB lower, and every 46 ms round 3 kHz; without it there is no second echo (claim build-echoes)', async () => {
      const tank = await lab('spring-reverb')
      const heard = builtFromClick(tank, 2)
      const low = echoes(heard, 500, 3)
      expectWritten(low[1]!.at - low[0]!.at, '41 ms')
      expectWritten(low[2]!.at - low[1]!.at, '41 ms')
      expectWritten(low[0]!.level - low[1]!.level, '1.0 dB')
      expectWritten(low[1]!.level - low[2]!.level, '1.0 dB')
      const high = echoes(heard, 3000, 3)
      expectWritten(high[1]!.at - high[0]!.at, '46 ms')
      expectWritten(high[2]!.at - high[1]!.at, '46 ms')
      // The piece switched off: where the second echo was, the step before has nothing.
      const before = echoes(builtFromClick(tank, 1), 500, 2)
      expect(matchesWritten(before[0]!.level - before[1]!.level, '1.0 dB')).toBe(false)
      expect(before[0]!.level - before[1]!.level).toBeGreaterThan(100)
    })

    it('turns each echo upside down: the second is the first again with its sign changed (claim build-inverts)', async () => {
      const tank = await lab('spring-reverb')
      const heard = builtFromClick(tank, 2)
      const first = Math.round((echoes(heard, 300, 1)[0]!.at * RATE) / 1000)
      const trip = Math.round(0.0412 * RATE)
      expect(likeness(heard, first - 240, first - 240 + trip, 480)).toBeLessThan(-0.9)
    })

    it('with damping makes the tail of a click round 3 kHz fall 40 dB a second where it fell 22 dB a second, and round 600 Hz 25 dB a second where it fell 24 dB, from its level 0.2 s to 0.6 s after the click to its level a second later (claim build-damping)', async () => {
      const tank = await lab('spring-reverb')
      const before = builtFromClick(tank, 2)
      const after = builtFromClick(tank, 3)
      // Whole decibels: the two stretches hold whole echoes, and a rate read off them moves
      // by half a decibel a second when they start 20 ms sooner or later.
      expectWritten(fallRate(before, 3000), '22 dB')
      expectWritten(fallRate(after, 3000), '40 dB')
      expectWritten(fallRate(before, 600), '24 dB')
      expectWritten(fallRate(after, 600), '25 dB')
      // The piece switched off: the step before does not fall at the damped rate.
      expect(matchesWritten(fallRate(before, 3000), '40 dB')).toBe(false)
      expect(matchesWritten(fallRate(before, 600), '25 dB')).toBe(false)
      // Without it the top outlasts the bottom, and with it the bottom outlasts the top.
      expect(fallRate(before, 3000)).toBeLessThan(fallRate(before, 600) - 1)
      expect(fallRate(after, 3000)).toBeGreaterThan(fallRate(after, 600) + 10)
    })

    it('with drift answers two clicks two seconds apart differently: the difference stands 5 dB under the answers in their first tenth of a second, and more than 100 dB under them without it; the far end stays less than 0.3 samples from its place (claim build-drift)', async () => {
      const tank = await lab('spring-reverb')
      const two = oneClick()
      two.left[CLICK_AT + seconds(2)] = 0.1
      two.right[CLICK_AT + seconds(2)] = 0.1
      const under = (build: number) => {
        const heard = tap(tank.render(two, { build }), 'built')
        const first = heard.subarray(CLICK_AT, CLICK_AT + seconds(0.1))
        const second = heard.subarray(CLICK_AT + seconds(2), CLICK_AT + seconds(2.1))
        return -differenceDb(second, first)
      }
      // A whole decibel: the third echo begins as the tenth of a second ends, and the number
      // moves by more than a decibel when the stretch is a hundredth of a second longer.
      expectWritten(under(4), '5 dB')
      // The piece switched off: the step before answers both clicks alike.
      expectWritten(under(3), 'more than 100 dB')
      expect(matchesWritten(under(3), '5 dB')).toBe(false)
      const moved = range(tap(tank.render(two, { build: 4 }), 'builtWander'))
      expectWritten(Math.max(-moved.lo, moved.hi), 'less than 0.3 samples')
      expect(moved.span).toBeGreaterThan(0.3)
      expect(range(tap(tank.render(two, { build: 3 }), 'builtWander')).span).toBe(0)
    })

    it('with several springs, on Two, brings the right side’s echoes 36 ms apart and the left’s 41 ms; before it the two sides were one (claim build-several)', async () => {
      const tank = await lab('spring-reverb')
      const sides = (build: number) => {
        const result = tank.render(oneClick(), { build })
        return [0, 1].map((channel) => {
          const found = echoes(tap(result, 'built', channel).subarray(CLICK_AT), 500, 2)
          return found[1]!.at - found[0]!.at
        })
      }
      const [left, right] = sides(5)
      expectWritten(left!, '41 ms')
      expectWritten(right!, '36 ms')
      // The piece switched off: at the step before the right side is the left.
      const [, rightBefore] = sides(4)
      expect(matchesWritten(rightBefore!, '36 ms')).toBe(false)
      const before = tank.render(oneClick(), { build: 4 })
      expect(tap(before, 'built', 1)).toEqual(tap(before, 'built', 0))
    })

    it('with every piece is the tank of the device, sample for sample, on every loop of the page and at every setting tried (claim build-same)', async () => {
      const tank = await lab('spring-reverb')
      const tried: Record<string, number>[] = [
        {},
        { springs: 0, tension: 0, decay: 0.5 },
        { springs: 2, tension: 1, decay: 6 },
        { mix: 0.3, tone: 3500, drip: 0.4, drive: 0.25, predelay: 80, width: 0.5 },
      ]
      for (const loop of PAGE_LOOPS) {
        const source = await benchSource(loop, seconds(4))
        for (const values of tried) {
          // On the last step the build the reader sees is the one compared. On the drums the
          // first step too, where a second build with every piece runs beside the one shown.
          for (const build of loop === 'drums' ? [0, 5] : [5]) {
            const { checks } = tank.render(source, { ...values, build })
            // The largest difference in any one sample between a pickup as built and the
            // device's own: 0 when every sample of all three is the same, and only then.
            expect(checks.builtWorst, `${loop} ${JSON.stringify(values)}`).toBe(0)
            // −140 dB is the floor of the other reading, which says only "more than 140 dB under".
            expect(checks.builtDifference, `${loop} ${JSON.stringify(values)}`).toBe(-140)
          }
        }
      }
    })
  })

  describe('the stages of the device', () => {
    it('works the drive circuit and the low-pass out again to less than −120 dB of what the device’s tank took in (claim rebuilt)', async () => {
      const tank = await lab('spring-reverb')
      const tried: [string, Record<string, number>][] = [
        ['drums', {}],
        ['drums', { drip: 1, drive: 1, predelay: 37.3 }],
        ['mix', { mix: 0.3, tone: 3500, drip: 0.4, drive: 0.25 }],
        ['guitar', { drip: 0.6, drive: 0.5, predelay: 200 }],
      ]
      for (const [loop, values] of tried) {
        const { checks } = tank.render(await benchSource(loop, seconds(4)), values)
        expectWritten(checks.rebuilt!, 'less than −120 dB')
      }
    })

    it('with Drip at 1 sends a tone at 3 kHz into the tank 11.2 dB louder and a tone at 500 Hz 2.8 dB louder (claim drip-lift)', async () => {
      const tank = await lab('spring-reverb')
      const lift = (hz: number) => {
        const tone = sine(hz, 0.05, seconds(2))
        const level = (drip: number) => levelOf(tap(tank.render(tone, { drip }), 'driven'))
        return level(1) - level(0)
      }
      expectWritten(lift(3000), '11.2 dB')
      expectWritten(lift(500), '2.8 dB')
    })

    it('with Drive at 1 lets nothing out of the drive circuit taller than 16.9 dB under full scale, however loud a 440 Hz tone goes in (claim drive-ceiling)', async () => {
      const tank = await lab('spring-reverb')
      const top = (size: number) =>
        gainToDb(peak(tap(tank.render(sine(440, size, seconds(2)), { drive: 1 }), 'driven')))
      expectWritten(-top(1), '16.9 dB')
      // However loud: a tone half that size stands at the same ceiling.
      expectWritten(-top(0.5), '16.9 dB')
      // A tone a tenth the size goes through nearly whole: the ceiling is a ceiling, not a gain.
      expect(-top(0.1)).toBeGreaterThan(20)
      expect(-top(0.1)).toBeLessThan(22)
    })

    it('on the way down to the tank takes 3.0 dB from a tone at 3,840 Hz and 32.7 dB from one at 4,800 Hz (claim down-corner)', async () => {
      const tank = await lab('spring-reverb')
      const loss = (hz: number) => {
        const result = tank.render(sine(hz, 0.05, seconds(2)), {})
        return levelOf(tap(result, 'driven')) - levelOf(tap(result, 'lowered'))
      }
      expectWritten(loss(3840), '3.0 dB')
      expectWritten(loss(4800), '32.7 dB')
      expect(loss(1000)).toBeLessThan(0.01)
    })

    it('holds 500 Hz back 2.5 ms and 3 kHz back 7.0 ms in the hundred all-passes, with Tension at 0.5 (claim held)', async () => {
      const tank = await lab('spring-reverb')
      const held = heldAt(answer(tank))
      expectWritten(held(500), '2.5 ms')
      expectWritten(held(3000), '7.0 ms')
    })

    it('holds 3 kHz back 5.6 ms longer than 500 Hz with Tension at 0 and 2.5 ms longer with it at 1 (claim tension-ends)', async () => {
      const tank = await lab('spring-reverb')
      const slack = heldAt(answer(tank, { tension: 0 }))
      const taut = heldAt(answer(tank, { tension: 1 }))
      expectWritten(slack(3000) - slack(500), '5.6 ms')
      expectWritten(taut(3000) - taut(500), '2.5 ms')
    })

    it('measures the hold of the device’s all-passes to less than 0.001 ms of the formula, at every Tension tried (claim held-formula)', async () => {
      const tank = await lab('spring-reverb')
      for (const tension of [0, 0.25, 0.5, 0.75, 1]) {
        const result = answer(tank, { tension })
        expectWritten(result.checks.heldBackError!, 'less than 0.001 ms')
        // The check is of the two curves the figure draws.
        const measured = tap(result, 'heldBack')
        const written = tap(result, 'heldBackFormula')
        let worst = 0
        for (let p = 0; p < measured.length; p += 1)
          worst = Math.max(worst, Math.abs(measured[p]! - written[p]!))
        expect(worst).toBeCloseTo(result.checks.heldBackError!, 6)
      }
    })

    it('keeps the echoes 41.2 ms apart round 300 Hz whether Tension is at 0, at 0.5 or at 1 (claim spacing-holds)', async () => {
      const tank = await lab('spring-reverb')
      for (const tension of [0, 0.5, 1]) {
        const found = echoes(tap(answer(tank, { tension }), 'hitLeft'), 300, 3)
        expectWritten(found[1]!.at - found[0]!.at, '41.2 ms')
        expectWritten(found[2]!.at - found[1]!.at, '41.2 ms')
      }
    })

    it('lets the far end of the first spring wander between 0.26 samples one way and 0.30 samples the other over the loop (claim wander-range)', async () => {
      const tank = await lab('spring-reverb')
      const drums = await benchSource('drums', seconds(4))
      const wander = tap(tank.render(drums, {}), 'wander')
      const moved = range(wander)
      expectWritten(-moved.lo, '0.26 samples')
      expectWritten(moved.hi, '0.30 samples')
      // The lane is the kit's oscillator run beside the device, and the build's far end is the
      // same oscillator. With every piece the build is the device's tank sample for sample
      // (claim build-same), which it could not be if its far end drifted otherwise.
      expect(tap(tank.render(drums, { build: 5 }), 'builtWander')).toEqual(wander)
    })

    it('with Decay at 2.5 s lets the tank fall 60 dB in 2.4 s below 1 kHz and in 1.9 s above 2.5 kHz (claim fall)', async () => {
      const tank = await lab('spring-reverb')
      const { checks } = answer(tank)
      expectWritten(checks.fallLowTime!, '2.4 s')
      expectWritten(checks.fallHighTime!, '1.9 s')
    })

    it('turns each echo of the device upside down (claim inverts)', async () => {
      const tank = await lab('spring-reverb')
      const left = tap(answer(tank), 'hitLeft')
      const first = Math.round((echoes(left, 300, 1)[0]!.at * RATE) / 1000)
      const trip = Math.round(0.0412 * RATE)
      expect(likeness(left, first - 240, first - 240 + trip, 480)).toBeLessThan(-0.9)
    })

    it('on Two brings the right side’s echoes 36 ms apart round 500 Hz, the first of them at 20.8 ms (claim second-spring)', async () => {
      const tank = await lab('spring-reverb')
      const found = echoes(tap(answer(tank), 'hitRight'), 500, 2)
      expectWritten(found[0]!.at, '20.8 ms')
      expectWritten(found[1]!.at - found[0]!.at, '36 ms')
    })

    it('on One answers a click 3.5 dB quieter on each side than on Two, and alike on both sides (claim one-quieter)', async () => {
      const tank = await lab('spring-reverb')
      const one = answer(tank, { springs: 0 })
      const two = answer(tank, { springs: 1 })
      expectWritten(levelOf(tap(two, 'hitLeft')) - levelOf(tap(one, 'hitLeft')), '3.5 dB')
      expect(tap(one, 'hitRight')).toEqual(tap(one, 'hitLeft'))
    })

    it('with Tone at 500 Hz takes 3.0 dB from the first echo round 500 Hz and 31 dB from it round 3 kHz, against Tone at 6,000 Hz (claim tone-500)', async () => {
      const tank = await lab('spring-reverb')
      const level = (tone: number, hz: number) =>
        echoes(tap(answer(tank, { tone }), 'hitLeft'), hz, 1)[0]!.level
      expectWritten(level(6000, 500) - level(500, 500), '3.0 dB')
      expectWritten(level(6000, 3000) - level(500, 3000), '31 dB')
    })

    it('from Decay at 0.5 s to Decay at 6 s lets the pickup rise 6.7 dB on the drums and what the springs add rise 3.0 dB (claim level-holds)', async () => {
      const tank = await lab('spring-reverb')
      const drums = await benchSource('drums', seconds(4))
      const short = tank.render(drums, { decay: 0.5 })
      const long = tank.render(drums, { decay: 6 })
      expectWritten(levelOf(tap(long, 'pickup')) - levelOf(tap(short, 'pickup')), '6.7 dB')
      expectWritten(levelOfBoth(long, 'added') - levelOfBoth(short, 'added'), '3.0 dB')
    })

    it('with Mix at 0.5 puts the dry sound 3.0 dB down and the springs 3.0 dB down (claim mix-half)', async () => {
      const tank = await lab('spring-reverb')
      const hiss = noise(0.25, seconds(4))
      const half = tank.render(hiss, { mix: 0.5 })
      const whole = tank.render(hiss, {})
      expectWritten(levelOfBoth(half, 'in') - dryLevel(half), '3.0 dB')
      expectWritten(levelOfBoth(whole, 'added') - levelOfBoth(half, 'added'), '3.0 dB')
    })

    it('with Mix at 0 puts out the input, sample for sample (claim mix-zero)', async () => {
      const tank = await lab('spring-reverb')
      const result = tank.render(await benchSource('drums', seconds(4)), { mix: 0 })
      for (const channel of [0, 1])
        expect(tap(result, 'out', channel)).toEqual(tap(result, 'in', channel))
    })

    it('with Width at 0 puts the same on both sides, sample for sample (claim width-zero)', async () => {
      const tank = await lab('spring-reverb')
      const result = tank.render(await benchSource('drums', seconds(4)), { width: 0 })
      expect(tap(result, 'out', 1)).toEqual(tap(result, 'out', 0))
      expect(tap(result, 'hitRight')).toEqual(tap(result, 'hitLeft'))
      // At 1 they are not: each side is a spring of its own.
      const wide = tank.render(await benchSource('drums', seconds(4)), {})
      expect(differenceDb(tap(wide, 'out', 1), tap(wide, 'out', 0))).toBeGreaterThan(-6)
    })

    it('with Pre-delay at 60 ms brings the first echo 60.0 ms later (claim predelay-shift)', async () => {
      const tank = await lab('spring-reverb')
      const at = (predelay: number) =>
        echoes(tap(answer(tank, { predelay }), 'hitLeft'), 500, 1, seconds(predelay / 1000))[0]!.at
      expectWritten(at(60) - at(0), '60.0 ms')
    })
  })

  describe('the cards', () => {
    it('with Tension at 0 lets the part of the first echo round 3,500 Hz trail the part round 500 Hz by 10.2 ms, and with Tension at 1 by 5.8 ms (claim way-slack)', async () => {
      const tank = await lab('spring-reverb')
      const trail = (tension: number) => {
        const left = tap(answer(tank, { tension }), 'hitLeft')
        return echoes(left, 3500, 1)[0]!.at - echoes(left, 500, 1)[0]!.at
      }
      expectWritten(trail(0), '10.2 ms')
      expectWritten(trail(1), '5.8 ms')
    })

    it('on the card that keeps the springs clear brings the foot of the first echo at 104 ms, where it stood at 24 ms (claim way-clear)', async () => {
      const tank = await lab('spring-reverb')
      const { values } = resolveSet(tank.description, settings.sets.clear!)
      const foot = (over: Record<string, number>) =>
        echoes(
          tap(answer(tank, { ...values, ...over }), 'hitLeft'),
          300,
          1,
          seconds((over.predelay ?? values.predelay!) / 1000),
        )[0]!.at
      expectWritten(foot({}), '104 ms')
      expectWritten(foot({ predelay: 0 }), '24 ms')
    })

    it('on the driven card lets the springs add 4.3 dB less than the same card with Drive at 0, their loudest tenth of a second 5 dB less and their quietest 3 dB less (claim way-driven)', async () => {
      const tank = await lab('spring-reverb')
      const hard = await played(tank, 'driven')
      const clean = await played(tank, 'driven', { drive: 0 })
      expectWritten(levelOfBoth(clean, 'added') - levelOfBoth(hard, 'added'), '4.3 dB')
      // What the springs add on the left, a tenth of a second at a time from the loop's start.
      const tenths = (result: RenderResult) => {
        const x = tap(result, 'added')
        const levels: number[] = []
        for (let i = 0; i + seconds(0.1) <= x.length; i += seconds(0.1))
          levels.push(levelOf(x, i, i + seconds(0.1)))
        return { loudest: Math.max(...levels), quietest: Math.min(...levels) }
      }
      expectWritten(tenths(clean).loudest - tenths(hard).loudest, '5 dB')
      expectWritten(tenths(clean).quietest - tenths(hard).quietest, '3 dB')
    })

    it('on the narrow card puts the same on both sides, sample for sample (claim way-narrow)', async () => {
      const tank = await lab('spring-reverb')
      const result = await played(tank, 'narrow')
      expect(tap(result, 'added', 1)).toEqual(tap(result, 'added', 0))
    })

    it('lets noise out of the springs 50 dB lower round 6 kHz than it went in (claim fault-dull)', async () => {
      const tank = await lab('spring-reverb')
      const result = await played(tank, 'dull')
      const round = (id: string) =>
        levelOf(band(tap(result, id).subarray(0, seconds(1)), 6000, 960))
      expectWritten(round('in') - round('out'), '50 dB')
    })

    it('on the card of one spring alone puts the same on both sides, sample for sample (claim fault-flutter)', async () => {
      const tank = await lab('spring-reverb')
      const result = await played(tank, 'flutter')
      expect(tap(result, 'out', 1)).toEqual(tap(result, 'out', 0))
    })

    it('with Decay at 2.5 s takes at least 2.4 s and at most 2.5 s to fall 60 dB below 1 kHz on every setting of Springs (claim myth-springs)', async () => {
      const tank = await lab('spring-reverb')
      for (const springs of [0, 1, 2]) {
        const { checks } = answer(tank, { springs })
        expectWritten(checks.fallLowTime!, 'at least 2.4 s')
        expectWritten(checks.fallLowTime!, 'at most 2.5 s')
      }
    })

    it('with Drive at 1 sends a 440 Hz tone that goes in 20 dB under full scale out of the drive circuit 21 dB under it, and one at full scale 17 dB under (claim fault-level)', async () => {
      const tank = await lab('spring-reverb')
      const top = (size: number) =>
        gainToDb(peak(tap(tank.render(sine(440, size, seconds(2)), { drive: 1 }), 'driven')))
      // Whole decibels: the quieter tone measures 21.24, a hair from the next tenth.
      expectWritten(-top(0.1), '21 dB')
      expectWritten(-top(1), '17 dB')
      // What is left of the 20 dB between the two tones: 4.34.
      expectWritten(top(1) - top(0.1), '4 dB')
    })

    it('renders every named set: its sound is there, finite, and not silent', async () => {
      const tank = await lab('spring-reverb')
      for (const [name, set] of Object.entries(settings.sets)) {
        const { values, source, tap: sounding } = resolveSet(tank.description, set)
        const result = tank.render(await benchSource(source!, seconds(4)), values)
        const heard = result.taps[sounding ?? 'out']
        expect(heard?.kind, `${name} plays a sound`).toBe('audio')
        for (const data of heard!.channels_data) {
          expect(
            data.every((v) => Number.isFinite(v)),
            `${name} is finite`,
          ).toBe(true)
        }
        const level = levelOfBoth(result, heard!.id)
        expect(level, `${name} is not silent`).toBeGreaterThan(-60)
        expect(
          gainToDb(peak(heard!.channels_data[0]!)),
          `${name} stays under full scale`,
        ).toBeLessThan(0)
      }
    })

    it('plays the tile between −36 and −5 dB on each of the six loops of the map', async () => {
      const tank = await lab('spring-reverb')
      const tile = settings.tile!
      for (const loop of LOOPS) {
        const result = tank.render(await benchSource(loop, seconds(4)), tile.values)
        const level = levelOfBoth(result, tile.tap)
        expect(level, loop).toBeGreaterThan(-36)
        expect(level, loop).toBeLessThan(-5)
      }
    })

    it("starts the page's device table from the device's own defaults: the settings file's defaults, laid over the lab's starting values, are device.json's", async () => {
      const tank = await lab('spring-reverb')
      const device = JSON.parse(
        fs.readFileSync(
          fileURLToPath(new URL('../../../cpp/devices/spring-reverb/device.json', import.meta.url)),
          'utf8',
        ),
      ) as { params: { key: string; default: number }[] }
      const { values } = resolveSet(tank.description, { values: settings.defaults!.values })
      const written = Object.fromEntries(device.params.map((one) => [one.key, one.default]))
      expect(Object.keys(values).sort()).toEqual(Object.keys(written).sort())
      for (const [id, value] of Object.entries(written)) expect(values[id]).toBeCloseTo(value, 5)
      // Only what differs from the lab's start is written down.
      for (const [id, value] of Object.entries(settings.defaults!.values)) {
        expect(tank.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
      }
    })
  })
})

/** The dry sound's level in what comes out: the output less what the springs add, both sides. */
function dryLevel(result: RenderResult): number {
  const level = (channel: number) => {
    const out = tap(result, 'out', channel)
    const added = tap(result, 'added', channel)
    let sum = 0
    for (let i = 0; i < out.length; i += 1) sum += (out[i]! - added[i]!) ** 2
    return sum / out.length
  }
  return 10 * Math.log10(Math.max((level(0) + level(1)) / 2, 1e-18))
}

/** The hold of the all-passes at a frequency, read off the lab's measured curve, in ms. */
function heldAt(result: RenderResult): (hz: number) => number {
  const curve = result.taps.heldBack!
  const data = curve.channels_data[0]!
  return (hz: number) => {
    const p = ((hz - curve.x0) / (curve.x1 - curve.x0)) * (data.length - 1)
    expect(Number.isInteger(p), `${hz} Hz is a point of the curve`).toBe(true)
    return data[p]!
  }
}
