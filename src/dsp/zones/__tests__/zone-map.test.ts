import { describe, expect, it } from 'vitest'

import {
  ZONE_FIELD_COUNT,
  compactZone,
  encodeZoneFields,
  normalizeZoneMap,
  planZoneLoad,
  prepareZoneLoad,
  type Zone,
  type ZoneCapacity,
  type ZoneMap,
  type ZoneSampleInfo,
} from '../zone-map'

const CAPACITY: ZoneCapacity = { maxZones: 512, maxSamples: 512, poolFloats: 16_000_000 }

const sound = (frames: number, channels = 1, sampleRate = 48000): ZoneSampleInfo => ({
  frames,
  channels,
  sampleRate,
})

describe('normalizeZoneMap', () => {
  it('fills in the defaults: a zone on its root key alone, every velocity, no loop', () => {
    const { map, problems } = normalizeZoneMap({ zones: [{ sample: 'c4.wav', rootKey: 60 }] })
    expect(problems).toEqual([])
    expect(map.zones).toEqual([
      {
        sample: 'c4.wav',
        rootKey: 60,
        tuneCents: 0,
        loKey: 60,
        hiKey: 60,
        loVel: 0,
        hiVel: 127,
        gainDb: 0,
        pan: 0,
        pitchTrack: 1,
        start: 0,
        end: 0,
        loop: null,
        roundRobin: null,
      },
    ])
  })

  it('brings values into range, puts ranges the right way round and rounds keys', () => {
    const { map } = normalizeZoneMap({
      zones: [
        {
          sample: 'a',
          rootKey: 60.4,
          loKey: 72,
          hiKey: 48,
          loVel: 200,
          hiVel: -5,
          tuneCents: 99999,
          gainDb: -500,
          pan: 3,
          pitchTrack: -1,
          start: -10,
        },
      ],
    })
    expect(map.zones[0]).toMatchObject({
      rootKey: 60,
      loKey: 48,
      hiKey: 72,
      loVel: 0,
      hiVel: 127,
      tuneCents: 4800,
      gainDb: -96,
      pan: 1,
      pitchTrack: 0,
      start: 0,
    })
  })

  it('leaves out a zone with no sound or no root and says which', () => {
    const { map, problems } = normalizeZoneMap({
      zones: [
        { sample: '', rootKey: 60 },
        { sample: 'a', rootKey: Number.NaN },
        { sample: 'b', rootKey: 61 },
        null as unknown as Zone,
      ],
    })
    expect(map.zones.map((zone) => zone.sample)).toEqual(['b'])
    expect(problems).toEqual(['zone 0: no sample', 'zone 1: no root key', 'zone 3: no sample'])
  })

  it('survives a map that is no map', () => {
    expect(normalizeZoneMap(null as unknown as ZoneMap).map.zones).toEqual([])
    expect(normalizeZoneMap({} as ZoneMap).problems).toEqual(['the map has no list of zones'])
  })

  it('drops an end or a loop end that is not after its start', () => {
    const { map, problems } = normalizeZoneMap({
      zones: [{ sample: 'a', rootKey: 60, start: 100, end: 50, loop: { start: 80, end: 20 } }],
    })
    expect(map.zones[0].end).toBe(0)
    expect(map.zones[0].loop).toMatchObject({ start: 80, end: 0 })
    expect(problems).toHaveLength(2)
  })

  it('renumbers round-robin groups from 1 and gives each group its highest position as length', () => {
    const { map } = normalizeZoneMap({
      zones: [
        { sample: 'a', rootKey: 60, roundRobin: { group: 40, position: 1 } },
        { sample: 'b', rootKey: 60, roundRobin: { group: 40, position: 3 } },
        { sample: 'c', rootKey: 62, roundRobin: { group: 7, position: 2, length: 4 } },
        { sample: 'd', rootKey: 62, roundRobin: { group: 0, position: 2 } },
      ],
    })
    expect(map.zones.map((zone) => zone.roundRobin)).toEqual([
      { group: 1, position: 1, length: 3 },
      { group: 1, position: 3, length: 3 },
      { group: 2, position: 2, length: 4 },
      null,
    ])
  })

  it('keeps a crossfade in frames over one in seconds', () => {
    const { map } = normalizeZoneMap({
      zones: [
        { sample: 'a', rootKey: 60, loop: { crossfade: 100, crossfadeSec: 0.5 } },
        { sample: 'b', rootKey: 60, loop: { crossfadeSec: 0.5, mode: 'sustain' } },
      ],
    })
    expect(map.zones[0].loop).toMatchObject({ crossfade: 100, crossfadeSec: 0 })
    expect(map.zones[1].loop).toMatchObject({ crossfade: 0, crossfadeSec: 0.5, mode: 'sustain' })
  })

  it('round-trips through compactZone', () => {
    const zones: Zone[] = [
      { sample: 'a', rootKey: 60 },
      {
        sample: 'b',
        rootKey: 62,
        loKey: 61,
        hiKey: 63,
        loVel: 10,
        hiVel: 90,
        tuneCents: -12.5,
        gainDb: -3,
        pan: 0.25,
        pitchTrack: 0,
        start: 10,
        end: 9000,
        loop: { start: 100, end: 8000, crossfade: 50, mode: 'sustain' },
        roundRobin: { group: 1, position: 2, length: 2 },
      },
    ]
    const compact = normalizeZoneMap({ zones }).map.zones.map(compactZone)
    expect(compact).toEqual(zones)
  })
})

describe('planZoneLoad', () => {
  const piano: ZoneMap = {
    zones: [36, 48, 60, 72, 84].flatMap((root) => [
      {
        sample: `soft-${root}`,
        rootKey: root,
        loKey: root - 6,
        hiKey: root + 5,
        loVel: 0,
        hiVel: 79,
      },
      {
        sample: `hard-${root}`,
        rootKey: root,
        loKey: root - 6,
        hiKey: root + 5,
        loVel: 80,
        hiVel: 127,
      },
    ]),
  }
  const pianoSounds = Object.fromEntries(
    piano.zones.map((zone) => [zone.sample, sound(480_000, 2)]),
  )

  it('loads an instrument that fits whole, and says what it takes', () => {
    const plan = planZoneLoad(piano, pianoSounds, CAPACITY)
    expect(plan).toMatchObject({ ok: true, mono: false, thinned: [], missing: [] })
    if (!plan.ok) return
    expect(plan.zones).toHaveLength(10)
    expect(plan.samples).toHaveLength(10)
    expect(plan.bytes).toBe(10 * 480_000 * 2 * 4)
    expect(plan.budgetBytes).toBe(64_000_000)
  })

  it('counts a sound once however many zones play it', () => {
    const map: ZoneMap = {
      zones: [
        { sample: 'a', rootKey: 60, loKey: 0, hiKey: 60 },
        { sample: 'a', rootKey: 72, loKey: 61, hiKey: 127 },
      ],
    }
    const plan = planZoneLoad(map, { a: sound(1000) }, CAPACITY)
    expect(plan).toMatchObject({ ok: true, bytes: 4000, samples: ['a'] })
  })

  it('refuses an instrument over the budget, with the two numbers', () => {
    const plan = planZoneLoad(piano, pianoSounds, CAPACITY, { budgetBytes: 16 * 1024 * 1024 })
    expect(plan.ok).toBe(false)
    if (plan.ok) return
    expect(plan.reason).toBe('it needs 36.6 MB of sample memory and the budget is 16.0 MB')
    expect(plan.bytes).toBe(38_400_000)
  })

  it('never plans past the pool, whatever budget is asked for', () => {
    const plan = planZoneLoad(
      piano,
      pianoSounds,
      { ...CAPACITY, poolFloats: 1000 },
      { budgetBytes: 1e12 },
    )
    expect(plan).toMatchObject({ ok: false, budgetBytes: 4000 })
  })

  it('thins in order: mono first, and stops as soon as it fits', () => {
    const plan = planZoneLoad(piano, pianoSounds, CAPACITY, {
      budgetBytes: 20 * 1024 * 1024,
      overBudget: 'thin',
    })
    expect(plan.ok).toBe(true)
    if (!plan.ok) return
    expect(plan.mono).toBe(true)
    expect(plan.thinned).toEqual([{ step: 'mono', zones: 0, bytes: 19_200_000 }])
    expect(plan.zones).toHaveLength(10)
    expect(plan.bytes).toBe(19_200_000)
  })

  it('then one velocity layer (the firm one, on every velocity), then every other key', () => {
    const layered = planZoneLoad(piano, pianoSounds, CAPACITY, {
      budgetBytes: 10_000_000,
      overBudget: 'thin',
    })
    expect(layered.ok).toBe(true)
    if (!layered.ok) return
    expect(layered.thinned.map((entry) => entry.step)).toEqual(['mono', 'velocity'])
    expect(layered.samples).toEqual([36, 48, 60, 72, 84].map((root) => `hard-${root}`))
    expect(layered.zones.every((zone) => zone.loVel === 0 && zone.hiVel === 127)).toBe(true)

    const sparse = planZoneLoad(piano, pianoSounds, CAPACITY, {
      budgetBytes: 4_000_000,
      overBudget: 'thin',
    })
    expect(sparse.ok).toBe(true)
    if (!sparse.ok) return
    expect(sparse.thinned.map((entry) => entry.step)).toEqual(['mono', 'velocity', 'keys', 'keys'])
    // Five keys, then three (36, 60, 84), then two: the lowest is always kept.
    expect(sparse.samples).toEqual(['hard-36', 'hard-84'])
    expect(sparse.bytes).toBe(3_840_000)
  })

  it('keeps one take of each round robin before it gives up a velocity layer', () => {
    const map: ZoneMap = {
      zones: [1, 2, 3].map((position) => ({
        sample: `take-${position}`,
        rootKey: 60,
        loKey: 0,
        hiKey: 127,
        roundRobin: { group: 1, position },
      })),
    }
    const sounds = Object.fromEntries(map.zones.map((zone) => [zone.sample, sound(1000)]))
    const plan = planZoneLoad(map, sounds, CAPACITY, { budgetBytes: 4000, overBudget: 'thin' })
    expect(plan.ok).toBe(true)
    if (!plan.ok) return
    expect(plan.thinned).toEqual([{ step: 'round-robin', zones: 2, bytes: 8000 }])
    expect(plan.zones).toMatchObject([{ sample: 'take-1', roundRobin: null }])
  })

  it('refuses when even one key of one layer in mono is too much', () => {
    const plan = planZoneLoad(piano, pianoSounds, CAPACITY, {
      budgetBytes: 1000,
      overBudget: 'thin',
    })
    expect(plan.ok).toBe(false)
    if (plan.ok) return
    expect(plan.reason).toBe(
      'it needs 1.8 MB of sample memory and the budget is 0.0 MB, with everything that can be left out left out',
    )
  })

  it('refuses more zones or more sounds than the device holds', () => {
    const many: ZoneMap = {
      zones: Array.from({ length: 6 }, (_, index) => ({
        sample: `s${index}`,
        rootKey: 40 + index,
      })),
    }
    const sounds = Object.fromEntries(many.zones.map((zone) => [zone.sample, sound(100)]))
    expect(planZoneLoad(many, sounds, { ...CAPACITY, maxZones: 5 })).toMatchObject({
      ok: false,
      reason: 'it has 6 zones and the device holds 5',
    })
    expect(planZoneLoad(many, sounds, { ...CAPACITY, maxSamples: 4 })).toMatchObject({
      ok: false,
      reason: 'it has 6 sounds and the device holds 4',
    })
    // Thinning the keys brings the count down too.
    expect(
      planZoneLoad(many, sounds, { ...CAPACITY, maxZones: 5 }, { overBudget: 'thin' }),
    ).toMatchObject({ ok: true, samples: ['s0', 's2', 's4'] })
  })

  it('leaves out zones whose sound is missing and names the sounds', () => {
    const map: ZoneMap = {
      zones: [
        { sample: 'here', rootKey: 60 },
        { sample: 'gone', rootKey: 62 },
        { sample: 'toString', rootKey: 64 },
        { sample: 'short', rootKey: 66 },
      ],
    }
    const plan = planZoneLoad(map, { here: sound(100), short: sound(2) }, CAPACITY)
    expect(plan).toMatchObject({
      ok: true,
      samples: ['here'],
      missing: ['gone', 'toString', 'short'],
    })
  })

  it('refuses an instrument with nothing to play', () => {
    expect(planZoneLoad({ zones: [] }, {}, CAPACITY)).toMatchObject({
      ok: false,
      reason: 'the instrument has no zones',
    })
    expect(planZoneLoad({ zones: [{ sample: 'a', rootKey: 60 }] }, {}, CAPACITY)).toMatchObject({
      ok: false,
      reason: 'none of the sounds its zones name were provided',
      missing: ['a'],
    })
  })
})

describe('encodeZoneFields and prepareZoneLoad', () => {
  it('writes each zone as twenty floats in the order the device reads', () => {
    const { map } = normalizeZoneMap({
      zones: [
        {
          sample: 'b',
          rootKey: 62,
          loKey: 61,
          hiKey: 63,
          loVel: 10,
          hiVel: 90,
          tuneCents: -25,
          gainDb: -3,
          pan: 0.5,
          pitchTrack: 0,
          start: 10,
          end: 9000,
          loop: { start: 100, end: 8000, crossfadeSec: 0.01, mode: 'sustain' },
          roundRobin: { group: 9, position: 2, length: 3 },
        },
        { sample: 'a', rootKey: 60 },
      ],
    })
    const fields = encodeZoneFields(map.zones, ['a', 'b'], () => sound(9000, 1, 44100))
    expect(fields).toHaveLength(2 * ZONE_FIELD_COUNT)
    expect([...fields.subarray(0, ZONE_FIELD_COUNT)]).toEqual([
      1, 62, -25, 61, 63, 10, 90, -3, 0.5, 10, 9000, 2, 100, 8000, 441, 1, 2, 3, 0, 0,
    ])
    expect([...fields.subarray(ZONE_FIELD_COUNT)]).toEqual([
      0, 60, 0, 60, 60, 0, 127, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0,
    ])
  })

  it('copies the sounds a plan uses, in order, and folds stereo when the plan says mono', () => {
    const left = Float32Array.of(1, 1, 1, 1)
    const right = Float32Array.of(0, 0.5, -1, 1)
    const map: ZoneMap = {
      zones: [
        { sample: 'wide', rootKey: 60 },
        { sample: 'narrow', rootKey: 62 },
      ],
    }
    const samples = {
      narrow: { channels: [Float32Array.of(0.1, 0.2, 0.3, 0.4)], sampleRate: 44100 },
      wide: { channels: [left, right, Float32Array.of(9, 9, 9, 9)], sampleRate: 48000 },
      unused: { channels: [new Float32Array(100)], sampleRate: 48000 },
    }
    const whole = prepareZoneLoad(map, samples, CAPACITY)
    expect(whole.plan).toMatchObject({ ok: true, samples: ['wide', 'narrow'], bytes: 48 })
    expect(whole.load?.samples.map((sample) => sample.channels.length)).toEqual([2, 1])
    expect(whole.load?.samples[0].channels[0]).not.toBe(left)
    expect([...(whole.load?.samples[0].channels[1] ?? [])]).toEqual([...right])
    expect(whole.load?.samples[1].sampleRate).toBe(44100)

    const folded = prepareZoneLoad(map, samples, CAPACITY, { budgetBytes: 32, overBudget: 'thin' })
    expect(folded.plan).toMatchObject({ ok: true, mono: true, bytes: 32 })
    expect([...(folded.load?.samples[0].channels[0] ?? [])]).toEqual([0.5, 0.75, 0, 1])
    expect(folded.load?.samples[0].channels).toHaveLength(1)

    const refused = prepareZoneLoad(map, samples, CAPACITY, { budgetBytes: 8 })
    expect(refused.plan.ok).toBe(false)
    expect(refused.load).toBeNull()
  })
})
