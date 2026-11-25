import { describe, expect, it } from 'vitest'

import { MIRROR_ON_D } from '../mirror-on-d'
import { MakerPlayer } from '../player'
import { type MadeEvent } from '../types'

function rig(params: Record<string, number> = {}) {
  let now = 0
  let tick: (() => void) | null = null
  const events: MadeEvent[] = []
  const player = new MakerPlayer(MIRROR_ON_D.create({ params }), {
    now: () => now,
    note: (event) => events.push(event),
    timer: {
      set: (callback) => {
        tick = callback
        return 1
      },
      clear: () => {
        tick = null
      },
    },
  })
  return {
    player,
    events,
    ticking: () => tick !== null,
    to: (sec: number, stepSec = 0.005) => {
      while (now + stepSec < sec) {
        now += stepSec
        tick?.()
      }
      now = sec
      tick?.()
    },
  }
}

describe('a maker under the hands', () => {
  it('plays at once what is due at once, with no timer', () => {
    const { player, events, ticking } = rig()
    player.noteOn(1, 64, 0.8)
    expect(events.map((event) => event.note)).toEqual([64, 60])
    expect(ticking()).toBe(false)
    player.noteOff(1)
    expect(events.filter((event) => !event.on)).toHaveLength(2)
  })

  it('waits for what comes later, and stops waiting when it has come', () => {
    const { player, events, ticking, to } = rig({ delay: 0.5 })
    player.noteOn(1, 64, 0.8)
    expect(events).toHaveLength(1)
    expect(ticking()).toBe(true)
    to(0.4)
    expect(events).toHaveLength(1)
    to(0.52)
    expect(events.map((event) => event.note)).toEqual([64, 60])
    expect(ticking()).toBe(false)
  })

  it('plays nothing that began and ended while the page slept', () => {
    const { player, events, to } = rig({ delay: 1 })
    player.noteOn(1, 64, 0.8)
    to(0.1)
    player.noteOff(1)
    to(30, 29)
    expect(events.map((event) => [event.on, event.note])).toEqual([
      [true, 64],
      [false, 64],
    ])
  })

  it('lets go of everything when it is put away', () => {
    const { player, events, ticking, to } = rig({ delay: 0.5 })
    player.noteOn(1, 64, 0.8)
    to(1)
    player.noteOn(2, 67, 0.8)
    player.dispose()
    expect(ticking()).toBe(false)
    const open = new Set<number>()
    for (const event of events) {
      if (event.on) open.add(event.id)
      else open.delete(event.id)
    }
    expect(open.size).toBe(0)
  })
})
