// SFZ: the plain-text instrument format (sfzformat.com). `parseSfz` reads the
// opcodes that place sounds on keys into a zone map; `writeSfz` writes one
// back out. Everything else a file asks for (filters, envelopes per region,
// controllers, effects) is counted and reported, not fatal.
//
// Read: sample, default_path, key, lokey, hikey, pitch_keycenter, lovel,
// hivel, tune, transpose, pitch_keytrack, volume, amplitude, pan, offset, end,
// loop_mode, loop_start, loop_end, loop_crossfade, seq_length, seq_position,
// note_offset, octave_offset, ampeg_attack and ampeg_release (as hints);
// <control>, <global>, <master>, <group> and <region> inheritance; #define,
// and #include through a resolver the caller gives.

import {
  formatNumber,
  mostCommon,
  parseKey,
  Tally,
  type ParsedInstrument,
  type WrittenInstrument,
} from './report'
import { normalizeZoneMap, type Zone, type ZoneMap } from './zone-map'

export interface SfzReadOptions {
  /** The text of a file an `#include` names, or undefined when there is none. Without it includes are reported. */
  include?: (path: string) => string | undefined
  /** A name for the instrument (the format has none). */
  name?: string
}

export interface SfzWriteOptions {
  /** The sample rate of a sound, to write a crossfade given in frames (the format wants seconds). */
  sampleRate?: (sample: string) => number | undefined
}

type Opcodes = Map<string, string>

const HEADERS = new Set(['control', 'global', 'master', 'group', 'region'])
const IGNORED_HEADERS = new Set(['curve', 'effect', 'midi', 'sample'])

// A header, or an opcode name with its `=`: an opcode starts a line or follows a space.
const TOKEN = /<([A-Za-z_]+)>|(?:^|\s)([A-Za-z_][A-Za-z0-9_#$]*)=/g

const MAX_INCLUDE_DEPTH = 16

interface Scan {
  /** `header` or `opcode` events in file order. */
  events: ({ header: string } | { name: string; value: string })[]
  warnings: string[]
}

function stripComment(line: string): string {
  const at = line.search(/(^|\s)\/\//)
  return at < 0 ? line : line.slice(0, at)
}

function scan(
  text: string,
  options: SfzReadOptions,
  defines: Map<string, string>,
  out: Scan,
  depth: number,
): void {
  const cleaned = text.replace(/^\uFEFF/, '').replace(/\/\*[\s\S]*?\*\//g, ' ')
  for (const raw of cleaned.split(/\r\n|\r|\n/)) {
    let line = stripComment(raw).trim()
    if (line === '') continue
    const define = /^#define\s+(\$[A-Za-z0-9_]+)\s+(.*)$/.exec(line)
    if (define) {
      defines.set(define[1], define[2].trim())
      continue
    }
    const include = /^#include\s+"([^"]*)"/.exec(line)
    if (include) {
      const included = depth < MAX_INCLUDE_DEPTH ? options.include?.(include[1]) : undefined
      if (included === undefined) out.warnings.push(`#include "${include[1]}" was not read`)
      else scan(included, options, defines, out, depth + 1)
      continue
    }
    if (line.startsWith('#')) {
      out.warnings.push(`directive not understood: ${line.split(/\s+/)[0]}`)
      continue
    }
    // Longest names first, so $KEY2 is not read as $KEY followed by 2.
    for (const name of [...defines.keys()].sort((a, b) => b.length - a.length)) {
      line = line.split(name).join(defines.get(name) ?? '')
    }
    // A header may sit right against the opcode after it.
    line = line.replace(/<([A-Za-z_]+)>/g, ' <$1> ').trim()
    const tokens = [...line.matchAll(TOKEN)]
    if (tokens.length === 0 || (tokens[0].index ?? 0) > 0) {
      const stray = line.slice(0, tokens[0]?.index ?? line.length).trim()
      if (stray !== '') out.warnings.push(`text that is no opcode: ${stray.slice(0, 40)}`)
    }
    tokens.forEach((token, index) => {
      if (token[1] !== undefined) {
        out.events.push({ header: token[1].toLowerCase() })
        return
      }
      const from = (token.index ?? 0) + token[0].length
      const to = tokens[index + 1]?.index ?? line.length
      out.events.push({ name: token[2].toLowerCase(), value: line.slice(from, to).trim() })
    })
  }
}

const ALIASES: Readonly<Record<string, string>> = {
  loopmode: 'loop_mode',
  loopstart: 'loop_start',
  loopend: 'loop_end',
}

function joinPath(base: string, sample: string): string {
  return `${base}${sample}`.replace(/\\/g, '/')
}

/** Read an SFZ file's text into a zone map. Never throws. */
export function parseSfz(text: string, options: SfzReadOptions = {}): ParsedInstrument {
  const scanned: Scan = { events: [], warnings: [] }
  scan(typeof text === 'string' ? text : '', options, new Map(), scanned, 0)
  const warnings = scanned.warnings
  const unsupported = new Tally()
  const zones: Zone[] = []
  const attacks: number[] = []
  const releases: number[] = []
  const groups = new Map<string, number>()

  const levels: Record<string, Opcodes> = {
    control: new Map(),
    global: new Map(),
    master: new Map(),
    group: new Map(),
  }
  let region: Opcodes | null = null
  let current: Opcodes | null = null
  let sampleless = 0

  const flush = () => {
    if (!region) return
    const layers = [levels.global, levels.master, levels.group, region]
    region = null

    const numeric = (name: string, value: string): number | undefined => {
      const parsed = Number(value)
      if (value.trim() !== '' && Number.isFinite(parsed)) return parsed
      warnings.push(`${name}=${value} is not a number`)
      return undefined
    }
    const control = levels.control
    const shift =
      (Number(control.get('note_offset') ?? 0) || 0) +
      12 * (Number(control.get('octave_offset') ?? 0) || 0)
    const key = (name: string, value: string): number | undefined => {
      const parsed = parseKey(value)
      if (parsed === undefined) warnings.push(`${name}=${value} is not a key`)
      return parsed === undefined ? undefined : parsed + shift
    }

    let sample: string | undefined
    let loKey = 0
    let hiKey = 127
    let rootKey = 60
    let loVel = 0
    let hiVel = 127
    let tune = 0
    let transpose = 0
    let volume = 0
    let amplitude = 100
    let pan = 0
    let track = 100
    let offset = 0
    let end: number | undefined
    let loopMode: string | undefined
    let loopStart: number | undefined
    let loopEnd: number | undefined
    let crossfade = 0
    let seqLength = 1
    let seqPosition = 1
    let attack: number | undefined
    let release: number | undefined
    let trigger = 'attack'
    const asked = new Set<string>()

    // Each level in turn, each opcode in the order written: a later one wins.
    for (const layer of layers) {
      for (const [name, value] of layer) {
        const set = (assign: (parsed: number) => void) => {
          const parsed = numeric(name, value)
          if (parsed !== undefined) assign(parsed)
        }
        const setKey = (assign: (parsed: number) => void) => {
          const parsed = key(name, value)
          if (parsed !== undefined) assign(parsed)
        }
        switch (name) {
          case 'sample':
            sample = value
            break
          case 'key':
            setKey((parsed) => {
              loKey = hiKey = rootKey = parsed
            })
            break
          case 'lokey':
            setKey((parsed) => (loKey = parsed))
            break
          case 'hikey':
            setKey((parsed) => (hiKey = parsed))
            break
          case 'pitch_keycenter':
            if (value.toLowerCase() === 'sample') asked.add('pitch_keycenter=sample')
            else setKey((parsed) => (rootKey = parsed))
            break
          case 'lovel':
            set((parsed) => (loVel = parsed))
            break
          case 'hivel':
            set((parsed) => (hiVel = parsed))
            break
          case 'tune':
            set((parsed) => (tune = parsed))
            break
          case 'transpose':
            set((parsed) => (transpose = parsed))
            break
          case 'pitch_keytrack':
            set((parsed) => (track = parsed))
            break
          case 'volume':
            set((parsed) => (volume = parsed))
            break
          case 'amplitude':
            set((parsed) => (amplitude = parsed))
            break
          case 'pan':
            set((parsed) => (pan = parsed))
            break
          case 'offset':
            set((parsed) => (offset = parsed))
            break
          case 'end':
            set((parsed) => (end = parsed))
            break
          case 'loop_mode':
            loopMode = value.toLowerCase()
            break
          case 'loop_start':
            set((parsed) => (loopStart = parsed))
            break
          case 'loop_end':
            set((parsed) => (loopEnd = parsed))
            break
          case 'loop_crossfade':
            set((parsed) => (crossfade = parsed))
            break
          case 'seq_length':
            set((parsed) => (seqLength = parsed))
            break
          case 'seq_position':
            set((parsed) => (seqPosition = parsed))
            break
          case 'ampeg_attack':
            set((parsed) => (attack = parsed))
            break
          case 'ampeg_release':
            set((parsed) => (release = parsed))
            break
          case 'trigger':
            trigger = value.toLowerCase()
            break
          default:
            asked.add(name)
        }
      }
    }
    for (const name of asked) unsupported.add(name)

    if (sample === undefined || sample === '') {
      sampleless += 1
      return
    }
    if (sample.startsWith('*')) {
      unsupported.add(`sample=${sample}`)
      return
    }
    // A region switched off: a key range of -1, or an end of -1.
    if (loKey - shift < 0 || hiKey - shift < 0 || end === -1) return
    // A sound for the moment a key is let go (or a legato one) has no place in the map.
    if (trigger !== 'attack') {
      unsupported.add(`trigger=${trigger}`)
      return
    }

    const zone: Zone = {
      sample: joinPath(control.get('default_path') ?? '', sample),
      rootKey,
      loKey,
      hiKey,
    }
    if (loVel !== 0 || hiVel !== 127) {
      zone.loVel = loVel
      zone.hiVel = hiVel
    }
    const cents = tune + 100 * transpose
    if (cents !== 0) zone.tuneCents = cents
    const gain = volume + (amplitude > 0 ? 20 * Math.log10(amplitude / 100) : -96)
    if (gain !== 0) zone.gainDb = gain
    if (pan !== 0) zone.pan = pan / 100
    if (track !== 100) {
      if (track < 0 || track > 100) warnings.push(`pitch_keytrack=${track} was brought into 0..100`)
      zone.pitchTrack = Math.min(1, Math.max(0, track / 100))
    }
    if (offset > 0) zone.start = offset
    // The format's `end` and `loop_end` name the last frame; the map's, one past it.
    if (end !== undefined && end > 0) zone.end = end + 1
    const looping = loopMode === 'loop_continuous' || loopMode === 'loop_sustain'
    if (looping) {
      zone.loop = {}
      if (loopStart !== undefined && loopStart > 0) zone.loop.start = loopStart
      if (loopEnd !== undefined && loopEnd > 0) zone.loop.end = loopEnd + 1
      if (crossfade > 0) zone.loop.crossfadeSec = crossfade
      if (loopMode === 'loop_sustain') zone.loop.mode = 'sustain'
      if (loopStart === undefined && loopEnd === undefined) {
        warnings.push(
          `${zone.sample}: loop points kept in the audio file are not read; the whole sound loops`,
        )
      }
    } else if (loopMode === 'one_shot') {
      unsupported.add('loop_mode=one_shot')
    } else if (loopMode !== undefined && loopMode !== 'no_loop') {
      warnings.push(`loop_mode=${loopMode} is not a loop mode`)
    } else if (loopMode === undefined && (loopStart !== undefined || loopEnd !== undefined)) {
      warnings.push(`${zone.sample}: loop points without a loop_mode do not loop`)
    }
    if (seqLength > 1 || seqPosition > 1) {
      // Takes of the same keys and velocities alternate with each other.
      const signature = `${loKey}:${hiKey}:${loVel}:${hiVel}:${seqLength}`
      let group = groups.get(signature)
      if (group === undefined) {
        group = groups.size + 1
        groups.set(signature, group)
      }
      zone.roundRobin = { group, position: seqPosition, length: Math.max(seqLength, seqPosition) }
    }
    if (attack !== undefined) attacks.push(attack)
    if (release !== undefined) releases.push(release)
    zones.push(zone)
  }

  for (const event of scanned.events) {
    if ('header' in event) {
      flush()
      const header = event.header
      if (header === 'region') {
        region = new Map()
        current = region
      } else if (HEADERS.has(header)) {
        // A new section starts over, and so does everything nested in it.
        if (header === 'global') levels.global = new Map()
        if (header === 'global' || header === 'master') levels.master = new Map()
        if (header !== 'control') levels.group = new Map()
        current = levels[header]
      } else {
        if (IGNORED_HEADERS.has(header)) unsupported.add(`<${header}>`)
        else warnings.push(`<${header}> is not a section this reader knows`)
        current = null
      }
      continue
    }
    if (!current) continue
    const name = ALIASES[event.name] ?? event.name
    // Written again in the same section, an opcode moves to its new place in the order.
    current.delete(name)
    current.set(name, event.value)
  }
  flush()

  for (const name of levels.control.keys()) {
    if (!['default_path', 'note_offset', 'octave_offset'].includes(name)) {
      unsupported.add(`<control> ${name}`)
    }
  }
  if (sampleless > 0) warnings.push(`${sampleless} region(s) without a sample were left out`)
  if (zones.length === 0) warnings.push('no playable region was found')

  const hints: ParsedInstrument['hints'] = {}
  const attack = mostCommon(attacks)
  const release = mostCommon(releases)
  if (attack.value !== undefined) hints.attackSec = attack.value
  if (release.value !== undefined) hints.releaseSec = release.value
  if (!attack.uniform || (attacks.length > 0 && attacks.length < zones.length)) {
    warnings.push('ampeg_attack differs between regions; the instrument has one attack')
  }
  if (!release.uniform || (releases.length > 0 && releases.length < zones.length)) {
    warnings.push('ampeg_release differs between regions; the instrument has one release')
  }

  const map: ZoneMap = { zones }
  if (options.name) map.name = options.name
  return { map, hints, unsupported: unsupported.list(), warnings }
}

/** The directory every sample shares, with its trailing slash, or ''. */
function sharedDirectory(samples: readonly string[]): string {
  if (samples.length === 0) return ''
  const directory = (path: string) => path.slice(0, path.lastIndexOf('/') + 1)
  const first = directory(samples[0])
  return samples.every((sample) => directory(sample) === first) ? first : ''
}

/** Write a zone map as SFZ text: one `<region>` a zone. */
export function writeSfz(map: ZoneMap, options: SfzWriteOptions = {}): WrittenInstrument {
  const { map: resolved, problems } = normalizeZoneMap(map)
  const warnings = [...problems]
  const lines: string[] = []
  if (resolved.name) lines.push(`// ${resolved.name.replace(/[\r\n]+/g, ' ')}`)
  const base = sharedDirectory(resolved.zones.map((zone) => zone.sample))
  if (base !== '') lines.push(`<control> default_path=${base}`)

  for (const zone of resolved.zones) {
    const opcodes: string[] = []
    const put = (name: string, value: number | string) =>
      opcodes.push(`${name}=${typeof value === 'number' ? formatNumber(value) : value}`)
    const sample = zone.sample.slice(base.length)
    if (/\s[A-Za-z_][A-Za-z0-9_]*=|[<\r\n]|^\*/.test(sample) || /\s\/\//.test(sample)) {
      warnings.push(`"${zone.sample}" will not read back as one file name`)
    }
    put('sample', sample)
    put('lokey', zone.loKey)
    put('hikey', zone.hiKey)
    put('pitch_keycenter', zone.rootKey)
    if (zone.loVel !== 0 || zone.hiVel !== 127) {
      put('lovel', zone.loVel)
      put('hivel', zone.hiVel)
    }
    if (zone.tuneCents !== 0) {
      // `tune` is cents within a semitone; whole semitones go to `transpose`.
      const semitones = Math.trunc(zone.tuneCents / 100)
      if (semitones !== 0) put('transpose', semitones)
      if (zone.tuneCents - 100 * semitones !== 0) put('tune', zone.tuneCents - 100 * semitones)
    }
    if (zone.gainDb !== 0) put('volume', zone.gainDb)
    if (zone.pan !== 0) put('pan', zone.pan * 100)
    if (zone.pitchTrack !== 1) put('pitch_keytrack', zone.pitchTrack * 100)
    if (zone.start !== 0) put('offset', zone.start)
    if (zone.end !== 0) put('end', zone.end - 1)
    if (zone.loop) {
      put('loop_mode', zone.loop.mode === 'sustain' ? 'loop_sustain' : 'loop_continuous')
      put('loop_start', zone.loop.start)
      if (zone.loop.end !== 0) put('loop_end', zone.loop.end - 1)
      else if (zone.end !== 0) put('loop_end', zone.end - 1)
      else
        warnings.push(`${zone.sample}: a loop to the end of the sound is written without loop_end`)
      if (zone.loop.crossfadeSec > 0) {
        put('loop_crossfade', zone.loop.crossfadeSec)
      } else if (zone.loop.crossfade > 0) {
        const rate = options.sampleRate?.(zone.sample)
        if (rate !== undefined && rate > 0) put('loop_crossfade', zone.loop.crossfade / rate)
        else {
          warnings.push(
            `${zone.sample}: its crossfade is in frames and its sample rate is not known; left out`,
          )
        }
      }
    }
    if (zone.roundRobin) {
      put('seq_length', zone.roundRobin.length)
      put('seq_position', zone.roundRobin.position)
    }
    lines.push(`<region> ${opcodes.join(' ')}`)
  }
  return { text: `${lines.join('\n')}\n`, warnings }
}
