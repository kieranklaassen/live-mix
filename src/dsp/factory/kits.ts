// Kits: instruments whose keys are things and not pitches. Every C of a drum
// kit is the kick and every D the snare, whatever the octave; the octave a
// key is played in tunes the drum (cpp/kit/keymap.h). So what a pitched
// instrument does with a key (a scale lock, a chord of the key, a move into
// another key) is wrong for one: its notes stay where they are written, and
// the kit's own `tune` is what follows the key.

/** The stock instruments that are kits, by device id. */
export const KIT_INSTRUMENTS: readonly string[] = ['drum-kit', 'glitch-kit']

/** Whether the instrument with this device id is a kit: its keys pick a drum, not a pitch. */
export function isKitInstrument(deviceId: string): boolean {
  return KIT_INSTRUMENTS.includes(deviceId)
}
