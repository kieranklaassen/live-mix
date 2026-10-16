// The nine parts of a lesson, fixed and in order, and what the reading parts say of a named
// set. A lesson writes parts 1 to 8 as <Part id="why" title="…">; the page adds the ninth from
// front matter and settings. A card prints its settings from the same set its button plays, in
// the lab's own names and units, so the words cannot drift from the sound. Nothing here needs
// the framework.
import { withUnit } from '../figures/draw.ts'
import type { ControlInfo, LabDescription, TapKind } from '../lab/describe.ts'
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

/**
 * One of a unit that is a plural word: "octaves" is "octave", "passes" is "pass". A plural word
 * is four or more small letters that end in an s and hold a vowel, so an abbreviation ("s",
 * "ms", "Hz", "kbps") and a unit of several words are left as they are, and so is a word that
 * only ends like one ("gauss"). Undefined for a unit that is not a plural word.
 */
function singular(unit: string): string | undefined {
  if (!/^[a-z]{3,}s$/.test(unit) || !/[aeiouy]/.test(unit) || /(ss|us|is)$/.test(unit)) {
    return undefined
  }
  return /(ss|sh|ch|x)es$/.test(unit) ? unit.slice(0, -2) : unit.slice(0, -1)
}

/**
 * A number with a control's unit, as a control and a card print it. Where the unit is a plural
 * word and the number printed is 1, the unit is written in the singular: "1 octave".
 */
export function valueWithUnit(value: number, unit: string): string {
  const printed = withUnit(value, unit)
  return printed === withUnit(1, unit) ? withUnit(value, singular(unit) ?? unit) : printed
}

/** A control's value as the page prints it: the choice's name, or the number with its unit. */
export function valueInWords(control: ControlInfo, value: number): string {
  return control.choices[Math.round(value) - control.min] ?? valueWithUnit(value, control.unit)
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

/** A parameter of a device, as far as a row is matched to it: its key and its name. */
export interface ParamName {
  key: string
  name: string
}

/** The words of a key or a name, small: `lfoRateHz` and "LFO Rate" are lfo, rate (and hz). */
const wordsOf = (text: string): string[] =>
  text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

const endsWith = (whole: string[], end: string[]): boolean =>
  end.length > 0 &&
  end.length <= whole.length &&
  end.every((word, at) => word === whole[whole.length - end.length + at])

/**
 * True where the parameter is the control. A lab names a control in its own way and the library
 * in its: the two are one where the parameter's key ends in the control's id, with or without
 * the control's unit after it (`predelay` in ms is `predelayMs`, `rate` in Hz is `lfoRateHz`),
 * or its name ends in the control's name ("Rate" is "LFO Rate").
 */
function answersTo(param: ParamName, control: ControlInfo): boolean {
  const key = wordsOf(param.key)
  const id = wordsOf(control.id)
  const unit = wordsOf(control.unit)
  return (
    endsWith(key, id) ||
    (unit.length === 1 && endsWith(key, [...id, ...unit])) ||
    endsWith(wordsOf(param.name), wordsOf(control.name))
  )
}

/**
 * The rows of the last part's table that are the lab's own: the controls the defaults name to
 * which no parameter of the lesson's devices answers. What is the device's is read from the
 * library's own list of its parameters, so nothing here is kept by hand.
 */
export function labsOwnRows(
  lab: LabDescription,
  defaults: NamedSet,
  params: readonly ParamName[],
): DefaultsRow[] {
  const own = new Set(
    lab.controls
      .filter((control) => !params.some((param) => answersTo(param, control)))
      .map((control) => control.id),
  )
  return defaultsBeside(lab, defaults).filter((row) => own.has(row.id))
}

const listed = (names: string[]): string =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`

/**
 * The sentence above the last part's table. It says the lab's controls are the device's own
 * only where every row is; a row that is the lab's is named, with what its second number is.
 */
export function tableWords(rows: readonly DefaultsRow[], own: readonly DefaultsRow[]): string {
  const starts =
    'Where this lesson starts each of them, and where the device starts it when nothing has been set:'
  if (own.length === 0) return `The lab's controls are the device's own. ${starts}`
  if (own.length === rows.length) {
    return "The controls in this table are the lab's, and the device has none of them. Where this lesson starts each of them, and the setting at which the lab does as the device does:"
  }
  const names = listed(own.map((row) => row.name))
  const which =
    own.length === 1
      ? "which is the lab's: the device has no such control, and that row gives the setting"
      : "which are the lab's: the device has no such controls, and those rows give the settings"
  return `The controls in this table are the device's own, except ${names}, ${which} at which the lab does as the device does. ${starts}`
}

/**
 * What the last part says ran above it. A lesson whose lab runs code that is not the engine's
 * says which in its front matter (`written`), and the page says so in the lesson's words.
 */
export function ranWords(written?: string): string {
  const engine =
    "Everything above ran in a lab: the engine's code, stopped at each stage so it could be looked at"
  return written ? `${engine}, and with it code written for this lesson. ${written}` : `${engine}.`
}

/**
 * How the last part's device is fed, to end "running live through the engine as an app runs
 * it, …". An effect is fed the loop the page plays. An instrument takes no sound in: the bench
 * plays it a phrase of its own. An effect in a lesson that plays no loop is fed the sound the
 * lab makes, which the page takes as the store does (lab/store.ts): the first tap of sound that
 * is the source's, or the first of sound.
 */
export function benchFeed(
  lab: LabDescription,
  sources: readonly string[],
  as: 'insert' | 'send' | 'instrument',
): string {
  if (as === 'instrument') return 'played a short phrase that comes round'
  if (sources.some((source) => source !== NO_SOURCE.id)) return 'on the same loop'
  const sound = lab.taps.filter((tap) => tap.kind === 'audio')
  const fed = sound.find((tap) => tap.origin === 'source') ?? sound[0]
  if (!fed) return 'with nothing going in'
  return `fed the sound the lab itself makes, “${fed.name}”, since this lesson plays no loop`
}

/** What a tap that is not sound is, as site/labs/lab.h declares its kind. */
const NOT_SOUND: Record<Exclude<TapKind, 'audio'>, string> = {
  control: 'a value that changes over time',
  curve: 'a curve of one value against another',
  spectrum: 'a spectrum, a level for each frequency',
  // Columns of values: a spectrum over time, or whatever else a lab lays out so.
  frames: 'a picture made of columns of values',
}

/**
 * What a stage whose tap is not sound says where its button would be. The tap's name is quoted
 * whole, so the sentence reads the same whatever a lab calls the tap, and it has no colon of
 * its own beside one the name may hold.
 */
export function stageKindWords(name: string, kind: Exclude<TapKind, 'audio'>): string {
  return `“${name}” is ${NOT_SOUND[kind]}. It is not sound, so this stage has no button to hear it.`
}
