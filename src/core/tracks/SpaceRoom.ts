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
//
// What is ringing in a room can be turned down while it rings (`tilt`). A
// room is a convolution, so a gain ahead of it and the same gain after it
// sound the same, except to what is already inside: that only meets the one
// after. So a gain after the convolver comes down and one ahead of it goes up
// by as much, both at once and in step:
//
//   sends ─► [ saturator ] ─► × 1/k ─► convolver ─► [ delay ] ─► × k ─► strip
//
// What is sent from then on comes back as loud as it would have, and what
// was sent before comes back `k` times as loud. The two gains then return to
// 1 slowly, far slower than the room dies away, so the room is plain again
// by the time anything could be heard of it. The gains are only there once a
// room has been tilted.

import { ParamGlide } from '../automation/scheduled-param'
import { spaceDrift, spaceDriveCurve, spaceDriveGains, type SpaceColour } from './space'

/** A room as a track plays it: the impulse and what is done on the way through. */
export interface SpaceRoomSettings extends SpaceColour {
  impulse: AudioBuffer
}

/** How a change of drive or drift is approached, in seconds: slow enough that a moving delay does not chirp. */
export const SPACE_COLOUR_RAMP_SECONDS = 0.2
/** How long past its impulse an old room is kept, so its tail is not cut. */
export const SPACE_RETIRE_MARGIN_SECONDS = 0.5
/** The furthest down what rings in a room is turned (`SpaceRoom.tilt`): −60 dB. */
export const MIN_SPACE_TILT = 0.001
/**
 * How fast a tilted room comes back to level, in dB a second. What is sent
 * in meanwhile comes back that much louder for every second it rings, so
 * this stays well under the 12 dB a second the stock room dies away at.
 */
export const SPACE_TILT_RETURN_DB_PER_SECOND = 2

interface RoomNodes {
  /** Where sends go in. */
  entry: AudioNode
  /** What feeds the strip. */
  exit: AudioNode
  convolver: ConvolverNode
  drive: { into: GainNode; shaper: WaveShaperNode; outOf: GainNode } | null
  drift: { delay: DelayNode; oscillators: OscillatorNode[]; depths: GainNode[] } | null
  /** The gains either side of the convolver once the room has been tilted: `post` is k, `pre` 1/k. */
  tilt: {
    pre: ParamGlide
    post: ParamGlide
    nodes: [GainNode, GainNode]
    /** The level the last tilt goes down to, and when it gets there. */
    level: number
    reachedAt: number
  } | null
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
   * What is ringing in the room is `ratio` times as loud from `at` on,
   * reached over `rampSec`, and what is sent in from then on comes back as
   * loud as it would have: for a sound whose level was just changed, so the
   * room it has already filled changes with it. A room is only ever turned
   * down this way: a `ratio` above 1 gives back what an earlier one took, and
   * no more. Left alone, the room returns to level by itself, slowly.
   *
   * Returns the node sends connected to before when they have to move to
   * `entry` (the first tilt of a room that is not driven puts a gain ahead
   * of its convolver), or null when they can stay where they are.
   */
  tilt(ratio: number, at: number, rampSec: number): AudioNode | null {
    if (this.left || !Number.isFinite(ratio) || ratio < 0) return null
    const nodes = this.nodes
    const was = nodes.tilt
    // A tilt still on its way is taken from where it was going.
    const base = was ? (at < was.reachedAt ? was.level : was.post.valueAt(at)) : 1
    const level = Math.min(1, Math.max(MIN_SPACE_TILT, base * ratio))
    if (level === base) return null
    const before = nodes.tilt ? null : this.addTilt(nodes)
    const tilt = nodes.tilt
    if (!tilt) return before
    const reachedAt = at + Math.max(0, rampSec)
    tilt.level = level
    tilt.reachedAt = reachedAt
    const levelAt = { value: level, atSec: reachedAt }
    const restAt = reachedAt + (-20 * Math.log10(level)) / SPACE_TILT_RETURN_DB_PER_SECOND
    if (level < 1) {
      tilt.post.along(at, levelAt, { value: 1, atSec: restAt })
      tilt.pre.along(at, { value: 1 / level, atSec: reachedAt }, { value: 1, atSec: restAt })
    } else {
      tilt.post.along(at, levelAt)
      tilt.pre.along(at, levelAt)
    }
    return before
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
      tilt: null,
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
      nodes.drive = { into, shaper, outOf }
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

  /**
   * Puts a gain either side of the convolver, both at 1. Returns where sends
   * went in before when that is no longer where they go in.
   */
  private addTilt(nodes: RoomNodes): AudioNode | null {
    const pre = this.ctx.createGain()
    const post = this.ctx.createGain()
    // After everything else, so what the strip hears is the tilted room.
    const exit = nodes.exit
    exit.disconnect()
    this.host.forget(exit)
    exit.connect(post)
    this.host.connect(post)
    nodes.exit = post
    // Ahead of the convolver and after the saturator, which is not linear.
    const before = nodes.entry
    pre.connect(nodes.convolver)
    if (nodes.drive) {
      nodes.drive.outOf.disconnect()
      nodes.drive.outOf.connect(pre)
    } else {
      nodes.entry = pre
    }
    nodes.tilt = {
      pre: new ParamGlide(pre.gain, 1),
      post: new ParamGlide(post.gain, 1),
      nodes: [pre, post],
      level: 1,
      reachedAt: -Infinity,
    }
    return nodes.drive ? null : before
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
      nodes.drive?.shaper.disconnect()
      nodes.drive?.outOf.disconnect()
      nodes.convolver.disconnect()
      for (const oscillator of nodes.drift?.oscillators ?? []) {
        oscillator.stop()
        oscillator.disconnect()
      }
      for (const depth of nodes.drift?.depths ?? []) depth.disconnect()
      nodes.drift?.delay.disconnect()
      for (const node of nodes.tilt?.nodes ?? []) node.disconnect()
    } catch {
      // Context may already be closed; ignore.
    }
    this.host.forget(nodes.exit)
  }
}
