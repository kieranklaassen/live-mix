import { describe, expect, it } from 'vitest'

import { PUSH_DISPLAY_FRAME_BYTES, PUSH_FRAME_HEADER } from '../../core/control/push/display'
import { PUSH_ENCODERS, pushEncoderSteps } from '../../core/control/push/protocol'
import { VirtualPush } from '../index'

/** The steps of every encoder message the device sent on its live port. */
function turnsSeen(push: VirtualPush): number[] {
  const steps: number[] = []
  const [live] = [...push.midiAccess().inputs.values()]
  live.onmidimessage = (event) => {
    const data = event.data
    if (data === null) return
    if (data[0] === 0xb0 && data[1] === PUSH_ENCODERS.tempo) steps.push(pushEncoderSteps(data[2]))
  }
  return steps
}

describe('VirtualPush.turn', () => {
  it('sends a long turn as several messages that add up to it', () => {
    const push = new VirtualPush()
    const steps = turnsSeen(push)
    push.turn('tempo', 150)
    push.turn('tempo', -150)
    expect(steps).toEqual([63, 63, 24, -64, -64, -22])
  })

  it('refuses a turn that is no number of steps, where it used never to come back', () => {
    const push = new VirtualPush()
    const steps = turnsSeen(push)
    expect(() => push.turn('tempo', NaN)).toThrow(RangeError)
    expect(() => push.turn('tempo', Infinity)).toThrow(RangeError)
    expect(() => push.turn('tempo', -Infinity)).toThrow(RangeError)
    expect(steps).toEqual([])
  })
})

describe('VirtualPush.plug', () => {
  it('comes back as it powers up: no clock started, the strip at rest, and no frame half taken', async () => {
    const push = new VirtualPush()
    const display = push.usbDevice
    const [live] = [...push.midiAccess().outputs.values()]
    await display.open()
    await display.claimInterface(0)
    // The host started the clock, a finger slid up the strip, and a frame was on its way
    // (its header and a part of its pixels sent) when the cable came out.
    live.send([0xfa])
    push.slide(1)
    await display.transferOut(1, new Uint8Array(PUSH_FRAME_HEADER))
    await display.transferOut(1, new Uint8Array(1024))
    expect(push.animating).toBe(true)
    const moved = push.stripLeds()
    push.unplug()
    push.plug()
    // A device that has just powered up has had no MIDI start,
    expect(push.animating).toBe(false)
    expect(push.stripLeds()).not.toEqual(moved)
    expect(push.stripLeds()).toEqual(new VirtualPush().stripLeds())
    // and the first frame it is sent is a frame: its header is not taken for the rest of the old one's pixels.
    await display.open()
    await display.claimInterface(0)
    await display.transferOut(1, new Uint8Array(PUSH_FRAME_HEADER))
    await display.transferOut(1, new Uint8Array(PUSH_DISPLAY_FRAME_BYTES))
    expect(push.errors).toEqual([])
    expect(push.frames).toBe(1)
  })
})
