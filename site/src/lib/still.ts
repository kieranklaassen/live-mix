// A lab rendered in Node on a bench source, and the pictures drawn from the render: a lesson's
// stills and its opening picture, the home tiles' pictures and the loop row's. All of it runs
// when the site is built, and in the lab tests, so a still costs the browser nothing and is in
// the page with scripts off. A picture is inline SVG whose colours are the role variables of
// styles/site.css, so it follows the scheme. Nothing here needs the framework.
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { DIGIT, EDGE, topEdge } from '../figures/canvas.ts'
import {
  AUDIBLE,
  leftSaid,
  levelsKey,
  loopAxis,
  minMaxPlaced,
  rangeOf,
  roomyAxis,
  tickLabels,
  ticks,
  tidyFloor,
  toUnit,
  type Axis,
} from '../figures/draw.ts'
import { ROLE_VAR, ROLES, tapRefs, type Role, type TapRef } from '../figures/roles.ts'
import { CONTROL_PERIOD, SAMPLE_RATE } from '../lab/rate.ts'
import { withRoom } from '../lab/room.ts'
import type { LabDescription, TapInfo } from '../lab/describe.ts'
import {
  loadLab,
  type Lab,
  type RenderResult,
  type Source,
  type TapData,
  type Values,
} from '../lab/runner.ts'
import { NO_SOURCE } from '../lab/sources.ts'
import { BUILD, isBuilt } from '../lab/store.ts'
import { labInfo } from './lab-info.ts'
import {
  checkSettings,
  lessonSettings,
  PICTURE_VIEWS,
  setNamed,
  SETTINGS_DIR,
  stemsNamed,
  type TileEntry,
} from './settings.ts'
import { REPO_ROOT } from './site.ts'

export type PictureView = (typeof PICTURE_VIEWS)[number]

// ---- a lab and a bench source, in Node ----------------------------------------------------

/** A built lab's file. A missing one means the labs were not built first. */
function labFile(name: string): string {
  const file = path.join(REPO_ROOT, 'site/public/labs', `${name}.wasm`)
  if (!fs.existsSync(file)) {
    throw new Error(`site/public/labs/${name}.wasm is missing: run \`pnpm labs\` in site/ first.`)
  }
  return file
}

/** A lab's file and its time of writing: a lab built again while `pnpm dev` runs is read again. */
const stampOf = (name: string) => `${name}@${fs.statSync(labFile(name)).mtimeMs}`

const labs = new Map<string, Promise<Lab>>()

function builtLab(name: string): Promise<Lab> {
  const key = stampOf(name)
  let found = labs.get(key)
  if (!found) {
    // The one lab that takes a second signal takes the engine's room, as the page's worker hands it.
    found = loadLab(fs.readFileSync(labFile(name))).then(withRoom)
    labs.set(key, found)
  }
  return found
}

export function silence(frames: number): Source {
  return { left: new Float32Array(frames), right: new Float32Array(frames) }
}

/** What the bench played, by the loop's length in frames: a length is played once. */
const played = new WeakMap<Lab, Map<number, RenderResult>>()

/**
 * A source as the page plays it: a loop or a test signal from the bench (site/labs/bench.cpp),
 * by its id in site/src/lab/sources.ts. This is what a lesson's lab is fed in the browser.
 */
export async function benchSource(id: string, frames: number): Promise<Source> {
  const bench = await builtLab('bench')
  const lengths = played.get(bench) ?? new Map<number, RenderResult>()
  played.set(bench, lengths)
  let result = lengths.get(frames)
  if (!result) {
    result = bench.render(silence(frames), {}, frames)
    lengths.set(frames, result)
  }
  const tap = result.taps[id]
  if (!tap) throw new Error(`The bench plays no source called ${id}`)
  return { left: tap.channels_data[0]!, right: tap.channels_data[1] ?? tap.channels_data[0]! }
}

/** What a still is rendered from: a lab, the source put through it, the loop's length, the values. */
export interface StillAsk {
  lab: string
  /** A source of the bench by id, or `none` for a lab that plays by itself. */
  source: string
  seconds: number
  /** Control values by id; one left out is at the lab's starting value. */
  values?: Values
}

/** A lab's render in Node, as the page's worker would have made it. */
export interface StillRender extends StillAsk {
  result: RenderResult
  /**
   * The average spectrum of an audio tap of this render, in dB per bin up to half the rate: of
   * its left channel, or of the channel given, counted from 0.
   */
  spectrum(tap: string, channel?: number): Float32Array
}

/** How many renders are kept: a render holds every tap of a lab, tens of megabytes of samples. */
const KEPT = 6
const renders = new Map<string, Promise<StillRender>>()
/** The render a lab made last: a spectrum can be asked only of that one. */
const last = new WeakMap<Lab, RenderResult>()

/**
 * A lab rendered on a bench source at the values given. Kept by lab, values and source, so the
 * stills of one lesson that show one set are one render.
 */
export function renderStill(ask: StillAsk): Promise<StillRender> {
  const values = Object.entries(ask.values ?? {})
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
  const key = JSON.stringify([stampOf(ask.lab), ask.source, ask.seconds, values])
  let found = renders.get(key)
  renders.delete(key)
  if (!found) {
    found = (async () => {
      const lab = await builtLab(ask.lab)
      const frames = Math.round(ask.seconds * SAMPLE_RATE)
      const source =
        ask.source === NO_SOURCE.id ? silence(frames) : await benchSource(ask.source, frames)
      const given = Object.fromEntries(values)
      const result = lab.render(source, given, frames)
      last.set(lab, result)
      const spectra = new Map<string, Float32Array>()
      const spectrum = (tap: string, channel = 0) => {
        const kept = `${channel} ${tap}`
        let made = spectra.get(kept)
        if (!made) {
          // The lab works a spectrum out of its last render: when it has rendered something
          // else since, it renders this again first.
          if (last.get(lab) !== result) {
            lab.render(source, given, frames)
            last.set(lab, result)
          }
          made = lab.spectrum(tap, channel)
          spectra.set(kept, made)
        }
        return made
      }
      return { ...ask, result, spectrum }
    })()
  }
  // The one just asked for is the newest; the oldest goes when there are too many.
  renders.set(key, found)
  if (renders.size > KEPT) renders.delete(renders.keys().next().value!)
  return found
}

// ---- the drawing ---------------------------------------------------------------------------

/** One line of a picture's key: a tap by name, in its role's colour. */
export interface KeyLine {
  id: string
  name: string
  role: Role
  dashed?: boolean
}

/** The numbers along one side of a picture: where each stands, 0 to 1, and a word for the side. */
export interface Numbers {
  ticks: { at: number; text: string }[]
  title: string
}

/** A picture drawn from a render. `grid` and `lines` are the inside of an SVG `width` by `height`. */
export interface Picture {
  width: number
  height: number
  grid: string
  lines: string
  x: Numbers
  y: Numbers
  key: KeyLine[]
  /**
   * Said under the key where the lines alone do not say it: what a picture of levels means, or
   * that a sound of two channels is drawn by its left alone.
   */
  note?: string
  /** The note stands beside a ramp of the picture's levels, the quietest shown to the loudest. */
  ramp?: boolean
  /** What the picture shows, for a reader who cannot see it. */
  label: string
}

export interface PictureAsk {
  taps: TapRef[]
  view: PictureView
  /** The span of time drawn, in seconds: where it starts, and its length (to the loop's end when left out). */
  from?: number
  span?: number
  /**
   * The vertical range, in the view's own unit: decibels for a spectrum and for the levels of a
   * spectrogram, the curve's unit for a curve, amplitude for a wave. An end left out is fitted.
   */
  min?: number
  max?: number
  /** The highest frequency drawn, in hertz, by a spectrum and a spectrogram. Fitted when left out. */
  top?: number
  /**
   * How a spectrum lays its frequencies out: in even ratios from 20 Hz (`log`, and when left
   * out), or evenly from 0 Hz to its `top` (`linear`), where harmonics stand evenly.
   */
  scale?: 'log' | 'linear'
  /**
   * What runs along the bottom, in a word or two, in place of the view's own word: a curve has
   * none of its own, and a picture of colour says "seconds".
   */
  xTitle?: string
  /**
   * Taps drawn as a dot on a stem for each point, for a signal shown sample by sample: every
   * tap (`true`), or those named by id. Against time and for a curve.
   */
  stems?: boolean | readonly string[]
  /**
   * What stands over the y axis, in a word or two, in place of the tap's own unit: for a curve
   * or a value whose unit belongs to the other axis. Against time and for a curve.
   */
  yTitle?: string
  /**
   * Which channels of a sound that has two are drawn, against time and as a spectrum: its left
   * alone (`left`, and when left out), which the picture then says; or `both`, each a line of
   * its own that the key names.
   */
  channels?: 'left' | 'both'
}

/** How a picture is laid out: how many columns of points it has, and whether its axes are round. */
interface Layout {
  columns: number
  /** A lesson's still has axes with round ends, for its numbers; a tile's fits its lines closely. */
  round: boolean
}
const STILL: Layout = { columns: 400, round: true }
const TILE: Layout = { columns: 160, round: false }
const HEIGHT = 200

interface Line extends KeyLine {
  ys: ArrayLike<number>
  x0: number
  x1: number
  /** The points stand in even ratios from `x0` to `x1`. */
  xLog?: boolean
  /** A further curve of a tap that holds several: drawn, and named in the key by the first. */
  more?: boolean
  /** Each point as a dot on a stem from zero. */
  stems?: boolean
  /** Where the points are many, the line along their tops and not the band they fill. */
  outline?: boolean
}

/**
 * The lowest level a lab writes: `kFloorDb` of site/labs/lab.h, where `to_db` puts silence. A
 * still of a level does not run its axis below it.
 */
const FLOOR_DB = -140

/** Whether a picture draws this tap as stems. */
const stemmed = (ask: PictureAsk, id: string) =>
  ask.stems === true || (Array.isArray(ask.stems) && ask.stems.includes(id))

const colour = (role: Role) => `var(${ROLE_VAR[role]})`
const escape = (text: string) =>
  text.replace(/[&<>"]/g, (sign) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot' }[sign]};`)
const clamp = (unit: number) => Math.min(1, Math.max(0, unit))
const fixed = (value: number) => String(Math.round(value * 10) / 10)

/**
 * One line as SVG: a band from the least to the most of each column where the points are many
 * (or the line along its top, for a line drawn in `outline`), a line through the points where
 * they are few, or a stem and a dot for each.
 */
function pathOf(line: Line, x: Axis, y: Axis, width: number): string {
  const { ys } = line
  const n = ys.length
  if (n === 0) return ''
  const xOf = (i: number) =>
    n === 1
      ? line.x0
      : line.xLog
        ? line.x0 * Math.pow(line.x1 / line.x0, i / (n - 1))
        : line.x0 + ((line.x1 - line.x0) * i) / (n - 1)
  const py = (value: number) => (1 - clamp(toUnit(y, value))) * HEIGHT
  const stroke = `stroke:${colour(line.role)}`

  // Points that stand evenly on an even axis: only those in view count, and are drawn, with one
  // more at each end so that the line runs off the picture and does not stop short of its edge.
  let first = 0
  let last = n - 1
  if (!x.log && !line.xLog && line.x1 !== line.x0 && n > 1) {
    const at = (value: number) => ((value - line.x0) / (line.x1 - line.x0)) * (n - 1)
    const [a, b] = [at(x.min), at(x.max)]
    first = Math.max(0, Math.floor(Math.min(a, b) + 1e-9) - 1)
    last = Math.min(n - 1, Math.ceil(Math.max(a, b) - 1e-9) + 1)
  }
  const inView = last - first + 1
  if (inView <= 0) return ''

  if (inView > 3 * width) {
    const ends = minMaxPlaced(ys, (i) => toUnit(x, xOf(i)), width, first, last + 1)
    const filled: number[] = []
    for (let col = 0; col < width; col += 1) if (!Number.isNaN(ends[2 * col])) filled.push(col)
    if (filled.length === 0) return ''
    if (line.outline) {
      const tops = filled.map((col) => `${col + 0.5},${fixed(py(ends[2 * col + 1]!))}`)
      return `<path d="M${tops.join('L')}" vector-effect="non-scaling-stroke" style="fill:none;${stroke};stroke-width:1.6;stroke-linejoin:round"/>`
    }
    const tops = filled.map((col) => `${col + 0.5},${Math.round(py(ends[2 * col + 1]!))}`)
    const bottoms = filled.map((col) => `${col + 0.5},${Math.round(py(ends[2 * col]!))}`).reverse()
    return `<path d="M${tops.join('L')}L${bottoms.join('L')}Z" vector-effect="non-scaling-stroke" style="fill:${colour(line.role)};fill-opacity:0.85;${stroke};stroke-width:1"/>`
  }

  if (line.stems) {
    // A stem from zero, or from the edge of the picture nearest it, to each point in view; and
    // a dot on its end where the points are few enough to tell apart. A dot is a line of no
    // length with round ends, which stays round however the picture is stretched.
    const zero = fixed(py(Math.min(Math.max(0, y.min), y.max)))
    let stems = ''
    let dots = ''
    for (let i = first; i <= last; i += 1) {
      const value = ys[i]!
      const unit = toUnit(x, xOf(i))
      if (!Number.isFinite(value) || !(unit >= -1e-9 && unit <= 1 + 1e-9)) continue
      const at = fixed(clamp(unit) * width)
      stems += `M${at},${zero}V${fixed(py(value))}`
      dots += `M${at},${fixed(py(value))}h0`
    }
    if (stems === '') return ''
    // A stem is one pixel wide. Drawn with crisp edges it fills one column of pixels wherever
    // it falls, however the picture is stretched; smoothed, a stem between two columns is
    // spread thin over both, and the stems of one picture differ in weight.
    const stalks = `<path d="${stems}" vector-effect="non-scaling-stroke" shape-rendering="crispEdges" style="fill:none;${stroke};stroke-width:1"/>`
    if (inView >= width / 5) return stalks
    return `${stalks}<path d="${dots}" vector-effect="non-scaling-stroke" style="fill:none;${stroke};stroke-width:4.4;stroke-linecap:round"/>`
  }

  let d = ''
  let pen = false
  for (let i = first; i <= last; i += 1) {
    const value = ys[i]!
    const at = toUnit(x, xOf(i)) * width
    if (!Number.isFinite(value) || !Number.isFinite(at)) {
      pen = false
      continue
    }
    d += `${pen ? 'L' : 'M'}${fixed(at)},${fixed(py(value))}`
    pen = true
  }
  const dashes = line.dashed ? ';stroke-dasharray:5 4' : ''
  return `<path d="${d}" vector-effect="non-scaling-stroke" style="fill:none;${stroke};stroke-width:1.6;stroke-linejoin:round${dashes}"/>`
}

/** The numbers of an axis, and the grid lines that stand at them. */
function numbersOf(axis: Axis, count: number, title: string): Numbers {
  return {
    ticks: ticks(axis, count).map((value, index, all) => ({
      at: toUnit(axis, value),
      text: tickLabels(all)[index]!,
    })),
    title,
  }
}

function gridOf(x: Numbers, y: Numbers, width: number): string {
  const hair = 'vector-effect="non-scaling-stroke" style="fill:none;stroke-width:1;stroke:'
  const across = y.ticks
    .map(({ at, text }) => {
      const line = text === '0' ? 'var(--sig-grid)' : 'var(--lm-grid-line)'
      return `<path d="M0,${fixed((1 - at) * HEIGHT)}H${width}" ${hair}${line}"/>`
    })
    .join('')
  const up = x.ticks
    .map(({ at }) => `<path d="M${fixed(at * width)},0V${HEIGHT}" ${hair}var(--lm-grid-line)"/>`)
    .join('')
  return `${across}${up}<rect width="${width}" height="${HEIGHT}" ${hair}var(--sig-grid)"/>`
}

/** An axis that holds `lo` to `hi`: with round ends for a still, closely for a tile. */
function axisFor(lo: number, hi: number, layout: Layout): Axis {
  if (layout.round || !(hi > lo)) return roomyAxis(lo, hi)
  const room = (hi - lo) * 0.04
  return { min: lo - room, max: hi + room }
}

/**
 * The vertical range of a picture: the one fitted to it, with each end the picture is given
 * (`min`, `max`) in its place. Stops the build, naming the lesson, on a range that does not run
 * upwards.
 */
function rangeAsked<A extends Axis>(fitted: A, ask: PictureAsk, lesson: string): A {
  if (ask.min === undefined && ask.max === undefined) return fitted
  const min = ask.min ?? fitted.min
  const max = ask.max ?? fitted.max
  if (!(min < max)) {
    throw new Error(
      `${lesson}: a picture's range runs from ${min} to ${max}: its min must be below its max.`,
    )
  }
  return { ...fitted, min, max }
}

/**
 * The highest frequency a picture draws: the `top` it is given, or the one fitted to it. Stops
 * the build, naming the lesson, on a top the picture cannot reach: one not above where its
 * frequencies start, or above half the sample rate.
 */
function topAsked(fitted: number, ask: PictureAsk, lesson: string, above = 0): number {
  if (ask.top === undefined) return fitted
  const nyquist = SAMPLE_RATE / 2
  if (!(ask.top > above && ask.top <= nyquist)) {
    throw new Error(
      `${lesson}: a picture's top is ${ask.top} Hz: it must be above ${above} Hz and at most ${nyquist} Hz, half the sample rate.`,
    )
  }
  return ask.top
}

const joined = (taps: readonly { name: string }[]) => taps.map((tap) => tap.name).join(' and ')

/** One line a picture of sound draws: the tap as the key names it, and the channel it draws. */
interface Side {
  tap: TapRef
  channel: number
  dashed?: boolean
}

/**
 * The lines a picture of sound draws, and what it says of the side it draws. A sound of two
 * channels is drawn by its left, and the picture says so. Where the picture is asked for both
 * (`channels: 'both'`), each channel is a line the key names, the right in a role no other line
 * of the picture has, and dashed in the tap's own once every role is taken.
 */
function sidesOf(render: StillRender, ask: PictureAsk): { sides: Side[]; said?: string } {
  const two = (tap: TapRef) => {
    const found = render.result.taps[tap.id]
    return found?.kind === 'audio' && found.channels === 2
  }
  if (ask.channels !== 'both') {
    return {
      sides: ask.taps.map((tap) => ({ tap, channel: 0 })),
      said: leftSaid(ask.taps, ask.taps.filter(two)),
    }
  }
  const taken = new Set<Role>(ask.taps.map((tap) => tap.role))
  const spare: Role[] = ['alt', 'alt2', 'alt3', ...ROLES]
  const sides = ask.taps.flatMap((tap): Side[] => {
    if (!two(tap)) return [{ tap, channel: 0 }]
    const role = spare.find((one) => !taken.has(one))
    if (role) taken.add(role)
    return [
      { tap: { ...tap, name: `${tap.name}, left` }, channel: 0 },
      {
        tap: { ...tap, name: `${tap.name}, right`, role: role ?? tap.role },
        channel: 1,
        dashed: role ? undefined : true,
      },
    ]
  })
  return { sides, said: sides.length > ask.taps.length ? 'left and right' : undefined }
}

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** A picture with what it says of the side it draws: in its label, and under its key for the left alone. */
function sided(picture: Picture, ask: PictureAsk, said: string | undefined): Picture {
  if (!said) return picture
  const label = `${picture.label}, ${said}`
  if (ask.channels === 'both') return { ...picture, label }
  return { ...picture, label, note: capital(said) }
}

/** What a picture of one sound drawn by its left says under its key, and what two such say together. */
const ONE = [{ name: '' }]
const LEFT_OF_ONE = capital(leftSaid(ONE, ONE) ?? '')
const LEFT_OF_EACH = capital(leftSaid([...ONE, ...ONE], [...ONE, ...ONE]) ?? '')

function finish(
  lines: Line[],
  x: Axis,
  y: Axis,
  titles: { x: string; y: string },
  said: string,
  layout: Layout,
): Picture {
  const xs = numbersOf(x, 6, titles.x)
  const ys = numbersOf(y, 4, titles.y)
  return {
    width: layout.columns,
    height: HEIGHT,
    grid: gridOf(xs, ys, layout.columns),
    lines: lines.map((line) => pathOf(line, x, y, layout.columns)).join(''),
    x: xs,
    y: ys,
    key: lines
      .filter((line) => !line.more)
      .map(({ id, name, role, dashed }) => ({ id, name, role, dashed })),
    label: said,
  }
}

/** Signals against time: sound as it is, and a control's value at its own rate. */
function wave(render: StillRender, ask: PictureAsk, layout: Layout, lesson: string): Picture {
  const from = ask.from ?? 0
  const { length, scale, x } = loopAxis(render.result, from, ask.span)
  let lo = Infinity
  let hi = -Infinity
  let sound = false
  const { sides, said } = sidesOf(render, ask)
  const lines: Line[] = sides.map(({ tap, channel, dashed }) => {
    const found = render.result.taps[tap.id]
    const data = found?.channels_data[channel] ?? new Float32Array(0)
    const step = found?.kind === 'control' ? CONTROL_PERIOD : 1
    const a = Math.max(0, Math.floor((from * SAMPLE_RATE) / step))
    const b = Math.min(data.length, Math.ceil(((from + length) * SAMPLE_RATE) / step) + 1)
    const ys = data.subarray(a, Math.max(a, b))
    const [least, most] = rangeOf(ys)
    lo = Math.min(lo, least)
    hi = Math.max(hi, most)
    sound ||= found?.kind === 'audio'
    return {
      ...tap,
      ...(dashed ? { dashed } : {}),
      ys,
      x0: ((a * step) / SAMPLE_RATE) * scale,
      x1: (((b - 1) * step) / SAMPLE_RATE) * scale,
      stems: stemmed(ask, tap.id),
    }
  })
  // Sound swings about zero, so zero stays in the middle; a control's value is fitted as it lies.
  const top = Math.max(Math.abs(lo), Math.abs(hi)) || 1
  const fitted = sound ? axisFor(-top, top, layout) : axisFor(lo, hi, layout)
  // A level in decibels rests on a floor while nothing sounds. Its axis starts where the level
  // does, at a round number just under its lowest value, and not a whole step of the grid
  // below that: a level that rests on −120 dB is not drawn on an axis that runs to −200.
  const levels = !sound && ask.taps.every((tap) => tap.unit === 'dB')
  if (levels && layout.round && hi > lo) fitted.min = tidyFloor(lo, hi, FLOOR_DB)
  const y = rangeAsked(fitted, ask, lesson)
  const unit = sound ? '' : (ask.taps[0]?.unit ?? '')
  const titles = { x: ask.xTitle ?? x.title, y: ask.yTitle ?? unit }
  return sided(finish(lines, x, y, titles, `${joined(ask.taps)} against time`, layout), ask, said)
}

/** How much of each frequency: a sound's average spectrum, or a spectrum the lab worked out. */
function spectrum(render: StillRender, ask: PictureAsk, layout: Layout, lesson: string): Picture {
  // In even ratios across the audible band, or evenly from 0 Hz where the picture asks for it.
  const x: Axis =
    ask.scale === 'linear'
      ? { min: 0, max: topAsked(SAMPLE_RATE / 2, ask, lesson) }
      : { ...AUDIBLE, max: topAsked(AUDIBLE.max, ask, lesson, AUDIBLE.min) }
  // Two bands lie one over the other where the points are many, and read as one: where there is
  // more than one tap, each is the line along its top.
  const { sides, said } = sidesOf(render, ask)
  const outline = sides.length > 1
  let lo = Infinity
  let hi = -Infinity
  const lines: Line[] = sides.map(({ tap, channel, dashed }) => {
    const found = render.result.taps[tap.id]
    const line: Line =
      found?.kind === 'audio'
        ? {
            ...tap,
            ...(dashed ? { dashed } : {}),
            ys: render.spectrum(tap.id, channel),
            x0: 0,
            x1: SAMPLE_RATE / 2,
            outline,
          }
        : {
            ...tap,
            ys: found?.channels_data[0] ?? new Float32Array(0),
            x0: found?.x0 ?? 0,
            x1: found?.x1 ?? 1,
            xLog: found?.log,
            outline,
          }
    // Only what stands in the band drawn sets the height.
    const n = line.ys.length
    for (let i = 0; i < n; i += 1) {
      const at = line.xLog
        ? line.x0 * Math.pow(line.x1 / line.x0, i / (n - 1))
        : line.x0 + ((line.x1 - line.x0) * i) / (n - 1)
      const value = line.ys[i]!
      if (at < x.min || at > x.max || !Number.isFinite(value)) continue
      lo = Math.min(lo, value)
      hi = Math.max(hi, value)
    }
    return line
  })
  if (!(hi >= lo)) [lo, hi] = [-96, 0]
  // The quietest 90 dB under the loudest point are below anything a picture can show.
  const y = rangeAsked(axisFor(Math.max(lo, hi - 90), hi, layout), ask, lesson)
  const titled = `The spectrum of ${joined(ask.taps)}`
  return sided(finish(lines, x, y, { x: 'hertz', y: 'decibels' }, titled, layout), ask, said)
}

/**
 * One value against another: the lab says what the first and the last point stand at. The
 * picture may ask for a stretch of the curve, `from` a place along it and `span` long, in the
 * curve's own unit: its height is then fitted to that stretch.
 */
function curve(render: StillRender, ask: PictureAsk, layout: Layout, lesson: string): Picture {
  let x0 = Infinity
  let x1 = -Infinity
  const lines: Line[] = ask.taps.flatMap((tap, index) => {
    const found = render.result.taps[tap.id]
    const ys = found?.channels_data[0] ?? new Float32Array(0)
    x0 = Math.min(x0, found?.x0 ?? 0)
    x1 = Math.max(x1, found?.x1 ?? 1)
    const line: Line = {
      ...tap,
      ys,
      x0: found?.x0 ?? 0,
      x1: found?.x1 ?? 1,
      xLog: found?.log,
      // A curve the lesson wrote to hold the device's against is the dashed one, as in a live figure.
      dashed: tap.origin === 'lesson' && index > 0,
      stems: stemmed(ask, tap.id),
    }
    // A tap of columns (the lab's `kFrames`) holds a curve a column, each from `x0` to `x1`, as
    // the windows of overlapping frames are: every one is drawn, and the key names the tap once.
    const columns = found?.kind === 'frames' ? found.columns : 1
    if (columns < 2) return [line]
    const rows = Math.floor(ys.length / columns)
    return Array.from({ length: columns }, (_, column) => ({
      ...line,
      ys: ys.subarray(column * rows, (column + 1) * rows),
      more: column > 0,
    }))
  })
  const whole = ask.from === undefined && ask.span === undefined
  const min = ask.from ?? x0
  const x = {
    min,
    max: ask.span === undefined ? x1 : min + ask.span,
    log: lines.every((line) => line.xLog),
  }
  // The height holds every point of the whole curve, or only those of the stretch asked for.
  let lo = Infinity
  let hi = -Infinity
  for (const line of lines) {
    const n = line.ys.length
    let [least, most] = rangeOf(line.ys)
    if (!whole) {
      least = Infinity
      most = -Infinity
      for (let i = 0; i < n; i += 1) {
        const at =
          n === 1
            ? line.x0
            : line.xLog
              ? line.x0 * Math.pow(line.x1 / line.x0, i / (n - 1))
              : line.x0 + ((line.x1 - line.x0) * i) / (n - 1)
        const value = line.ys[i]!
        if (at < x.min || at > x.max || !Number.isFinite(value)) continue
        least = Math.min(least, value)
        most = Math.max(most, value)
      }
    }
    lo = Math.min(lo, least)
    hi = Math.max(hi, most)
  }
  if (!(hi >= lo)) [lo, hi] = [0, 0]
  const y = rangeAsked(axisFor(lo, hi, layout), ask, lesson)
  const titles = { x: ask.xTitle ?? '', y: ask.yTitle ?? ask.taps[0]?.unit ?? '' }
  return finish(lines, x, y, titles, joined(ask.taps), layout)
}

/** A picture of one grey a point, as a PNG in a `data:` address: all an SVG mask needs. */
function greyPng(width: number, height: number, grey: Uint8Array): string {
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const whole = Buffer.alloc(body.length + 8)
    whole.writeUInt32BE(data.length, 0)
    body.copy(whole, 4)
    whole.writeUInt32BE(zlib.crc32(body), body.length + 4)
    return whole
  }
  const head = Buffer.alloc(13)
  head.writeUInt32BE(width, 0)
  head.writeUInt32BE(height, 4)
  head[8] = 8 // bits a point; the rest stay 0: grey, deflate, no filter, not interlaced
  const rows = Buffer.alloc((width + 1) * height)
  for (let row = 0; row < height; row += 1) {
    rows.set(grey.subarray(row * width, (row + 1) * width), row * (width + 1) + 1)
  }
  const file = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', head),
    chunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
  return `data:image/png;base64,${file.toString('base64')}`
}

/** The most points a picture of colour is kept at, across and up. */
const CELLS = { across: 256, up: 128 }

/**
 * A spectrum as it changes: time across, frequency up, level as colour. The lab lays it out in
 * columns. The colour runs from the page's own, through the control role's, to the output
 * role's, as the live figure's does: each of the two is a flat colour seen through a mask, so
 * the picture follows the scheme. The levels shown are the loudest 60 dB, and the frequencies
 * those that hold anything within 40 dB of the loudest point, unless the picture is given its
 * levels (`min`, `max`) or its highest frequency (`top`).
 */
function spectrogram(
  render: StillRender,
  ask: PictureAsk,
  layout: Layout,
  lesson: string,
): Picture {
  const tap = ask.taps[0]!
  const found = render.result.taps[tap.id]
  const data = found?.channels_data[0]
  if (!found || !data || found.kind !== 'frames' || found.columns < 1) {
    throw new Error(
      `${lesson}: a still draws "${tap.id}" as a spectrogram, and the lab does not write it as a picture.`,
    )
  }
  const columns = found.columns
  const rows = Math.floor(data.length / columns)
  const from = ask.from ?? found.x0
  const to = ask.span === undefined ? found.x1 : from + ask.span
  const colAt = (time: number) => ((time - found.x0) / (found.x1 - found.x0 || 1)) * columns
  const firstCol = Math.max(0, Math.floor(colAt(from)))
  const lastCol = Math.max(firstCol + 1, Math.min(columns, Math.ceil(colAt(to))))

  let loudest = -Infinity
  for (let col = firstCol; col < lastCol; col += 1) {
    for (let row = 0; row < rows; row += 1) loudest = Math.max(loudest, data[col * rows + row]!)
  }
  let highest = 0
  for (let col = firstCol; col < lastCol; col += 1) {
    for (let row = rows - 1; row > highest; row -= 1) {
      if (data[col * rows + row]! > loudest - 40) highest = row
    }
  }
  const nyquist = SAMPLE_RATE / 2
  const reached = roomyAxis(0, Math.max(1000, (highest / (rows - 1)) * nyquist)).max
  const top = topAsked(Math.min(nyquist, reached), ask, lesson)
  const rowsShown = Math.max(1, Math.round((top / nyquist) * (rows - 1)) + 1)
  const ceiling = Math.ceil(loudest)
  const { min, max } = rangeAsked({ min: ceiling - 60, max: ceiling }, ask, lesson)

  // Each point of the kept picture holds the loudest of the cells it covers.
  const across = Math.min(CELLS.across, lastCol - firstCol)
  const up = Math.min(CELLS.up, rowsShown)
  const middle = new Uint8Array(across * up)
  const loud = new Uint8Array(across * up)
  for (let i = 0; i < across; i += 1) {
    const colA = firstCol + Math.floor((i * (lastCol - firstCol)) / across)
    const colB = Math.max(
      colA + 1,
      firstCol + Math.floor(((i + 1) * (lastCol - firstCol)) / across),
    )
    for (let j = 0; j < up; j += 1) {
      const rowA = Math.floor((j * rowsShown) / up)
      const rowB = Math.max(rowA + 1, Math.floor(((j + 1) * rowsShown) / up))
      let level = -Infinity
      for (let col = colA; col < colB; col += 1) {
        for (let row = rowA; row < rowB; row += 1) level = Math.max(level, data[col * rows + row]!)
      }
      const unit = clamp((level - min) / (max - min))
      const at = (up - 1 - j) * across + i
      middle[at] = Math.round(255 * Math.min(1, unit / 0.6))
      loud[at] = Math.round(255 * Math.max(0, (unit - 0.6) / 0.4))
    }
  }
  const width = layout.columns
  // A mask is found by its id, which a page may hold only once: it is made from the picture itself.
  const id = `still-${createHash('sha1').update(middle).update(loud).digest('hex').slice(0, 10)}`
  const layer = (name: string, grey: Uint8Array, role: Role) =>
    `<mask id="${id}-${name}" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${HEIGHT}">` +
    `<image href="${greyPng(across, up, grey)}" width="${width}" height="${HEIGHT}" preserveAspectRatio="none"/></mask>` +
    `<rect width="${width}" height="${HEIGHT}" mask="url(#${id}-${name})" style="fill:${colour(role)}"/>`

  // The lab's helper lays a picture out over time. A lab that lays one out over something else
  // (a modulator's rate, a place in a sweep) has its lesson say what, as the picture's x title.
  const along = ask.xTitle ?? 'seconds'
  const x = numbersOf({ min: from, max: to }, 6, along)
  const y = numbersOf({ min: 0, max: top }, 4, 'hertz')
  return {
    width,
    height: HEIGHT,
    grid: `<rect width="${width}" height="${HEIGHT}" vector-effect="non-scaling-stroke" style="fill:none;stroke-width:1;stroke:var(--sig-grid)"/>`,
    lines: layer('a', middle, 'ctl') + layer('b', loud, 'out'),
    x,
    y,
    key: [],
    note: levelsKey(tap.name, along, min, max),
    ramp: true,
    label: `${tap.name}: its spectrum over time`,
  }
}

/** A picture of a render: the taps asked for, in the view asked for. `lesson` is for an error's first words. */
export function drawStill(
  render: StillRender,
  ask: PictureAsk,
  lesson: string,
  layout: Layout = STILL,
): Picture {
  if (ask.view === 'spectrum') return spectrum(render, ask, layout, lesson)
  if (ask.view === 'curve') return curve(render, ask, layout, lesson)
  if (ask.view === 'spectrogram') return spectrogram(render, ask, layout, lesson)
  return wave(render, ask, layout, lesson)
}

/**
 * A lesson's still as HTML: the drawing as inline SVG inside the room a live figure leaves for
 * its numbers, and the numbers set in the page's own type at their real size, however wide the
 * picture is shown.
 *
 * An axis's title stands outside the plotted area, as a live figure's does (`drawGrid` in
 * figures/canvas.ts), so that no line can run under it. The y axis's stands over the picture's
 * top left corner, in a row the plotted area makes room for. The x axis's stands at the right of
 * the row of numbers under the picture, and a number that would run into it is not shown.
 */
export function plotHtml(picture: Picture, height = HEIGHT): string {
  const top = topEdge(picture.y.title)
  const inside = `left:${EDGE.left}px;top:${top}px;width:calc(100% - ${EDGE.left + EDGE.right}px);height:calc(100% - ${top + EDGE.bottom}px)`
  const across = (at: number) =>
    `calc(${EDGE.left}px + ${fixed(at * 100)}% - ${fixed(at * (EDGE.left + EDGE.right))}px)`
  const down = (at: number) =>
    `calc(${top}px + ${fixed(at * 100)}% - ${fixed(at * (top + EDGE.bottom))}px)`
  const ys = picture.y.ticks
    .filter(({ at }) => at >= 0 && at <= 1)
    .map(
      ({ at, text }) =>
        `<span style="position:absolute;right:calc(100% - ${EDGE.left - 6}px);top:${down(1 - at)};transform:translateY(-50%)">${text}</span>`,
    )
  // How wide the still is shown is not known here, so a number cannot be left out where it
  // would run into the x title: it is given a width that is nothing at the widths where it
  // would. Its right end is `at` of the way across the plotted area and half its own width on;
  // the title starts its own width in from the plotted area's right end; 6 px stay between.
  const titled = picture.x.title.length * DIGIT
  const hidden = (at: number, text: string) => {
    if (!picture.x.title) return ''
    const room = (text.length * DIGIT) / 2 + titled + 6
    const share = Math.round((1 - at) * 1e4) / 1e4
    return `;max-width:clamp(0px, calc(((100% - ${EDGE.left + EDGE.right}px) * ${share} - ${room}px) * 1000), 99px);overflow:hidden`
  }
  const xs = picture.x.ticks
    .filter(({ at }) => at >= 0 && at <= 1)
    .map(
      ({ at, text }) =>
        `<span style="position:absolute;left:${across(at)};bottom:${EDGE.bottom - 16}px;transform:translateX(-50%)${hidden(at, text)}">${text}</span>`,
    )
  const titles = [
    picture.y.title &&
      `<span style="position:absolute;left:${EDGE.left}px;top:${top - 19}px">${escape(picture.y.title)}</span>`,
    picture.x.title &&
      `<span style="position:absolute;right:${EDGE.right}px;bottom:${EDGE.bottom - 16}px">${escape(picture.x.title)}</span>`,
  ]
  return (
    `<div class="still-plot" style="position:relative;height:${height}px">` +
    `<svg viewBox="0 0 ${picture.width} ${picture.height}" preserveAspectRatio="none" role="img" aria-label="${escape(picture.label)}" style="position:absolute;${inside}">` +
    `${picture.grid}${picture.lines}</svg>` +
    `<div aria-hidden="true" style="font:10px/1 var(--lm-font-mono);color:var(--lm-muted);white-space:nowrap">` +
    `${[...ys, ...xs, ...titles].filter(Boolean).join('')}</div></div>`
  )
}

/** The box a tile's picture is drawn in, and the room left round its lines. */
const TILE_BOX = { width: 200, height: 72, pad: { x: 6, y: 6 } }

/**
 * A tile's picture: the lines alone, with no numbers. The tile's link says what it is; the
 * picture's title says what is drawn, and which side of a sound of two channels.
 */
function tileSvg(picture: Picture): string {
  const { width, height, pad } = TILE_BOX
  return (
    `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true"><title>${escape(picture.label)}</title>` +
    `<svg x="${pad.x}" y="${pad.y}" width="${width - 2 * pad.x}" height="${height - 2 * pad.y}" viewBox="0 0 ${picture.width} ${picture.height}" preserveAspectRatio="none">` +
    `${picture.lines}</svg></svg>`
  )
}

// ---- a lesson's stills, its tile, and the loop row -----------------------------------------

/** What a still needs of a lesson: its id and, of its front matter, the lab, the sources, the loop's length. */
export interface StillLesson {
  id: string
  data: { lab: string; sources: readonly string[]; seconds: number }
}

/** What `<Still>` is given. */
export interface StillProps {
  /** The taps drawn, "in out" or "in level:alt", in the order they are drawn. */
  taps: string
  /** A set of the lesson's settings file, by name. Left out, the lab's starting values. */
  set?: string
  /** Control values by id, laid over the set's. */
  values?: Readonly<Record<string, number>>
  /** One of the lesson's sources. Left out, the set's, and then the lesson's first. */
  source?: string
  view?: PictureView
  from?: number
  span?: number
  /** The vertical range, in the view's own unit; an end left out is fitted. */
  min?: number
  max?: number
  /** The highest frequency drawn by a spectrum and a spectrogram, in hertz; fitted when left out. */
  top?: number
  /** A spectrum's frequencies evenly from 0 Hz to its `top` (`linear`), not in even ratios from 20 Hz. */
  scale?: 'log' | 'linear'
  /** What runs along the bottom, in a word or two, in place of the view's own word. */
  xTitle?: string
  /** Taps drawn as dots on stems, against time and for a curve: all of them, or those named, "frame other". */
  stems?: boolean | string | readonly string[]
  /** What stands over the y axis, in place of the tap's unit, against time and for a curve. */
  yTitle?: string
  /** `both` draws each channel of a sound that has two; left out, its left, which the picture says. */
  channels?: 'left' | 'both'
}

/**
 * The build step a still is drawn at, when its values give one: `build: 3` is the fourth step,
 * as the lab counts them. A named set never moves the build step, so `checkSettings` refuses it;
 * a still is a picture and moves nothing, and this is how one shows a tap of the build path
 * (an id that begins `built`) as it stands at a step. Stops the build, naming the lesson, on a
 * step the lab does not have.
 */
function stepAsked(step: number, description: LabDescription, lesson: string): void {
  const control = description.controls.find((one) => one.id === BUILD)
  if (!control) {
    throw new Error(
      `${lesson}: a still is drawn at build step ${step}, and the lab has no build path.`,
    )
  }
  if (!Number.isInteger(step) || step < control.min || step > control.max) {
    throw new Error(
      `${lesson}: a still is drawn at build step ${step}: the lab's steps are the whole numbers ${control.min} to ${control.max}.`,
    )
  }
}

/**
 * The picture a `<Still>` of a lesson shows. Stops the build, naming the lesson, on a tap the lab
 * does not have, a set the lesson's file does not have, a control or a value the lab does not
 * take, a build step the lab does not have, a source the lesson does not list, stems for a tap
 * the still does not draw, and a range or a top that makes no sense.
 */
export async function lessonStill(
  lesson: StillLesson,
  props: StillProps,
  dir = SETTINGS_DIR,
): Promise<Picture> {
  const description = await labInfo(lesson.data.lab, lesson.id)
  const taps = tapRefs(props.taps, description.taps, lesson.id)
  const named =
    props.set === undefined
      ? undefined
      : setNamed(await lessonSettings(lesson, dir), props.set, lesson.id)
  const values = { ...named?.values, ...props.values }
  const source = props.source ?? named?.source ?? lesson.data.sources[0]!
  // Held to the lab as a set of the lesson's file is: a still is a set written in the text.
  // The build step is the one control a set may not name and a still may.
  const { [BUILD]: step, ...set } = values
  checkSettings(
    { sets: { 'a still': { label: 'a still', values: set, source } } },
    description,
    lesson.data.sources,
    lesson.id,
  )
  if (step !== undefined) stepAsked(step, description, lesson.id)
  const stems = stemsNamed(props.stems)
  for (const id of Array.isArray(stems) ? stems : []) {
    if (!taps.some((tap) => tap.id === id)) {
      throw new Error(
        `${lesson.id}: a still draws stems for "${id}", which is not one of its taps. They are: ${taps.map((tap) => tap.id).join(', ')}`,
      )
    }
  }
  const render = await renderStill({
    lab: lesson.data.lab,
    source,
    seconds: lesson.data.seconds,
    values,
  })
  const { from, span, min, max, top, scale, xTitle, yTitle, channels } = props
  const view = props.view ?? 'wave'
  const ask = { taps, view, from, span, min, max, top, scale, xTitle, yTitle, stems, channels }
  return drawStill(render, ask, lesson.id)
}

/** What the picture a lesson opens on is given: the `opening` of the lesson's front matter. */
export interface OpeningProps {
  /** The tap of the sound going in, and the tap of what comes out, by id. */
  input: string
  output: string
  /** As a still's: `wave` (against time) when left out. */
  view?: PictureView
  from?: number
  span?: number
  min?: number
  max?: number
  top?: number
  /** As a still's too: a spectrum's scale, the words on the two axes, stems, and both channels. */
  scale?: 'log' | 'linear'
  xTitle?: string
  yTitle?: string
  stems?: boolean | string | readonly string[]
  channels?: 'left' | 'both'
  /** The two taps apart, one picture above the other, each on a vertical range of its own. */
  separate?: boolean
  /**
   * The sounds the two pictures are of, going in and coming out, by tap id, where the taps drawn
   * are not sound themselves (a spectrogram's): each then has its button to hear it.
   */
  hear?: readonly [string, string]
}

/**
 * The picture a lesson opens on, as the stills it is made of: one of the two taps together, at
 * the lab's starting values on the lesson's first source; or two, the tap going in and then the
 * tap coming out, where the lesson asks for them `separate` (an input that is a sliver beside
 * its output) or the view holds one tap a picture (a spectrogram).
 */
export function lessonOpening(
  lesson: StillLesson,
  props: OpeningProps,
  dir = SETTINGS_DIR,
): Promise<Picture[]> {
  const { input, output, separate, hear: _hear, ...ask } = props
  const taps = [`${input}:in`, `${output}:out`]
  const apart = separate || ask.view === 'spectrogram'
  return Promise.all(
    (apart ? taps : [taps.join(' ')]).map((one) => lessonStill(lesson, { ...ask, taps: one }, dir)),
  )
}

/** One line of the opening picture's key: a line drawn, or what a picture says of itself. */
export interface OpeningLine {
  /** The line drawn, for its swatch; none for a picture's note. */
  line?: KeyLine
  /** The note stands beside a ramp of the picture's levels. */
  ramp?: boolean
  text: string
  /** The sound a button beside the words plays, by tap id. */
  hear?: string
}

/**
 * The key of the opening picture: every line drawn, then what each picture says of itself. A
 * line of a sound has a button to hear it, once for a sound drawn as two lines. A tap that is
 * not sound is heard by the sound `hear` names for it, going in or coming out; a picture with
 * no lines (a spectrogram) has that button beside its note. Stops the build, naming the lesson,
 * on a `hear` that names a tap the lab does not have, or one that is not sound.
 */
export function openingKey(
  pictures: readonly Picture[],
  props: OpeningProps,
  taps: readonly TapInfo[],
  lesson: string,
): OpeningLine[] {
  const sound = (id: string) => taps.find((tap) => tap.id === id)?.kind === 'audio'
  for (const id of props.hear ?? []) {
    if (!taps.some((tap) => tap.id === id)) {
      throw new Error(
        `${lesson}: the opening picture is heard by "${id}", which is not a tap of the lab. It has: ${taps.map((tap) => tap.id).join(', ')}`,
      )
    }
    if (!sound(id)) {
      throw new Error(
        `${lesson}: the opening picture is heard by "${id}", which is not sound, so it cannot be listened to.`,
      )
    }
  }
  /** The sound a tap of the picture is heard by: itself, or the one named for its place. */
  const heard = (id: string) => {
    if (sound(id)) return id
    return id === props.input ? props.hear?.[0] : id === props.output ? props.hear?.[1] : undefined
  }
  const given = new Set<string>()
  const once = (id: string | undefined) => {
    if (id === undefined || given.has(id)) return undefined
    given.add(id)
    return id
  }
  const lines: OpeningLine[] = pictures.flatMap((picture) =>
    picture.key.map((line) => ({ line, text: line.name, hear: once(heard(line.id)) })),
  )
  // What the pictures say of themselves. A picture of levels has no lines and is of one tap,
  // the one going in first and then the one coming out: its button stands beside its note.
  const said = new Set<string>()
  pictures.forEach((picture, index) => {
    if (!picture.note) return
    if (!picture.ramp) {
      said.add(picture.note)
      return
    }
    const hear = once(heard([props.input, props.output][index] ?? ''))
    lines.push({ text: picture.note, ramp: true, ...(hear === undefined ? {} : { hear }) })
  })
  // Two pictures that each draw the left of their one sound say so once, of both.
  const each = pictures.length > 1 && pictures.every((picture) => picture.note === LEFT_OF_ONE)
  for (const text of each ? [LEFT_OF_EACH] : said) lines.push({ text })
  return lines
}

/** A lab that makes its own sound: the lesson lists no source but "nothing goes in". */
export const playsItself = (lesson: StillLesson) =>
  lesson.data.sources.every((source) => source === NO_SOURCE.id)

/** A lesson's tile on the home map: what its button plays, and its picture. */
export interface LessonTile {
  lab: string
  seconds: number
  /** Control values by id; one left out is at the lab's starting value. */
  values: Record<string, number>
  /** The tap that sounds. */
  tap: string
  /** The lab plays its own notes: no loop goes in. */
  own: boolean
  /** The picture, as inline SVG. */
  picture: string
  /** For a picture against time: where in the loop it starts and how long it is, in seconds. */
  time: { from: number; span: number } | null
}

const tiles = new Map<string, Promise<LessonTile>>()

/**
 * A lesson's tile. It is the `tile` entry of the lesson's settings file: the values and the tap
 * the button plays, and the picture (drawn on the entry's source, or the lesson's first). A
 * lesson with no entry plays and draws its lab's last sound on the main path, against time, at
 * the lab's starting values.
 */
export async function lessonTile(lesson: StillLesson, dir = SETTINGS_DIR): Promise<LessonTile> {
  const entry: TileEntry | undefined = (await lessonSettings(lesson, dir))?.tile
  const { lab, seconds } = lesson.data
  // Kept by what it is made from: the home page and the lessons' index draw the same tiles.
  const key = JSON.stringify([lesson.id, stampOf(lab), seconds, lesson.data.sources[0], entry])
  let found = tiles.get(key)
  if (!found) {
    found = (async () => {
      const values = entry?.values ?? {}
      const source = entry?.source ?? lesson.data.sources[0]!
      const render = await renderStill({ lab, source, seconds, values })
      const tap =
        entry?.tap ??
        Object.values(render.result.taps).findLast(
          (one: TapData) => one.kind === 'audio' && one.length > 0 && !isBuilt(one.id),
        )?.id
      if (tap === undefined)
        throw new Error(`${lesson.id}: its lab writes no sound for a tile to play.`)
      const drawn = entry?.picture ?? { taps: [tap], view: 'wave' as const, from: 0 }
      const description = await labInfo(lab, lesson.id)
      const taps = tapRefs(drawn.taps.join(' '), description.taps, lesson.id)
      // A tile's entry always holds a `from`, 0 when its file gives none: a span of time, which
      // a curve has none of, so a curve's tile is the whole curve as it always was.
      const { from: _from, span: _span, ...rest } = drawn
      const stems = stemsNamed(drawn.stems)
      const asked = drawn.view === 'curve' ? { ...rest, taps, stems } : { ...drawn, taps, stems }
      const picture = tileSvg(drawStill(render, asked, lesson.id, TILE))
      const timed = drawn.view === 'wave' || drawn.view === 'spectrogram'
      const time = timed ? { from: drawn.from, span: drawn.span ?? seconds - drawn.from } : null
      return { lab, seconds, values, tap, own: playsItself(lesson), picture, time }
    })()
    tiles.set(key, found)
  }
  return found
}

/** A bench source against time, as inline SVG: the picture of a loop in the home page's loop row. */
export async function sourcePicture(id: string, seconds = 4): Promise<string> {
  const { left } = await benchSource(id, Math.round(seconds * SAMPLE_RATE))
  const [lo, hi] = rangeOf(left)
  const top = Math.max(Math.abs(lo), Math.abs(hi)) || 1
  const line: Line = { id, name: id, role: 'in', ys: left, x0: 0, x1: seconds }
  const x = { min: 0, max: seconds }
  const drawn = finish([line], x, axisFor(-top, top, TILE), { x: '', y: '' }, id, TILE)
  // Stretched to whatever box the row gives it: a loop's cell is wider than it is high.
  return `<svg viewBox="0 0 ${drawn.width} ${drawn.height}" preserveAspectRatio="none" aria-hidden="true">${drawn.lines}</svg>`
}
