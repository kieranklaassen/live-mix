// The truth of the weather instruments' displays: the figures are the
// devices' own, a key is lit for as long as the device lets it sound, what is
// random stands still, and what a knob does to a note that is played shows.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  WEATHER_INSTRUMENT_FACES,
  dropletsFlurrySeconds,
  dropletsHz,
  dropletsLoudness,
  dropletsPace,
  dropletsPulse,
  dropletsPulseOctave,
  dropletsRain,
  dropletsRandomOctave,
  dropletsRingSeconds,
  dropletsSecondsOf,
  dropletsStrikeLevel,
  dropletsTrailLevel,
  dropletsWait,
  dropletsWeight,
  iceCrackRate,
  iceEchoLevel,
  iceEchoT0,
  iceFall,
  iceFlightLevel,
  iceFlightSeconds,
  iceLevels,
  icePlace,
  iceRatio,
  iceRingSeconds,
  iceStrength,
  iceSweeps,
  iceT0,
  iceTopHz,
  shortwaveBandDb,
  shortwaveBandHz,
  shortwaveBeatHz,
  shortwaveBeatLevel,
  shortwaveCrackles,
  shortwaveCrowd,
  shortwaveDriftCents,
  shortwaveFadeBestDb,
  shortwaveFadeWorstDb,
  shortwaveHarmonics,
  shortwaveHiss,
  shortwaveLevel,
  shortwaveOnShift,
  shortwavePipDuty,
  shortwavePipOpen,
  shortwaveShiftRatio,
  shortwaveSlideCents,
  shortwaveSlideSeconds,
  shortwaveVelocity,
  type RainKey,
} from '../components/displays/instrument-weather'
import { type DisplayNote } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  stockDescriptors,
  testSignal,
  viewOf,
  type DrawnPath,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string) => stock.get(id)?.params ?? {}
const { accent, ink } = PLAIN_COLOURS

const note = (
  frequency: number,
  age: number,
  released: number | null = null,
  gain = 1,
): DisplayNote => ({
  id: Math.round(12 * Math.log2(frequency / 440) + 69),
  frequency,
  gain,
  age,
  released,
})

/** One frame of an instrument's display, with those knobs and notes. */
function drawn(
  id: string,
  values: Readonly<Record<string, number>> = {},
  notes: DisplayNote[] = [],
  sounding = false,
): RecordingContext {
  return drawDisplay(WEATHER_INSTRUMENT_FACES[id].display, paramsOf(id), {
    values,
    notes,
    signal: sounding ? testSignal() : null,
  })
}

/** The lines stroked in the accent: what a display lights. */
const lights = (picture: RecordingContext): DrawnPath[] =>
  drawnPaths(picture).filter(
    (path) => path.kind === 'stroke' && path.colour === accent && path.points.length > 1,
  )

/** The boxes filled in one colour, as [x, y, w, h]. */
function boxes(picture: RecordingContext, colour: string): number[][] {
  const out: number[][] = []
  let fill = ''
  for (const call of picture.calls) {
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'fillRect' && fill === colour) out.push(call.args as number[])
  }
  return out
}

/** Whether anything at all was painted in the accent. */
const anyAccent = (picture: RecordingContext): boolean =>
  boxes(picture, accent).length > 0 ||
  drawnPaths(picture).some((path) => path.colour === accent && path.points.length > 0)

describe('the figures of Droplets, against droplets.h', () => {
  it('takes an octave only while the drop stays under 5 kHz', () => {
    expect(dropletsHz(440, 0)).toBe(440)
    expect(dropletsHz(440, 2)).toBe(1760)
    // 2 kHz goes up once to 4 kHz; the second octave would be 8 kHz and is not taken.
    expect(dropletsHz(2000, 2)).toBe(4000)
    expect(dropletsHz(3000, 1)).toBe(3000)
  })

  it('rings a drop as long as its surface, its pitch, Ring and Size say', () => {
    // Glass is 1.6 s at 440 Hz with Ring 1 and Size 0.5 (0.5 * 2^(2 * 0.5) = 1).
    expect(dropletsRingSeconds(0, 440, 1, 0.5)).toBeCloseTo(1.6, 5)
    // Two octaves down, glass goes as the square root: twice as long.
    expect(dropletsRingSeconds(0, 110, 1, 0.5)).toBeCloseTo(3.2, 5)
    // Size 0 is a quarter of Size 1: 0.5 and 2 times the middle.
    expect(dropletsRingSeconds(0, 440, 1, 0)).toBeCloseTo(0.8, 5)
    expect(dropletsRingSeconds(0, 440, 1, 1)).toBeCloseTo(3.2, 5)
    // Metal: 5 s * 4 * 2 = 40 s, held to the longest ring of 20 s.
    expect(dropletsRingSeconds(2, 440, 4, 1)).toBe(20)
    // Wood three octaves up: 0.4 s * (1/8)^0.8 = 0.4 * 0.18946 = 0.07579 s.
    expect(dropletsRingSeconds(1, 3520, 1, 0.5)).toBeCloseTo(0.07579, 4)
    // The law is held at 6 for a very low key on wood: (440/20)^0.8 = 11.9.
    expect(dropletsRingSeconds(1, 20, 1, 0.5)).toBeCloseTo(2.4, 5)
  })

  it('waits one gap at Loose 0 and as a random arrival does at Loose 1', () => {
    expect(dropletsWait(0, 0.1)).toBe(1)
    expect(dropletsWait(0, 0.99)).toBe(1)
    // -ln(1 - 0.5) = 0.6931.
    expect(dropletsWait(1, 0.5)).toBeCloseTo(0.6931, 4)
    expect(dropletsWait(0.5, 0.5)).toBeCloseTo(0.5 + 0.5 * 0.6931, 4)
    // Never longer than eight mean gaps.
    expect(dropletsWait(1, 0.9999999)).toBe(8)
  })

  it('gives each drop its octave and its loudness', () => {
    expect([0, 1, 2, 3].map((round) => dropletsPulseOctave(1, round))).toEqual([0, 1, 0, 1])
    expect([0, 1, 2, 3].map((round) => dropletsPulseOctave(2.4, round))).toEqual([0, 1, 2, 0])
    expect(dropletsPulseOctave(0.4, 5)).toBe(0)
    expect(dropletsRandomOctave(1, 0.49)).toBe(0)
    expect(dropletsRandomOctave(1, 0.51)).toBe(1)
    expect(dropletsRandomOctave(0, 0.99)).toBe(0)
    // Soft 1 at the far end of the draw is four halvings: 1/16.
    expect(dropletsLoudness(1, 1)).toBeCloseTo(1 / 16, 6)
    expect(dropletsLoudness(0.5, 0.5)).toBeCloseTo(Math.pow(2, -0.5), 6)
    expect(dropletsLoudness(0, 1)).toBe(1)
    expect(dropletsStrikeLevel(1)).toBe(1)
    expect(dropletsStrikeLevel(0.5)).toBeCloseTo(0.35, 6)
  })

  it('lets a key trail out of the rain, and sets the pace of a flurry and a lull', () => {
    expect(dropletsWeight(null, 2)).toBe(1)
    expect(dropletsWeight(0.5, 2)).toBeCloseTo(0.75, 6)
    expect(dropletsWeight(3, 2)).toBe(0)
    expect(dropletsWeight(0.1, 0)).toBe(0)
    expect(dropletsTrailLevel(1)).toBe(1)
    expect(dropletsTrailLevel(0)).toBeCloseTo(0.4, 6)
    expect(dropletsPace(0, true)).toBe(1)
    expect(dropletsPace(1, true)).toBe(4)
    expect(dropletsPace(1, false)).toBe(0)
    expect(dropletsPace(0.5, false)).toBe(0.5)
    // Six drops at four times a rain of 3 a second: half a second.
    expect(dropletsFlurrySeconds(3)).toBeCloseTo(0.5, 6)
    expect(dropletsFlurrySeconds(0.3)).toBe(3)
    expect(dropletsFlurrySeconds(24)).toBe(0.15)
    // Without Bursts the rain is even: six drops of 3 a second take two seconds.
    expect(dropletsSecondsOf(6, 3, 0)).toBeCloseTo(2, 6)
    // At Bursts 1 a flurry of half a second runs four times as fast and the lull has no drop:
    // the third drop at 0.25 s, the ninth a cycle of two seconds later.
    expect(dropletsSecondsOf(3, 3, 1)).toBeCloseTo(0.25, 6)
    expect(dropletsSecondsOf(9, 3, 1)).toBeCloseTo(2.25, 6)
    // At Bursts 0.5 the flurry holds 3.75 drops and the lull runs at half pace: drop 4.5 at 1 s.
    expect(dropletsSecondsOf(4.5, 3, 0.5)).toBeCloseTo(1, 6)
  })
})

describe('the rain of Droplets, worked out from the notes', () => {
  const keys: RainKey[] = []

  it('keeps a key in the rain for Trail seconds, and begins afresh after a dry spell', () => {
    const played = [note(220, 1.5, 1.0), note(261.63, 0.6), note(329.63, 0.6)]
    // Trail 2: the first key is still trailing when the chord goes down, so it is one rain.
    expect(dropletsRain(played, 2, keys)).toEqual({ began: 1.5, count: 3 })
    expect(keys[0].hz).toBe(220)
    // Trail 0.2: it had run dry 0.8 s ago, and the chord began a new rain.
    expect(dropletsRain(played, 0.2, keys)).toEqual({ began: 0.6, count: 2 })
    expect(keys[0].hz).toBeCloseTo(261.63, 2)
    // Every key let go and trailed out: no rain.
    expect(dropletsRain([note(220, 9, 8)], 2, keys)).toEqual({ began: -1, count: 0 })
    expect(dropletsRain([], 2, keys)).toEqual({ began: -1, count: 0 })
  })

  it('hands a key played again in its trail to the new key, as the device keeps one entry for both', () => {
    const into = new Float32Array(30)
    const edges: number[] = []
    // Held from 3 s ago, let go 2.5 s ago with Trail 4, down again 2 s ago: the first is out of the rain from then.
    const { began, count } = dropletsRain([note(220, 3, 2.5), note(220, 2)], 4, keys)
    expect({ began, count }).toEqual({ began: 3, count: 2 })
    expect(keys[0].taken).toBe(2)
    expect(keys[1].taken).toBe(-Infinity)
    // Half a drop a second: 0.25 of a drop while it was held, 0.5 * (0.5 - 0.5^2 / 8) = 0.2344 as it
    // trailed, and the 0.5156 that is left takes the new key 1.0313 s: one drop 0.9688 s ago, on the
    // new key for sure (index 1), since the trailing one never came up.
    expect(dropletsPulse(keys, count, began, 0.5, 4, 0, 10, 0, into, edges)).toBe(1)
    expect(into[0]).toBeCloseTo(0.96875, 4)
    expect(into[1]).toBe(1)
    // A key struck again while it is held reaches the notes as let go in that instant: one rain at any Trail.
    expect(dropletsRain([note(220, 3, 1), note(220, 1)], 0, keys)).toEqual({ began: 3, count: 2 })
    expect(keys[0].taken).toBe(1)
    // Played again after its trail has run out, it begins a new rain.
    expect(dropletsRain([note(220, 3, 2.5), note(220, 1)], 1, keys)).toEqual({ began: 1, count: 1 })
  })

  it('follows the even pulse: one drop a gap, up the keys, an octave further each round', () => {
    const into = new Float32Array(300)
    const edges: number[] = []
    const two = [note(330, 2), note(220, 2)]
    const { began, count } = dropletsRain(two, 2, keys)
    // Two a second since two seconds ago: drops 1.5, 1, 0.5 and 0 s ago, and one more half a second on.
    const drops = dropletsPulse(keys, count, began, 2, 2, 1, 10, 0.75, into, edges)
    expect(drops).toBe(5)
    const taus = Array.from({ length: drops }, (_, d) => into[d * 3])
    for (const [d, tau] of [1.5, 1, 0.5, 0, -0.5].entries()) expect(taus[d]).toBeCloseTo(tau, 5)
    // The lower key first (index 1), then the upper, then round again an octave up.
    expect(Array.from({ length: drops }, (_, d) => into[d * 3 + 1])).toEqual([1, 0, 1, 0, 1])
    expect(Array.from({ length: drops }, (_, d) => into[d * 3 + 2])).toEqual([0, 0, 1, 1, 0])
    // Only what fell in the last second is asked for.
    expect(dropletsPulse(keys, count, began, 2, 2, 1, 1, 0, into, edges)).toBe(3)
  })

  it('slows the pulse as its only key trails away, and loses the order of the keys', () => {
    const into = new Float32Array(300)
    const edges: number[] = []
    // Held from 3 s ago, let go 1 s ago, Trail 2: the share falls from 1 to 0.5 over that second.
    const { began, count } = dropletsRain([note(220, 3, 1)], 2, keys)
    const drops = dropletsPulse(keys, count, began, 2, 2, 0, 10, 0, into, edges)
    // Four drops while it was held (2.5, 2, 1.5 and 1 s ago). After it, 2 * (t - t^2 / 4) = 1 at
    // t = 2 - sqrt(2) = 0.5858 s: one more, 0.4142 s ago, of a key no longer sure.
    expect(drops).toBe(5)
    expect(into[4 * 3]).toBeCloseTo(1 - 0.5858, 3)
    expect(into[4 * 3 + 1]).toBe(-1)
    expect(into[3 * 3 + 1]).toBe(0)
  })
})

describe('the display of Droplets', () => {
  const display = WEATHER_INSTRUMENT_FACES.droplets.display
  const params = paramsOf('droplets')

  it('lights nothing at rest, and says its surface and its rain', () => {
    const picture = drawn('droplets')
    expect(anyAccent(picture)).toBe(false)
    expect(picture.words()).toContain('Glass, 3/s')
    expect(drawn('droplets', { material: 2, rain: 12 }).words()).toContain('Metal, 12/s')
  })

  it('marks every key in the rain where it lands, a trailing one narrower', () => {
    const chord = [note(261.63, 0.6), note(329.63, 0.6), note(392, 0.6)]
    const held = boxes(drawn('droplets', {}, chord), accent)
    expect(held.length).toBe(3)
    // Low keys at the left, each mark as wide as a held key's.
    expect(held[0][0]).toBeLessThan(held[1][0])
    expect(held[1][0]).toBeLessThan(held[2][0])
    for (const mark of held) expect(mark[2]).toBeCloseTo(7, 5)
    // A key let go one second ago with Trail 2 has half its share left: 2 + 5 * 0.5 wide.
    const trailing = boxes(drawn('droplets', { trail: 2 }, [note(220, 1.5, 1), ...chord]), accent)
    expect(trailing.length).toBe(4)
    expect(trailing[0][2]).toBeCloseTo(4.5, 5)
    // With no Trail it left the rain as it was let go.
    expect(
      boxes(drawn('droplets', { trail: 0 }, [note(220, 1.5, 1), ...chord]), accent).length,
    ).toBe(3)
  })

  it('rings a struck key for as long as its surface rings', () => {
    // Glass at 440 Hz, Ring 1, Size 0.4: 1.6 * 0.5 * 2^0.8 = 1.393 s to -60 dB.
    const values = { splash: 0, loose: 1 }
    expect(lights(drawn('droplets', values, [note(440, 1.2)])).length).toBe(1)
    expect(lights(drawn('droplets', values, [note(440, 1.5)])).length).toBe(0)
    // Metal rings 4.35 s there, felt 0.52 s.
    expect(lights(drawn('droplets', { ...values, material: 2 }, [note(440, 1.5)])).length).toBe(1)
    expect(lights(drawn('droplets', { ...values, material: 4 }, [note(440, 0.6)])).length).toBe(0)
    // A soft key's drop is under the picture's floor sooner: 0.2 * 0.52 is 19.7 dB down.
    expect(lights(drawn('droplets', values, [note(440, 1.2, null, 0.2)])).length).toBe(0)
    // The ring spreads as it dies: a later one reaches further from where it landed.
    const reach = (age: number): number => {
      const [ring] = lights(drawn('droplets', values, [note(440, age)]))
      const xs = ring.points.map((point) => point[0])
      return Math.max(...xs) - Math.min(...xs)
    }
    expect(reach(1)).toBeGreaterThan(reach(0.2))
  })

  it('throws a crown with Splash as a drop lands', () => {
    const young = [note(440, 0.05)]
    const dry = lights(drawn('droplets', { splash: 0, loose: 1 }, young)).length
    expect(lights(drawn('droplets', { splash: 0.8, loose: 1 }, young)).length).toBe(dry + 1)
    // The crown is gone 0.14 s after the drop.
    expect(lights(drawn('droplets', { splash: 0.8, loose: 1 }, [note(440, 0.2)])).length).toBe(dry)
  })

  it('lights the drops of an even pulse as they land, and none of loose rain', () => {
    // One key held for two seconds at two drops a second: its own drop has rung out (1.97 s on
    // glass at 220 Hz), and the pulse has landed 1.5, 1, 0.5 and 0 s ago, every other one an octave up.
    const held = [note(220, 2)]
    const even = { rain: 2, loose: 0, bursts: 0, spread: 1, splash: 0 }
    expect(lights(drawn('droplets', even, held)).length).toBe(4)
    expect(lights(drawn('droplets', { ...even, loose: 1 }, held)).length).toBe(0)
    expect(lights(drawn('droplets', { ...even, bursts: 0.5 }, held)).length).toBe(0)
    // How loud a drop of the rain falls is the device's throw by Soft, so it is lit at the middle
    // throw, 6 dB down at Soft 1. The drop of 1.9 s ago on a ring of 1.97 s is 57.9 dB down: lit
    // with Soft at 0, out with Soft at 1.
    const older = [note(220, 2.4)]
    expect(lights(drawn('droplets', { ...even, spread: 0, soft: 0 }, older)).length).toBe(4)
    expect(lights(drawn('droplets', { ...even, spread: 0, soft: 1 }, older)).length).toBe(3)
  })

  it('stops following the pulse when a knob that times it is moved, until the rain begins again', () => {
    const even = { rain: 2, loose: 0, bursts: 0, spread: 1, splash: 0 }
    const state = display.init?.()
    const first = drawDisplay(display, params, {
      values: even,
      notes: [note(220, 2)],
      state,
      now: 10,
    })
    expect(lights(first).length).toBe(4)
    // Rain is turned a tenth of a second on: where the pulse now is in time is not known.
    const moved = { values: { ...even, rain: 3 }, notes: [note(220, 2.1)], state, now: 10.1 }
    expect(lights(drawDisplay(display, params, moved)).length).toBe(0)
    // A key that begins a new rain after that is followed again: its own drop rings.
    const again = { values: { ...even, rain: 3 }, notes: [note(330, 0.4)], state, now: 14 }
    expect(lights(drawDisplay(display, params, again)).length).toBe(2)
  })

  it('stops following a pulse whose beginning the notes have forgotten, and follows a new rain', () => {
    const even = { rain: 2, loose: 0, bursts: 0, spread: 0, splash: 0, trail: 0 }
    const state = display.init?.()
    // A began the rain 70 s ago and was let go 59.95 s ago with E down: one rain, its 140th drop landing now.
    const whole = { values: even, notes: [note(220, 70, 59.95), note(330, 65)], state, now: 100 }
    expect(lights(drawDisplay(display, params, whole)).length).toBeGreaterThan(0)
    // A tenth of a second on, A has been let go for a minute and is out of the notes. Counted from E the
    // pulse would land 0.1 s off its time: it is not counted at all.
    const cut = { values: even, notes: [note(330, 65.1)], state, now: 100.1 }
    expect(lights(drawDisplay(display, params, cut)).length).toBe(0)
    // A key let go and another down between two frames is a new rain, and that is followed: the new
    // key's own drop and the first of its pulse, half a second after it.
    const fresh = display.init?.()
    drawDisplay(display, params, { values: even, notes: [note(220, 2)], state: fresh, now: 10 })
    const next = [note(220, 2.6, 0.55), note(330, 0.52)]
    const begun = { values: even, notes: next, state: fresh, now: 10.6 }
    expect(lights(drawDisplay(display, params, begun)).length).toBe(2)
  })

  it('knows a forgotten key of a chord by the count, and is not misled by a frame that reads late', () => {
    const even = { rain: 2, loose: 0, bursts: 0, spread: 0, splash: 0, trail: 0 }
    // E went down 20 ms after A: with A forgotten the rain begins hardly later, but has a key less.
    const chord = display.init?.()
    const both = [note(220, 70, 59.95), note(330, 69.98)]
    drawDisplay(display, params, { values: even, notes: both, state: chord, now: 100 })
    const fewer = { values: even, notes: [note(330, 70.08)], state: chord, now: 100.1 }
    expect(lights(drawDisplay(display, params, fewer)).length).toBe(0)
    // One frame reads the notes' clock 40 ms late and the next on time: the same rain, followed on.
    // Its drops landed 1.7, 1.2, 0.7 and 0.2 s ago.
    const slow = display.init?.()
    drawDisplay(display, params, { values: even, notes: [note(220, 2)], state: slow, now: 10 })
    drawDisplay(display, params, { values: even, notes: [note(220, 2.14)], state: slow, now: 10.1 })
    const on = { values: even, notes: [note(220, 2.2005)], state: slow, now: 10.2 }
    expect(lights(drawDisplay(display, params, on)).length).toBe(4)
  })
})

describe('the figures of Ice, against ice.h', () => {
  it('sets the chirp by Distance and Bright', () => {
    expect(iceT0(0)).toBe(0)
    expect(iceT0(0.5)).toBeCloseTo(0.015, 8)
    expect(iceT0(1)).toBeCloseTo(0.06, 8)
    // Sixteen t0 in flight: 0.96 s at Distance 1, never more than 1.6 s.
    expect(iceFlightSeconds(0.06, 48000)).toBeCloseTo(0.96, 6)
    expect(iceFlightSeconds(0.2, 48000)).toBe(1.6)
    // A t0 under a sample is a plain ping: only its attack.
    expect(iceFlightSeconds(0, 48000)).toBe(0.0006)
    expect(iceFlightSeconds(0.00001, 48000)).toBe(0.0006)
    expect(iceTopHz(0, 48000)).toBe(1500)
    expect(iceTopHz(1, 48000)).toBeCloseTo(12000, 6)
    expect(iceTopHz(0.5, 48000)).toBeCloseTo(4242.64, 1)
    // Held under 0.42 of a low rate.
    expect(iceTopHz(1, 22050)).toBeCloseTo(9261, 6)
  })

  it('lets the chirp fall as 1 / (1 + t / t0) squared, tapered on to its note', () => {
    expect(iceFall(0, 0.06, 0.96)).toBe(1)
    expect(iceFall(0.96, 0.06, 0.96)).toBe(0)
    // At t0: (1 - 1/256)^2 / 4 = 0.24805.
    expect(iceFall(0.06, 0.06, 0.96)).toBeCloseTo(0.24805, 5)
    // Half way: 0.75^2 / 9^2 = 0.006944.
    expect(iceFall(0.48, 0.06, 0.96)).toBeCloseTo(0.006944, 6)
    // An octave above its place a partial is 0.5^0.75 as loud.
    expect(iceFlightLevel(1000, 2000)).toBeCloseTo(0.5946, 4)
    expect(iceFlightLevel(1000, 800)).toBe(1)
  })

  it('has nothing to fall from on a key above the top of the chirp', () => {
    // Bright 0 starts the chirp at 1500 Hz, the note's own partial at 0.72 of that. On thin ice a key
    // at 2 kHz has every partial above its start; with a body (1 kHz) it is still above 0.66 * 1500.
    expect(iceSweeps(2000, iceLevels(2000, 0, 0.7, 0, 48000, []), 1500, 0)).toBe(false)
    expect(iceSweeps(2000, iceLevels(2000, 1, 0.7, 0, 48000, []), 1500, 0)).toBe(false)
    // A body at 950 Hz starts 40 Hz over its place, and a low key's partials all fall.
    expect(iceSweeps(1900, iceLevels(1900, 1, 0.7, 0, 48000, []), 1500, 0)).toBe(true)
    expect(iceSweeps(220, iceLevels(220, 0, 0.7, 0, 48000, []), 1500, 0)).toBe(true)
  })

  it('tunes the plate: the body an octave under, the overtones pulled sharp by Stretch', () => {
    expect(iceRatio(0, 1)).toBe(0.5)
    expect(iceRatio(1, 0)).toBe(1)
    expect(iceRatio(1, 1)).toBeCloseTo(1, 10)
    expect(iceRatio(2, 0)).toBe(2)
    // B = 0.12: 2 * sqrt(1.48 / 1.12) and 5 * sqrt(4 / 1.12).
    expect(iceRatio(2, 1)).toBeCloseTo(2.29907, 4)
    expect(iceRatio(5, 1)).toBeCloseTo(9.4491, 3)
    expect(iceRingSeconds(1, 5, 0.3)).toBeCloseTo(5, 8)
    expect(iceRingSeconds(0, 5, 0.3)).toBeCloseTo(2, 8)
    // 5 * 2^-0.7 = 3.0779.
    expect(iceRingSeconds(2, 5, 0)).toBeCloseTo(3.0779, 3)
    expect(iceRingSeconds(5, 0.1, 0)).toBe(0.05)
  })

  it('shares a strike between the modes, as loud whatever the lean', () => {
    expect(iceStrength(1)).toBe(1)
    expect(iceStrength(0.5)).toBeCloseTo(0.3375, 8)
    // Thick 0.5 at the middle velocity: body 0.2, note 0.85, overtones k^-0.5; power 2.04583.
    const levels = iceLevels(220, 0.5, 0.7, 0, 48000, [])
    expect(levels[1]).toBeCloseTo(0.85 / Math.sqrt(2.04583), 4)
    expect(levels[0]).toBeCloseTo(0.2 / Math.sqrt(2.04583), 4)
    expect(levels[4]).toBeCloseTo(0.5 / Math.sqrt(2.04583), 4)
    expect(levels.reduce((sum, level) => sum + level * level, 0)).toBeCloseTo(1, 8)
    // Thin ice has no body; a body under 20 Hz is left out; an overtone over 0.45 of the rate too.
    expect(iceLevels(220, 0, 0.7, 0, 48000, [])[0]).toBe(0)
    expect(iceLevels(30, 1, 0.7, 0, 48000, [])[0]).toBe(0)
    expect(iceLevels(8000, 0.5, 0.7, 0, 48000, []).slice(2)).toEqual([expect.any(Number), 0, 0, 0])
    expect(iceLevels(8000, 0.5, 0.7, 0, 48000, [])[2]).toBeGreaterThan(0)
  })

  it('answers from the shore, cracks by itself, and places the keys', () => {
    expect(iceEchoT0(0.06, 0)).toBeCloseTo(0.099, 6)
    expect(iceEchoT0(0.06, 2)).toBeCloseTo(0.1848, 6)
    expect(iceEchoLevel(0, 1)).toBeCloseTo(0.6, 8)
    expect(iceEchoLevel(0, 2)).toBeCloseTo(0.42, 8)
    // The third echo's third mode: 0.3 * 0.343^2.
    expect(iceEchoLevel(2, 3)).toBeCloseTo(0.035295, 6)
    expect(iceEchoLevel(1, 4)).toBe(0)
    expect(iceEchoLevel(1, 0)).toBe(0)
    expect(iceCrackRate(0)).toBe(0)
    expect(iceCrackRate(0.5)).toBe(0.5)
    expect(iceCrackRate(1)).toBe(4)
    expect(icePlace(440)).toBe(0.3)
    expect(icePlace(466.16)).toBe(-0.3)
  })
})

describe('the display of Ice', () => {
  const display = WEATHER_INSTRUMENT_FACES.ice.display
  const params = paramsOf('ice')
  /** The marks at the left of held keys: filled triangles in the accent. */
  const heldMarks = (picture: RecordingContext): DrawnPath[] =>
    drawnPaths(picture).filter(
      (path) => path.kind === 'fill' && path.colour === accent && path.points.length === 3,
    )
  const tall = (path: DrawnPath): number => {
    const ys = path.points.map((point) => point[1])
    return Math.max(...ys) - Math.min(...ys)
  }

  it('lights nothing at rest, and says how long the chirp falls', () => {
    const picture = drawn('ice')
    expect(anyAccent(picture)).toBe(false)
    // Distance 0.45: 16 * 0.06 * 0.45^2 = 0.194 s.
    expect(picture.words()).toContain('Chirp 190 ms')
    expect(drawn('ice', { distance: 0 }).words()).toContain('Ping')
    expect(drawn('ice', { ring: 12 }).words()).toContain('A3 12 s')
  })

  it('lights a key for as long as its note rings', () => {
    // A full strike puts 0.533 into the note (5.5 dB down), so it is 60 dB under a full note
    // after 0.909 of its Ring: 0.19 s of flight and 4.54 s.
    const dry = { shore: 0 }
    expect(lights(drawn('ice', dry, [note(220, 4, 3.5)])).length).toBeGreaterThan(0)
    expect(anyAccent(drawn('ice', dry, [note(220, 5, 4.5)]))).toBe(false)
    expect(lights(drawn('ice', { ...dry, ring: 30 }, [note(220, 12, 11)])).length).toBeGreaterThan(
      0,
    )
    // A soft key rings out sooner: 0.096 of a strike is 25 dB down from the start.
    expect(anyAccent(drawn('ice', dry, [note(220, 4, 3.5, 0.2)]))).toBe(false)
    // The last echo from the far shore lands 1.27 s on and rings after the strike has gone.
    expect(lights(drawn('ice', { shore: 1 }, [note(220, 5, 4.5)])).length).toBeGreaterThan(0)
  })

  it('runs a far strike down its curve and puts a near one straight on its line', () => {
    // 0.3 s after the key: a strike at Distance 1 is in flight for 0.96 s, one at 0 is a ping.
    const far = lights(drawn('ice', { distance: 1, shore: 0, crack: 0 }, [note(220, 0.3)]))
    const near = lights(drawn('ice', { distance: 0, shore: 0, crack: 0 }, [note(220, 0.3)]))
    expect(Math.max(...far.map(tall))).toBeGreaterThan(5)
    expect(near.length).toBeGreaterThan(0)
    expect(Math.max(...near.map(tall))).toBeLessThan(0.5)
  })

  it('rings a key above the chirp from the key itself, however far the strike', () => {
    // Thin ice, a full strike at 2 kHz: the note has 0.1517 of it (16.4 dB down), so it is lit for
    // 0.727 of a Ring of one second, from the key and not from 0.96 s of a flight it does not make.
    const high = { distance: 1, bright: 0, thick: 0, stretch: 0, ring: 1, shore: 0, crack: 0 }
    expect(lights(drawn('ice', high, [note(2000, 0.6, 0.3)])).length).toBeGreaterThan(0)
    expect(anyAccent(drawn('ice', high, [note(2000, 0.9, 0.3)]))).toBe(false)
  })

  it('keeps a strike as it was struck, whatever Distance does after it', () => {
    const far = { distance: 1, shore: 0, crack: 0 }
    const state = display.init?.()
    drawDisplay(display, params, { values: far, notes: [note(220, 0.2)], state, now: 10 })
    // A tenth of a second on Distance is at 0, and the notes' clock was read 4 ms after the frame's.
    const turned = { values: { ...far, distance: 0 }, notes: [note(220, 0.304)], state, now: 10.1 }
    expect(Math.max(...lights(drawDisplay(display, params, turned)).map(tall))).toBeGreaterThan(5)
    // A key that goes down after the turn is a ping.
    const next = { values: { ...far, distance: 0 }, notes: [note(220, 0.3)], now: 10.1 }
    expect(Math.max(...lights(drawDisplay(display, params, next)).map(tall))).toBeLessThan(0.5)
  })

  it('marks a held key for as long as it is down, rung out or not', () => {
    expect(heldMarks(drawn('ice', {}, [note(220, 0.5)])).length).toBe(1)
    expect(heldMarks(drawn('ice', {}, [note(220, 0.5, 0.2)])).length).toBe(0)
    expect(heldMarks(drawn('ice', { shore: 0 }, [note(220, 15), note(330, 15)])).length).toBe(2)
  })

  it('flashes the snap of Crack as the key goes down', () => {
    const snapped = (crack: number, age: number): number =>
      lights(drawn('ice', { crack, shore: 0, distance: 0 }, [note(220, age)])).length
    expect(snapped(1, 0.03)).toBe(snapped(0, 0.03) + 1)
    expect(snapped(1, 0.2)).toBe(snapped(0, 0.2))
  })

  it('has handles that set Bright, Distance and Ring where they stand', () => {
    const values = { distance: 0.8, bright: 0.3, ring: 12 }
    const handles = display.handles?.(viewOf(display, params, { values })) ?? []
    expect(handles.map((handle) => handle.key)).toEqual(['bright', 'distance', 'ring'])
    for (const handle of handles) {
      const set = handle.drag(handle.x, handle.y)
      for (const [name, value] of Object.entries(set))
        expect(value).toBeCloseTo(values[name as keyof typeof values], 6)
    }
  })
})

describe('the figures of Shortwave, against shortwave.h', () => {
  it('tunes a station in: further off is slower, by the 1.5th power', () => {
    expect(shortwaveSlideSeconds(0)).toBe(0)
    expect(shortwaveSlideSeconds(0.25)).toBeCloseTo(0.375, 8)
    expect(shortwaveSlideSeconds(1)).toBe(3)
    expect(shortwaveSlideCents(1, 0)).toBe(500)
    expect(shortwaveSlideCents(0.5, 0)).toBe(250)
    // Half way through, an eighth of the way is left.
    expect(shortwaveSlideCents(1, 1.5)).toBeCloseTo(62.5, 8)
    expect(shortwaveSlideCents(1, 3)).toBe(0)
    expect(shortwaveSlideCents(1, 0, 0.8)).toBe(400)
    expect(shortwaveDriftCents(1)).toBe(50)
    expect(shortwaveDriftCents(0.25)).toBeCloseTo(6.25, 8)
  })

  it('beats, fades and weighs the keys', () => {
    expect(shortwaveBeatHz(0)).toBe(0.5)
    expect(shortwaveBeatHz(0.5)).toBeCloseTo(2, 8)
    expect(shortwaveBeatHz(1)).toBeCloseTo(8, 8)
    expect(shortwaveBeatLevel(0)).toBe(0)
    expect(shortwaveBeatLevel(0.1)).toBeCloseTo(0.225, 8)
    expect(shortwaveBeatLevel(0.2)).toBeCloseTo(0.45, 8)
    expect(shortwaveBeatLevel(1)).toBeCloseTo(0.45, 8)
    expect(shortwaveFadeBestDb(1)).toBe(4)
    expect(shortwaveFadeWorstDb(1)).toBe(-14)
    expect(shortwaveFadeWorstDb(0.5)).toBe(-7)
    expect(shortwaveVelocity(0)).toBe(0.25)
    expect(shortwaveVelocity(0.5)).toBe(0.625)
    expect(shortwaveVelocity(1)).toBe(1)
    expect(shortwaveCrowd(4)).toBe(1)
    // (4 / 8)^0.6 and (4 / 10)^0.6.
    expect(shortwaveCrowd(8)).toBeCloseTo(0.65975, 4)
    expect(shortwaveCrowd(10)).toBeCloseTo(0.57708, 4)
  })

  it('brings a station up in its Attack and lets it sink 60 dB in its Release', () => {
    expect(shortwaveLevel(0, null, 0.15, 1.8)).toBe(0)
    // Half the attack: 1.3 * (1 - sqrt(0.3 / 1.3)) = 0.6755.
    expect(shortwaveLevel(0.075, null, 0.15, 1.8)).toBeCloseTo(0.6755, 4)
    expect(shortwaveLevel(0.15, null, 0.15, 1.8)).toBeCloseTo(1, 8)
    expect(shortwaveLevel(4, null, 0.15, 1.8)).toBe(1)
    expect(shortwaveLevel(10, 0.9, 0.15, 1.8)).toBeCloseTo(0.031623, 5)
    expect(shortwaveLevel(10, 1.8, 0.15, 1.8)).toBeCloseTo(0.001, 8)
    // 120 dB down is under the envelope's own floor: silence.
    expect(shortwaveLevel(10, 3.6, 0.15, 1.8)).toBe(0)
  })

  it('keys Warble and Pips by the count of Rate', () => {
    // At 2 Hz a change is begun 8 ms early: 0.016 of a count.
    expect(shortwaveOnShift(0.5, 2)).toBe(false)
    expect(shortwaveOnShift(0.99, 2)).toBe(true)
    expect(shortwaveOnShift(1.5, 2)).toBe(true)
    expect(shortwaveOnShift(1.99, 2)).toBe(false)
    expect(shortwaveOnShift(2.5, 2)).toBe(false)
    // A pip is 0.3 s at most and 0.45 of its count at most, less its edge of 12 ms.
    expect(shortwavePipDuty(2)).toBeCloseTo(0.426, 8)
    expect(shortwavePipDuty(0.25)).toBeCloseTo(0.072, 8)
    expect(shortwavePipDuty(12)).toBeCloseTo(0.306, 8)
    expect(shortwavePipOpen(0.2, 2)).toBe(true)
    expect(shortwavePipOpen(0.7, 2)).toBe(false)
    expect(shortwavePipOpen(3.1, 2)).toBe(true)
    expect(shortwaveShiftRatio(0, 440, 48000)).toBe(0.5)
    expect(shortwaveShiftRatio(1, 440, 48000)).toBe(2)
    expect(shortwaveShiftRatio(2, 440, 48000)).toBe(4)
    // Two octaves over 5 kHz, with the slide's headroom, pass 0.49 of the rate: one is taken.
    expect(shortwaveShiftRatio(2, 5000, 48000)).toBe(2)
    expect(shortwaveShiftRatio(2, 10000, 48000)).toBe(1)
    expect(shortwaveHarmonics(440, 48000)).toBe(5)
    expect(shortwaveHarmonics(4000, 48000)).toBe(3)
    expect(shortwaveHarmonics(16000, 48000)).toBe(0)
  })

  it('sets the static and the band', () => {
    expect(shortwaveHiss(0)).toBe(0)
    expect(shortwaveHiss(0.25)).toBeCloseTo(0.075, 8)
    expect(shortwaveHiss(1)).toBeCloseTo(0.6, 8)
    expect(shortwaveCrackles(0)).toBe(0)
    expect(shortwaveCrackles(0.5)).toBeCloseTo(3.25, 8)
    expect(shortwaveCrackles(1)).toBeCloseTo(11.5, 8)
    expect(shortwaveBandHz(0, 48000)).toEqual([20, 18000, 0.6])
    const narrow = shortwaveBandHz(1, 48000)
    expect(narrow[0]).toBeCloseTo(500, 6)
    expect(narrow[1]).toBeCloseTo(2520, 6)
    expect(narrow[2]).toBeCloseTo(1.1, 8)
    expect(shortwaveBandHz(0, 32000)[1]).toBeCloseTo(14400, 6)
    // Open, a tone at 1 kHz is left whole; narrow, the corners are 3 dB down below and a
    // little up above (Q 1.1), and two octaves over the upper one are 24 dB down.
    expect(shortwaveBandDb(0, 1000, 48000)).toBeCloseTo(-0.012, 2)
    expect(shortwaveBandDb(1, 500, 48000)).toBeCloseTo(-2.812, 2)
    expect(shortwaveBandDb(1, 2520, 48000)).toBeCloseTo(0.66, 2)
    expect(shortwaveBandDb(1, 10080, 48000)).toBeCloseTo(-23.78, 1)
  })
})

describe('the display of Shortwave', () => {
  const display = WEATHER_INSTRUMENT_FACES.shortwave.display
  const params = paramsOf('shortwave')
  const view = viewOf(display, params)
  /** The dial is twelve pixels narrower than the display, from 40 Hz to 16 kHz, and its scope 19 high over 50 dB. */
  const dial = view.width - 12
  const dialX = (hz: number): number => 6 + (dial * Math.log(hz / 40)) / Math.log(400)
  const perDb = 19 / 50
  /** The tones on the dial that are lit: upright lines in the accent, left to right. */
  const spikes = (picture: RecordingContext): DrawnPath[] =>
    lights(picture)
      .filter((path) => path.points.length === 2 && path.points[0][0] === path.points[1][0])
      .sort((a, b) => a.points[0][0] - b.points[0][0])
  const at = (spike: DrawnPath): number => spike.points[0][0]
  const high = (spike: DrawnPath): number => Math.abs(spike.points[0][1] - spike.points[1][1])
  /** The lit static: a filled shape in the accent. */
  const floors = (picture: RecordingContext): DrawnPath[] =>
    drawnPaths(picture).filter(
      (path) => path.kind === 'fill' && path.colour === accent && path.points.length > 3,
    )
  /** One plain station: no slide, no fading, no static, an open band. */
  const plain = { tuneIn: 0, fading: 0, static: 0, band: 0 }

  it('lights nothing at rest, and says what the stations send and how long they take to come in', () => {
    const picture = drawn('shortwave')
    expect(anyAccent(picture)).toBe(false)
    expect(picture.words()).toContain('Whistle')
    // Tune in 0.25: 3 * 0.25^1.5 = 0.375 s.
    expect(picture.words()).toContain('A4 380 ms')
    expect(drawn('shortwave', { signal: 2, rate: 4, tuneIn: 0 }).words()).toEqual(
      expect.arrayContaining(['Pips 4.0 Hz', 'A4']),
    )
    // The static stands in the ink at rest: more of it with more Static, none without.
    const specks = (amount: number): number =>
      boxes(drawn('shortwave', { static: amount }), ink).filter((box) => box[2] === 1.5).length
    expect(specks(0)).toBe(0)
    expect(specks(1)).toBeGreaterThan(specks(0.3))
    expect(specks(0.3)).toBeGreaterThan(0)
  })

  it('lights a station at its place on the dial, as high as it is loud', () => {
    const [full] = spikes(drawn('shortwave', plain, [note(440, 1)]))
    expect(at(full)).toBeCloseTo(dialX(440), 0)
    expect(high(full)).toBeCloseTo(19, 1)
    // The softest key is 0.25 of a full one: 12.04 dB lower.
    const [soft] = spikes(drawn('shortwave', plain, [note(440, 1, null, 0)]))
    expect(high(full) - high(soft)).toBeCloseTo(12.04 * perDb, 1)
    // Half way up its Attack of two seconds it is at 0.6755: 3.4 dB under.
    const [rising] = spikes(drawn('shortwave', { ...plain, attack: 2 }, [note(440, 1)]))
    expect(high(full) - high(rising)).toBeCloseTo(3.41 * perDb, 1)
    // An octave on the dial is ln 2 / ln 400 of it.
    const [octave] = spikes(drawn('shortwave', plain, [note(880, 1)]))
    expect(at(octave) - at(full)).toBeCloseTo((dial * Math.log(2)) / Math.log(400), 1)
    // A narrow band takes 7.86 dB off a station at 220 Hz: its low cut is at 500 Hz, and
    // 10 log (1 + (500 / 220)^2) = 7.90, less a little lift from the upper corner.
    const [open] = spikes(drawn('shortwave', plain, [note(220, 1)]))
    const [narrow] = spikes(drawn('shortwave', { ...plain, band: 1 }, [note(220, 1)]))
    expect(high(open) - high(narrow)).toBeCloseTo(7.86 * perDb, 1)
  })

  it('lets a station sink with its Release, and it is out when the device has let it go', () => {
    const released = (ago: number, release: number): RecordingContext =>
      drawn('shortwave', { ...plain, release }, [note(440, 5, ago)])
    // 0.9 s into a release of 1.8 s is 30 dB down.
    const [sinking] = spikes(released(0.9, 1.8))
    expect(high(sinking)).toBeCloseTo(19 - 30 * perDb, 1)
    // 57 dB down it is under the scope but still there: its mark on the dial is lit.
    expect(spikes(released(1.7, 1.8)).length).toBe(0)
    expect(anyAccent(released(1.7, 1.8))).toBe(true)
    // Past 60 dB it is gone.
    expect(anyAccent(released(1.9, 1.8))).toBe(false)
    expect(anyAccent(released(1.9, 12))).toBe(true)
  })

  it('shows a station sliding in on both sides of its note until it has arrived', () => {
    // Tune in 1, 0.1 s after the key: 0.9 * 500 * (1 - 0.1 / 3)^3 = 406.5 cents off, either way.
    const sliding = spikes(drawn('shortwave', { ...plain, tuneIn: 1 }, [note(440, 0.1)]))
    expect(sliding.length).toBe(2)
    const off = (dial * (406.5 / 1200) * Math.log(2)) / Math.log(400)
    expect(at(sliding[0])).toBeCloseTo(dialX(440) - off, 0)
    expect(at(sliding[1])).toBeCloseTo(dialX(440) + off, 0)
    for (const spike of sliding) expect(spike.alpha).toBeLessThan(1)
    const arrived = spikes(drawn('shortwave', { ...plain, tuneIn: 1 }, [note(440, 3.1)]))
    expect(arrived.length).toBe(1)
    expect(arrived[0].alpha).toBe(1)
    // The slide is set when the key goes down: turning Tune in afterwards leaves it.
    const state = display.init?.()
    drawDisplay(display, params, {
      values: { ...plain, tuneIn: 1 },
      notes: [note(440, 0.1)],
      state,
    })
    const turned = { values: plain, notes: [note(440, 0.2)], state, now: 10.1 }
    expect(spikes(drawDisplay(display, params, turned)).length).toBe(2)
    // The notes' clock is read some milliseconds after the frame's, never by the same amount: still that key.
    const late = { values: plain, notes: [note(440, 0.303)], state, now: 10.2 }
    expect(spikes(drawDisplay(display, params, late)).length).toBe(2)
  })

  it('keys a station while it slides in as after it', () => {
    const sliding = (signal: number, age: number): DrawnPath[] =>
      spikes(
        drawn('shortwave', { ...plain, signal, rate: 2, shift: 1, tuneIn: 1 }, [note(440, age)]),
      )
    // Pips: open 0.1 s into the second pip, shut 0.35 s into it.
    expect(sliding(2, 0.6).length).toBe(2)
    expect(sliding(2, 0.85).length).toBe(0)
    // Warble on its Shift: the two arms either side of the octave above.
    const shifted = sliding(1, 0.75)
    expect(shifted.length).toBe(2)
    expect((at(shifted[0]) + at(shifted[1])) / 2).toBeCloseTo(dialX(880), 0)
    // Voices: both arms of each of the five harmonics.
    expect(sliding(3, 0.1).length).toBe(10)
  })

  it('keys the station as Warble and Pips do, and breathes on the harmonics of Voices', () => {
    const octave = (dial * Math.log(2)) / Math.log(400)
    const warble = (shift: number, age: number): DrawnPath[] =>
      spikes(drawn('shortwave', { ...plain, signal: 1, rate: 2, shift }, [note(440, age)]))
    // 2 Hz: the note for half a second, the Shift for the next.
    expect(at(warble(1, 0.25)[0])).toBeCloseTo(dialX(440), 0)
    expect(at(warble(1, 0.75)[0]) - at(warble(1, 0.25)[0])).toBeCloseTo(octave, 1)
    expect(at(warble(0, 0.75)[0]) - at(warble(0, 0.25)[0])).toBeCloseTo(-octave, 1)
    expect(at(warble(2, 0.75)[0]) - at(warble(2, 0.25)[0])).toBeCloseTo(2 * octave, 1)
    expect(at(warble(1, 1.25)[0])).toBeCloseTo(dialX(440), 0)
    // A pip is open for 0.426 of each half second.
    const pips = (age: number): RecordingContext =>
      drawn('shortwave', { ...plain, signal: 2, rate: 2 }, [note(440, age)])
    expect(spikes(pips(0.6)).length).toBe(1)
    expect(spikes(pips(0.85)).length).toBe(0)
    expect(anyAccent(pips(0.85))).toBe(true)
    // Voices: the five harmonics, or as many as fit under the top of the band.
    const voices = (hz: number): DrawnPath[] =>
      spikes(drawn('shortwave', { ...plain, signal: 3 }, [note(hz, 1)]))
    expect(voices(440).map((spike) => Math.round(at(spike)))).toEqual(
      [1, 2, 3, 4, 5].map((n) => Math.round(dialX(440 * n))),
    )
    expect(voices(4000).length).toBe(3)
  })

  it('shows a faded station between its worst and its best', () => {
    const faded = spikes(drawn('shortwave', { ...plain, fading: 1 }, [note(440, 1)]))
    expect(faded.length).toBe(2)
    const sure = faded.find((spike) => spike.alpha === 1)
    const most = faded.find((spike) => spike.alpha < 1)
    // 14 dB under where it stands without Fading for sure; up to 4 dB over, which is the scope's top.
    expect(high(sure ?? faded[0])).toBeCloseTo(19 - 14 * perDb, 1)
    expect(high(most ?? faded[0])).toBeCloseTo(19, 1)
  })

  it('raises the static with the loudest key, and has none without Static', () => {
    expect(floors(drawn('shortwave', plain, [note(440, 1)])).length).toBe(0)
    const top = (gain: number): number => {
      const [floor] = floors(
        drawn('shortwave', { ...plain, static: 1 }, [note(440, 1, null, gain)]),
      )
      return Math.min(...floor.points.map((point) => point[1]))
    }
    // Under a soft key it is 12 dB lower than under a full one, as the key itself is.
    expect(top(0) - top(1)).toBeCloseTo(12.04 * perDb, 1)
  })

  it('turns every station down as more than four sound, and lights ten at most', () => {
    const chord = (count: number): DisplayNote[] =>
      Array.from({ length: count }, (_, n) => note(440 * Math.pow(2, n / 12), 1, null, 1 - n / 20))
    const [alone] = spikes(drawn('shortwave', plain, chord(1)))
    const eight = spikes(drawn('shortwave', plain, chord(8)))
    expect(eight.length).toBe(8)
    // (4 / 8)^0.6 is 3.6 dB down.
    expect(high(alone) - high(eight[0])).toBeCloseTo(3.61 * perDb, 1)
    expect(spikes(drawn('shortwave', plain, chord(12))).length).toBe(10)
    // It is their envelopes that are added up: four that are 40 dB down (1.2 s of a Release of 1.8 s)
    // count for 0.04 of a station, and (4 / 4.04)^0.6 is 0.05 dB.
    const sunk = Array.from({ length: 4 }, (_, n) => note(880 * Math.pow(2, n / 12), 5, 1.2))
    const [first] = spikes(drawn('shortwave', plain, [...sunk, ...chord(4)]))
    expect(high(alone) - high(first)).toBeCloseTo(0.05 * perDb, 1)
  })

  it('has handles that set Tune in and Static where they stand, in every layout', () => {
    for (const signal of [0, 1, 3]) {
      const values = { signal, tuneIn: 0.7, static: 0.8, band: 0.6 }
      const handles = display.handles?.(viewOf(display, params, { values })) ?? []
      expect(handles.map((handle) => handle.key)).toEqual(['tuneIn', 'static'])
      for (const handle of handles) {
        const set = handle.drag(handle.x, handle.y)
        for (const [name, value] of Object.entries(set))
          expect(value).toBeCloseTo(values[name as keyof typeof values], 6)
      }
    }
  })
})
