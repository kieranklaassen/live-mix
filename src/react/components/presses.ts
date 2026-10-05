/**
 * What the first press of a run of presses was on.
 *
 * The browser counts a double click by where the pointer is, not by what is
 * under it, and sends the second click and the `dblclick` to whatever stands
 * there by then. A cell that moves out from under the pointer when it is
 * pressed (a plate that folds open, a device taken out of a chain) leaves
 * something else there, and the second press would be an act on that: a knob
 * put back on its default, a second device taken out. A double click is one
 * act on what its first press was on.
 */

/** What the first press went through, from its target out: its target may be drawn anew before the next press. */
let first: readonly EventTarget[] | null = null
/** The press before the one that is down now: what it went through, and when and where it ended. */
let last: { path: readonly EventTarget[]; at: number; x: number; y: number } | null = null
let watching = false

/** How long after a press the next one at the same place is taken for its second, in milliseconds: what most systems count a double click by. */
const SECOND_PRESS_MS = 500
/** How far from a press the next one may be and still be at the same place, in pixels. */
const SECOND_PRESS_PX = 4

function onClick(event: MouseEvent): void {
  // The browser's own count: 1 starts a run, and every press after it in the run counts on.
  if (event.detail === 1) first = event.composedPath()
  // A click the keys or a script made (0) is no press of the pointer.
  if (event.detail >= 1) {
    last = { path: event.composedPath(), at: event.timeStamp, x: event.clientX, y: event.clientY }
  }
}

/** Starts keeping the first press. Safe to call from every control that asks about it; the page gets one listener. */
export function watchPresses(): void {
  if (watching || typeof document === 'undefined') return
  watching = true
  // In the capture phase: before the press does what it does, and whoever keeps the click to itself.
  document.addEventListener('click', onClick, true)
}

/**
 * Whether `event` (a click the browser counts as a second or later press, or
 * a `dblclick`) belongs to a run of presses that began on something outside
 * `element`. False for an event the browser did not count so (a click a
 * script or the keys made), and when no first press was seen.
 */
export function firstPressWasElsewhere(element: Element, event: { detail: number }): boolean {
  if (!(event.detail >= 2) || first === null) return false
  return !first.includes(element)
}

/**
 * Whether the press that goes down with `event` (a `pointerdown`) is the
 * second of a double click that began on something outside `element`: it
 * comes at once after a press there, at the same place. The browser has not
 * counted the press yet when it goes down, so this counts as most systems do.
 * A control that acts on a single press asks, and leaves such a press alone.
 */
export function pressFollowsOneElsewhere(
  element: Element,
  event: { timeStamp: number; clientX: number; clientY: number },
): boolean {
  if (last === null || last.path.includes(element)) return false
  const since = event.timeStamp - last.at
  if (since < 0 || since > SECOND_PRESS_MS) return false
  return (
    Math.abs(event.clientX - last.x) <= SECOND_PRESS_PX &&
    Math.abs(event.clientY - last.y) <= SECOND_PRESS_PX
  )
}

/** Forgets the presses kept. For tests. */
export function forgetPresses(): void {
  first = null
  last = null
}
