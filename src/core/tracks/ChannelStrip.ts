// The output section every track kind shares: input gain → inserts → pan →
// fader → mute/solo gate → destination, plus post-fader sends. Every level
// and pan change is a `setTargetAtTime` approach (5 ms constant by default),
// never a step, so R2 holds for mute, solo and re-routing as well as faders.
//
// A strip creates no nodes until a feature is first used. Phase 0 consumers
// (Breathwork Live's recorded-AudioParam harness) index nodes by creation
// order, so a track with an untouched strip must wire its sources straight to
// the destination exactly as before. The strip therefore owns the track's
// source bookkeeping: tracks connect through `connectSource`, and the first
// use of pan, level, mute, solo, an insert or a send materializes the four
// nodes and re-points every registered source into them. The nodes come up at
// unity and only then ramp, so materializing mid-playback is sample-continuous.
//
// Solo is solo-in-place: soloed strips are heard through their normal routing
// (groups, sends, returns) at the main output, and every other strip is muted
// by a ramp on its gate. `SoloInPlace` holds one engine's strips and computes
// the gates from the routing tree: a strip stays open when it is soloed, when
// an ancestor group is soloed (the group's members feed it), when a descendant
// is soloed (the group has to pass the member through), or when it is
// solo-safe (returns by default, so a soloed track keeps its reverb tail).
// An explicit mute always wins over solo.

import { LEVEL_RAMP_SECONDS, type Bus } from '../buses/Bus'
import { type Device } from '../devices/Device'
import { Emitter } from '../events'
import { SendList } from './Send'

/** Anything with a `strip`: `AudioTrack`, `LiveInputTrack`, `ReturnTrack`, `GroupTrack`. */
export interface StripHost {
  readonly name: string
  readonly strip: ChannelStrip
}

/** Something sources can be routed into by its `input` node: a `Bus` or a `GroupTrack`. */
export interface RoutableInput {
  readonly input: AudioNode
  /** Present on group tracks; makes the group part of the solo tree. */
  readonly strip?: ChannelStrip
}

/** Where a strip's output goes: a bus, a group, or a raw node (the terminus). */
export type StripDestination = AudioNode | Bus | RoutableInput

export interface ChannelStripOptions {
  name: string
  destination: StripDestination
  /** Ignore implicit mutes from other strips' solos (returns default to true). */
  soloSafe?: boolean
  /** Time constant for every ramp made through this strip. Default 5 ms. */
  timeConstant?: number
  /** The engine's solo registry; without one, `solo` is a flag with no effect on others. */
  solo?: SoloInPlace
  /** Create the nodes now rather than on first use (groups need a stable summing node). */
  eager?: boolean
  /** Initial fader value. Implies `eager`, since an untouched strip is at unity. */
  level?: number
}

export interface RampOptions {
  /** Audio-clock time the approach starts (default: the context's `currentTime`). */
  at?: number
  /** `setTargetAtTime` time constant in seconds (default: the strip's). */
  timeConstant?: number
}

/**
 * What changed on a strip (U24: UI subscriptions). `gate` is the implicit
 * mute another strip's solo imposes; `members` fires on a group strip when a
 * child is routed in or out; `routing` on the strip that moved.
 */
export type StripChangeKind =
  | 'inputGain'
  | 'level'
  | 'pan'
  | 'mute'
  | 'solo'
  | 'soloSafe'
  | 'gate'
  | 'inserts'
  | 'routing'
  | 'members'
  | 'dispose'

export interface StripChange {
  kind: StripChangeKind
  strip: ChannelStrip
}

export type StripChangeListener = (change: StripChange) => void

interface StripNodes {
  readonly inputGain: GainNode
  readonly panner: StereoPannerNode
  readonly fader: GainNode
  readonly gate: GainNode
}

export class ChannelStrip {
  readonly name: string
  readonly timeConstant: number
  private ctx: BaseAudioContext | null
  private target: StripDestination
  private destinationNode: AudioNode
  private parentStrip: ChannelStrip | null
  private readonly childStrips = new Set<ChannelStrip>()
  private readonly registry: SoloInPlace | null
  private readonly sources = new Set<AudioNode>()
  private readonly insertList: Device[] = []
  private readonly changes = new Emitter<StripChange>()
  private sendList: SendList | null = null
  private nodes: StripNodes | null = null

  private inputGainValue = 1
  private levelValue: number
  private panValue = 0
  private muted = false
  private soloed = false
  private soloSafeFlag: boolean
  private implicitMute = false
  private gateCommand = 1
  private disposed = false

  constructor(ctx: BaseAudioContext | null, options: ChannelStripOptions) {
    this.ctx = ctx
    this.name = options.name
    this.timeConstant = options.timeConstant ?? LEVEL_RAMP_SECONDS
    this.soloSafeFlag = options.soloSafe ?? false
    this.levelValue = Math.max(0, options.level ?? 1)
    this.registry = options.solo ?? null
    this.target = options.destination
    this.destinationNode = resolveInput(options.destination)
    this.parentStrip = resolveParent(options.destination)
    this.parentStrip?.childStrips.add(this)
    this.registry?.register(this)
    if (options.eager || options.level !== undefined) this.materialize()
  }

  // --- Topology ----------------------------------------------------------------

  /** True once the four nodes exist. */
  get materialized(): boolean {
    return this.nodes !== null
  }

  /**
   * Create input gain → panner → fader → gate → destination (three gains and a
   * StereoPanner, in that order) and move every registered source into the
   * input gain. Idempotent; every feature calls it on first use.
   */
  materialize(): this {
    this.ensureNodes()
    return this
  }

  /** Where sources enter. Reading this creates the nodes. */
  get input(): AudioNode {
    return this.ensureNodes().inputGain
  }

  /** The gate, i.e. what feeds the destination and the post-fader sends. Creates the nodes. */
  get output(): AudioNode {
    return this.ensureNodes().gate
  }

  /** Input trim node. Creates the nodes. */
  get inputGainNode(): GainNode {
    return this.ensureNodes().inputGain
  }

  /** The StereoPanner. Creates the nodes. */
  get panner(): StereoPannerNode {
    return this.ensureNodes().panner
  }

  /** The fader node (its `gain` is the AudioParam a Ducker or a lane targets). Creates the nodes. */
  get fader(): GainNode {
    return this.ensureNodes().fader
  }

  /** The mute/solo gate. Creates the nodes. */
  get gate(): GainNode {
    return this.ensureNodes().gate
  }

  /** The node this strip currently feeds. */
  get destination(): AudioNode {
    return this.destinationNode
  }

  /** What the strip was last routed to (a bus, a group or a node). */
  get destinationTarget(): StripDestination {
    return this.target
  }

  /** The group strip this one feeds, or null when it feeds a bus or a node. */
  get parent(): ChannelStrip | null {
    return this.parentStrip
  }

  /** Strips routed into this one (a group's members). */
  get children(): readonly ChannelStrip[] {
    return [...this.childStrips]
  }

  /** Nodes currently registered through `connectSource`. */
  get sourceNodes(): readonly AudioNode[] {
    return [...this.sources]
  }

  /**
   * Wire a track source into the strip: straight to the destination while the
   * strip has no nodes, into the input gain once it does. Tracks call this
   * instead of `node.connect(destination)`.
   */
  connectSource(node: AudioNode): void {
    this.assertLive()
    this.sources.add(node)
    node.connect(this.entry())
  }

  /** Drop a source from the bookkeeping after the caller disconnected it. */
  forgetSource(node: AudioNode): void {
    this.sources.delete(node)
  }

  /** Disconnect a source from the strip and forget it. */
  disconnectSource(node: AudioNode): void {
    if (!this.sources.delete(node)) return
    try {
      node.disconnect(this.entry())
    } catch {
      // Already disconnected by the caller; nothing to undo.
    }
  }

  /**
   * Re-point the strip at a new bus, group or node. Sample-continuous when the
   * new path is at unity: the graph swap lands on one render quantum. Refuses
   * to route a group into its own subtree.
   */
  connectTo(destination: StripDestination): void {
    this.assertLive()
    const parent = resolveParent(destination)
    for (let strip = parent; strip; strip = strip.parentStrip) {
      if (strip === this) {
        throw new Error(`live-mix: routing "${this.name}" into its own subtree would loop`)
      }
    }
    const node = resolveInput(destination)
    if (this.nodes) {
      this.nodes.gate.disconnect(this.destinationNode)
      this.nodes.gate.connect(node)
    } else {
      for (const source of this.sources) {
        source.disconnect(this.destinationNode)
        source.connect(node)
      }
    }
    const previousParent = this.parentStrip
    previousParent?.childStrips.delete(this)
    this.target = destination
    this.destinationNode = node
    this.parentStrip = parent
    parent?.childStrips.add(this)
    this.registry?.refresh()
    this.changed('routing')
    if (previousParent !== parent) {
      previousParent?.changed('members')
      parent?.changed('members')
    }
  }

  // --- Levels and pan ------------------------------------------------------------

  /** Last commanded input trim (linear). */
  get inputGain(): number {
    return this.inputGainValue
  }

  /** Ramp the input trim (clamped at 0). */
  setInputGain(value: number, options: RampOptions = {}): void {
    const { inputGain } = this.ensureNodes()
    this.inputGainValue = Math.max(0, value)
    this.ramp(inputGain.gain, this.inputGainValue, options)
    this.changed('inputGain')
  }

  /** Last commanded fader value (linear). */
  get level(): number {
    return this.levelValue
  }

  /** Ramp the fader (clamped at 0). */
  setLevel(value: number, options: RampOptions = {}): void {
    const { fader } = this.ensureNodes()
    this.levelValue = Math.max(0, value)
    this.ramp(fader.gain, this.levelValue, options)
    this.changed('level')
  }

  /** Last commanded pan, −1 (left) … 1 (right). */
  get pan(): number {
    return this.panValue
  }

  /** Ramp the pan (clamped to ±1). */
  setPan(value: number, options: RampOptions = {}): void {
    const { panner } = this.ensureNodes()
    this.panValue = Math.min(1, Math.max(-1, value))
    this.ramp(panner.pan, this.panValue, options)
    this.changed('pan')
  }

  // --- Mute and solo -------------------------------------------------------------

  get mute(): boolean {
    return this.muted
  }

  /** Explicit mute: the gate ramps to 0 and back. Wins over any solo. */
  set mute(value: boolean) {
    this.setMute(value)
  }

  setMute(value: boolean, options: RampOptions = {}): void {
    if (this.muted === value) return
    this.muted = value
    this.updateGate(options)
    this.changed('mute')
  }

  get solo(): boolean {
    return this.soloed
  }

  /** Solo-in-place through the registry: every other non-safe strip is muted. */
  set solo(value: boolean) {
    this.setSolo(value)
  }

  setSolo(value: boolean, options: RampOptions = {}): void {
    if (this.soloed === value) return
    this.soloed = value
    this.registry?.refresh(options)
    this.changed('solo')
  }

  get soloSafe(): boolean {
    return this.soloSafeFlag
  }

  /** Solo-safe strips ignore other strips' solos (returns default to true). */
  set soloSafe(value: boolean) {
    if (this.soloSafeFlag === value) return
    this.soloSafeFlag = value
    this.registry?.refresh()
    this.changed('soloSafe')
  }

  /** True when another strip's solo is muting this one. */
  get implicitlyMuted(): boolean {
    return this.implicitMute
  }

  /** Not muted, explicitly or by a solo elsewhere. */
  get audible(): boolean {
    return !this.muted && !this.implicitMute
  }

  /** The registry's verdict for this strip; not for callers. */
  applySoloGate(open: boolean, options: RampOptions = {}): void {
    if (this.implicitMute === !open) return
    this.implicitMute = !open
    this.updateGate(options)
    this.changed('gate')
  }

  /**
   * Subscribe to level, pan, mute/solo, gate, insert, routing and membership
   * changes (everything a mixer view draws). Returns the unsubscribe function.
   */
  onChange(listener: StripChangeListener): () => void {
    return this.changes.subscribe(listener)
  }

  // --- Inserts (between input gain and pan) ----------------------------------------

  get inserts(): readonly Device[] {
    return this.insertList
  }

  /** Append a device after the input gain (and any earlier inserts), before the pan. */
  addInsert(device: Device): void {
    this.assertLive()
    if (this.insertList.includes(device)) return
    const { panner } = this.ensureNodes()
    const before = this.insertTail()
    before.disconnect(panner)
    before.connect(device.input)
    device.output.connect(panner)
    this.insertList.push(device)
    this.changed('inserts')
  }

  /** Remove a device and reconnect around it (does not dispose it). */
  removeInsert(device: Device): void {
    this.assertLive()
    const index = this.insertList.indexOf(device)
    if (index === -1) return
    const { inputGain, panner } = this.ensureNodes()
    const before = index === 0 ? inputGain : this.insertList[index - 1].output
    const after = this.insertList[index + 1]?.input ?? panner
    before.disconnect(device.input)
    device.output.disconnect(after)
    this.insertList.splice(index, 1)
    before.connect(after)
    this.changed('inserts')
  }

  // --- Sends (post-fader, post-gate: muted with the strip) ---------------------------

  /** Post-fader sends. Adding one creates the nodes. */
  get sends(): SendList {
    this.sendList ??= new SendList(this.context(), () => this.gate)
    return this.sendList
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    const parent = this.parentStrip
    parent?.childStrips.delete(this)
    this.parentStrip = null
    this.registry?.unregister(this)
    this.sendList?.dispose()
    try {
      this.nodes?.inputGain.disconnect()
      for (const device of this.insertList) device.output.disconnect()
      this.nodes?.panner.disconnect()
      this.nodes?.fader.disconnect()
      this.nodes?.gate.disconnect()
    } catch {
      // Context may already be closed; ignore.
    }
    this.nodes = null
    this.insertList.length = 0
    this.sources.clear()
    this.changed('dispose')
    this.changes.clear()
    parent?.changed('members')
  }

  // --- Internals -------------------------------------------------------------------

  private changed(kind: StripChangeKind): void {
    this.changes.emit({ kind, strip: this })
  }

  private updateGate(options: RampOptions): void {
    const command = this.muted || this.implicitMute ? 0 : 1
    if (command === this.gateCommand) return
    // An open strip without nodes is already transparent.
    if (command === 1 && !this.nodes) {
      this.gateCommand = 1
      return
    }
    const { gate } = this.ensureNodes()
    this.gateCommand = command
    this.ramp(gate.gain, command, options)
  }

  private ramp(param: AudioParam, value: number, options: RampOptions): void {
    const at = options.at ?? this.context().currentTime
    param.setTargetAtTime(value, at, options.timeConstant ?? this.timeConstant)
  }

  private entry(): AudioNode {
    return this.nodes?.inputGain ?? this.destinationNode
  }

  private insertTail(): AudioNode {
    const last = this.insertList[this.insertList.length - 1]
    return last ? last.output : this.ensureNodes().inputGain
  }

  private ensureNodes(): StripNodes {
    if (this.nodes) return this.nodes
    this.assertLive()
    const ctx = this.context()
    const inputGain = ctx.createGain()
    const panner = ctx.createStereoPanner()
    const fader = ctx.createGain()
    const gate = ctx.createGain()
    // Only an initial `level` can differ from unity here: every other value
    // is changed by a ramp after the nodes exist.
    if (this.levelValue !== 1) fader.gain.value = this.levelValue
    inputGain.connect(panner)
    panner.connect(fader)
    fader.connect(gate)
    gate.connect(this.destinationNode)
    const nodes: StripNodes = { inputGain, panner, fader, gate }
    this.nodes = nodes
    for (const source of this.sources) {
      source.disconnect(this.destinationNode)
      source.connect(inputGain)
    }
    return nodes
  }

  private context(): BaseAudioContext {
    this.ctx ??= (this.destinationNode as Partial<AudioNode>).context ?? null
    if (!this.ctx) {
      throw new Error(`live-mix: strip "${this.name}" needs an AudioContext to create nodes`)
    }
    return this.ctx
  }

  private assertLive(): void {
    if (this.disposed) throw new Error(`live-mix: strip "${this.name}" is disposed`)
  }
}

/**
 * One engine's solo-in-place state: every strip registers here, and any solo,
 * solo-safe or routing change recomputes which gates are open.
 */
export class SoloInPlace {
  private readonly strips = new Set<ChannelStrip>()

  register(strip: ChannelStrip): void {
    this.strips.add(strip)
    if (this.active) this.refresh()
  }

  unregister(strip: ChannelStrip): void {
    const wasSoloed = strip.solo
    this.strips.delete(strip)
    if (wasSoloed || this.active) this.refresh()
  }

  /** Every registered strip, in registration order. */
  get registered(): readonly ChannelStrip[] {
    return [...this.strips]
  }

  /** The soloed strips. */
  get soloed(): readonly ChannelStrip[] {
    return [...this.strips].filter((strip) => strip.solo)
  }

  /** True when any strip is soloed. */
  get active(): boolean {
    for (const strip of this.strips) if (strip.solo) return true
    return false
  }

  /** Un-solo everything (gates ramp back open). */
  clear(options: RampOptions = {}): void {
    for (const strip of this.strips) if (strip.solo) strip.setSolo(false, options)
  }

  /** Recompute every gate from the current solo flags and routing tree. */
  refresh(options: RampOptions = {}): void {
    const active = this.active
    for (const strip of this.strips) {
      const open =
        !active ||
        strip.soloSafe ||
        strip.solo ||
        hasSoloedAncestor(strip) ||
        hasSoloedDescendant(strip)
      strip.applySoloGate(open, options)
    }
  }
}

function hasSoloedAncestor(strip: ChannelStrip): boolean {
  for (let parent = strip.parent; parent; parent = parent.parent) if (parent.solo) return true
  return false
}

function hasSoloedDescendant(strip: ChannelStrip): boolean {
  for (const child of strip.children) if (child.solo || hasSoloedDescendant(child)) return true
  return false
}

function isRoutable(value: StripDestination): value is Bus | RoutableInput {
  return typeof (value as RoutableInput).input === 'object'
}

/** The node sources connect to for a destination: a bus's or group's `input`, or the node itself. */
export function resolveInput(destination: StripDestination): AudioNode {
  return isRoutable(destination) ? destination.input : destination
}

function resolveParent(destination: StripDestination): ChannelStrip | null {
  return isRoutable(destination) ? ((destination as RoutableInput).strip ?? null) : null
}
