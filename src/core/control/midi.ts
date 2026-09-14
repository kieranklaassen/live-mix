// MIDI bytes → messages → control events. `parseMidiMessage` is the pure
// per-message parser (note-on with velocity 0 is a note-off, channels are
// 1–16 as MIDI numbers them; ambient-live's `parseMidiEvent` widened to
// pitch bend and channel pressure). `MidiDecoder` adds the state a stream
// needs: running status and 14-bit CC pairs (MSB on 0–31, LSB on 32–63).
// Relative encoders are decoded by the mapping, not here, since the same CC
// byte is a position on one controller and a delta on another.

import { absoluteEvent, triggerEvent, type ControlEvent } from './event'

export type MidiMessage =
  | { type: 'note-on'; channel: number; note: number; velocity: number }
  | { type: 'note-off'; channel: number; note: number; velocity: number }
  | { type: 'cc'; channel: number; controller: number; value: number }
  /** 0–16383, centre 8192. */
  | { type: 'pitchbend'; channel: number; value: number }
  /** Channel pressure, 0–127. */
  | { type: 'aftertouch'; channel: number; value: number }
  | { type: 'program'; channel: number; program: number }

export const MIDI_14BIT_MAX = 16383

/** Parse one complete channel message; null for system messages or truncated data. */
export function parseMidiMessage(data: ArrayLike<number>): MidiMessage | null {
  if (data.length < 2) return null
  const status = data[0]
  if (status < 0x80 || status >= 0xf0) return null
  const command = status & 0xf0
  const channel = (status & 0x0f) + 1
  const first = data[1] & 0x7f
  switch (command) {
    case 0x80:
      return { type: 'note-off', channel, note: first, velocity: byteAt(data, 2) }
    case 0x90: {
      if (data.length < 3) return null
      const velocity = data[2] & 0x7f
      if (velocity === 0) return { type: 'note-off', channel, note: first, velocity: 0 }
      return { type: 'note-on', channel, note: first, velocity }
    }
    case 0xb0:
      if (data.length < 3) return null
      return { type: 'cc', channel, controller: first, value: data[2] & 0x7f }
    case 0xe0:
      if (data.length < 3) return null
      return { type: 'pitchbend', channel, value: ((data[2] & 0x7f) << 7) | first }
    case 0xd0:
      return { type: 'aftertouch', channel, value: first }
    case 0xc0:
      return { type: 'program', channel, program: first }
    default:
      // Polyphonic aftertouch (0xA0) has no control meaning here.
      return null
  }
}

function byteAt(data: ArrayLike<number>, index: number): number {
  return index < data.length ? data[index] & 0x7f : 0
}

/** Bytes a channel message of this status carries after the status byte. */
export function midiDataLength(status: number): number {
  const command = status & 0xf0
  return command === 0xc0 || command === 0xd0 ? 1 : 2
}

/** The control events one message yields, without 14-bit pairing. */
export function controlEventsFromMidi(message: MidiMessage): ControlEvent[] {
  switch (message.type) {
    case 'note-on':
      return [
        triggerEvent(
          { kind: 'note', channel: message.channel, note: message.note },
          true,
          message.velocity / 127,
        ),
      ]
    case 'note-off':
      return [
        triggerEvent({ kind: 'note', channel: message.channel, note: message.note }, false, 0),
      ]
    case 'cc':
      return [
        absoluteEvent(
          { kind: 'cc', channel: message.channel, controller: message.controller },
          message.value / 127,
          message.value,
        ),
      ]
    case 'pitchbend':
      return [
        absoluteEvent(
          { kind: 'pitchbend', channel: message.channel },
          message.value / MIDI_14BIT_MAX,
          message.value,
        ),
      ]
    case 'aftertouch':
      return [
        absoluteEvent(
          { kind: 'aftertouch', channel: message.channel },
          message.value / 127,
          message.value,
        ),
      ]
    case 'program':
      return []
    default: {
      const exhaustive: never = message
      return exhaustive
    }
  }
}

export interface MidiDecoderOptions {
  /**
   * Pair CC 0–31 with CC 32–63 into 14-bit events. When on, an LSB that
   * completes a pair is reported only as `cc14`; an LSB without a recent MSB
   * stays a plain `cc`. Default on.
   */
  pair14Bit?: boolean
  /**
   * With timestamps, an MSB older than this no longer pairs. Default 50 ms;
   * without timestamps the last MSB always pairs.
   */
  pairWindowMs?: number
}

interface PendingMsb {
  value: number
  timeMs: number | null
}

/** Stateful stream decoder: running status and 14-bit CC pairing. */
export class MidiDecoder {
  readonly pair14Bit: boolean
  readonly pairWindowMs: number
  private runningStatus: number | null = null
  /** Data bytes of the message in progress (carried across buffers). */
  private pending: number[] = []
  private inSysex = false
  private readonly msb = new Map<number, PendingMsb>()

  constructor(options: MidiDecoderOptions = {}) {
    this.pair14Bit = options.pair14Bit ?? true
    this.pairWindowMs = options.pairWindowMs ?? 50
  }

  /**
   * Split a stream into complete channel messages, byte by byte: running
   * status is honoured, real-time bytes (`0xF8`–`0xFF`) may sit anywhere and
   * are skipped, system common and sysex end running status and are skipped,
   * stray data bytes without a status are dropped, and a message split
   * across two buffers completes on the second.
   */
  messages(data: ArrayLike<number>): MidiMessage[] {
    const out: MidiMessage[] = []
    for (const byte of Array.from(data)) {
      if (byte >= 0xf8) continue
      if (byte >= 0xf0) {
        this.runningStatus = null
        this.pending = []
        this.inSysex = byte === 0xf0
        continue
      }
      if (byte >= 0x80) {
        this.inSysex = false
        this.runningStatus = byte
        this.pending = []
        continue
      }
      if (this.inSysex || this.runningStatus === null) continue
      this.pending.push(byte)
      if (this.pending.length === midiDataLength(this.runningStatus)) {
        const message = parseMidiMessage([this.runningStatus, ...this.pending])
        this.pending = []
        if (message) out.push(message)
      }
    }
    return out
  }

  /** Control events for a buffer, with 14-bit pairs folded (`timeMs` from the port's `timeStamp`). */
  decode(data: ArrayLike<number>, timeMs?: number): ControlEvent[] {
    const events: ControlEvent[] = []
    for (const message of this.messages(data)) events.push(...this.eventsFor(message, timeMs))
    return events
  }

  /** Control events for one already-parsed message. */
  eventsFor(message: MidiMessage, timeMs?: number): ControlEvent[] {
    if (message.type !== 'cc' || !this.pair14Bit) return controlEventsFromMidi(message)
    const key = message.channel * 128 + (message.controller & 31)
    if (message.controller < 32) {
      this.msb.set(key, { value: message.value, timeMs: timeMs ?? null })
      return controlEventsFromMidi(message)
    }
    if (message.controller < 64) {
      const pending = this.msb.get(key)
      if (pending && this.withinWindow(pending, timeMs)) {
        const value = (pending.value << 7) | message.value
        return [
          absoluteEvent(
            { kind: 'cc14', channel: message.channel, controller: message.controller - 32 },
            value / MIDI_14BIT_MAX,
            value,
          ),
        ]
      }
    }
    return controlEventsFromMidi(message)
  }

  /** Forget running status and pending MSBs (port change, reconnect). */
  reset(): void {
    this.runningStatus = null
    this.pending = []
    this.inSysex = false
    this.msb.clear()
  }

  private withinWindow(pending: PendingMsb, timeMs: number | undefined): boolean {
    if (pending.timeMs === null || timeMs === undefined) return true
    return timeMs - pending.timeMs <= this.pairWindowMs
  }
}

// --- Relative encoders -----------------------------------------------------------

/**
 * How an endless encoder writes its delta into a 7-bit CC value:
 * - `twos-complement`: 1…63 = +1…+63, 127…65 = −1…−63 (Ableton "Relative (2's Comp.)")
 * - `binary-offset`: 64 = 0, 65 = +1, 63 = −1 (Ableton "Relative (Binary Offset)")
 * - `sign-magnitude`: 1…63 = +1…+63, 65…127 = −1…−63 (Ableton "Relative (Signed Bit)")
 */
export type RelativeEncoding = 'twos-complement' | 'binary-offset' | 'sign-magnitude'

export const RELATIVE_ENCODINGS: readonly RelativeEncoding[] = [
  'twos-complement',
  'binary-offset',
  'sign-magnitude',
]

/** Signed step count in a raw 7-bit CC value under `encoding`. */
export function decodeRelative(raw: number, encoding: RelativeEncoding): number {
  const value = Math.max(0, Math.min(127, Math.trunc(raw)))
  switch (encoding) {
    case 'twos-complement':
      return value >= 64 ? value - 128 : value
    case 'binary-offset':
      return value - 64
    case 'sign-magnitude':
      return value >= 64 ? -(value - 64) : value
    default: {
      const exhaustive: never = encoding
      return exhaustive
    }
  }
}
