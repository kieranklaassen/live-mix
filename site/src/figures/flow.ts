// A signal-flow picture, apart from any page: blocks that each name a row and what feeds them,
// checked against the lab and laid out as boxes joined by paths. A path may leave the main row
// for a side row and come back into it, go round a block, or come back against the flow. For a
// narrow column the picture is cut between two columns of blocks into bands that stand one under
// another, and a path that crosses a cut goes on in the next band at the height of its row.
// Tested in tests/unit/flow.test.ts.

import type { TapInfo } from '../lab/describe.ts'

/** A box with words, bare words at an end of the flow, a point where a wire divides, an adder. */
export type FlowShape = 'box' | 'end' | 'dot' | 'sum'

/** What a wire carries: sound, which can be heard, or a value the device works out from it. */
export type FlowSignal = 'sound' | 'value'

/** A block as a lesson writes it. */
export interface FlowBlock {
  id: string
  /** The block's words; the tap's name when a tap is named and this is left out. */
  label?: string
  /** 0, the main path, when left out; 1 is a row under it, −1 a row over it. */
  row?: number
  /** The blocks that feed it along the flow, by id. */
  from?: string | string[]
  /** Blocks further along the flow whose output comes back into it: feedback. */
  back?: string | string[]
  /** The lab's tap that is read at the block's output. The block is lit while that tap sounds. */
  tap?: string
  shape?: FlowShape
  /** The number of the stage that explains the block, printed under it. */
  n?: number | string
  /** What comes out of it; by its tap, or by what feeds it, when left out. */
  signal?: FlowSignal
}

/** A block checked against the lab, with everything left out filled in. */
export interface FlowPart {
  id: string
  lines: string[]
  row: number
  from: string[]
  back: string[]
  tap?: string
  shape: FlowShape
  n?: string
  signal: FlowSignal
}

export interface FlowNode extends FlowPart {
  /** The middle of the block, and its size. */
  x: number
  y: number
  w: number
  h: number
  /** A path comes into the block from under it: its number stands at its corner, and an adder's words over it. */
  fromBelow?: boolean
  /** In a wrapped picture, the band the block stands in, counted from 0. */
  band?: number
}

export interface FlowEdge {
  from: string
  to: string
  /**
   * How the path runs: straight along a row, leaving for a row further from the main path,
   * joining a row nearer to it, round the blocks between, or back against the flow.
   */
  kind: 'straight' | 'leave' | 'join' | 'around' | 'back'
  signal: FlowSignal
  /** The corners of the path, from the block it leaves to the block it reaches. */
  points: [number, number][]
  /** In a wrapped picture a path is drawn a piece a band: the band of this piece, counted from 0. */
  band?: number
  /** This piece stops at the edge of its band and goes on in the next: it does not reach its block. */
  goesOn?: boolean
}

export interface FlowLayout {
  width: number
  height: number
  nodes: FlowNode[]
  edges: FlowEdge[]
  /** Where a wire divides after a block: drawn as a dot. */
  joints: { x: number; y: number; signal: FlowSignal }[]
  /** The columns the blocks stand in along the flow, each from its left edge to its right. */
  columns?: { left: number; right: number }[]
  /** How many bands a wrapped picture is cut into. Left out of one that is not wrapped. */
  bands?: number
}

const list = (ids: string | string[] | undefined): string[] =>
  ids === undefined ? [] : Array.isArray(ids) ? ids : [ids]

/** A block's words on at most two lines: as written with a line break, or divided near the middle. */
function linesOf(label: string): string[] {
  if (label.includes('\n')) return label.split('\n').map((line) => line.trim())
  if (label.length <= 12 || !label.includes(' ')) return [label]
  let at = -1
  for (let i = label.indexOf(' '); i >= 0; i = label.indexOf(' ', i + 1)) {
    if (at < 0 || Math.abs(i - label.length / 2) < Math.abs(at - label.length / 2)) at = i
  }
  return [label.slice(0, at), label.slice(at + 1)]
}

/**
 * The blocks in an order in which each comes after what feeds it. Throws when blocks feed each
 * other in a ring along the flow: the path that comes back is to be said with `back`.
 */
function alongTheFlow<B extends { id: string; from: string[] }>(blocks: B[], lesson: string): B[] {
  const byId = new Map(blocks.map((block) => [block.id, block]))
  const order: B[] = []
  const state = new Map<string, 'open' | 'done'>()
  const visit = (block: B, trail: string[]) => {
    if (state.get(block.id) === 'done') return
    if (state.get(block.id) === 'open') {
      const ring = [...trail.slice(trail.indexOf(block.id)), block.id].join(' → ')
      throw new Error(
        `${lesson}: the flow's blocks feed each other in a ring (${ring}). Name the path that comes back with \`back\`, not \`from\`.`,
      )
    }
    state.set(block.id, 'open')
    for (const id of block.from) visit(byId.get(id)!, [...trail, block.id])
    state.set(block.id, 'done')
    order.push(block)
  }
  for (const block of blocks) visit(block, [])
  return order
}

/**
 * The blocks a lesson wrote, checked and filled in. Throws, naming the lesson, on a tap the lab
 * does not have, a block fed by one that is not in the picture, an id used twice, a block with
 * nothing to say, and blocks that feed each other along the flow.
 */
export function flowBlocks(
  blocks: readonly FlowBlock[],
  taps: readonly TapInfo[],
  lesson: string,
): FlowPart[] {
  const ids = new Set<string>()
  for (const block of blocks) {
    if (ids.has(block.id)) {
      throw new Error(`${lesson}: two blocks of the flow are called "${block.id}".`)
    }
    ids.add(block.id)
  }
  const parts = blocks.map((block) => {
    const shape = block.shape ?? 'box'
    const tap = block.tap === undefined ? undefined : taps.find((one) => one.id === block.tap)
    if (block.tap !== undefined && !tap) {
      const known = taps.map((one) => one.id).join(', ')
      throw new Error(
        `${lesson}: the flow's block "${block.id}" names the tap "${block.tap}", which the lab does not have. It has: ${known}`,
      )
    }
    const from = list(block.from)
    const back = list(block.back)
    for (const id of [...from, ...back]) {
      if (!ids.has(id)) {
        throw new Error(
          `${lesson}: the flow's block "${block.id}" is fed by "${id}", which is not a block of the flow.`,
        )
      }
    }
    const label = block.label ?? tap?.name
    if (label === undefined && shape !== 'dot' && shape !== 'sum') {
      throw new Error(`${lesson}: the flow's block "${block.id}" has neither words nor a tap.`)
    }
    const signal: FlowSignal | undefined =
      block.signal ?? (tap ? (tap.kind === 'audio' ? 'sound' : 'value') : undefined)
    return {
      id: block.id,
      lines: label === undefined ? [] : linesOf(label),
      row: block.row ?? 0,
      from,
      back,
      ...(tap && { tap: tap.id }),
      shape,
      ...(block.n !== undefined && { n: String(block.n) }),
      signal,
    }
  })
  // A block that does not say what comes out of it passes on what goes in.
  const settled = new Map<string, FlowSignal>()
  for (const part of alongTheFlow(parts, lesson)) {
    settled.set(part.id, part.signal ?? settled.get(part.from[0] ?? '') ?? 'sound')
  }
  return parts.map((part) => ({ ...part, signal: settled.get(part.id)! }))
}

/** The picture's measures, in the units of its own box: its type is 13 units tall. */
export const FLOW = {
  /** The width of one letter of the mono face at that size. */
  letter: 7.85,
  boxHeight: 40,
  /** Between two columns of blocks. */
  gap: 30,
  /** Between two rows, middle to middle. */
  rowGap: 104,
  /** How far over a row a path round a block runs, and how far under it a path that comes back. */
  lift: 42,
  /** Room round the whole picture, for the strokes and the arrowheads. */
  pad: 10,
  /** Room under a block for the number of its stage. */
  number: 16,
  /** From one line of a block's words to the next. */
  line: 16,
}

/** The words of a block that are there to draw: a block named '' has none. */
const wordsOf = (part: FlowPart) => part.lines.filter((line) => line !== '')

/**
 * Where the middle of each line of a block's words stands, from the first line down. A box's
 * words are inside it. An adder's are under its circle, so that they are not struck through by
 * its cross, or over it where a path comes into it from below.
 */
export function wordsAt(node: FlowNode): number[] {
  const count = node.lines.length
  if (node.shape !== 'sum') {
    return node.lines.map((_, i) => node.y + (i - (count - 1) / 2) * FLOW.line)
  }
  const clear = node.h / 2 + FLOW.line * 0.75
  return node.lines.map((_, i) =>
    node.fromBelow ? node.y - clear - (count - 1 - i) * FLOW.line : node.y + clear + i * FLOW.line,
  )
}

/** The foot of a block and of an adder's words under it: the number of its stage stands under this. */
export function footOf(node: FlowNode): number {
  const under = node.shape === 'sum' && !node.fromBelow && wordsOf(node).length > 0
  return under ? wordsAt(node)[node.lines.length - 1]! + FLOW.line / 2 : node.y + node.h / 2
}

/** How far a block reaches each way, with an adder's words and the number under it. */
function reachOf(node: FlowNode) {
  const words = node.shape === 'sum' ? wordsOf(node) : []
  const half = Math.max(node.w, ...words.map((line) => line.length * FLOW.letter)) / 2
  const over = words.length > 0 && node.fromBelow ? wordsAt(node)[0]! - FLOW.line / 2 : Infinity
  return {
    left: node.x - half,
    right: node.x + half,
    top: Math.min(node.y - node.h / 2, over),
    bottom: footOf(node) + (node.n ? FLOW.number : 0),
  }
}

function sizeOf(part: FlowPart): { w: number; h: number } {
  if (part.shape === 'dot') return { w: 8, h: 8 }
  if (part.shape === 'sum') return { w: 24, h: 24 }
  // A whole, even width, so that a block's edges and its middle stand on round numbers.
  const even = (width: number) => Math.ceil(width / 2) * 2
  const letters = Math.max(...part.lines.map((line) => line.length))
  if (part.shape === 'end') return { w: even(letters * FLOW.letter + 8), h: 20 }
  return { w: Math.max(56, even(letters * FLOW.letter + 24)), h: FLOW.boxHeight }
}

/** The width a block's column keeps for it: its own, or for an adder the width of its words. */
function roomOf(part: FlowPart, own: number): number {
  if (part.shape !== 'sum') return own
  const letters = Math.max(0, ...wordsOf(part).map((line) => line.length))
  return Math.max(own, Math.ceil((letters * FLOW.letter + 8) / 2) * 2)
}

/** Lay the blocks out: columns along the flow, rows as the blocks name them, and every path. */
export function layoutFlow(parts: readonly FlowPart[]): FlowLayout {
  // A block stands one column after the last of what feeds it.
  const column = new Map<string, number>()
  for (const part of alongTheFlow([...parts], 'the flow')) {
    column.set(part.id, Math.max(-1, ...part.from.map((id) => column.get(id)!)) + 1)
  }
  const sizes = new Map(parts.map((part) => [part.id, sizeOf(part)]))
  const columns = Math.max(0, ...column.values()) + 1
  const widths = Array.from({ length: columns }, (_, c) =>
    Math.max(
      0,
      ...parts.filter((p) => column.get(p.id) === c).map((p) => roomOf(p, sizes.get(p.id)!.w)),
    ),
  )
  const middles: number[] = []
  let left = 0
  for (const width of widths) {
    middles.push(left + width / 2)
    left += width + FLOW.gap
  }
  const rows = [...new Set(parts.map((part) => part.row))].sort((a, b) => a - b)

  const nodes: FlowNode[] = parts.map((part) => ({
    ...part,
    ...sizes.get(part.id)!,
    x: middles[column.get(part.id)!]!,
    y: rows.indexOf(part.row) * FLOW.rowGap,
  }))
  const node = (id: string) => nodes.find((one) => one.id === id)!
  const right = (one: FlowNode) => one.x + one.w / 2
  /** Where a wire divides after a block: the block itself when it is a point. */
  const tapOff = (one: FlowNode): [number, number] =>
    one.shape === 'dot' ? [one.x, one.y] : [right(one) + FLOW.gap / 2, one.y]
  /** A path that turns off after a block begins at the block and runs to where the wire divides. */
  const start = (one: FlowNode): [number, number][] =>
    one.shape === 'dot' ? [tapOff(one)] : [[right(one), one.y], tapOff(one)]

  const edges: FlowEdge[] = []
  const turned = new Set<string>()
  for (const to of nodes) {
    for (const id of to.from) {
      const from = node(id)
      const signal = from.signal
      if (from.row === to.row) {
        const between = nodes.some(
          (one) => one.row === to.row && one.x > from.x && one.x < to.x && one !== from,
        )
        if (!between) {
          edges.push({
            from: id,
            to: to.id,
            kind: 'straight',
            signal,
            points: [
              [right(from), from.y],
              [to.x - to.w / 2, to.y],
            ],
          })
          continue
        }
        const over = to.y - FLOW.lift
        turned.add(id)
        edges.push({
          from: id,
          to: to.id,
          kind: 'around',
          signal,
          points: [...start(from), [tapOff(from)[0], over], [to.x, over], [to.x, to.y - to.h / 2]],
        })
      } else if (Math.abs(to.row) < Math.abs(from.row)) {
        // Back into a row nearer the main path: along its own row, then up or down into the block.
        const side = from.y > to.y ? to.h / 2 : -to.h / 2
        edges.push({
          from: id,
          to: to.id,
          kind: 'join',
          signal,
          points: [
            [right(from), from.y],
            [to.x, from.y],
            [to.x, to.y + side],
          ],
        })
      } else {
        // Out to a row further from the main path: down or up first, then into the block's left.
        turned.add(id)
        edges.push({
          from: id,
          to: to.id,
          kind: 'leave',
          signal,
          points: [...start(from), [tapOff(from)[0], to.y], [to.x - to.w / 2, to.y]],
        })
      }
    }
    for (const id of to.back) {
      const from = node(id)
      const under = Math.max(from.y, to.y) + FLOW.lift
      turned.add(id)
      edges.push({
        from: id,
        to: to.id,
        kind: 'back',
        signal: from.signal,
        points: [...start(from), [tapOff(from)[0], under], [to.x, under], [to.x, to.y + to.h / 2]],
      })
    }
  }

  // A dot where a wire turns off after a block that also feeds something else.
  const joints = nodes
    .filter((one) => one.shape !== 'dot' && turned.has(one.id))
    .filter((one) => edges.filter((edge) => edge.from === one.id).length > 1)
    .map((one) => ({ x: tapOff(one)[0], y: one.y, signal: one.signal }))

  // The blocks a path reaches from under them.
  for (const edge of edges) {
    const [, y] = edge.points[edge.points.length - 1]!
    const to = node(edge.to)
    if (y >= to.y + to.h / 2) to.fromBelow = true
  }

  // Move everything so the picture starts at its own top left corner, with room round it.
  const reaches = nodes.map(reachOf)
  const xs = [
    ...reaches.flatMap((one) => [one.left, one.right]),
    ...edges.flatMap((edge) => edge.points.map(([x]) => x)),
  ]
  const ys = [
    ...reaches.flatMap((one) => [one.top, one.bottom]),
    ...edges.flatMap((edge) => edge.points.map(([, y]) => y)),
  ]
  const dx = FLOW.pad - Math.min(...xs)
  const dy = FLOW.pad - Math.min(...ys)
  return {
    width: Math.max(...xs) + dx + FLOW.pad,
    height: Math.max(...ys) + dy + FLOW.pad,
    nodes: nodes.map((one) => ({ ...one, x: one.x + dx, y: one.y + dy })),
    edges: edges.map((edge) => ({
      ...edge,
      points: edge.points.map(([x, y]) => [x + dx, y + dy] as [number, number]),
    })),
    joints: joints.map((joint) => ({ ...joint, x: joint.x + dx, y: joint.y + dy })),
    columns: widths.map((width, c) => ({
      left: middles[c]! - width / 2 + dx,
      right: middles[c]! + width / 2 + dx,
    })),
  }
}

/** How a picture is cut to wrap, in its own units. */
const WRAP = {
  /** Where a cut falls after a column: past the point where a wire turns off, half the gap on. */
  cut: 22,
  /** How far a path that is cut runs on past the cut, and how far before it it comes in. */
  lead: 12,
  /** How far inside the picture's edge such a path stops and starts. */
  inset: 2,
  /** Between two bands. */
  gap: 12,
}

/** The columns `first` to `last`, as the stretch of the picture from `left` to `right`. */
interface Band {
  first: number
  last: number
  left: number
  right: number
}

/** A band's width as it is drawn: with the room a path takes to come in and to go on. */
const bandWidth = (band: Band, index: number, count: number) =>
  band.right - band.left + (index > 0 ? WRAP.lead : 0) + (index < count - 1 ? WRAP.lead : 0)

/** The columns dealt into bands, each as many columns as `width` holds and never fewer than one. */
function bandsOf(flow: FlowLayout, columns: { right: number }[], width: number): Band[] {
  const end = columns.length - 1
  const cutAfter = (c: number) => (c === end ? flow.width : columns[c]!.right + WRAP.cut)
  const bands: Band[] = []
  for (let first = 0; first <= end;) {
    const left = first === 0 ? 0 : cutAfter(first - 1)
    const wide = (last: number) =>
      cutAfter(last) - left + (first > 0 ? WRAP.lead : 0) + (last < end ? WRAP.lead : 0)
    let last = first
    while (last < end && wide(last + 1) <= width) last += 1
    bands.push({ first, last, left, right: cutAfter(last) })
    first = last + 1
  }
  return bands
}

/**
 * A picture for a column `width` wide. One that fits is given back as it is. A wider one is cut
 * between columns of blocks into bands, as few as hold it and as even as they can be, and the
 * bands stand one under another, each closed up to what it holds. A path that crosses a cut is
 * drawn a piece a band: it runs off the end of its band (`goesOn`) and comes in at the start of
 * the next at the same height of its row, as a line of text does. A path that comes back
 * against the flow goes through the bands the other way.
 */
export function wrapFlow(flow: FlowLayout, width: number): FlowLayout {
  const columns = flow.columns
  if (flow.width <= width || !columns || columns.length < 2) return flow
  let bands = bandsOf(flow, columns, width)
  for (let narrower = width - 8; narrower > 0; narrower -= 8) {
    const tried = bandsOf(flow, columns, narrower)
    if (tried.length > bands.length) break
    bands = tried
  }
  const count = bands.length
  if (count < 2) return flow
  const bandAt = (x: number) => {
    let band = 0
    while (band < count - 1 && x >= bands[band]!.right) band += 1
    return band
  }

  // Every path, a piece a band. Only a stretch along a row crosses a cut: a path turns up or
  // down at a block's middle or half a gap after a block, and a cut falls past both.
  const pieces: { edge: FlowEdge; band: number; points: [number, number][]; goesOn?: true }[] = []
  const reach = WRAP.lead - WRAP.inset
  for (const edge of flow.edges) {
    let band = bandAt(edge.points[0]![0])
    let points = [edge.points[0]!]
    for (const point of edge.points.slice(1)) {
      const to = bandAt(point[0])
      const y = points[points.length - 1]![1]
      while (band !== to) {
        const step = to > band ? 1 : -1
        const cut = step > 0 ? bands[band]!.right : bands[band]!.left
        points.push([cut + step * reach, y])
        pieces.push({ edge, band, points, goesOn: true })
        band += step
        points = [[cut - step * reach, y]]
      }
      points.push(point)
    }
    pieces.push({ edge, band, points })
  }

  // Each band closed up to what it holds, and moved under the one before.
  const tops = bands.map(() => Infinity)
  const feet = bands.map(() => -Infinity)
  const holds = (band: number, top: number, foot: number) => {
    tops[band] = Math.min(tops[band]!, top)
    feet[band] = Math.max(feet[band]!, foot)
  }
  for (const one of flow.nodes) {
    const { top, bottom } = reachOf(one)
    holds(bandAt(one.x), top, bottom)
  }
  for (const piece of pieces) for (const [, y] of piece.points) holds(piece.band, y, y)
  const across = bands.map((band, index) => (index > 0 ? WRAP.lead : 0) - band.left)
  const down: number[] = []
  let height = 0
  bands.forEach((_, index) => {
    down.push(height + FLOW.pad - tops[index]!)
    height += feet[index]! - tops[index]! + 2 * FLOW.pad + (index < count - 1 ? WRAP.gap : 0)
  })
  const moved = <P extends { x: number; y: number }>(one: P, band = bandAt(one.x)) => ({
    ...one,
    x: one.x + across[band]!,
    y: one.y + down[band]!,
  })
  return {
    width: Math.max(...bands.map((band, index) => bandWidth(band, index, count))),
    height,
    nodes: flow.nodes.map((one) => ({ ...moved(one), band: bandAt(one.x) })),
    edges: pieces.map(({ edge, band, points, goesOn }) => ({
      ...edge,
      band,
      ...(goesOn && { goesOn }),
      points: points.map(([x, y]) => [x + across[band]!, y + down[band]!] as [number, number]),
    })),
    joints: flow.joints.map((joint) => moved(joint)),
    bands: count,
  }
}

/**
 * The widths of column a picture is laid out for, narrowest first: the name the styles know
 * each by (styles/parts.css, where the column's own width picks one) and the most the picture
 * may be wide there. A picture is shown at four fifths of its size at the least
 * (figures/Flow.tsx), so each width is the narrowest column of its kind and a quarter more:
 * columns under 520 px (a phone's is 350, where the picture keeps its size), from 520, from 760
 * and from 960.
 */
export const FLOW_FITS = [
  { name: 'narrow', width: 340 },
  { name: 'mid', width: 650 },
  { name: 'large', width: 950 },
  { name: 'full', width: 1200 },
] as const

/** A flow laid out for each width of column: one picture for all the widths that take the same. */
export function flowLayouts(parts: readonly FlowPart[]): { fits: string[]; flow: FlowLayout }[] {
  const wide = layoutFlow(parts)
  const layouts: { fits: string[]; flow: FlowLayout; cut: string }[] = []
  for (const fit of FLOW_FITS) {
    const flow = wrapFlow(wide, fit.width)
    // Two pictures cut at the same places are the same picture.
    const cut = flow.nodes.map((one) => one.band ?? 0).join(' ')
    const same = layouts.find((one) => one.cut === cut)
    if (same) same.fits.push(fit.name)
    else layouts.push({ fits: [fit.name], flow, cut })
  }
  return layouts.map(({ fits, flow }) => ({ fits, flow }))
}

/** A path's corners as an SVG path. */
export const pathOf = (points: readonly [number, number][]): string =>
  points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join('')
