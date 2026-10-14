// The table of ways: one row a way, a family a file. A new way is a row in
// its family's file: the menu, the words and the family's sweep over the bank
// read this. What else moves with it is the count the bank walk pins
// (__tests__/ways-bank.test.ts) and the generated table in the docs
// (UPDATE_WAYS_DOC=1 writes docs/ways-generated.md).

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

/**
 * Every way of playing, in menu order: what a host lists. A row is words and
 * numbers only, without its rule, so a host can keep it, copy it or send it
 * to a worker. Its `far` is the row's own and not the rule's: a host that
 * writes into a row changes no way.
 */
export const WAYS: readonly WayRow[] = RULES.map(({ id, name, family, words, needs, far }) => ({
  id,
  name,
  family,
  words,
  needs,
  far: { ...far },
}))

export function wayRule(id: string): Way | undefined {
  return RULES.find((way) => way.id === id)
}
