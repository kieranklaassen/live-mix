// Sends from a source node to a return (or bus). Phase 0 sends are pre-fader
// and, without a level, a direct connection — exactly Breathwork Live's
// `node.connect(hall.convolver)`, where the return's own wet gain sets the
// level. A `level` inserts a gain node so the send can be mixed.

import { type Bus } from '../buses/Bus'
import { type ReturnTrack } from './ReturnTrack'

export type SendTarget = ReturnTrack | Bus

export interface SendOptions {
  /** Send level. Omit for a direct connection (the return sets the level). */
  level?: number
}

export interface Send {
  readonly target: SendTarget
  readonly level: number | null
  /** The gain node carrying the level, when one exists. */
  readonly gainNode: GainNode | null
}

/** A source's sends, re-wired whenever the source node changes. */
export class SendList {
  private readonly ctx: BaseAudioContext
  private readonly getSource: () => AudioNode | null
  private readonly items: Send[] = []

  constructor(ctx: BaseAudioContext, getSource: () => AudioNode | null) {
    this.ctx = ctx
    this.getSource = getSource
  }

  all(): readonly Send[] {
    return this.items
  }

  add(target: SendTarget, options: SendOptions = {}): Send {
    const existing = this.items.find((send) => send.target === target)
    if (existing) return existing
    const gainNode = options.level === undefined ? null : this.ctx.createGain()
    if (gainNode) {
      gainNode.gain.value = options.level ?? 1
      gainNode.connect(target.input)
    }
    const send: Send = { target, level: options.level ?? null, gainNode }
    this.items.push(send)
    const source = this.getSource()
    if (source) this.connectOne(source, send)
    return send
  }

  remove(target: SendTarget): void {
    const index = this.items.findIndex((send) => send.target === target)
    if (index === -1) return
    const [send] = this.items.splice(index, 1)
    const source = this.getSource()
    if (source) {
      try {
        source.disconnect(send.gainNode ?? send.target.input)
      } catch {
        // Already disconnected (e.g. the source was swapped); ignore.
      }
    }
    send.gainNode?.disconnect()
  }

  /** Connect every send from `source` (called after a new source is attached). */
  connectAll(source: AudioNode): void {
    for (const send of this.items) this.connectOne(source, send)
  }

  private connectOne(source: AudioNode, send: Send): void {
    source.connect(send.gainNode ?? send.target.input)
  }

  dispose(): void {
    for (const send of this.items) send.gainNode?.disconnect()
    this.items.length = 0
  }
}
