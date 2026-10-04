// The truth of the tails' displays: every figure they draw against the
// device's own formula, worked out by hand from its header or measured from
// its compiled code, and the handles against the figures they stand for.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  SWARM_STEPS,
  TAILS_FACES,
  bloomIntensity,
  bloomRatios,
  expanseArrival,
  expanseSeconds,
  fallEnd,
  fallThrough,
  foldVowel,
  formantsAt,
  hzOfNote,
  noteName,
  secondsText,
  shimmerLadder,
  stringSeconds,
  swarmEchoes,
  swarmOctaves,
  swarmRt60,
  swarmSeconds,
  swarmTaps,
  sympatheticNotes,
  sympatheticScale,
  valleySeconds,
  vowelDb,
} from '../components/displays/tails'
import { type DisplayHandle } from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()

function face(id: string) {
  const descriptor = stock.get(id)
  if (!descriptor) throw new Error(`no device ${id}`)
  return { display: TAILS_FACES[id].display, params: descriptor.params, descriptor }
}

/** A display's handle by key, at some settings. */
function handleOf(id: string, key: string, values: Record<string, number> = {}): DisplayHandle {
  const { display, params } = face(id)
  const found = display.handles?.(viewOf(display, params, { values })).find((h) => h.key === key)
  if (!found) throw new Error(`${id} has no handle ${key}`)
  return found
}

/** How often a drawing stroked or filled in the accent. */
function accents(drawn: RecordingContext): number {
  return drawn.calls.filter(
    (call) =>
      (call.name === 'set strokeStyle' || call.name === 'set fillStyle') &&
      call.args[0] === PLAIN_COLOURS.accent,
  ).length
}

/** The panel every tail is drawn in, on a window of two columns (see `panels` in tails.ts). */
const TAIL = { x: 4, y: 61, w: 120, h: 35 }

describe('the tail every one of them shares', () => {
  it('says a time the way a player reads it', () => {
    expect(secondsText(0.32)).toBe('320 ms')
    expect(secondsText(5)).toBe('5.0 s')
    expect(secondsText(24)).toBe('24 s')
    expect(secondsText(Infinity)).toBe('∞')
  })

  it('ends a fall of 60 dB at the foot, at the time it takes', () => {
    // 5 s on a panel of 10: half way along, on the foot.
    expect(fallEnd(TAIL, 10, 5)).toEqual([TAIL.x + TAIL.w / 2, TAIL.y + TAIL.h])
    // Begun 2 s in, it ends 2 s later.
    expect(fallEnd(TAIL, 10, 5, 2)[0]).toBeCloseTo(TAIL.x + TAIL.w * 0.7, 6)
  })

  it('leaves at the right edge where the panel is too short, as far down as it has fallen', () => {
    // 20 s on a panel of 10: 30 dB down at the edge, half way to the foot.
    const [x, y] = fallEnd(TAIL, 10, 20)
    expect(x).toBe(TAIL.x + TAIL.w)
    expect(y).toBeCloseTo(TAIL.y + TAIL.h / 2, 6)
    // A tail without end stays at the top.
    expect(fallEnd(TAIL, 10, Infinity)).toEqual([TAIL.x + TAIL.w, TAIL.y])
  })

  it('reads the same time back from the point it put the end at', () => {
    for (const from of [0, 0.4, 1.63]) {
      for (const rt60 of [0.5, 3, 7.5, 12, 40, 300]) {
        const [x, y] = fallEnd(TAIL, 12, rt60, from)
        expect(fallThrough(TAIL, 12, x, y, from) / rt60).toBeCloseTo(1, 4)
      }
    }
  })

  it('rides the fall with what comes out since the last sound went in', () => {
    // A hit, then a tail that really falls 60 dB in 5 s, into Bloom at Decay 5.
    const { display, params } = face('bloom-reverb')
    const drawn = runDisplay(display, params, 3, { signal: testSignal() }, (time) => ({
      signal: testSignal(time < 0.1 ? 0.5 : 0, 0.35 * Math.pow(10, (-60 * time) / 5 / 20)),
    }))
    const dots = drawn.calls.filter((call) => call.name === 'arc' && call.args[2] === 2.25)
    expect(dots).toHaveLength(1)
    const [x, y] = dots[0].args as number[]
    // 2.9 s after the hit on a panel of 10 s, and 35 dB down on its 60.
    expect(x).toBeCloseTo(TAIL.x + TAIL.w * 0.29, 0)
    expect(y).toBeCloseTo(TAIL.y + TAIL.h * (35 / 60), 0)
    // Silence leaves nothing riding.
    const quiet = runDisplay(display, params, 1, { signal: testSignal(0, 0) })
    expect(accents(quiet)).toBe(0)
  })

  it.each(Object.keys(TAILS_FACES))('%s is a window of two columns with four knobs', (id) => {
    const { display, params } = face(id)
    expect(display.place).toBe('window')
    expect(display.columns ?? 2).toBe(2)
    const knobs = TAILS_FACES[id].face ?? []
    expect(knobs).toHaveLength(4)
    for (const name of knobs) expect(Object.keys(params)).toContain(name)
  })
})

describe('Bloom', () => {
  it('shifts by a third of Bloom at once and all of it once the tail is old', () => {
    // SpectralDrifter::process: intensity = bloom * (0.3 + 0.7 * age).
    expect(bloomIntensity(1, 0)).toBeCloseTo(0.3, 9)
    expect(bloomIntensity(1, 1)).toBe(1)
    expect(bloomIntensity(0.5, 0.5)).toBeCloseTo(0.325, 9)
    expect(bloomIntensity(1, 3)).toBe(1)
  })

  it('reaches the interval at full intensity and only part of the way before', () => {
    // 5th, Octave and 5th+Oct, going up.
    expect(bloomRatios(0, 0, 1)[0]).toBeCloseTo(2 ** (7 / 12), 9)
    expect(bloomRatios(1, 0, 1)).toEqual([2])
    expect(bloomRatios(2, 0, 1)).toHaveLength(2)
    // A fresh tail at Bloom 1 plays 30 % of the way from unison to the octave.
    expect(bloomRatios(1, 0, 0.3)[0]).toBeCloseTo(1.3, 9)
    // Down is the same interval below; Scatter is both at once.
    expect(bloomRatios(1, 1, 1)).toEqual([0.5])
    expect(bloomRatios(1, 2, 1)).toEqual([2, 0.5])
    // Atonal has no interval: an octave at full, less than that before.
    expect(bloomRatios(3, 0, 1)).toEqual([2])
    expect(bloomRatios(3, 0, 0.5)[0]).toBeCloseTo(1 + (Math.SQRT2 - 1) * 0.5, 9)
  })

  it('says the Decay as the time to fall 60 dB (measured: 4.9 s at 5)', () => {
    const { display, params } = face('bloom-reverb')
    expect(drawDisplay(display, params).words()).toContain('5.0 s')
    expect(drawDisplay(display, params, { values: { decay: 12 } }).words()).toContain('12 s')
  })

  it('marks the pitch now from the device once sound runs', () => {
    const { display, params } = face('bloom-reverb')
    const still = runDisplay(display, params, 0.5, { signal: testSignal() })
    const marked = runDisplay(display, params, 0.5, {
      signal: testSignal(),
      meters: { age: 0.5, drift: 0.6 },
    })
    expect(accents(marked)).toBeGreaterThan(accents(still))
    // At rest there is nothing in the accent at all.
    expect(accents(drawDisplay(display, params))).toBe(0)
  })

  it('sets Decay from where the tail is let go', () => {
    const handle = handleOf('bloom-reverb', 'decay')
    // The panel is 10 s wide: the foot at a quarter of the way is 2.5 s.
    expect(handle.drag(TAIL.x + TAIL.w / 4, TAIL.y + TAIL.h).decay).toBeCloseTo(2.5, 3)
    expect(handle.drag(handle.x, handle.y).decay).toBeCloseTo(5, 3)
  })
})

describe('Shimmer', () => {
  const plain = {
    decay: 8,
    shimmer: 0,
    interval: 0,
    size: 0.5,
    tone: 8000,
    predelay: 0,
    lowCut: 100,
  }

  it('makes a trip round the tank the mean line long, scaled by Size', () => {
    const middle = shimmerLadder(plain, 4).pass
    expect(middle).toBeCloseTo(0.0706, 3)
    expect(shimmerLadder({ ...plain, size: 0 }, 4).pass).toBeCloseTo(middle / 2, 9)
    expect(shimmerLadder({ ...plain, size: 1 }, 4).pass).toBeCloseTo(middle * 1.5, 9)
  })

  it('with no Shimmer is a plain tail that falls 60 dB in Decay', () => {
    const ladder = shimmerLadder(plain, 30)
    // The note at 220 Hz loses next to nothing to Tone at 8 kHz.
    expect(ladder.rt60).toBeGreaterThan(7.8)
    expect(ladder.rt60).toBeLessThan(8.05)
    // Nothing has climbed.
    expect(Math.max(...ladder.rungs[1])).toBeLessThanOrEqual(-119)
  })

  it('steps by the interval and dies sooner the more is sent up (measured: 5.6 s at half)', () => {
    expect(shimmerLadder(plain, 4).ratio).toBe(2)
    expect(shimmerLadder({ ...plain, interval: 1 }, 4).ratio).toBe(1.5)
    expect(shimmerLadder({ ...plain, interval: 3 }, 4).ratio).toBe(0.5)
    const half = shimmerLadder({ ...plain, shimmer: 0.5 }, 30).rt60
    const full = shimmerLadder({ ...plain, shimmer: 1 }, 30).rt60
    expect(half).toBeGreaterThan(5.2)
    expect(half).toBeLessThan(6)
    expect(full).toBeLessThan(half)
  })

  it('lets Tone stop the climb', () => {
    const second = (tone: number): number[] => {
      const ladder = shimmerLadder({ ...plain, shimmer: 0.7, tone }, 8)
      const pass = Math.round(1 / ladder.pass)
      return ladder.rungs.map((rung) => rung[pass])
    }
    const dark = second(2000)
    const bright = second(12000)
    // The fourth rung is 3520 Hz: over a dark Tone's ceiling, under a bright one's.
    expect(bright[4] - dark[4]).toBeGreaterThan(20)
    // The note itself is far under both.
    expect(Math.abs(bright[0] - dark[0])).toBeLessThan(2)
  })

  it('says the time the whole really takes, and takes Decay from the straight line', () => {
    const { display, params } = face('shimmer')
    expect(drawDisplay(display, params).words()).toContain('+12')
    // A fall longer than the panel is still said in full.
    const long = drawDisplay(display, params, { values: { decay: 30, shimmer: 0, tone: 16000 } })
    expect(long.words()).toContain('30 s')
    const handle = handleOf('shimmer', 'decay')
    expect(handle.drag(handle.x, handle.y).decay).toBeCloseTo(8, 2)
  })
})

describe('Expanse', () => {
  const room = { size: 0.9, decay: 10, gravity: 0, density: 0.7, decayMost: 60 }

  it('reads Size in seconds as the device does', () => {
    expect(expanseSeconds(0)).toBeCloseTo(0.04, 9)
    expect(expanseSeconds(1)).toBeCloseTo(2.5, 9)
    expect(expanseSeconds(0.5)).toBeCloseTo(Math.sqrt(0.04 * 2.5), 9)
  })

  it('answers first after the shortest way to a tap, 9 % of a Size (measured: 0.09)', () => {
    for (const size of [0, 0.5, 1]) {
      const arrival = expanseArrival({ ...room, size })
      expect(arrival.first / arrival.seconds).toBeGreaterThan(0.08)
      expect(arrival.first / arrival.seconds).toBeLessThan(0.1)
    }
  })

  it('swells later with Gravity (measured at Size 0.9: full at 2.1 s with Gravity 1)', () => {
    const near = expanseArrival(room)
    const far = expanseArrival({ ...room, gravity: 1 })
    expect(near.peak).toBeLessThan(0.8)
    expect(far.peak).toBeGreaterThan(1.4)
    expect(far.peak).toBeLessThan(2.3)
    // With Gravity the first echoes are far under the swell.
    const early = Math.round((near.first * 1.5) / near.slot)
    expect(far.level[early]).toBeLessThan(near.level[early] - 10)
  })

  it('says Decay, no end at the top of the knob, and held when frozen', () => {
    const { display, params } = face('expanse')
    expect(drawDisplay(display, params).words()).toContain('10 s')
    expect(drawDisplay(display, params, { values: { decay: 60 } }).words()).toContain('∞')
    expect(drawDisplay(display, params, { values: { freeze: 1 } }).words()).toContain('held')
    // The Size said is the device's.
    expect(drawDisplay(display, params, { values: { size: 1 } }).words()).toContain('2.5 s')
  })

  it('takes Decay from the fall, which begins where the swell is highest', () => {
    const handle = handleOf('expanse', 'decay')
    expect(handle.drag(handle.x, handle.y).decay).toBeCloseTo(10, 2)
    // Let go further right on the foot is a longer tail.
    expect(handle.drag(handle.x + 20, handle.y).decay).toBeGreaterThan(12)
  })
})

describe('Swarm Reverb', () => {
  // The arrivals of the first echoes, measured from the compiled device (a
  // click in, Blur and Feedback 0), as shares of a pass, with their signs.
  const MEASURED = [
    [0.063, -0.079, -0.13, 0.223, 0.283, -0.356, -0.382, 0.471, -0.568, -0.622, 0.703],
    [-0.047, 0.099, 0.14, -0.191, -0.251, -0.33, -0.423, -0.456, 0.561, -0.63, 0.726],
  ]

  it('has the device own echoes, not a likeness', () => {
    const taps = swarmTaps()
    expect(taps).toHaveLength(2)
    taps.forEach((side, c) => {
      expect(side).toHaveLength(14)
      MEASURED[c].forEach((measured, k) => {
        expect(side[k].arrival).toBeCloseTo(Math.abs(measured), 2)
        expect(Math.sign(side[k].gain)).toBe(Math.sign(measured))
      })
      // The last echo ends the pass, 6 dB under where the first would be at the start.
      expect(side[13].arrival).toBe(1)
      const tilt = 20 * Math.log10(Math.abs(side[13].gain / side[0].gain))
      expect(tilt).toBeCloseTo(-6 * (1 - side[0].arrival), 6)
      // Together they are as loud as the sound that made them.
      expect(side.reduce((sum, tap) => sum + tap.gain * tap.gain, 0)).toBeCloseTo(1, 9)
    })
  })

  it('stretches a pass from half of Length to twice, in steps when asked', () => {
    expect(swarmSeconds(0.5, 0.5, false)).toBeCloseTo(0.5, 9)
    expect(swarmSeconds(0.5, 0, false)).toBeCloseTo(0.25, 9)
    expect(swarmSeconds(0.5, 1, false)).toBeCloseTo(1, 9)
    // Steps: the nearest of 1/2, 2/3, 3/4, 1, 4/3, 3/2 and 2.
    expect(SWARM_STEPS).toHaveLength(7)
    expect(swarmOctaves(0.8, true)).toBeCloseTo(Math.log2(1.5), 6)
    expect(swarmSeconds(0.5, 0.8, true)).toBeCloseTo(0.75, 6)
    expect(swarmSeconds(0.5, 0.28, true)).toBeCloseTo(0.375, 6)
  })

  it('falls 20 log10(Feedback) dB a trip, 0.9435 of a pass', () => {
    // Feedback 0.5 is 6.02 dB a trip: 60 dB in 9.97 trips of 0.4717 s.
    expect(swarmRt60(0.5, 0.5)).toBeCloseTo((60 / 6.0206) * 0.5 * 0.9435, 3)
    // The default patch; the device, with its cut filters in the loop, measures 6.08 s.
    expect(swarmRt60(0.5, 0.6)).toBeCloseTo(6.38, 2)
    expect(swarmRt60(0.5, 1)).toBe(Infinity)
    expect(swarmRt60(0.5, 1.05)).toBe(Infinity)
    expect(swarmRt60(0.5, 0)).toBe(0)
  })

  it('sends each trip round fainter by Feedback, and nothing round at none', () => {
    const energy = (echoes: Float32Array, from: number, to: number): number => {
      let sum = 0
      for (let i = from; i < to; i++) sum += echoes[i] * echoes[i]
      return sum
    }
    // Four passes wide, 100 slots a pass. The second trip of the left side is
    // the first again a whole pass later and the right's 0.887 of one later.
    const [alone] = swarmEchoes(4, 0, 0, 400)
    expect(energy(alone, 104, 400)).toBe(0)
    const [round] = swarmEchoes(4, 0.5, 0, 400)
    const first = energy(alone, 0, 400)
    const all = energy(round, 0, 400)
    // Everything that comes back within four passes: 1 + 0.25 + 0.0625 + ... of the first.
    expect(all / first).toBeGreaterThan(1.25)
    expect(all / first).toBeLessThan(1 / (1 - 0.25))
  })

  it('lets Blur spill each echo without losing any of it', () => {
    const sum = (echoes: Float32Array): number => echoes.reduce((total, v) => total + v * v, 0)
    const [sharp] = swarmEchoes(1.3, 0, 0, 130)
    const [blurred] = swarmEchoes(1.3, 0, 1, 130)
    expect(sum(blurred) / sum(sharp)).toBeCloseTo(1, 3)
    expect(Math.max(...sharp)).toBeCloseTo(1, 6)
    expect(Math.max(...blurred)).toBeLessThan(0.75)
  })

  it('draws the cave at the size the device says while sound runs', () => {
    const { display, params } = face('swarm-reverb')
    expect(drawDisplay(display, params).words()).toContain('500 ms')
    const gliding = runDisplay(display, params, 0.3, {
      signal: testSignal(),
      meters: { size: 0.8 },
    })
    expect(gliding.words()).toContain('800 ms')
    // Asleep the device's figure is old: the knobs stand.
    const asleep = runDisplay(display, params, 0.3, {
      signal: testSignal(0, 0),
      meters: { size: 0.8 },
    })
    expect(asleep.words()).toContain('500 ms')
  })

  it('takes Stretch from the top and Feedback from the tail end', () => {
    const { display, params } = face('swarm-reverb')
    const size = displaySize(display)
    const stretch = handleOf('swarm-reverb', 'stretch')
    // The upper panel is two Lengths wide: its right edge is Stretch at the top.
    expect(stretch.drag(size.width - 4, stretch.y).stretch).toBeCloseTo(1, 6)
    expect(stretch.drag(4 + 120 / 4, stretch.y).stretch).toBeCloseTo(0, 6)
    const feedback = handleOf('swarm-reverb', 'feedback')
    expect(feedback.drag(feedback.x, feedback.y).feedback).toBeCloseTo(0.6, 3)
    // Past 1 the tail has no end: the handle taken there leaves Feedback alone.
    const past = handleOf('swarm-reverb', 'feedback', { feedback: 1.04 })
    expect(past.drag(past.x, past.y).feedback).toBe(1.04)
    expect(params.feedback.max).toBeGreaterThan(1)
  })
})

describe('Sympathetic', () => {
  it('climbs the scale from C3 until a note is heard', () => {
    expect(sympatheticNotes(8, 0, sympatheticScale(0), -1)).toEqual([
      48, 50, 52, 53, 55, 57, 59, 60,
    ])
    // Root D, minor: D3 E3 F3 G3.
    expect(sympatheticNotes(4, 2, sympatheticScale(1), -1)).toEqual([50, 52, 53, 55])
  })

  it('moves to the octave of the note heard, in order of consonance', () => {
    // A4 heard, C major: root, its octave, the fifth, the third, then the rest.
    expect(sympatheticNotes(8, 0, sympatheticScale(0), 69)).toEqual([
      60, 72, 67, 64, 62, 65, 69, 71,
    ])
    // The ninth string starts again an octave up.
    expect(sympatheticNotes(9, 0, sympatheticScale(0), 69)[8]).toBe(72)
    // Past B7 a string comes back down by octaves.
    expect(Math.max(...sympatheticNotes(16, 11, sympatheticScale(0), 100))).toBeLessThanOrEqual(107)
  })

  it('tunes to what Learn has gathered, and to major until it has anything', () => {
    expect(sympatheticScale(2, 0)).toEqual(sympatheticScale(0))
    // Root, major third and fifth heard.
    expect(sympatheticScale(2, 0b10010001)).toEqual([0, 4, 7])
    expect(sympatheticNotes(4, 0, [0, 4, 7], 60)).toEqual([60, 72, 67, 64])
  })

  it('names notes and tunes them as the device does', () => {
    expect(noteName(60)).toBe('C4')
    expect(noteName(33)).toBe('A1')
    expect(hzOfNote(69)).toBe(440)
    expect(hzOfNote(48)).toBeCloseTo(130.81, 2)
  })

  it('lets the high strings die sooner than Decay, as the header of the string says', () => {
    // Low and middle strings ring for Decay.
    expect(stringSeconds(130.81, 3)).toBeCloseTo(3, 2)
    expect(stringSeconds(261.63, 10)).toBeCloseTo(10, 1)
    // "At most 6.8 s at C5, 3.7 s at F5, 1.4 s at C6, 0.2 s at C7", at any rate.
    for (const rate of [44100, 48000, 96000]) {
      expect(stringSeconds(523.25, 10, rate)).toBeCloseTo(6.8, 1)
      expect(stringSeconds(698.46, 10, rate)).toBeCloseTo(3.7, 1)
      expect(stringSeconds(1046.5, 10, rate)).toBeCloseTo(1.4, 1)
      expect(stringSeconds(2093, 10, rate)).toBeCloseTo(0.2, 1)
    }
  })

  it('names the scale, and the note heard once the device reports one', () => {
    const { display, params } = face('sympathetic')
    expect(drawDisplay(display, params).words()).toContain('C major')
    expect(drawDisplay(display, params, { values: { root: 9, mode: 1 } }).words()).toContain(
      'A minor',
    )
    const heard = drawDisplay(display, params, { meters: { note: 57, scale: 2741 } })
    expect(heard.words()).toContain('heard A3')
    expect(
      drawDisplay(display, params, { meters: { note: -1 } })
        .words()
        .join(' '),
    ).not.toMatch(/heard/)
  })

  it('lights a string as high as the device says it rings', () => {
    const { display, params } = face('sympathetic')
    const run = (meters: Record<string, number>) =>
      runDisplay(display, params, 0.2, { signal: testSignal(), meters: { note: -1, ...meters } })
    // Silent strings: only what rides the tail is in the accent.
    const silent = accents(run({ strings1: 0, strings2: 0 }))
    // The first string at -10 dB, the sixth at -20 dB: four strings to a reading, six bits each.
    const two = accents(run({ strings1: 53, strings2: 43 * 64 }))
    expect(two).toBe(silent + 2)
    // A string 60 dB down is under what is drawn.
    expect(accents(run({ strings1: 3 }))).toBe(silent)
  })

  it('takes Root from the line the strings stand on', () => {
    const root = handleOf('sympathetic', 'root')
    expect(root.drag(root.x, root.y).root).toBe(0)
    // Eight strings from C3 are drawn over two octaves: 5 px a semitone.
    expect(root.drag(root.x + 5 * 7, root.y).root).toBe(7)
    const moved = handleOf('sympathetic', 'root', { root: 9 })
    expect(moved.drag(moved.x, moved.y).root).toBe(9)
  })
})

describe('Vowel Reverb', () => {
  it('reads the formants off the device own table, between its entries too', () => {
    // Bass a, soprano a, tenor i.
    expect(formantsAt(0, 0).hz).toEqual([600, 1040, 2250, 2450, 2750])
    expect(formantsAt(0, 1).hz[0]).toBe(800)
    expect(formantsAt(2, 1 / 3).hz[0]).toBeCloseTo(290, 6)
    // Half way from a to e in the bass: 600 to 400 Hz, 0 to -12 dB on the second.
    const between = formantsAt(0.5, 0)
    expect(between.hz[0]).toBe(500)
    expect(between.db[1]).toBe(-9.5)
    expect(between.bandwidth[0]).toBe(50)
  })

  it('turns a wandering vowel back at the ends', () => {
    expect(foldVowel(-0.5)).toBe(0.5)
    expect(foldVowel(4.5)).toBe(3.5)
    expect(foldVowel(2.2)).toBe(2.2)
  })

  it('is flat with no Resonance and peaks on the formants with it', () => {
    const tenor = formantsAt(0, 1 / 3)
    for (const hz of [200, 650, 1080, 3000]) expect(vowelDb(hz, tenor, 0)).toBeCloseTo(0, 9)
    // 650 and 1080 Hz stand over the valley between them and the slopes outside.
    for (const resonance of [0.6, 1]) {
      const at = (hz: number): number => vowelDb(hz, tenor, resonance)
      expect(at(650)).toBeGreaterThan(at(840) + 6)
      expect(at(1080)).toBeGreaterThan(at(840) + 5)
      expect(at(650)).toBeGreaterThan(at(400) + 6)
      expect(at(1080)).toBeGreaterThan(at(1800) + 8)
    }
    // The makeup is 12 dB at most, and the first formant comes through at about that.
    expect(vowelDb(650, tenor, 1)).toBeGreaterThan(6)
    expect(vowelDb(650, tenor, 1)).toBeLessThan(13)
    // The top of each peak is on the formant, to a few per cent.
    for (const centre of [650, 1080]) {
      let best = 0
      for (let hz = centre * 0.8; hz <= centre * 1.25; hz *= 1.005) {
        if (vowelDb(hz, tenor, 1) > vowelDb(best || 1, tenor, 1)) best = hz
      }
      expect(Math.abs(best / centre - 1)).toBeLessThan(0.03)
    }
  })

  it('lets the sound between the formants die up to four times sooner', () => {
    expect(valleySeconds(6, 0)).toBe(6)
    expect(valleySeconds(6, 1)).toBeCloseTo(1.5, 9)
    expect(valleySeconds(6, 0.5)).toBeCloseTo(1 / (1 / 6 + 0.25 * 0.5), 9)
    // A long decay: the valleys never outlast a fifth of a second's worth of rate, 5 s.
    expect(valleySeconds(40, 1)).toBeCloseTo(5, 9)
  })

  it('draws the vowel sung now in the accent when Motion has moved it', () => {
    const { display, params } = face('vowel-reverb')
    const run = (meters: Record<string, number>) =>
      runDisplay(display, params, 0.2, { signal: testSignal(), meters })
    const at = { vowel: 0, lean: 0, voice: 0.4, build: 0 }
    const wandered = { vowel: 0.6, lean: 0.1, voice: 0.4, build: 0.02 }
    // Where the knobs are, only the mark on the line of vowels; moved, the curve too.
    expect(accents(run(wandered))).toBe(accents(run(at)) + 1)
    expect(accents(drawDisplay(display, params))).toBe(0)
  })

  it('takes the vowel from the line of letters', () => {
    const { display } = face('vowel-reverb')
    const size = displaySize(display)
    const handle = handleOf('vowel-reverb', 'vowel', { vowel: 1.5 })
    expect(handle.drag(handle.x, handle.y).vowel).toBeCloseTo(1.5, 6)
    expect(handle.drag(0, handle.y).vowel).toBe(0)
    expect(handle.drag(size.width, handle.y).vowel).toBe(4)
    // The letters stand evenly: half way along is I.
    expect(handle.drag(size.width / 2, handle.y).vowel).toBeCloseTo(2, 6)
  })
})
