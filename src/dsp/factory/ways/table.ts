// The table of ways: one row a way, a family a file. A new way is a row in
// its family's file and nothing else: the menu, the words, the generated
// table in the docs and the tests all read this.

import { COUNTING } from './counting'
import { GROWTH } from './growth'
import { HELD } from './held'
import { ONE_AT_A_TIME } from './one-at-a-time'
import { TRADES } from './trades'
import { type Way, type WayRow } from './types'
import { VOICES } from './voices'

/** Every way with its rule, in menu order. */
export const RULES: readonly Way[] = [
  ...ONE_AT_A_TIME,
  ...COUNTING,
  ...GROWTH,
  ...TRADES,
  ...HELD,
  ...VOICES,
]

/** Every way of playing, in menu order: what a host lists. */
export const WAYS: readonly WayRow[] = RULES

export function wayRule(id: string): Way | undefined {
  return RULES.find((way) => way.id === id)
}
