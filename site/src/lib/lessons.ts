// The lessons as pages: their order, their routes, and the components a lesson is written with.
import { getCollection, type CollectionEntry } from 'astro:content'
import { NO_SOURCE, SOURCES, type SourceInfo } from '../lab/sources.ts'
import { inMapOrder, mapWith, type MapRow } from './lesson-map.ts'

export {
  lessonPath,
  placeOf,
  twoDigits,
  type MapLesson,
  type MapRow,
  type Place,
} from './lesson-map.ts'

export type Lesson = CollectionEntry<'lessons'>

/**
 * The lessons that are written, in the map's order (src/content/families.json). Stops the build
 * on a lesson's file the map does not list, on a family that is not the one the map gives, and
 * on an id the map lists twice.
 */
export async function lessonsInOrder(): Promise<Lesson[]> {
  return inMapOrder(await getCollection('lessons'))
}

/** The whole map, family by family, each lesson with its text where that is written. */
export async function lessonMap(): Promise<MapRow<Lesson>[]> {
  return mapWith(await getCollection('lessons'))
}

/** The sources a lesson offers, as the picker lists them. Throws on an id the bench does not play. */
export function lessonSources(lesson: Lesson): SourceInfo[] {
  return lesson.data.sources.map((id) => {
    const source = [...SOURCES, NO_SOURCE].find((one) => one.id === id)
    if (!source) {
      const known = [...SOURCES, NO_SOURCE].map((one) => one.id).join(', ')
      throw new Error(`${lesson.id}: there is no source called "${id}". There are: ${known}`)
    }
    return source
  })
}

// Every component in components/lesson/ is one a lesson can use by its file's name, with no
// import: <Wave>, <Controls>, <M>. A lesson's own figure is added there the same way.
const files = import.meta.glob<{ default: unknown }>('../components/lesson/*.astro', {
  eager: true,
})
export const lessonComponents: Record<string, unknown> = Object.fromEntries(
  Object.entries(files).map(([file, module]) => [
    file.slice(file.lastIndexOf('/') + 1, -'.astro'.length),
    module.default,
  ]),
)
