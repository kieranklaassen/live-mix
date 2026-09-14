// The interface both ducker implementations share, so the engine and the apps
// can swap them behind a flag: the Phase 0 main-thread `Ducker` (`'legacy'`,
// KTD7 — an analyser poll writing `setTargetAtTime` on a bus fader) and the
// audio-thread `WorkletDucker` (`'worklet'`, U17 — envelope detection and gain
// inside an AudioWorklet, no timers). Both take the same key node and the
// same defaults; only where the gain is applied differs.

export type DuckerMode = 'legacy' | 'worklet'

export interface SidechainDucker {
  readonly mode: DuckerMode
  /** Duck depth at full envelope: gain floor is `1 - depth`. */
  readonly depth: number
  /** Envelope follower attack time constant (ms). */
  readonly attackMs: number
  /** Envelope follower release time constant (ms). */
  readonly releaseMs: number
  /** RMS → duck drive scale (k in `1 - min(env*k, 1) * depth`). */
  readonly gainScale: number
  /** Current follower value (RMS domain). */
  readonly envelope: number
  /** Tap `node` as the sidechain key; a re-key replaces the previous key. */
  key(node: AudioNode): void
  /** Drop the current key. */
  unkey(): void
  /** Stop following for good (engine stop); the gain settles where it is. */
  stop(): void
  dispose(): void
}
