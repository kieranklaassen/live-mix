import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { quietSignals, type VisualFrame } from '../frame'
import { receiveVisuals, sendVisuals, type VisualLine } from '../line'
import { DEFAULT_PALETTE, visualPalette } from '../palettes'

// A line as a `BroadcastChannel` is one: what one end says reaches every other end of that name, never itself.
function hub() {
  const ends = new Map<string, Set<VisualLine>>()
  const said: unknown[] = []
  const open = (name: string): VisualLine => {
    const mine = ends.get(name) ?? new Set<VisualLine>()
    ends.set(name, mine)
    const end: VisualLine = {
      onmessage: null,
      postMessage(message) {
        said.push(message)
        for (const other of [...mine]) if (other !== end) other.onmessage?.({ data: message })
      },
      close() {
        mine.delete(end)
      },
    }
    mine.add(end)
    return end
  }
  return { open, said, ends: (name: string) => ends.get(name)?.size ?? 0 }
}

const frameWith = (time: number, travel: number, mix = 0.5): VisualFrame => ({
  signals: { ...quietSignals(), time, travel, mix },
  layers: [{ paint: 'dot-globe', variation: 0, level: 1, size: 0.5, glow: 0.7, hue: 0 }],
  palette: visualPalette(DEFAULT_PALETTE),
  grain: 0.3,
})

describe('the line to a second screen', () => {
  let clock = 0
  const now = () => clock
  const pass = (ms: number) => {
    clock += ms
    vi.advanceTimersByTime(ms)
  }

  beforeEach(() => {
    clock = 1000
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('works out and sends nothing while no screen listens', () => {
    const { open, said } = hub()
    const frameAt = vi.fn(() => frameWith(0, 0))
    const sender = sendVisuals('picture', frameAt, { open, now })

    pass(2000)

    expect(sender.watched()).toBe(false)
    expect(frameAt).not.toHaveBeenCalled()
    expect(said).toEqual([{ visuals: 1, ask: true }])
    sender.close()
  })

  it('sends a frame thirty times a second once a screen listens, and the screen paints the last', () => {
    const { open } = hub()
    let made = 0
    const frameAt = vi.fn((at: number) => frameWith(at / 1000, ++made))
    const sender = sendVisuals('picture', frameAt, { open, now })
    const screen = receiveVisuals('picture', { open, now })

    expect(sender.watched()).toBe(true)
    expect(screen.live()).toBe(false)
    pass(1000)

    expect(frameAt.mock.calls.length).toBeGreaterThanOrEqual(29)
    expect(frameAt.mock.calls.length).toBeLessThanOrEqual(30)
    expect(frameAt).toHaveBeenLastCalledWith(clock)
    expect(screen.live()).toBe(true)
    const shown = screen.frameAt(clock)
    expect(shown.signals.travel).toBe(made)
    expect(shown.layers).toEqual([
      { paint: 'dot-globe', variation: 0, level: 1, size: 0.5, glow: 0.7, hue: 0 },
    ])
    expect(shown.grain).toBe(0.3)
    sender.close()
    screen.close()
  })

  it('carries the filter a frame has, as it is', () => {
    const lines = hub()
    const filter = { soft: 0.6, dim: 0.2, thin: 0, spread: 0.3 }
    const sender = sendVisuals('picture', () => ({ ...frameWith(clock / 1000, 1), filter }), {
      open: lines.open,
      now,
    })
    const screen = receiveVisuals('picture', { open: lines.open, now })
    pass(40)
    expect(screen.frameAt(clock).filter).toEqual(filter)
    pass(500)
    expect(screen.frameAt(clock).filter).toEqual(filter)
    sender.close()
    screen.close()
  })

  it('is heard at once by a sender that starts after the screen', () => {
    const { open } = hub()
    const screen = receiveVisuals('picture', { open, now })
    const sender = sendVisuals('picture', () => frameWith(0, 0), { open, now })

    expect(sender.watched()).toBe(true)
    sender.close()
    screen.close()
  })

  it('keeps the picture moving by the screen’s own clock between frames', () => {
    const { open } = hub()
    const line = open('picture')
    const screen = receiveVisuals('picture', { open, now })

    // Before a frame came: dark, and the same however long it is asked.
    expect(screen.frameAt(clock + 500).layers).toEqual([])
    expect(screen.frameAt(clock + 500).signals.time).toBe(0)

    line.postMessage({ visuals: 1, frame: frameWith(10, 100) })
    clock += 500
    // Half a second of the sender's time later the picture has travelled 4: eight a second.
    line.postMessage({ visuals: 1, frame: frameWith(10.5, 104, 0.8) })

    expect(screen.frameAt(clock)).toMatchObject({ signals: { time: 10.5, travel: 104, mix: 0.8 } })
    const later = screen.frameAt(clock + 250)
    expect(later.signals.time).toBeCloseTo(10.75, 6)
    expect(later.signals.travel).toBeCloseTo(106, 6)
    // What is heard stays as it came: only the sender knows it.
    expect(later.signals.mix).toBe(0.8)
    // Asked with a time before the frame came, it is not run backwards.
    expect(screen.frameAt(clock - 100).signals.time).toBe(10.5)
    screen.close()
    line.close()
  })

  it('says the frames stopped when none came for three seconds', () => {
    const { open } = hub()
    const sender = sendVisuals('picture', () => frameWith(0, 0), { open, now })
    const screen = receiveVisuals('picture', { open, now })
    pass(200)
    expect(screen.live()).toBe(true)

    sender.close()
    pass(2900)
    expect(screen.live()).toBe(true)
    pass(200)
    expect(screen.live()).toBe(false)
    screen.close()
  })

  it('stops sending when the last screen leaves, and not when one of two does', () => {
    const { open, ends } = hub()
    const frameAt = vi.fn(() => frameWith(0, 0))
    const sender = sendVisuals('picture', frameAt, { open, now })
    const first = receiveVisuals('picture', { open, now })
    const second = receiveVisuals('picture', { open, now })
    pass(100)

    first.close()
    expect(sender.watched()).toBe(true)
    second.close()
    expect(sender.watched()).toBe(false)
    const sent = frameAt.mock.calls.length
    pass(1000)
    expect(frameAt.mock.calls.length).toBe(sent)

    sender.close()
    expect(ends('picture')).toBe(0)
  })

  it('stops sending to a screen that went without a word', () => {
    const { open } = hub()
    const frameAt = vi.fn(() => frameWith(0, 0))
    const sender = sendVisuals('picture', frameAt, { open, now })
    const line = open('picture')
    line.postMessage({ visuals: 1, here: true })
    pass(2900)
    expect(sender.watched()).toBe(true)
    pass(200)

    expect(sender.watched()).toBe(false)
    sender.close()
    line.close()
  })

  it('does not listen to what is not its own', () => {
    const { open } = hub()
    const line = open('picture')
    const sender = sendVisuals('picture', () => frameWith(0, 0), { open, now })
    const screen = receiveVisuals('other', { open, now })

    for (const message of [null, 'here', 7, { here: true }, { visuals: 2, here: true }])
      line.postMessage(message)
    line.postMessage({ visuals: 2, frame: frameWith(5, 5) })

    expect(sender.watched()).toBe(false)
    expect(screen.live()).toBe(false)
    sender.close()
    screen.close()
    line.close()
  })

  it('sends at the pace it is handed, and none of its own', () => {
    const { open } = hub()
    const frameAt = vi.fn(() => frameWith(0, 0))
    let turn: (() => void) | null = null
    let asked = 0
    const every = (next: () => void, ms: number) => {
      asked = ms
      turn = next
      return () => {
        turn = null
      }
    }
    const sender = sendVisuals('picture', frameAt, { open, now, every, fps: 25 })
    const screen = receiveVisuals('picture', { open, now })
    expect(asked).toBe(40)

    // The page's timers are slowed to nothing: no frame goes of itself.
    pass(500)
    expect(frameAt).not.toHaveBeenCalled()
    // Each turn the host gives is a frame.
    for (let count = 0; count < 3; count++) (turn as (() => void) | null)?.()
    expect(frameAt).toHaveBeenCalledTimes(3)
    expect(screen.live()).toBe(true)

    sender.close()
    expect(turn).toBeNull()
    screen.close()
  })
})
