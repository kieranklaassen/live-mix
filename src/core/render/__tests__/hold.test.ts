import { describe, expect, it } from 'vitest'

import { canHoldRender, holdFrame, holdRenderAt, type HoldableContext } from '../hold'

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

/** An offline context that refuses a second suspend at a block, as a browser does. */
class FakeOffline implements HoldableContext {
  readonly sampleRate = 48000
  frame = 0
  resumes = 0
  suspended = false
  readonly booked: number[] = []
  private readonly waiting = new Map<number, () => void>()

  startRendering(): void {}

  suspend(time: number): Promise<void> {
    const frame = Math.round(time * this.sampleRate)
    if (this.waiting.has(frame)) return Promise.reject(new Error('already suspended there'))
    if (frame < this.frame) return Promise.reject(new Error('already rendered'))
    this.booked.push(frame)
    return new Promise((resolve) => this.waiting.set(frame, resolve))
  }

  resume(): Promise<void> {
    this.resumes += 1
    this.suspended = false
    return Promise.resolve()
  }

  /** Render to the next booked stop. */
  async renderOn(): Promise<void> {
    const next = [...this.waiting.keys()].sort((a, b) => a - b)[0]
    if (next === undefined) return
    this.frame = next
    this.suspended = true
    this.waiting.get(next)?.()
    this.waiting.delete(next)
    await tick()
  }
}

describe('holdFrame', () => {
  it('rounds up to a block boundary, as a context does', () => {
    expect(holdFrame(0, 48000)).toBe(0)
    expect(holdFrame(64 / 48000, 48000)).toBe(128)
    expect(holdFrame(128 / 48000, 48000)).toBe(128)
    expect(holdFrame(129 / 48000, 48000)).toBe(256)
    expect(holdFrame(-1, 48000)).toBe(0)
  })
})

describe('canHoldRender', () => {
  it('is true for an offline context only', () => {
    expect(canHoldRender(new FakeOffline())).toBe(true)
    expect(canHoldRender({ suspend: () => {}, resume: () => {} })).toBe(false)
  })
})

describe('holdRenderAt', () => {
  it('runs the task at the block and resumes after it', async () => {
    const context = new FakeOffline()
    const order: string[] = []
    const held = holdRenderAt(context, 100 / 48000, async () => {
      order.push('task')
      await tick()
      order.push('task done')
    })
    expect(context.booked).toEqual([128])

    await context.renderOn()
    await held
    await tick()
    expect(order).toEqual(['task', 'task done'])
    expect(context.resumes).toBe(1)
  })

  it('two tasks at one block share its stop and run in the order asked', async () => {
    const context = new FakeOffline()
    const order: string[] = []
    const first = holdRenderAt(context, 200 / 48000, () => void order.push('first'))
    const second = holdRenderAt(context, 256 / 48000, () => void order.push('second'))
    // One suspend: a second at the same block would have been refused.
    expect(context.booked).toEqual([256])

    await context.renderOn()
    await Promise.all([first, second])
    await tick()
    expect(order).toEqual(['first', 'second'])
    expect(context.resumes).toBe(1)
  })

  it('a task may ask for a later hold, and for one at the block it runs in', async () => {
    const context = new FakeOffline()
    const order: string[] = []
    void holdRenderAt(context, 128 / 48000, () => {
      order.push('at 128')
      void holdRenderAt(context, 128 / 48000, () => void order.push('also at 128'))
      void holdRenderAt(context, 512 / 48000, () => void order.push('at 512'))
    })

    await context.renderOn()
    expect(order).toEqual(['at 128', 'also at 128'])
    expect(context.resumes).toBe(1)
    expect(context.booked).toEqual([128, 512])

    await context.renderOn()
    expect(order).toEqual(['at 128', 'also at 128', 'at 512'])
    expect(context.resumes).toBe(2)
  })

  it('a task that throws rejects its own promise and the render still resumes', async () => {
    const context = new FakeOffline()
    const failed = holdRenderAt(context, 128 / 48000, () => {
      throw new Error('no')
    })
    const fine = holdRenderAt(context, 128 / 48000, () => {})
    const outcome = failed.then(
      () => 'resolved',
      (error: Error) => error.message,
    )

    await context.renderOn()
    expect(await outcome).toBe('no')
    await fine
    await tick()
    expect(context.resumes).toBe(1)
  })

  it('rejects when the context refuses the stop, and the block can be asked for again', async () => {
    const context = new FakeOffline()
    context.frame = 1000
    await expect(holdRenderAt(context, 128 / 48000, () => {})).rejects.toThrow('already rendered')

    context.frame = 0
    const held = holdRenderAt(context, 128 / 48000, () => {})
    await context.renderOn()
    await held
  })

  it('keeps the stops of two contexts apart', async () => {
    const a = new FakeOffline()
    const b = new FakeOffline()
    void holdRenderAt(a, 128 / 48000, () => {})
    void holdRenderAt(b, 128 / 48000, () => {})
    expect(a.booked).toEqual([128])
    expect(b.booked).toEqual([128])
  })
})
