// A card's button: it sets the page to one named set and plays it. Lit while its card is the one
// sounding; busy from the press until the render that carries the set lands. Pressed while it
// waits it does not start, and pressed while lit it stops: both are the store's doing.
//
// The same button stands in the run of a sentence (`inText`). There it carries `data-hear` and
// not `data-card`, so that a card whose words hold such a button still has one button that is
// the card's own.

import { labStore, useLab } from '../lab/page.ts'
import type { Audition, NamedSet } from '../lab/store.ts'
import { cardState } from './sounding.ts'

interface Props {
  card: Audition
  set: NamedSet
  /** What the button says. */
  label: string
  /** A button in the run of a sentence, and not a card's own. */
  inText?: boolean
}

export default function Hear({ card, set, label, inText = false }: Props) {
  const state = useLab()
  const now = cardState(state, card.id)
  const says = now === 'busy' ? 'Loading' : label
  return (
    <button
      type="button"
      className="hear"
      data-card={inText ? undefined : card.id}
      data-hear={inText ? card.id : undefined}
      aria-pressed={now === 'sounding'}
      aria-busy={now === 'busy' || undefined}
      // Many cards say the same word: each is named with what it plays.
      aria-label={`${says}: ${card.label}`}
      disabled={!state.result}
      onClick={() => labStore().audition(card, set)}
    >
      <span aria-hidden="true">{now === 'sounding' ? '■' : '▶'}</span>
      {says}
    </button>
  )
}
