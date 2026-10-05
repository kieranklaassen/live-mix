// Reordering a chain by hand, the way a rack is rearranged: a device is taken
// by its title bar (or the grip at its left) and carried along the chain. Its
// name rides the title row under the pointer, its panel stays dimmed where it
// was, and a marker stands in the gap it would land in; letting go puts it
// there, Escape leaves it. The chain scrolls when the pointer nears an end of
// what shows of it, and never past the ends it had when the device was taken:
// not back past the chain's own start where its scroller holds more before it.
// An end the device was taken at scrolls once the pointer has gone on toward
// it, or has left it and come back.
//
// Nothing of the layout moves during a carry, so where the device lands is
// read from where the devices stood when it was taken. The name is moved with
// a transform written straight to its element: a pointer move re-renders the
// chain only when the landing place changes.
//
// What a host carries in from outside the chain (a device dragged from its
// browser) lands in a gap the same way: `chainDropIndex` says which one the
// pointer is over, and the chain stands the same marker there.

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
/** Half the marker's width, bars included: at an end of the chain it stands this far inside. */
const MARKER_HALF_PX = 4
/** How near an end of the scrolling view the pointer has to be for the chain to scroll. */
const SCROLL_EDGE_PX = 36
/** The most the chain scrolls in one frame, with the pointer at the very end. */
const SCROLL_STEP_PX = 14

/**
 * What a device is taken by: the grip, a panel's title bar, a plate anywhere
 * on its face. Anything else in a panel is a control of its own.
 */
const GRIP = '[data-lm-drag-handle], .lm-chain__handle, .lm-device__header, .lm-plate'
/** Controls in a title bar or on a plate: a press on one is that control's. */
const CONTROL =
  'button, select, input, textarea, a, label, .lm-knob, .lm-fader, [role="slider"], [role="switch"], [contenteditable="true"], [data-lm-handle]'
/** Where a device's name is read from: a panel's title, a plate's name tag (whose `title` is the full name). */
const NAME = '.lm-device__title, .lm-plate__name'

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

/**
 * What comes in from outside the chain is none of its devices: every one of
 * them is counted, and every one keeps its place.
 */
const FROM_OUTSIDE = -1

/**
 * The place among the devices at `spans` a pointer at `x` is over, for
 * something carried in from outside the chain: past a device's middle is
 * after it. 0 heads them, their number ends them.
 */
export function dropIndex(spans: readonly ItemSpan[], x: number): number {
  return landingIndex(spans, FROM_OUTSIDE, x)
}

/**
 * Where the marker stands for something that would land at `index` among the
 * devices at `spans`: in the middle of the gap it would open, at the first
 * device's left edge to head them, at the last one's right edge to end them.
 * A place past either end is that end. Null when there is no device.
 */
export function dropMarkerPosition(spans: readonly ItemSpan[], index: number): number | null {
  const to = Math.max(0, Math.min(Math.floor(index), spans.length))
  return markerPosition(spans, FROM_OUTSIDE, to)
}

/** How far the chain scrolls this frame with the pointer at `x` in a view from `left` to `right`. */
export function edgeScroll(x: number, left: number, right: number): number {
  const edge = Math.min(SCROLL_EDGE_PX, (right - left) / 2)
  if (edge <= 0) return 0
  if (x < left + edge) return -Math.ceil(SCROLL_STEP_PX * Math.min(1, (left + edge - x) / edge))
  if (x > right - edge) return Math.ceil(SCROLL_STEP_PX * Math.min(1, (x - (right - edge)) / edge))
  return 0
}

/**
 * How far back a carry may scroll, for a chain whose start stands at
 * `chainStart` of what its scroller holds, taken with the scroller at
 * `scroll`: to where the chain's start is at the view's edge. What a host puts
 * before the chain in the same scroller is none of the carry's, and a view
 * that already showed some of it when the device was taken shows no more.
 */
export function carryScrollMin(chainStart: number, scroll: number): number {
  return Math.min(scroll, Math.max(0, chainStart))
}

/** Which ends of the view a carry may scroll at: the near one, the far one. */
export interface ArmedEnds {
  near: boolean
  far: boolean
}

/**
 * The ends a carry may scroll at once the pointer is at `x`, with `step` what
 * `edgeScroll` asks there. A device taken at an end of the view is not asking
 * for more of the chain by that alone: an end scrolls once the pointer has
 * gone further toward it than where the device was taken (`startX`), or has
 * been clear of it.
 */
export function armedEnds(armed: ArmedEnds, step: number, x: number, startX: number): ArmedEnds {
  const near = armed.near || step >= 0 || x < startX
  const far = armed.far || step <= 0 || x > startX
  return near === armed.near && far === armed.far ? armed : { near, far }
}

/**
 * A marker place kept inside a chain `width` wide, so the marker shows whole
 * at either end and adds nothing to what the chain scrolls.
 */
export function markerInside(at: number, width: number): number {
  if (width <= 2 * MARKER_HALF_PX) return at
  return Math.max(MARKER_HALF_PX, Math.min(at, width - MARKER_HALF_PX))
}

/**
 * Where the carried name starts for a pointer at `x` along a chain `width`
 * wide: a little left of the pointer, and never out of either end. A name
 * past the end would widen what its scroller holds, and the scroller would
 * then follow it for as long as the pointer stayed at that end.
 */
export function labelPosition(x: number, width: number, labelWidth: number): number {
  const last = width > 0 ? Math.max(0, width - labelWidth) : Infinity
  return Math.max(0, Math.min(x - LABEL_LEAD_PX, last))
}

/**
 * The click a browser sends once the button that carried a device goes up is
 * the carry's: nothing under the pointer is pressed by it. `held` is a carry
 * left with the button still down, whose click follows when the button goes
 * up. What is returned stops waiting for that click.
 */
function swallowClick(held: boolean): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  const swallow = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }
  const stop = () => {
    window.removeEventListener('pointerup', arm, true)
    window.removeEventListener('pointerdown', stop, true)
    window.removeEventListener('click', swallow, true)
    if (timer !== null) clearTimeout(timer)
  }
  function arm() {
    window.removeEventListener('pointerup', arm, true)
    window.addEventListener('click', swallow, { capture: true, once: true })
    // That click comes with the button going up or not at all: a later one is not waited for.
    timer = setTimeout(stop, 0)
  }
  // A new press means the button went up where the window did not see it.
  window.addEventListener('pointerdown', stop, true)
  if (held) window.addEventListener('pointerup', arm, true)
  else arm()
  return stop
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

/** The devices a chain shows, in order: its marker and the carried name are not among them. */
function chainItems(chain: HTMLElement): HTMLElement[] {
  return [...chain.querySelectorAll<HTMLElement>(':scope > .lm-chain__item')]
}

/** Where each device a chain shows stands in the window. */
function windowSpans(chain: HTMLElement): ItemSpan[] {
  return chainItems(chain).map((item) => {
    const bounds = item.getBoundingClientRect()
    return { left: bounds.left, right: bounds.right }
  })
}

/**
 * The place among the devices a chain shows that a pointer at `clientX` is
 * over, for something carried in from outside: past a device's middle is
 * after it. `chain` is the chain's own element (`.lm-chain`).
 */
export function chainDropIndex(chain: HTMLElement, clientX: number): number {
  // The pointer and the devices are both read in the window: scrolling moves them together.
  return dropIndex(windowSpans(chain), clientX)
}

/**
 * Where a chain's marker stands for something that would land at `index`
 * among the devices it shows, in px from the chain's left edge: where a carry
 * inside the chain puts it for the same gap. Null when no device is shown.
 */
export function chainDropMarker(chain: HTMLElement, index: number): number | null {
  const at = dropMarkerPosition(windowSpans(chain), index)
  if (at === null) return null
  // The marker is placed inside the chain's border, and scrolls with what the chain scrolls.
  const chainLeft = chain.getBoundingClientRect().left + chain.clientLeft - chain.scrollLeft
  return markerInside(at - chainLeft, chain.scrollWidth)
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
    /** The devices shown when this one was taken, in order. */
    items: HTMLElement[]
    /** Every one of them as it stood then, in the scroller's content. */
    spans: ItemSpan[]
    scroller: HTMLElement | null
    /** How far the scroller went when the device was taken: the carry scrolls no further. */
    scrollMax: number
    /** How far back the carry scrolls: to the chain's start, or where the scroller stood if it showed more. */
    scrollMin: number
    /** The ends of the view the carry may scroll at by now. */
    armed: ArmedEnds
    /** The chain's own left edge, in the same content. */
    chainLeft: number
    /** How wide the chain's content was when the device was taken. */
    chainWidth: number
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
  // The wait for the click that follows the last carry, which outlives it by a moment.
  const unclick = useRef<(() => void) | null>(null)

  const end = useCallback((land: boolean, held = false) => {
    const current = carry.current
    carry.current = null
    release.current?.()
    release.current = null
    if (!current) return
    const { lifted, item, from } = current
    if (!lifted) return
    unclick.current?.()
    unclick.current = swallowClick(held)
    if (lifted.frame !== null) cancelAnimationFrame(lifted.frame)
    try {
      if (item.hasPointerCapture(current.pointerId)) item.releasePointerCapture(current.pointerId)
    } catch {
      // No capture was held for this pointer.
    }
    setCarried(null)
    setMarker(null)
    if (!land || lifted.to === from) return
    // Both places were read off the devices as they stood when this one was taken: a chain
    // that something else changed since would have another device moved, so nothing is.
    const stand = chain.current ? chainItems(chain.current) : []
    const same =
      stand.length === lifted.items.length &&
      stand.every((other, index) => other === lifted.items[index])
    if (same) move.current(from, lifted.to)
  }, [])

  // A chain taken off the page mid-carry lets go of the window.
  useEffect(
    () => () => {
      end(false)
      unclick.current?.()
    },
    [end],
  )

  /** Puts the carried name under a pointer at `x` in the scroller's content. */
  const placeLabel = useCallback((x: number) => {
    const lifted = carry.current?.lifted
    if (!lifted) return
    lifted.labelLeft = labelPosition(
      x - lifted.chainLeft,
      lifted.chainWidth,
      label.current?.offsetWidth ?? 0,
    )
    if (label.current) label.current.style.transform = `translateX(${lifted.labelLeft}px)`
  }, [])

  /** Puts the carried name under the pointer and the marker where the device would land. */
  const follow = useCallback(() => {
    const current = carry.current
    const lifted = current?.lifted
    if (!current || !lifted) return
    // Read each time: the chain scrolling under a still pointer moves what the pointer is over.
    const scroll = lifted.scroller?.scrollLeft ?? 0
    placeLabel(current.x + scroll)
    const to = landingIndex(lifted.spans, current.from, current.x + scroll)
    if (to === lifted.to) return
    lifted.to = to
    const at = markerPosition(lifted.spans, current.from, to)
    setMarker(at === null ? null : markerInside(at - lifted.chainLeft, lifted.chainWidth))
  }, [placeLabel])

  const lift = useCallback(
    (current: Carry) => {
      const element = chain.current
      if (!element) return false
      const items = chainItems(element)
      if (items[current.from] !== current.item) return false
      const scroller = scrollerOf(element)
      const scroll = scroller?.scrollLeft ?? 0
      // The marker is placed inside the chain's border, and scrolls with what the chain scrolls.
      const chainLeft =
        element.getBoundingClientRect().left + element.clientLeft + scroll - element.scrollLeft
      current.lifted = {
        items,
        spans: items.map((item) => {
          const bounds = item.getBoundingClientRect()
          return { left: bounds.left + scroll, right: bounds.right + scroll }
        }),
        scroller,
        scrollMax: scroller ? scroller.scrollWidth - scroller.clientWidth : 0,
        scrollMin: scroller
          ? carryScrollMin(
              chainLeft - scroller.getBoundingClientRect().left - scroller.clientLeft,
              scroll,
            )
          : 0,
        armed: { near: false, far: false },
        chainLeft,
        chainWidth: element.scrollWidth,
        labelLeft: 0,
        to: current.from,
        frame: null,
      }
      try {
        current.item.setPointerCapture(current.pointerId)
      } catch {
        // No capture for this pointer: the window still hears its moves.
      }
      const name = current.item.querySelector(NAME)
      setCarried({
        index: current.from,
        label: name?.getAttribute('title') ?? name?.textContent ?? '',
      })
      const tick = () => {
        const lifted = carry.current?.lifted
        if (!carry.current || !lifted) return
        if (lifted.scroller) {
          const view = lifted.scroller.getBoundingClientRect()
          const step = edgeScroll(carry.current.x, view.left, view.right)
          lifted.armed = armedEnds(lifted.armed, step, carry.current.x, carry.current.startX)
          if (step < 0 ? lifted.armed.near : step > 0 && lifted.armed.far) {
            const before = lifted.scroller.scrollLeft
            // Held inside both ends, and never moved the other way by an end it is already past.
            const to = Math.max(lifted.scrollMin, Math.min(before + step, lifted.scrollMax))
            if (step < 0 ? to < before : to > before) {
              lifted.scroller.scrollLeft = to
              if (lifted.scroller.scrollLeft !== before) follow()
            }
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
        end(false, true)
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
  const labelRef = useCallback(
    (element: HTMLElement | null) => {
      label.current = element
      const current = carry.current
      if (element && current?.lifted)
        placeLabel(current.x + (current.lifted.scroller?.scrollLeft ?? 0))
    },
    [placeLabel],
  )

  return {
    chainRef,
    onPointerDown,
    carried: carried?.index ?? null,
    label: carried?.label ?? '',
    labelRef,
    marker,
  }
}
