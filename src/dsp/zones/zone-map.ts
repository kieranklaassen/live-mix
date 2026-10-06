// The zone map: what a multi-sample instrument is made of, as plain JSON.
// Each zone names a sound and says which keys and velocities play it. The
// sounds themselves travel beside the map as decoded audio, keyed by the
// names the zones use (docs/zone-sampler.md).
//
// Nothing here touches audio hardware or the network: the map is checked,
// fitted to a device's memory and written out as the flat fields the device
// reads (cpp/common/device_api.h, "zone devices").

/** How a zone repeats part of its sound while a key is held. */
export interface ZoneLoop {
  /** First frame of the loop (default 0). */
  start?: number
  /** One past the loop's last frame (default, and 0: the zone's end). */
  end?: number
  /** Frames at the end of each pass blended with the audio that leads into `start`. */
  crossfade?: number
  /** The crossfade in seconds, for formats that say it that way; used when `crossfade` is not given. */
  crossfadeSec?: number
  /** `'continuous'` (default) keeps looping through the release; `'sustain'` leaves the loop when the key is let go. */
  mode?: 'continuous' | 'sustain'
}

/** A zone's place among alternating takes: of the zones of one group, the next position plays on each note. */
export interface ZoneRoundRobin {
  /** Which group of alternates; any whole number from 1. */
  group: number
  /** This zone's turn, from 1. */
  position: number
  /** How many turns the group has (default: its highest position). */
  length?: number
}

/** One sound mapped to keys. Only `sample` and `rootKey` are required. */
export interface Zone {
  /** The name of the sound in the sample table: a path as a file format wrote it, or any id. */
  sample: string
  /** The key (MIDI note, 0..127) that plays the sound as recorded. */
  rootKey: number
  /** Fine tune in cents; positive plays higher. */
  tuneCents?: number
  /** Lowest and highest key of the zone (default: `rootKey`, both). Keys no zone covers play the nearest one. */
  loKey?: number
  hiKey?: number
  /** Lowest and highest velocity, 0..127 (default 0 and 127). */
  loVel?: number
  hiVel?: number
  /** Gain in dB (default 0). */
  gainDb?: number
  /** Balance, -1 (left) to 1 (right). */
  pan?: number
  /** How far the pitch follows the keys: 1 (default) a semitone a key, 0 the same pitch on every key. */
  pitchTrack?: number
  /** First frame played (default 0) and one past the last (default, and 0: the end of the sound). */
  start?: number
  end?: number
  loop?: ZoneLoop
  roundRobin?: ZoneRoundRobin
}

/** A multi-sample instrument as JSON. */
export interface ZoneMap {
  name?: string
  zones: Zone[]
}

/** A zone with every default filled in, as `normalizeZoneMap` returns it. */
export interface ResolvedZone {
  sample: string
  rootKey: number
  tuneCents: number
  loKey: number
  hiKey: number
  loVel: number
  hiVel: number
  gainDb: number
  pan: number
  pitchTrack: number
  start: number
  end: number
  loop: {
    start: number
    end: number
    crossfade: number
    crossfadeSec: number
    mode: 'continuous' | 'sustain'
  } | null
  roundRobin: { group: number; position: number; length: number } | null
}

export interface ResolvedZoneMap {
  name?: string
  zones: ResolvedZone[]
}

/** What a device holds (its definition's `zones`). */
export interface ZoneCapacity {
  maxZones: number
  maxSamples: number
  /** Floats of sample data: a mono sound takes its frames, a stereo one twice that. */
  poolFloats: number
}

/** The size of one sound of the sample table. */
export interface ZoneSampleInfo {
  frames: number
  channels: number
  sampleRate: number
}

/** One sound of the sample table: one or two channels of audio at `sampleRate`. */
export interface ZoneSample {
  channels: readonly Float32Array[]
  sampleRate: number
}

/** The number of floats a device reads per zone. */
export const ZONE_FIELD_COUNT = 20

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const clamp = (value: number, low: number, high: number): number =>
  Math.min(high, Math.max(low, value))

function whole(value: unknown, fallback: number, low: number, high: number): number {
  return finite(value) ? clamp(Math.round(value), low, high) : fallback
}

function real(value: unknown, fallback: number, low: number, high: number): number {
  return finite(value) ? clamp(value, low, high) : fallback
}

/** The most frames a zone can address: frame positions cross to the device as floats. */
const MAX_FRAME = 16777216

/**
 * Fill in every default and bring every value into range. Zones that name no
 * sound or have no root key are left out and named in `problems`; nothing
 * throws. Round-robin groups are renumbered 1, 2, … in order of appearance,
 * and a group's length is at least its highest position.
 */
export function normalizeZoneMap(map: ZoneMap): { map: ResolvedZoneMap; problems: string[] } {
  const problems: string[] = []
  const zones: ResolvedZone[] = []
  const groupIds = new Map<number, number>()
  const source: readonly Zone[] = Array.isArray(map?.zones) ? map.zones : []
  if (!Array.isArray(map?.zones)) problems.push('the map has no list of zones')
  source.forEach((zone, index) => {
    if (typeof zone?.sample !== 'string' || zone.sample === '') {
      problems.push(`zone ${index}: no sample`)
      return
    }
    if (!finite(zone.rootKey)) {
      problems.push(`zone ${index}: no root key`)
      return
    }
    const rootKey = whole(zone.rootKey, 60, 0, 127)
    let loKey = whole(zone.loKey, rootKey, 0, 127)
    let hiKey = whole(zone.hiKey, rootKey, 0, 127)
    if (loKey > hiKey) [loKey, hiKey] = [hiKey, loKey]
    let loVel = whole(zone.loVel, 0, 0, 127)
    let hiVel = whole(zone.hiVel, 127, 0, 127)
    if (loVel > hiVel) [loVel, hiVel] = [hiVel, loVel]
    const start = whole(zone.start, 0, 0, MAX_FRAME)
    let end = whole(zone.end, 0, 0, MAX_FRAME)
    if (end !== 0 && end <= start) {
      problems.push(`zone ${index}: its end is not after its start`)
      end = 0
    }
    let loop: ResolvedZone['loop'] = null
    if (zone.loop) {
      const loopStart = whole(zone.loop.start, 0, 0, MAX_FRAME)
      let loopEnd = whole(zone.loop.end, 0, 0, MAX_FRAME)
      if (loopEnd !== 0 && loopEnd <= loopStart) {
        problems.push(`zone ${index}: its loop ends before it starts`)
        loopEnd = 0
      }
      const crossfade = whole(zone.loop.crossfade, 0, 0, MAX_FRAME)
      loop = {
        start: loopStart,
        end: loopEnd,
        crossfade,
        crossfadeSec: crossfade > 0 ? 0 : real(zone.loop.crossfadeSec, 0, 0, 60),
        mode: zone.loop.mode === 'sustain' ? 'sustain' : 'continuous',
      }
    }
    let roundRobin: ResolvedZone['roundRobin'] = null
    if (zone.roundRobin && finite(zone.roundRobin.group) && zone.roundRobin.group >= 1) {
      const given = Math.round(zone.roundRobin.group)
      let group = groupIds.get(given)
      if (group === undefined) {
        group = groupIds.size + 1
        groupIds.set(given, group)
      }
      const position = whole(zone.roundRobin.position, 1, 1, 1024)
      roundRobin = { group, position, length: whole(zone.roundRobin.length, position, 1, 1024) }
    }
    zones.push({
      sample: zone.sample,
      rootKey,
      tuneCents: real(zone.tuneCents, 0, -4800, 4800),
      loKey,
      hiKey,
      loVel,
      hiVel,
      gainDb: real(zone.gainDb, 0, -96, 24),
      pan: real(zone.pan, 0, -1, 1),
      pitchTrack: real(zone.pitchTrack, 1, 0, 1),
      start,
      end,
      loop,
      roundRobin,
    })
  })
  // A group has as many turns as its highest position, or more if it says so.
  const lengths = new Map<number, number>()
  for (const { roundRobin } of zones) {
    if (!roundRobin) continue
    const length = Math.max(roundRobin.length, roundRobin.position)
    lengths.set(roundRobin.group, Math.max(lengths.get(roundRobin.group) ?? 1, length))
  }
  for (const { roundRobin } of zones) {
    if (roundRobin) roundRobin.length = lengths.get(roundRobin.group) ?? roundRobin.length
  }
  const resolved: ResolvedZoneMap = { zones }
  if (typeof map?.name === 'string' && map.name !== '') resolved.name = map.name
  return { map: resolved, problems }
}

/** A resolved zone as a `Zone` that says only what differs from the defaults. */
export function compactZone(zone: ResolvedZone): Zone {
  const out: Zone = { sample: zone.sample, rootKey: zone.rootKey }
  if (zone.loKey !== zone.rootKey || zone.hiKey !== zone.rootKey) {
    out.loKey = zone.loKey
    out.hiKey = zone.hiKey
  }
  if (zone.loVel !== 0 || zone.hiVel !== 127) {
    out.loVel = zone.loVel
    out.hiVel = zone.hiVel
  }
  if (zone.tuneCents !== 0) out.tuneCents = zone.tuneCents
  if (zone.gainDb !== 0) out.gainDb = zone.gainDb
  if (zone.pan !== 0) out.pan = zone.pan
  if (zone.pitchTrack !== 1) out.pitchTrack = zone.pitchTrack
  if (zone.start !== 0) out.start = zone.start
  if (zone.end !== 0) out.end = zone.end
  if (zone.loop) {
    const loop: ZoneLoop = {}
    if (zone.loop.start !== 0) loop.start = zone.loop.start
    if (zone.loop.end !== 0) loop.end = zone.loop.end
    if (zone.loop.crossfade !== 0) loop.crossfade = zone.loop.crossfade
    if (zone.loop.crossfadeSec !== 0) loop.crossfadeSec = zone.loop.crossfadeSec
    if (zone.loop.mode !== 'continuous') loop.mode = zone.loop.mode
    out.loop = loop
  }
  if (zone.roundRobin) out.roundRobin = { ...zone.roundRobin }
  return out
}

// --- fitting an instrument to a device -------------------------------------------------------

/** What a load does when the instrument is larger than the budget. */
export type ZoneOverBudget = 'refuse' | 'thin'

export interface ZonePlanOptions {
  /**
   * `'refuse'` (default) loads the instrument whole or not at all. `'thin'`
   * loads less of it, in this order until it fits: stereo folded to mono,
   * one take of each round robin, one velocity layer, then every other
   * sampled key (the keys between play the nearest one that is left).
   */
  overBudget?: ZoneOverBudget
  /** A smaller budget than the device's pool, in bytes of sample data (4 per float). */
  budgetBytes?: number
}

/** One thing `'thin'` took out, in the order it was done. */
export interface ZoneThinning {
  step: 'mono' | 'round-robin' | 'velocity' | 'keys'
  /** Zones left out by this step. */
  zones: number
  /** Bytes of sample data it saved. */
  bytes: number
}

export type ZonePlan =
  | {
      ok: true
      /** The zones that load, in order. */
      zones: ResolvedZone[]
      /** The sounds they use, in the order the device numbers them. */
      samples: string[]
      /** True when stereo sounds are folded to mono. */
      mono: boolean
      /** Bytes of sample data loaded, and the budget they fit. */
      bytes: number
      budgetBytes: number
      /** What was left out to make it fit; empty when the instrument loaded whole. */
      thinned: ZoneThinning[]
      /** Sounds the zones name that the sample table does not have; their zones are left out. */
      missing: string[]
      problems: string[]
    }
  | {
      ok: false
      /** Why nothing loads, in a sentence. */
      reason: string
      /** Bytes the whole instrument needs, and the budget. */
      bytes: number
      budgetBytes: number
      missing: string[]
      problems: string[]
    }

const megabytes = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(1)} MB`

function usedSamples(zones: readonly ResolvedZone[]): string[] {
  return [...new Set(zones.map((zone) => zone.sample))]
}

function floatsOf(
  zones: readonly ResolvedZone[],
  info: (sample: string) => ZoneSampleInfo,
  mono: boolean,
): number {
  let floats = 0
  for (const sample of usedSamples(zones)) {
    const { frames, channels } = info(sample)
    floats += frames * (mono ? 1 : Math.min(2, Math.max(1, channels)))
  }
  return floats
}

const rangeKey = (zone: ResolvedZone): string => `${zone.loKey}:${zone.hiKey}`

/** One take of each round robin: the lowest position of every group, on each range of keys and velocities. */
function firstTakes(zones: readonly ResolvedZone[]): ResolvedZone[] {
  const lowest = new Map<string, number>()
  const bucket = (zone: ResolvedZone) =>
    `${zone.roundRobin?.group}:${rangeKey(zone)}:${zone.loVel}:${zone.hiVel}`
  for (const zone of zones) {
    if (!zone.roundRobin) continue
    const key = bucket(zone)
    lowest.set(key, Math.min(lowest.get(key) ?? Infinity, zone.roundRobin.position))
  }
  return zones
    .filter((zone) => !zone.roundRobin || zone.roundRobin.position === lowest.get(bucket(zone)))
    .map((zone) => ({ ...zone, roundRobin: null }))
}

/** One velocity layer per range of keys: the one a firm touch (100) plays, else the loudest; it then takes every velocity. */
function oneLayer(zones: readonly ResolvedZone[]): ResolvedZone[] {
  const chosen = new Map<string, string>()
  const layer = (zone: ResolvedZone) => `${zone.loVel}:${zone.hiVel}`
  for (const key of new Set(zones.map(rangeKey))) {
    const layers = zones.filter((zone) => rangeKey(zone) === key)
    const firm = layers.find((zone) => zone.loVel <= 100 && zone.hiVel >= 100)
    const loudest = layers.reduce((best, zone) => (zone.hiVel > best.hiVel ? zone : best))
    chosen.set(key, layer(firm ?? loudest))
  }
  return zones
    .filter((zone) => layer(zone) === chosen.get(rangeKey(zone)))
    .map((zone) => ({ ...zone, loVel: 0, hiVel: 127 }))
}

/** Every other sampled key, counted from the lowest root. */
function everyOtherKey(zones: readonly ResolvedZone[]): ResolvedZone[] {
  const roots = new Map<string, number>()
  for (const zone of zones) {
    roots.set(rangeKey(zone), Math.min(roots.get(rangeKey(zone)) ?? Infinity, zone.rootKey))
  }
  const ordered = [...roots.entries()].sort((a, b) => a[1] - b[1]).map(([key]) => key)
  const kept = new Set(ordered.filter((_, index) => index % 2 === 0))
  return zones.filter((zone) => kept.has(rangeKey(zone)))
}

/**
 * Decide what of an instrument loads into a device: all of it when it fits,
 * otherwise nothing and the reason, or (with `overBudget: 'thin'`) less of
 * it and what was left out. Pure: it reads only the sizes of the sounds.
 */
export function planZoneLoad(
  map: ZoneMap,
  samples: Readonly<Record<string, ZoneSampleInfo | undefined>>,
  capacity: ZoneCapacity,
  options: ZonePlanOptions = {},
): ZonePlan {
  const { map: resolved, problems } = normalizeZoneMap(map)
  const budgetFloats = Math.max(
    0,
    Math.min(
      capacity.poolFloats,
      finite(options.budgetBytes) ? Math.floor(options.budgetBytes / 4) : Infinity,
    ),
  )
  const budgetBytes = budgetFloats * 4
  const has = (name: string) => {
    const sample = Object.hasOwn(samples, name) ? samples[name] : undefined
    return sample !== undefined && finite(sample.frames) && sample.frames >= 4
  }
  const missing = usedSamples(resolved.zones).filter((sample) => !has(sample))
  const none: ZoneSampleInfo = { frames: 0, channels: 1, sampleRate: 48000 }
  const info = (sample: string): ZoneSampleInfo => samples[sample] ?? none
  let zones = resolved.zones.filter((zone) => has(zone.sample))
  let mono = false
  const bytesOf = () => floatsOf(zones, info, mono) * 4
  const whole = bytesOf()
  const refuse = (reason: string): ZonePlan => ({
    ok: false,
    reason,
    bytes: whole,
    budgetBytes,
    missing,
    problems,
  })

  if (resolved.zones.length === 0) return refuse('the instrument has no zones')
  if (zones.length === 0) return refuse('none of the sounds its zones name were provided')
  const oversized = usedSamples(zones).find((sample) => info(sample).frames > MAX_FRAME)
  if (oversized !== undefined) {
    return refuse(`"${oversized}" is longer than a zone can address (${MAX_FRAME} frames)`)
  }

  const fault = (): string | null => {
    const bytes = bytesOf()
    if (bytes > budgetBytes) {
      return `it needs ${megabytes(bytes)} of sample memory and the budget is ${megabytes(budgetBytes)}`
    }
    if (zones.length > capacity.maxZones) {
      return `it has ${zones.length} zones and the device holds ${capacity.maxZones}`
    }
    const sounds = usedSamples(zones).length
    if (sounds > capacity.maxSamples) {
      return `it has ${sounds} sounds and the device holds ${capacity.maxSamples}`
    }
    return null
  }

  const thinned: ZoneThinning[] = []
  let problem = fault()
  if (problem !== null && options.overBudget === 'thin') {
    const attempt = (step: ZoneThinning['step'], apply: () => ResolvedZone[] | null) => {
      if (problem === null) return false
      const before = { count: zones.length, bytes: bytesOf() }
      const next = apply()
      if (next) zones = next
      const saved = before.bytes - bytesOf()
      const dropped = before.count - zones.length
      if (saved === 0 && dropped === 0) return false
      thinned.push({ step, zones: dropped, bytes: saved })
      problem = fault()
      return true
    }
    attempt('mono', () => {
      mono = true
      return null
    })
    // Folding nothing is not a step taken.
    if (!thinned.some((entry) => entry.step === 'mono')) mono = false
    attempt('round-robin', () => firstTakes(zones))
    attempt('velocity', () => oneLayer(zones))
    while (attempt('keys', () => everyOtherKey(zones))) {
      // Halve the sampled keys until it fits or one is left.
    }
  }
  if (problem !== null) {
    return refuse(
      thinned.length > 0 ? `${problem}, with everything that can be left out left out` : problem,
    )
  }
  return {
    ok: true,
    zones,
    samples: usedSamples(zones),
    mono,
    bytes: bytesOf(),
    budgetBytes,
    thinned,
    missing,
    problems,
  }
}

/**
 * The zones as the device reads them: `ZONE_FIELD_COUNT` floats each, in the
 * order cpp/common/device_api.h lists. `samples` is the order the sounds are
 * handed to the device in; `info` gives each one's rate, for a crossfade
 * given in seconds.
 */
export function encodeZoneFields(
  zones: readonly ResolvedZone[],
  samples: readonly string[],
  info: (sample: string) => ZoneSampleInfo | undefined,
): Float32Array {
  const index = new Map(samples.map((sample, position) => [sample, position]))
  const fields = new Float32Array(zones.length * ZONE_FIELD_COUNT)
  zones.forEach((zone, position) => {
    const at = position * ZONE_FIELD_COUNT
    const loop = zone.loop
    const rate = info(zone.sample)?.sampleRate ?? 48000
    fields.set(
      [
        index.get(zone.sample) ?? -1,
        zone.rootKey,
        zone.tuneCents,
        zone.loKey,
        zone.hiKey,
        zone.loVel,
        zone.hiVel,
        zone.gainDb,
        zone.pan,
        zone.start,
        zone.end,
        loop ? (loop.mode === 'sustain' ? 2 : 1) : 0,
        loop?.start ?? 0,
        loop?.end ?? 0,
        loop ? loop.crossfade || Math.round(loop.crossfadeSec * rate) : 0,
        zone.roundRobin?.group ?? 0,
        zone.roundRobin?.position ?? 1,
        zone.roundRobin?.length ?? 1,
        zone.pitchTrack,
        0,
      ],
      at,
    )
  })
  return fields
}

/** An instrument made ready for a device: the sounds in order and the zones as fields. */
export interface PreparedZoneLoad {
  /** One entry per sound: its channels (fresh copies, safe to transfer) and rate. */
  samples: { channels: Float32Array[]; sampleRate: number }[]
  fields: Float32Array
}

/**
 * Plan a load (`planZoneLoad`) and, when it goes ahead, copy the sounds it
 * uses (folded to mono where the plan says so) and encode its zones.
 */
export function prepareZoneLoad(
  map: ZoneMap,
  samples: Readonly<Record<string, ZoneSample | undefined>>,
  capacity: ZoneCapacity,
  options: ZonePlanOptions = {},
): { plan: ZonePlan; load: PreparedZoneLoad | null } {
  const sizes: Record<string, ZoneSampleInfo> = {}
  for (const [name, sample] of Object.entries(samples)) {
    if (!sample || sample.channels.length === 0) continue
    sizes[name] = {
      frames: sample.channels[0].length,
      channels: sample.channels.length,
      sampleRate: sample.sampleRate,
    }
  }
  const plan = planZoneLoad(map, sizes, capacity, options)
  if (!plan.ok) return { plan, load: null }
  const prepared = plan.samples.map((name) => {
    const sample = samples[name] ?? { channels: [new Float32Array(0)], sampleRate: 48000 }
    const [left, right] = sample.channels
    if (right === undefined || !plan.mono) {
      const channels = sample.channels.slice(0, 2).map((channel) => channel.slice())
      return { channels, sampleRate: sample.sampleRate }
    }
    const folded = new Float32Array(left.length)
    for (let i = 0; i < folded.length; i += 1) folded[i] = 0.5 * (left[i] + (right[i] ?? 0))
    return { channels: [folded], sampleRate: sample.sampleRate }
  })
  const fields = encodeZoneFields(plan.zones, plan.samples, (name) => sizes[name])
  return { plan, load: { samples: prepared, fields } }
}
