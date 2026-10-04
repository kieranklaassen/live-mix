// A leaf: it imports nothing, so a script of its own (the packs' sounds, in
// ./factory/sound-packs) can use it without taking the renderer with it.

/** Equal temperament, A4 = 440 Hz. */
export function noteFrequency(note: number): number {
  return 440 * 2 ** ((note - 69) / 12)
}
