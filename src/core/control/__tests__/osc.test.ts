import { describe, expect, it } from 'vitest'

import { isOscPattern, matchOscAddress, oscPatternToRegExp } from '../osc-address'
import {
  OSC_IMMEDIATELY,
  OscDecodeError,
  controlEventsFromOsc,
  decodeOscMessage,
  decodeOscPacket,
  encodeOscBundle,
  encodeOscMessage,
  flattenOscPacket,
  isOscBundle,
  oscTimeTagToDate,
  type OscMessage,
} from '../osc'

const bytes = (...values: number[]): Uint8Array => Uint8Array.from(values)

describe('OSC address patterns', () => {
  it('matches exact addresses without pattern characters', () => {
    expect(isOscPattern('/1/fader1')).toBe(false)
    expect(matchOscAddress('/1/fader1', '/1/fader1')).toBe(true)
    expect(matchOscAddress('/1/fader1', '/1/fader10')).toBe(false)
  })

  it('supports ?, *, character classes and alternatives, none crossing /', () => {
    expect(matchOscAddress('/1/fader?', '/1/fader7')).toBe(true)
    expect(matchOscAddress('/1/fader?', '/1/fader10')).toBe(false)
    expect(matchOscAddress('/1/*', '/1/fader10')).toBe(true)
    expect(matchOscAddress('/1/*', '/1/page/fader10')).toBe(false)
    expect(matchOscAddress('/*/fader1', '/2/fader1')).toBe(true)
    expect(matchOscAddress('/1/fader[1-3]', '/1/fader2')).toBe(true)
    expect(matchOscAddress('/1/fader[1-3]', '/1/fader4')).toBe(false)
    expect(matchOscAddress('/1/fader[!1]', '/1/fader1')).toBe(false)
    expect(matchOscAddress('/1/fader[!1]', '/1/fader2')).toBe(true)
    expect(matchOscAddress('/{pad,drums}/level', '/pad/level')).toBe(true)
    expect(matchOscAddress('/{pad,drums}/level', '/bass/level')).toBe(false)
    expect(matchOscAddress('/a.b', '/a.b')).toBe(true)
    expect(matchOscAddress('/a.*', '/aXb')).toBe(false)
  })

  it('treats malformed patterns as matching nothing', () => {
    expect(oscPatternToRegExp('/1/fader[1')).toBeNull()
    expect(oscPatternToRegExp('/1/{a,b')).toBeNull()
    expect(oscPatternToRegExp('/1/]')).toBeNull()
    expect(oscPatternToRegExp('/1/[]')).toBeNull()
    expect(matchOscAddress('/1/fader[1', '/1/fader1')).toBe(false)
  })
})

describe('OSC codec', () => {
  const message: OscMessage = {
    address: '/1/fader1',
    args: [
      { type: 'f', value: 0.5 },
      { type: 'i', value: -7 },
      { type: 's', value: 'héllo' },
      { type: 'b', value: bytes(1, 2, 3, 4, 5) },
      { type: 'T' },
      { type: 'F' },
      { type: 'N' },
      { type: 'I' },
      { type: 'd', value: 1 / 3 },
      { type: 'h', value: 2 ** 40 + 5 },
      { type: 'c', value: 'A' },
      { type: 'r', value: [255, 128, 0, 64] },
      { type: 'm', value: [0, 0xb0, 74, 100] },
      { type: 't', value: OSC_IMMEDIATELY },
      { type: 'S', value: 'sym' },
      {
        type: 'array',
        value: [
          { type: 'i', value: 1 },
          { type: 'f', value: 2 },
        ],
      },
    ],
  }

  it('round-trips every argument type through encode and decode', () => {
    const encoded = encodeOscMessage(message)
    expect(encoded.length % 4).toBe(0)
    expect(decodeOscMessage(encoded)).toEqual(message)
    expect(decodeOscPacket(encoded)).toEqual(message)
    expect(decodeOscPacket(encoded.buffer.slice(0) as ArrayBuffer)).toEqual(message)
  })

  it('decodes the canonical spec example byte for byte', () => {
    // "/oscillator/4/frequency" ,f 440.0 from the OSC 1.0 spec.
    const spec = bytes(
      0x2f,
      0x6f,
      0x73,
      0x63,
      0x69,
      0x6c,
      0x6c,
      0x61,
      0x74,
      0x6f,
      0x72,
      0x2f,
      0x34,
      0x2f,
      0x66,
      0x72,
      0x65,
      0x71,
      0x75,
      0x65,
      0x6e,
      0x63,
      0x79,
      0x00,
      0x2c,
      0x66,
      0x00,
      0x00,
      0x43,
      0xdc,
      0x00,
      0x00,
    )
    expect(decodeOscMessage(spec)).toEqual({
      address: '/oscillator/4/frequency',
      args: [{ type: 'f', value: 440 }],
    })
  })

  it('decodes a message without a type tag string as argument-less', () => {
    expect(decodeOscPacket(bytes(0x2f, 0x61, 0x00, 0x00))).toEqual({ address: '/a', args: [] })
  })

  it('encodes and decodes nested bundles with time tags', () => {
    const inner = { timeTag: 3_913_056_000.5, elements: [{ address: '/b', args: [] }] }
    const bundle = { timeTag: OSC_IMMEDIATELY, elements: [message, inner] }
    const decoded = decodeOscPacket(encodeOscBundle(bundle))
    expect(isOscBundle(decoded)).toBe(true)
    if (!isOscBundle(decoded)) throw new Error('expected a bundle')
    expect(decoded.timeTag).toBe(OSC_IMMEDIATELY)
    expect(decoded.elements[0]).toEqual(message)
    const nested = decoded.elements[1]
    if (!isOscBundle(nested)) throw new Error('expected a nested bundle')
    expect(nested.timeTag).toBeCloseTo(3_913_056_000.5, 6)
    expect(flattenOscPacket(decoded)).toEqual([message, { address: '/b', args: [] }])
    expect(oscTimeTagToDate(OSC_IMMEDIATELY)).toBeNull()
    expect(oscTimeTagToDate(2_208_988_800)).toBe(0)
  })

  it.each([
    ['empty', bytes()],
    ['not padded', bytes(0x2f, 0x61, 0x00)],
    ['unterminated address', bytes(0x2f, 0x61, 0x62, 0x63)],
    ['address without slash', bytes(0x61, 0x00, 0x00, 0x00)],
    ['type tags without comma', bytes(0x2f, 0x61, 0x00, 0x00, 0x66, 0x00, 0x00, 0x00)],
    ['truncated float', bytes(0x2f, 0x61, 0x00, 0x00, 0x2c, 0x66, 0x00, 0x00)],
    ['unknown type tag', bytes(0x2f, 0x61, 0x00, 0x00, 0x2c, 0x7a, 0x00, 0x00, 0, 0, 0, 0)],
    ['unclosed array', bytes(0x2f, 0x61, 0x00, 0x00, 0x2c, 0x5b, 0x69, 0x00, 0, 0, 0, 1)],
    [
      'negative blob size',
      bytes(0x2f, 0x61, 0x00, 0x00, 0x2c, 0x62, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff),
    ],
    ['trailing bytes', bytes(0x2f, 0x61, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0, 0, 0, 0)],
  ])('rejects malformed packets: %s', (_name, packet) => {
    expect(() => decodeOscPacket(packet)).toThrow(OscDecodeError)
  })

  it('rejects malformed bundles', () => {
    const head = encodeOscBundle({ timeTag: OSC_IMMEDIATELY, elements: [] })
    expect(decodeOscPacket(head)).toEqual({ timeTag: OSC_IMMEDIATELY, elements: [] })
    const badSize = new Uint8Array([...head, 0, 0, 0, 3, 0, 0, 0, 0])
    expect(() => decodeOscPacket(badSize)).toThrow(OscDecodeError)
    const truncated = new Uint8Array([...head, 0, 0, 0, 8, 0x2f, 0x61, 0, 0])
    expect(() => decodeOscPacket(truncated)).toThrow(OscDecodeError)
    expect(() => decodeOscMessage(head)).toThrow(/expected a message/)
  })
})

describe('controlEventsFromOsc', () => {
  it('yields one absolute event per numeric argument, unscaled', () => {
    const events = controlEventsFromOsc({
      address: '/1/xy',
      args: [
        { type: 'f', value: 0.25 },
        { type: 'i', value: 100 },
        { type: 's', value: 'ignored' },
        { type: 'd', value: 0.75 },
      ],
    })
    expect(events).toEqual([
      {
        kind: 'absolute',
        source: { kind: 'osc', address: '/1/xy', arg: 0 },
        value: 0.25,
        raw: 0.25,
      },
      { kind: 'absolute', source: { kind: 'osc', address: '/1/xy', arg: 1 }, value: 100, raw: 100 },
      {
        kind: 'absolute',
        source: { kind: 'osc', address: '/1/xy', arg: 3 },
        value: 0.75,
        raw: 0.75,
      },
    ])
  })

  it('turns booleans, impulses and bare messages into triggers', () => {
    expect(controlEventsFromOsc({ address: '/go', args: [] })).toEqual([
      { kind: 'trigger', source: { kind: 'osc', address: '/go', arg: 0 }, on: true, value: 1 },
    ])
    expect(
      controlEventsFromOsc({ address: '/mute', args: [{ type: 'T' }, { type: 'F' }] }),
    ).toEqual([
      { kind: 'trigger', source: { kind: 'osc', address: '/mute', arg: 0 }, on: true, value: 1 },
      { kind: 'trigger', source: { kind: 'osc', address: '/mute', arg: 1 }, on: false, value: 0 },
    ])
    expect(controlEventsFromOsc({ address: '/bang', args: [{ type: 'I' }] })).toEqual([
      { kind: 'trigger', source: { kind: 'osc', address: '/bang', arg: 0 }, on: true, value: 1 },
    ])
  })

  it('skips non-finite numbers', () => {
    expect(
      controlEventsFromOsc({ address: '/x', args: [{ type: 'f', value: Number.NaN }] }),
    ).toEqual([])
  })
})
