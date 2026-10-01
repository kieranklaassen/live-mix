// The numbers and byte sequences here are the examples the "Ableton Push 2
// MIDI and Display Interface Manual" (rev. 1.1) prints, so a slip in this
// module shows as a difference from the manual, not from another reading of it.

import { describe, expect, it } from 'vitest'

import {
  PUSH_BUTTONS,
  PUSH_COMMANDS,
  PUSH_LED_ANIMATIONS,
  PUSH_TOUCH_STRIP_DEFAULT,
  isRgbPushButton,
  parsePushIdentity,
  parsePushPaletteEntry,
  parsePushPortName,
  parsePushSysex,
  pushButtonAt,
  pushButtonController,
  pushButtonLedMessage,
  pushEncoderAt,
  pushEncoderSteps,
  pushEncoderValue,
  pushModelForProductId,
  pushPadAt,
  pushPadLedMessage,
  pushPadNote,
  pushSetDisplayBrightness,
  pushSetLedBrightness,
  pushSetPaletteEntry,
  pushSetTouchStripLeds,
  pushSysex,
  pushTouchAt,
  pushTouchStripFlags,
} from '../protocol'

const hex = (text: string): number[] => text.split(' ').map((byte) => parseInt(byte, 16))

describe('Push ports', () => {
  it('reads the model and the port from the names each system gives', () => {
    expect(parsePushPortName('Ableton Push 2 Live Port')).toEqual({ model: 2, port: 'live' })
    expect(parsePushPortName('Ableton Push 2 User Port')).toEqual({ model: 2, port: 'user' })
    expect(parsePushPortName('Ableton Push 3 Live Port')).toEqual({ model: 3, port: 'live' })
    expect(parsePushPortName('Ableton Push 2')).toEqual({ model: 2, port: 'live' })
    expect(parsePushPortName('MIDIIN2 (Ableton Push 2)')).toEqual({ model: 2, port: 'user' })
    expect(parsePushPortName('MIDIOUT2 (Ableton Push 3) 4')).toEqual({ model: 3, port: 'user' })
    expect(parsePushPortName('Ableton Push 3 MIDI 1')).toEqual({ model: 3, port: 'live' })
    expect(parsePushPortName('Ableton Push 3 MIDI 2')).toEqual({ model: 3, port: 'user' })
    expect(parsePushPortName('Ableton Push 2 28:1')).toEqual({ model: 2, port: 'user' })
  })

  it('leaves other controllers and the first Push alone', () => {
    expect(parsePushPortName('Ableton Push Live Port')).toBeNull()
    expect(parsePushPortName('Launchpad Pro MK3')).toBeNull()
    expect(parsePushPortName(null)).toBeNull()
  })

  it('knows the two USB product ids', () => {
    expect(pushModelForProductId(0x1967)).toBe(2)
    expect(pushModelForProductId(0x1969)).toBe(3)
    expect(pushModelForProductId(0x1968)).toBeNull()
  })
})

describe('pads, buttons and encoders', () => {
  it('numbers the pads from 36 at the bottom left to 99 at the top right', () => {
    expect(pushPadNote(0, 0)).toBe(36)
    expect(pushPadNote(0, 7)).toBe(43)
    expect(pushPadNote(7, 0)).toBe(92)
    expect(pushPadNote(7, 7)).toBe(99)
    expect(pushPadAt(99)).toEqual({ row: 7, column: 7 })
    expect(pushPadAt(64)).toEqual({ row: 3, column: 4 })
    expect(pushPadAt(12)).toBeNull()
    expect(pushPadAt(100)).toBeNull()
  })

  it('names the buttons by the controller numbers of the mapping figure', () => {
    expect(PUSH_BUTTONS.play).toBe(85)
    expect(PUSH_BUTTONS.record).toBe(86)
    expect(PUSH_BUTTONS.undo).toBe(119)
    expect(PUSH_BUTTONS.upper1).toBe(102)
    expect(PUSH_BUTTONS.lower8).toBe(27)
    // The scene buttons run top to bottom: 1/32t (43) is beside the top row.
    expect(PUSH_BUTTONS.scene1).toBe(43)
    expect(PUSH_BUTTONS.scene8).toBe(36)
    expect(pushButtonAt(2, 9)).toBe('metronome')
    expect(pushButtonAt(2, 60)).toBe('mute')
    expect(pushButtonAt(2, 1)).toBeNull()
  })

  it('knows which buttons have a colour LED', () => {
    expect(isRgbPushButton('play')).toBe(true)
    expect(isRgbPushButton('upper3')).toBe(true)
    expect(isRgbPushButton('scene5')).toBe(true)
    expect(isRgbPushButton('undo')).toBe(false)
    expect(isRgbPushButton('shift')).toBe(false)
  })

  it('keeps what only Push 3 has away from Push 2', () => {
    expect(pushButtonAt(3, 94)).toBe('jogPress')
    expect(pushButtonAt(2, 94)).toBeNull()
    expect(pushButtonController(2, 'save')).toBeNull()
    expect(pushButtonController(3, 'save')).toBe(82)
    // Push 3's New button moved, and its 111 is no Browse button.
    expect(pushButtonController(2, 'new')).toBe(87)
    expect(pushButtonController(3, 'new')).toBe(92)
    expect(pushButtonAt(3, 92)).toBe('new')
    expect(pushButtonAt(2, 111)).toBe('browse')
    expect(pushButtonAt(3, 111)).toBe('volumeMode')
    expect(pushButtonController(3, 'browse')).toBeNull()
    // Controller 15 is Push 2's swing encoder and the press of Push 3's small encoder.
    expect(pushEncoderAt(2, 15)).toBe('swing')
    expect(pushEncoderAt(3, 15)).toBeNull()
    expect(pushButtonAt(3, 15)).toBe('smallEncoderPress')
    expect(pushEncoderAt(3, 70)).toBe('jog')
    expect(pushEncoderAt(2, 70)).toBeNull()
  })

  it('finds the encoders and their touch sensors', () => {
    expect(pushEncoderAt(2, 71)).toBe('track1')
    expect(pushEncoderAt(2, 78)).toBe('track8')
    expect(pushEncoderAt(2, 79)).toBe('master')
    expect(pushEncoderAt(2, 14)).toBe('tempo')
    expect(pushTouchAt(0)).toBe('track1')
    expect(pushTouchAt(8)).toBe('master')
    expect(pushTouchAt(10)).toBe('tempo')
    expect(pushTouchAt(12)).toBe('strip')
    expect(pushTouchAt(11)).toBeNull()
  })

  it("reads encoder steps as the manual does: 7 bits, two's complement", () => {
    expect(pushEncoderSteps(0x01)).toBe(1) // master encoder turned right by 1 step
    expect(pushEncoderSteps(0x0a)).toBe(10)
    expect(pushEncoderSteps(0x7f)).toBe(-1) // tempo encoder turned left by 1 step
    expect(pushEncoderSteps(0x7c)).toBe(-4)
    expect(pushEncoderSteps(63)).toBe(63)
    expect(pushEncoderSteps(64)).toBe(-64)
    for (const steps of [-64, -20, -1, 1, 7, 63]) {
      expect(pushEncoderSteps(pushEncoderValue(steps))).toBe(steps)
    }
  })
})

describe('LED messages', () => {
  it("match the manual's examples", () => {
    expect(pushPadLedMessage(99, 127)).toEqual(hex('90 63 7f')) // top right pad red
    expect(pushPadLedMessage(36, 126)).toEqual(hex('90 24 7e')) // bottom left pad green
    expect(pushButtonLedMessage(PUSH_BUTTONS.mute, 0)).toEqual(hex('b0 3c 00')) // mute off
    expect(pushButtonLedMessage(PUSH_BUTTONS.master, 127)).toEqual(hex('b0 1c 7f')) // master full
    // "let the undo button white LED blink slowly", "fast transition of mute button LED to blue"
    expect(pushButtonLedMessage(PUSH_BUTTONS.undo, 127, PUSH_LED_ANIMATIONS.blinkHalf)).toEqual(
      hex('bf 77 7f'),
    )
    expect(pushButtonLedMessage(PUSH_BUTTONS.mute, 125, PUSH_LED_ANIMATIONS.oneShot24th)).toEqual(
      hex('b1 3c 7d'),
    )
  })
})

describe('sysex', () => {
  it('frames a command as the manual shows', () => {
    expect(pushSysex(PUSH_COMMANDS.setMidiMode, [1])).toEqual(hex('f0 00 21 1d 01 01 0a 01 f7'))
    expect(pushSysex(PUSH_COMMANDS.reapplyPalette)).toEqual(hex('f0 00 21 1d 01 01 05 f7'))
    expect(pushSysex(PUSH_COMMANDS.setAftertouchMode, [1])).toEqual(
      hex('f0 00 21 1d 01 01 1e 01 f7'),
    )
    expect(pushSysex(PUSH_COMMANDS.getPaletteEntry, [0x7d])).toEqual(
      hex('f0 00 21 1d 01 01 04 7d f7'),
    )
  })

  it('refuses a command the manual does not document, and an argument over 7 bits', () => {
    // 0x1d reads factory calibration; 0x22 and 0x23 write it. None is sent from here.
    expect(() => pushSysex(0x23, [0, 0, 0])).toThrow(/not a documented Push command/)
    expect(() => pushSysex(0x02)).toThrow(/not a documented Push command/)
    expect(() => pushSysex(PUSH_COMMANDS.setLedBrightness, [200])).toThrow(/7-bit/)
  })

  it('sets a palette entry: 8-bit colours as two 7-bit bytes each', () => {
    // "set entry 125 to 0/0/255 and 126"
    expect(pushSetPaletteEntry(125, { r: 0, g: 0, b: 255 }, 126)).toEqual(
      hex('f0 00 21 1d 01 01 03 7d 00 00 00 00 7f 01 7e 00 f7'),
    )
    const reply = parsePushSysex(hex('f0 00 21 1d 01 01 04 7d 00 00 00 00 7f 01 7e 00 f7'))
    expect(reply?.command).toBe(PUSH_COMMANDS.getPaletteEntry)
    expect(parsePushPaletteEntry(reply?.args ?? [])).toEqual({
      index: 125,
      r: 0,
      g: 0,
      b: 255,
      white: 126,
    })
  })

  it('sets the brightnesses', () => {
    expect(pushSetDisplayBrightness(255)).toEqual(hex('f0 00 21 1d 01 01 08 7f 01 f7'))
    expect(pushSetDisplayBrightness(64)).toEqual(hex('f0 00 21 1d 01 01 08 40 00 f7'))
    expect(pushSetLedBrightness(64)).toEqual(hex('f0 00 21 1d 01 01 06 40 f7'))
  })

  it("packs the touch strip's flags and LEDs", () => {
    // The manual's three examples: the default, a volume bar, and host LEDs by sysex.
    expect(pushTouchStripFlags(PUSH_TOUCH_STRIP_DEFAULT)).toBe(0x68)
    expect(pushTouchStripFlags({ modWheel: true, point: true })).toBe(0x0c)
    expect(pushTouchStripFlags({ hostLeds: true, ledsBySysex: true })).toBe(0x03)
    // "set each fourth touch strip LED to full brightness, the others are half lit"
    const levels = Array.from({ length: 31 }, (_, i) => (i % 4 === 0 ? 7 : 4))
    expect(pushSetTouchStripLeds(levels)).toEqual(
      hex('f0 00 21 1d 01 01 19 27 24 27 24 27 24 27 24 27 24 27 24 27 24 27 04 f7'),
    )
  })

  it('reads the identity reply', () => {
    const reply = hex('f0 7e 01 06 02 00 21 1d 67 32 02 00 01 00 2f 00 73 4d 1f 08 00 01 f7')
    expect(parsePushIdentity(reply)).toEqual({
      productId: 0x1967,
      model: 2,
      firmware: '1.0.47',
      serial: 17295091,
      boardRevision: 1,
    })
    expect(parsePushIdentity(hex('f0 7e 01 06 02 00 20 29 01 01 f7'))).toBeNull()
  })

  it('tells a Push message from anything else', () => {
    expect(parsePushSysex(hex('f0 00 21 1d 01 01 0a 01 f7'))).toEqual({ command: 0x0a, args: [1] })
    expect(parsePushSysex(hex('f0 7e 01 06 01 f7'))).toBeNull()
    expect(parsePushSysex(hex('f0 00 20 29 02 0d f7'))).toBeNull()
  })
})
