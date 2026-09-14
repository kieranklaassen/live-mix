import { describe, expect, it } from 'vitest'

import {
  MIDI_14BIT_MAX,
  MidiDecoder,
  controlEventsFromMidi,
  decodeRelative,
  midiDataLength,
  parseMidiMessage,
} from '../midi'

const bytes = (...values: number[]): Uint8Array => Uint8Array.from(values)

describe('parseMidiMessage', () => {
  it('parses channel messages with 1-based channels', () => {
    expect(parseMidiMessage(bytes(0x90, 60, 100))).toEqual({
      type: 'note-on',
      channel: 1,
      note: 60,
      velocity: 100,
    })
    expect(parseMidiMessage(bytes(0x81, 60, 64))).toEqual({
      type: 'note-off',
      channel: 2,
      note: 60,
      velocity: 64,
    })
    expect(parseMidiMessage(bytes(0xb9, 74, 127))).toEqual({
      type: 'cc',
      channel: 10,
      controller: 74,
      value: 127,
    })
    expect(parseMidiMessage(bytes(0xe0, 0x7f, 0x7f))).toEqual({
      type: 'pitchbend',
      channel: 1,
      value: MIDI_14BIT_MAX,
    })
    expect(parseMidiMessage(bytes(0xe0, 0x00, 0x40))).toEqual({
      type: 'pitchbend',
      channel: 1,
      value: 8192,
    })
    expect(parseMidiMessage(bytes(0xd2, 90))).toEqual({ type: 'aftertouch', channel: 3, value: 90 })
    expect(parseMidiMessage(bytes(0xc0, 5))).toEqual({ type: 'program', channel: 1, program: 5 })
  })

  it('treats note-on with velocity 0 as note-off (MIDI convention)', () => {
    expect(parseMidiMessage(bytes(0x90, 60, 0))).toEqual({
      type: 'note-off',
      channel: 1,
      note: 60,
      velocity: 0,
    })
  })

  it('returns null for system messages, truncated data and stray data bytes', () => {
    expect(parseMidiMessage(bytes(0xf8))).toBeNull()
    expect(parseMidiMessage(bytes(0xf0, 0x7e, 0xf7))).toBeNull()
    expect(parseMidiMessage(bytes(0x90, 60))).toBeNull()
    expect(parseMidiMessage(bytes(0xb0, 74))).toBeNull()
    expect(parseMidiMessage(bytes(0x40, 60, 100))).toBeNull()
    expect(parseMidiMessage(bytes(0xa0, 60, 100))).toBeNull()
    expect(parseMidiMessage(bytes())).toBeNull()
  })

  it('masks data bytes to 7 bits', () => {
    expect(parseMidiMessage(bytes(0xb0, 0xff, 0xff))).toEqual({
      type: 'cc',
      channel: 1,
      controller: 127,
      value: 127,
    })
    expect(midiDataLength(0xc0)).toBe(1)
    expect(midiDataLength(0xd5)).toBe(1)
    expect(midiDataLength(0x90)).toBe(2)
  })
})

describe('controlEventsFromMidi', () => {
  it('normalises to 0..1 and keeps the raw value', () => {
    expect(controlEventsFromMidi({ type: 'cc', channel: 1, controller: 74, value: 64 })).toEqual([
      {
        kind: 'absolute',
        source: { kind: 'cc', channel: 1, controller: 74 },
        value: 64 / 127,
        raw: 64,
      },
    ])
    expect(controlEventsFromMidi({ type: 'note-on', channel: 1, note: 36, velocity: 127 })).toEqual(
      [{ kind: 'trigger', source: { kind: 'note', channel: 1, note: 36 }, on: true, value: 1 }],
    )
    expect(controlEventsFromMidi({ type: 'note-off', channel: 1, note: 36, velocity: 0 })).toEqual([
      { kind: 'trigger', source: { kind: 'note', channel: 1, note: 36 }, on: false, value: 0 },
    ])
    expect(controlEventsFromMidi({ type: 'pitchbend', channel: 2, value: 8192 })).toEqual([
      {
        kind: 'absolute',
        source: { kind: 'pitchbend', channel: 2 },
        value: 8192 / MIDI_14BIT_MAX,
        raw: 8192,
      },
    ])
    expect(controlEventsFromMidi({ type: 'aftertouch', channel: 2, value: 127 })).toEqual([
      { kind: 'absolute', source: { kind: 'aftertouch', channel: 2 }, value: 1, raw: 127 },
    ])
    expect(controlEventsFromMidi({ type: 'program', channel: 1, program: 3 })).toEqual([])
  })
})

describe('MidiDecoder', () => {
  it('splits buffers into messages and honours running status', () => {
    const decoder = new MidiDecoder()
    expect(decoder.messages(bytes(0x90, 60, 100, 62, 100, 0x80, 60, 0))).toEqual([
      { type: 'note-on', channel: 1, note: 60, velocity: 100 },
      { type: 'note-on', channel: 1, note: 62, velocity: 100 },
      { type: 'note-off', channel: 1, note: 60, velocity: 0 },
    ])
    // Running status carries across buffers.
    expect(decoder.messages(bytes(62, 0))).toEqual([
      { type: 'note-off', channel: 1, note: 62, velocity: 0 },
    ])
  })

  it('skips real-time and system messages without losing running status, drops stray data', () => {
    const decoder = new MidiDecoder()
    expect(decoder.messages(bytes(0xf8, 0xb0, 0xf8, 1, 2, 0xfe))).toEqual([
      { type: 'cc', channel: 1, controller: 1, value: 2 },
    ])
    expect(decoder.messages(bytes(3, 4))).toEqual([
      { type: 'cc', channel: 1, controller: 3, value: 4 },
    ])
    // Sysex ends running status; the data that follows it is dropped.
    expect(decoder.messages(bytes(0xf0, 0x7e, 0x01, 0xf7, 5, 6))).toEqual([])
    expect(decoder.messages(bytes(5, 6))).toEqual([])
    // A message split across buffers completes on the second; reset forgets it.
    expect(decoder.messages(bytes(0xb0, 7))).toEqual([])
    expect(decoder.messages(bytes(9))).toEqual([
      { type: 'cc', channel: 1, controller: 7, value: 9 },
    ])
    expect(decoder.messages(bytes(0xb0, 7))).toEqual([])
    decoder.reset()
    expect(decoder.messages(bytes(8, 9))).toEqual([])
  })

  it('ignores sysex payloads spanning buffers until the end byte', () => {
    const decoder = new MidiDecoder()
    expect(decoder.messages(bytes(0xf0, 0x43, 0x10))).toEqual([])
    expect(decoder.messages(bytes(0x4c, 0x00, 0xf7, 0x90, 60, 100))).toEqual([
      { type: 'note-on', channel: 1, note: 60, velocity: 100 },
    ])
  })

  it('pairs MSB and LSB into a 14-bit event and leaves the MSB as a 7-bit event too', () => {
    const decoder = new MidiDecoder()
    expect(decoder.decode(bytes(0xb0, 1, 0x40))).toEqual([
      {
        kind: 'absolute',
        source: { kind: 'cc', channel: 1, controller: 1 },
        value: 64 / 127,
        raw: 64,
      },
    ])
    expect(decoder.decode(bytes(0xb0, 33, 0x01))).toEqual([
      {
        kind: 'absolute',
        source: { kind: 'cc14', channel: 1, controller: 1 },
        value: ((64 << 7) | 1) / MIDI_14BIT_MAX,
        raw: (64 << 7) | 1,
      },
    ])
    // The next LSB alone (fine movement) still pairs with the remembered MSB.
    expect(decoder.decode(bytes(0xb0, 33, 0x02))[0]).toMatchObject({ raw: (64 << 7) | 2 })
  })

  it('keeps an LSB controller as a plain CC without a matching MSB, or when the MSB is stale', () => {
    const decoder = new MidiDecoder({ pairWindowMs: 10 })
    expect(decoder.decode(bytes(0xb0, 33, 5), 0)).toEqual([
      {
        kind: 'absolute',
        source: { kind: 'cc', channel: 1, controller: 33 },
        value: 5 / 127,
        raw: 5,
      },
    ])
    decoder.decode(bytes(0xb0, 1, 100), 0)
    expect(decoder.decode(bytes(0xb0, 33, 5), 5)[0].source).toEqual({
      kind: 'cc14',
      channel: 1,
      controller: 1,
    })
    expect(decoder.decode(bytes(0xb0, 33, 5), 100)[0].source).toEqual({
      kind: 'cc',
      channel: 1,
      controller: 33,
    })
    // Pairing is per channel.
    expect(decoder.decode(bytes(0xb1, 33, 5), 1)[0].source).toEqual({
      kind: 'cc',
      channel: 2,
      controller: 33,
    })
  })

  it('can be told not to pair', () => {
    const decoder = new MidiDecoder({ pair14Bit: false })
    decoder.decode(bytes(0xb0, 1, 100))
    expect(decoder.decode(bytes(0xb0, 33, 5))[0].source).toEqual({
      kind: 'cc',
      channel: 1,
      controller: 33,
    })
  })
})

describe('decodeRelative', () => {
  it("decodes two's complement, binary offset and sign-magnitude encoders", () => {
    expect(decodeRelative(1, 'twos-complement')).toBe(1)
    expect(decodeRelative(63, 'twos-complement')).toBe(63)
    expect(decodeRelative(127, 'twos-complement')).toBe(-1)
    expect(decodeRelative(65, 'twos-complement')).toBe(-63)
    expect(decodeRelative(64, 'binary-offset')).toBe(0)
    expect(decodeRelative(65, 'binary-offset')).toBe(1)
    expect(decodeRelative(63, 'binary-offset')).toBe(-1)
    expect(decodeRelative(1, 'sign-magnitude')).toBe(1)
    expect(decodeRelative(65, 'sign-magnitude')).toBe(-1)
    expect(decodeRelative(127, 'sign-magnitude')).toBe(-63)
    expect(decodeRelative(200, 'twos-complement')).toBe(-1)
    expect(decodeRelative(-3, 'twos-complement')).toBe(0)
  })
})
