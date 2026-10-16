// A button that plays one stage: in the run of the text, or, as a card's button is drawn, under a
// stage. Lit while its tap sounds and no card is the one sounding.

import type { ReactNode } from 'react'
import { labStore, useLab } from '../lab/page.ts'
import { tapState } from './sounding.ts'

interface Props {
  tap: string
  /** Drawn as a card's button is, on a line of its own, and not as a word in a sentence. */
  block?: boolean
  children?: ReactNode
}

export default function Listen({ tap, block, children }: Props) {
  const state = useLab()
  const sounding = tapState(state, tap) === 'sounding'
  return (
    <button
      type="button"
      className={block ? 'hear' : 'listen'}
      data-tap={tap}
      aria-pressed={sounding}
      disabled={!state.result}
      onClick={() => (sounding ? labStore().stop() : labStore().listen(tap))}
    >
      <span aria-hidden="true">{sounding ? '■' : '▶'}</span> {children}
    </button>
  )
}
