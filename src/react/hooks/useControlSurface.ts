// MIDI/OSC learn for panels (U36): the mapping table and learn state of a
// `ControlSurface` over its `onChange`, with the edit and learn operations
// bound. `useLearn` is the per-row shape — one target, its binding, a Learn
// button that turns into Cancel while armed — that ambient-live's map panel
// renders. Nothing here touches Web MIDI or a socket; the app opens the
// inputs and `surface.connect`s them.

import { useCallback, useMemo } from 'react'

import {
  type BeginLearnOptions,
  type ControlSurface,
  type ControlSurfaceChange,
} from '../../core/control/ControlSurface'
import { type ControlEvent } from '../../core/control/event'
import { type Mapping, type MappingInit, type MappingTable } from '../../core/control/mapping'
import { describeSource, type ControlSource } from '../../core/control/source'
import { sameTarget, type ControlTarget } from '../../core/control/target'
import { useExternalSnapshot } from '../store'

export interface UseControlSurfaceOptions {
  /** Re-render on every incoming event and expose it as `lastEvent` (activity indicators). Default off. */
  events?: boolean
}

export interface ControlSurfaceSnapshot {
  mappings: MappingTable
  /** The target armed for learn, or null. */
  learning: ControlTarget | null
  /** The most recent event, when `events` is on; otherwise null. */
  lastEvent: ControlEvent | null
}

export interface ControlSurfaceControls {
  /** Arm a target: the next position or press binds it. */
  beginLearn(target: ControlTarget, options?: BeginLearnOptions): void
  cancelLearn(): void
  map(mapping: MappingInit): Mapping
  unmap(target: ControlTarget): void
  unmapSource(source: ControlSource): void
  /** Change a mapping's options (mode, curve, ranges, pickup, encoding, step). */
  update(target: ControlTarget, changes: Partial<Omit<Mapping, 'target'>>): void
  replace(table: MappingTable): void
  clear(): void
  mappingFor(target: ControlTarget): Mapping | undefined
  /** Write a normalised value to a target as a controller would (overrides its lane). */
  set(target: ControlTarget, unit: number): boolean
  /** Hand a target back to its automation lane. */
  release(target: ControlTarget): void
  releaseAll(): void
  serialize(): string
  load(input: unknown): MappingTable
}

export type UseControlSurfaceResult = ControlSurfaceSnapshot &
  ControlSurfaceControls & { surface: ControlSurface }

function isStateChange(change: ControlSurfaceChange): boolean {
  return change.type === 'table' || change.type === 'learn'
}

/** The mapping table and learn state of a surface, with its operations bound. */
export function useControlSurface(
  surface: ControlSurface,
  options: UseControlSurfaceOptions = {},
): UseControlSurfaceResult {
  const events = options.events ?? false
  const subscribe = useCallback(
    (onChange: () => void) =>
      surface.onChange((change) => {
        if (events ? change.type !== 'applied' : isStateChange(change)) onChange()
      }),
    [surface, events],
  )
  const read = useCallback(
    (): ControlSurfaceSnapshot => ({
      mappings: surface.table,
      learning: surface.learning,
      lastEvent: events ? surface.lastEvent : null,
    }),
    [surface, events],
  )
  const snapshot = useExternalSnapshot(subscribe, read)

  const controls = useMemo<ControlSurfaceControls>(
    () => ({
      beginLearn: (target, learnOptions) => surface.beginLearn(target, learnOptions),
      cancelLearn: () => surface.cancelLearn(),
      map: (mapping) => surface.map(mapping),
      unmap: (target) => surface.unmap(target),
      unmapSource: (source) => surface.unmapSource(source),
      update: (target, changes) => surface.update(target, changes),
      replace: (table) => surface.replace(table),
      clear: () => surface.clear(),
      mappingFor: (target) => surface.mappingFor(target),
      set: (target, unit) => surface.set(target, unit),
      release: (target) => surface.release(target),
      releaseAll: () => surface.releaseAll(),
      serialize: () => surface.serialize(),
      load: (input) => surface.load(input),
    }),
    [surface],
  )

  return { surface, ...snapshot, ...controls }
}

export interface UseLearnResult {
  target: ControlTarget
  /** True while this target is armed. */
  armed: boolean
  /** True while another target is armed (one learn at a time). */
  busy: boolean
  mapping: Mapping | undefined
  /** `describeSource` of the binding, e.g. `CC 74 · ch 1`, or null when unbound. */
  label: string | null
  begin(options?: BeginLearnOptions): void
  cancel(): void
  /** Arm when idle, cancel when this target is armed. */
  toggle(options?: BeginLearnOptions): void
  unmap(): void
}

interface LearnSnapshot {
  armed: boolean
  busy: boolean
  mapping: Mapping | undefined
}

/** One target's binding and learn button state. */
export function useLearn(surface: ControlSurface, target: ControlTarget): UseLearnResult {
  const subscribe = useCallback(
    (onChange: () => void) =>
      surface.onChange((change) => {
        if (isStateChange(change)) onChange()
      }),
    [surface],
  )
  const read = useCallback((): LearnSnapshot => {
    const learning = surface.learning
    const armed = learning !== null && sameTarget(learning, target)
    return { armed, busy: learning !== null && !armed, mapping: surface.mappingFor(target) }
  }, [surface, target])
  const snapshot = useExternalSnapshot(subscribe, read)

  const begin = useCallback(
    (options?: BeginLearnOptions) => surface.beginLearn(target, options),
    [surface, target],
  )
  const cancel = useCallback(() => surface.cancelLearn(), [surface])
  const toggle = useCallback(
    (options?: BeginLearnOptions) => {
      const learning = surface.learning
      if (learning !== null && sameTarget(learning, target)) surface.cancelLearn()
      else surface.beginLearn(target, options)
    },
    [surface, target],
  )
  const unmap = useCallback(() => surface.unmap(target), [surface, target])

  return {
    target,
    armed: snapshot.armed,
    busy: snapshot.busy,
    mapping: snapshot.mapping,
    label: snapshot.mapping ? describeSource(snapshot.mapping.source) : null,
    begin,
    cancel,
    toggle,
    unmap,
  }
}
