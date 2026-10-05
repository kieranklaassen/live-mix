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
let watching = false

function onClick(event: MouseEvent): void {
  // The browser's own count: 1 starts a run, and every press after it in the run counts on.
  if (event.detail === 1) first = event.composedPath()
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

/** Forgets the press kept. For tests. */
export function forgetPresses(): void {
  first = null
}
