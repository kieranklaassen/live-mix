// OSC 1.0 packets (messages and bundles) to and from bytes, and the control
// events an OSC message yields. The decoder is strict about framing — a
// truncated or unpadded packet throws `OscDecodeError`, which the input
// adapter turns into a dropped packet — and lenient about content: every
// standard type tag decodes, arrays nest, unknown tags fail the packet.

import { absoluteEvent, triggerEvent, type ControlEvent } from './event'

export type OscArg =
  | { type: 'i'; value: number }
  | { type: 'f'; value: number }
  | { type: 'd'; value: number }
  /** int64; decoded to a JS number (exact up to 2^53). */
  | { type: 'h'; value: number }
  | { type: 's'; value: string }
  /** Alternate string (symbol). */
  | { type: 'S'; value: string }
  | { type: 'b'; value: Uint8Array }
  | { type: 'T' }
  | { type: 'F' }
  | { type: 'N' }
  /** Impulse ("bang"). */
  | { type: 'I' }
  /** ASCII character. */
  | { type: 'c'; value: string }
  /** RGBA colour as four bytes. */
  | { type: 'r'; value: [number, number, number, number] }
  /** 4-byte MIDI message: port id, status, data1, data2. */
  | { type: 'm'; value: [number, number, number, number] }
  /** NTP time tag, seconds since 1900 as a float. */
  | { type: 't'; value: number }
  | { type: 'array'; value: OscArg[] }

export interface OscMessage {
  address: string
  args: OscArg[]
}

/** OSC time tag `1` means "immediately". */
export const OSC_IMMEDIATELY = 1

export interface OscBundle {
  /** NTP seconds since 1900 (fractional), or `OSC_IMMEDIATELY`. */
  timeTag: number
  elements: OscPacket[]
}

export type OscPacket = OscMessage | OscBundle

export class OscDecodeError extends Error {
  constructor(message: string) {
    super(`live-mix: malformed OSC packet: ${message}`)
    this.name = 'OscDecodeError'
  }
}

export function isOscBundle(packet: OscPacket): packet is OscBundle {
  return 'elements' in packet
}

const BUNDLE_TAG = '#bundle'
const NTP_UNIX_OFFSET_SECONDS = 2_208_988_800

function pad4(length: number): number {
  return (length + 3) & ~3
}

class Reader {
  private offset = 0
  private readonly view: DataView
  private readonly bytes: Uint8Array

  constructor(bytes: Uint8Array) {
    this.bytes = bytes
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  }

  get remaining(): number {
    return this.bytes.length - this.offset
  }

  get done(): boolean {
    return this.offset >= this.bytes.length
  }

  private need(count: number): void {
    if (this.offset + count > this.bytes.length) throw new OscDecodeError('truncated')
  }

  int32(): number {
    this.need(4)
    const value = this.view.getInt32(this.offset)
    this.offset += 4
    return value
  }

  uint32(): number {
    this.need(4)
    const value = this.view.getUint32(this.offset)
    this.offset += 4
    return value
  }

  float32(): number {
    this.need(4)
    const value = this.view.getFloat32(this.offset)
    this.offset += 4
    return value
  }

  float64(): number {
    this.need(8)
    const value = this.view.getFloat64(this.offset)
    this.offset += 8
    return value
  }

  int64(): number {
    this.need(8)
    const value = this.view.getBigInt64(this.offset)
    this.offset += 8
    return Number(value)
  }

  timeTag(): number {
    const seconds = this.uint32()
    const fraction = this.uint32()
    if (seconds === 0 && fraction === 1) return OSC_IMMEDIATELY
    return seconds + fraction / 2 ** 32
  }

  string(): string {
    let end = this.offset
    while (end < this.bytes.length && this.bytes[end] !== 0) end += 1
    if (end >= this.bytes.length) throw new OscDecodeError('unterminated string')
    const text = utf8.decode(this.bytes.subarray(this.offset, end))
    const next = this.offset + pad4(end - this.offset + 1)
    if (next > this.bytes.length) throw new OscDecodeError('string padding')
    this.offset = next
    return text
  }

  blob(): Uint8Array {
    const size = this.int32()
    if (size < 0) throw new OscDecodeError('negative blob size')
    this.need(size)
    const data = this.bytes.slice(this.offset, this.offset + size)
    const next = this.offset + pad4(size)
    if (next > this.bytes.length) throw new OscDecodeError('blob padding')
    this.offset = next
    return data
  }

  bytes4(): [number, number, number, number] {
    this.need(4)
    const out: [number, number, number, number] = [
      this.bytes[this.offset],
      this.bytes[this.offset + 1],
      this.bytes[this.offset + 2],
      this.bytes[this.offset + 3],
    ]
    this.offset += 4
    return out
  }

  slice(count: number): Uint8Array {
    this.need(count)
    const out = this.bytes.subarray(this.offset, this.offset + count)
    this.offset += count
    return out
  }
}

const utf8 = new TextDecoder()

function readArgs(
  reader: Reader,
  tags: string,
  start: number,
  nested = false,
): { args: OscArg[]; next: number } {
  const args: OscArg[] = []
  let index = start
  while (index < tags.length) {
    const tag = tags[index]
    index += 1
    switch (tag) {
      case 'i':
        args.push({ type: 'i', value: reader.int32() })
        break
      case 'f':
        args.push({ type: 'f', value: reader.float32() })
        break
      case 'd':
        args.push({ type: 'd', value: reader.float64() })
        break
      case 'h':
        args.push({ type: 'h', value: reader.int64() })
        break
      case 's':
        args.push({ type: 's', value: reader.string() })
        break
      case 'S':
        args.push({ type: 'S', value: reader.string() })
        break
      case 'b':
        args.push({ type: 'b', value: reader.blob() })
        break
      case 'T':
        args.push({ type: 'T' })
        break
      case 'F':
        args.push({ type: 'F' })
        break
      case 'N':
        args.push({ type: 'N' })
        break
      case 'I':
        args.push({ type: 'I' })
        break
      case 'c': {
        const code = reader.int32()
        args.push({ type: 'c', value: String.fromCodePoint(code & 0xff) })
        break
      }
      case 'r':
        args.push({ type: 'r', value: reader.bytes4() })
        break
      case 'm':
        args.push({ type: 'm', value: reader.bytes4() })
        break
      case 't':
        args.push({ type: 't', value: reader.timeTag() })
        break
      case '[': {
        const inner = readArgs(reader, tags, index, true)
        args.push({ type: 'array', value: inner.args })
        index = inner.next
        break
      }
      case ']':
        if (!nested) throw new OscDecodeError('unexpected ]')
        return { args, next: index }
      default:
        throw new OscDecodeError(`unknown type tag "${tag}"`)
    }
  }
  if (nested) throw new OscDecodeError('unclosed array')
  return { args, next: index }
}

/** The rest of a message once its address has been read. */
function decodeMessageBody(reader: Reader, address: string): OscMessage {
  if (!address.startsWith('/')) throw new OscDecodeError(`address "${address}" must start with /`)
  if (reader.done) return { address, args: [] }
  const tags = reader.string()
  if (!tags.startsWith(',')) throw new OscDecodeError('type tag string must start with ,')
  const { args } = readArgs(reader, tags, 1)
  if (!reader.done) throw new OscDecodeError('trailing bytes after arguments')
  return { address, args }
}

function decodePacketFrom(reader: Reader): OscPacket {
  const head = reader.string()
  if (head !== BUNDLE_TAG) return decodeMessageBody(reader, head)
  const timeTag = reader.timeTag()
  const elements: OscPacket[] = []
  while (!reader.done) {
    const size = reader.int32()
    if (size <= 0 || size % 4 !== 0) throw new OscDecodeError('bundle element size')
    elements.push(decodePacketFrom(new Reader(reader.slice(size))))
  }
  return { timeTag, elements }
}

function toBytes(bytes: Uint8Array | ArrayBuffer): Uint8Array {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (data.length === 0 || data.length % 4 !== 0) {
    throw new OscDecodeError('length not a multiple of 4')
  }
  return data
}

/** Decode one packet (a message or a bundle). Throws `OscDecodeError` when malformed. */
export function decodeOscPacket(bytes: Uint8Array | ArrayBuffer): OscPacket {
  return decodePacketFrom(new Reader(toBytes(bytes)))
}

/** Decode one message; a bundle is an error here. */
export function decodeOscMessage(bytes: Uint8Array | ArrayBuffer): OscMessage {
  const reader = new Reader(toBytes(bytes))
  const address = reader.string()
  if (address === BUNDLE_TAG) throw new OscDecodeError('expected a message, got a bundle')
  return decodeMessageBody(reader, address)
}

/** Every message in a packet, bundles flattened depth-first (time tags are not honoured). */
export function flattenOscPacket(packet: OscPacket): OscMessage[] {
  if (!isOscBundle(packet)) return [packet]
  const out: OscMessage[] = []
  for (const element of packet.elements) out.push(...flattenOscPacket(element))
  return out
}

/** Convert an OSC NTP time tag to a JS epoch in milliseconds (`OSC_IMMEDIATELY` → null). */
export function oscTimeTagToDate(timeTag: number): number | null {
  if (timeTag === OSC_IMMEDIATELY) return null
  return (timeTag - NTP_UNIX_OFFSET_SECONDS) * 1000
}

// --- Encoding (for tests, and for feedback to controllers later) ----------------

class Writer {
  private chunks: Uint8Array[] = []
  private length = 0

  private push(chunk: Uint8Array): void {
    this.chunks.push(chunk)
    this.length += chunk.length
  }

  int32(value: number): void {
    const out = new Uint8Array(4)
    new DataView(out.buffer).setInt32(0, value)
    this.push(out)
  }

  uint32(value: number): void {
    const out = new Uint8Array(4)
    new DataView(out.buffer).setUint32(0, value)
    this.push(out)
  }

  float32(value: number): void {
    const out = new Uint8Array(4)
    new DataView(out.buffer).setFloat32(0, value)
    this.push(out)
  }

  float64(value: number): void {
    const out = new Uint8Array(8)
    new DataView(out.buffer).setFloat64(0, value)
    this.push(out)
  }

  int64(value: number): void {
    const out = new Uint8Array(8)
    new DataView(out.buffer).setBigInt64(0, BigInt(Math.trunc(value)))
    this.push(out)
  }

  string(value: string): void {
    const encoded = new TextEncoder().encode(value)
    const out = new Uint8Array(pad4(encoded.length + 1))
    out.set(encoded)
    this.push(out)
  }

  blob(value: Uint8Array): void {
    this.int32(value.length)
    const out = new Uint8Array(pad4(value.length))
    out.set(value)
    this.push(out)
  }

  bytes4(value: [number, number, number, number]): void {
    this.push(Uint8Array.from(value))
  }

  timeTag(value: number): void {
    if (value === OSC_IMMEDIATELY) {
      this.uint32(0)
      this.uint32(1)
      return
    }
    const seconds = Math.floor(value)
    this.uint32(seconds)
    this.uint32(Math.round((value - seconds) * 2 ** 32) >>> 0)
  }

  raw(bytes: Uint8Array): void {
    this.push(bytes)
  }

  finish(): Uint8Array {
    const out = new Uint8Array(this.length)
    let offset = 0
    for (const chunk of this.chunks) {
      out.set(chunk, offset)
      offset += chunk.length
    }
    return out
  }
}

function tagOf(arg: OscArg): string {
  if (arg.type === 'array') return `[${arg.value.map(tagOf).join('')}]`
  return arg.type
}

function writeArg(writer: Writer, arg: OscArg): void {
  switch (arg.type) {
    case 'i':
      writer.int32(arg.value)
      return
    case 'f':
      writer.float32(arg.value)
      return
    case 'd':
      writer.float64(arg.value)
      return
    case 'h':
      writer.int64(arg.value)
      return
    case 's':
    case 'S':
      writer.string(arg.value)
      return
    case 'b':
      writer.blob(arg.value)
      return
    case 'T':
    case 'F':
    case 'N':
    case 'I':
      return
    case 'c':
      writer.int32(arg.value.charCodeAt(0))
      return
    case 'r':
    case 'm':
      writer.bytes4(arg.value)
      return
    case 't':
      writer.timeTag(arg.value)
      return
    case 'array':
      for (const inner of arg.value) writeArg(writer, inner)
      return
    default: {
      const exhaustive: never = arg
      return exhaustive
    }
  }
}

export function encodeOscMessage(message: OscMessage): Uint8Array {
  const writer = new Writer()
  writer.string(message.address)
  writer.string(`,${message.args.map(tagOf).join('')}`)
  for (const arg of message.args) writeArg(writer, arg)
  return writer.finish()
}

export function encodeOscBundle(bundle: OscBundle): Uint8Array {
  const writer = new Writer()
  writer.string(BUNDLE_TAG)
  writer.timeTag(bundle.timeTag)
  for (const element of bundle.elements) {
    const bytes = encodeOscPacket(element)
    writer.int32(bytes.length)
    writer.raw(bytes)
  }
  return writer.finish()
}

export function encodeOscPacket(packet: OscPacket): Uint8Array {
  return isOscBundle(packet) ? encodeOscBundle(packet) : encodeOscMessage(packet)
}

// --- Control events -----------------------------------------------------------

/**
 * The control events one OSC message yields: one per numeric or boolean
 * argument (`{ kind: 'osc', address, arg }`), a bang for a message without
 * arguments or with an impulse. Numeric arguments pass through unscaled; the
 * mapping's `input` range normalises them (default 0..1, TouchOSC's default).
 */
export function controlEventsFromOsc(message: OscMessage): ControlEvent[] {
  const events: ControlEvent[] = []
  if (message.args.length === 0) {
    events.push(triggerEvent({ kind: 'osc', address: message.address, arg: 0 }, true))
    return events
  }
  message.args.forEach((arg, index) => {
    const source = { kind: 'osc', address: message.address, arg: index } as const
    switch (arg.type) {
      case 'i':
      case 'f':
      case 'd':
      case 'h':
        if (Number.isFinite(arg.value)) events.push(absoluteEvent(source, arg.value, arg.value))
        return
      case 'T':
        events.push(triggerEvent(source, true))
        return
      case 'F':
        events.push(triggerEvent(source, false))
        return
      case 'I':
        events.push(triggerEvent(source, true))
        return
      case 's':
      case 'S':
      case 'b':
      case 'N':
      case 'c':
      case 'r':
      case 'm':
      case 't':
      case 'array':
        return
      default: {
        const exhaustive: never = arg
        return exhaustive
      }
    }
  })
  return events
}
