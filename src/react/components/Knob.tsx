// A rotary control: 270° sweep with a bottom gap, an arc that fills from the
// minimum (or from the centre when `bipolar`, pan-style), and a pointer line.
// Moved from ambient-live's `knob.tsx` (U25) with the `al-*` classes replaced
// by `--lm-*` tokens. Controlled or uncontrolled through `useParamControl`.

import { useEffect, useRef, type CSSProperties } from 'react'

import { paramModReach, type ParamModulation } from '../../core/automation/param-modulation'
import { isModulatedDevice, type Device } from '../../core/devices/Device'
import { frameIntervalMs, subscribeFrames } from '../frame'
import { useFrameScheduler } from '../hooks/useEngine'
import {
  clamp01,
  formatControlValue,
  knobArcPath,
  hasTwoPlaces,
  normalizeValue,
  normToKnobAngle,
  type ControlTaper,
  type ControlUnit,
} from './control-math'
import { controlGestureInfo, infoProps, infoText } from './info'
import { cx, tokenRef } from './tokens'
import { useParamControl, type ControlAxis } from './useParamControl'

/**
 * How the knob is drawn. `arc` is the kit's own: a track that fills. The
 * others are caps for a skinned device plate (`DevicePlate`), drawn in the
 * plate's ink (`--lm-plate-ink`) on its colour (`--lm-plate`): a flat disc
 * with a line, a solid cap with a dot, a skirted cap, and a pointer.
 */
export type KnobCap = 'arc' | 'disc' | 'dot' | 'skirt' | 'pointer'

/**
 * Something that moves the knob's parameter on its own (an LFO): the knob
 * stays where it is set and shows how far the value swings and where it is.
 */
export interface KnobModulation {
  /** How far the value goes below and above where the knob is set, as fractions of its travel. */
  reach: { below: number; above: number }
  /** The parameter's value now. Read on every frame, never in a render. */
  valueNow(): number
}

/**
 * A knob's `modulation` for one parameter of a device that moves its own:
 * undefined when nothing moves it, so it can be handed to the knob as it is.
 */
export function knobModulation(
  device: Device,
  name: string,
  modulation: ParamModulation | undefined,
): KnobModulation | undefined {
  if (!modulation || !isModulatedDevice(device)) return undefined
  return { reach: paramModReach(modulation), valueNow: () => device.paramAt(name) }
}

export interface KnobProps {
  label: string
  /** Controlled value; omit for an uncontrolled knob starting at `defaultValue`. */
  value?: number
  defaultValue: number
  min: number
  max: number
  /** Quantisation step; 0 (default) clamps only. */
  step?: number
  /**
   * The value only takes whole steps (a list, a count): a key with Shift moves a step too,
   * not a tenth of one. With one step for all of its travel (off and on) a press switches
   * the knob, as Enter does with the keys on it, and a double-click is two presses.
   */
  wholeSteps?: boolean
  unit?: ControlUnit
  taper?: ControlTaper
  skew?: number
  /** Fill the arc from the centre (0.5) instead of from the minimum. */
  bipolar?: boolean
  disabled?: boolean
  /** Diameter in pixels (default 44; the label and value follow the tokens). */
  size?: number
  axis?: ControlAxis
  sensitivityPx?: number
  wheel?: boolean
  /** What a double-click or Delete sets; defaults to `defaultValue`. */
  resetValue?: number
  /** Idle time that ends a key / wheel gesture (default 400 ms). */
  gestureIdleMs?: number
  /** Replace the default unit formatting of the readout. */
  format?: (value: number) => string
  /**
   * `format` words only the value the knob holds now, whatever it is given
   * (a hosted plug-in's own text). The info view then names no value for a
   * double-click: it "returns it to its default".
   */
  formatPresentOnly?: boolean
  hideLabel?: boolean
  hideValue?: boolean
  /** Default `arc`. */
  cap?: KnobCap
  /**
   * What moves the value on its own. The knob draws a dot at its foot, a faint
   * arc for the swing and a strong one from where it is set to where the
   * value is, moved on frames without a render.
   */
  modulation?: KnobModulation
  /**
   * What the knob does, for the info view (`InfoView`): a sentence or two.
   * How it is worked is said after it, so leave that out.
   */
  info?: string
  onChange?: (value: number) => void
  onChangeStart?: () => void
  onChangeEnd?: () => void
  className?: string
  style?: CSSProperties
  id?: string
  'data-testid'?: string
  /** The parameter this knob sets, by name, for a host that maps controllers onto what is on screen. */
  'data-lm-param'?: string
}

const CAP_INK = `var(--lm-plate-ink, ${tokenRef('text', '#1A1A1A')})`
const CAP_FILL = `var(--lm-plate, ${tokenRef('sunken', '#E9E9E4')})`

/** A cap for a device plate: `angle` is where the knob points, in radians. */
function KnobCapShape({
  cap,
  size,
  angle,
}: {
  cap: Exclude<KnobCap, 'arc'>
  size: number
  angle: number
}) {
  const c = size / 2
  const unit = size / 30
  const at = (r: number, a = angle): [number, number] => [
    c + r * unit * Math.cos(a),
    c + r * unit * Math.sin(a),
  ]
  const ends = [normToKnobAngle(0), normToKnobAngle(1)].map((deg) => (deg * Math.PI) / 180)
  const ticks = ends.map((end) => {
    const [x1, y1] = at(13.5, end)
    const [x2, y2] = at(15, end)
    return <line key={end} x1={x1} y1={y1} x2={x2} y2={y2} stroke={CAP_INK} strokeWidth={1} />
  })
  if (cap === 'disc') {
    const [x1, y1] = at(3)
    const [x2, y2] = at(11)
    return (
      <>
        {ticks}
        <circle cx={c} cy={c} r={11.5 * unit} fill={CAP_FILL} stroke={CAP_INK} strokeWidth={1.2} />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={CAP_INK} strokeWidth={1.8} />
      </>
    )
  }
  if (cap === 'dot') {
    const [x, y] = at(6.5)
    return (
      <>
        {ticks}
        <circle cx={c} cy={c} r={10.5 * unit} fill={CAP_INK} />
        <circle cx={x} cy={y} r={2 * unit} fill={CAP_FILL} />
      </>
    )
  }
  if (cap === 'skirt') {
    const [x1, y1] = at(1)
    const [x2, y2] = at(8)
    const [x3, y3] = at(11.5)
    return (
      <>
        {ticks}
        <circle cx={c} cy={c} r={12 * unit} fill="none" stroke={CAP_INK} strokeWidth={1} />
        <circle cx={c} cy={c} r={8 * unit} fill={CAP_INK} />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={CAP_FILL} strokeWidth={1.6} />
        <line x1={x2} y1={y2} x2={x3} y2={y3} stroke={CAP_INK} strokeWidth={1.6} />
      </>
    )
  }
  const [tx, ty] = at(12.5)
  const [bx, by] = at(5, angle + Math.PI)
  const wing = angle + Math.PI / 2
  const wx = 4.2 * unit * Math.cos(wing)
  const wy = 4.2 * unit * Math.sin(wing)
  return (
    <>
      {ticks}
      <path d={`M${tx} ${ty}L${bx + wx} ${by + wy}L${bx - wx} ${by - wy}Z`} fill={CAP_INK} />
      <circle cx={c} cy={c} r={2 * unit} fill={CAP_FILL} />
    </>
  )
}

/** On a device plate the plate's own accent; the theme's elsewhere. */
const MOD_INK = `var(--lm-plate-accent, ${tokenRef('accent', '#E63946')})`

/** Frames a second the moving arc is drawn at. */
const MOD_FPS = 60

/**
 * The marks of a parameter that moves on its own, outside the cap and inside
 * the knob's square: a dot in the gap at the foot, the swing, and the arc
 * from the set value to the value now. Only the last is drawn on frames, by
 * writing the path itself: nothing renders while it moves.
 */
function KnobModulationMarks({
  modulation,
  size,
  normalized,
  toNorm,
}: {
  modulation: KnobModulation
  size: number
  normalized: number
  toNorm: (value: number) => number
}) {
  const frames = useFrameScheduler()
  const arc = useRef<SVGPathElement>(null)
  const latest = useRef({ modulation, normalized, toNorm })
  latest.current = { modulation, normalized, toNorm }
  const c = size / 2
  const radius = size * 0.455
  const width = Math.max(1.5, size / 20)

  useEffect(() => {
    let drawn = ''
    const draw = (): void => {
      const path = arc.current
      if (!path) return
      const { modulation: moved, normalized: from, toNorm: norm } = latest.current
      const to = norm(moved.valueNow())
      const next =
        Math.abs(to - from) < 0.002
          ? ''
          : knobArcPath(c, c, radius, Math.min(from, to), Math.max(from, to))
      if (next === drawn) return
      drawn = next
      path.setAttribute('d', next)
    }
    draw()
    return subscribeFrames(frames, frameIntervalMs(MOD_FPS), draw)
  }, [frames, c, radius])

  const low = clamp01(normalized - modulation.reach.below)
  const high = clamp01(normalized + modulation.reach.above)
  // The dot sits on the ring's foot, and whole inside the knob's own box at any size.
  const dot = Math.max(1.25, size / 24)
  return (
    <g className="lm-knob__modulation">
      {high - low < 0.002 ? null : (
        <path
          d={knobArcPath(c, c, radius, low, high)}
          fill="none"
          stroke={MOD_INK}
          strokeOpacity={0.3}
          strokeWidth={width}
          strokeLinecap="butt"
        />
      )}
      <path
        ref={arc}
        className="lm-knob__modulation-now"
        fill="none"
        stroke={MOD_INK}
        strokeWidth={width}
        strokeLinecap="butt"
      />
      <circle
        className="lm-knob__modulation-dot"
        cx={c}
        cy={Math.min(c + radius, size - dot)}
        r={dot}
        fill={MOD_INK}
      />
    </g>
  )
}

export function Knob({
  label,
  value,
  defaultValue,
  min,
  max,
  step = 0,
  wholeSteps,
  unit = 'ratio',
  taper = 'linear',
  skew = 2,
  bipolar = false,
  disabled = false,
  size = 44,
  axis,
  sensitivityPx = 110,
  wheel,
  resetValue,
  gestureIdleMs,
  format,
  formatPresentOnly = false,
  hideLabel = false,
  hideValue = false,
  cap = 'arc',
  modulation,
  info,
  onChange,
  onChangeStart,
  onChangeEnd,
  className,
  style,
  id,
  'data-testid': testId,
  'data-lm-param': param,
}: KnobProps) {
  const control = useParamControl({
    value,
    defaultValue,
    min,
    max,
    step,
    wholeSteps,
    taper,
    skew,
    disabled,
    axis,
    sensitivityPx,
    wheel,
    resetValue,
    gestureIdleMs,
    onChange,
    onChangeStart,
    onChangeEnd,
  })
  const { normalized, interacting, handlers } = control

  const cx0 = size / 2
  const cy0 = size / 2
  const radius = size * 0.36
  const pointerAngle = (normToKnobAngle(normalized) * Math.PI) / 180
  const pointerLen = radius - 2
  const trackPath = knobArcPath(cx0, cy0, radius, 0, 1)
  const fillStart = bipolar ? 0.5 : 0
  const fillPath =
    Math.abs(normalized - fillStart) < 0.001
      ? ''
      : knobArcPath(
          cx0,
          cy0,
          radius,
          Math.min(fillStart, normalized),
          Math.max(fillStart, normalized),
        )
  const print = (shown: number): string =>
    format ? format(shown) : formatControlValue(shown, unit, { step })
  const valueText = print(control.value)
  const stroke = tokenRef('stroke', '2px')
  const gesture = disabled
    ? null
    : controlGestureInfo({
        axis,
        reset: format && formatPresentOnly ? undefined : print(resetValue ?? defaultValue),
        wheel,
        twoPlaces: hasTwoPlaces({ min, max, step, wholeSteps }),
      })

  return (
    <div
      className={cx(
        'lm-knob',
        disabled && 'lm-knob--disabled',
        interacting && 'lm-knob--active',
        cap !== 'arc' && 'lm-knob--cap',
        modulation && 'lm-knob--modulated',
        className,
      )}
      style={style}
      data-testid={testId}
      data-lm-param={param}
      {...infoProps(label, infoText(info, gesture))}
    >
      {hideLabel ? null : (
        <span className="lm-knob__label" title={label}>
          {label}
        </span>
      )}
      <button
        type="button"
        role="slider"
        id={id}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={control.value}
        aria-valuetext={valueText}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        className="lm-knob__control"
        style={{ width: size, height: size }}
        ref={control.ref}
        {...handlers}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          {cap === 'arc' ? null : <KnobCapShape cap={cap} size={size} angle={pointerAngle} />}
          {cap !== 'arc' ? null : (
            <>
              <path
                d={trackPath}
                fill="none"
                stroke={tokenRef('hairline', '#C4C4BE')}
                strokeWidth={stroke}
                strokeLinecap="butt"
              />
              {fillPath ? (
                <path
                  d={fillPath}
                  fill="none"
                  stroke={tokenRef('accent', '#E63946')}
                  strokeWidth={stroke}
                  strokeLinecap="butt"
                />
              ) : null}
              <circle
                cx={cx0}
                cy={cy0}
                r={radius * 0.55}
                fill={tokenRef('sunken', '#E9E9E4')}
                stroke={tokenRef('border', '#D6D6D0')}
                strokeWidth={1}
              />
              <line
                x1={cx0}
                y1={cy0}
                x2={cx0 + pointerLen * Math.cos(pointerAngle)}
                y2={cy0 + pointerLen * Math.sin(pointerAngle)}
                stroke={tokenRef('text', '#1A1A1A')}
                strokeWidth={1.5}
                strokeLinecap="square"
              />
            </>
          )}
          {modulation ? (
            <KnobModulationMarks
              modulation={modulation}
              size={size}
              normalized={normalized}
              toNorm={(shown) => normalizeValue(shown, min, max, taper, skew)}
            />
          ) : null}
        </svg>
      </button>
      {hideValue ? null : <span className="lm-knob__value">{valueText}</span>}
    </div>
  )
}
