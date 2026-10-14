import { describe, expect, it } from 'vitest'

import {
  KIND_SLOTS,
  MAP_H,
  MAP_W,
  SPECTRUM_BANDS,
  frameOf,
  knobNow,
  presenceOf,
  quietSignals,
  sampleFrame,
  sourceNow,
  type VisualSignals,
} from '../frame'
import { DEFAULT_GRAIN, VISUAL_SOURCES, firstKnobs, type Visual, type VisualSet } from '../model'
import { DEFAULT_PALETTE, visualPalette } from '../palettes'

const signalsWith = (more: Partial<VisualSignals> = {}): VisualSignals => ({
  ...quietSignals(),
  ...more,
})

const visual = (id: string, kind: string, more: Partial<Visual> = {}): Visual => ({
  id,
  kind,
  variation: 0,
  stroke: null,
  lane: 0,
  beat: 0,
  beats: null,
  knobs: firstKnobs(kind),
  ...more,
})

const setOf = (...list: Visual[]): VisualSet => ({
  palette: DEFAULT_PALETTE,
  grain: DEFAULT_GRAIN,
  list,
  pedals: [],
})

const NO_LEVELS: ReadonlyMap<string, number> = new Map()

describe('signals with nothing sounding', () => {
  it('has a spectrum, the colours of the kinds and a picture of the piece of the sizes a style is handed', () => {
    const signals = quietSignals()
    expect(signals.bands).toBeInstanceOf(Float32Array)
    expect(signals.bands).toHaveLength(SPECTRUM_BANDS)
    expect(SPECTRUM_BANDS).toBe(16)
    expect(signals.kindColours).toBeInstanceOf(Float32Array)
    expect(signals.kindColours).toHaveLength(KIND_SLOTS.length * 3)
    expect(signals.kindColours).toHaveLength(15)
    expect(signals.map).toBeInstanceOf(Uint8Array)
    expect(signals.map).toHaveLength(MAP_W * MAP_H * 4)
  })

  it('is silent, with the dials where they rest', () => {
    const signals = quietSignals()
    const levels = [
      'mix',
      'low',
      'mid',
      'high',
      'drone',
      'pad',
      'texture',
      'melodic',
      'hits',
      'cue',
      'keys',
      'input',
    ] as const
    for (const level of levels) expect(signals[level], level).toBe(0)
    expect([signals.time, signals.place, signals.travel]).toEqual([0, 0, 0])
    expect([signals.energy, signals.space, signals.tone]).toEqual([0.6, 0.5, 0.5])
    expect(signals.bands.every((band) => band === 0)).toBe(true)
    expect(signals.map.every((part) => part === 0)).toBe(true)
  })

  it('is made anew each time, so one screen cannot change another', () => {
    expect(quietSignals()).not.toBe(quietSignals())
    expect(quietSignals().bands).not.toBe(quietSignals().bands)
  })

  it('has a number for everything a knob can follow but its stroke', () => {
    const signals = quietSignals()
    for (const source of VISUAL_SOURCES) {
      if (source.id === 'stroke') continue
      expect(typeof signals[source.id], source.id).toBe('number')
    }
  })
})

describe('where a knob stands now', () => {
  it('reads a source from the signals, and the stroke from the level handed in', () => {
    const signals = signalsWith({ mix: 0.4, low: 0.7, place: 0.25 })
    expect(sourceNow('mix', signals, 0.9)).toBe(0.4)
    expect(sourceNow('low', signals, 0.9)).toBe(0.7)
    expect(sourceNow('place', signals, 0.9)).toBe(0.25)
    expect(sourceNow('stroke', signals, 0.9)).toBe(0.9)
  })

  it('stands where it was put when it follows nothing', () => {
    const signals = signalsWith({ mix: 1, low: 1 })
    expect(knobNow({ value: 0.3, follows: null }, signals, 1)).toBe(0.3)
    expect(knobNow({ value: 0, follows: null }, signals, 1)).toBe(0)
    expect(knobNow({ value: 1, follows: null }, signals, 0)).toBe(1)
  })

  it('stands at nothing when the visual has no such knob', () => {
    expect(knobNow(undefined, signalsWith({ mix: 1 }), 1)).toBe(0)
  })

  it('is moved by the source it follows: a little at rest, past where it was put when the source is full', () => {
    const knob = { value: 0.6, follows: 'low' as const }
    expect(knobNow(knob, signalsWith({ low: 0 }), 0)).toBeCloseTo(0.09, 10)
    expect(knobNow(knob, signalsWith({ low: 0.5 }), 0)).toBeCloseTo(0.495, 10)
    expect(knobNow(knob, signalsWith({ low: 1 }), 0)).toBeCloseTo(0.9, 10)
    expect(knobNow(knob, signalsWith({ low: 1 }), 0)).toBeGreaterThan(knob.value)
    // Never past full, and nothing stays nothing.
    expect(knobNow({ value: 0.9, follows: 'low' }, signalsWith({ low: 1 }), 0)).toBe(1)
    expect(knobNow({ value: 0, follows: 'low' }, signalsWith({ low: 1 }), 0)).toBe(0)
  })

  it('runs from nothing at the start of the piece to where it was put at its end when it follows the place', () => {
    const knob = { value: 0.8, follows: 'place' as const }
    expect(knobNow(knob, signalsWith({ place: 0 }), 1)).toBe(0)
    expect(knobNow(knob, signalsWith({ place: 0.5 }), 1)).toBeCloseTo(0.4, 10)
    expect(knobNow(knob, signalsWith({ place: 1 }), 1)).toBeCloseTo(0.8, 10)
  })

  it('follows the stroke the visual is linked to, not the mix', () => {
    const knob = { value: 0.5, follows: 'stroke' as const }
    const signals = signalsWith({ mix: 1 })
    expect(knobNow(knob, signals, 0)).toBeCloseTo(0.075, 10)
    expect(knobNow(knob, signals, 0.5)).toBeCloseTo(0.4125, 10)
    expect(knobNow(knob, signals, 1)).toBeCloseTo(0.75, 10)
  })
})

describe('how much of a visual shows', () => {
  it('shows a linked visual with its stroke, wholly before the stroke is at its loudest', () => {
    const linked = visual('a', 'star', { stroke: 'stroke-1', beat: 100, beats: 1 })
    expect(presenceOf(linked, 0, 0)).toBe(0)
    expect(presenceOf(linked, 0, 0.5)).toBeCloseTo(0.7, 10)
    expect(presenceOf(linked, 0, 0.8)).toBe(1)
    expect(presenceOf(linked, 50, 1)).toBe(1)
  })

  it('shows a visual drawn for the whole piece all the time', () => {
    const whole = visual('a', 'star', { beat: 8, beats: null })
    expect(presenceOf(whole, 0, 0)).toBe(1)
    expect(presenceOf(whole, 8, 0)).toBe(1)
    expect(presenceOf(whole, 4000, 0)).toBe(1)
  })

  it('brings a visual in over a beat and takes it out over a beat', () => {
    const stretch = visual('a', 'star', { beat: 4, beats: 8 })
    expect(presenceOf(stretch, 4, 0)).toBe(0)
    expect(presenceOf(stretch, 4.25, 0)).toBeCloseTo(0.25, 10)
    expect(presenceOf(stretch, 4.5, 0)).toBeCloseTo(0.5, 10)
    expect(presenceOf(stretch, 5, 0)).toBe(1)
    expect(presenceOf(stretch, 8, 0)).toBe(1)
    expect(presenceOf(stretch, 11, 0)).toBe(1)
    expect(presenceOf(stretch, 11.5, 0)).toBeCloseTo(0.5, 10)
    expect(presenceOf(stretch, 12, 0)).toBe(0)
  })

  it('shows nothing of a visual outside its stretch, however loud anything is', () => {
    const stretch = visual('a', 'star', { beat: 4, beats: 8 })
    expect(presenceOf(stretch, 0, 1)).toBe(0)
    expect(presenceOf(stretch, 3.99, 1)).toBe(0)
    expect(presenceOf(stretch, 12.01, 1)).toBe(0)
    expect(presenceOf(stretch, 400, 1)).toBe(0)
  })

  it('still shows a stretch shorter than two beats wholly at its middle', () => {
    const short = visual('a', 'star', { beat: 4, beats: 1 })
    expect(presenceOf(short, 4.25, 0)).toBeCloseTo(0.5, 10)
    expect(presenceOf(short, 4.5, 0)).toBe(1)
    expect(presenceOf(short, 4.75, 0)).toBeCloseTo(0.5, 10)
  })
})

describe('the frame a piece comes to', () => {
  it('has no layers for no visuals, and carries the signals it was handed', () => {
    const signals = quietSignals()
    const frame = frameOf(setOf(), signals, 0, NO_LEVELS)
    expect(frame.layers).toEqual([])
    expect(frame.signals).toBe(signals)
  })

  it('paints a style with its knobs where they stand now', () => {
    const set = setOf(visual('a', 'star', { variation: 1 }))
    const frame = frameOf(set, signalsWith({ energy: 0.6 }), 0, NO_LEVELS)
    expect(frame.layers).toHaveLength(1)
    const [layer] = frame.layers
    expect(layer).toMatchObject({ paint: 'star', variation: 1, level: 0.9, size: 0.5, hue: 0 })
    // Glow follows the Energy dial on a new visual.
    expect('glow' in layer && layer.glow).toBeCloseTo(0.7 * (0.15 + 1.35 * 0.6), 10)
    const loud = frameOf(set, signalsWith({ energy: 1 }), 0, NO_LEVELS).layers[0]
    expect('glow' in loud && loud.glow).toBe(1)
  })

  it('turns the colours either way from the middle of the Colour knob', () => {
    const knobs = (value: number) => ({ ...firstKnobs('star'), colour: { value, follows: null } })
    const hueOf = (value: number) => {
      const layer = frameOf(
        setOf(visual('a', 'star', { knobs: knobs(value) })),
        quietSignals(),
        0,
        NO_LEVELS,
      ).layers[0]
      return 'hue' in layer ? layer.hue : Number.NaN
    }
    expect(hueOf(0)).toBe(-0.5)
    expect(hueOf(0.5)).toBe(0)
    expect(hueOf(1)).toBe(0.5)
  })

  it('paints row by row from the top, and what bends after what paints', () => {
    const set = setOf(
      visual('bend', 'spin', { lane: 0 }),
      visual('low', 'star', { lane: 2 }),
      visual('top', 'meadow', { lane: 1 }),
    )
    const { layers } = frameOf(set, quietSignals(), 0, NO_LEVELS)
    const names = layers.map((layer) => ('paint' in layer ? layer.paint : layer.bend))
    expect(names).toEqual(['meadow', 'star', 'spin'])
  })

  it('shows a visual as much as it is present', () => {
    const set = setOf(visual('a', 'star', { beat: 4, beats: 8 }))
    const levelAt = (beat: number) => {
      const layer = frameOf(set, quietSignals(), beat, NO_LEVELS).layers[0]
      return layer && 'paint' in layer ? layer.level : null
    }
    expect(levelAt(4.5)).toBeCloseTo(0.45, 10)
    expect(levelAt(8)).toBeCloseTo(0.9, 10)
    expect(levelAt(11.75)).toBeCloseTo(0.225, 10)
  })

  it('leaves out a visual that is not present', () => {
    const set = setOf(
      visual('placed', 'star', { beat: 4, beats: 8 }),
      visual('linked', 'meadow', { stroke: 'stroke-1' }),
    )
    expect(frameOf(set, quietSignals(), 2, NO_LEVELS).layers).toEqual([])
    expect(frameOf(set, quietSignals(), 20, new Map([['stroke-2', 1]])).layers).toEqual([])
    // Barely there is not there.
    expect(frameOf(set, quietSignals(), 4.005, new Map([['stroke-1', 0.005]])).layers).toEqual([])
  })

  it('shows a linked visual while its stroke sounds, as loud as the stroke is', () => {
    const set = setOf(visual('linked', 'meadow', { stroke: 'stroke-1' }))
    const levelAt = (stroke: number) => {
      const layer = frameOf(set, quietSignals(), 0, new Map([['stroke-1', stroke]])).layers[0]
      return layer && 'paint' in layer ? layer.level : null
    }
    expect(levelAt(0)).toBeNull()
    expect(levelAt(0.25)).toBeCloseTo(0.9 * 0.35, 10)
    expect(levelAt(1)).toBeCloseTo(0.9, 10)
  })

  it('hands a knob that follows its stroke the level of that stroke', () => {
    const knobs = { ...firstKnobs('meadow'), size: { value: 0.8, follows: 'stroke' as const } }
    const set = setOf(
      visual('linked', 'meadow', { stroke: 'stroke-1', knobs }),
      visual('placed', 'star', { knobs }),
    )
    const [linked, placed] = frameOf(set, quietSignals(), 0, new Map([['stroke-1', 1]])).layers
    expect(linked).toMatchObject({ paint: 'meadow', size: 1 })
    // One that is not linked has no stroke: the knob stays at its rest.
    expect(placed).toMatchObject({ paint: 'star' })
    expect('size' in placed && placed.size).toBeCloseTo(0.8 * 0.15, 10)
  })

  it('leaves out a style whose Level stands at nothing', () => {
    const off = { ...firstKnobs('star'), level: { value: 0, follows: null } }
    const faint = { ...firstKnobs('star'), level: { value: 0.003, follows: null } }
    expect(
      frameOf(setOf(visual('a', 'star', { knobs: off })), quietSignals(), 0, NO_LEVELS).layers,
    ).toEqual([])
    expect(
      frameOf(setOf(visual('a', 'star', { knobs: faint })), quietSignals(), 0, NO_LEVELS).layers,
    ).toEqual([])
  })

  it('leaves out a kind this build does not have', () => {
    const knobs = { level: { value: 1, follows: null }, swirl: { value: 1, follows: null } }
    const later = visual('later', 'later-kind', { knobs })
    const frame = frameOf(setOf(later, visual('a', 'star')), quietSignals(), 0, NO_LEVELS)
    expect(frame.layers).toHaveLength(1)
    expect(frame.layers[0]).toMatchObject({ paint: 'star' })
  })

  it('hands each bend its knobs', () => {
    const set = setOf(
      visual('t', 'trails'),
      visual('m', 'mirror'),
      visual('s', 'spin'),
      visual('g', 'grain'),
    )
    expect(frameOf(set, quietSignals(), 0, NO_LEVELS).layers).toEqual([
      { bend: 'trails', length: 0.5, push: 0.3 },
      { bend: 'mirror', fold: 0.4 },
      { bend: 'spin', turn: 0.1 },
      { bend: 'grain', amount: 0.9 },
    ])
  })

  it('bends less at the edges of the stretch a bend is drawn for', () => {
    const stretch = { beat: 4, beats: 8 }
    const set = setOf(
      visual('t', 'trails', stretch),
      visual('m', 'mirror', stretch),
      visual('s', 'spin', stretch),
      visual('g', 'grain', stretch),
    )
    const [trails, mirror, spin, grain] = frameOf(set, quietSignals(), 4.5, NO_LEVELS).layers
    // How fast a trail drifts is not a matter of how much of it shows.
    expect(trails).toEqual({ bend: 'trails', length: 0.25, push: 0.3 })
    expect(mirror).toEqual({ bend: 'mirror', fold: 0.2 })
    expect(spin).toEqual({ bend: 'spin', turn: 0.05 })
    expect(grain).toEqual({ bend: 'grain', amount: 0.45 })
    expect(frameOf(set, quietSignals(), 20, NO_LEVELS).layers).toEqual([])
  })

  it('moves a knob of a bend with what it follows', () => {
    const knobs = { turn: { value: 0.5, follows: 'low' as const } }
    const set = setOf(visual('s', 'spin', { knobs }))
    expect(frameOf(set, signalsWith({ low: 1 }), 0, NO_LEVELS).layers).toEqual([
      { bend: 'spin', turn: 0.75 },
    ])
  })

  it('carries the palette and the grain of the piece', () => {
    const frame = frameOf(
      { palette: 'sea', grain: 0.25, list: [], pedals: [] },
      quietSignals(),
      0,
      NO_LEVELS,
    )
    expect(frame.palette).toBe(visualPalette('sea'))
    expect(frame.grain).toBe(0.25)
    const unknown = frameOf(
      { palette: 'no-such-palette', grain: 1, list: [], pedals: [] },
      quietSignals(),
      0,
      NO_LEVELS,
    )
    expect(unknown.palette).toBe(visualPalette(DEFAULT_PALETTE))
    expect(unknown.grain).toBe(1)
  })
})

describe('the frame that shows one style alone', () => {
  it('paints the style in full, at the middle size, in the colours of the sounds', () => {
    const signals = signalsWith({ energy: 0.6 })
    const frame = sampleFrame('dot-screen', 1, signals, visualPalette('sea'), 0.3)
    expect(frame.layers).toHaveLength(1)
    expect(frame.layers[0]).toMatchObject({
      paint: 'dot-screen',
      variation: 1,
      level: 1,
      size: 0.5,
      hue: 0,
    })
    expect(frame.signals).toBe(signals)
    expect(frame.palette).toBe(visualPalette('sea'))
    expect(frame.grain).toBe(0.3)
  })

  it('glows as a new visual of the style would', () => {
    const glowAt = (energy: number) => {
      const layer = sampleFrame('dot-screen', 0, signalsWith({ energy }), visualPalette('soft'), 0)
        .layers[0]
      return 'glow' in layer ? layer.glow : Number.NaN
    }
    const fresh = (energy: number) => {
      const layer = frameOf(setOf(visual('a', 'dot-screen')), signalsWith({ energy }), 0, NO_LEVELS)
        .layers[0]
      return 'glow' in layer ? layer.glow : Number.NaN
    }
    for (const energy of [0, 0.3, 0.6, 1]) expect(glowAt(energy)).toBeCloseTo(fresh(energy), 10)
    expect(glowAt(1)).toBe(1)
  })

  it('paints nothing for a bend or for a kind this build does not have', () => {
    expect(sampleFrame('trails', 0, quietSignals(), visualPalette('soft'), 0.5).layers).toEqual([])
    expect(sampleFrame('later-kind', 0, quietSignals(), visualPalette('soft'), 0.5).layers).toEqual(
      [],
    )
  })
})
