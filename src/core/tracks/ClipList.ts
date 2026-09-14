// The clips on one track, kept sorted by start. Every mutation notifies the
// owner so the scheduler can re-derive its queue in the same turn (ambient-
// live's re-derive-on-edit effect) instead of waiting for the next tick.

import { type Clip } from '../clips/Clip'

export class ClipList {
  private items: Clip[] = []
  private readonly onChange: () => void

  constructor(onChange: () => void) {
    this.onChange = onChange
  }

  all(): readonly Clip[] {
    return this.items
  }

  get(id: string): Clip | undefined {
    return this.items.find((clip) => clip.id === id)
  }

  has(id: string): boolean {
    return this.items.some((clip) => clip.id === id)
  }

  get length(): number {
    return this.items.length
  }

  add(clip: Clip): Clip {
    if (this.has(clip.id)) throw new Error(`live-mix: clip "${clip.id}" already exists`)
    this.items = sorted([...this.items, clip])
    this.onChange()
    return clip
  }

  /** Merge `patch` into the clip; returns the new record (or undefined if absent). */
  update(id: string, patch: Partial<Omit<Clip, 'id'>>): Clip | undefined {
    const index = this.items.findIndex((clip) => clip.id === id)
    if (index === -1) return undefined
    const next = { ...this.items[index], ...patch }
    const items = [...this.items]
    items[index] = next
    this.items = sorted(items)
    this.onChange()
    return next
  }

  remove(id: string): boolean {
    const before = this.items.length
    this.items = this.items.filter((clip) => clip.id !== id)
    if (this.items.length === before) return false
    this.onChange()
    return true
  }

  /** Replace the whole list (an app that owns the arrangement in its own state). */
  set(clips: readonly Clip[]): void {
    this.items = sorted([...clips])
    this.onChange()
  }

  /**
   * Drop every clip starting at or after `sec` and add `clips` in their place.
   * Clips already sounding before `sec` are untouched, so an edit under
   * playback never cuts audio in flight.
   */
  replaceFrom(sec: number, clips: readonly Clip[]): void {
    this.items = sorted([...this.items.filter((clip) => clip.startSec < sec), ...clips])
    this.onChange()
  }

  clear(): void {
    if (this.items.length === 0) return
    this.items = []
    this.onChange()
  }
}

function sorted(clips: Clip[]): Clip[] {
  return clips.sort((a, b) => a.startSec - b.startSec || a.id.localeCompare(b.id))
}
