// The driver against the stand-in: every test ends by asking the stand-in
// whether anything it was sent falls outside the documented protocol.

import { afterEach, describe, expect, it } from 'vitest'

import { VirtualPush, type VirtualPushOptions } from '../../../../testing/virtual-push'
import {
  PUSH_PALETTE_FIRST,
  PushDevice,
  findPushPorts,
  nearestDefaultPushColor,
  type PushEvent,
} from '../PushDevice'
import { PUSH_DEFAULT_COLORS, PUSH_WHITE_LEVELS } from '../protocol'

const COLORS = {
  root: { r: 255, g: 90, b: 0 },
  scale: { r: 230, g: 230, b: 230 },
  dim: { r: 40, g: 40, b: 40 },
  water: { r: 0, g: 120, b: 255 },
} as const

const pushes: VirtualPush[] = []

function plug(options: VirtualPushOptions = {}): {
  push: VirtualPush
  device: PushDevice
  events: PushEvent[]
} {
  const push = new VirtualPush(options)
  pushes.push(push)
  const ports = findPushPorts(push.midiAccess())
  if (!ports) throw new Error('no Push among the ports')
  // A short wait keeps the test of a silent device quick.
  const device = new PushDevice({ ...ports, replyTimeoutMs: 20 })
  const events: PushEvent[] = []
  device.on((event) => events.push(event))
  return { push, device, events }
}

afterEach(() => {
  for (const push of pushes.splice(0)) expect(push.errors).toEqual([])
})

describe('findPushPorts', () => {
  it("takes the Live port under each system's names", () => {
    for (const system of ['macos', 'windows', 'linux'] as const) {
      for (const model of [2, 3] as const) {
        const ports = findPushPorts(new VirtualPush({ system, model }).midiAccess())
        expect(ports?.model).toBe(model)
        expect(ports?.port).toBe('live')
        expect(ports?.input.id).toBe(`virtual-push-${model}-live-in`)
        expect(ports?.output.id).toBe(`virtual-push-${model}-live-out`)
      }
    }
  })

  it('takes the User port when the Live port is gone, and nothing without a Push', () => {
    const push = new VirtualPush({ model: 2 })
    const access = push.midiAccess()
    access.inputs.delete('virtual-push-2-live-in')
    expect(findPushPorts(access)?.port).toBe('user')
    push.unplug()
    expect(findPushPorts(access)).toBeNull()
    expect(findPushPorts({ inputs: new Map(), outputs: new Map() })).toBeNull()
  })
})

describe('PushDevice', () => {
  it('opens: asks who is there, sets the pressure mode, starts the LED clock', async () => {
    const { push, device } = plug({ model: 3 })
    await device.open()
    expect(device.identity).toEqual({
      productId: 0x1969,
      model: 3,
      firmware: '1.0.47',
      serial: 17295091,
      boardRevision: 1,
    })
    expect(push.midiMode).toBe('live')
    expect(push.aftertouchMode).toBe('poly')
    expect(push.touchStripFlags).toBe(0x68)
    expect(push.animating).toBe(true)
    expect(device.sysexAvailable).toBe(true)
  })

  it('moves the device to the port it was given', async () => {
    const push = new VirtualPush({ model: 2 })
    pushes.push(push)
    const access = push.midiAccess()
    access.inputs.delete('virtual-push-2-live-in')
    access.outputs.delete('virtual-push-2-live-out')
    const ports = findPushPorts(access)
    if (!ports) throw new Error('no Push among the ports')
    const device = new PushDevice({ ...ports, replyTimeoutMs: 20 })
    const events: PushEvent[] = []
    device.on((event) => events.push(event))
    await device.open()
    expect(push.midiMode).toBe('user')
    push.tapPad(0, 0)
    expect(events).toHaveLength(2)
    device.setPad(0, 0, PUSH_DEFAULT_COLORS.red)
    expect(push.pad(0, 0).color).toBe(127)
    await device.close()
    expect(push.midiMode).toBe('live')
  })

  it('turns what the hands do into events', async () => {
    const { push, device, events } = plug({ model: 2 })
    await device.open()
    push.hitPad(0, 0, 100)
    push.pressPad(0, 0, 0.5)
    push.releasePad(0, 0)
    push.hitPad(7, 7, 1)
    push.tap('play')
    push.turn('track1', 3)
    push.turn('master', -2)
    push.turn('tempo', 100)
    push.touch('track8', true)
    push.touch('track8', false)
    expect(events).toEqual([
      { type: 'pad', row: 0, column: 0, on: true, velocity: 100 },
      { type: 'pad-pressure', row: 0, column: 0, pressure: 64 / 127 },
      { type: 'pad', row: 0, column: 0, on: false, velocity: 0 },
      { type: 'pad', row: 7, column: 7, on: true, velocity: 1 },
      { type: 'button', button: 'play', down: true },
      { type: 'button', button: 'play', down: false },
      { type: 'encoder', encoder: 'track1', steps: 3 },
      { type: 'encoder', encoder: 'master', steps: -2 },
      { type: 'encoder', encoder: 'tempo', steps: 63 },
      { type: 'encoder', encoder: 'tempo', steps: 37 },
      { type: 'touch', control: 'track8', touched: true },
      { type: 'touch', control: 'track8', touched: false },
    ])
  })

  it('reads the touch strip as pitch bend or as a mod wheel', async () => {
    const { push, device, events } = plug()
    await device.open()
    push.touch('strip', true)
    push.slide(1)
    push.slide(0)
    push.slide(0.5)
    push.liftStrip()
    expect(events).toEqual([
      { type: 'touch', control: 'strip', touched: true },
      { type: 'strip', value: 1 },
      { type: 'strip', value: 0 },
      { type: 'strip', value: 8192 / 16320 },
      // Out of the box the strip springs back to its centre when let go.
      { type: 'strip', value: 8192 / 16320 },
      { type: 'touch', control: 'strip', touched: false },
    ])
    events.length = 0
    device.setTouchStrip({ modWheel: true, hostLeds: true })
    expect(push.touchStripFlags).toBe(0x05)
    push.slide(1)
    push.liftStrip()
    expect(events).toEqual([
      { type: 'strip', value: 1 },
      { type: 'touch', control: 'strip', touched: false },
    ])
  })

  it("draws the host's value on the strip as a bar from the bottom", async () => {
    const { push, device } = plug()
    await device.open({ touchStrip: { hostLeds: true } })
    expect(push.touchStripFlags).toBe(0x01)
    device.setTouchStripValue(0)
    expect(push.stripLeds().filter((led) => led > 0)).toHaveLength(1)
    device.setTouchStripValue(0.5)
    const lit = push.stripLeds().filter((led) => led > 0).length
    expect(lit).toBeGreaterThanOrEqual(15)
    expect(lit).toBeLessThanOrEqual(17)
    device.setTouchStripValue(1)
    expect(push.stripLeds().every((led) => led > 0)).toBe(true)
    // The same value again is not sent again.
    const sent = push.received.length
    device.setTouchStripValue(1)
    expect(push.received.length).toBe(sent)
    // A finger on the strip does not move the LEDs: they are the host's.
    push.slide(0)
    expect(push.stripLeds().every((led) => led > 0)).toBe(true)
  })

  it("sets the strip's LEDs one by one", async () => {
    const { push, device } = plug()
    await device.open({ touchStrip: { hostLeds: true, ledsBySysex: true } })
    device.setTouchStripLeds(Array.from({ length: 31 }, (_, i) => (i === 30 ? 7 : i === 0 ? 1 : 0)))
    const leds = push.stripLeds()
    expect(leds[0]).toBeGreaterThan(0)
    expect(leds[1]).toBe(0)
    expect(leds[30]).toBe(127)
  })

  it("puts the app's colours in the palette and gives them back", async () => {
    const { push, device } = plug({ model: 3 })
    const before = [0, 1, 2, 3].map((i) => push.paletteEntry(PUSH_PALETTE_FIRST + i))
    await device.open({ colors: COLORS })
    expect(device.color('root')).toBe(PUSH_PALETTE_FIRST)
    expect(device.color('water')).toBe(PUSH_PALETTE_FIRST + 3)
    expect(device.color('nothing')).toBe(0)
    device.setPad(0, 0, 'root')
    device.setPad(7, 7, 'water')
    expect(push.pad(0, 0).rgb).toEqual(COLORS.root)
    expect(push.pad(7, 7).rgb).toEqual(COLORS.water)
    expect(push.padColors()[7][0]).toBe('#ff5a00')
    expect(push.padColors()[0][7]).toBe('#0078ff')
    // The documented defaults are left where they are.
    device.setPad(1, 0, PUSH_DEFAULT_COLORS.green)
    expect(push.pad(1, 0).rgb).toEqual({ r: 0, g: 255, b: 0 })
    await device.close()
    expect([0, 1, 2, 3].map((i) => push.paletteEntry(PUSH_PALETTE_FIRST + i))).toEqual(before)
    expect(push.pad(0, 0).color).toBe(0)
    expect(push.aftertouchMode).toBe('channel')
    expect(push.touchStripFlags).toBe(0x68)
  })

  it('changes colours while open, keeping what the device had first', async () => {
    const { push, device } = plug()
    const before = push.paletteEntry(PUSH_PALETTE_FIRST)
    await device.open({ colors: { root: COLORS.root } })
    await device.setColors({ root: COLORS.water, extra: COLORS.scale })
    device.setPad(0, 0, 'root')
    device.setPad(0, 1, 'extra')
    expect(push.pad(0, 0).rgb).toEqual(COLORS.water)
    expect(push.pad(0, 1).rgb).toEqual(COLORS.scale)
    await device.close()
    expect(push.paletteEntry(PUSH_PALETTE_FIRST)).toEqual(before)
  })

  it('refuses more colours than it has room for', async () => {
    const { device } = plug()
    await device.open()
    const many = Object.fromEntries(
      Array.from({ length: 59 }, (_, i) => [`c${i}`, { r: i, g: 0, b: 0 }]),
    )
    await expect(device.setColors(many)).rejects.toThrow(/58 app colours/)
  })

  it('sends an LED only when it changes', async () => {
    const { push, device } = plug()
    await device.open({ colors: COLORS })
    const sent = (): number => push.received.length
    let before = sent()
    device.setPad(2, 2, 'root')
    expect(sent()).toBe(before + 1)
    device.setPad(2, 2, 'root')
    device.setPad(2, 2, device.color('root'))
    expect(sent()).toBe(before + 1)
    device.setPad(2, 2, 'scale')
    expect(sent()).toBe(before + 2)
    before = sent()
    device.clear()
    expect(sent()).toBe(before + 1)
    expect(push.pad(2, 2).color).toBe(0)
    // Pads off the grid are nobody's.
    device.setPad(8, 0, 'root')
    device.setPad(0, -1, 'root')
    expect(sent()).toBe(before + 1)
  })

  it('animates an LED from one colour to another', async () => {
    const { push, device } = plug()
    await device.open({ colors: COLORS })
    device.setPad(3, 3, { color: device.color('dim'), to: device.color('root') })
    expect(push.pad(3, 3)).toMatchObject({
      color: PUSH_PALETTE_FIRST + 2,
      to: PUSH_PALETTE_FIRST,
      animation: 9, // pulsing, a quarter note
    })
    device.setPad(3, 3, {
      color: device.color('dim'),
      to: device.color('root'),
      animation: 'blink8th',
    })
    expect(push.pad(3, 3).animation).toBe(13)
    device.setPad(3, 3, 'root')
    expect(push.pad(3, 3)).toMatchObject({ color: PUSH_PALETTE_FIRST, animation: 0, to: null })
  })

  it('lights colour buttons in colour and white buttons by brightness', async () => {
    const { push, device } = plug({ model: 2 })
    await device.open({ colors: COLORS })
    device.setButton('play', 'root')
    expect(push.button('play').rgb).toEqual(COLORS.root)
    device.setButton('upper1', 'water')
    expect(push.button('upper1').rgb).toEqual(COLORS.water)
    device.setButton('undo', 'scale')
    expect(push.button('undo').color).toBe(PUSH_WHITE_LEVELS.full)
    device.setButton('shift', 'dim')
    expect(push.button('shift').color).toBe(PUSH_WHITE_LEVELS.dim)
    device.setButton('note', PUSH_WHITE_LEVELS.half)
    expect(push.button('note').color).toBe(PUSH_WHITE_LEVELS.half)
    // A button only Push 3 has is nobody's on Push 2.
    const sent = push.received.length
    device.setButton('save', 'scale')
    expect(push.received.length).toBe(sent)
  })

  it("knows Push 3's own controls", async () => {
    const { push, device, events } = plug({ model: 3 })
    await device.open({ aftertouch: 'mpe' })
    expect(push.aftertouchMode).toBe('mpe')
    push.turn('jog', 1)
    push.tap('jogPress')
    push.tap('volumeMode')
    // With MPE on, each pad comes in on a channel of its own.
    push.hitPad(1, 1, 90)
    push.hitPad(1, 2, 80)
    push.releasePad(1, 1)
    expect(events).toEqual([
      { type: 'encoder', encoder: 'jog', steps: 1 },
      { type: 'button', button: 'jogPress', down: true },
      { type: 'button', button: 'jogPress', down: false },
      { type: 'button', button: 'volumeMode', down: true },
      { type: 'button', button: 'volumeMode', down: false },
      { type: 'pad', row: 1, column: 1, on: true, velocity: 90 },
      { type: 'pad', row: 1, column: 2, on: true, velocity: 80 },
      { type: 'pad', row: 1, column: 1, on: false, velocity: 0 },
    ])
    device.setButton('save', PUSH_WHITE_LEVELS.full)
    expect(push.button('save').color).toBe(127)
  })

  it('works without sysex, on the documented default colours', async () => {
    const { push, device, events } = plug({ sysex: false })
    await device.open({ colors: COLORS })
    expect(device.sysexAvailable).toBe(false)
    expect(device.identity).toBeNull()
    expect(device.color('root')).toBe(PUSH_DEFAULT_COLORS.red)
    expect(device.color('scale')).toBe(PUSH_DEFAULT_COLORS.white)
    expect(device.color('dim')).toBe(PUSH_DEFAULT_COLORS.darkGray)
    expect(device.color('water')).toBe(PUSH_DEFAULT_COLORS.blue)
    device.setPad(0, 0, 'root')
    expect(push.pad(0, 0).rgb).toEqual({ r: 255, g: 0, b: 0 })
    push.tapPad(4, 4)
    expect(events).toHaveLength(2)
    await device.close()
    expect(push.received.some((message) => message[0] === 0xf0)).toBe(false)
  })

  it('carries on when the device does not answer', async () => {
    const { push, device } = plug()
    const input = findPushPorts(push.midiAccess())?.input
    await device.open()
    // Nothing comes back: the question times out and the colours go in anyway.
    if (input) input.onmidimessage = null
    await device.setColors({ root: COLORS.root })
    if (input) input.onmidimessage = (event) => device.receive(event.data ?? [])
    device.setPad(0, 0, 'root')
    expect(push.pad(0, 0).rgb).toEqual(COLORS.root)
  })

  it('reads bytes however a port cuts them', async () => {
    const { device, events } = plug({ model: 2 })
    await device.open()
    // Two messages in one packet, running status, a clock byte in the middle, a sysex in pieces.
    device.receive([0x90, 36, 100, 0x90, 37, 90])
    device.receive([0x90, 38, 80, 39, 70])
    device.receive([0xb0, 71, 0xf8, 1])
    device.receive([0xf0, 0x00, 0x21])
    device.receive([0x1d, 0x01, 0x01, 0x1f, 0x00, 0xf7, 0x80, 36, 0])
    expect(events).toEqual([
      { type: 'pad', row: 0, column: 0, on: true, velocity: 100 },
      { type: 'pad', row: 0, column: 1, on: true, velocity: 90 },
      { type: 'pad', row: 0, column: 2, on: true, velocity: 80 },
      { type: 'pad', row: 0, column: 3, on: true, velocity: 70 },
      { type: 'encoder', encoder: 'track1', steps: 1 },
      { type: 'pad', row: 0, column: 0, on: false, velocity: 0 },
    ])
  })

  it('reads the pedals and channel pressure', async () => {
    const { device, events } = plug({ model: 2 })
    await device.open({ aftertouch: 'channel' })
    device.receive([0xb0, 64, 127])
    device.receive([0xb0, 69, 0])
    device.receive([0xd0, 127])
    expect(events).toEqual([
      { type: 'pedal', pedal: 1, value: 1 },
      { type: 'pedal', pedal: 2, value: 0 },
      { type: 'pressure', pressure: 1 },
    ])
  })

  it('sets the brightnesses', async () => {
    const { push, device } = plug()
    await device.open()
    device.setLedBrightness(64)
    device.setDisplayBrightness(200)
    expect(push.ledBrightness).toBe(64)
    expect(push.displayBrightness).toBe(200)
  })

  it('goes quiet after close', async () => {
    const { push, device, events } = plug()
    await device.open()
    await device.close()
    const sent = push.received.length
    device.setPad(0, 0, 127)
    device.setTouchStripValue(1)
    push.tapPad(0, 0)
    expect(push.received.length).toBe(sent)
    expect(events).toEqual([])
    expect(device.opened).toBe(false)
    // And opens again.
    await device.open()
    push.tapPad(0, 0)
    expect(events).toHaveLength(2)
  })

  it('wants to know which Push it is talking to', () => {
    const port = { name: 'IAC Driver Bus 1', onmidimessage: null, send: () => undefined }
    expect(() => new PushDevice({ input: port, output: port })).toThrow(/not a Push 2 or Push 3/)
    expect(new PushDevice({ input: port, output: port, model: 3 }).model).toBe(3)
  })
})

describe('nearestDefaultPushColor', () => {
  it('picks among the seven colours the manual documents', () => {
    expect(nearestDefaultPushColor({ r: 0, g: 0, b: 0 })).toBe(PUSH_DEFAULT_COLORS.black)
    expect(nearestDefaultPushColor({ r: 250, g: 250, b: 250 })).toBe(PUSH_DEFAULT_COLORS.white)
    expect(nearestDefaultPushColor({ r: 120, g: 120, b: 110 })).toBe(PUSH_DEFAULT_COLORS.lightGray)
    expect(nearestDefaultPushColor({ r: 40, g: 40, b: 40 })).toBe(PUSH_DEFAULT_COLORS.darkGray)
    expect(nearestDefaultPushColor({ r: 255, g: 90, b: 0 })).toBe(PUSH_DEFAULT_COLORS.red)
    expect(nearestDefaultPushColor({ r: 30, g: 200, b: 90 })).toBe(PUSH_DEFAULT_COLORS.green)
    expect(nearestDefaultPushColor({ r: 0, g: 120, b: 255 })).toBe(PUSH_DEFAULT_COLORS.blue)
  })
})
