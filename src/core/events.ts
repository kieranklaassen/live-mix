// A minimal listener set shared by every core object that reports changes to
// hosts (React hooks, agent snapshots). Synchronous and allocation-free on
// `emit` apart from the defensive copy, which lets a listener unsubscribe
// while being called. Nothing here touches the audio thread.

export type Listener<T> = (value: T) => void

export class Emitter<T> {
  private readonly listeners = new Set<Listener<T>>()

  /** Add a listener; returns the matching unsubscribe (idempotent). */
  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  emit(value: T): void {
    if (this.listeners.size === 0) return
    for (const listener of [...this.listeners]) listener(value)
  }

  get size(): number {
    return this.listeners.size
  }

  clear(): void {
    this.listeners.clear()
  }
}
