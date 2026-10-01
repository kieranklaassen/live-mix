// Keeping a score document in step with what happens inside a plug-in. A
// knob in the application writes the document and the renderer sets the
// plug-in; a knob in the plug-in's own editor goes the other way round, and
// nothing would record it. `followNativeEdits` listens to every hosted
// plug-in the renderer has made and writes each change that came from the
// plug-in into the document, so it is saved and can be undone like any other.
//
// A plug-in also holds things no parameter shows: the sample it loaded, the
// program it is on, a curve drawn in its window. That is its state, an opaque
// chunk only the plug-in can read, and the document keeps the latest one
// beside the parameters (`ScoreDevice.state`). It is read when a plug-in
// first appears, after each change that came from the plug-in, when the
// plug-in says its state changed, when its window closes and every few
// seconds while the window is open. Keeping it is not an edit of the user's:
// it goes into the document without an undo step.

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
  /** Keep each plug-in's state in the document as well (default true). */
  state?: boolean
  /**
   * How long after the last sign of a change the state is read: a drag in the
   * plug-in's window is many changes and one read (default 500 ms).
   */
  stateDelayMs?: number
  /**
   * How often the state of a plug-in whose window is open is read, for
   * plug-ins that never say their state changed (default 5000 ms; 0 never).
   */
  statePollMs?: number
  /** Called when a plug-in's state could not be read or kept. Default: ignore. */
  onStateError?: (error: unknown) => void
}

export const DEFAULT_EDIT_GESTURE_GAP_MS = 800
export const DEFAULT_STATE_DELAY_MS = 500
export const DEFAULT_STATE_POLL_MS = 5000

/** The hosted plug-ins `renderer` has rendered from `document`, by their score instance ids. */
function renderedNativeDevices(
  document: ScoreDocument,
  renderer: ScoreRenderer,
): Map<string, NativeDevice> {
  const out = new Map<string, NativeDevice>()
  for (const { device: spec } of allDevices(document.score)) {
    let device
    try {
      device = renderer.device(spec.id)
    } catch {
      // Declared but not rendered yet: the next change brings it.
      continue
    }
    if (device instanceof NativeDevice) out.set(spec.id, device)
  }
  return out
}

/**
 * Read one plug-in's state and keep it in the document, when the document
 * does not hold exactly that already. Not an undo step. Resolves true when
 * the document changed.
 */
async function keepState(
  document: ScoreDocument,
  renderer: ScoreRenderer,
  device: NativeDevice,
): Promise<boolean> {
  // A plug-in whose host has gone has nothing to say; what the document holds stays.
  if (device.status === 'stopped') return false
  const held = (): { id: string; state: string | undefined } | undefined => {
    const id = renderer.deviceIdFor(device)
    const spec = id === undefined ? undefined : findDevice(document.score, id)?.device
    return id === undefined || !spec ? undefined : { id, state: spec.state }
  }
  const before = held()
  if (!before) return false
  const state = await device.getState()
  // Where the device is now: it may have left the document while the host
  // answered, or been given another state (an undo, a state someone set), and
  // then what was read is the older of the two.
  const now = held()
  if (now?.id !== before.id || now.state !== before.state || now.state === state) return false
  const id = now.id
  document.apply({ type: 'device.setState', device: id, state }, { history: false })
  return true
}

/**
 * Read the state of every hosted plug-in `renderer` has rendered from
 * `document` now and keep it in the document: what to call before the
 * document is saved, exported or closed, so it holds each plug-in as it is at
 * that moment. Resolves to how many states changed. A plug-in that cannot be
 * read keeps the state the document has; `onError` is told.
 */
export async function captureNativeState(
  document: ScoreDocument,
  renderer: ScoreRenderer,
  options: { onError?: (error: unknown) => void } = {},
): Promise<number> {
  await renderer.whenIdle()
  const devices = [...new Set(renderedNativeDevices(document, renderer).values())]
  const kept = await Promise.all(
    devices.map((device) =>
      keepState(document, renderer, device).catch((error: unknown) => {
        options.onError?.(error)
        return false
      }),
    ),
  )
  return kept.filter(Boolean).length
}

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
  const keepsState = options.state !== false
  const stateDelay = Math.max(0, options.stateDelayMs ?? DEFAULT_STATE_DELAY_MS)
  const statePoll = Math.max(0, options.statePollMs ?? DEFAULT_STATE_POLL_MS)
  const followed = new Map<NativeDevice, () => void>()
  const gestures = new Map<string, { id: string; at: number }>()
  const reads = new Map<NativeDevice, ReturnType<typeof setTimeout>>()
  let poll: ReturnType<typeof setInterval> | null = null
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

  /** Read `device`'s state once things have been quiet for `delayMs`. */
  const readSoon = (device: NativeDevice, delayMs = stateDelay): void => {
    if (!keepsState || stopped || !followed.has(device)) return
    clearTimeout(reads.get(device))
    reads.set(
      device,
      setTimeout(() => {
        reads.delete(device)
        if (stopped || !followed.has(device)) return
        keepState(document, renderer, device).catch((error: unknown) =>
          options.onStateError?.(error),
        )
      }, delayMs),
    )
  }

  const follow = (device: NativeDevice, hasState: boolean): void => {
    const offEdit = device.onEdit(({ name, value }) => {
      write(device, name, value)
      readSoon(device)
    })
    const offState = device.onStateChange(() => readSoon(device))
    followed.set(device, () => {
      offEdit()
      offState()
      clearTimeout(reads.get(device))
      reads.delete(device)
    })
    // A plug-in the document has no state for yet: the one it starts on.
    if (!hasState) readSoon(device, 0)
  }

  const sync = async (): Promise<void> => {
    await renderer.whenIdle()
    if (stopped) return
    const present = new Set<NativeDevice>()
    for (const [id, device] of renderedNativeDevices(document, renderer)) {
      present.add(device)
      if (followed.has(device)) continue
      follow(device, findDevice(document.score, id)?.device.state !== undefined)
    }
    for (const [device, off] of followed) {
      if (present.has(device)) continue
      off()
      followed.delete(device)
    }
  }

  if (keepsState && statePoll > 0) {
    poll = setInterval(() => {
      for (const device of followed.keys()) {
        if (device.editorOpen && !reads.has(device)) readSoon(device, 0)
      }
    }, statePoll)
  }

  const stopListening = document.onChange(() => void sync())
  void sync()

  return () => {
    stopped = true
    stopListening()
    if (poll !== null) clearInterval(poll)
    for (const off of followed.values()) off()
    followed.clear()
    gestures.clear()
  }
}
