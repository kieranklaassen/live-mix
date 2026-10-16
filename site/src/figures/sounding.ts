// Which button is lit. A page has many buttons on one tap, so what is sounding is more than a
// tap: a card is lit while its own audition is the one that sounds, and a stage's button while
// its tap sounds and no card is live. A button is busy from its press until the render that
// carries the page's values lands. Tested in tests/unit/build-steps.test.ts.

import type { LabState } from '../lab/store.ts'

export type SoundState = 'idle' | 'busy' | 'sounding'

type Sounding = Pick<LabState, 'playing' | 'sounding' | 'audition' | 'waiting'>

/** A button that plays a stage by its tap: a stage of the strip, a listen button, the built sound. */
export function tapState(state: Sounding, tap: string): SoundState {
  if (state.waiting && !state.waiting.card && state.waiting.tap === tap) return 'busy'
  if (state.playing && !state.audition && state.sounding === tap) return 'sounding'
  return 'idle'
}

/** A card's button, by the card's id. */
export function cardState(state: Sounding, card: string): SoundState {
  if (state.waiting?.card?.id === card) return 'busy'
  if (state.playing && state.audition?.id === card) return 'sounding'
  return 'idle'
}
