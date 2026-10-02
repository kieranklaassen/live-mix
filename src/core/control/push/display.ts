// Push's display: 960 × 160 pixels of 16-bit colour, written over USB (a
// bulk endpoint beside the MIDI ports) as whole frames. `encodePushFrame`
// turns RGBA pixels into the bytes of one frame; `PushDisplay` sends frames
// through WebUSB. Format from the "Ableton Push 2 MIDI and Display Interface
// Manual", chapter "Display Interface"; Push 3's display takes the same
// frames under its own USB product id. Nothing here touches `navigator` at
// import time.

import {
  ABLETON_USB_VENDOR_ID,
  PUSH_USB_PRODUCT_IDS,
  pushModelForProductId,
  type PushModel,
} from './protocol'

export const PUSH_DISPLAY_WIDTH = 960
export const PUSH_DISPLAY_HEIGHT = 160
/** A line is sent as 2048 bytes: 1920 of pixels and 128 of filler, so no line straddles a 512-byte USB packet. */
export const PUSH_DISPLAY_LINE_BYTES = 2048
export const PUSH_DISPLAY_FRAME_BYTES = PUSH_DISPLAY_LINE_BYTES * PUSH_DISPLAY_HEIGHT

/** Sent before the pixels of every frame. */
export const PUSH_FRAME_HEADER: readonly number[] = [
  0xff, 0xcc, 0xaa, 0x88, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]

/** The "signal shaping pattern" every line is XORed with, byte by byte. */
const XOR_PATTERN = [0xe7, 0xf3, 0xe7, 0xff] as const

/** Without a frame for two seconds the display goes black; one is repeated before that. */
export const PUSH_DISPLAY_TIMEOUT_MS = 2000
export const PUSH_DISPLAY_KEEPALIVE_MS = 1000

/** A pixel as the display stores it: five bits of blue on top, six of green, five of red. */
export function pushPixel(r: number, g: number, b: number): number {
  return ((b >> 3) << 11) | ((g >> 2) << 5) | (r >> 3)
}

/**
 * One frame for the display from 960 × 160 RGBA pixels (`ImageData.data` of
 * a canvas that size), top line first. Alpha is ignored. Pass `target` to
 * reuse a buffer between frames.
 */
export function encodePushFrame(
  rgba: ArrayLike<number>,
  target: Uint8Array = new Uint8Array(PUSH_DISPLAY_FRAME_BYTES),
): Uint8Array {
  if (rgba.length !== PUSH_DISPLAY_WIDTH * PUSH_DISPLAY_HEIGHT * 4) {
    throw new RangeError(
      `live-mix: a Push frame is ${PUSH_DISPLAY_WIDTH} × ${PUSH_DISPLAY_HEIGHT} RGBA pixels (${PUSH_DISPLAY_WIDTH * PUSH_DISPLAY_HEIGHT * 4} values), got ${rgba.length}`,
    )
  }
  if (target.length !== PUSH_DISPLAY_FRAME_BYTES) {
    throw new RangeError(`live-mix: a Push frame buffer is ${PUSH_DISPLAY_FRAME_BYTES} bytes`)
  }
  let source = 0
  for (let line = 0; line < PUSH_DISPLAY_HEIGHT; line += 1) {
    let at = line * PUSH_DISPLAY_LINE_BYTES
    for (let x = 0; x < PUSH_DISPLAY_WIDTH; x += 1) {
      const pixel = pushPixel(rgba[source], rgba[source + 1], rgba[source + 2])
      source += 4
      // Little endian, and two bytes of the pattern per pixel: even pixels take E7 F3, odd ones E7 FF.
      target[at] = (pixel & 0xff) ^ XOR_PATTERN[0]
      target[at + 1] = (pixel >> 8) ^ XOR_PATTERN[(x & 1) * 2 + 1]
      at += 2
    }
    // The filler is zeros, XORed like the pixels.
    const end = (line + 1) * PUSH_DISPLAY_LINE_BYTES
    for (let i = 0; at < end; at += 1, i += 1) target[at] = XOR_PATTERN[i & 3]
  }
  return target
}

/** The RGBA pixels a frame shows: `encodePushFrame` backwards, with the colour depth the display keeps. */
export function decodePushFrame(frame: ArrayLike<number>): Uint8ClampedArray {
  if (frame.length !== PUSH_DISPLAY_FRAME_BYTES) {
    throw new RangeError(`live-mix: a Push frame is ${PUSH_DISPLAY_FRAME_BYTES} bytes`)
  }
  const rgba = new Uint8ClampedArray(PUSH_DISPLAY_WIDTH * PUSH_DISPLAY_HEIGHT * 4)
  let out = 0
  for (let line = 0; line < PUSH_DISPLAY_HEIGHT; line += 1) {
    let at = line * PUSH_DISPLAY_LINE_BYTES
    for (let x = 0; x < PUSH_DISPLAY_WIDTH; x += 1) {
      const low = frame[at] ^ XOR_PATTERN[0]
      const high = frame[at + 1] ^ XOR_PATTERN[(x & 1) * 2 + 1]
      at += 2
      const pixel = low | (high << 8)
      const r = pixel & 0x1f
      const g = (pixel >> 5) & 0x3f
      const b = pixel >> 11
      // Spread the five and six bits over eight, so white comes back as 255.
      rgba[out] = (r << 3) | (r >> 2)
      rgba[out + 1] = (g << 2) | (g >> 4)
      rgba[out + 2] = (b << 3) | (b >> 2)
      rgba[out + 3] = 255
      out += 4
    }
  }
  return rgba
}

// WebUSB --------------------------------------------------------------------------

export interface UsbEndpointLike {
  endpointNumber: number
  direction: 'in' | 'out'
  type: 'bulk' | 'interrupt' | 'isochronous'
}

export interface UsbInterfaceLike {
  interfaceNumber: number
  claimed?: boolean
  alternate?: { interfaceClass: number; endpoints: readonly UsbEndpointLike[] }
  alternates?: readonly { interfaceClass: number; endpoints: readonly UsbEndpointLike[] }[]
}

/** The slice of WebUSB's `USBDevice` the display uses. */
export interface UsbDeviceLike {
  readonly vendorId: number
  readonly productId: number
  readonly productName?: string | null
  readonly serialNumber?: string | null
  readonly opened: boolean
  readonly configuration?: { interfaces: readonly UsbInterfaceLike[] } | null
  open(): Promise<void>
  close(): Promise<void>
  selectConfiguration(configurationValue: number): Promise<void>
  claimInterface(interfaceNumber: number): Promise<void>
  releaseInterface(interfaceNumber: number): Promise<void>
  transferOut(endpointNumber: number, data: Uint8Array): Promise<{ status?: string }>
}

export interface UsbFilterLike {
  vendorId: number
  productId: number
}

/** The slice of `navigator.usb` the display uses. */
export interface UsbLike {
  requestDevice(options: { filters: UsbFilterLike[] }): Promise<UsbDeviceLike>
  getDevices(): Promise<UsbDeviceLike[]>
}

/** What `navigator.usb.requestDevice` is asked for: a Push 2 or a Push 3. */
export const PUSH_USB_FILTERS: UsbFilterLike[] = [
  { vendorId: ABLETON_USB_VENDOR_ID, productId: PUSH_USB_PRODUCT_IDS[2] },
  { vendorId: ABLETON_USB_VENDOR_ID, productId: PUSH_USB_PRODUCT_IDS[3] },
]

/** True when the page has WebUSB (Chromium browsers, on https or localhost). Safe anywhere. */
export function isWebUsbSupported(): boolean {
  return typeof navigator !== 'undefined' && (navigator as { usb?: unknown }).usb != null
}

function browserUsb(): UsbLike {
  if (!isWebUsbSupported()) {
    throw new Error('live-mix: WebUSB is not available in this environment')
  }
  return (navigator as unknown as { usb: UsbLike }).usb
}

function isPush(device: UsbDeviceLike): boolean {
  return (
    device.vendorId === ABLETON_USB_VENDOR_ID && pushModelForProductId(device.productId) !== null
  )
}

/** The documented place of the display: interface 0, bulk endpoint 1. */
const DISPLAY_INTERFACE = 0
const DISPLAY_ENDPOINT = 1
const VENDOR_CLASS = 0xff

/** The vendor-specific interface with a bulk endpoint out, when the device describes itself; else the documented one. */
function displayEndpoint(device: UsbDeviceLike): { interfaceNumber: number; endpoint: number } {
  for (const entry of device.configuration?.interfaces ?? []) {
    const alternate = entry.alternate ?? entry.alternates?.[0]
    if (alternate?.interfaceClass !== VENDOR_CLASS) continue
    const out = alternate.endpoints.find(
      (endpoint) => endpoint.direction === 'out' && endpoint.type === 'bulk',
    )
    if (out) return { interfaceNumber: entry.interfaceNumber, endpoint: out.endpointNumber }
  }
  return { interfaceNumber: DISPLAY_INTERFACE, endpoint: DISPLAY_ENDPOINT }
}

export interface PushDisplayTimer {
  setInterval(handler: () => void, ms: number): unknown
  clearInterval(handle: unknown): void
}

export interface PushDisplayOptions {
  /** Repeats the last frame so the display stays lit; default `setInterval`. */
  timer?: PushDisplayTimer
  /** Called when a frame could not be sent (the cable was pulled, say); the display then closes. */
  onError?: (error: unknown) => void
}

const HEADER = new Uint8Array(PUSH_FRAME_HEADER)

/**
 * The display of one Push. `show` takes RGBA pixels and sends them as a
 * frame; while one frame is on its way the newest waiting one replaces any
 * older, so a fast caller never queues up, and the last frame is repeated
 * once a second because the display blanks itself after two without one.
 */
export class PushDisplay {
  /** Asks the person to pick their Push (the browser's device chooser; needs a click). */
  static async request(usb?: UsbLike, options?: PushDisplayOptions): Promise<PushDisplay> {
    const device = await (usb ?? browserUsb()).requestDevice({ filters: PUSH_USB_FILTERS })
    return new PushDisplay(device, options)
  }

  /** A Push the person allowed earlier, when one is plugged in; null otherwise. Needs no click. */
  static async granted(usb?: UsbLike, options?: PushDisplayOptions): Promise<PushDisplay | null> {
    const devices = await (usb ?? browserUsb()).getDevices()
    const device = devices.find(isPush)
    return device ? new PushDisplay(device, options) : null
  }

  readonly model: PushModel | null
  private readonly timer: PushDisplayTimer
  private readonly onError: ((error: unknown) => void) | undefined
  private readonly buffers = [
    new Uint8Array(PUSH_DISPLAY_FRAME_BYTES),
    new Uint8Array(PUSH_DISPLAY_FRAME_BYTES),
  ]
  /** The buffer the next `show` encodes into; the other holds the frame last sent. */
  private spare = 0
  private last: Uint8Array | null = null
  private waiting: Uint8Array | null = null
  private sending: Promise<void> | null = null
  private endpoint = DISPLAY_ENDPOINT
  private interfaceNumber = DISPLAY_INTERFACE
  private keepAlive: unknown = null
  private open_ = false
  private frames = 0

  constructor(
    readonly device: UsbDeviceLike,
    options: PushDisplayOptions = {},
  ) {
    this.model = pushModelForProductId(device.productId)
    this.timer = options.timer ?? {
      setInterval: (handler, ms) => setInterval(handler, ms),
      clearInterval: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
    }
    this.onError = options.onError
  }

  get opened(): boolean {
    return this.open_
  }

  /** How many frames have been sent since `open`. */
  get framesSent(): number {
    return this.frames
  }

  /** Opens the device and claims its display. Rejects when another program holds it (Live, say). */
  async open(): Promise<void> {
    if (this.open_) return
    if (!this.device.opened) await this.device.open()
    if (!this.device.configuration) await this.device.selectConfiguration(1)
    const place = displayEndpoint(this.device)
    this.interfaceNumber = place.interfaceNumber
    this.endpoint = place.endpoint
    await this.device.claimInterface(this.interfaceNumber)
    this.open_ = true
    this.keepAlive = this.timer.setInterval(() => {
      if (this.last && !this.sending) this.push(this.last)
    }, PUSH_DISPLAY_KEEPALIVE_MS)
  }

  /**
   * Shows 960 × 160 RGBA pixels. Returns once the frame is encoded; sending
   * goes on behind. Before `open` and after `close` it does nothing.
   */
  show(rgba: ArrayLike<number>): void {
    if (!this.open_) return
    // Never encode into the buffer a transfer is still reading.
    const frame = encodePushFrame(rgba, this.buffers[this.spare])
    if (this.sending) {
      this.waiting = frame
      return
    }
    this.push(frame)
  }

  /** Resolves when nothing is on its way to the display. */
  async settled(): Promise<void> {
    while (this.sending) await this.sending
  }

  private push(frame: Uint8Array): void {
    if (frame === this.buffers[this.spare]) this.spare = 1 - this.spare
    this.last = frame
    this.sending = this.transfer(frame).then(
      () => {
        this.sending = null
        this.frames += 1
        const next = this.waiting
        this.waiting = null
        // The waiting frame sits in the spare buffer: sending it swaps the two again.
        if (next && this.open_) this.push(next)
      },
      (error: unknown) => {
        this.sending = null
        this.waiting = null
        if (!this.open_) return
        void this.close()
        this.onError?.(error)
      },
    )
  }

  private async transfer(frame: Uint8Array): Promise<void> {
    await this.device.transferOut(this.endpoint, HEADER)
    const result = await this.device.transferOut(this.endpoint, frame)
    if (result.status !== undefined && result.status !== 'ok') {
      throw new Error(`live-mix: the Push display refused a frame (${result.status})`)
    }
  }

  /** Lets go of the display; it goes black two seconds later. */
  async close(): Promise<void> {
    if (!this.open_) return
    this.open_ = false
    this.timer.clearInterval(this.keepAlive)
    this.keepAlive = null
    this.waiting = null
    try {
      await this.sending
    } catch {
      // The transfer's own handler reported it.
    }
    try {
      await this.device.releaseInterface(this.interfaceNumber)
      await this.device.close()
    } catch {
      // Already gone: an unplugged device cannot be released.
    }
  }
}
