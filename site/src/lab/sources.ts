// The sounds a lesson can put through its lab. Each id is a tap of the bench (site/labs/bench.cpp),
// so every loop is the engine's own instruments playing, and every test signal the kit's oscillators.

export interface SourceInfo {
  id: string
  name: string
  /** One line for the picker: what it is and what it is good for hearing. */
  about: string
}

export const SOURCES: SourceInfo[] = [
  {
    id: 'drums',
    name: 'Drums',
    about: 'A two-bar pattern on the Drum Kit: sharp hits with silence between.',
  },
  {
    id: 'guitar',
    name: 'Guitar',
    about: 'A picked line on the Guitar: single notes that ring and die.',
  },
  {
    id: 'chords',
    name: 'Guitar chords',
    about: 'The Guitar strummed, a chord a bar, left to ring.',
  },
  { id: 'sine', name: 'Sine', about: 'One frequency, 440 Hz: the simplest sound there is.' },
  { id: 'saw', name: 'Saw', about: 'A saw wave at 110 Hz: every harmonic, falling in level.' },
  { id: 'noise', name: 'Noise', about: 'White noise: every frequency at once, at the same level.' },
  {
    id: 'clicks',
    name: 'Clicks',
    about: 'A single sample, once a second: what a stage does to one instant.',
  },
  { id: 'sweep', name: 'Sweep', about: 'A sine rising from 20 Hz to 20 kHz across the loop.' },
]

/** The picker's last choice: a file of the reader's own, decoded in the page. */
export const OWN_FILE = 'file'

export function sourceInfo(id: string): SourceInfo {
  const found = SOURCES.find((source) => source.id === id)
  if (!found) throw new Error(`No source called ${id}`)
  return found
}
