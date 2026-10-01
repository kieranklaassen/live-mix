// Holding an offline render. `OfflineAudioContext.suspend(time)` stops a
// render at a block so the page can do something there (send a note, wait
// for a plug-in host to catch up) before `resume()`. A context takes only one
// suspend per block and refuses a second, so two parties that each call it
// on their own collide sooner or later. `holdRenderAt` is the one door: every
// task wanted at a block shares that block's stop, they run in the order they
// were asked for, and the render resumes once, after the last.

/** The slice of `OfflineAudioContext` a hold uses. */
export interface HoldableContext {
  readonly sampleRate: number
  suspend(time: number): Promise<void>
  resume(): Promise<void>
}

export const RENDER_QUANTUM_FRAMES = 128

type Task = () => void | Promise<void>

interface Stop {
  tasks: { run: Task; done: () => void; fail: (reason: unknown) => void }[]
}

const stops = new WeakMap<object, Map<number, Stop>>()

/** Whether `context` can be held: an offline context can, a live one cannot. */
export function canHoldRender(context: object): context is HoldableContext {
  const candidate = context as { startRendering?: unknown; suspend?: unknown; resume?: unknown }
  return (
    typeof candidate.startRendering === 'function' &&
    typeof candidate.suspend === 'function' &&
    typeof candidate.resume === 'function'
  )
}

/** The block boundary a hold at `timeSec` lands on: a context rounds up to one. */
export function holdFrame(timeSec: number, sampleRate: number): number {
  const blocks = Math.ceil((timeSec * sampleRate) / RENDER_QUANTUM_FRAMES - 1e-6)
  return Math.max(0, blocks) * RENDER_QUANTUM_FRAMES
}

/**
 * Stop the render at the block at or after `timeSec`, run `task` there and
 * let the render carry on once it (and every other task at that block) has
 * finished. A task may ask for further holds, later ones or one at the block
 * it is running in. The promise settles with the task; it rejects when the
 * context refuses the stop (the time is already rendered, or past the end).
 * Whatever a task does, the render resumes.
 */
export function holdRenderAt(context: HoldableContext, timeSec: number, task: Task): Promise<void> {
  let byFrame = stops.get(context)
  if (!byFrame) {
    byFrame = new Map()
    stops.set(context, byFrame)
  }
  const frame = holdFrame(timeSec, context.sampleRate)

  return new Promise<void>((done, fail) => {
    const entry = { run: task, done, fail }
    const existing = byFrame.get(frame)
    if (existing) {
      existing.tasks.push(entry)
      return
    }
    const stop: Stop = { tasks: [entry] }
    byFrame.set(frame, stop)
    context.suspend(frame / context.sampleRate).then(
      async () => {
        // A task added while the stop is being worked through runs too: the
        // loop reads the list's length afresh on every step.
        for (const current of stop.tasks) {
          try {
            await current.run()
            current.done()
          } catch (error) {
            current.fail(error)
          }
        }
        byFrame.delete(frame)
        await context.resume().catch(() => {})
      },
      (reason: unknown) => {
        byFrame.delete(frame)
        for (const waiting of stop.tasks) waiting.fail(reason)
      },
    )
  })
}
