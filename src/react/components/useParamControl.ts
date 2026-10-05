// Shared pointer, wheel and keyboard interaction for knobs and faders, moved
// from ambient-live's `use-param-control.ts` (U25). Controlled (`value`) or
// uncontrolled (`defaultValue`); drags accumulate a normalised position so a
// fine (Shift) drag with sub-step travel still adds up; `onChange` fires only
// when the quantised value moves. `onChangeStart`/`onChangeEnd` bracket a
// gesture — pointer down to up, or a burst of keys / wheel notches — which
// is where a host overrides and releases an automation lane. A control of two
// places (off and on) is switched by a press as well: let go where it went
// down, the press is a gesture of one change, as a drag that ends there is.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react'

import {
  clamp,
  denormalizeValue,
  hasTwoPlaces,
  normalizeValue,
  pointerDeltaToNormDelta,
  quantize,
  stepBy,
  wheelDeltaToNormDelta,
  WHEEL_NOTCH,
  type ControlTaper,
} from './control-math'
import { firstPressWasElsewhere, pressFollowsOneElsewhere, watchPresses } from './presses'

export type ControlAxis = 'vertical' | 'horizontal' | 'both'

export interface ParamControlOptions {
  /** Controlled value; omit for an uncontrolled control seeded by `defaultValue`. */
  value?: number
  /** Initial value when uncontrolled, and what a double-click resets to unless `resetValue` is set. */
  defaultValue: number
  min: number
  max: number
  /** Quantisation step; 0 clamps only (keys then move 1 % of the travel). */
  step?: number
  /**
   * The value only takes whole steps (a list, a count, semitones): a key
   * moves it a step with Shift held too, where it would move a tenth of one.
   * With one step for all of its travel the control has two places, and a
   * press switches it, as Enter does with the keys on it; a double click is
   * then two presses and resets nothing.
   */
  wholeSteps?: boolean
  taper?: ControlTaper
  skew?: number
  disabled?: boolean
  /** Drag direction that increases the value. Default vertical (up = more). */
  axis?: ControlAxis
  /** Pixels of drag for the full travel (default 120; ×4 while Shift is held). */
  sensitivityPx?: number
  /** Handle the mouse wheel over the control (default true). */
  wheel?: boolean
  /** What a double-click sets; defaults to `defaultValue`. */
  resetValue?: number
  /** Idle time after the last key or wheel notch before the gesture ends (default 400 ms). */
  gestureIdleMs?: number
  onChange?: (value: number) => void
  onChangeStart?: () => void
  onChangeEnd?: () => void
}

export interface ParamControlHandlers {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void
  onPointerMove: (event: PointerEvent<HTMLElement>) => void
  onPointerUp: (event: PointerEvent<HTMLElement>) => void
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void
  onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void
  onClick: (event: MouseEvent<HTMLElement>) => void
  onDoubleClick: (event: MouseEvent<HTMLElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  onKeyUp: (event: KeyboardEvent<HTMLElement>) => void
  onBlur: () => void
}

export interface ParamControl {
  /** The value shown: the live drag value, else the controlled or internal value. */
  value: number
  /** `value` as a 0..1 position under the taper. */
  normalized: number
  /** Pointer down, or within the idle window of a key / wheel gesture. */
  interacting: boolean
  dragging: boolean
  /** Spread onto the focusable control element. */
  handlers: ParamControlHandlers
  /** Attach to the same element; installs the non-passive wheel listener. */
  ref: (element: HTMLElement | null) => void
  /** Set a value programmatically (quantised, clamped, announced). */
  setValue: (value: number) => void
}

const isBrowser = typeof window !== 'undefined'
// `useLayoutEffect` warns during server rendering; the effect only sets a ref.
const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect

/** How far a finger goes before a control takes it for a turn, in pixels: less is a tap, or the start of a swipe. */
const TOUCH_SLOP_PX = 4
/** How far a pointer may go from where it went down and still be a press, in pixels: the same little way. */
const PRESS_SLOP_PX = TOUCH_SLOP_PX

export function useParamControl(options: ParamControlOptions): ParamControl {
  const {
    value,
    defaultValue,
    min,
    max,
    step = 0,
    taper = 'linear',
    skew = 2,
    axis = 'vertical',
    sensitivityPx = 120,
    gestureIdleMs = 400,
  } = options
  const controlled = value !== undefined

  const [internal, setInternal] = useState(() => quantize(defaultValue, step, min, max))
  const [dragging, setDragging] = useState(false)
  const [interacting, setInteracting] = useState(false)

  const shown = controlled && !dragging ? quantize(value, step, min, max) : internal
  const normalized = normalizeValue(shown, min, max, taper, skew)

  const latest = useRef(options)
  const shownRef = useRef(shown)
  const normRef = useRef(normalized)
  const draggingRef = useRef(false)
  const gestureRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const lastPointRef = useRef({ x: 0, y: 0 })
  /** The value the control had when the pointer took it: what a press the browser takes back returns to. */
  const takenAtRef = useRef(shown)
  /** What a host held then, which may stand between two steps: that press gives it back as it was. */
  const heldAtRef = useRef(value)
  /** Whether that press has given the host a value yet: one that turned up a step and back has, and shows the same. */
  const wroteRef = useRef(false)
  /** How far a finger has gone without turning the control yet, in pixels; null once it turns, and for a mouse. */
  const heldBackRef = useRef<number | null>(null)
  /** How far that finger has gone across the control's own way meanwhile. */
  const heldAcrossRef = useRef(0)
  /** Where the pointer went down on a control of two places; null once it is a drag or the control was turned, and on any other control. */
  const pressRef = useRef<{ x: number; y: number } | null>(null)
  /** Enter went down on a control of two places: the click the browser makes of it is still to come. */
  const enterRef = useRef(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)
  /** What the wheel has turned of a whole step that is not taken yet, in steps: a control of few whole steps only. */
  const wheelStepsRef = useRef(0)

  // A double click is asked whose first press it was.
  useEffect(() => watchPresses(), [])

  useIsomorphicLayoutEffect(() => {
    latest.current = options
    shownRef.current = shown
    // A drag owns the accumulator; otherwise it follows the shown value.
    if (!draggingRef.current) normRef.current = normalized
  })

  const beginGesture = useCallback(() => {
    if (gestureRef.current) return
    gestureRef.current = true
    setInteracting(true)
    latest.current.onChangeStart?.()
  }, [])

  const endGesture = useCallback(() => {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
    if (!gestureRef.current) return
    gestureRef.current = false
    setInteracting(false)
    latest.current.onChangeEnd?.()
  }, [])

  /** Keys and wheel notches form one gesture until `gestureIdleMs` pass without another. */
  const touchGesture = useCallback(() => {
    beginGesture()
    if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      idleTimerRef.current = null
      if (!draggingRef.current) endGesture()
    }, latest.current.gestureIdleMs ?? gestureIdleMs)
  }, [beginGesture, endGesture, gestureIdleMs])

  /** Ends the move that is open without the pointer's say: the pointer that held it holds it no more. */
  const dropGesture = useCallback(() => {
    const pointerId = pointerIdRef.current
    draggingRef.current = false
    pointerIdRef.current = null
    pressRef.current = null
    setDragging(false)
    const element = elementRef.current
    if (pointerId !== null && element?.hasPointerCapture?.(pointerId)) {
      element.releasePointerCapture(pointerId)
    }
    endGesture()
  }, [endGesture])

  // A control that leaves the page in the middle of a move hears nothing more
  // from the browser, and the idle timer of its keys goes with it: the move
  // ends here, so whoever was told it began is told it is over.
  useEffect(() => dropGesture, [dropGesture])

  // Switched off in the middle of a move (a bypassed device): the move ends at
  // once. A browser may send a disabled control none of the pointer's later
  // events, so its going up cannot be waited for.
  const disabled = options.disabled === true
  useEffect(() => {
    if (disabled) dropGesture()
  }, [disabled, dropGesture])

  // A quantised value repeats across pointer frames; a redundant `onChange`
  // would re-render the host and re-send the param to the audio thread.
  const commitQuantized = useCallback((next: number) => {
    // Outside a drag, what a host holds is the value, and it may stand between two steps (a fine key
    // step, a preset): the value shown is that rounded, and a move onto it is still a move.
    const held = latest.current.value
    if (next === (held !== undefined && !draggingRef.current ? held : shownRef.current)) return
    // Turned while the pointer is down on it (a drag, a key): its going up is the end of that, not a press.
    pressRef.current = null
    shownRef.current = next
    setInternal(next)
    if (draggingRef.current) wroteRef.current = true
    latest.current.onChange?.(next)
  }, [])

  const commitNorm = useCallback(
    (nextNorm: number) => {
      const o = latest.current
      normRef.current = clamp(nextNorm, 0, 1)
      const raw = denormalizeValue(normRef.current, o.min, o.max, o.taper, o.skew)
      commitQuantized(quantize(raw, o.step ?? 0, o.min, o.max))
    },
    [commitQuantized],
  )

  /** Quantise to `stepSize` (the control's step unless a fine key step passes a tenth of it). */
  const commitValue = useCallback(
    (next: number, stepSize?: number) => {
      const o = latest.current
      const clamped = quantize(next, stepSize ?? o.step ?? 0, o.min, o.max)
      normRef.current = normalizeValue(clamped, o.min, o.max, o.taper, o.skew)
      commitQuantized(clamped)
    },
    [commitQuantized],
  )

  /** Puts a control of two places on its other place. */
  const switchPlace = useCallback(() => {
    const o = latest.current
    commitValue(shownRef.current === o.max ? o.min : o.max)
  }, [commitValue])

  const endPointer = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (pointerIdRef.current !== event.pointerId) return
      draggingRef.current = false
      pointerIdRef.current = null
      pressRef.current = null
      setDragging(false)
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      endGesture()
    },
    [endGesture],
  )

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (latest.current.disabled || event.button !== 0) return
      event.preventDefault()
      event.currentTarget.focus()
      event.currentTarget.setPointerCapture?.(event.pointerId)
      draggingRef.current = true
      pointerIdRef.current = event.pointerId
      lastPointRef.current = { x: event.clientX, y: event.clientY }
      takenAtRef.current = shownRef.current
      heldAtRef.current = latest.current.value
      wroteRef.current = false
      // A control of two places is switched by a press. Not by the second press of a double click
      // that began on something else, which moved away and left the control under the pointer.
      pressRef.current =
        hasTwoPlaces(latest.current) && !pressFollowsOneElsewhere(event.currentTarget, event)
          ? { x: event.clientX, y: event.clientY }
          : null
      // A finger's first pixels are held back: until it has gone a little way
      // it may be a swipe along whatever the control stands in, which the
      // browser is about to take, and a control that had already turned would
      // leave a step to undo that changed nothing.
      heldBackRef.current = event.pointerType === 'touch' ? 0 : null
      heldAcrossRef.current = 0
      normRef.current = normalizeValue(
        shownRef.current,
        latest.current.min,
        latest.current.max,
        latest.current.taper,
        latest.current.skew,
      )
      // The drag shows `internal`; seed it from the controlled value so nothing jumps.
      setInternal(shownRef.current)
      setDragging(true)
      beginGesture()
    },
    [beginGesture],
  )

  /**
   * The pointer goes up. On a control of two places a press that went no way
   * and turned nothing switches it, inside the move the press began: one
   * change between its start and its end, as a drag that ends there.
   */
  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (pointerIdRef.current !== event.pointerId) return
      if (pressRef.current !== null && !latest.current.disabled) switchPlace()
      endPointer(event)
    },
    [endPointer, switchPlace],
  )

  /**
   * The pointer was taken from the control (something else captured it): none
   * of its later events come here, so the move ends as if it had gone up. A
   * browser says this after every pointer up too, when the move is already over.
   */
  const onLostPointerCapture = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (pointerIdRef.current === event.pointerId) dropGesture()
    },
    [dropGesture],
  )

  /**
   * The browser took the press for itself: a finger that began on the control
   * turned out to be scrolling what the control stands in. Nothing was meant
   * for the control, so what the first pixels turned it by is put back.
   */
  const cancelPointer = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (pointerIdRef.current !== event.pointerId) return
      const taken = takenAtRef.current
      const o = latest.current
      const held = heldAtRef.current
      // The value shown is a host's rounded to a step, and the host is to have its own again.
      const own = held !== undefined && Number.isFinite(held) ? clamp(held, o.min, o.max) : taken
      // A press that turned the control up a step and back shows what it showed, and the host
      // holds that rounded value all the same: it has been written to, and gets its own back too.
      const turned = taken !== shownRef.current || (wroteRef.current && own !== taken)
      if (draggingRef.current && turned) {
        normRef.current = normalizeValue(taken, o.min, o.max, o.taper, o.skew)
        shownRef.current = taken
        setInternal(taken)
        o.onChange?.(own)
      }
      endPointer(event)
    },
    [endPointer],
  )

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!draggingRef.current || pointerIdRef.current !== event.pointerId) return
      // Disabled mid-drag (a bypassed device): end the drag instead of committing.
      if (latest.current.disabled) {
        endPointer(event)
        return
      }
      const dx = event.clientX - lastPointRef.current.x
      const dy = event.clientY - lastPointRef.current.y
      lastPointRef.current = { x: event.clientX, y: event.clientY }
      // Gone further than a hand shakes, whichever way: a drag from here on, wherever it is let go.
      const press = pressRef.current
      if (
        press !== null &&
        Math.hypot(event.clientX - press.x, event.clientY - press.y) >= PRESS_SLOP_PX
      ) {
        pressRef.current = null
      }
      const a = latest.current.axis ?? axis
      const travel = a === 'vertical' ? dy : a === 'horizontal' ? -dx : dy - dx
      if (heldBackRef.current !== null) {
        heldAcrossRef.current += a === 'vertical' ? dx : a === 'horizontal' ? dy : 0
      }
      if (travel === 0) return
      let moved = travel
      if (heldBackRef.current !== null) {
        heldBackRef.current += travel
        if (Math.abs(heldBackRef.current) < TOUCH_SLOP_PX) return
        // A finger that has gone further across than along is still a swipe the browser may
        // take, however far it has drifted along meanwhile: a swipe on a slant drifts more
        // than the first pixels.
        if (Math.abs(heldBackRef.current) < Math.abs(heldAcrossRef.current)) return
        // The finger means the control: it catches up with all of the way so far.
        moved = heldBackRef.current
        heldBackRef.current = null
      }
      const px = latest.current.sensitivityPx ?? sensitivityPx
      commitNorm(normRef.current + pointerDeltaToNormDelta(moved, px, event.shiftKey))
    },
    [axis, commitNorm, endPointer, sensitivityPx],
  )

  /**
   * Enter with the keys on a control of two places switches it. It is done at
   * the click the browser makes of the key on a button, not at the key: a
   * host that keeps the clicks from a control, to pick it and not work it,
   * keeps this one with them. A click of the pointer was dealt with as it
   * went up, and one a script or the Space bar made is not Enter's.
   */
  const onClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const entered = enterRef.current
      enterRef.current = false
      const o = latest.current
      if (!entered || event.detail !== 0 || o.disabled || !hasTwoPlaces(o)) return
      beginGesture()
      switchPlace()
      // With a pointer down on the control it is part of that move, as a stepping key is.
      if (!draggingRef.current) endGesture()
    },
    [beginGesture, endGesture, switchPlace],
  )

  const onDoubleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const o = latest.current
      if (o.disabled) return
      // On a control of two places a double click is two presses, and each has switched it: it is
      // back where it began. Its way to the default is Delete.
      if (hasTwoPlaces(o)) return
      // The browser sends this to what stands under the second press. A cell that moved away when it
      // was pressed (a plate folding open) leaves a control there, and that is not a double click on it.
      if (firstPressWasElsewhere(event.currentTarget, event)) return
      event.preventDefault()
      beginGesture()
      commitValue(o.resetValue ?? o.defaultValue)
      // A pointer that is down on the control holds the move open: it ends when the pointer lets go.
      if (!draggingRef.current) endGesture()
    },
    [beginGesture, commitValue, endGesture],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const o = latest.current
      if (o.disabled) return
      // Enter on a control of two places: the click it makes switches it (`onClick`), so the key
      // is left to the browser and only kept from the page. A held key is one press.
      enterRef.current = false
      if (
        event.key === 'Enter' &&
        hasTwoPlaces(o) &&
        !(event.shiftKey || event.metaKey || event.ctrlKey || event.altKey)
      ) {
        enterRef.current = !event.repeat
        event.stopPropagation()
        return
      }
      const stepSize = o.step ?? 0
      const fine = event.shiftKey && !(o.wholeSteps && stepSize > 0)
      // A fine step leaves the value a tenth of a step off the grid, and the value shown is the host's
      // rounded to whole steps: from that every fine press would start again and none would add up.
      const current =
        fine && stepSize > 0 && o.value !== undefined
          ? quantize(o.value, stepSize / 10, o.min, o.max)
          : shownRef.current
      // Without a step, keys move 1 % of the travel (0.1 % fine, 10 % page).
      const byNorm = (fraction: number): void =>
        commitNorm(
          normalizeValue(current, o.min, o.max, o.taper, o.skew) +
            (fine ? fraction / 10 : fraction),
        )
      const bySteps = (count: number): void => {
        if (stepSize > 0) {
          commitValue(
            stepBy(current, count, stepSize, o.min, o.max, fine),
            fine ? stepSize / 10 : stepSize,
          )
        } else byNorm(count * 0.01)
      }
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowRight':
          touchGesture()
          bySteps(1)
          break
        case 'ArrowDown':
        case 'ArrowLeft':
          touchGesture()
          bySteps(-1)
          break
        case 'PageUp':
          touchGesture()
          bySteps(10)
          break
        case 'PageDown':
          touchGesture()
          bySteps(-10)
          break
        case 'Home':
          touchGesture()
          commitValue(o.min)
          break
        case 'End':
          touchGesture()
          commitValue(o.max)
          break
        case 'Delete':
        case 'Backspace':
          // The way back to the default, as a double-click is: one gesture, so one step of a host's undo.
          // With a modifier the key is the page's, and a held key is one press.
          if (event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return
          if (!event.repeat) {
            beginGesture()
            commitValue(o.resetValue ?? o.defaultValue)
            // Pressed while a pointer holds the control, it is part of that move, as a stepping key is.
            if (!draggingRef.current) endGesture()
          }
          break
        default:
          // Space (transport), letters, shortcuts belong to the page.
          return
      }
      event.preventDefault()
      // A focused slider owns its stepping keys; Home must not also seek the transport,
      // nor Delete remove what is selected on the page behind it.
      event.stopPropagation()
    },
    [beginGesture, commitNorm, commitValue, endGesture, touchGesture],
  )

  /**
   * Enter goes up. The click the browser makes of it came as the key went
   * down; one a host kept never reached `onClick`, and a click no pointer made
   * that comes later (a script's, a screen reader's) is not that Enter's.
   */
  const onKeyUp = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter') enterRef.current = false
  }, [])

  const onBlur = useCallback(() => {
    enterRef.current = false
    if (!draggingRef.current) endGesture()
  }, [endGesture])

  // React registers `wheel` passively, so `preventDefault` (no page scroll while
  // turning a knob) needs a native non-passive listener on the element.
  const onWheel = useCallback(
    (event: WheelEvent) => {
      const o = latest.current
      if (o.disabled || !(o.wheel ?? true)) return
      // Shift turns a vertical wheel into a horizontal one on most platforms, so with Shift held
      // a sideways delta is the wheel. Without it, a swipe that goes more across than up or down
      // is the scroller's (a chain of plates runs sideways): it turns nothing and scrolls on.
      // A control that itself lies across keeps it.
      const across = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      if (across && !event.shiftKey && o.axis !== 'horizontal') return
      const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX
      if (delta === 0) return
      event.preventDefault()
      touchGesture()
      const turned = wheelDeltaToNormDelta(delta, event.deltaMode, event.shiftKey)
      const stepSize = o.step ?? 0
      // A control of few whole steps (a list of choices): one step is more of its travel than a
      // notch turns, and the sum of the notches is put back on the value shown at every render,
      // so a notch at a time turned nothing. There a notch is one step, and less of one adds up.
      if (o.wholeSteps && stepSize > 0 && stepSize / (o.max - o.min) > WHEEL_NOTCH) {
        if (wheelStepsRef.current * turned < 0) wheelStepsRef.current = 0
        wheelStepsRef.current += turned / WHEEL_NOTCH
        const whole = Math.trunc(wheelStepsRef.current)
        if (whole === 0) return
        wheelStepsRef.current -= whole
        commitValue(stepBy(shownRef.current, whole, stepSize, o.min, o.max))
        return
      }
      commitNorm(normRef.current + turned)
    },
    [commitNorm, commitValue, touchGesture],
  )
  const ref = useCallback(
    (element: HTMLElement | null) => {
      elementRef.current?.removeEventListener('wheel', onWheel)
      elementRef.current = element
      element?.addEventListener('wheel', onWheel, { passive: false })
    },
    [onWheel],
  )

  const setValue = useCallback(
    (next: number) => {
      beginGesture()
      commitValue(next)
      if (!draggingRef.current) endGesture()
    },
    [beginGesture, commitValue, endGesture],
  )

  return {
    value: shown,
    normalized,
    interacting: interacting || dragging,
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: cancelPointer,
      onLostPointerCapture,
      onClick,
      onDoubleClick,
      onKeyDown,
      onKeyUp,
      onBlur,
    },
    ref,
    setValue,
  }
}
