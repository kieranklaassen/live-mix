// What a lab says about itself, read once after it loads.

import { readString, type LabExports } from './wasm.ts'

export const TAP_KINDS = ['audio', 'control', 'curve', 'spectrum', 'frames'] as const
export type TapKind = (typeof TAP_KINDS)[number]

/** Where a stage comes from. The page shows this under every stage. */
export const ORIGINS = ['device', 'kit', 'lesson', 'source', 'engine', 'called'] as const
export type Origin = (typeof ORIGINS)[number]

export const ORIGIN_TEXT: Record<Origin, string> = {
  device: 'Read from the running device',
  kit: "Computed by the engine's kit",
  lesson: 'Written for this lesson',
  source: 'The sound going in',
  engine: "Made by the engine's own code",
  called: 'Computed by an engine function called on its own',
}

export interface ControlInfo {
  index: number
  id: string
  name: string
  unit: string
  min: number
  max: number
  initial: number
  scale: 'linear' | 'log'
  /** The names of a switch's positions; empty for a continuous control. */
  choices: string[]
}

export interface TapInfo {
  index: number
  id: string
  name: string
  unit: string
  kind: TapKind
  origin: Origin
  channels: 1 | 2
}

export interface CheckInfo {
  index: number
  id: string
  name: string
  unit: string
}

export interface LabDescription {
  sampleRate: number
  maxFrames: number
  controls: ControlInfo[]
  taps: TapInfo[]
  checks: CheckInfo[]
}

/** Every control at the value the lab starts it at, by id. */
export function initialValues(description: LabDescription): Record<string, number> {
  return Object.fromEntries(description.controls.map((control) => [control.id, control.initial]))
}

function enumAt<T extends string>(names: readonly T[], value: number, what: string): T {
  const name = names[value]
  if (name === undefined)
    throw new Error(`The lab names a ${what} this page does not know: ${value}`)
  return name
}

export function describeLab(lab: LabExports): LabDescription {
  const text = (pointer: number) => readString(lab.memory, pointer)
  const controls: ControlInfo[] = []
  for (let i = 0; i < lab.lab_control_count(); i += 1) {
    const choices = text(lab.lab_control_choices(i))
    controls.push({
      index: i,
      id: text(lab.lab_control_id(i)),
      name: text(lab.lab_control_name(i)),
      unit: text(lab.lab_control_unit(i)),
      min: lab.lab_control_min(i),
      max: lab.lab_control_max(i),
      initial: lab.lab_control_default(i),
      scale: lab.lab_control_scale(i) === 1 ? 'log' : 'linear',
      choices: choices ? choices.split('|') : [],
    })
  }
  const taps: TapInfo[] = []
  for (let i = 0; i < lab.lab_tap_count(); i += 1) {
    taps.push({
      index: i,
      id: text(lab.lab_tap_id(i)),
      name: text(lab.lab_tap_name(i)),
      unit: text(lab.lab_tap_unit(i)),
      kind: enumAt(TAP_KINDS, lab.lab_tap_kind(i), 'kind of tap'),
      origin: enumAt(ORIGINS, lab.lab_tap_origin(i), 'origin'),
      channels: lab.lab_tap_channels(i) === 2 ? 2 : 1,
    })
  }
  const checks: CheckInfo[] = []
  for (let i = 0; i < lab.lab_check_count(); i += 1) {
    checks.push({
      index: i,
      id: text(lab.lab_check_id(i)),
      name: text(lab.lab_check_name(i)),
      unit: text(lab.lab_check_unit(i)),
    })
  }
  return {
    sampleRate: lab.lab_sample_rate(),
    maxFrames: lab.lab_max_frames(),
    controls,
    taps,
    checks,
  }
}
