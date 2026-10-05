import { describe, expect, it } from 'vitest'

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
