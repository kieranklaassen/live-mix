// A button in the run of the text that plays one stage.

import type { ReactNode } from 'react'
import { labStore, useLab } from '../lab/page.ts'

export default function Listen({ tap, children }: { tap: string; children?: ReactNode }) {
  const state = useLab()
  const sounding = state.playing && state.sounding === tap
  return (
    <button
      type="button"
      className="listen"
      aria-pressed={sounding}
      disabled={!state.result}
      onClick={() => (sounding ? labStore().stop() : labStore().listen(tap))}
    >
      <span aria-hidden="true">{sounding ? '■' : '▶'}</span> {children}
    </button>
  )
}
