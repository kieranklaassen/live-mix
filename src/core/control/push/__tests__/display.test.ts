import { describe, expect, it } from 'vitest'

import { VirtualPush } from '../../../../testing/virtual-push'
import {
  PUSH_DISPLAY_FRAME_BYTES,
  PUSH_DISPLAY_HEIGHT,
  PUSH_DISPLAY_KEEPALIVE_MS,
  PUSH_DISPLAY_LINE_BYTES,
  PUSH_DISPLAY_WIDTH,
  PUSH_FRAME_HEADER,
  PUSH_USB_FILTERS,
  PushDisplay,
  decodePushFrame,
  encodePushFrame,
  pushPixel,
  type PushDisplayTimer,
} from '../display'

function solid(r: number, g: number, b: number): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(PUSH_DISPLAY_WIDTH * PUSH_DISPLAY_HEIGHT * 4)
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = r
    rgba[i + 1] = g
    rgba[i + 2] = b
    rgba[i + 3] = 255
  }
  return rgba
}

function manualTimer(): PushDisplayTimer & { tick(): void; running: boolean } {
  let handler: (() => void) | null = null
  return {
    setInterval: (next, ms) => {
      expect(ms).toBe(PUSH_DISPLAY_KEEPALIVE_MS)
      handler = next
      return 1
    },
    clearInterval: () => {
      handler = null
    },
    tick: () => handler?.(),
    get running() {
      return handler !== null
    },
  }
}

describe('a Push frame', () => {
  it('is 160 lines of 2048 bytes: 16-bit pixels, blue on top, low byte first', () => {
    expect(PUSH_DISPLAY_FRAME_BYTES).toBe(327_680)
    expect(PUSH_FRAME_HEADER).toHaveLength(16)
    expect(PUSH_FRAME_HEADER.slice(0, 4)).toEqual([0xff, 0xcc, 0xaa, 0x88])
    expect(pushPixel(255, 0, 0)).toBe(0x001f)
    expect(pushPixel(0, 255, 0)).toBe(0x07e0)
    expect(pushPixel(0, 0, 255)).toBe(0xf800)
  })

  it('is XORed with E7 F3 E7 FF, filler included', () => {
    // Black is all zeros before the XOR, so the frame is the pattern itself.
    const black = encodePushFrame(solid(0, 0, 0))
    expect([...black.subarray(0, 8)]).toEqual([0xe7, 0xf3, 0xe7, 0xff, 0xe7, 0xf3, 0xe7, 0xff])
    expect([...black.subarray(1920, 1924)]).toEqual([0xe7, 0xf3, 0xe7, 0xff])
    expect([...black.subarray(2044, 2052)]).toEqual([
      0xe7, 0xf3, 0xe7, 0xff, 0xe7, 0xf3, 0xe7, 0xff,
    ])
    // Red is 0x001f: low byte 1f, high byte 00.
    const red = encodePushFrame(solid(255, 0, 0))
    expect([...red.subarray(0, 4)]).toEqual([0x1f ^ 0xe7, 0xf3, 0x1f ^ 0xe7, 0xff])
    // The filler after a line's 1920 pixel bytes carries no pixels.
    expect([...red.subarray(1920, 1924)]).toEqual([0xe7, 0xf3, 0xe7, 0xff])
  })

  it('puts each pixel where the display reads it', () => {
    const rgba = solid(0, 0, 0)
    const set = (x: number, y: number, r: number, g: number, b: number): void => {
      rgba.set([r, g, b, 255], (y * PUSH_DISPLAY_WIDTH + x) * 4)
    }
    set(0, 0, 255, 255, 255)
    set(959, 0, 255, 0, 0)
    set(1, 1, 0, 255, 0)
    set(959, 159, 0, 0, 255)
    const frame = encodePushFrame(rgba)
    const back = decodePushFrame(frame)
    const at = (x: number, y: number): number[] => [
      ...back.subarray((y * PUSH_DISPLAY_WIDTH + x) * 4, (y * PUSH_DISPLAY_WIDTH + x) * 4 + 3),
    ]
    expect(at(0, 0)).toEqual([255, 255, 255])
    expect(at(959, 0)).toEqual([255, 0, 0])
    expect(at(1, 1)).toEqual([0, 255, 0])
    expect(at(959, 159)).toEqual([0, 0, 255])
    expect(at(480, 80)).toEqual([0, 0, 0])
    // Line 1 starts at byte 2048, and its second pixel is two bytes in.
    expect(frame[PUSH_DISPLAY_LINE_BYTES + 2] ^ 0xe7).toBe(0xe0)
    expect(frame[PUSH_DISPLAY_LINE_BYTES + 3] ^ 0xff).toBe(0x07)
  })

  it('wants exactly 960 × 160 pixels', () => {
    expect(() => encodePushFrame(new Uint8ClampedArray(100))).toThrow(/960 × 160/)
    expect(() => encodePushFrame(solid(0, 0, 0), new Uint8Array(10))).toThrow(/327680 bytes/)
  })
})

describe('PushDisplay', () => {
  it('asks for a Push 2 or a Push 3 and claims its display', async () => {
    expect(PUSH_USB_FILTERS).toEqual([
      { vendorId: 0x2982, productId: 0x1967 },
      { vendorId: 0x2982, productId: 0x1969 },
    ])
    const push = new VirtualPush({ model: 3 })
    expect(await PushDisplay.granted(push.usb())).toBeNull()
    const display = await PushDisplay.request(push.usb(), { timer: manualTimer() })
    expect(display.model).toBe(3)
    await display.open()
    expect(display.opened).toBe(true)
    // Allowed once, it is found again without asking.
    expect((await PushDisplay.granted(push.usb()))?.model).toBe(3)
    await display.close()
    expect(push.errors).toEqual([])
  })

  it('shows what it is given', async () => {
    const push = new VirtualPush({ model: 2 })
    const display = await PushDisplay.request(push.usb(), { timer: manualTimer() })
    await display.open()
    display.show(solid(255, 128, 0))
    await display.settled()
    expect(push.frames).toBe(1)
    // Five bits of red, six of green: 128 comes back as 130.
    expect(push.pixel(10, 10)).toEqual({ r: 255, g: 130, b: 0 })
    expect(push.errors).toEqual([])
  })

  it('sends the newest frame when frames come faster than they go out', async () => {
    const push = new VirtualPush()
    const display = await PushDisplay.request(push.usb(), { timer: manualTimer() })
    await display.open()
    display.show(solid(255, 0, 0))
    display.show(solid(0, 255, 0))
    display.show(solid(0, 0, 255))
    await display.settled()
    expect(push.frames).toBe(2)
    expect(push.pixel(0, 0)).toEqual({ r: 0, g: 0, b: 255 })
    // And the next one is not written into a buffer still being sent.
    display.show(solid(255, 255, 255))
    display.show(solid(0, 0, 0))
    await display.settled()
    expect(push.pixel(0, 0)).toEqual({ r: 0, g: 0, b: 0 })
    expect(push.errors).toEqual([])
  })

  it('repeats the last frame so the display does not go black', async () => {
    const push = new VirtualPush()
    const timer = manualTimer()
    const display = await PushDisplay.request(push.usb(), { timer })
    await display.open()
    timer.tick()
    await display.settled()
    expect(push.frames).toBe(0)
    display.show(solid(9, 9, 9))
    await display.settled()
    timer.tick()
    await display.settled()
    timer.tick()
    await display.settled()
    expect(push.frames).toBe(3)
    await display.close()
    expect(timer.running).toBe(false)
    display.show(solid(1, 1, 1))
    expect(push.frames).toBe(3)
    expect(push.errors).toEqual([])
  })

  it('says so when another program holds the display', async () => {
    const push = new VirtualPush({ displayBusy: true })
    const display = await PushDisplay.request(push.usb(), { timer: manualTimer() })
    await expect(display.open()).rejects.toThrow(/Unable to claim interface/)
    expect(display.opened).toBe(false)
  })

  it('closes and reports when the cable is pulled', async () => {
    const push = new VirtualPush()
    const errors: unknown[] = []
    const display = await PushDisplay.request(push.usb(), {
      timer: manualTimer(),
      onError: (error) => errors.push(error),
    })
    await display.open()
    display.show(solid(1, 2, 3))
    await display.settled()
    push.unplug()
    display.show(solid(3, 2, 1))
    await display.settled()
    expect(errors).toHaveLength(1)
    expect(display.opened).toBe(false)
  })
})
