// The set of one instrument: five hundred presets in ten directions, written as
// a table. A direction is what the instrument is played for (a pad, a struck
// bell, a drone to sit on); it has chains of effects and phrases of its own,
// and a row for each preset. A table is a fraction of the text the same presets
// are as objects, which is what a page fetches.
//
//   name | start | settings | chain | phrase | words [| category]
//
//   start     one of the instrument's own presets to set out from, or -
//   settings  key=value over it; a stepped knob takes its choice by name (`names`)
//   chain     a chain of the set, with settings over its effects: `hall 1.mix=0.3`
//   phrase    a phrase of the set, or - for the one of the preset's category
//   words     what the instrument does; the chain's words and a full stop follow

import { type PatchDevice } from '../../../core/devices/patch'
import { type FactoryPreset, type FactoryPresetCategory, type Phrase } from '../types'

export interface SetChain {
  effects: readonly PatchDevice[]
  /** What the chain does, as it follows on from a row's own words: `in a long dark hall`. */
  words: string
}

export interface SetDirection {
  id: string
  name: string
  category: FactoryPresetCategory
  rows: string
}

export interface InstrumentSet {
  /** The instrument. Ids of its presets start with it and `set`. */
  device: string
  /** The choices of its stepped knobs by the words the rows use for them. */
  names: Readonly<Record<string, readonly string[]>>
  chains: Readonly<Record<string, SetChain>>
  phrases: Readonly<Record<string, Phrase>>
  directions: readonly SetDirection[]
}

/** The id of the pack an instrument's set is listed as. */
export function setId(device: string): string {
  return `${device}-set`
}

function kebab(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** A row that cannot be read says which one it is: a table is data, and a slip in it should not pass as a default. */
function fail(set: InstrumentSet, line: string, problem: string): never {
  throw new Error(`The set of ${set.device}: ${problem} in "${line.trim()}"`)
}

function settings(
  set: InstrumentSet,
  line: string,
  text: string,
): Record<string, number> | undefined {
  const words = text.split(' ').filter((word) => word !== '' && word !== '-')
  if (words.length === 0) return undefined
  const params: Record<string, number> = {}
  for (const word of words) {
    const cut = word.indexOf('=')
    const key = word.slice(0, cut)
    const value = word.slice(cut + 1)
    const choice = set.names[key]?.indexOf(value.replaceAll('_', ' ')) ?? -1
    const number = choice >= 0 ? choice : Number(value)
    if (cut < 1 || value === '' || !Number.isFinite(number) || key in params)
      fail(set, line, `"${word}"`)
    params[key] = number
  }
  return params
}

function effectsOf(set: InstrumentSet, line: string, text: string): [SetChain, PatchDevice[]] {
  const [id, ...over] = text.split(' ').filter((word) => word !== '')
  const chain = set.chains[id ?? '']
  if (!chain) return fail(set, line, `no chain "${id}"`)
  if (over.length === 0) return [chain, [...chain.effects]]
  const effects = chain.effects.map((effect) => ({ ...effect, params: { ...effect.params } }))
  for (const word of over) {
    const read = /^(\d)\.(\w+)=(-?[\d.]+)$/.exec(word)
    const effect = read ? effects[Number(read[1]) - 1] : undefined
    const value = Number(read?.[3])
    if (!read || !effect || !Number.isFinite(value)) return fail(set, line, `"${word}"`)
    effect.params[read[2]] = value
  }
  return [chain, effects]
}

/** A direction's rows, one to a preset. */
export function setRows(direction: SetDirection): string[] {
  return direction.rows.split('\n').filter((line) => line.trim() !== '')
}

/** The presets a set's table says. */
export function setPresets(set: InstrumentSet): FactoryPreset[] {
  return set.directions.flatMap((direction) =>
    setRows(direction).map((line): FactoryPreset => {
      const cells = line.split('|').map((cell) => cell.trim())
      if (cells.length < 6 || cells.length > 7) fail(set, line, `${cells.length} cells`)
      const [name, start, over, chainText, phraseId, words, category] = cells
      const [chain, effects] = effectsOf(set, line, chainText)
      const phrase = phraseId === '-' ? undefined : set.phrases[phraseId]
      if (phraseId !== '-' && !phrase) fail(set, line, `no phrase "${phraseId}"`)
      const params = settings(set, line, over)
      return {
        id: `${setId(set.device)}-${kebab(name)}`,
        name,
        category: (category as FactoryPresetCategory | undefined) ?? direction.category,
        description: `${words}${/^[,;]/.test(chain.words) || chain.words === '' ? '' : ' '}${chain.words}.`,
        ...(phrase && { preview: phrase }),
        instrument: {
          deviceId: set.device,
          ...(start !== '-' && { preset: start }),
          ...(params && { params }),
        },
        effects,
        direction: direction.name,
      }
    }),
  )
}
