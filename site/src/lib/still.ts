// A lab rendered in Node on a bench source, and the pictures drawn from the render: a lesson's
// stills and its opening picture, the home tiles' pictures and the loop row's. All of it runs
// when the site is built, and in the lab tests, so a still costs the browser nothing and is in
// the page with scripts off. A picture is inline SVG whose colours are the role variables of
// styles/site.css, so it follows the scheme. Nothing here needs the framework.
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { EDGE } from '../figures/canvas.ts'
import {
  AUDIBLE,
  label,
  loopAxis,
  minMaxPlaced,
  rangeOf,
  roomyAxis,
  ticks,
  toUnit,
  type Axis,
} from '../figures/draw.ts'
import { ROLE_VAR, tapRefs, type Role, type TapRef } from '../figures/roles.ts'
import { CONTROL_PERIOD, SAMPLE_RATE } from '../lab/rate.ts'
import { withRoom } from '../lab/room.ts'
import {
  loadLab,
  type Lab,
  type RenderResult,
  type Source,
  type TapData,
  type Values,
} from '../lab/runner.ts'
import { NO_SOURCE } from '../lab/sources.ts'
import { isBuilt } from '../lab/store.ts'
import { labInfo } from './lab-info.ts'
import {
  checkSettings,
  lessonSettings,
  PICTURE_VIEWS,
  setNamed,
  SETTINGS_DIR,
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
  /** The average spectrum of an audio tap of this render, in dB per bin up to half the rate. */
  spectrum(tap: string): Float32Array
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
      const spectrum = (tap: string) => {
        let made = spectra.get(tap)
        if (!made) {
          // The lab works a spectrum out of its last render: when it has rendered something
          // else since, it renders this again first.
          if (last.get(lab) !== result) {
            lab.render(source, given, frames)
            last.set(lab, result)
          }
          made = lab.spectrum(tap)
          spectra.set(tap, made)
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
  /** Said under the key where the lines alone do not say it: what a picture of colour means. */
  note?: string
  /** What the picture shows, for a reader who cannot see it. */
  label: string
}

export interface PictureAsk {
  taps: TapRef[]
  view: PictureView
  /** The span of time drawn, in seconds: where it starts, and its length (to the loop's end when left out). */
  from?: number
  span?: number
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
}

const colour = (role: Role) => `var(${ROLE_VAR[role]})`
const escape = (text: string) =>
  text.replace(/[&<>"]/g, (sign) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot' }[sign]};`)
const clamp = (unit: number) => Math.min(1, Math.max(0, unit))
const fixed = (value: number) => String(Math.round(value * 10) / 10)

/** One line as an SVG path: a band from the least to the most of each column where the points are many. */
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

  if (n > 3 * width) {
    const ends = minMaxPlaced(ys, (i) => toUnit(x, xOf(i)), width)
    const filled: number[] = []
    for (let col = 0; col < width; col += 1) if (!Number.isNaN(ends[2 * col])) filled.push(col)
    if (filled.length === 0) return ''
    const tops = filled.map((col) => `${col + 0.5},${Math.round(py(ends[2 * col + 1]!))}`)
    const bottoms = filled.map((col) => `${col + 0.5},${Math.round(py(ends[2 * col]!))}`).reverse()
    return `<path d="M${tops.join('L')}L${bottoms.join('L')}Z" vector-effect="non-scaling-stroke" style="fill:${colour(line.role)};fill-opacity:0.85;${stroke};stroke-width:1"/>`
  }

  let d = ''
  let pen = false
  for (let i = 0; i < n; i += 1) {
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
    ticks: ticks(axis, count).map((value) => ({ at: toUnit(axis, value), text: label(value) })),
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

const joined = (taps: readonly { name: string }[]) => taps.map((tap) => tap.name).join(' and ')

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
    key: lines.map(({ id, name, role, dashed }) => ({ id, name, role, dashed })),
    label: said,
  }
}

/** Signals against time: sound as it is, and a control's value at its own rate. */
function wave(render: StillRender, ask: PictureAsk, layout: Layout): Picture {
  const from = ask.from ?? 0
  const { length, scale, x } = loopAxis(render.result, from, ask.span)
  let lo = Infinity
  let hi = -Infinity
  let sound = false
  const lines: Line[] = ask.taps.map((tap) => {
    const found = render.result.taps[tap.id]
    const data = found?.channels_data[0] ?? new Float32Array(0)
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
      ys,
      x0: ((a * step) / SAMPLE_RATE) * scale,
      x1: (((b - 1) * step) / SAMPLE_RATE) * scale,
    }
  })
  // Sound swings about zero, so zero stays in the middle; a control's value is fitted as it lies.
  const top = Math.max(Math.abs(lo), Math.abs(hi)) || 1
  const y = sound ? axisFor(-top, top, layout) : axisFor(lo, hi, layout)
  const unit = sound ? '' : (ask.taps[0]?.unit ?? '')
  return finish(lines, x, y, { x: x.title, y: unit }, `${joined(ask.taps)} against time`, layout)
}

/** How much of each frequency: a sound's average spectrum, or a spectrum the lab worked out. */
function spectrum(render: StillRender, ask: PictureAsk, layout: Layout): Picture {
  const x = AUDIBLE
  let lo = Infinity
  let hi = -Infinity
  const lines: Line[] = ask.taps.map((tap) => {
    const found = render.result.taps[tap.id]
    const line: Line =
      found?.kind === 'audio'
        ? { ...tap, ys: render.spectrum(tap.id), x0: 0, x1: SAMPLE_RATE / 2 }
        : {
            ...tap,
            ys: found?.channels_data[0] ?? new Float32Array(0),
            x0: found?.x0 ?? 0,
            x1: found?.x1 ?? 1,
            xLog: found?.log,
          }
    // Only what stands in the audible band sets the height.
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
  const y = axisFor(Math.max(lo, hi - 90), hi, layout)
  const said = `The spectrum of ${joined(ask.taps)}`
  return finish(lines, x, y, { x: 'hertz', y: 'decibels' }, said, layout)
}

/** One value against another: the lab says what the first and the last point stand at. */
function curve(render: StillRender, ask: PictureAsk, layout: Layout): Picture {
  let lo = Infinity
  let hi = -Infinity
  let x0 = Infinity
  let x1 = -Infinity
  const lines: Line[] = ask.taps.map((tap, index) => {
    const found = render.result.taps[tap.id]
    const ys = found?.channels_data[0] ?? new Float32Array(0)
    const [least, most] = rangeOf(ys)
    lo = Math.min(lo, least)
    hi = Math.max(hi, most)
    x0 = Math.min(x0, found?.x0 ?? 0)
    x1 = Math.max(x1, found?.x1 ?? 1)
    return {
      ...tap,
      ys,
      x0: found?.x0 ?? 0,
      x1: found?.x1 ?? 1,
      xLog: found?.log,
      // A curve the lesson wrote to hold the device's against is the dashed one, as in a live figure.
      dashed: tap.origin === 'lesson' && index > 0,
    }
  })
  const x = { min: x0, max: x1, log: lines.every((line) => line.xLog) }
  const unit = ask.taps[0]?.unit ?? ''
  return finish(lines, x, axisFor(lo, hi, layout), { x: '', y: unit }, joined(ask.taps), layout)
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
 * those that hold anything within 40 dB of the loudest point.
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
  const top = Math.min(nyquist, roomyAxis(0, Math.max(1000, (highest / (rows - 1)) * nyquist)).max)
  const rowsShown = Math.max(1, Math.round((top / nyquist) * (rows - 1)) + 1)
  const max = Math.ceil(loudest)
  const min = max - 60

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

  const x = numbersOf({ min: from, max: to }, 6, 'seconds')
  const y = numbersOf({ min: 0, max: top }, 4, 'hertz')
  return {
    width,
    height: HEIGHT,
    grid: `<rect width="${width}" height="${HEIGHT}" vector-effect="non-scaling-stroke" style="fill:none;stroke-width:1;stroke:var(--sig-grid)"/>`,
    lines: layer('a', middle, 'ctl') + layer('b', loud, 'out'),
    x,
    y,
    key: [],
    note: `${tap.name}: seconds across, hertz up, from ${label(min)} dB (the page's colour) to ${label(max)} dB`,
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
  if (ask.view === 'spectrum') return spectrum(render, ask, layout)
  if (ask.view === 'curve') return curve(render, ask, layout)
  if (ask.view === 'spectrogram') return spectrogram(render, ask, layout, lesson)
  return wave(render, ask, layout)
}

/**
 * A lesson's still as HTML: the drawing as inline SVG inside the room a live figure leaves for
 * its numbers, and the numbers set in the page's own type at their real size, however wide the
 * picture is shown.
 */
export function plotHtml(picture: Picture, height = HEIGHT): string {
  const inside = `left:${EDGE.left}px;top:${EDGE.top}px;width:calc(100% - ${EDGE.left + EDGE.right}px);height:calc(100% - ${EDGE.top + EDGE.bottom}px)`
  const across = (at: number) =>
    `calc(${EDGE.left}px + ${fixed(at * 100)}% - ${fixed(at * (EDGE.left + EDGE.right))}px)`
  const down = (at: number) =>
    `calc(${EDGE.top}px + ${fixed(at * 100)}% - ${fixed(at * (EDGE.top + EDGE.bottom))}px)`
  const ys = picture.y.ticks
    .filter(({ at }) => at >= 0 && at <= 1)
    .map(
      ({ at, text }) =>
        `<span style="position:absolute;right:calc(100% - ${EDGE.left - 6}px);top:${down(1 - at)};transform:translateY(-50%)">${text}</span>`,
    )
  const xs = picture.x.ticks
    .filter(({ at }) => at >= 0 && at <= 1)
    .map(
      ({ at, text }) =>
        `<span style="position:absolute;left:${across(at)};bottom:${EDGE.bottom - 16}px;transform:translateX(-50%)">${text}</span>`,
    )
  const titles = [
    picture.y.title &&
      `<span style="position:absolute;left:${EDGE.left + 6}px;top:${EDGE.top + 5}px">${escape(picture.y.title)}</span>`,
    picture.x.title &&
      `<span style="position:absolute;right:${EDGE.right + 6}px;bottom:${EDGE.bottom + 4}px">${escape(picture.x.title)}</span>`,
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

/** A tile's picture: the lines alone, with no numbers. The tile's link says what it is. */
function tileSvg(picture: Picture): string {
  const { width, height, pad } = TILE_BOX
  return (
    `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true">` +
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
}

/**
 * The picture a `<Still>` of a lesson shows. Stops the build, naming the lesson, on a tap the lab
 * does not have, a set the lesson's file does not have, a control or a value the lab does not
 * take, and a source the lesson does not list.
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
  checkSettings(
    { sets: { 'a still': { label: 'a still', values, source } } },
    description,
    lesson.data.sources,
    lesson.id,
  )
  const render = await renderStill({
    lab: lesson.data.lab,
    source,
    seconds: lesson.data.seconds,
    values,
  })
  const ask = { taps, view: props.view ?? 'wave', from: props.from, span: props.span }
  return drawStill(render, ask, lesson.id)
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
      const picture = tileSvg(drawStill(render, { ...drawn, taps }, lesson.id, TILE))
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
