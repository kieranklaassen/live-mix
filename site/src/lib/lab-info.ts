// What a lab says of itself, asked when the site is built: the lab's module is loaded in Node
// and its controls, taps and checks read out. A figure's names and a control's range are then
// in the page as built, and a lesson that names a tap its lab does not have stops the build.
import fs from 'node:fs'
import path from 'node:path'
import type { LabDescription } from '../lab/describe.ts'
import { loadLab } from '../lab/runner.ts'
import { REPO_ROOT } from './site.ts'

const cache = new Map<string, Promise<LabDescription>>()

export function labInfo(lab: string, lesson: string): Promise<LabDescription> {
  let found = cache.get(lab)
  if (!found) {
    const file = path.join(REPO_ROOT, 'site/public/labs', `${lab}.wasm`)
    if (!fs.existsSync(file)) {
      const source = path.join(REPO_ROOT, 'site/labs', `${lab}.cpp`)
      throw new Error(
        fs.existsSync(source)
          ? `${lesson}: its lab "${lab}" is not built. Run \`pnpm labs\` in site/ first.`
          : `${lesson}: it names the lab "${lab}", and there is no site/labs/${lab}.cpp.`,
      )
    }
    found = loadLab(fs.readFileSync(file)).then((loaded) => loaded.description)
    cache.set(lab, found)
  }
  return found
}

/** The lab of the lesson a component is being built into. */
export function pageLab(locals: App.Locals): { lab: LabDescription; lesson: string } {
  if (!locals.lab) throw new Error('A lesson figure was used outside a lesson page.')
  return { lab: locals.lab, lesson: locals.lesson ?? 'the lesson' }
}

/** Controls named in a figure's `lines` or `uprights`, as [id, name] pairs the figure can draw. */
export function controlPairs(
  names: string | undefined,
  lab: LabDescription,
  lesson: string,
): [string, string][] {
  return (names ?? '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((id) => {
      const control = lab.controls.find((one) => one.id === id)
      if (!control) {
        const known = lab.controls.map((one) => one.id).join(', ')
        throw new Error(`${lesson}: the lab has no control called "${id}". It has: ${known}`)
      }
      return [control.id, control.name]
    })
}
