// The map of the lessons: the families and, in each, its lessons in order, as
// src/content/families.json lists them. A lesson's number is its place there, so putting one
// in or moving one renames no file and changes no address. Nothing here needs the framework:
// the pages, <Lesson> and the tests all read the map through these.
import families from '../content/families.json'

export interface MapFamily {
  /** As a lesson's front matter names it: `family: dynamics`. */
  id: string
  /** As a page prints it. */
  name: string
  lessons: { id: string; title: string }[]
}

/** Where the map puts a lesson. */
export interface Place {
  id: string
  title: string
  /** Its place in the whole map, from 1. */
  number: number
  /** Its family's id. */
  family: string
  familyName: string
  /** Its place in its family, from 1, and how many lessons the family holds. */
  inFamily: number
  ofFamily: number
}

/** What the map needs of a lesson that is written: its file's name and the family it says. */
export interface Written {
  id: string
  data: { family: string }
}

/** A lesson of the map, with its text: every one has it, but in a build of one lesson. */
export interface MapLesson<L> extends Place {
  lesson?: L
}

export interface MapRow<L> {
  id: string
  name: string
  lessons: MapLesson<L>[]
}

export const MAP: readonly MapFamily[] = families

export const lessonPath = (id: string) => `lessons/${id}/`

/** A lesson's number as a list prints it: 07. */
export const twoDigits = (number: number) => String(number).padStart(2, '0')

/** Every lesson of the map, in its order. Throws on an id the map lists twice. */
export function places(map: readonly MapFamily[] = MAP): Place[] {
  const all: Place[] = []
  for (const family of map) {
    family.lessons.forEach(({ id, title }, index) => {
      if (all.some((one) => one.id === id)) {
        throw new Error(`The map lists the lesson "${id}" twice (site/src/content/families.json).`)
      }
      all.push({
        id,
        title,
        number: all.length + 1,
        family: family.id,
        familyName: family.name,
        inFamily: index + 1,
        ofFamily: family.lessons.length,
      })
    })
  }
  return all
}

/** Where the map puts the lesson of that id. Throws on an id the map does not list. */
export function placeOf(id: string, map: readonly MapFamily[] = MAP): Place {
  const place = places(map).find((one) => one.id === id)
  if (!place) {
    throw new Error(`${id}: the map does not list it. Add it to site/src/content/families.json.`)
  }
  return place
}

/**
 * The lessons that are written, in the map's order. Throws on one the map does not list and
 * on one whose front matter names another family than the map puts it in. A lesson the map
 * lists that has no file is left out here: `mapWith` is what stops the build on it.
 */
export function inMapOrder<L extends Written>(
  lessons: readonly L[],
  map: readonly MapFamily[] = MAP,
): L[] {
  const numbered = lessons.map((lesson) => {
    const place = placeOf(lesson.id, map)
    if (lesson.data.family !== place.family) {
      throw new Error(
        `${lesson.id}: its front matter says the family "${lesson.data.family}", and the map puts it in "${place.family}".`,
      )
    }
    return { lesson, number: place.number }
  })
  return numbered.sort((a, b) => a.number - b.number).map((one) => one.lesson)
}

/**
 * The whole map, family by family, each lesson with its text. Every lesson the map lists has a
 * file: the build stops on one that has none, naming each. A build of one lesson (`only`, the
 * lesson's id: scripts/lesson.sh) reads that lesson's file and no other, so there the others
 * keep their places with no `lesson`, and the page draws them as tiles that are not built.
 */
export function mapWith<L extends Written>(
  lessons: readonly L[],
  map: readonly MapFamily[] = MAP,
  only?: string,
): MapRow<L>[] {
  const written = new Map(inMapOrder(lessons, map).map((lesson) => [lesson.id, lesson]))
  const all = places(map)
  const missing = all
    .filter((place) => !written.has(place.id) && (only === undefined || place.id === only))
    .map((place) => place.id)
  if (missing.length > 0) {
    const lessonsThat =
      missing.length === 1 ? '1 lesson that has' : `${missing.length} lessons that have`
    throw new Error(
      `The map lists ${lessonsThat} no file: ${missing.join(', ')}. ` +
        'Each needs site/src/content/lessons/<id>.mdx, or comes off the map (site/src/content/families.json).',
    )
  }
  return map.map(({ id, name }) => ({
    id,
    name,
    lessons: all
      .filter((place) => place.family === id)
      .map((place) => ({ ...place, lesson: written.get(place.id) })),
  }))
}

/**
 * The words <Lesson id> prints: "lesson 13, Compression", with a capital where it starts a
 * sentence. `page` is where it stands, for the message when the id is one the map does not list.
 */
export function mention(
  id: string,
  cap = false,
  page = 'A page',
  map: readonly MapFamily[] = MAP,
): string {
  const all = places(map)
  const place = all.find((one) => one.id === id)
  if (!place) {
    const known = all.map((one) => one.id).join(', ')
    throw new Error(
      `${page}: <Lesson id="${id}" /> names a lesson the map does not list. It lists: ${known}`,
    )
  }
  return `${cap ? 'Lesson' : 'lesson'} ${place.number}, ${place.title}`
}
