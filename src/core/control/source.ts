// Where a control change comes from: a MIDI message (note, CC, 14-bit CC
// pair, pitch bend, channel pressure) on a channel, or one argument of an OSC
// message at an address pattern. Sources are plain data with a string key, so
// a mapping can be stored and compared; `sourceMatches` decides whether an
// incoming event belongs to a source (channel 0 is omni, OSC addresses match
// as OSC 1.0 patterns).

import { matchOscAddress } from './osc-address'

/** MIDI channel as MIDI numbers them, 1–16; `0` matches every channel (omni). */
export type MidiChannel = number

export const MIDI_OMNI: MidiChannel = 0

export type MidiSource =
  | { kind: 'note'; channel: MidiChannel; note: number }
  | { kind: 'cc'; channel: MidiChannel; controller: number }
  /** A 14-bit pair: MSB on `controller` (0–31), LSB on `controller + 32`. */
  | { kind: 'cc14'; channel: MidiChannel; controller: number }
  | { kind: 'pitchbend'; channel: MidiChannel }
  /** Channel pressure (mono aftertouch). */
  | { kind: 'aftertouch'; channel: MidiChannel }

/** One argument (`arg`, 0-based) of every OSC message whose address matches `address`. */
export interface OscSource {
  kind: 'osc'
  /** Concrete address or an OSC 1.0 address pattern (`?`, `*`, `[a-c]`, `{x,y}`). */
  address: string
  arg: number
}

export type ControlSource = MidiSource | OscSource

export type ControlSourceKind = ControlSource['kind']

export function sourceKey(source: ControlSource): string {
  switch (source.kind) {
    case 'note':
      return `note:${source.channel}:${source.note}`
    case 'cc':
      return `cc:${source.channel}:${source.controller}`
    case 'cc14':
      return `cc14:${source.channel}:${source.controller}`
    case 'pitchbend':
      return `pitchbend:${source.channel}`
    case 'aftertouch':
      return `aftertouch:${source.channel}`
    case 'osc':
      return `osc:${source.address}:${source.arg}`
    default: {
      const exhaustive: never = source
      return exhaustive
    }
  }
}

export function sameSource(a: ControlSource, b: ControlSource): boolean {
  return sourceKey(a) === sourceKey(b)
}

function channelLabel(channel: MidiChannel): string {
  return channel === MIDI_OMNI ? 'any ch' : `ch ${channel}`
}

/** Human-readable label, e.g. `CC 74 · ch 1`. */
export function describeSource(source: ControlSource): string {
  switch (source.kind) {
    case 'note':
      return `Note ${source.note} · ${channelLabel(source.channel)}`
    case 'cc':
      return `CC ${source.controller} · ${channelLabel(source.channel)}`
    case 'cc14':
      return `CC ${source.controller}/${source.controller + 32} (14-bit) · ${channelLabel(source.channel)}`
    case 'pitchbend':
      return `Pitch bend · ${channelLabel(source.channel)}`
    case 'aftertouch':
      return `Aftertouch · ${channelLabel(source.channel)}`
    case 'osc':
      return `OSC ${source.address}[${source.arg}]`
    default: {
      const exhaustive: never = source
      return exhaustive
    }
  }
}

export function isMidiSource(source: ControlSource): source is MidiSource {
  return source.kind !== 'osc'
}

function channelMatches(pattern: MidiChannel, channel: MidiChannel): boolean {
  return pattern === MIDI_OMNI || pattern === channel
}

/**
 * Does an event from `actual` belong to the mapping's `pattern` source? The
 * pattern may be omni (channel 0) or an OSC address pattern; `actual` is
 * always concrete (the decoders never emit patterns).
 */
export function sourceMatches(pattern: ControlSource, actual: ControlSource): boolean {
  switch (pattern.kind) {
    case 'note':
      return (
        actual.kind === 'note' &&
        pattern.note === actual.note &&
        channelMatches(pattern.channel, actual.channel)
      )
    case 'cc':
      return (
        actual.kind === 'cc' &&
        pattern.controller === actual.controller &&
        channelMatches(pattern.channel, actual.channel)
      )
    case 'cc14':
      return (
        actual.kind === 'cc14' &&
        pattern.controller === actual.controller &&
        channelMatches(pattern.channel, actual.channel)
      )
    case 'pitchbend':
      return actual.kind === 'pitchbend' && channelMatches(pattern.channel, actual.channel)
    case 'aftertouch':
      return actual.kind === 'aftertouch' && channelMatches(pattern.channel, actual.channel)
    case 'osc':
      return (
        actual.kind === 'osc' &&
        pattern.arg === actual.arg &&
        matchOscAddress(pattern.address, actual.address)
      )
    default: {
      const exhaustive: never = pattern
      return exhaustive
    }
  }
}

function isChannel(value: unknown): value is MidiChannel {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 16
}

function isDataByte(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 127
}

function isArgIndex(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

/** Validate an untrusted value (parsed JSON) as a `ControlSource`; null when malformed. */
export function parseControlSource(value: unknown): ControlSource | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  switch (record.kind) {
    case 'note':
      return isChannel(record.channel) && isDataByte(record.note)
        ? { kind: 'note', channel: record.channel, note: record.note }
        : null
    case 'cc':
      return isChannel(record.channel) && isDataByte(record.controller)
        ? { kind: 'cc', channel: record.channel, controller: record.controller }
        : null
    case 'cc14':
      return isChannel(record.channel) && isDataByte(record.controller) && record.controller < 32
        ? { kind: 'cc14', channel: record.channel, controller: record.controller }
        : null
    case 'pitchbend':
      return isChannel(record.channel) ? { kind: 'pitchbend', channel: record.channel } : null
    case 'aftertouch':
      return isChannel(record.channel) ? { kind: 'aftertouch', channel: record.channel } : null
    case 'osc':
      return typeof record.address === 'string' &&
        record.address.startsWith('/') &&
        isArgIndex(record.arg)
        ? { kind: 'osc', address: record.address, arg: record.arg }
        : null
    default:
      return null
  }
}
