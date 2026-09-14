// Shared pointer, wheel and keyboard interaction for knobs and faders, moved
// from ambient-live's `use-param-control.ts` (U25). Controlled (`value`) or
// uncontrolled (`defaultValue`); drags accumulate a normalised position so a
// fine (Shift) drag with sub-step travel still adds up; `onChange` fires only
// when the quantised value moves. `onChangeStart`/`onChangeEnd` bracket a
// gesture — pointer down to up, or a burst of keys / wheel notches — which
// is where a host overrides and releases an automation lane.

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
  normalizeValue,
  pointerDeltaToNormDelta,
  quantize,
  stepBy,
  wheelDeltaToNormDelta,
  type ControlTaper,
} from './control-math'

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
  onDoubleClick: (event: MouseEvent<HTMLElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
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
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)

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

  useEffect(
    () => () => {
      if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current)
    },
    [],
  )

  // A quantised value repeats across pointer frames; a redundant `onChange`
  // would re-render the host and re-send the param to the audio thread.
  const commitQuantized = useCallback((next: number) => {
    if (next === shownRef.current) return
    shownRef.current = next
    setInternal(next)
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

  const endPointer = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (pointerIdRef.current !== event.pointerId) return
      draggingRef.current = false
      pointerIdRef.current = null
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
      const a = latest.current.axis ?? axis
      const travel = a === 'vertical' ? dy : a === 'horizontal' ? -dx : dy - dx
      if (travel === 0) return
      const px = latest.current.sensitivityPx ?? sensitivityPx
      commitNorm(normRef.current + pointerDeltaToNormDelta(travel, px, event.shiftKey))
    },
    [axis, commitNorm, endPointer, sensitivityPx],
  )

  const onDoubleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const o = latest.current
      if (o.disabled) return
      event.preventDefault()
      beginGesture()
      commitValue(o.resetValue ?? o.defaultValue)
      endGesture()
    },
    [beginGesture, commitValue, endGesture],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const o = latest.current
      if (o.disabled) return
      const fine = event.shiftKey
      const stepSize = o.step ?? 0
      const current = shownRef.current
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
        default:
          // Space (transport), letters, shortcuts belong to the page.
          return
      }
      event.preventDefault()
      // A focused slider owns its stepping keys; Home must not also seek the transport.
      event.stopPropagation()
    },
    [commitNorm, commitValue, touchGesture],
  )

  const onBlur = useCallback(() => {
    if (!draggingRef.current) endGesture()
  }, [endGesture])

  // React registers `wheel` passively, so `preventDefault` (no page scroll while
  // turning a knob) needs a native non-passive listener on the element.
  const onWheel = useCallback(
    (event: WheelEvent) => {
      const o = latest.current
      if (o.disabled || !(o.wheel ?? true)) return
      // Shift turns a vertical wheel into a horizontal one on most platforms.
      const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX
      if (delta === 0) return
      event.preventDefault()
      touchGesture()
      commitNorm(normRef.current + wheelDeltaToNormDelta(delta, event.deltaMode, event.shiftKey))
    },
    [commitNorm, touchGesture],
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
      endGesture()
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
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onDoubleClick,
      onKeyDown,
      onBlur,
    },
    ref,
    setValue,
  }
}
