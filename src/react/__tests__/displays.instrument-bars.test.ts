// The truth of the struck instruments' displays: a bar, a note of the pan and
// a mode of a bell ring as long as the device says, each is lit for as long as
// the device's own figures let it sound, and what a knob does to a note that
// is struck shows on it.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  BARS_INSTRUMENT_FACES,
  bellChokeSeconds,
  bellModeHz,
  bellModeSeconds,
  bellModeSize,
  bellPan,
  bellPulsePeriods,
  bellRingSeconds,
  bellRubLevel,
  bellStrike,
  bellTilt,
  bellWeight,
  handpanAnswers,
  handpanBend,
  handpanContactSeconds,
  handpanDampedSeconds,
  handpanModes,
  handpanShimmerHz,
  handpanTouch,
  malletBarDb,
  malletBarSeconds,
  malletBloomSeconds,
  malletContactSeconds,
  malletDampedSeconds,
  malletDamperSeconds,
  malletKnock,
  malletKnockSeconds,
  malletRingSeconds,
  malletRollHz,
  malletStage,
  pushResponse,
} from '../components/displays/instrument-bars'
import { type DisplayNote } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  runDisplay,
  stockDescriptors,
  viewOf,
  type DrawnPath,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string) => stock.get(id)?.params ?? {}
const { accent } = PLAIN_COLOURS

const C3 = 130.8128
const C4 = 261.6256
const C6 = 1046.502
const D3 = 146.832
const D4 = 293.665
const E4 = 329.628
const A4 = 440

const note = (
  frequency: number,
  age: number,
  released: number | null = null,
  gain = 1,
): DisplayNote => ({ id: Math.round(frequency), frequency, gain, age, released })

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** The rectangles filled in the accent: the lights of a display that is made of bars. */
function accentRects(drawn: RecordingContext): Rect[] {
  const out: Rect[] = []
  let fill = ''
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'fillRect' && fill === accent) {
      const [x, y, w, h] = call.args as number[]
      out.push({ x, y, w, h })
    }
  }
  return out
}
/** Everything painted in the accent as a path: lines, dots and filled shapes. */
const accentPaths = (drawn: RecordingContext): DrawnPath[] =>
  drawnPaths(drawn).filter((path) => path.colour === accent)

describe('the push of a mallet', () => {
  it('reaches a mode as `Mallets::response` says', () => {
    expect(pushResponse(0)).toBe(1)
    expect(pushResponse(1)).toBe(0.5)
    expect(pushResponse(0.5)).toBeCloseTo(1 / ((Math.PI / 2) * 0.75), 6)
    // A push two or three periods of a mode long leaves nothing in it.
    expect(pushResponse(2)).toBeCloseTo(0, 6)
    expect(pushResponse(3)).toBeCloseTo(0, 6)
  })
})

describe('the mallets’ figures', () => {
  it('ring as long as `Mallets::ring` says, times Decay', () => {
    // `mallets.h`, `kBars`: a marimba bar rings 2 s at middle C and half that an octave up; metal falls by the root.
    expect(malletBarSeconds(0, C4, 1)).toBeCloseTo(2, 5)
    expect(malletBarSeconds(0, 2 * C4, 1)).toBeCloseTo(1, 5)
    expect(malletBarSeconds(0, C4, 4)).toBeCloseTo(8, 5)
    expect(malletBarSeconds(1, C4, 1)).toBeCloseTo(10, 5)
    expect(malletBarSeconds(1, C6, 1)).toBeCloseTo(5, 4)
    expect(malletBarSeconds(2, C4, 1)).toBeCloseTo(1, 5)
    expect(malletBarSeconds(3, C6, 1)).toBeCloseTo(4, 5)
    expect(malletBarSeconds(4, C6, 1)).toBeCloseTo(2.5, 5)
    // The law is held between two octaves under its reference and three over.
    expect(malletBarSeconds(0, 20, 1)).toBeCloseTo(8, 5)
    expect(malletBarSeconds(0, 8000, 1)).toBeCloseTo(0.25, 5)
  })

  it('lose to the tube what it radiates, as `Mallets::load` has it', () => {
    expect(malletRingSeconds(0, 2, 0, 0)).toBe(2)
    // The marimba's open tube halves the ring; the vibraphone's takes 0.8 of it again.
    expect(malletRingSeconds(0, 2, 1, 0)).toBeCloseTo(1, 6)
    expect(malletRingSeconds(1, 10, 1, 0)).toBeCloseTo(10 / 1.8, 6)
    // A motor full on shuts the tube half the time, and a shut tube takes nothing.
    expect(malletRingSeconds(1, 10, 1, 1)).toBeCloseTo(10 / 1.4, 6)
  })

  it('are stopped at key up as `Mallets::ring` stops them', () => {
    expect(malletDamperSeconds(0)).toBe(Infinity)
    expect(malletDamperSeconds(1)).toBeCloseTo(0.15, 6)
    expect(malletDamperSeconds(0.5)).toBeCloseTo(0.15 * Math.sqrt(200), 5)
    // `Mallets::ring` limits the bar alone and `Mallets::load` then takes the tube's share of what is left:
    // a marimba bar over its open tube is stopped in half the damper's time, not in the damper's time.
    expect(malletDampedSeconds(0, 2, 1, 1, 0)).toBeCloseTo(0.075, 6)
    expect(malletDampedSeconds(0, 2, 1, 0, 0)).toBeCloseTo(0.15, 6)
    expect(malletDampedSeconds(1, 10, 0.5, 1, 0)).toBeCloseTo((0.15 * Math.sqrt(200)) / 1.8, 5)
    // No Damper, or one slower than the bar, leaves the ring it had while held.
    expect(malletDampedSeconds(0, 2, 0, 1, 0)).toBeCloseTo(malletRingSeconds(0, 2, 1, 0), 6)
    expect(malletDampedSeconds(0, 2, 0.1, 1, 0)).toBeCloseTo(1, 6)
  })

  it('knock for as long as the second mode rings, and as loud as the mallet is hard', () => {
    // Wood: 3 per unit of ratio over the fundamental, and the second mode is at 4. Aluminium: 0.4.
    expect(malletKnockSeconds(0, 2)).toBeCloseTo(0.2, 6)
    expect(malletKnockSeconds(1, 10)).toBeCloseTo(10 / 2.2, 6)
    // `Mallets::stroke`: soft 2.5 ms and hard 0.25 ms at middle C, shorter for a harder stroke.
    expect(malletContactSeconds(0, 0, C4, 1)).toBeCloseTo(0.002, 6)
    expect(malletContactSeconds(0, 1, C4, 1)).toBeCloseTo(0.0002, 7)
    expect(malletContactSeconds(4, 0, C4, 1)).toBeCloseTo(0.0032, 6)
    // Never longer than 8 ms, nor than 0.9 of the note's period.
    expect(malletContactSeconds(0, 0, 32.7, 0)).toBeCloseTo(0.008, 6)
    expect(malletContactSeconds(0, 0, 4000, 1)).toBeCloseTo(0.9 / 4000, 7)
    // The knock is the second mode against the fundamental where the first hand lands, 0.42 of the bar from its end.
    const periods = malletContactSeconds(0, 0.35, C4, 0.8) * C4
    const expected =
      (1.4 * Math.abs(Math.sin(2.5 * Math.PI * -0.08)) * pushResponse(4 * periods)) /
      (Math.cos(1.5 * Math.PI * -0.08) * pushResponse(periods))
    expect(malletKnock(0, 0.35, C4, 0.8)).toBeCloseTo(expected, 6)
    expect(malletKnock(0, 1, C4, 0.8)).toBeGreaterThan(malletKnock(0, 0.35, C4, 0.8))
    expect(malletKnock(0, 0.35, C4, 0.8)).toBeGreaterThan(5 * malletKnock(0, 0, C4, 0.8))
    // The other hand lands at 0.39 of the bar, where the second mode moves more.
    expect(malletKnock(0, 0.35, C4, 0.8, 1)).toBeCloseTo(
      (1.4 * Math.abs(Math.sin(2.5 * Math.PI * -0.11)) * pushResponse(4 * periods)) /
        (Math.cos(1.5 * Math.PI * -0.11) * pushResponse(periods)),
      6,
    )
    // `Mallets::start`: a mode at 16 kHz or over is not there, so a bar that high has no knock.
    expect(malletKnock(0, 0.35, 3900, 0.8)).toBeGreaterThan(0)
    expect(malletKnock(0, 0.35, 4000, 0.8)).toBe(0)
    expect(malletKnock(2, 0.35, 4000, 0.8)).toBeGreaterThan(0)
    expect(malletKnock(2, 0.35, 4000, 0.8, 0, 22050)).toBe(0)
  })

  it('roll as fast as `Mallets::roll_interval` says', () => {
    expect(malletRollHz(0.4, C4)).toBe(0)
    expect(malletRollHz(8, C3)).toBeCloseTo(8, 5)
    expect(malletRollHz(8, C4)).toBeCloseTo(8 * 1.12, 4)
    expect(malletRollHz(8, 8000)).toBeCloseTo(12, 5)
    expect(malletRollHz(8, 20)).toBeCloseTo(6.4, 5)
  })

  it('stand between the speakers as `Mallets::stage` places them', () => {
    expect(malletStage(369.994, 1)).toBeCloseTo(0, 4)
    expect(malletStage(2093.005, 1)).toBeCloseTo(0.75, 4)
    expect(malletStage(65.406, 0.5)).toBeCloseTo(-0.375, 4)
    expect(malletStage(8000, 1)).toBe(0.75)
    expect(malletStage(2093.005, 0)).toBeCloseTo(0, 6)
  })

  it('fill the tube over Q / (π·f) seconds', () => {
    expect(malletBloomSeconds(0, C4)).toBeCloseTo(16 / (Math.PI * C4), 8)
    expect(malletBloomSeconds(4, C4)).toBeCloseTo(6 / (Math.PI * C4), 8)
  })

  it('fall 60 dB over the ring, faster from the key up when damped, and are topped up by a roll', () => {
    expect(malletBarDb(0, 1, null, 4, Infinity)).toBeCloseTo(0, 6)
    expect(malletBarDb(2, 1, null, 4, Infinity)).toBeCloseTo(-30, 5)
    // `Mallets::stroke_level`: gain · (0.3 + 0.7 · gain).
    expect(malletBarDb(0, 0.5, null, 4, Infinity)).toBeCloseTo(20 * Math.log10(0.325), 4)
    expect(malletBarDb(2, 1, 1, 4, Infinity)).toBeCloseTo(-30, 5)
    expect(malletBarDb(2, 1, 1, 4, 0.15)).toBeCloseTo(-15 - 400, 3)
    // A damper slower than the bar leaves the bar its own ring.
    expect(malletBarDb(2, 1, 1, 4, 30)).toBeCloseTo(-30, 5)
    // Held a second on a bar that rings half of one: gone, unless a roll struck it again just now, 4.4 dB under the first stroke.
    expect(malletBarDb(1, 1, null, 0.5, Infinity)).toBeCloseTo(-120, 4)
    expect(malletBarDb(1, 1, null, 0.5, Infinity, 4)).toBeCloseTo(20 * Math.log10(0.6), 4)
    expect(malletBarDb(1.125, 1, null, 0.5, Infinity, 4)).toBeCloseTo(20 * Math.log10(0.6) - 15, 4)
    // The roll stops with the key.
    expect(malletBarDb(2, 1, 1, 0.5, Infinity, 4)).toBeCloseTo(20 * Math.log10(0.6) - 120, 3)
  })
})

describe('the mallets’ display', () => {
  const { display } = BARS_INSTRUMENT_FACES.mallets
  const params = paramsOf('mallets')
  const run = (values: Record<string, number>, notes: DisplayNote[]) =>
    runDisplay(display, params, 0.1, { values, notes })
  /** The light on the bar: the tallest thing lit, since a tube's light is shorter than its bar's. */
  const barLight = (drawn: RecordingContext): number =>
    Math.max(0, ...accentRects(drawn).map((rect) => rect.h))

  it('lights nothing at rest, and a bar and its tube for each note that sounds', () => {
    expect(accentRects(drawDisplay(display, params))).toHaveLength(0)
    expect(accentPaths(drawDisplay(display, params))).toHaveLength(0)
    expect(accentRects(run({}, []))).toHaveLength(0)
    expect(accentRects(run({}, [note(C4, 0.2), note(E4, 0.2)]))).toHaveLength(4)
    // With no Resonator there is no tube to light.
    expect(accentRects(run({ resonator: 0 }, [note(C4, 0.2), note(E4, 0.2)]))).toHaveLength(2)
  })

  it('lets the light shrink as the bar dies, and puts it out when it has', () => {
    const ring = malletRingSeconds(0, malletBarSeconds(0, C4, 1), 0.8, 0)
    const early = barLight(run({}, [note(C4, ring * 0.1)]))
    const late = barLight(run({}, [note(C4, ring * 0.7)]))
    expect(late).toBeLessThan(early * 0.5)
    expect(accentRects(run({}, [note(C4, ring * 1.05)]))).toHaveLength(0)
  })

  it('rings metal on where wood is done, and longer with more Decay', () => {
    const struck = [note(C4, 2)]
    expect(accentRects(run({ instrument: 0 }, struck))).toHaveLength(0)
    expect(accentRects(run({ instrument: 1 }, struck)).length).toBeGreaterThan(0)
    expect(accentRects(run({ instrument: 0, decay: 4 }, struck)).length).toBeGreaterThan(0)
  })

  it('stops a damped bar soon after its key is let go, and leaves an undamped one lit', () => {
    const letGo = [note(C4, 1, 0.5)]
    expect(accentRects(run({ instrument: 1, damper: 0 }, letGo)).length).toBeGreaterThan(0)
    expect(accentRects(run({ instrument: 1, damper: 1 }, letGo))).toHaveLength(0)
    // The tube takes its share of what the damper leaves: a marimba bar over a full tube, let go a tenth of a
    // second ago under a full Damper, has fallen 80 dB since. By the damper's time alone it would still be lit.
    const justLetGo = [note(C4, 0.2, 0.1)]
    expect(accentRects(run({ resonator: 1, damper: 1 }, justLetGo))).toHaveLength(0)
    expect(accentRects(run({ resonator: 0, damper: 1 }, justLetGo)).length).toBeGreaterThan(0)
  })

  it('keeps a held bar lit while it is rolled, and not once it is let go', () => {
    expect(accentRects(run({ roll: 0 }, [note(C4, 3)]))).toHaveLength(0)
    expect(accentRects(run({ roll: 8 }, [note(C4, 3)])).length).toBeGreaterThan(0)
    expect(accentRects(run({ roll: 8 }, [note(C4, 6, 3)]))).toHaveLength(0)
  })

  it('gives a bar to the later of two notes on it', () => {
    expect(accentRects(run({ resonator: 0 }, [note(C4, 0.6), note(C4, 0.1)]))).toHaveLength(1)
  })

  it('draws the motor’s turning only where a tube is heard through it', () => {
    const still = (values: Record<string, number>) =>
      drawDisplay(display, params, { values }).words()
    expect(still({ motor: 0 })).not.toContain('4.5 Hz')
    expect(still({ motor: 0.7 })).toContain('4.5 Hz')
    expect(still({ motor: 0.7, motorRate: 2 })).toContain('2.0 Hz')
    expect(still({ motor: 0.7, resonator: 0 })).not.toContain('4.5 Hz')
  })

  it('says which bars, and how long the last one struck rings', () => {
    const words = drawDisplay(display, params, { values: { instrument: 3 } }).words()
    expect(words).toContain('Glockenspiel')
    expect(run({}, [note(A4, 0.1)]).words()).toContain('A4 660 ms')
  })

  it('stands its handle where Decay is, and a drag sets it', () => {
    const settings: Record<string, number>[] = [
      {},
      { instrument: 1, decay: 0.5 },
      { instrument: 4, resonator: 0 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [decay] = display.handles?.(view) ?? []
      expect(decay.drag(decay.x, decay.y).decay).toBeCloseTo(view.value('decay'), 3)
      expect(decay.drag(decay.x, decay.y - 6).decay).toBeGreaterThan(view.value('decay'))
    }
  })
})

describe('the handpan’s figures', () => {
  it('take a harder key for a harder hand, as `Handpan::strike` does', () => {
    expect(handpanTouch(0.3, 0.6)).toBeCloseTo(0.3, 6)
    expect(handpanTouch(0.3, 1)).toBeCloseTo(0.46, 6)
    expect(handpanTouch(0.9, 1)).toBe(1)
    expect(handpanTouch(0.1, 0)).toBe(0)
    expect(handpanContactSeconds(0)).toBeCloseTo(0.006, 8)
    expect(handpanContactSeconds(1)).toBeCloseTo(0.0015, 8)
    expect(handpanContactSeconds(0.5)).toBeCloseTo(0.003, 8)
  })

  it('wake the octave and the twelfth by where the hand lands and how hard it is', () => {
    // At the edge under the hardest hand, on a low note the hand's tilt leaves alone: the
    // octave 2 dB over the fundamental's 0.75, and the bloom's quarter of that fundamental squared.
    const strength = 0.6 * (0.3 + 0.7 * 0.6)
    const edge = handpanModes(0, 1, 1, 20, 0.6, [])
    const tilt = (ratio: number): number =>
      (1 + (20 / 6000) ** 2) / (1 + ((20 * ratio) / 6000) ** 2)
    expect(edge[0]).toBeCloseTo(strength * 0.75, 6)
    expect(edge[1]).toBeCloseTo(
      strength * Math.pow(10, 2 / 20) * tilt(2) + 0.25 * (strength * 0.75) ** 2,
      6,
    )
    expect(edge[2]).toBeCloseTo(
      strength * Math.pow(10, (2 - 1) / 20) * tilt(3) + 0.15 * (strength * 0.75) ** 3,
      6,
    )
    // At the centre the note is nearly pure: the octave 18 dB down and the twelfth 21, under a soft hand 6 more.
    const centre = handpanModes(0, 0, 0, 20, 0.6, [])
    expect(centre[0]).toBeCloseTo(strength, 6)
    expect(centre[1] / centre[0]).toBeLessThan(0.08)
    expect(centre[2] / centre[0]).toBeLessThan(0.06)
    // A tongue has a weaker octave and a faint ping, and its ping has no bloom.
    const tongue = handpanModes(1, 1, 1, 20, 0.6, [])
    expect(tongue[1]).toBeLessThan(edge[1] * 0.5)
    expect(tongue[2]).toBeCloseTo(strength * Math.pow(10, (2 - 18) / 20) * tilt(6.27), 6)
    // A soft hand loses what lies above its corner, and a mode over the band is not there.
    expect(handpanModes(0, 1, 0, 1000, 0.6, [])[1]).toBeLessThan(
      handpanModes(0, 1, 0, 100, 0.6, [])[1],
    )
    expect(handpanModes(1, 1, 1, 4000, 0.6, [])[2]).toBe(0)
  })

  it('are muted at key up as `Handpan::tune` mutes them', () => {
    expect(handpanDampedSeconds(3.5, 0)).toBe(Infinity)
    expect(handpanDampedSeconds(3.5, 1)).toBeCloseTo(0.18, 6)
    expect(handpanDampedSeconds(3.5, 0.5)).toBeCloseTo(0.18 * Math.sqrt(3.5 / 0.18), 5)
  })

  it('lean each key’s overtones the way `Handpan::start` draws for it', () => {
    // The device's own generator and seed, run for these keys.
    const drawn: [number, number, number][] = [
      [50, -0.512425, 0.943001],
      [57, 0.924281, 0.77844],
      [60, -0.661296, 0.503354],
      [62, 0.515407, -0.72955],
      [64, -0.916667, -0.919431],
      [69, 0.837774, -0.55486],
    ]
    for (const [key, octave, twelfth] of drawn) {
      expect(handpanBend(key)[0]).toBeCloseTo(octave, 5)
      expect(handpanBend(key)[1]).toBeCloseTo(twelfth, 5)
    }
  })

  it('move the overtones off true by Shimmer, capped in hertz', () => {
    // 8 cents of the octave of D3, and no more than 1.6 Hz of any octave or 2.2 Hz of a twelfth.
    expect(handpanShimmerHz(0, 1, D3, 1, 1)).toBeCloseTo(2 * D3 * (Math.pow(2, 8 / 1200) - 1), 6)
    expect(handpanShimmerHz(0, 1, D3, 1, -1)).toBeLessThan(0)
    expect(handpanShimmerHz(0, 1, 1000, 1, 1)).toBeCloseTo(1.6, 6)
    expect(handpanShimmerHz(0, 2, 1000, 1, -1)).toBeCloseTo(-2.2, 6)
    expect(handpanShimmerHz(0, 1, 1000, 0.5, 1)).toBeCloseTo(0.8, 6)
    expect(handpanShimmerHz(0, 1, D3, 0, 1)).toBe(0)
    // A tongue's ping stays where it is.
    expect(handpanShimmerHz(1, 2, D3, 1, 1)).toBe(0)
    expect(handpanShimmerHz(1, 1, 1000, 1, 1)).toBeCloseTo(1.6, 6)
  })

  it('answer one another where a mode of one meets a mode of the other', () => {
    expect(handpanAnswers(0, D3, D4)).toBe(true)
    expect(handpanAnswers(0, D4, D3)).toBe(true)
    expect(handpanAnswers(0, D3, A4)).toBe(true)
    expect(handpanAnswers(0, 220, E4)).toBe(true)
    expect(handpanAnswers(0, D4, E4)).toBe(false)
    expect(handpanAnswers(0, C4, E4)).toBe(false)
    // A tongue has a ping where the pan has a twelfth.
    expect(handpanAnswers(1, D3, A4)).toBe(false)
    expect(handpanAnswers(1, D3, D4)).toBe(true)
  })
})

describe('the handpan’s display', () => {
  const { display } = BARS_INSTRUMENT_FACES.handpan
  const params = paramsOf('handpan')
  const run = (values: Record<string, number>, notes: DisplayNote[]) =>
    runDisplay(display, params, 0.1, { values, notes })
  /** The lines between notes that answer each other. */
  const answers = (drawn: RecordingContext): DrawnPath[] =>
    accentPaths(drawn).filter((path) => path.kind === 'stroke' && path.points.length === 2)
  /** The tongues that are lit, on a tongue drum: each a filled shape of six corners. */
  const tongues = (drawn: RecordingContext): DrawnPath[] =>
    accentPaths(drawn).filter((path) => path.kind === 'fill' && path.points.length === 6)

  it('lights nothing at rest, and a note for as long as Decay lets it ring', () => {
    expect(accentPaths(drawDisplay(display, params))).toHaveLength(0)
    expect(accentPaths(run({}, []))).toHaveLength(0)
    expect(accentPaths(run({ decay: 2 }, [note(D4, 1)])).length).toBeGreaterThan(0)
    expect(accentPaths(run({ decay: 2 }, [note(D4, 2.1)]))).toHaveLength(0)
    expect(accentPaths(run({ decay: 8 }, [note(D4, 2.1)])).length).toBeGreaterThan(0)
  })

  it('mutes a note that is let go with a hand on it, and lets it ring with none', () => {
    const letGo = [note(D4, 1, 0.5)]
    expect(accentPaths(run({ damp: 0 }, letGo)).length).toBeGreaterThan(0)
    expect(accentPaths(run({ damp: 1 }, letGo))).toHaveLength(0)
  })

  it('lights one field for each note, even keys on the left and odd ones on the right', () => {
    const middle = 4 + 1 + 36
    const even = tongues(run({ type: 1 }, [note(C4, 0.3)]))
    const odd = tongues(run({ type: 1 }, [note(277.183, 0.3)]))
    expect(even).toHaveLength(1)
    expect(odd).toHaveLength(1)
    expect(Math.max(...even[0].points.map(([x]) => x))).toBeLessThan(middle)
    expect(Math.min(...odd[0].points.map(([x]) => x))).toBeGreaterThan(middle)
    expect(tongues(run({ type: 1 }, [note(C4, 0.3), note(E4, 0.3), note(A4, 0.3)]))).toHaveLength(3)
    // The same key struck again is the same field.
    expect(tongues(run({ type: 1 }, [note(C4, 0.9), note(C4, 0.3)]))).toHaveLength(1)
  })

  it('draws no field at rest: the device has only the notes that ring', () => {
    // On a tongue drum a note is a shape of six corners; none is drawn, in any colour, until one is struck.
    const sixes = (drawn: RecordingContext): DrawnPath[] =>
      drawnPaths(drawn).filter((path) => path.points.length === 6)
    expect(sixes(drawDisplay(display, params, { values: { type: 1 } }))).toHaveLength(0)
    expect(sixes(run({ type: 1 }, [])).length).toBe(0)
    expect(sixes(run({ type: 1 }, [note(C4, 0.3)])).length).toBeGreaterThan(0)
  })

  it('lays two notes an octave apart in places of their own, and joins them', () => {
    // `handpan.h`: "a tap on D4 sets the octave of a ringing D3 going". Folded onto one field they
    // would be one light and a line of no length.
    const octave = [note(D3, 0.3), note(D4, 0.3)]
    expect(tongues(run({ type: 1 }, octave))).toHaveLength(2)
    const joined = answers(run({ sympathy: 1 }, octave))
    expect(joined).toHaveLength(1)
    const [[highX, highY], [lowX, lowY]] = joined[0].points
    expect(Math.hypot(highX - lowX, highY - lowY)).toBeGreaterThan(12)
    // Both are even keys, so both lie on the left; the higher is further from the near side.
    const middle = 4 + 1 + 36
    expect(Math.max(highX, lowX)).toBeLessThan(middle)
    expect(highY).toBeLessThan(lowY)
  })

  it('turns each key’s mark by Shimmer at rest, every key its own way', () => {
    /** The marks of the scale that are not Cs: one path of a line for each. */
    const marks = (shimmer: number): [number, number][] =>
      drawnPaths(drawDisplay(display, params, { values: { shimmer } })).find(
        (path) => path.kind === 'stroke' && path.points.length === 2 * (37 - 4),
      )?.points ?? []
    const straight = marks(0)
    const turned = marks(1)
    expect(straight).toHaveLength(66)
    // With no Shimmer every mark points at the middle of the shell.
    const middle = [4 + 1 + 36, 4 + 11 + 36]
    for (let at = 0; at < straight.length; at += 2) {
      const [x0, y0] = straight[at]
      const [x1, y1] = straight[at + 1]
      const cross = (x1 - x0) * (middle[1] - y0) - (y1 - y0) * (middle[0] - x0)
      expect(Math.abs(cross)).toBeLessThan(1e-6)
    }
    // With all of it none does, and they do not all turn the same way.
    const crosses: number[] = []
    for (let at = 0; at < turned.length; at += 2) {
      const [x0, y0] = turned[at]
      const [x1, y1] = turned[at + 1]
      crosses.push((x1 - x0) * (middle[1] - y0) - (y1 - y0) * (middle[0] - x0))
    }
    expect(Math.min(...crosses.map(Math.abs))).toBeGreaterThan(1)
    expect(Math.min(...crosses)).toBeLessThan(0)
    expect(Math.max(...crosses)).toBeGreaterThan(0)
  })

  it('joins two ringing notes that answer each other, as strongly as Sympathy', () => {
    const fifth = [note(220, 0.3), note(E4, 0.3)]
    expect(answers(run({ sympathy: 0 }, fifth))).toHaveLength(0)
    const some = answers(run({ sympathy: 0.5 }, fifth))
    const full = answers(run({ sympathy: 1 }, fifth))
    expect(some).toHaveLength(1)
    expect(full[0].alpha).toBeGreaterThan(some[0].alpha)
    // A second apart they have no mode in common, and one note alone has nothing to answer.
    expect(answers(run({ sympathy: 1 }, [note(D4, 0.3), note(E4, 0.3)]))).toHaveLength(0)
    expect(answers(run({ sympathy: 1 }, [note(D4, 0.3)]))).toHaveLength(0)
  })

  it('lights the air in the shell for as long as it rings after a tap, with Cavity up', () => {
    const lights = (cavity: number, age: number): number =>
      accentPaths(run({ cavity }, [note(D4, age)])).length
    expect(lights(1, 0.05)).toBe(lights(0, 0.05) + 1)
    expect(lights(1, 0.5)).toBe(lights(0, 0.5))
  })

  it('stands the hand where Position is, and a drag sets it', () => {
    const settings: Record<string, number>[] = [{}, { position: 0.9 }, { type: 1, position: 0.2 }]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [hand] = display.handles?.(view) ?? []
      expect(hand.drag(hand.x, hand.y).position).toBeCloseTo(view.value('position'), 3)
    }
    // The centre of the note is Position 0; from there the hand goes out toward the rim.
    const at = (position: number) =>
      (display.handles?.(viewOf(display, params, { values: { position } })) ?? [])[0]
    const centre = at(0)
    const edge = at(1)
    expect(centre.drag(centre.x, centre.y).position).toBeCloseTo(0, 6)
    expect(edge.drag(edge.x, edge.y).position).toBeCloseTo(1, 6)
    expect(Math.hypot(edge.x - centre.x, edge.y - centre.y)).toBeGreaterThan(10)
  })

  it('says which steel, and how long a note rings', () => {
    expect(drawDisplay(display, params).words()).toEqual(['Handpan', '3.5 s'])
    expect(drawDisplay(display, params, { values: { type: 1 } }).words()).toContain('Tongue drum')
    expect(run({}, [note(D4, 0.2)]).words()).toContain('D4 3.5 s')
  })
})

describe('the bells’ figures', () => {
  it('weigh a mode by where the mallet lands, as `ModalBells::weight` does', () => {
    // A rim mode of a bell with no shape of its own is woken anywhere.
    expect(bellWeight('shell', 0, 0, 0.7)).toBe(1)
    expect(bellWeight('shell', 1, 0, 1)).toBeCloseTo(0, 6)
    // A free bar: its first mode is whole in the middle, its second has a node there.
    expect(bellWeight('bar', 1, 0, 1)).toBeCloseTo(1, 6)
    expect(bellWeight('bar', 1, 0, 0)).toBeCloseTo(Math.cos(-0.75 * Math.PI), 6)
    expect(bellWeight('bar', 2, 0, 1)).toBeCloseTo(0, 6)
    // A tine moves most at its tip; a plate's modes with nodal diameters vanish at the centre.
    expect(bellWeight('tine', 1, 0, 0)).toBeCloseTo(1, 6)
    expect(bellWeight('plate', 2, 0, 1)).toBe(0)
    expect(bellWeight('plate', 0, 1, 1)).toBe(1)
  })

  it('push for a share of the note’s period, as `ModalBells::strike` does', () => {
    // Soft 0.9 of a period and hard 0.03, half of that for the hardest stroke.
    expect(bellPulsePeriods(0, 1, C4)).toBeCloseTo(0.45, 6)
    expect(bellPulsePeriods(1, 1, C4)).toBeCloseTo(0.015, 6)
    expect(bellPulsePeriods(0.5, 1, C4)).toBeCloseTo(0.45 * Math.pow(0.03 / 0.9, 0.25), 6)
    // No longer than 8 ms and no shorter than two samples.
    expect(bellPulsePeriods(0, 0, 20)).toBeCloseTo(0.008 * 20, 6)
    expect(bellPulsePeriods(1, 1, 8000)).toBeCloseTo((2 * 8000) / 48000, 6)
  })

  it('tune and damp each mode as `ModalBells::tune` does', () => {
    // A singing bowl: a pair at the note, half of Detune either way, then a pair at 2.77.
    expect(bellModeHz(1, 0, 200, 1, 2)).toBeCloseTo(201, 6)
    expect(bellModeHz(1, 1, 200, 1, 2)).toBeCloseTo(199, 6)
    expect(bellModeHz(1, 2, 200, 1, 0)).toBeCloseTo(554, 4)
    expect(bellModeHz(1, 2, 200, 0.5, 0)).toBeCloseTo(200 * Math.sqrt(2.77), 4)
    // Decay is the lowest mode's ring; the rest die faster by 0.02 per unit of ratio over it, to 2 with Damping.
    expect(bellModeSeconds(1, 0, 12, 0.4, 1)).toBe(12)
    expect(bellModeSeconds(1, 2, 12, 0, 1)).toBeCloseTo(12 / (1 + 0.02 * 1.77), 6)
    expect(bellModeSeconds(1, 2, 12, 1, 1)).toBeCloseTo(12 / (1 + 2 * 1.77), 6)
    expect(bellRingSeconds(12, 0.5, 3)).toBeCloseTo(12 / (1 + 0.2 * 2), 6)
    // A church bell's lowest mode is its hum, an octave under the note.
    expect(bellModeSeconds(0, 0, 12, 1, 1)).toBe(12)
    expect(bellModeSeconds(0, 2, 12, 1, 1)).toBeCloseTo(12 / 3, 6)
    expect(bellModeSeconds(0, 2, 12, 1, 0.5)).toBeCloseTo(12 / (1 + 2 * (Math.SQRT2 - 1)), 6)
  })

  it('choke a note at key up as `ModalBells::tune` does', () => {
    expect(bellChokeSeconds(0)).toBe(Infinity)
    expect(bellChokeSeconds(1)).toBeCloseTo(0.1, 6)
    expect(bellChokeSeconds(0.25)).toBeCloseTo(0.1 * Math.pow(400, 0.75), 5)
  })

  it('strike and rub each mode as the device does', () => {
    // The bowl's first mode, at the rim, under a tap too short to matter.
    expect(bellStrike(1, 0, 0, 0, 1, 1, 0)).toBeCloseTo(0.6, 6)
    expect(bellStrike(1, 0, 0, 0, 1, 0.5, 0)).toBeCloseTo(0.6 * 0.325, 6)
    // Rubbing takes the mallet's place: a full Sustain leaves a tenth of the strike.
    expect(bellStrike(1, 0, 0, 0, 1, 1, 1)).toBeCloseTo(0.06, 6)
    // A push a whole period of the mode long leaves half, and the church bell is evened by 0.6.
    expect(bellStrike(1, 0, 0, 1, 1, 1, 0)).toBeCloseTo(0.3, 6)
    expect(bellStrike(0, 0, 0, 0, 0.5, 1, 0)).toBeCloseTo(0.6 * 0.27, 6)
    // `kRubLevel` 0.4 against `kStrikeLevel` 0.6, by the mode's own share and how hard the key was played.
    expect(bellRubLevel(1, 0, 1, 1)).toBeCloseTo((0.6 * 0.4) / 0.6, 6)
    expect(bellRubLevel(1, 0, 0, 0.5)).toBeCloseTo((0.6 * 0.4 * 0.5 * 0.25) / 0.6, 6)
    expect(bellRubLevel(1, 6, 1, 1)).toBe(0)
  })

  it('tilt and place each mode as `ModalBells::gains` does', () => {
    expect(bellTilt(4, 0.5)).toBe(1)
    expect(bellTilt(4, 1)).toBeCloseTo(Math.pow(4, 0.75), 6)
    expect(bellTilt(4, 0)).toBeCloseTo(Math.pow(4, -0.75), 6)
    // The near half of a pair stays in the middle; the far halves go past a side, pair by pair to alternate sides.
    expect(bellPan(1, 0, 1)).toBe(0)
    expect(bellPan(1, 1, 1)).toBeCloseTo(-1.6, 6)
    expect(bellPan(1, 3, 1)).toBeCloseTo(1.6, 6)
    expect(bellPan(1, 5, 0.5)).toBeCloseTo(-0.8, 6)
    // A single mode goes a little to one side, then the other.
    expect(bellPan(0, 6, 1)).toBeCloseTo(-0.8, 6)
    expect(bellPan(0, 9, 1)).toBeCloseTo(0.8, 6)
    expect(bellPan(0, 9, 0)).toBeCloseTo(0, 6)
  })

  it('ring down, hold under the rub and choke at key up as `ModalBells::control` has them', () => {
    expect(bellModeSize(0.5, 0, 2, null, 4, Infinity)).toBeCloseTo(0.5 * Math.pow(10, -1.5), 8)
    expect(bellModeSize(0.5, 0, 2, 1, 4, 0.1)).toBeCloseTo(0.5 * Math.pow(10, -0.75 - 30), 12)
    // Over its rub level it rings down to it and is held there.
    expect(bellModeSize(0.6, 0.4, 0.1, null, 4, Infinity)).toBeCloseTo(
      0.6 * Math.pow(10, -0.075),
      6,
    )
    expect(bellModeSize(0.6, 0.4, 30, null, 4, Infinity)).toBeCloseTo(0.4, 6)
    // Under a fifth of it, it grows four times itself in 0.3 s; from there it closes on it over 0.3 s.
    expect(bellModeSize(0.01, 0.4, 0.1, null, 4, Infinity)).toBeCloseTo(0.01 * Math.exp(4 / 3), 6)
    expect(bellModeSize(0.1, 0.4, 0.3, null, 4, Infinity)).toBeCloseTo(0.4 - 0.3 / Math.E, 6)
    expect(bellModeSize(0.01, 0.4, 30, null, 4, Infinity)).toBeCloseTo(0.4, 5)
    // Let go, it is rubbed no more.
    expect(bellModeSize(0.01, 0.4, 32, 2, 4, Infinity)).toBeCloseTo(0.4 * Math.pow(10, -1.5), 6)
  })
})

describe('the bells’ display', () => {
  const { display } = BARS_INSTRUMENT_FACES['modal-bells']
  const params = paramsOf('modal-bells')
  const run = (values: Record<string, number>, notes: DisplayNote[]) =>
    runDisplay(display, params, 0.1, { values, notes })
  /** The lights on the modes: each a spike of four corners filled in the accent, in the order of the modes. */
  const lights = (drawn: RecordingContext): DrawnPath[] =>
    accentPaths(drawn).filter((path) => path.kind === 'fill' && path.points.length === 4)
  /** How high a light reaches above its foot, in px. */
  const reach = (path: DrawnPath): number => {
    const ys = path.points.map(([, y]) => y)
    return Math.max(...ys) - Math.min(...ys)
  }

  it('lights nothing at rest, and the modes a strike wakes when a note is struck', () => {
    expect(accentPaths(drawDisplay(display, params))).toHaveLength(0)
    expect(accentPaths(run({}, []))).toHaveLength(0)
    expect(lights(run({}, [note(C4, 0.05)])).length).toBeGreaterThan(3)
  })

  it('lets each mode die at its own rate, the high ones first, and all by the end of Decay', () => {
    const values = { decay: 4, damping: 0.8, hardness: 1 }
    const early = lights(run(values, [note(C4, 0.05)]))
    const later = lights(run(values, [note(C4, 1)]))
    const late = lights(run(values, [note(C4, 3)]))
    expect(later.length).toBeLessThan(early.length)
    expect(late.length).toBeLessThan(later.length)
    expect(late.length).toBeGreaterThan(0)
    // The lowest pair is the last to go; its light has run most of the way down.
    expect(reach(late[0])).toBeLessThan(reach(early[0]) * 0.5)
    expect(lights(run(values, [note(C4, 4.1)]))).toHaveLength(0)
  })

  it('chokes a note that is let go by Release, and leaves it ringing with none', () => {
    const letGo = [note(C4, 1, 0.5)]
    expect(lights(run({ release: 0 }, letGo)).length).toBeGreaterThan(0)
    expect(lights(run({ release: 1 }, letGo))).toHaveLength(0)
  })

  it('holds the low modes of a held note while it is rubbed', () => {
    const held = [note(C4, 30)]
    expect(lights(run({ sustain: 0 }, held))).toHaveLength(0)
    expect(lights(run({ sustain: 1 }, held)).length).toBeGreaterThan(0)
    // Let go half a minute ago, the rubbing is over and the ring with it.
    expect(lights(run({ sustain: 1, release: 0 }, [note(C4, 60, 30)]))).toHaveLength(0)
  })

  it('beats a pair as often as Detune sets its halves apart', () => {
    // The bowl's first pair is 1 Hz apart at Detune 1: against each other half a second on, together a second on.
    const apart = lights(run({ detune: 1 }, [note(C4, 0.5)]))[0]
    const together = lights(run({ detune: 1 }, [note(C4, 1)]))[0]
    expect(reach(apart)).toBeLessThan(reach(together))
    // With no Detune it only rings down.
    const still = (age: number) => reach(lights(run({ detune: 0 }, [note(C4, age)]))[0])
    expect(still(0.5)).toBeGreaterThan(still(1))
  })

  it('wakes fewer modes with a softer mallet, and none with a node where the mallet lands', () => {
    const struck = [note(C4, 0.02)]
    const soft = lights(run({ material: 3, hardness: 0 }, struck))
    const hard = lights(run({ material: 3, hardness: 1 }, struck))
    expect(soft.length).toBeLessThan(hard.length)
    // The middle of a free bar is a node of every second mode.
    const middle = lights(run({ material: 3, hardness: 1, position: 1 }, struck))
    expect(middle.length).toBeLessThan(hard.length)
    expect(middle.length).toBeGreaterThan(0)
  })

  it('says what is struck, and how long its lowest mode rings', () => {
    expect(drawDisplay(display, params).words()).toEqual(
      expect.arrayContaining(['Singing bowl', '12 s']),
    )
    expect(drawDisplay(display, params, { values: { material: 6 } }).words()).toContain('Gong')
    expect(run({}, [note(A4, 0.2)]).words()).toContain('A4 12 s')
  })

  it('stands its handle on the lowest mode’s top, and a drag sets Decay', () => {
    const settings: Record<string, number>[] = [
      {},
      { material: 0, decay: 1.5 },
      { material: 6, decay: 30, spread: 1 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [decay] = display.handles?.(view) ?? []
      expect(decay.drag(decay.x, decay.y).decay).toBeCloseTo(view.value('decay'), 3)
      expect(decay.drag(decay.x, decay.y - 6).decay).toBeGreaterThan(view.value('decay'))
    }
  })
})
