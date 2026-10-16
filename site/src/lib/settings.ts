// A lesson's named settings: one file a lesson, site/src/content/settings/<id>.json. It holds
// the home tile's entry, the sets the lesson's cards play and, where the lab's controls are the
// device's own, the device's defaults as lab values. The page, the home tile and the lab's test
// read the same file through here, so a number on a card is one a test can render. A set is
// checked against the lab when the site is built, and a name the lab or the lesson does not have
// stops the build. Nothing here needs the framework.
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'astro/zod'
import type { LabDescription } from '../lab/describe.ts'
import { BUILD, resolveSet, type NamedSet, type ResolvedSet } from '../lab/store.ts'
import { labInfo } from './lab-info.ts'
import { REPO_ROOT } from './site.ts'

// A set is filled in by the store's own function, so the page plays what a test renders.
export { resolveSet, type NamedSet, type ResolvedSet }

/** How a tile's picture draws its taps. */
export const PICTURE_VIEWS = ['wave', 'spectrum', 'spectrogram', 'curve'] as const

/**
 * What a picture takes beside its view, its span and its ranges, each with the meaning a still
 * gives it (lib/still.ts): a spectrum's `scale`, the word under the picture, the taps drawn as
 * stems (all of them, or those named, "frame other" or a list), and `both` channels of a sound
 * that has two. The tile's picture and the opening picture take them alike.
 */
export const pictureOptions = {
  scale: z.enum(['log', 'linear']).optional(),
  xTitle: z.string().min(1).optional(),
  stems: z.union([z.boolean(), z.string(), z.array(z.string())]).optional(),
  channels: z.enum(['left', 'both']).optional(),
}

/**
 * What the opening picture of a lesson takes beside those: the word over its y axis, and the
 * sounds its two pictures are of, going in and coming out, where the taps drawn are not sound
 * themselves (a spectrogram's), so that each has its button to hear it.
 */
export const openingOptions = {
  ...pictureOptions,
  yTitle: z.string().min(1).optional(),
  hear: z.tuple([z.string(), z.string()]).optional(),
}

/** The taps a picture draws as stems, by id: every one (`true`), none, or those named. */
export function stemsNamed(
  stems: boolean | string | readonly string[] | undefined,
): boolean | string[] {
  if (stems === undefined || typeof stems === 'boolean') return stems ?? false
  return typeof stems === 'string' ? stems.split(/[\s,]+/).filter(Boolean) : [...stems]
}

/** Control values by id. A control left out is at the lab's starting value. */
const values = z.record(z.string(), z.number())

/** A named set: complete, and never one that moves the build step. */
const set = {
  values: values.default({}),
  /** One of the lesson's sources, by id; left out, the set plays on the source the page is on. */
  source: z.string().optional(),
  /** The tap to play, by id; left out, the lab's last sound. */
  tap: z.string().optional(),
}

export const settingsSchema = z.strictObject({
  /** The lesson's tile on the home map: the set it plays, the tap that sounds, and its picture. */
  tile: z
    .strictObject({
      ...set,
      tap: z.string(),
      picture: z.strictObject({
        /** The taps drawn, by id, in the order they are drawn. */
        taps: z.array(z.string()).min(1),
        view: z.enum(PICTURE_VIEWS),
        /** The span of time drawn, in seconds: where it starts, and its length (to the loop's end when left out). */
        from: z.number().min(0).default(0),
        span: z.number().positive().optional(),
        /**
         * As a still's (lib/still.ts): the vertical range, in the view's own unit, and for a
         * spectrum or a spectrogram the highest frequency drawn, in hertz. Each is fitted when
         * left out.
         */
        min: z.number().optional(),
        max: z.number().optional(),
        top: z.number().positive().optional(),
        /** As a still's too: the scale, the x title, the stems and the channels. */
        ...pictureOptions,
      }),
    })
    .optional(),
  /** The sets the cards play, by the name a card asks for. */
  sets: z
    .record(
      z.string(),
      z.strictObject({
        /** What the play bar calls the card while it sounds. */
        label: z.string().min(1),
        ...set,
      }),
    )
    .default({}),
  /** The device's defaults as lab values: only where the lab's controls are the device's own. */
  defaults: z.strictObject({ values }).optional(),
})

export type LessonSettings = z.infer<typeof settingsSchema>
export type TileEntry = NonNullable<LessonSettings['tile']>
export type CardSet = LessonSettings['sets'][string]

export const SETTINGS_DIR = path.join(REPO_ROOT, 'site/src/content/settings')

/**
 * A lesson's settings as its file writes them, or undefined for a lesson with no file, which is
 * not a fault. Throws, naming the lesson, on a file that is not of the shape above.
 */
export function readSettings(lesson: string, dir = SETTINGS_DIR): LessonSettings | undefined {
  const file = path.join(dir, `${lesson}.json`)
  if (!fs.existsSync(file)) return undefined
  const parsed = settingsSchema.safeParse(JSON.parse(fs.readFileSync(file, 'utf8')))
  if (!parsed.success) {
    const faults = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'the file'}: ${issue.message}`)
      .join('; ')
    throw new Error(`${lesson}: its settings file is not of the shape a lesson's is. ${faults}`)
  }
  return parsed.data
}

const listed = (ids: string[], what: string) =>
  ids.length > 0 ? `It has: ${ids.join(', ')}` : `It has no ${what}`

/**
 * Stops the build, naming the lesson and the set, on a control the lab lacks, a value outside
 * its control's range, a tap the lab lacks or cannot play, a source the lesson does not list,
 * and stems for a tap the tile's picture does not draw.
 */
export function checkSettings(
  settings: LessonSettings,
  lab: LabDescription,
  sources: readonly string[],
  lesson: string,
): void {
  const controls = lab.controls.filter((control) => control.id !== BUILD)
  const taps = lab.taps.map((tap) => tap.id)
  const tapNamed = (id: string, where: string) => {
    const tap = lab.taps.find((one) => one.id === id)
    if (!tap) {
      throw new Error(
        `${lesson}: the tap "${id}", named in ${where}, is not one the lab has. ${listed(taps, 'taps')}`,
      )
    }
    return tap
  }
  const check = (named: NamedSet, where: string) => {
    for (const [id, value] of Object.entries(named.values ?? {})) {
      if (id === BUILD) {
        throw new Error(
          `${lesson}: the control "${BUILD}" is named in ${where}. A set never moves the build step.`,
        )
      }
      const control = controls.find((one) => one.id === id)
      if (!control) {
        const known = listed(
          controls.map((one) => one.id),
          'controls',
        )
        throw new Error(
          `${lesson}: the control "${id}", named in ${where}, is not one the lab has. ${known}`,
        )
      }
      // The lab holds a control as a single-precision number, so a value is read as one too:
      // 0.1 written in a file is the end of a range the lab reports as 0.10000000149.
      const held = Math.fround(value)
      if (held < control.min || held > control.max) {
        throw new Error(
          `${lesson}: "${id}" is ${value} in ${where}, outside its range of ${control.min} to ${control.max}.`,
        )
      }
    }
    if (named.tap !== undefined && tapNamed(named.tap, where).kind !== 'audio') {
      throw new Error(`${lesson}: the tap "${named.tap}", played by ${where}, is not sound.`)
    }
    if (named.source !== undefined && !sources.includes(named.source)) {
      throw new Error(
        `${lesson}: the source "${named.source}", named in ${where}, is not one the lesson lists. It lists: ${sources.join(', ')}`,
      )
    }
  }

  if (settings.tile) {
    check(settings.tile, 'the tile')
    const drawn = settings.tile.picture.taps
    for (const tap of drawn) tapNamed(tap, "the tile's picture")
    const stems = stemsNamed(settings.tile.picture.stems)
    for (const id of Array.isArray(stems) ? stems : []) {
      if (!drawn.includes(id)) {
        throw new Error(
          `${lesson}: the tile's picture draws stems for "${id}", which is not one of its taps. They are: ${drawn.join(', ')}`,
        )
      }
    }
  }
  for (const [name, one] of Object.entries(settings.sets)) check(one, `the set "${name}"`)
  if (settings.defaults) check(settings.defaults, "the device's defaults")
}

/** A lesson's settings, read and checked against its lab as built; undefined when it has no file. */
export async function lessonSettings(
  lesson: { id: string; data: { lab: string; sources: readonly string[] } },
  dir = SETTINGS_DIR,
): Promise<LessonSettings | undefined> {
  const settings = readSettings(lesson.id, dir)
  if (!settings) return undefined
  const lab = await labInfo(lesson.data.lab, lesson.id)
  checkSettings(settings, lab, lesson.data.sources, lesson.id)
  return settings
}

/** The set a card asks for by name. Stops the build on a name the lesson's file does not have. */
export function setNamed(
  settings: LessonSettings | undefined,
  name: string,
  lesson: string,
): CardSet {
  const found = settings?.sets[name]
  if (!found) {
    const has = settings
      ? `Its settings file has: ${Object.keys(settings.sets).join(', ')}`
      : 'The lesson has no settings file'
    throw new Error(`${lesson}: there is no set called "${name}". ${has}`)
  }
  return found
}
