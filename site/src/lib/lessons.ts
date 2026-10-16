// The lessons as pages: their order, their routes, and the components a lesson is written with.
import { getCollection, type CollectionEntry } from 'astro:content'
import { NO_SOURCE, SOURCES, type SourceInfo } from '../lab/sources.ts'

export type Lesson = CollectionEntry<'lessons'>

export async function lessonsInOrder(): Promise<Lesson[]> {
  const lessons = (await getCollection('lessons')).sort((a, b) => a.data.order - b.data.order)
  const seen = new Map<number, string>()
  for (const lesson of lessons) {
    const other = seen.get(lesson.data.order)
    if (other)
      throw new Error(`Lessons ${other} and ${lesson.id} are both number ${lesson.data.order}.`)
    seen.set(lesson.data.order, lesson.id)
  }
  return lessons
}

export const lessonPath = (id: string) => `lessons/${id}/`

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
