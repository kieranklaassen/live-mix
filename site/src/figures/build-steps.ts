// The build part's steps, apart from any page: which step the lab is on, where Back and Add go,
// what the buttons say, and what a press does to the page's store. The step lives in the lab's
// `build` control and nowhere else. Tested in tests/unit/build-steps.test.ts.

import type { LabDescription, TapInfo } from '../lab/describe.ts'
import { BUILD, isBuilt, type LabStore } from '../lab/store.ts'
import { tapState } from './sounding.ts'

/** The step the build control stands at, 0 for the first: a whole step among the steps there are. */
export function stepAt(value: number | undefined, count: number): number {
  if (value === undefined || !Number.isFinite(value)) return 0
  return Math.min(Math.max(0, count - 1), Math.max(0, Math.round(value)))
}

/** Where Add goes: on by one piece, and from the last step back to the first. */
export const afterStep = (step: number, count: number): number => (step + 1 < count ? step + 1 : 0)

/** Where Back goes: undefined at the first step, which has nothing before it. */
export const beforeStep = (step: number): number | undefined => (step > 0 ? step - 1 : undefined)

/**
 * What Add says: the piece it adds, named as the lab names it, capitals and all, or, on the last
 * step, that it starts again.
 */
export function addLabel(step: number, names: readonly string[]): string {
  const next = names[step + 1]
  return next === undefined ? 'Start again' : `Add: ${next}`
}

/** A step beside the one shown: already built, the one shown, or still to come. */
export const stepPlace = (step: number, shown: number): 'built' | 'here' | 'ahead' =>
  step < shown ? 'built' : step === shown ? 'here' : 'ahead'

/** The lab's build control, or undefined for a lab with no build path. */
export const buildControl = (lab: LabDescription) =>
  lab.controls.find((control) => control.id === BUILD)

/**
 * The sound of what is built so far: the tap a build part names, or the first sound the lab's
 * build path writes. Throws, naming the lesson, when there is none or the tap named is not one.
 */
export function builtSound(
  lab: LabDescription,
  named: string | undefined,
  lesson: string,
): TapInfo {
  const built = lab.taps.filter((tap) => isBuilt(tap.id))
  const has =
    built.length > 0
      ? `Its build path writes: ${built.map((tap) => tap.id).join(', ')}`
      : 'Its lab writes no tap whose id begins "built"'
  if (named === undefined) {
    const sound = built.find((tap) => tap.kind === 'audio')
    if (!sound) throw new Error(`${lesson}: the build part has no built sound to play. ${has}`)
    return sound
  }
  const tap = built.find((one) => one.id === named)
  if (!tap) {
    throw new Error(`${lesson}: "${named}" is not a tap of the build path. ${has}`)
  }
  if (tap.kind !== 'audio') {
    throw new Error(`${lesson}: the built tap "${named}" is not sound, so it cannot be heard.`)
  }
  return tap
}

/**
 * Put the lab on a step. Whatever sounds carries on from the new render: the built sound at the
 * new step, and any other sound unchanged, since the build path leaves the main path alone.
 */
export function goToStep(store: LabStore, step: number): void {
  store.setValue(BUILD, step)
}

/**
 * "Hear it so far": play the built sound, from the render that carries the step the page is on.
 * Pressed while it sounds it stops, and pressed while it waits for that render it does not start.
 */
export function hearSoFar(store: LabStore, tap: string): void {
  if (tapState(store.getState(), tap) === 'idle') store.listen(tap, true)
  else store.stop()
}
