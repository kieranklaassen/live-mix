// Keeping a score document in step with what happens inside a plug-in. A
// knob in the application writes the document and the renderer sets the
// plug-in; a knob in the plug-in's own editor goes the other way round, and
// nothing would record it. `followNativeEdits` listens to every hosted
// plug-in the renderer has made and writes each change that came from the
// plug-in into the document, so it is saved and can be undone like any other.

import { type ScoreDocument } from '../score/ScoreDocument'
import { type ScoreRenderer } from '../score/ScoreRenderer'
import { allDevices, findDevice } from '../score/schema'
import { NativeDevice } from './NativeDevice'

export interface FollowNativeEditsOptions {
  /**
   * Changes to one parameter closer together than this are one drag, and one
   * undo step (default 800 ms).
   */
  gestureGapMs?: number
  /** Milliseconds; defaults to `Date.now`. */
  now?: () => number
  /** The undo step's label, given the plug-in's and the parameter's name. */
  label?: (deviceName: string, paramName: string) => string
}

export const DEFAULT_EDIT_GESTURE_GAP_MS = 800

/**
 * Write the changes hosted plug-ins make to themselves into `document`.
 * Follows the devices `renderer` has rendered from it, through every later
 * render. Returns the function that stops it.
 */
export function followNativeEdits(
  document: ScoreDocument,
  renderer: ScoreRenderer,
  options: FollowNativeEditsOptions = {},
): () => void {
  const gap = options.gestureGapMs ?? DEFAULT_EDIT_GESTURE_GAP_MS
  const now = options.now ?? (() => Date.now())
  const followed = new Map<NativeDevice, () => void>()
  const gestures = new Map<string, { id: string; at: number }>()
  let counter = 0
  let stopped = false

  const write = (device: NativeDevice, param: string, value: number): void => {
    const id = renderer.deviceIdFor(device)
    // Taken out of the document since; the next sync stops listening to it.
    if (id === undefined || !findDevice(document.score, id)) return
    const key = `${id}:${param}`
    const at = now()
    let gesture = gestures.get(key)
    if (!gesture || at - gesture.at > gap) {
      counter += 1
      gesture = { id: `plugin-edit:${key}:${counter}`, at }
      gestures.set(key, gesture)
    }
    gesture.at = at
    const name = device.params[param]?.name ?? param
    try {
      document.apply(
        { type: 'device.setParam', device: id, param, value },
        { gesture: gesture.id, label: options.label?.(device.slot.name, name) },
      )
    } catch {
      // The document refused the write (a lane owns the parameter, say): the
      // plug-in keeps its value, the document its own.
    }
  }

  const sync = async (): Promise<void> => {
    await renderer.whenIdle()
    if (stopped) return
    const present = new Set<NativeDevice>()
    for (const { device: spec } of allDevices(document.score)) {
      let device
      try {
        device = renderer.device(spec.id)
      } catch {
        // Declared but not rendered yet: the next change brings it.
        continue
      }
      if (!(device instanceof NativeDevice)) continue
      present.add(device)
      if (followed.has(device)) continue
      const hosted = device
      followed.set(
        hosted,
        hosted.onEdit(({ name, value }) => write(hosted, name, value)),
      )
    }
    for (const [device, off] of followed) {
      if (present.has(device)) continue
      off()
      followed.delete(device)
    }
  }

  const stopListening = document.onChange(() => void sync())
  void sync()

  return () => {
    stopped = true
    stopListening()
    for (const off of followed.values()) off()
    followed.clear()
    gestures.clear()
  }
}
