// The button under the last part's table: it sets the page to the device's own defaults and
// starts no sound. The store keeps what was there before, so the play bar's "back" undoes it.

import { labStore, useLab } from '../lab/page.ts'
import type { NamedSet } from '../lab/store.ts'

export default function DefaultsButton({ defaults }: { defaults: NamedSet }) {
  const ready = useLab().status === 'ready'
  return (
    <button
      type="button"
      className="button"
      data-defaults=""
      disabled={!ready}
      onClick={() => labStore().applySet(defaults)}
    >
      Set this page to the device's own settings
    </button>
  )
}
