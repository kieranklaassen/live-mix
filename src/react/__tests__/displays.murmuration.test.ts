// What Murmuration's display shows, held to the device. The display flies the
// flock itself, from `flock.h` copied into `displays/murmuration.ts`, and
// takes only the flight time from the device. So the copy is held three ways:
// to numbers printed from flock.h, to the compiled device (an impulse returns
// at the delay and the side a dot is drawn at, a tone at the level a dot's
// strength says, the reading runs at the rate the display counts on with),
// and the picture to the copy (every dot, mark and handle where it says).

import { describe, expect, it } from 'vitest'

import { MURMURATION_PARAMS } from '../../dsp/devices/murmuration.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import {
  FLOCK,
  MURMURATION_FACES,
  birdDelaySec,
  birdLoudness,
  birdPan,
  delayText,
  edgeShare,
  flightRate,
  flockChance,
  flockFlight,
  flockPlace,
  flockSize,
  followFlight,
  rangeOfShare,
  skyOf,
  skyPlace,
  skyPoint,
  togetherOfSize,
  wheelAmount,
  type MurmurationState,
} from '../components/displays/murmuration'
import { type DisplayHandle } from '../components/plate-display'
import { drawDisplay, runDisplay, viewOf, type RecordingContext } from './display-harness'

const RATE = 48000
const PARAMS = MURMURATION_PARAMS
const { display } = MURMURATION_FACES.murmuration

/** The two shapes a plate gives the display: beside two columns of knobs, and on the upright plate. */
const SHAPES: readonly (readonly [number, number])[] = [
  [128, 100],
  [204, 100],
]

type Values = Readonly<Record<string, number>>

const valueOf = (values: Values, name: keyof typeof PARAMS): number =>
  values[name] ?? PARAMS[name].default

/** A filled circle as the display drew it. */
interface Dot {
  x: number
  y: number
  radius: number
  colour: string
  alpha: number
}

function dotsOf(drawn: RecordingContext): Dot[] {
  const dots: Dot[] = []
  let arc: readonly unknown[] | null = null
  let colour = ''
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') arc = null
    else if (call.name === 'arc') arc = call.args
    else if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    else if (call.name === 'fill' && arc) {
      dots.push({ x: Number(arc[0]), y: Number(arc[1]), radius: Number(arc[2]), colour, alpha })
      arc = null
    }
  }
  return dots
}

/** The birds of a drawing: the dots in the accent (the handles are in the plate's colour, the listener in the ink). */
const birdsOf = (drawn: RecordingContext): Dot[] =>
  dotsOf(drawn).filter((dot) => dot.colour === PLAIN_COLOURS.accent)

/** Where the display should have a bird, from the copy of flock.h. */
function expectedDot(
  bird: number,
  tau: number,
  values: Values,
  width: number,
  height: number,
): { x: number; y: number; u: number } {
  const sky = skyOf({ width, height })
  const range = valueOf(values, 'range')
  const edge = edgeShare(range, PARAMS.range.min, PARAMS.range.max)
  const flight = flockFlight(tau, valueOf(values, 'together'), valueOf(values, 'turns'))
  const place = flockPlace(bird, tau, flight)
  const [x, y] = skyPoint(sky, edge, place.u, place.v * valueOf(values, 'spread'))
  return { x, y, u: place.u }
}

function expectFlockAt(
  drawn: RecordingContext,
  tau: number,
  values: Values,
  width: number,
  height: number,
  what: string,
): void {
  const birds = birdsOf(drawn)
  const count = Math.round(valueOf(values, 'birds'))
  expect(birds.length, `${what}: one dot a bird`).toBe(count)
  for (let bird = 0; bird < count; bird++) {
    const said = expectedDot(bird, tau, values, width, height)
    const near = birds.filter(
      (dot) => Math.abs(dot.x - said.x) < 0.01 && Math.abs(dot.y - said.y) < 0.01,
    )
    expect(near.length, `${what}: bird ${bird} at ${said.x.toFixed(2)}, ${said.y.toFixed(2)}`).toBe(
      1,
    )
  }
}

function set(device: WasmDeviceHarness, values: Values): void {
  for (const [name, value] of Object.entries(values))
    device.set(PARAMS[name as keyof typeof PARAMS], value)
}

function meter(device: WasmDeviceHarness): number {
  const read = device.device.device_meter
  if (!read) throw new Error('the device reports no readings')
  return read(0)
}

/** Both sides of the device over `frames` of an input given sample by sample, in blocks of 128. */
function render(
  device: WasmDeviceHarness,
  frames: number,
  input: (n: number) => number,
): { left: Float32Array; right: Float32Array } {
  const left = new Float32Array(frames)
  const right = new Float32Array(frames)
  const block = new Float32Array(128)
  for (let done = 0; done < frames; done += 128) {
    for (let i = 0; i < 128; i++) block[i] = input(done + i)
    device.processBlock(block)
    left.set(device.view(device.device.device_out_left(), 128), done)
    right.set(device.view(device.device.device_out_right(), 128), done)
  }
  return { left, right }
}

describe('murmuration: the flight is flock.h', () => {
  // Printed from flock.h itself (flock::flight and flock::place), which reads
  // its sines from the kit's table: hence two thousandths, not nothing.
  const PRINTED = [
    {
      tau: 0,
      together: 0.6,
      turns: 0.3,
      bird: 0,
      flight: [0.662, 0.22352, 0.31274, 0, 0],
      place: [0.64209, 0.13523, 0.97553],
    },
    {
      tau: 3.7,
      together: 0,
      turns: 0,
      bird: 3,
      flight: [0.71709, 0.33577, 1, 0.23125, 0],
      place: [0.41454, 0.22926, 0.98912],
    },
    {
      tau: 12,
      together: 1,
      turns: 1,
      bird: 7,
      flight: [0.84145, -0.09293, 0.032, 0.25, 1],
      place: [0.83814, -0.0999, 0.15737],
    },
    {
      tau: 100.25,
      together: 0.3,
      turns: 1,
      bird: 15,
      flight: [0.62829, -0.65798, 0.25109, 6.76082, 0.99039],
      place: [0.48739, -0.4801, 0.99872],
    },
    {
      tau: 777.5,
      together: 0.6,
      turns: 0.5,
      bird: 9,
      flight: [0.40213, -0.09022, 0.25483, 48.74808, 0.30866],
      place: [0.4473, 0.0911, 0.9884],
    },
    {
      tau: 1023.9,
      together: 0.85,
      turns: 0.2,
      bird: 12,
      flight: [0.66761, 0.22527, 0.13337, 63.99425, 0.001],
      place: [0.60541, 0.14491, 0.13838],
    },
  ] as const

  it('flies the centre, the size, the turn and each bird as flock.h does', () => {
    for (const row of PRINTED) {
      const flight = flockFlight(row.tau, row.together, row.turns)
      const got = [flight.u, flight.v, flight.size, flight.twist, flight.wheel]
      got.forEach((value, index) =>
        expect(
          Math.abs(value - row.flight[index]),
          `flight at ${row.tau}, part ${index}: ${value} against ${row.flight[index]}`,
        ).toBeLessThan(2e-3),
      )
      const place = flockPlace(row.bird, row.tau, flight)
      ;[place.u, place.v, place.h].forEach((value, index) =>
        expect(
          Math.abs(value - row.place[index]),
          `bird ${row.bird} at ${row.tau}, part ${index}: ${value} against ${row.place[index]}`,
        ).toBeLessThan(2e-3),
      )
    }
  })

  it('draws the same lots for the wheels: flock::chance, slot by slot', () => {
    // flock::chance(slot, 0x51 / 0xA7 / 0x3D / 0xC9), printed.
    const printed: readonly (readonly number[])[] = [
      [0, 0.358909, 0.042731, 0.419233, 0.529879],
      [1, 0.004658, 0.979416, 0.423777, 0.043483],
      [2, 0.64048, 0.542836, 0.960731, 0.835771],
      [5, 0.515433, 0.089579, 0.269941, 0.839527],
      [64, 0.945138, 0.657793, 0.4677, 0.529004],
      [127, 0.132653, 0.696931, 0.075178, 0.639573],
    ]
    for (const [slot, ...lots] of printed) {
      ;[0x51, 0xa7, 0x3d, 0xc9].forEach((salt, index) =>
        expect(flockChance(slot, salt), `slot ${slot}, salt ${salt}`).toBeCloseTo(lots[index], 6),
      )
    }
    // Turns picks the slots under it, and a slot comes in over kTurnsEdge of the knob.
    expect(wheelAmount(1, 0.3)).toBe(1)
    expect(wheelAmount(0, 0.3)).toBe(0)
    expect(wheelAmount(0, 0.36)).toBeCloseTo((1.15 * 0.36 - 0.358909) / 0.15, 5)
    expect(wheelAmount(64, 1)).toBe(1)
    expect(wheelAmount(1, 0)).toBe(0)
    expect(wheelAmount(-127, 0.3), 'a slot before the wrap is the one after it').toBe(1)
  })

  it('turns a place into sound as flock.h does', () => {
    // flight_rate, delay_seconds, loudness, pan and size_of, printed.
    expect(flightRate(4, 60)).toBeCloseTo(2.00409, 5)
    expect(flightRate(1, 10)).toBe(1)
    expect(birdDelaySec(10, 0.5)).toBeCloseTo(0.01639942, 7)
    expect(birdLoudness(0.2, 0.7)).toBeCloseTo(1.429862, 5)
    expect(birdLoudness(1, 1)).toBeCloseTo(0.5, 6)
    expect(birdLoudness(3 / 7, 1), 'the bird that is as loud as the voice').toBeCloseTo(1, 6)
    expect(birdPan(0.5, 0.8)).toBeCloseTo(0.587785, 4)
    expect(flockSize(0.6)).toBeCloseTo(0.312744, 5)
    for (const together of [0, 0.25, 0.6, 0.9, 1])
      expect(togetherOfSize(flockSize(together))).toBeCloseTo(together, 9)
    // The constants, as flock.h has them.
    expect(FLOCK.period / FLOCK.slotSeconds).toBe(FLOCK.slots)
    expect(FLOCK.maxRadialSpeed).toBe(0.5 * FLOCK.soundSpeed)
  })
})

describe('murmuration: the display against the compiled device', () => {
  it('draws each bird where the device returns it: as far out as it is late, on the side it is heard', async () => {
    // Eight birds scattered over sixty metres, hardly moving: eight returns that stand apart.
    const values = {
      birds: 8,
      range: 60,
      speed: 0.05,
      together: 0,
      turns: 0,
      air: 0,
      lift: 0,
      spread: 0.7,
      mix: 1,
    }
    const device = await loadWasmDevice('murmuration', RATE)
    set(device, values)
    const { left, right } = render(device, 9600, (n) => (n === 0 ? 0.5 : 0))
    const rate = flightRate(values.speed, values.range)

    // When each bird's return is due: the delay of where it is when it is heard.
    const due: number[] = []
    for (let bird = 0; bird < values.birds; bird++) {
      let at = 0
      for (let pass = 0; pass < 4; pass++) {
        const tau = (rate * at) / RATE
        const place = flockPlace(bird, tau, flockFlight(tau, values.together, values.turns))
        at = birdDelaySec(values.range, place.u) * RATE
      }
      due.push(at)
    }
    const sorted = [...due].sort((a, b) => a - b)
    for (let i = 1; i < sorted.length; i++)
      expect(sorted[i] - sorted[i - 1], 'the returns stand apart').toBeGreaterThan(11)

    const [width, height] = SHAPES[0]
    const sky = skyOf({ width, height })
    const edge = edgeShare(values.range, PARAMS.range.min, PARAMS.range.max)
    for (let bird = 0; bird < values.birds; bird++) {
      // The device: when the return comes and how it lies between the sides.
      const from = Math.round(due[bird]) - 4
      let sumLeft = 0
      let sumRight = 0
      let weight = 0
      let moment = 0
      for (let n = from; n <= from + 10; n++) {
        sumLeft += left[n]
        sumRight += right[n]
        const energy = left[n] * left[n] + right[n] * right[n]
        weight += energy
        moment += energy * n
      }
      const heardAt = moment / weight
      const heardTurn = Math.atan2(sumRight, sumLeft)
      // murmuration.h: eight birds, each 1 / sqrt(8) of the impulse, kAhead up, split by cos and sin.
      expect(Math.hypot(sumLeft, sumRight) / 0.5, `bird ${bird}: its share`).toBeCloseTo(0.5, 1)

      // The display at that moment of the flight: one of its dots is this return.
      const tau = (rate * due[bird]) / RATE
      const drawn = drawDisplay(display, PARAMS, { values, meters: { flight: tau }, width, height })
      const dots = birdsOf(drawn)
      expect(dots.length).toBe(values.birds)
      const read = dots.map((dot) => {
        const { out, side } = skyPlace(sky, dot.x, dot.y)
        const depth = (out / edge - FLOCK.nearShare) / (1 - FLOCK.nearShare)
        return {
          samples: birdDelaySec(values.range, depth) * RATE,
          // The side as the device pans it: a quarter of a turn of the pan law at the far right.
          turn: ((Math.sin((side * Math.PI) / 2) + 1) * Math.PI) / 4,
        }
      })
      const same = read.filter(
        (dot) => Math.abs(dot.samples - heardAt) < 1.5 && Math.abs(dot.turn - heardTurn) < 0.03,
      )
      expect(
        same.length,
        `bird ${bird}: a dot at ${heardAt.toFixed(1)} samples, ${heardTurn.toFixed(3)} round`,
      ).toBe(1)
    }
  })

  it('counts the flight on at the rate the device flies: Speed, held back over a long Range, in silence too', async () => {
    for (const values of [
      { speed: 1, range: 10 },
      { speed: 0.25, range: 10 },
      { speed: 4, range: 60 },
    ]) {
      const device = await loadWasmDevice('murmuration', RATE)
      set(device, values)
      const rate = flightRate(values.speed, values.range)
      let seed = 1
      render(device, RATE, () => {
        seed = (seed * 1664525 + 1013904223) >>> 0
        return 0.2 * (seed / 2147483648 - 1)
      })
      expect(
        meter(device),
        `Speed ${values.speed}, Range ${values.range}: a second of sound`,
      ).toBeCloseTo(rate, 4)
      render(device, 2 * RATE, () => 0)
      expect(
        meter(device),
        `Speed ${values.speed}, Range ${values.range}: two of silence`,
      ).toBeCloseTo(3 * rate, 4)
    }
  })

  it('draws a bird as strong as the device plays it: one bird on a tone, by Air', async () => {
    const values = {
      birds: 1,
      range: 10,
      together: 1,
      turns: 0,
      air: 1,
      lift: 0,
      spread: 0,
      mix: 1,
    }
    const device = await loadWasmDevice('murmuration', RATE)
    set(device, values)
    const tone = (n: number): number => 0.25 * Math.sin((2 * Math.PI * 220 * n) / RATE)
    const levels: number[] = []
    const strengths: number[] = []
    let done = 0
    // Two wheels of the path apart, where the bird is near and where it is far.
    for (const seconds of [1, 4, 7.5, 12]) {
      const frames = Math.round((seconds * RATE) / 128) * 128 - done
      const { left } = render(device, frames, (n) => tone(done + n))
      done += frames
      let peak = 0
      for (let n = frames - 240; n < frames; n++) peak = Math.max(peak, Math.abs(left[n]))
      const tau = meter(device)
      const place = flockPlace(0, tau, flockFlight(tau, values.together, values.turns))
      // Straight ahead a bird is the voice's own level on each side, times its loudness.
      const said = 0.25 * birdLoudness(place.u, values.air)
      expect(Math.abs(peak / said - 1), `at ${seconds} s: ${peak} against ${said}`).toBeLessThan(
        0.05,
      )
      levels.push(peak)
      const dots = birdsOf(drawDisplay(display, PARAMS, { values, meters: { flight: tau } }))
      expect(dots.length).toBe(1)
      strengths.push(dots[0].alpha)
      // The dot's strength is that loudness against the nearest bird's, from 0.45 up.
      expect(dots[0].alpha).toBeCloseTo(
        0.45 + 0.55 * (birdLoudness(place.u, values.air) / birdLoudness(0, values.air)),
        6,
      )
    }
    expect(Math.max(...levels) / Math.min(...levels), 'the bird came and went').toBeGreaterThan(1.3)
    // Louder is stronger, in the same order.
    const byLevel = levels.map((_, i) => i).sort((a, b) => levels[a] - levels[b])
    const byStrength = strengths.map((_, i) => i).sort((a, b) => strengths[a] - strengths[b])
    expect(byStrength).toEqual(byLevel)
  })
})

describe('murmuration: the picture', () => {
  it('draws every bird where the flight has it, in both shapes and at any setting', () => {
    const settings: Values[] = [
      {},
      { birds: 16, together: 0, spread: 1, range: 60 },
      { birds: 1, together: 1, spread: 0, range: 1 },
      { birds: 12, turns: 1, together: 0.3, spread: 0.5, range: 25 },
    ]
    for (const [width, height] of [...SHAPES, [293, 100] as const]) {
      for (const values of settings) {
        for (const tau of [0, 12, 37.5, 500.2, 1023.99]) {
          const drawn = drawDisplay(display, PARAMS, {
            values,
            meters: { flight: tau },
            width,
            height,
          })
          const what = `${width} by ${height}, ${JSON.stringify(values)}, at ${tau}`
          expectFlockAt(drawn, tau, values, width, height, what)
          for (const dot of dotsOf(drawn)) {
            expect(dot.x - dot.radius, `${what}: inside on the left`).toBeGreaterThanOrEqual(0)
            expect(dot.x + dot.radius, `${what}: inside on the right`).toBeLessThanOrEqual(width)
            expect(dot.y - dot.radius, `${what}: inside at the top`).toBeGreaterThanOrEqual(0)
            expect(dot.y + dot.radius, `${what}: inside at the foot`).toBeLessThanOrEqual(height)
          }
        }
      }
    }
  })

  it('uses the height it is given: on the narrow plate the sky is deeper than it is wide', () => {
    const narrow = skyOf({ width: 128, height: 100 })
    expect([narrow.rx, narrow.ry]).toEqual([56, 84])
    const wide = skyOf({ width: 204, height: 100 })
    expect([wide.rx, wide.ry]).toEqual([84, 84])
    // The far edge at the most Range is the rim; at the least it is still over half of it.
    expect(edgeShare(60, 1, 60)).toBeCloseTo(1, 9)
    expect(edgeShare(1, 1, 60)).toBeCloseTo(0.55, 9)
    for (const range of [1, 3.5, 10, 60])
      expect(rangeOfShare(edgeShare(range, 1, 60), 1, 60)).toBeCloseTo(range, 9)
    // A place and its pixel, there and back.
    const [x, y] = skyPoint(narrow, 0.8, 0.4, -0.6)
    const back = skyPlace(narrow, x, y)
    expect(back.out).toBeCloseTo(0.8 * (0.125 + 0.875 * 0.4), 9)
    expect(back.side).toBeCloseTo(-0.6, 9)
  })

  it('draws a near bird bigger than a far one', () => {
    const values = { birds: 16, together: 0 }
    const tau = 20
    const [width, height] = SHAPES[1]
    const dots = birdsOf(
      drawDisplay(display, PARAMS, { values, meters: { flight: tau }, width, height }),
    )
    for (let bird = 0; bird < 16; bird++) {
      const said = expectedDot(bird, tau, values, width, height)
      const dot = dots.find((d) => Math.abs(d.x - said.x) < 0.01 && Math.abs(d.y - said.y) < 0.01)
      expect(dot?.radius, `bird ${bird} at depth ${said.u}`).toBeCloseTo(3 - 1.7 * said.u, 6)
    }
  })

  it('shows Air only where there is Air: at none every bird is as strong as the next', () => {
    const still = birdsOf(
      drawDisplay(display, PARAMS, { values: { air: 0, mix: 1 }, meters: { flight: 9 } }),
    )
    expect(new Set(still.map((dot) => dot.alpha.toFixed(6))).size).toBe(1)
    expect(still[0].alpha).toBeCloseTo(1, 9)
    const aired = birdsOf(
      drawDisplay(display, PARAMS, { values: { air: 1, mix: 1 }, meters: { flight: 9 } }),
    )
    expect(new Set(aired.map((dot) => dot.alpha.toFixed(6))).size).toBeGreaterThan(4)
  })

  it('draws in the accent only what Mix lets be heard, and still shows the flock at Mix 0', () => {
    const dry = drawDisplay(display, PARAMS, {
      values: { mix: 0, turns: 0.3 },
      meters: { flight: 12 },
    })
    expect(birdsOf(dry)).toEqual([])
    const accents = dry.calls.filter(
      (call) =>
        (call.name === 'set fillStyle' || call.name === 'set strokeStyle') &&
        call.args[0] === PLAIN_COLOURS.accent,
    )
    expect(accents, 'nothing in the accent at Mix 0').toEqual([])
    // The birds are there, in the ink: eight of them and the listener.
    const inked = dotsOf(dry).filter((dot) => dot.colour === PLAIN_COLOURS.ink)
    expect(inked.length).toBe(PARAMS.birds.default + 1)
    // More Mix, stronger birds.
    const strength = (mix: number): number =>
      birdsOf(drawDisplay(display, PARAMS, { values: { mix, air: 0 }, meters: { flight: 12 } }))[0]
        .alpha
    expect(strength(1)).toBeGreaterThan(strength(0.5))
    expect(strength(0.5)).toBeGreaterThan(strength(0.1))
  })

  it('says the delay at the far edge, and marks the wheels to come', () => {
    expect(delayText(10 / 343)).toBe('29 ms')
    expect(delayText(60 / 343)).toBe('175 ms')
    expect(delayText(1 / 343)).toBe('2.9 ms')
    expect(delayText(0.003)).toBe('3 ms')
    for (const [range, words] of [
      [10, '29 ms'],
      [60, '175 ms'],
      [1, '2.9 ms'],
    ] as const) {
      const drawn = drawDisplay(display, PARAMS, { values: { range }, meters: { flight: 3 } })
      expect(drawn.words()).toEqual([words])
    }

    // The row of marks: eight slots from this one on, a tall mark a whole wheel (1 + 6 of it).
    const marks = (values: Values, tau: number) =>
      drawDisplay(display, PARAMS, { values, meters: { flight: tau } })
        .calls.filter((call) => call.name === 'fillRect' && call.args[2] === 2)
        .map((call) => Number(call.args[3]))
    expect(marks({ turns: 0 }, 3)).toEqual([1, 1, 1, 1, 1, 1, 1, 1])
    expect(marks({ turns: 1 }, 3)).toEqual([7, 7, 7, 7, 7, 7, 7, 7])
    const slot = 40
    const tau = slot * FLOCK.slotSeconds + 1
    expect(marks({ turns: 0.4 }, tau)).toEqual(
      Array.from({ length: 8 }, (_, ahead) => 1 + Math.round(6 * wheelAmount(slot + ahead, 0.4))),
    )
    // In the middle of a wheel (slot 1 is one at any Turns over a hundredth) this slot's mark is in the accent.
    const wheeling = drawDisplay(display, PARAMS, {
      values: { turns: 0.3 },
      meters: { flight: 12 },
    })
    const first = wheeling.calls.findIndex((call) => call.name === 'fillRect' && call.args[2] === 2)
    const before = wheeling.calls.slice(0, first).reverse()
    expect(before.find((call) => call.name === 'set fillStyle')?.args[0]).toBe(PLAIN_COLOURS.accent)
    expect(flockFlight(12, 0.6, 0.3).wheel).toBeCloseTo(1, 6)
  })

  it('follows the reading while it runs, and stands when the reading stands', () => {
    const values = { speed: 2 }
    const fps = 30
    const seconds = 1
    const last = (Math.round(seconds * fps) - 1) / fps
    const running = runDisplay(display, PARAMS, seconds, { values }, (time) => ({
      meters: { flight: 5 + 2 * time },
    }))
    const [width, height] = SHAPES[0]
    expectFlockAt(running, 5 + 2 * last, values, width, height, 'running')

    // A device that is not being run reports the same time again and again: the flock stands there.
    const stood = runDisplay(display, PARAMS, seconds, { values, meters: { flight: 5 } })
    expectFlockAt(stood, 5, values, width, height, 'standing')

    // Switched off it does not move on, whatever the clock says.
    const state = display.init?.()
    drawDisplay(display, PARAMS, { values, meters: { flight: 5 }, state, dt: 0 })
    drawDisplay(display, PARAMS, { values, meters: { flight: 5.1 }, state, dt: 1 / fps })
    const off = drawDisplay(display, PARAMS, {
      values,
      meters: { flight: 9 },
      state,
      dt: 1 / fps,
      powered: false,
    })
    expectFlockAt(off, 5.1, values, width, height, 'switched off')
  })

  it('counts between readings, gives way to a reading that is elsewhere, and crosses the wrap', () => {
    const state: MurmurationState = { tau: null, reading: 0, stood: 0 }
    expect(followFlight(state, 10, 1, 0)).toBe(10)
    // The same reading on the next frame: counted on at the rate of the flight.
    expect(followFlight(state, 10, 1.5, 1 / 60)).toBeCloseTo(10 + 1.5 / 60, 9)
    // A reading near where it counted to pulls it half the way.
    const counted = 10 + 1.5 / 60 + 1.5 / 60
    expect(followFlight(state, counted + 0.02, 1.5, 1 / 60)).toBeCloseTo(counted + 0.01, 9)
    // One far off (a preset, a new device) is taken at once.
    expect(followFlight(state, 400, 1.5, 1 / 60)).toBe(400)
    // Standing for 0.15 s it is the reading itself.
    let now = 0
    for (let frame = 0; frame < 6; frame++) now = followFlight(state, 400, 1.5, 1 / 30)
    expect(now).toBe(400)
    // Over the end of the period the flight goes on from nought.
    const wrap: MurmurationState = { tau: null, reading: 0, stood: 0 }
    followFlight(wrap, FLOCK.period - 0.01, 1, 0)
    const over = followFlight(wrap, 0.02, 1, 1 / 30)
    expect(over).toBeGreaterThanOrEqual(0)
    expect(over).toBeLessThan(0.05)
  })
})

describe('murmuration: the points to drag', () => {
  const handlesAt = (values: Values, width: number, height: number): readonly DisplayHandle[] =>
    display.handles?.(viewOf(display, PARAMS, { values, width, height })) ?? []
  const named = (handles: readonly DisplayHandle[], key: string): DisplayHandle => {
    const found = handles.find((handle) => handle.key === key)
    if (!found) throw new Error(`no handle ${key}`)
    return found
  }

  it('Range and Spread: the point stands at the far right corner of the sky, and dragged there the two are that', () => {
    for (const [width, height] of SHAPES) {
      const sky = skyOf({ width, height })
      for (const values of [
        {},
        { range: 1, spread: 0 },
        { range: 60, spread: 1 },
        { range: 4, spread: 0.3 },
      ] as Values[]) {
        const range = valueOf(values, 'range')
        const spread = valueOf(values, 'spread')
        const corner = named(handlesAt(values, width, height), 'range')
        const [x, y] = skyPoint(sky, edgeShare(range, 1, 60), 1, spread)
        expect(corner.x).toBeCloseTo(x, 9)
        expect(corner.y).toBeCloseTo(y, 9)
        // Taken and not moved: exactly what they were.
        expect(corner.drag(corner.x, corner.y)).toEqual({ range, spread })
        for (const [toRange, toSpread] of [
          [1, 0],
          [2.5, 0.2],
          [10, 0.8],
          [33, 0.55],
          [60, 1],
        ]) {
          const [toX, toY] = skyPoint(sky, edgeShare(toRange, 1, 60), 1, toSpread)
          const set = corner.drag(toX, toY)
          expect(set.range / toRange, `${width} wide: Range ${toRange}`).toBeCloseTo(1, 6)
          expect(set.spread, `${width} wide: Spread ${toSpread}`).toBeCloseTo(toSpread, 6)
          // And the point then stands where it was dragged to.
          const moved = named(handlesAt({ ...values, ...set }, width, height), 'range')
          expect(moved.x).toBeCloseTo(toX, 6)
          expect(moved.y).toBeCloseTo(toY, 6)
        }
        // Past the picture it stops at the ends of the knobs.
        expect(corner.drag(sky.cx, sky.cy - 3 * sky.ry)).toEqual({ range: 60, spread: 0 })
        expect(corner.drag(sky.cx + 0.1, sky.cy).range).toBe(1)
        expect(corner.drag(sky.cx - 0.6 * sky.rx, sky.cy - 0.6 * sky.ry).spread).toBe(0)
        expect(corner.drag(sky.cx + 0.5 * sky.rx, sky.cy + 20).spread).toBe(1)
        expect(corner.reset?.()).toEqual({
          range: PARAMS.range.default,
          spread: PARAMS.spread.default,
        })
      }
    }
  })

  it('Together: the point stands as deep into the range as the flock is, and dragged along the range sets that', () => {
    for (const [width, height] of SHAPES) {
      const sky = skyOf({ width, height })
      for (const values of [
        {},
        { together: 0, spread: 1, range: 60 },
        { together: 1, spread: 0, range: 1 },
      ] as Values[]) {
        const together = valueOf(values, 'together')
        const spread = valueOf(values, 'spread')
        const edge = edgeShare(valueOf(values, 'range'), 1, 60)
        // On the fan's left edge, or a little left of straight ahead when the fan is closed.
        const side = -Math.max(0.14, spread)
        const knot = named(handlesAt(values, width, height), 'together')
        const [x, y] = skyPoint(sky, edge, flockSize(together), side)
        expect(knot.x).toBeCloseTo(x, 9)
        expect(knot.y).toBeCloseTo(y, 9)
        expect(knot.drag(knot.x, knot.y)).toEqual({ together })
        for (const to of [0, 0.2, 0.6, 0.9, 1]) {
          const [toX, toY] = skyPoint(sky, edge, flockSize(to), side)
          const set = knot.drag(toX, toY)
          expect(set.together, `${width} wide: Together ${to}`).toBeCloseTo(to, 6)
          const moved = named(handlesAt({ ...values, ...set }, width, height), 'together')
          expect(moved.x).toBeCloseTo(toX, 6)
          expect(moved.y).toBeCloseTo(toY, 6)
        }
        // At the listener the flock is as tight as it goes; past the far edge, scattered.
        expect(knot.drag(sky.cx, sky.cy).together).toBe(1)
        expect(knot.drag(sky.cx, sky.cy - 4 * sky.ry).together).toBe(0)
        expect(knot.reset?.()).toEqual({ together: PARAMS.together.default })
      }
    }
  })

  it('keeps the two points apart and on the display, the fan closed and the flock scattered too', () => {
    for (const [width, height] of SHAPES) {
      for (const range of [1, 10, 60]) {
        for (const spread of [0, 0.1, 0.5, 1]) {
          for (const together of [0, 0.5, 1]) {
            const [knot, corner] = handlesAt({ range, spread, together }, width, height)
            const what = `${width} wide, Range ${range}, Spread ${spread}, Together ${together}`
            for (const handle of [knot, corner]) {
              expect(handle.x, what).toBeGreaterThanOrEqual(4)
              expect(handle.x, what).toBeLessThanOrEqual(width - 4)
              expect(handle.y, what).toBeGreaterThanOrEqual(4)
              expect(handle.y, what).toBeLessThanOrEqual(height - 4)
            }
            expect(Math.hypot(knot.x - corner.x, knot.y - corner.y), what).toBeGreaterThan(5)
          }
        }
      }
    }
  })

  it('stands with Birds, Speed, Turns and Mix: the four the display has no point for', () => {
    expect(MURMURATION_FACES.murmuration.face).toEqual(['birds', 'speed', 'turns', 'mix'])
    expect(display.place).toBe('window')
    expect(display.live?.meters).toBe(true)
  })
})
