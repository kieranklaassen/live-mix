// The Decent Sampler preset format (`.dspreset`): an XML file with <groups>,
// <group> and <sample> elements. `parseDspreset` reads what places sounds on
// keys into a zone map; `writeDspreset` writes one back out. The rest of a
// preset (its interface, effects, modulators, MIDI bindings) is counted and
// reported, not fatal.
//
// Read, on <sample> and inherited from its <group> and from <groups>: path,
// rootNote, loNote, hiNote, loVel, hiVel, start, end, tuning (semitones),
// volume (linear, or "3dB"), pan, loopEnabled, loopStart, loopEnd,
// loopCrossfade, seqMode, seqPosition, seqLength, pitchKeyTrack, trigger;
// plus globalTuning on <groups> and groupTuning on <group>, and attack and
// release as hints.
//
// Written from the format's published description and not checked against
// presets made by other tools (docs/instrument-formats.md lists what that leaves open).

import {
  formatNumber,
  mostCommon,
  parseKey,
  Tally,
  type ParsedInstrument,
  type WrittenInstrument,
} from './report'
import { encodeXmlAttribute, parseXml, type XmlElement } from './xml'
import { normalizeZoneMap, type Zone, type ZoneMap } from './zone-map'

export interface DspresetReadOptions {
  /** A name for the instrument (the format keeps none in the preset). */
  name?: string
}

/** Attributes read from a <sample>, its <group> or <groups>, the nearest one winning. */
const INHERITED = new Set([
  'path',
  'rootNote',
  'loNote',
  'hiNote',
  'loVel',
  'hiVel',
  'start',
  'end',
  'tuning',
  'pan',
  'loopEnabled',
  'loopStart',
  'loopEnd',
  'loopCrossfade',
  'seqMode',
  'seqPosition',
  'seqLength',
  'pitchKeyTrack',
  'trigger',
  'attack',
  'release',
])

/** Attributes that are read, but mean something of their own at each level. */
const LEVELLED = new Set(['volume', 'globalTuning', 'groupTuning'])

/** Attributes that say nothing about the sound. */
const DESCRIPTIVE = new Set(['name', 'enabled'])

const isTrue = (value: string | undefined): boolean =>
  value !== undefined && ['true', '1', 'yes'].includes(value.trim().toLowerCase())

/** A volume as the format writes it: a linear factor, or decibels with a `dB` suffix. Returns dB. */
function volumeDb(text: string | undefined): number | undefined {
  if (text === undefined) return 0
  const decibels = /^\s*(-?\d+(?:\.\d+)?)\s*db\s*$/i.exec(text)
  if (decibels) return Number(decibels[1])
  const linear = Number(text)
  if (text.trim() === '' || !Number.isFinite(linear) || linear < 0) return undefined
  return linear === 0 ? -96 : 20 * Math.log10(linear)
}

/** Read a `.dspreset` file's text into a zone map. Never throws. */
export function parseDspreset(text: string, options: DspresetReadOptions = {}): ParsedInstrument {
  const document = parseXml(text)
  const warnings = [...document.warnings]
  const unsupported = new Tally()
  const zones: Zone[] = []
  const attacks: number[] = []
  const releases: number[] = []
  const robins = new Map<string, number>()
  let namedKeys = false

  const root = document.roots.find((element) => element.name === 'DecentSampler')
  if (!root) warnings.push('no <DecentSampler> element was found')

  const note = (attributes: (string | undefined)[]): string | undefined =>
    attributes.find((value) => value !== undefined)

  const readSample = (sample: XmlElement, group: XmlElement, groups: XmlElement) => {
    const levels = [sample, group, groups]
    const get = (name: string): string | undefined =>
      note(levels.map((element) => element.attributes[name]))
    const number = (name: string, fallback: number): number => {
      const value = get(name)
      if (value === undefined) return fallback
      const parsed = Number(value)
      if (value.trim() !== '' && Number.isFinite(parsed)) return parsed
      warnings.push(`${name}="${value}" is not a number`)
      return fallback
    }
    const key = (name: string, fallback: number): number => {
      const value = get(name)
      if (value === undefined) return fallback
      // A note name here is read with middle C as C4, which the format does not promise.
      const parsed = parseKey(value)
      if (parsed === undefined) {
        warnings.push(`${name}="${value}" is not a key`)
        return fallback
      }
      if (!/^\s*-?\d+\s*$/.test(value)) namedKeys = true
      return parsed
    }
    for (const [element, label] of [
      [sample, 'sample'],
      [group, 'group'],
      [groups, 'groups'],
    ] as const) {
      for (const name of Object.keys(element.attributes)) {
        if (!INHERITED.has(name) && !LEVELLED.has(name) && !DESCRIPTIVE.has(name)) {
          unsupported.add(`${label}@${name}`)
        }
      }
    }
    for (const child of sample.children) unsupported.add(`<${child.name}> in <sample>`)

    const path = get('path')
    if (path === undefined || path === '') {
      warnings.push('a <sample> without a path was left out')
      return
    }
    const trigger = (get('trigger') ?? 'attack').toLowerCase()
    if (trigger !== 'attack') {
      unsupported.add(`trigger=${trigger}`)
      return
    }
    const rootKey = key('rootNote', 60)
    const zone: Zone = {
      sample: path.replace(/\\/g, '/'),
      rootKey,
      loKey: key('loNote', 0),
      hiKey: key('hiNote', 127),
    }
    const loVel = number('loVel', 0)
    const hiVel = number('hiVel', 127)
    if (loVel !== 0 || hiVel !== 127) {
      zone.loVel = loVel
      zone.hiVel = hiVel
    }
    // Semitones, at three levels that add up.
    const semitones =
      number('tuning', 0) +
      (Number(groups.attributes.globalTuning) || 0) +
      (Number(group.attributes.groupTuning) || 0)
    if (semitones !== 0) zone.tuneCents = semitones * 100
    // Each level is a gain stage of its own.
    let gain = 0
    for (const element of levels) {
      const level = volumeDb(element.attributes.volume)
      if (level === undefined)
        warnings.push(`volume="${element.attributes.volume}" is not a volume`)
      else gain += level
    }
    if (gain !== 0) zone.gainDb = Math.max(-96, gain)
    const pan = number('pan', 0)
    if (pan !== 0) zone.pan = pan / 100
    const track = get('pitchKeyTrack')
    if (track !== undefined && !isTrue(track)) zone.pitchTrack = 0
    const start = number('start', 0)
    if (start > 0) zone.start = start
    // `end` and `loopEnd` name the last frame; the map's, one past it.
    const end = number('end', 0)
    if (end > 0) zone.end = end + 1
    if (isTrue(get('loopEnabled'))) {
      zone.loop = {}
      const loopStart = number('loopStart', 0)
      const loopEnd = number('loopEnd', 0)
      const crossfade = number('loopCrossfade', 0)
      if (loopStart > 0) zone.loop.start = loopStart
      if (loopEnd > 0) zone.loop.end = loopEnd + 1
      if (crossfade > 0) zone.loop.crossfade = crossfade
      if (get('loopStart') === undefined && get('loopEnd') === undefined) {
        warnings.push(
          `${zone.sample}: loop points kept in the audio file are not read; the whole sound loops`,
        )
      }
    }
    const mode = (get('seqMode') ?? 'always').toLowerCase()
    if (mode !== 'always') {
      // Takes chosen at random are played in turn instead.
      if (mode !== 'round_robin') unsupported.add(`seqMode=${mode}`)
      const position = number('seqPosition', 1)
      const length = number('seqLength', position)
      const signature = `${zone.loKey}:${zone.hiKey}:${loVel}:${hiVel}`
      let robin = robins.get(signature)
      if (robin === undefined) {
        robin = robins.size + 1
        robins.set(signature, robin)
      }
      zone.roundRobin = { group: robin, position, length: Math.max(length, position) }
    }
    const attack = get('attack')
    const release = get('release')
    if (attack !== undefined && Number.isFinite(Number(attack))) attacks.push(Number(attack))
    if (release !== undefined && Number.isFinite(Number(release))) releases.push(Number(release))
    zones.push(zone)
  }

  for (const element of root?.children ?? []) {
    if (element.name !== 'groups') {
      unsupported.add(`<${element.name}>`)
      continue
    }
    for (const group of element.children) {
      if (group.name !== 'group') {
        unsupported.add(`<${group.name}> in <groups>`)
        continue
      }
      if (group.attributes.enabled !== undefined && !isTrue(group.attributes.enabled)) {
        warnings.push('a group that is switched off was left out')
        continue
      }
      for (const sample of group.children) {
        if (sample.name === 'sample') readSample(sample, group, element)
        else unsupported.add(`<${sample.name}> in <group>`)
      }
    }
  }
  if (namedKeys) warnings.push('note names were read with middle C as C4')
  if (zones.length === 0) warnings.push('no playable sample was found')

  const hints: ParsedInstrument['hints'] = {}
  const attack = mostCommon(attacks)
  const release = mostCommon(releases)
  if (attack.value !== undefined) hints.attackSec = attack.value
  if (release.value !== undefined) hints.releaseSec = release.value
  if (!attack.uniform) warnings.push('attack differs between groups; the instrument has one attack')
  if (!release.uniform) {
    warnings.push('release differs between groups; the instrument has one release')
  }

  const map: ZoneMap = { zones }
  if (options.name) map.name = options.name
  return { map, hints, unsupported: unsupported.list(), warnings }
}

export interface DspresetWriteOptions {
  /** The sample rate of a sound, to write a crossfade given in seconds (the format wants frames). */
  sampleRate?: (sample: string) => number | undefined
}

/** Write a zone map as a `.dspreset` file's text: one <group> holding a <sample> a zone. */
export function writeDspreset(map: ZoneMap, options: DspresetWriteOptions = {}): WrittenInstrument {
  const { map: resolved, problems } = normalizeZoneMap(map)
  const warnings = [...problems]
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>']
  if (resolved.name) lines.push(`<!-- ${resolved.name.replace(/--+/g, '-')} -->`)
  lines.push('<DecentSampler minVersion="1.0.0">', '  <groups>', '    <group>')
  for (const zone of resolved.zones) {
    const attributes: string[] = []
    const put = (name: string, value: number | string) =>
      attributes.push(
        `${name}="${typeof value === 'number' ? formatNumber(value) : encodeXmlAttribute(value)}"`,
      )
    put('path', zone.sample)
    put('rootNote', zone.rootKey)
    put('loNote', zone.loKey)
    put('hiNote', zone.hiKey)
    put('loVel', zone.loVel)
    put('hiVel', zone.hiVel)
    if (zone.tuneCents !== 0) put('tuning', zone.tuneCents / 100)
    if (zone.gainDb !== 0) put('volume', `${formatNumber(zone.gainDb)}dB`)
    if (zone.pan !== 0) put('pan', zone.pan * 100)
    if (zone.pitchTrack !== 1) {
      put('pitchKeyTrack', 'false')
      if (zone.pitchTrack !== 0) {
        warnings.push(
          `${zone.sample}: pitch tracking is on or off here; ${zone.pitchTrack} was written as off`,
        )
      }
    }
    if (zone.start !== 0) put('start', zone.start)
    if (zone.end !== 0) put('end', zone.end - 1)
    if (zone.loop) {
      put('loopEnabled', 'true')
      put('loopStart', zone.loop.start)
      if (zone.loop.end !== 0) put('loopEnd', zone.loop.end - 1)
      else if (zone.end !== 0) put('loopEnd', zone.end - 1)
      else
        warnings.push(`${zone.sample}: a loop to the end of the sound is written without loopEnd`)
      if (zone.loop.crossfade > 0) {
        put('loopCrossfade', zone.loop.crossfade)
      } else if (zone.loop.crossfadeSec > 0) {
        const rate = options.sampleRate?.(zone.sample)
        if (rate !== undefined && rate > 0)
          put('loopCrossfade', Math.round(zone.loop.crossfadeSec * rate))
        else {
          warnings.push(
            `${zone.sample}: its crossfade is in seconds and its sample rate is not known; left out`,
          )
        }
      }
      if (zone.loop.mode === 'sustain') {
        warnings.push(`${zone.sample}: a loop that is left on release is written as a plain loop`)
      }
    }
    if (zone.roundRobin) {
      put('seqMode', 'round_robin')
      put('seqPosition', zone.roundRobin.position)
      put('seqLength', zone.roundRobin.length)
    }
    lines.push(`      <sample ${attributes.join(' ')}/>`)
  }
  lines.push('    </group>', '  </groups>', '</DecentSampler>')
  return { text: `${lines.join('\n')}\n`, warnings }
}
