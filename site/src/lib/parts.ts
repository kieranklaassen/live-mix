// The nine parts of a long lesson, fixed and in order, and what the reading parts say of a named
// set. A lesson writes parts 1 to 8 as <Part id="why" title="…">; the page adds the ninth from
// front matter and settings. A card prints its settings from the same set its button plays, in
// the lab's own names and units, so the words cannot drift from the sound. Nothing here needs
// the framework.
import { withUnit } from '../figures/draw.ts'
import type { ControlInfo, LabDescription } from '../lab/describe.ts'
import { NO_SOURCE, SOURCES } from '../lab/sources.ts'
import { BUILD, type NamedSet } from '../lab/store.ts'

export const PARTS = [
  { id: 'why', name: 'Why you need it' },
  { id: 'picture', name: 'What it does, in one picture' },
  { id: 'uses', name: 'What you use it on' },
  { id: 'build', name: 'Build one, a piece at a time' },
  { id: 'engine', name: 'Inside the engine, stage by stage' },
  { id: 'ways', name: 'Ways to use it' },
  { id: 'wrong', name: 'What goes wrong' },
  { id: 'myths', name: 'Common misconceptions' },
  { id: 'device', name: 'The real device' },
] as const

export type PartId = (typeof PARTS)[number]['id']

/** The last part. The page makes it; a lesson's text does not write it. */
export const DEVICE_PART: PartId = 'device'

/** A part with its number of the nine, from 1. */
export interface PartPlace {
  id: PartId
  name: string
  number: number
}

const ids = PARTS.map((part) => part.id).join(', ')

/** The part of that id. Stops the build, naming the lesson, on an id that is not one of the nine. */
export function partNamed(id: string, lesson: string): PartPlace {
  const at = PARTS.findIndex((part) => part.id === id)
  const part = PARTS[at]
  if (!part) throw new Error(`${lesson}: there is no part called "${id}". The parts are: ${ids}`)
  return { ...part, number: at + 1 }
}

/**
 * The parts a lesson's text writes, in its order: every <Part id="…"> of the text as written.
 * Stops the build on a part that is not one of the nine, on the last part, on a part out of
 * its order and on one written twice.
 */
export function partsIn(text: string, lesson: string): PartPlace[] {
  const found: PartPlace[] = []
  for (const [, , id] of text.matchAll(/<Part\s[^<>]*?\bid=(["'])(.*?)\1/g)) {
    const part = partNamed(id!, lesson)
    if (part.id === DEVICE_PART) {
      throw new Error(
        `${lesson}: its text writes the part "${DEVICE_PART}". The page adds that part itself, from the front matter and the settings file.`,
      )
    }
    const last = found.at(-1)
    if (last && part.number === last.number) {
      throw new Error(`${lesson}: the part "${part.id}" is written twice.`)
    }
    if (last && part.number < last.number) {
      throw new Error(
        `${lesson}: the part "${part.id}" comes after "${last.id}". The order is: ${ids}`,
      )
    }
    found.push(part)
  }
  return found
}

/** The two taps of a lesson's opening picture: the sound going in, and what comes out. */
export interface OpeningTaps {
  input: string
  output: string
}

/** The opening picture's taps as given. Stops the build, naming the lesson, on one the lab lacks. */
export function openingTaps(
  lab: LabDescription,
  opening: OpeningTaps,
  lesson: string,
): OpeningTaps {
  for (const tap of [opening.input, opening.output]) {
    if (!lab.taps.some((one) => one.id === tap)) {
      const known = lab.taps.map((one) => one.id).join(', ')
      throw new Error(
        `${lesson}: its opening picture names the tap "${tap}", which the lab does not have. It has: ${known}`,
      )
    }
  }
  return opening
}

/** A control's value as the page prints it: the choice's name, or the number with its unit. */
export function valueInWords(control: ControlInfo, value: number): string {
  return control.choices[Math.round(value) - control.min] ?? withUnit(value, control.unit)
}

export interface SetInWords {
  /** The controls the set names, in the lab's order. The others stay at the lesson's start. */
  settings: { id: string; name: string; value: string }[]
  /** The source the set plays on, by its name, when it names one. */
  source?: string
}

/** A named set as a card prints it. */
export function setInWords(lab: LabDescription, set: NamedSet): SetInWords {
  const values = set.values ?? {}
  const words: SetInWords = {
    settings: lab.controls
      .filter((control) => control.id !== BUILD && values[control.id] !== undefined)
      .map((control) => ({
        id: control.id,
        name: control.name,
        value: valueInWords(control, values[control.id]!),
      })),
  }
  if (set.source !== undefined) {
    words.source =
      [...SOURCES, NO_SOURCE].find((source) => source.id === set.source)?.name ?? set.source
  }
  return words
}

/** A row of the last part's table: where the lesson starts a control, and where the device does. */
export interface DefaultsRow {
  id: string
  name: string
  lesson: string
  device: string
}

/** The controls the device's defaults name, in the lab's order, each at both starts. */
export function defaultsBeside(lab: LabDescription, defaults: NamedSet): DefaultsRow[] {
  const values = defaults.values ?? {}
  return lab.controls
    .filter((control) => control.id !== BUILD && values[control.id] !== undefined)
    .map((control) => ({
      id: control.id,
      name: control.name,
      lesson: valueInWords(control, control.initial),
      device: valueInWords(control, values[control.id]!),
    }))
}
