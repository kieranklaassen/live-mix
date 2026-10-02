// One room for the tracks that would each convolve for themselves and sound
// no different (`space.ts`, `SpaceRoom`).
//
// A track's room sits ahead of its strip so the strip acts on the room as it
// does on the dry clips. Where the strip does nothing but set a level (its
// fader, mute and solo, and inserts that only change gain), that is a gain
// after a convolution, and convolution is linear: the same gain ahead of the
// convolver gives the same sound, and then every such track can send into
// one convolver. A convolver with a long impulse is the costliest stock node
// there is, so an engine of many placed tracks spends most of its audio time
// in rooms that all hold the same impulse. With `EngineOptions.sharedSpace`
// the tracks that can share one do.
//
//   sends ─► feed ─► [ × into ─► saturator ─► × out of ] ─► level ─► room ─► [ delay ] ─► destination
//            └──────────────── one per track ────────────────────┘   └── one per destination ──┘
//
// The saturator is not linear, so a driven room keeps one per track, ahead of
// the level as it is ahead of the strip. `level` is the track's own: a gain
// for each level-only insert, moved with it (`NodeDevice.follow`), then the
// strip's fader and gate (`ChannelStrip.shadow`). The room returns to what
// the track's strip feeds, so a group's strip still acts on all of it.
//
// What differs from a room of the track's own is what happens while a level
// moves: here the level is set on the way in, so a track that is muted or
// pulled down stops sending and what it sent rings out, where its own room
// would be cut with it. A track that takes an insert which does more than
// set a level, a pan or a send moves to a room of its own from then on
// (`AudioTrack`), and back when it is plain again.

import { type Device } from '../devices/Device'
import { isUtility, utilityIsLevelOnly, type Utility } from '../devices/native/Utility'
import { type ChannelStrip, type StripShadow } from './ChannelStrip'
import {
  SPACE_COLOUR_RAMP_SECONDS,
  SPACE_RETIRE_MARGIN_SECONDS,
  SpaceRoom,
  type SpaceRoomSettings,
} from './SpaceRoom'
import { spaceDriveCurve, spaceDriveGains, type SpaceColour } from './space'

/** An insert that only changes its signal's level, as it is set now. */
function isLevelOnly(device: Device): device is Utility {
  return isUtility(device) && utilityIsLevelOnly(device)
}

/**
 * True when a strip does nothing to what passes through it but set its
 * level, so a room ahead of it can be shared: centre pan, no input trim, no
 * post-fader send, and no insert that does more than change gain.
 */
export function stripOnlySetsLevel(strip: ChannelStrip): boolean {
  return (
    strip.pan === 0 && strip.inputGain === 1 && !strip.hasSends && strip.inserts.every(isLevelOnly)
  )
}

interface SharedRoom {
  room: SpaceRoom
  users: number
  // The timer that takes an unused room down, once its tail is over.
  leaving: unknown
}

export interface SharedSpacesOptions {
  /** The engine's room as it is now. */
  settings: () => SpaceRoomSettings
  /** Timers for taking an unused room down; the page's by default. */
  setTimeoutFn?: (callback: () => void, ms: number) => unknown
  clearTimeoutFn?: (handle: unknown) => void
}

/** An engine's shared rooms: one for each destination its plain tracks feed. */
export class SharedSpaces {
  private readonly rooms = new Map<AudioNode, SharedRoom>()
  private readonly settings: () => SpaceRoomSettings
  private readonly setTimeoutFn: (callback: () => void, ms: number) => unknown
  private readonly clearTimeoutFn: (handle: unknown) => void
  // One table for every saturator a track puts ahead of a shared room.
  private curve: Float32Array<ArrayBuffer> | null = null

  constructor(
    private readonly ctx: BaseAudioContext,
    options: SharedSpacesOptions,
  ) {
    this.settings = options.settings
    this.setTimeoutFn = options.setTimeoutFn ?? ((callback, ms) => setTimeout(callback, ms))
    this.clearTimeoutFn =
      options.clearTimeoutFn ?? ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>))
  }

  /**
   * The room of the tracks that feed `destination`, made when the first one
   * asks. Every `join` is answered by one `leave`.
   */
  join(destination: AudioNode): SpaceRoom {
    let shared = this.rooms.get(destination)
    if (!shared) {
      const room = new SpaceRoom(
        this.ctx,
        {
          connect: (node) => node.connect(destination),
          forget: () => undefined,
          setTimeoutFn: this.setTimeoutFn,
          clearTimeoutFn: this.clearTimeoutFn,
        },
        this.clean(),
      )
      shared = { room, users: 0, leaving: null }
      this.rooms.set(destination, shared)
    }
    if (shared.leaving !== null) this.clearTimeoutFn(shared.leaving)
    shared.leaving = null
    shared.users += 1
    return shared.room
  }

  /**
   * A track has stopped sending into the room at `destination`. The last one
   * out leaves it ringing: it is taken down when its tail is over, unless a
   * track has come back by then. A render that is not on the clock has no
   * real time to count that in, and keeps the room until the engine goes.
   */
  leave(destination: AudioNode): void {
    const shared = this.rooms.get(destination)
    if (!shared) return
    shared.users = Math.max(0, shared.users - 1)
    if (shared.users > 0 || shared.leaving !== null) return
    if (typeof (this.ctx as Partial<OfflineAudioContext>).startRendering === 'function') return
    const tailSec = (shared.room.convolver.buffer?.duration ?? 0) + SPACE_RETIRE_MARGIN_SECONDS
    shared.leaving = this.setTimeoutFn(() => {
      if (this.rooms.get(destination) !== shared) return
      this.rooms.delete(destination)
      shared.room.dispose()
    }, tailSec * 1000)
  }

  /**
   * The engine's room has changed: every shared room takes it. A track's
   * feed finds where its room's sends go in now when it is told the same
   * (`SpaceFeed.set`).
   */
  refresh(): void {
    const settings = this.clean()
    for (const { room } of this.rooms.values()) room.set(settings)
  }

  /** The saturator's table, the same one for every feed. */
  driveCurve(): Float32Array<ArrayBuffer> {
    this.curve ??= spaceDriveCurve() as Float32Array<ArrayBuffer>
    return this.curve
  }

  dispose(): void {
    for (const shared of this.rooms.values()) {
      if (shared.leaving !== null) this.clearTimeoutFn(shared.leaving)
      shared.room.dispose()
    }
    this.rooms.clear()
  }

  // The room itself is never driven: each track drives what it sends.
  private clean(): SpaceRoomSettings {
    return { ...this.settings(), driveDb: 0 }
  }
}

/**
 * A track's way into a room it shares: its sends go in at `entry`, are
 * driven if the room is, take the track's level, and reach the room. Made
 * for the strip as it is: when the strip's inserts change, the track makes
 * another.
 */
export class SpaceFeed {
  /** Where the track's sends connect; the same node for as long as the feed lives. */
  readonly entry: GainNode
  /** The inserts whose level this feed follows, in the strip's order. */
  readonly follows: readonly Device[]
  private readonly levels: { gain: GainNode; release: () => void }[] = []
  private readonly shadow: StripShadow
  private drive: { into: GainNode; shaper: WaveShaperNode; outOf: GainNode } | null = null
  // Where the shadow's gate sends now, so rewiring leaves its other outgoing
  // connections (a meter's tap, `ChannelStrip.tap`) alone.
  private sendsTo: AudioNode | null = null

  constructor(
    private readonly ctx: BaseAudioContext,
    private readonly spaces: SharedSpaces,
    /** The room this feed ends in. */
    readonly room: SpaceRoom,
    strip: ChannelStrip,
    colour: SpaceColour,
  ) {
    this.entry = ctx.createGain()
    this.follows = [...strip.inserts]
    for (const device of this.follows) {
      if (!isLevelOnly(device)) continue
      const gain = ctx.createGain()
      this.levels.push({ gain, release: device.follow('gainDb', gain.gain) })
    }
    this.shadow = strip.shadow()
    const chain = [...this.levels.map((level) => level.gain), this.shadow.input]
    for (let index = 0; index + 1 < chain.length; index += 1) chain[index].connect(chain[index + 1])
    this.entry.connect(chain[0])
    this.set(colour)
  }

  /**
   * The room has another colour, or other nodes: the saturator comes, goes
   * or takes its new drive, and the feed ends where the room's sends go in
   * now. What was already sent rings on in the nodes it reached.
   */
  set(colour: SpaceColour): void {
    const driven = colour.driveDb > 0
    if (driven && this.drive) {
      const gains = spaceDriveGains(colour.driveDb)
      const at = this.ctx.currentTime
      this.drive.into.gain.setTargetAtTime(gains.into, at, SPACE_COLOUR_RAMP_SECONDS / 3)
      this.drive.outOf.gain.setTargetAtTime(gains.outOf, at, SPACE_COLOUR_RAMP_SECONDS / 3)
    } else if (driven) {
      const gains = spaceDriveGains(colour.driveDb)
      const into = this.ctx.createGain()
      const shaper = this.ctx.createWaveShaper()
      const outOf = this.ctx.createGain()
      shaper.curve = this.spaces.driveCurve()
      // The curve's corners fold back less when it runs at twice the rate.
      shaper.oversample = '2x'
      into.gain.value = gains.into
      outOf.gain.value = gains.outOf
      into.connect(shaper)
      shaper.connect(outOf)
      outOf.connect(this.level())
      this.entry.disconnect()
      this.entry.connect(into)
      this.drive = { into, shaper, outOf }
    } else if (this.drive) {
      this.entry.disconnect()
      this.entry.connect(this.level())
      this.dropDrive()
    }
    if (this.sendsTo !== this.room.entry) {
      if (this.sendsTo) this.shadow.output.disconnect(this.sendsTo)
      this.shadow.output.connect(this.room.entry)
      this.sendsTo = this.room.entry
    }
  }

  dispose(): void {
    try {
      this.entry.disconnect()
      for (const level of this.levels) level.gain.disconnect()
    } catch {
      // Context may already be closed; ignore.
    }
    for (const level of this.levels) level.release()
    this.dropDrive()
    this.shadow.release()
  }

  /** Where the track's level starts: the first insert's gain, or the strip's shadow. */
  private level(): AudioNode {
    return this.levels[0]?.gain ?? this.shadow.input
  }

  private dropDrive(): void {
    const drive = this.drive
    this.drive = null
    if (!drive) return
    try {
      drive.into.disconnect()
      drive.shaper.disconnect()
      drive.outOf.disconnect()
    } catch {
      // Context may already be closed; ignore.
    }
  }
}
