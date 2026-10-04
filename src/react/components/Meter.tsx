// Level bars on the dB scale the DSP reports (`gainToDb` of the analyser
// peak/RMS, the `LufsMeter`'s LUFS and dBTP), with a peak-hold marker. Reads
// a `MeterSource` on frames, or draws an explicit `reading` — what a test, a
// server render or a demo without audio passes. The `segments` look is a
// console meter: three zones fixed to the scale, cut into segments, with a
// clip lamp that stays lit.
//
// A meter on a source is rendered by React once, and again when its props or
// the elements it is made of change. Between those renders each sampled
// reading is written straight to the elements, with the strings React would
// have written, so a page of meters costs no render per frame.

import { useEffect, useLayoutEffect, useReducer, useRef, useState, type CSSProperties } from 'react'

import { gainToDb } from '../../core/devices/native/units'
import { frameIntervalMs, subscribeFrameSampled } from '../frame'
import { useEnginePart, useFrameScheduler } from '../hooks/useEngine'
import { readMeter, type MeterSnapshot, type MeterSource } from '../hooks/useMeter'
import { shallowEqual } from '../store'
import { dbToMeterPosition, heldPeak, LUFS_FLOOR, METER_FLOOR_DB } from './control-math'
import { infoProps } from './info'
import { cx } from './tokens'

export type MeterBarKind = 'peak' | 'rms' | 'lufs' | 'truePeak'

export type MeterOrientation = 'vertical' | 'horizontal'

/** How the bars are drawn: solid bars, or lit segments in three zones with a clip lamp. */
export type MeterLook = 'bars' | 'segments'

export interface MeterProps {
  /** What to read (defaults to the provided engine's master when `reading` is absent). */
  source?: MeterSource
  /** An explicit reading; wins over `source` and needs no engine. */
  reading?: MeterSnapshot
  fps?: number
  active?: boolean
  orientation?: MeterOrientation
  /** Bars to draw; default peak + RMS, plus LUFS and true peak when a LUFS meter is present. */
  bars?: readonly MeterBarKind[]
  /** Bottom of the dB scale (default −60). */
  floorDb?: number
  /** Bottom of the LUFS scale (default −40). */
  lufsFloor?: number
  /**
   * Above this dB the peak bar takes the `meter-hot` colour (default −6). In
   * the `segments` look it is where the hot zone starts.
   */
  hotDb?: number
  /** Where the warm zone of the `segments` look starts, in dB (default −12). */
  warmDb?: number
  /**
   * `'segments'` draws a console meter: each bar lit in segments, in three
   * zones that stay where they are on the scale, and a clip lamp past the far
   * end that stays lit until the meter is clicked. Default `'bars'`.
   */
  look?: MeterLook
  /** Peak-hold time in ms (default 1500; 0 disables the marker). */
  holdMs?: number
  showReadout?: boolean
  label?: string
  /** What is being measured, for the info view; the default says how to read the bars. */
  info?: string
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

function nowMs(): number {
  return typeof performance === 'object' ? performance.now() : Date.now()
}

/** How each bar is read, as the info view says it. */
const BAR_INFO: Record<MeterBarKind, string> = {
  peak: 'the peak, with a mark that holds the highest one for a moment',
  rms: 'the average level (RMS)',
  lufs: 'the short-term loudness in LUFS',
  truePeak: 'the true peak between samples',
}

/**
 * What a meter with these bars shows. Give `warmDb` for the `segments` look,
 * which has three zones and a clip lamp.
 */
export function meterInfo(kinds: readonly MeterBarKind[], hotDb: number, warmDb?: number): string {
  const bars = kinds.map((kind) => BAR_INFO[kind])
  const list =
    bars.length > 1 ? `${bars.slice(0, -1).join(', ')} and ${bars[bars.length - 1]}` : bars[0]
  const shown = bars.length > 1 ? `The bars show ${list}.` : `The bar shows ${list}.`
  if (warmDb === undefined) {
    return `How loud the signal is here. ${shown} Above ${hotDb} dB it changes colour; at 0 dB the signal clips.`
  }
  return `How loud the signal is here. ${shown} The scale has three zones: up to ${warmDb} dB, from ${warmDb} to ${hotDb} dB, and above ${hotDb} dB, each in its own colour. At 0 dB the signal clips, and the lamp at the end stays lit until the meter is clicked.`
}

const BAR_LABELS: Record<MeterBarKind, string> = {
  peak: 'Peak',
  rms: 'RMS',
  lufs: 'Short-term loudness',
  truePeak: 'True peak',
}

function barDb(reading: MeterSnapshot, kind: MeterBarKind): number {
  switch (kind) {
    case 'peak':
      return reading.peakDb
    case 'rms':
      return gainToDb(reading.rms)
    case 'lufs':
      return reading.lufsShortTerm
    case 'truePeak':
      return reading.truePeakDb
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

function formatDb(db: number, digits = 1): string {
  return Number.isFinite(db) ? db.toFixed(digits) : '-∞'
}

const isBrowser = typeof window !== 'undefined'
// `useLayoutEffect` warns during server rendering; the effect only writes to a document.
const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect

const DEFAULT_BARS: readonly MeterBarKind[] = ['peak', 'rms']
const DEFAULT_BARS_WITH_LUFS: readonly MeterBarKind[] = ['peak', 'rms', 'lufs', 'truePeak']

/** The style property a fill is sized by, and the one that places the peak-hold marker. */
type FillProperty = 'clipPath' | 'height' | 'width'
type HoldProperty = 'bottom' | 'left'

/** How the props say a reading is drawn: everything in a `MeterView` but the reading itself. */
interface MeterScale {
  /** The class of the root, and the one it has while the signal clips. */
  rootClass: string
  clipClass: string
  bars: readonly MeterBarKind[] | undefined
  floorDb: number
  lufsFloor: number
  hotDb: number
  vertical: boolean
  segments: boolean
}

interface MeterBarView {
  kind: MeterBarKind
  title: string
  db: string
  fillClass: string
  /** The value of the fill's one style property. */
  fill: string
}

/** One reading as the meter draws it: every string of the elements that follows the signal. */
interface MeterView {
  rootClass: string
  valueNow: number
  valueText: string
  kinds: readonly MeterBarKind[]
  bars: readonly MeterBarView[]
  /** The marker is an element of its own, there only while a peak is held. */
  holdShown: boolean
  holdClass: string
  hold: string
  clipped: boolean
  peakText: string
  /** With a LUFS meter there are two more bars by default and a second readout. */
  hasLufs: boolean
  lufsText: string
}

function meterView(
  reading: MeterSnapshot,
  scale: MeterScale,
  holdDb: number,
  clipping: boolean,
  clipped: boolean,
): MeterView {
  const { floorDb, hotDb, vertical, segments } = scale
  const kinds = scale.bars ?? (reading.hasLufs ? DEFAULT_BARS_WITH_LUFS : DEFAULT_BARS)
  const holdShown = Number.isFinite(holdDb)
  return {
    rootClass: clipping ? scale.clipClass : scale.rootClass,
    valueNow: Number.isFinite(reading.peakDb) ? reading.peakDb : floorDb,
    valueText: `${formatDb(reading.peakDb)} dBFS`,
    kinds,
    bars: kinds.map((kind) => {
      const db = barDb(reading, kind)
      const position = dbToMeterPosition(db, kind === 'lufs' ? scale.lufsFloor : floorDb, 0)
      const hot = !segments && kind !== 'lufs' && db > hotDb
      // A segmented fill is the whole bar, cut down to the level from its far end.
      const cut = `${(1 - position) * 100}%`
      return {
        kind,
        title: `${BAR_LABELS[kind]} ${formatDb(db)}`,
        db: formatDb(db),
        fillClass: cx('lm-meter__fill', `lm-meter__fill--${kind}`, hot && 'lm-meter__fill--hot'),
        fill: segments
          ? vertical
            ? `inset(${cut} 0 0 0)`
            : `inset(0 ${cut} 0 0)`
          : `${position * 100}%`,
      }
    }),
    holdShown,
    holdClass: cx('lm-meter__hold', holdDb > hotDb && 'lm-meter__hold--hot'),
    hold: holdShown ? `${dbToMeterPosition(holdDb, floorDb, 0) * 100}%` : '',
    clipped,
    peakText: formatDb(holdDb),
    hasLufs: reading.hasLufs,
    lufsText: formatDb(reading.lufsShortTerm),
  }
}

/** A place a string of the view goes: an attribute by its name, a style property, or one of these. */
type MeterPlace =
  | 'class'
  | 'text'
  | 'title'
  | 'data-db'
  | 'data-on'
  | 'aria-valuenow'
  | 'aria-valuetext'
  | FillProperty
  | HoldProperty

/** Write one string the way React writes that prop, so the document reads the same either way. */
function writePlace(element: HTMLElement, place: MeterPlace, value: string): void {
  switch (place) {
    case 'class':
      element.className = value
      break
    case 'text':
      // The first text node is the figure; a unit after it is a node of its own.
      if (element.firstChild) element.firstChild.nodeValue = value
      break
    case 'data-on':
      if (value) element.setAttribute(place, '')
      else element.removeAttribute(place)
      break
    case 'clipPath':
    case 'height':
    case 'width':
    case 'bottom':
    case 'left':
      element.style[place] = value
      break
    case 'title':
    case 'data-db':
    case 'aria-valuenow':
    case 'aria-valuetext':
      element.setAttribute(place, value)
      break
    default: {
      const _exhaustive: never = place
      return _exhaustive
    }
  }
}

/** The elements of a rendered meter that follow the signal. */
interface MeterParts {
  root: HTMLElement
  /** One per bar, in the order of the kinds. */
  bars: readonly { bar: HTMLElement; fill: HTMLElement | null; hold: HTMLElement | null }[]
  lamp: HTMLElement | null
  peak: HTMLElement | null
  lufs: HTMLElement | null
}

function meterParts(root: HTMLElement): MeterParts {
  const find = (name: string): HTMLElement | null =>
    root.querySelector<HTMLElement>(`.lm-meter__${name}`)
  return {
    root,
    bars: Array.from(root.querySelectorAll<HTMLElement>('.lm-meter__bar'), (bar) => ({
      bar,
      fill: bar.querySelector<HTMLElement>('.lm-meter__fill'),
      hold: bar.querySelector<HTMLElement>('.lm-meter__hold'),
    })),
    lamp: find('clip'),
    peak: find('value--peak'),
    lufs: find('value--lufs'),
  }
}

/** Visit every string of `view` with the element that carries it, in one fixed order. */
function eachPlace(
  parts: MeterParts,
  view: MeterView,
  fillProperty: FillProperty,
  holdProperty: HoldProperty,
  visit: (element: HTMLElement, place: MeterPlace, value: string) => void,
): void {
  visit(parts.root, 'class', view.rootClass)
  visit(parts.root, 'aria-valuenow', String(view.valueNow))
  visit(parts.root, 'aria-valuetext', view.valueText)
  for (let index = 0; index < view.bars.length && index < parts.bars.length; index += 1) {
    const { bar, fill, hold } = parts.bars[index]
    const drawn = view.bars[index]
    visit(bar, 'title', drawn.title)
    visit(bar, 'data-db', drawn.db)
    if (fill) {
      visit(fill, 'class', drawn.fillClass)
      visit(fill, fillProperty, drawn.fill)
    }
    if (hold) {
      visit(hold, 'class', view.holdClass)
      visit(hold, holdProperty, view.hold)
    }
  }
  if (parts.lamp) visit(parts.lamp, 'data-on', view.clipped ? 'on' : '')
  if (parts.peak) visit(parts.peak, 'text', view.peakText)
  if (parts.lufs) visit(parts.lufs, 'text', view.lufsText)
}

/** What one element holds, place by place: as React last rendered it, and as it stands now. */
interface PlaceMemo {
  rendered: Partial<Record<MeterPlace, string>>
  shown: Partial<Record<MeterPlace, string>>
}

/** A meter on a source: the reading it shows, and the way a frame draws the next one. */
interface LiveMeter {
  /** The last sample that differed from the one before it. */
  reading: MeterSnapshot
  /** Draws a reading without a render; null until the meter is in the document. */
  draw: ((reading: MeterSnapshot) => void) | null
}

type MeterBarsProps = MeterProps & { reading: MeterSnapshot; live?: LiveMeter }

function MeterBars({
  reading: given,
  live,
  orientation = 'vertical',
  bars,
  floorDb = METER_FLOOR_DB,
  lufsFloor = LUFS_FLOOR,
  hotDb = -6,
  warmDb = -12,
  look = 'bars',
  holdMs = 1500,
  showReadout = true,
  label = 'Level',
  info,
  className,
  style,
  'data-testid': testId,
}: MeterBarsProps) {
  const vertical = orientation === 'vertical'
  const segments = look === 'segments'
  const rootClass = (clipping: boolean): string =>
    cx(
      'lm-meter',
      vertical ? 'lm-meter--vertical' : 'lm-meter--horizontal',
      segments && 'lm-meter--segments',
      clipping && 'lm-meter--clip',
      className,
    )
  const scale: MeterScale = {
    rootClass: rootClass(false),
    clipClass: rootClass(true),
    bars,
    floorDb,
    lufsFloor,
    hotDb,
    vertical,
    segments,
  }
  const fillProperty: FillProperty = segments ? 'clipPath' : vertical ? 'height' : 'width'
  const holdProperty: HoldProperty = vertical ? 'bottom' : 'left'

  // Peak hold: the highest peak of the last `holdMs`, kept in a ref because it
  // is derived from readings over time, not from state.
  const hold = useRef({ db: Number.NEGATIVE_INFINITY, at: 0 })
  // The clip lamp: once the signal has clipped it stays lit until the meter is
  // clicked. A latch in a ref, like the hold; a click draws again to show it.
  const clipped = useRef(false)
  const [, redraw] = useReducer((count: number) => count + 1, 0)
  const clearClip = (): void => {
    clipped.current = false
    redraw()
  }

  /** A reading as it is drawn now. The hold and the latch move on with every reading drawn. */
  const draw = (next: MeterSnapshot): MeterView => {
    if (holdMs > 0) hold.current = heldPeak(hold.current, next.peakDb, nowMs(), holdMs)
    const holdDb = holdMs > 0 ? hold.current.db : Number.NEGATIVE_INFINITY
    const clipping = next.peakDb >= 0 || next.truePeakDb > 0
    if (clipping) clipped.current = true
    return meterView(next, scale, holdDb, clipping, clipped.current)
  }
  // A meter on a source renders the reading of the latest frame, not the one of its last render.
  const reading = live ? live.reading : given
  const view = draw(reading)

  const root = useRef<HTMLDivElement>(null)
  const memos = useRef<Map<HTMLElement, PlaceMemo> | null>(null)
  // After every render of a meter on a source: note what each element holds,
  // and hand the frames a way to draw the readings that follow.
  useIsomorphicLayoutEffect(() => {
    if (!live || !root.current) return
    const parts = meterParts(root.current)
    // React writes a prop only when it differs from the one of its last
    // render. A place it left alone may hold a later reading a frame wrote,
    // and that one is brought up to this render here.
    const before = memos.current
    const held = new Map<HTMLElement, PlaceMemo>()
    eachPlace(parts, view, fillProperty, holdProperty, (element, place, value) => {
      let memo = held.get(element)
      if (!memo) {
        memo = { rendered: {}, shown: {} }
        held.set(element, memo)
      }
      const last = before?.get(element)
      if (last?.rendered[place] === value && last.shown[place] !== value) {
        writePlace(element, place, value)
      }
      memo.rendered[place] = value
      memo.shown[place] = value
    })
    memos.current = held
    live.draw = (next) => {
      const target = draw(next)
      // An element to add or remove is React's to do: it renders this reading.
      if (target.holdShown !== view.holdShown || target.hasLufs !== view.hasLufs) {
        redraw()
        return
      }
      eachPlace(parts, target, fillProperty, holdProperty, (element, place, value) => {
        const memo = held.get(element)
        if (!memo || memo.shown[place] === value) return
        writePlace(element, place, value)
        memo.shown[place] = value
      })
    }
    // A frame that came between this render and its commit was drawn before it.
    if (live.reading !== reading) live.draw(live.reading)
    return () => {
      live.draw = null
    }
  })

  // Where the warm and the hot zone start, along the dB scale of the bars.
  const zones = segments
    ? ({
        '--lm-meter-warm-at': `${dbToMeterPosition(Math.min(warmDb, hotDb), floorDb, 0) * 100}%`,
        '--lm-meter-hot-at': `${dbToMeterPosition(hotDb, floorDb, 0) * 100}%`,
      } as CSSProperties)
    : null

  return (
    <div
      ref={root}
      className={view.rootClass}
      style={zones ? { ...zones, ...style } : style}
      onClick={segments ? clearClip : undefined}
      role="meter"
      aria-label={label}
      aria-valuemin={floorDb}
      aria-valuemax={0}
      aria-valuenow={view.valueNow}
      aria-valuetext={view.valueText}
      data-testid={testId}
      {...infoProps(label, info ?? meterInfo(view.kinds, hotDb, segments ? warmDb : undefined))}
    >
      <div className="lm-meter__bars">
        {view.bars.map((bar) => (
          <div
            key={bar.kind}
            className={cx('lm-meter__bar', `lm-meter__bar--${bar.kind}`)}
            title={bar.title}
            data-kind={bar.kind}
            data-db={bar.db}
          >
            <span
              aria-hidden="true"
              className={bar.fillClass}
              style={{ [fillProperty]: bar.fill }}
            />
            {bar.kind === 'peak' && view.holdShown ? (
              <span
                aria-hidden="true"
                className={view.holdClass}
                style={{ [holdProperty]: view.hold }}
              />
            ) : null}
          </div>
        ))}
        {segments ? (
          <span
            aria-hidden="true"
            className="lm-meter__clip"
            data-on={view.clipped ? '' : undefined}
            data-testid={testId ? `${testId}-clip` : undefined}
          />
        ) : null}
      </div>
      {showReadout ? (
        <div className="lm-meter__readout">
          <span className="lm-meter__value lm-meter__value--peak">{view.peakText}</span>
          {view.hasLufs ? (
            <span className="lm-meter__value lm-meter__value--lufs">{view.lufsText} LU</span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/**
 * A meter on a source. It samples the source on frames as `useMeter` does,
 * and hands each new reading to the bars to draw instead of rendering it.
 */
function SourceMeter({ source, fps, active = true, ...rest }: MeterProps) {
  const target = useEnginePart(source, (engine) => engine.master, 'useMeter')
  const frame = useFrameScheduler()
  const [live] = useState<LiveMeter>(() => ({ reading: readMeter(target), draw: null }))
  const latest = useRef(target)
  latest.current = target
  const intervalMs = frameIntervalMs(fps)

  useEffect(() => {
    const sample = (): MeterSnapshot => readMeter(latest.current)
    const show = (next: MeterSnapshot): void => {
      if (shallowEqual(live.reading, next)) return
      live.reading = next
      live.draw?.(next)
    }
    // While inactive the source is read once, so the meter shows where it stands.
    if (!active) {
      show(sample())
      return
    }
    return subscribeFrameSampled(frame, intervalMs, sample, show)
  }, [active, intervalMs, frame, live])

  return <MeterBars {...rest} reading={live.reading} live={live} />
}

/** Peak / RMS / LUFS / true-peak bars for a meter source or an explicit reading. */
export function Meter(props: MeterProps) {
  if (props.reading) return <MeterBars {...props} reading={props.reading} />
  return <SourceMeter {...props} />
}
