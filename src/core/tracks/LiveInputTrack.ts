// A pass-through track for a live source: a MediaStream (microphone, WebRTC
// remote voice) or any AudioNode. Nothing buffers in this path. Lifted from
// Breathwork Live `attachVoiceSource`: attaching creates a fresh gain to the
// destination and connects the source into it and into every send; a
// re-attach unwires the previous source and gain first. The attached node is
// also the key a Ducker taps (`ducker.key(track.source)`).
//
// The Chrome muted-`<audio>` workaround for remote WebRTC tracks stays in the
// app (Breathwork Live's realtimeClient.ts): the stream still has to be
// attached to a media element for its audio to flow into the graph.
//
// The dry gain leaves through the track's ChannelStrip (node-free until pan,
// level, mute, solo, an insert or a post-fader send is first used). `sends`
// stays the Phase 0 pre-fader list from the raw source; `strip.sends` are the
// post-fader ones.

import {
  ChannelStrip,
  type SoloInPlace,
  type StripDestination,
  type StripHost,
} from './ChannelStrip'
import { SendList } from './Send'

export interface LiveInputTrackOptions {
  name: string
  /** Where the dry signal goes: a bus (its input), a group, or a raw node (the terminus). */
  destination: StripDestination
  /** Initial fader value for each attached gain. Default 1. */
  gain?: number
  /** The engine's solo registry, so this track's strip takes part in solo-in-place. */
  solo?: SoloInPlace
}

export class LiveInputTrack implements StripHost {
  readonly name: string
  /** Pre-fader sends from the raw source (Phase 0 semantics). */
  readonly sends: SendList
  /** Pan, fader, mute/solo, inserts and post-fader sends; node-free until first used. */
  readonly strip: ChannelStrip
  private readonly ctx: BaseAudioContext
  private readonly initialGain: number
  private sourceNode: AudioNode | null = null
  private gain: GainNode | null = null
  private attachListeners = new Set<(source: AudioNode) => void>()
  private disposed = false

  constructor(ctx: BaseAudioContext, options: LiveInputTrackOptions) {
    this.ctx = ctx
    this.name = options.name
    this.strip = new ChannelStrip(ctx, {
      name: options.name,
      destination: options.destination,
      solo: options.solo,
    })
    this.initialGain = options.gain ?? 1
    this.sends = new SendList(ctx, () => this.sourceNode)
  }

  /** The attached source node (a `MediaStreamAudioSourceNode` for streams), or null. */
  get source(): AudioNode | null {
    return this.sourceNode
  }

  /** The dry-path gain created by the current attach, or null. */
  get gainNode(): GainNode | null {
    return this.gain
  }

  /**
   * Wire a live source into the graph: source → dedicated gain → destination,
   * plus source → every send. Attaching again (reconnect) unwires the previous
   * source and gain first.
   */
  attach(input: AudioNode | MediaStream): AudioNode {
    if (this.disposed) throw new Error(`live-mix: live input "${this.name}" is disposed`)
    const node = isMediaStream(input)
      ? (this.ctx as AudioContext).createMediaStreamSource(input)
      : input

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect()
      } catch {
        // Node may already be disconnected; ignore.
      }
      this.sourceNode = null
    }
    this.releaseGain()

    for (const listener of this.attachListeners) listener(node)

    this.gain = this.ctx.createGain()
    if (this.initialGain !== 1) this.gain.gain.value = this.initialGain
    this.strip.connectSource(this.gain)
    node.connect(this.gain)
    this.sends.connectAll(node)
    this.sourceNode = node
    return node
  }

  /**
   * Called with the new source node at the start of every `attach`, before the
   * dry gain is created — the hook a Ducker uses to re-key (so its analyser is
   * created ahead of the gain, matching Breathwork Live's node order).
   */
  onAttach(listener: (source: AudioNode) => void): () => void {
    this.attachListeners.add(listener)
    return () => this.attachListeners.delete(listener)
  }

  /** Unwire the current source and gain. */
  detach(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect()
      } catch {
        // ignore
      }
    }
    this.releaseGain()
    this.sourceNode = null
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.detach()
    this.sends.dispose()
    this.strip.dispose()
    this.attachListeners.clear()
  }

  private releaseGain(): void {
    if (!this.gain) return
    this.gain.disconnect()
    this.strip.forgetSource(this.gain)
    this.gain = null
  }
}

function isMediaStream(value: AudioNode | MediaStream): value is MediaStream {
  return typeof (value as MediaStream).getAudioTracks === 'function'
}
