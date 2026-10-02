// A track's room as nodes: what its placed clips send into, ahead of the
// strip (`space.ts` says what the room is and generates its impulse).
//
//   sends ─► [ × into ─► saturator ─► × out of ] ─► convolver ─► [ delay ] ─► strip
//              only when the room is driven                       only when it drifts
//                                                                    ▲
//                                                         two slow sines move its time
//
// A clean, still room is the convolver alone. A room can be changed while it
// sounds (`set`). When only how hard it is driven or how far it drifts
// changed, the nodes that are there take the new values. Otherwise a second
// set of nodes is made: the sends move over to it at once, and what was
// already in the old room rings out there before it is taken down.

import { spaceDrift, spaceDriveCurve, spaceDriveGains, type SpaceColour } from './space'

/** A room as a track plays it: the impulse and what is done on the way through. */
export interface SpaceRoomSettings extends SpaceColour {
  impulse: AudioBuffer
}

/** How a change of drive or drift is approached, in seconds: slow enough that a moving delay does not chirp. */
export const SPACE_COLOUR_RAMP_SECONDS = 0.2
/** How long past its impulse an old room is kept, so its tail is not cut. */
export const SPACE_RETIRE_MARGIN_SECONDS = 0.5

interface RoomNodes {
  /** Where sends go in. */
  entry: AudioNode
  /** What feeds the strip. */
  exit: AudioNode
  convolver: ConvolverNode
  drive: { into: GainNode; outOf: GainNode } | null
  drift: { delay: DelayNode; oscillators: OscillatorNode[]; depths: GainNode[] } | null
}

export interface SpaceRoomHost {
  /** Wires a node into the track's strip. */
  connect(node: AudioNode): void
  /** Takes a node the room has disconnected out of the strip's bookkeeping. */
  forget(node: AudioNode): void
  /** Timers for taking an old room down; the page's by default. */
  setTimeoutFn?: (callback: () => void, ms: number) => unknown
  clearTimeoutFn?: (handle: unknown) => void
}

export class SpaceRoom {
  private nodes: RoomNodes
  private settings: SpaceRoomSettings
  // Each old room with the timer that takes it down, or null where there is no clock to time it by.
  private readonly retired = new Map<RoomNodes, unknown>()
  private readonly setTimeoutFn: (callback: () => void, ms: number) => unknown
  private readonly clearTimeoutFn: (handle: unknown) => void
  // One table for every saturator this room ever makes.
  private curve: Float32Array<ArrayBuffer> | null = null
  // True once the nodes in use have been left to ring out, or taken down.
  private left = false

  constructor(
    private readonly ctx: BaseAudioContext,
    private readonly host: SpaceRoomHost,
    settings: SpaceRoomSettings,
  ) {
    this.setTimeoutFn = host.setTimeoutFn ?? ((callback, ms) => setTimeout(callback, ms))
    this.clearTimeoutFn =
      host.clearTimeoutFn ?? ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>))
    this.settings = { ...settings }
    this.nodes = this.build(this.settings)
  }

  /** Where a send into the room connects. */
  get entry(): AudioNode {
    return this.nodes.entry
  }

  /** The convolver the room is: what was sent comes back from here. */
  get convolver(): ConvolverNode {
    return this.nodes.convolver
  }

  /**
   * The room is another one now. Returns the node sends connected to before
   * when they have to move to `entry`, or null when they can stay where they
   * are.
   */
  set(settings: SpaceRoomSettings): AudioNode | null {
    const before = this.settings
    this.settings = { ...settings }
    const nodes = this.nodes
    const sameShape =
      settings.impulse === before.impulse &&
      settings.driveDb > 0 === (nodes.drive !== null) &&
      settings.driftCents > 0 === (nodes.drift !== null)
    if (sameShape) {
      this.colour(nodes, settings)
      return null
    }
    this.nodes = this.build(settings)
    this.retire(nodes)
    return nodes.entry
  }

  /**
   * Nothing will be sent into this room again: it stays until its tail is
   * over and then takes itself down, as an old set of nodes does after
   * `set`. `dispose` still takes down at once whatever is left.
   */
  leave(): void {
    if (this.left) return
    this.left = true
    this.retire(this.nodes)
  }

  dispose(): void {
    for (const [nodes, timer] of this.retired) {
      if (timer !== null) this.clearTimeoutFn(timer)
      this.takeDown(nodes)
    }
    this.retired.clear()
    if (!this.left) this.takeDown(this.nodes)
    this.left = true
  }

  private build(settings: SpaceRoomSettings): RoomNodes {
    const convolver = this.ctx.createConvolver()
    // The impulse carries its own level; the node's scaling would undo it.
    convolver.normalize = false
    convolver.buffer = settings.impulse
    const nodes: RoomNodes = {
      entry: convolver,
      exit: convolver,
      convolver,
      drive: null,
      drift: null,
    }
    if (settings.driveDb > 0) {
      const gains = spaceDriveGains(settings.driveDb)
      const into = this.ctx.createGain()
      const shaper = this.ctx.createWaveShaper()
      const outOf = this.ctx.createGain()
      this.curve ??= spaceDriveCurve() as Float32Array<ArrayBuffer>
      shaper.curve = this.curve
      // The curve's corners fold back less when it runs at twice the rate.
      shaper.oversample = '2x'
      into.gain.value = gains.into
      outOf.gain.value = gains.outOf
      into.connect(shaper)
      shaper.connect(outOf)
      outOf.connect(convolver)
      nodes.entry = into
      nodes.drive = { into, outOf }
    }
    if (settings.driftCents > 0) {
      const drift = spaceDrift(settings)
      const delay = this.ctx.createDelay(0.3)
      delay.delayTime.value = drift.delaySec
      const oscillators: OscillatorNode[] = []
      const depths: GainNode[] = []
      drift.rates.forEach((hz, index) => {
        const oscillator = this.ctx.createOscillator()
        const depth = this.ctx.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.value = hz
        depth.gain.value = drift.depths[index]
        oscillator.connect(depth)
        depth.connect(delay.delayTime)
        oscillator.start()
        oscillators.push(oscillator)
        depths.push(depth)
      })
      convolver.connect(delay)
      nodes.exit = delay
      nodes.drift = { delay, oscillators, depths }
    }
    this.host.connect(nodes.exit)
    return nodes
  }

  /** The same nodes take another drive and drift. */
  private colour(nodes: RoomNodes, settings: SpaceRoomSettings): void {
    const at = this.ctx.currentTime
    const approach = (param: AudioParam, value: number): void => {
      param.setTargetAtTime(value, at, SPACE_COLOUR_RAMP_SECONDS / 3)
    }
    if (nodes.drive) {
      const gains = spaceDriveGains(settings.driveDb)
      approach(nodes.drive.into.gain, gains.into)
      approach(nodes.drive.outOf.gain, gains.outOf)
    }
    if (nodes.drift) {
      const { delay, oscillators, depths } = nodes.drift
      const drift = spaceDrift(settings)
      approach(delay.delayTime, drift.delaySec)
      oscillators.forEach((oscillator, index) => {
        approach(oscillator.frequency, drift.rates[index])
        approach(depths[index].gain, drift.depths[index])
      })
    }
  }

  /**
   * Nothing is sent to these nodes any more: they stay until their tail is
   * over. A render that is not on the clock has no real time to count that
   * in, and may run slower than a timer would: there the old room is kept
   * until the track goes.
   */
  private retire(nodes: RoomNodes): void {
    if (typeof (this.ctx as Partial<OfflineAudioContext>).startRendering === 'function') {
      this.retired.set(nodes, null)
      return
    }
    const tailSec = (nodes.convolver.buffer?.duration ?? 0) + SPACE_RETIRE_MARGIN_SECONDS
    const timer = this.setTimeoutFn(() => {
      this.retired.delete(nodes)
      this.takeDown(nodes)
    }, tailSec * 1000)
    this.retired.set(nodes, timer)
  }

  private takeDown(nodes: RoomNodes): void {
    try {
      nodes.drive?.into.disconnect()
      nodes.drive?.outOf.disconnect()
      nodes.convolver.disconnect()
      for (const oscillator of nodes.drift?.oscillators ?? []) {
        oscillator.stop()
        oscillator.disconnect()
      }
      for (const depth of nodes.drift?.depths ?? []) depth.disconnect()
      nodes.drift?.delay.disconnect()
    } catch {
      // Context may already be closed; ignore.
    }
    this.host.forget(nodes.exit)
  }
}
