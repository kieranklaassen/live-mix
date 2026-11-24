// The makers the library has, in the order a list shows them, and the small
// sums over a patch's maker that everything else asks for.

import { clampParam } from '../params'
import { type PatchMaker } from '../devices/patch'
import { presetParams, resolvePreset } from '../devices/presets'
import { BREATH_BUDGET } from './breath-budget'
import { COMPANION_VOICE } from './companion-voice'
import { HEXATONIC_WALKER } from './hexatonic-walker'
import { MIRROR_ON_D } from './mirror-on-d'
import { SIX_VOICES } from './six-voices'
import { type NoteMakerDescriptor } from './types'

/** Every note maker, in menu order. */
export const NOTE_MAKERS: readonly NoteMakerDescriptor[] = [
  SIX_VOICES,
  MIRROR_ON_D,
  COMPANION_VOICE,
  BREATH_BUDGET,
]
export const NOTE_MAKERS: readonly NoteMakerDescriptor[] = [MIRROR_ON_D, HEXATONIC_WALKER]
import { RULE_OF_THE_OCTAVE } from './rule-of-the-octave'
import { type NoteMakerDescriptor } from './types'

/** Every note maker, in menu order. */
export const NOTE_MAKERS: readonly NoteMakerDescriptor[] = [MIRROR_ON_D, RULE_OF_THE_OCTAVE]

const byId = new Map(NOTE_MAKERS.map((maker) => [maker.id, maker]))
for (const maker of NOTE_MAKERS) {
  for (const former of maker.formerIds ?? []) if (!byId.has(former)) byId.set(former, maker)
}

/** The maker with this id, or with one it had before. */
export function describeMaker(makerId: string): NoteMakerDescriptor | undefined {
  return byId.get(makerId)
}

/** Every parameter of a patch's maker: the defaults, its preset over them, its own values over that. */
export function makerParams(
  descriptor: NoteMakerDescriptor,
  maker: Pick<PatchMaker, 'preset' | 'params'>,
): Record<string, number> {
  const base =
    maker.preset === undefined
      ? {}
      : presetParams(descriptor, resolvePreset(descriptor, maker.preset))
  return presetParams(descriptor, {
    name: maker.preset ?? '',
    deviceId: descriptor.id,
    deviceVersion: descriptor.version,
    params: { ...base, ...maker.params },
  })
}

/**
 * A maker whose times last `ratio` times as long, for a sound that keeps time
 * at another tempo. A time past the end of its control is taken by halves or
 * doubles back inside, so it stays on the beat.
 */
export function makerAtTempo(maker: PatchMaker, ratio: number): PatchMaker {
  const descriptor = describeMaker(maker.makerId)
  if (!descriptor?.timed || ratio === 1 || !Number.isFinite(ratio) || !(ratio > 0)) return maker
  const current = makerParams(descriptor, maker)
  const params: Record<string, number> = { ...maker.params }
  for (const [name, kind] of Object.entries(descriptor.timed)) {
    const spec = descriptor.params[name]
    if (!spec || current[name] === 0) continue
    let moved = kind === 'time' ? current[name] * ratio : current[name] / ratio
    while (moved > spec.max) moved /= 2
    if (spec.max >= 2 * spec.min && spec.min > 0) while (moved < spec.min) moved *= 2
    params[name] = clampParam(spec, moved)
  }
  return { ...maker, params }
}
