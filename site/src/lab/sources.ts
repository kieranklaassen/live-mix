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
  {
    id: 'bass',
    name: 'Bass',
    about: 'A bass line on the Ladder Bass: low notes one at a time, each struck and left to die.',
  },
  {
    id: 'pad',
    name: 'Pad',
    about: 'The same chords held on Dusk, a bar each: slow swells with no sharp edge.',
  },
  {
    id: 'mix',
    name: 'Mix',
    about: 'The drums, the bass and the guitar chords together: several sounds on one bus.',
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

/**
 * For a lesson whose lab makes its own sound (an instrument, an oscillator): nothing goes in.
 * A lesson that offers only this has no source picker.
 */
export const NO_SOURCE: SourceInfo = {
  id: 'none',
  name: 'Nothing: the lab plays',
  about: 'Nothing goes in. The lab plays the notes itself.',
}

/** The picker's last choice: a file of the reader's own, decoded in the page. */
export const OWN_FILE = 'file'
