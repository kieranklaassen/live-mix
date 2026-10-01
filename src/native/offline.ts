// Hosted plug-ins in an offline render. An `OfflineAudioContext` renders as
// fast as it can, far faster than the host can answer, so on its own every
// quantum would find the host late. The clock here paces it: it suspends the
// render every `period` frames (the smallest bridge latency of the devices in
// the context), waits until the host has returned everything written so far,
// and resumes. A quantum then only ever asks for audio from before the last
// stop, which is there. The result is the same audio at the same latency as
// live, sample for sample, at the speed the host allows.
//
// One clock per context, shared by its devices, and every stop goes through
// `holdRenderAt`: a context accepts only one suspend per block, and a host
// application may be holding the render at blocks of its own (a bounce that
// sends notes at their times does).

import { canHoldRender, holdRenderAt } from '../core/render/hold'
import { MIN_BRIDGE_LATENCY_FRAMES } from './bridge-protocol'

/** The slice of `OfflineAudioContext` the clock uses. */
export interface OfflineContextLike {
  readonly sampleRate: number
  readonly length: number
  readonly currentTime: number
  suspend(time: number): Promise<void>
  resume(): Promise<void>
}

export interface OfflineBridgeMember {
  /** Frames the render may run before this member must be settled again. */
  readonly periodFrames: number
  /** Resolves once the host has returned everything written so far (or is gone). */
  settled(): Promise<void>
}

export function isOfflineContext(context: object): context is OfflineContextLike {
  return canHoldRender(context)
}

export class OfflineBridgeClock {
  private readonly context: OfflineContextLike
  private readonly members = new Set<OfflineBridgeMember>()
  private scheduled = false

  constructor(context: OfflineContextLike) {
    this.context = context
  }

  /** Pace the render for `member` too; the returned function takes it out again. */
  add(member: OfflineBridgeMember): () => void {
    this.members.add(member)
    if (!this.scheduled) {
      // The first stop is one quantum past where the render is now (the start,
      // unless a device joins late), which is early enough for any latency.
      const here = Math.ceil(Math.round(this.context.currentTime * this.context.sampleRate) / 128)
      this.schedule(here * 128 + MIN_BRIDGE_LATENCY_FRAMES)
    }
    return () => {
      this.members.delete(member)
    }
  }

  get size(): number {
    return this.members.size
  }

  private period(): number {
    let period = Infinity
    for (const member of this.members) period = Math.min(period, member.periodFrames)
    return Math.max(MIN_BRIDGE_LATENCY_FRAMES, Math.floor(period / 128) * 128)
  }

  private schedule(frame: number): void {
    const { context } = this
    if (this.members.size === 0 || frame >= context.length) {
      this.scheduled = false
      return
    }
    this.scheduled = true
    holdRenderAt(context, frame / context.sampleRate, async () => {
      // A member that fails to settle plays its late frames as silence; the
      // render goes on either way.
      await Promise.allSettled([...this.members].map((member) => member.settled()))
      // The next stop has to be booked before the render moves again.
      this.schedule(frame + this.period())
    }).catch(() => {
      // The render ended or is already past this frame: nothing left to pace.
      this.scheduled = false
    })
  }
}

const clocks = new WeakMap<object, OfflineBridgeClock>()

/** The clock of `context`, made on first use. */
export function offlineBridgeClock(context: OfflineContextLike): OfflineBridgeClock {
  let clock = clocks.get(context)
  if (!clock) {
    clock = new OfflineBridgeClock(context)
    clocks.set(context, clock)
  }
  return clock
}
