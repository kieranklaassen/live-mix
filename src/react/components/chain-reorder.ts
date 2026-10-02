// Reordering a chain by hand, the way a rack is rearranged: a device is taken
// by its title bar (or the grip at its left) and carried along the chain. Its
// name rides the title row under the pointer, its panel stays dimmed where it
// was, and a marker stands in the gap it would land in; letting go puts it
// there, Escape leaves it. The chain scrolls when the pointer nears an end of
// what shows of it.
//
// Nothing of the layout moves during a carry, so where the device lands is
// read from where the devices stood when it was taken. The name is moved with
// a transform written straight to its element: a pointer move re-renders the
// chain only when the landing place changes.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

/** A press that moves less than this is not a drag. */
export const REORDER_SLOP_PX = 4
/** How far left of the pointer the carried name starts. */
const LABEL_LEAD_PX = 10
/** How near an end of the scrolling view the pointer has to be for the chain to scroll. */
const SCROLL_EDGE_PX = 36
/** The most the chain scrolls in one frame, with the pointer at the very end. */
const SCROLL_STEP_PX = 14

/** What a device is taken by; anything else in its panel is a control of its own. */
const GRIP = '[data-lm-drag-handle], .lm-chain__handle, .lm-device__header'
/** Controls in a title bar: a press on one is that control's. */
const CONTROL =
  'button, select, input, textarea, a, label, [role="slider"], [role="switch"], [contenteditable="true"]'

/** Where one device of the chain stands, along the chain. */
export interface ItemSpan {
  left: number
  right: number
}

/**
 * The place the device at `from` has once it is let go with the pointer at
 * `x`: it goes past a neighbour when the pointer is past that neighbour's
 * middle. The answer is an index into the chain as it will be, which is what
 * `reorderInserts` and `device.move` take.
 */
export function landingIndex(spans: readonly ItemSpan[], from: number, x: number): number {
  let to = 0
  for (const [index, span] of spans.entries()) {
    if (index !== from && (span.left + span.right) / 2 < x) to += 1
  }
  return to
}

/**
 * Where the marker stands for a landing place: in the middle of the gap
 * between the two devices the carried one would sit between, or at the end of
 * the chain it would head. Null where the device would stay where it is.
 */
export function markerPosition(
  spans: readonly ItemSpan[],
  from: number,
  to: number,
): number | null {
  if (to === from) return null
  const others = spans.filter((_, index) => index !== from)
  const before = others[to - 1]
  const after = others[to]
  if (before && after) return (before.right + after.left) / 2
  return before ? before.right : (after?.left ?? null)
}

/** How far the chain scrolls this frame with the pointer at `x` in a view from `left` to `right`. */
export function edgeScroll(x: number, left: number, right: number): number {
  const edge = Math.min(SCROLL_EDGE_PX, (right - left) / 2)
  if (edge <= 0) return 0
  if (x < left + edge) return -Math.ceil(SCROLL_STEP_PX * Math.min(1, (left + edge - x) / edge))
  if (x > right - edge) return Math.ceil(SCROLL_STEP_PX * Math.min(1, (x - (right - edge)) / edge))
  return 0
}

/** The nearest element, from the chain outwards, that scrolls sideways. */
function scrollerOf(chain: HTMLElement): HTMLElement | null {
  for (let element: HTMLElement | null = chain; element; element = element.parentElement) {
    if (element.scrollWidth <= element.clientWidth) continue
    const overflow = getComputedStyle(element).overflowX
    if (overflow === 'auto' || overflow === 'scroll') return element
  }
  return null
}

interface Carry {
  pointerId: number
  /** The carried device, counted among the devices shown. */
  from: number
  item: HTMLElement
  startX: number
  /** The pointer's last place. */
  x: number
  /** Null until the press has moved far enough to be a drag. */
  lifted: {
    /** Every shown device as it stood when this one was taken, in the scroller's content. */
    spans: ItemSpan[]
    scroller: HTMLElement | null
    /** The chain's own left edge, in the same content. */
    chainLeft: number
    /** Where the carried name stands, in px from the chain's left edge. */
    labelLeft: number
    to: number
    frame: number | null
  } | null
}

export interface ChainReorder {
  /** Goes on the chain's element: the devices are found in it. */
  chainRef: (element: HTMLElement | null) => void
  /** The press that may become a drag, for the device at this place among those shown. */
  onPointerDown: (shown: number) => (event: ReactPointerEvent<HTMLElement>) => void
  /** The device being carried, among those shown; null when none is. */
  carried: number | null
  /** The carried device's name, as its title bar gives it. */
  label: string
  /** Goes on the element that shows the name: the carry moves it along the chain. */
  labelRef: (element: HTMLElement | null) => void
  /** Where the marker stands, in px from the chain's left edge; null when the device would stay put. */
  marker: number | null
}

/**
 * Carrying a device of a chain to another place in it. `onMove` is told once,
 * when the device is let go somewhere else: both places count among the
 * devices shown.
 */
export function useChainReorder(onMove: (from: number, to: number) => void): ChainReorder {
  const chain = useRef<HTMLElement | null>(null)
  const carry = useRef<Carry | null>(null)
  const move = useRef(onMove)
  move.current = onMove
  const label = useRef<HTMLElement | null>(null)
  const [carried, setCarried] = useState<{ index: number; label: string } | null>(null)
  const [marker, setMarker] = useState<number | null>(null)
  // The listeners a carry holds on the window, taken down when it ends.
  const release = useRef<(() => void) | null>(null)

  const end = useCallback((land: boolean) => {
    const current = carry.current
    carry.current = null
    release.current?.()
    release.current = null
    if (!current) return
    const { lifted, item, from } = current
    if (!lifted) return
    if (lifted.frame !== null) cancelAnimationFrame(lifted.frame)
    try {
      if (item.hasPointerCapture(current.pointerId)) item.releasePointerCapture(current.pointerId)
    } catch {
      // No capture was held for this pointer.
    }
    setCarried(null)
    setMarker(null)
    if (land && lifted.to !== from) move.current(from, lifted.to)
  }, [])

  // A chain taken off the page mid-carry lets go of the window.
  useEffect(() => () => end(false), [end])

  /** Puts the carried name under the pointer and the marker where the device would land. */
  const follow = useCallback(() => {
    const current = carry.current
    const lifted = current?.lifted
    if (!current || !lifted) return
    // Read each time: the chain scrolling under a still pointer moves what the pointer is over.
    const scroll = lifted.scroller?.scrollLeft ?? 0
    lifted.labelLeft = Math.max(0, current.x + scroll - lifted.chainLeft - LABEL_LEAD_PX)
    if (label.current) label.current.style.transform = `translateX(${lifted.labelLeft}px)`
    const to = landingIndex(lifted.spans, current.from, current.x + scroll)
    if (to === lifted.to) return
    lifted.to = to
    const at = markerPosition(lifted.spans, current.from, to)
    setMarker(at === null ? null : at - lifted.chainLeft)
  }, [])

  const lift = useCallback(
    (current: Carry) => {
      const element = chain.current
      if (!element) return false
      const items = [...element.querySelectorAll<HTMLElement>(':scope > .lm-chain__item')]
      if (items[current.from] !== current.item) return false
      const scroller = scrollerOf(element)
      const scroll = scroller?.scrollLeft ?? 0
      current.lifted = {
        spans: items.map((item) => {
          const bounds = item.getBoundingClientRect()
          return { left: bounds.left + scroll, right: bounds.right + scroll }
        }),
        scroller,
        // The marker is placed inside the chain's border, and scrolls with what the chain scrolls.
        chainLeft:
          element.getBoundingClientRect().left + element.clientLeft + scroll - element.scrollLeft,
        labelLeft: 0,
        to: current.from,
        frame: null,
      }
      try {
        current.item.setPointerCapture(current.pointerId)
      } catch {
        // No capture for this pointer: the window still hears its moves.
      }
      setCarried({
        index: current.from,
        label: current.item.querySelector('.lm-device__title')?.textContent ?? '',
      })
      const tick = () => {
        const lifted = carry.current?.lifted
        if (!carry.current || !lifted) return
        if (lifted.scroller) {
          const view = lifted.scroller.getBoundingClientRect()
          const step = edgeScroll(carry.current.x, view.left, view.right)
          if (step !== 0) {
            const before = lifted.scroller.scrollLeft
            lifted.scroller.scrollLeft = before + step
            if (lifted.scroller.scrollLeft !== before) follow()
          }
        }
        lifted.frame = requestAnimationFrame(tick)
      }
      if (typeof requestAnimationFrame === 'function')
        current.lifted.frame = requestAnimationFrame(tick)
      return true
    },
    [follow],
  )

  const onPointerDown = useCallback(
    (shown: number) => (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0 || carry.current) return
      const item = event.currentTarget
      const target = event.target as Element | null
      const grip = target?.closest(GRIP)
      if (!grip || !item.contains(grip) || target?.closest(CONTROL)) return
      const current: Carry = {
        pointerId: event.pointerId,
        from: shown,
        item,
        startX: event.clientX,
        x: event.clientX,
        lifted: null,
      }
      carry.current = current

      const onPointerMove = (moved: PointerEvent) => {
        if (moved.pointerId !== current.pointerId || carry.current !== current) return
        current.x = moved.clientX
        if (!current.lifted) {
          if (Math.abs(moved.clientX - current.startX) < REORDER_SLOP_PX) return
          if (!lift(current)) {
            end(false)
            return
          }
        }
        follow()
      }
      const onPointerUp = (up: PointerEvent) => {
        if (up.pointerId === current.pointerId) end(up.type === 'pointerup')
      }
      const onKeyDown = (key: KeyboardEvent) => {
        if (key.key !== 'Escape' || !current.lifted) return
        // The key is the carry's: nothing behind it closes or lets go of anything.
        key.preventDefault()
        key.stopPropagation()
        end(false)
      }
      const onBlur = () => end(false)
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerUp)
      window.addEventListener('keydown', onKeyDown, true)
      window.addEventListener('blur', onBlur)
      release.current = () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
        window.removeEventListener('pointercancel', onPointerUp)
        window.removeEventListener('keydown', onKeyDown, true)
        window.removeEventListener('blur', onBlur)
      }
    },
    [end, follow, lift],
  )

  const chainRef = useCallback((element: HTMLElement | null) => {
    chain.current = element
  }, [])
  // The name is drawn a render after the device is taken: it starts where the pointer already is.
  const labelRef = useCallback((element: HTMLElement | null) => {
    label.current = element
    const lifted = carry.current?.lifted
    if (element && lifted) element.style.transform = `translateX(${lifted.labelLeft}px)`
  }, [])

  return {
    chainRef,
    onPointerDown,
    carried: carried?.index ?? null,
    label: carried?.label ?? '',
    labelRef,
    marker,
  }
}
