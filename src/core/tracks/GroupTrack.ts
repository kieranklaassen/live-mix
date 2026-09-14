// A group: a summing point member tracks route into, with a full strip of its
// own (inserts, pan, fader, mute/solo, post-fader sends) feeding a bus, another
// group or the terminus. Unlike a Bus, a group is part of the solo tree — solo
// a group and its members stay open; solo a member and the group passes it
// through while the other members go quiet.
//
// Groups are never created implicitly, so the strip is eager: its input gain
// is the stable node members connect to. Membership is routing: anything whose
// strip feeds this group's input is a member, whether it was created with the
// group as its destination or moved here with `add`.

import {
  ChannelStrip,
  type SoloInPlace,
  type StripDestination,
  type StripHost,
} from './ChannelStrip'

export interface GroupTrackOptions {
  name: string
  /** Where the group's output goes: a bus (its input), a parent group, or a raw node. */
  destination: StripDestination
  /** Initial fader value (unity by default). */
  gain?: number
  /** Ramp time constant for the group's strip. Default 5 ms. */
  timeConstant?: number
  /** The engine's solo registry. */
  solo?: SoloInPlace
}

export class GroupTrack implements StripHost {
  readonly name: string
  readonly strip: ChannelStrip
  private disposed = false

  constructor(ctx: BaseAudioContext, options: GroupTrackOptions) {
    this.name = options.name
    this.strip = new ChannelStrip(ctx, {
      name: options.name,
      destination: options.destination,
      timeConstant: options.timeConstant,
      solo: options.solo,
      level: options.gain,
      eager: true,
    })
  }

  /** The summing node: members' strips connect here. */
  get input(): AudioNode {
    return this.strip.input
  }

  /** The strips currently routed into this group. */
  get members(): readonly ChannelStrip[] {
    return this.strip.children
  }

  /** Route a track (or another group) into this group. */
  add(member: StripHost): void {
    this.assertLive()
    if (member.strip.parent === this.strip) return
    member.strip.connectTo(this)
  }

  /** Route a member back out — to `destination`, or to wherever this group feeds. */
  remove(member: StripHost, destination?: StripDestination): void {
    this.assertLive()
    if (member.strip.parent !== this.strip) return
    member.strip.connectTo(destination ?? this.strip.destinationTarget)
  }

  /** Re-route every member to `destination` (default: the group's own destination). */
  removeAll(destination?: StripDestination): void {
    const target = destination ?? this.strip.destinationTarget
    for (const member of this.strip.children) member.connectTo(target)
  }

  /**
   * Dissolve the group: members are routed to where the group fed, so they
   * keep sounding, then the group's nodes are disconnected.
   */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.removeAll()
    this.strip.dispose()
  }

  private assertLive(): void {
    if (this.disposed) throw new Error(`live-mix: group "${this.name}" is disposed`)
  }
}
