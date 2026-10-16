// A signal-flow picture, apart from any page: blocks that each name a row and what feeds them,
// checked against the lab and laid out as boxes joined by paths. A path may leave the main row
// for a side row and come back into it, go round a block, or come back against the flow. For a
// narrow column the picture is cut between two columns of blocks into bands that stand one under
// another, and a path that crosses a cut goes on in the next band at the height of its row. It
// is cut only where one plain path crosses, so no loop and no side row is cut in two: a picture
// that cannot be cut so is laid out again running downward, each row of it a column
// (`layoutDown`), where every path is in one piece. Tested in tests/unit/flow.test.ts.

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
  /**
   * The column it stands in along the flow, counted from 0, for a block that is to stand
   * further along than it would: left out, one column after the last of what feeds it. A block
   * never stands before what feeds it, so a column short of that is passed over.
   */
  column?: number
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
  /** The column the block asks to stand in, when it asks. */
  column?: number
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
  /**
   * A path that went round a block comes down into this one from over it. An adder's words that
   * stand over its circle then stand over that path too, so that it does not come down through
   * them.
   */
  fromAbove?: boolean
  /**
   * Where an adder's words stand when they are neither under its circle nor over it: `beside`
   * a path that comes down into it, over the row and to the right of that path; and in a picture
   * that runs downward at the circle's `left` or its `right`, or over its left `corner` where
   * paths come into both of its sides.
   */
  place?: 'beside' | 'left' | 'right' | 'corner'
  /** The block is one of a picture that runs downward (`layoutDown`). */
  down?: boolean
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
  /** The picture runs downward: each row of the flow is a column of it, the top row at the left. */
  down?: boolean
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
    if (block.column !== undefined && !(Number.isInteger(block.column) && block.column >= 0)) {
      throw new Error(
        `${lesson}: the flow's block "${block.id}" asks for column ${block.column}. A column is a whole number, counted from 0.`,
      )
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
      ...(block.column !== undefined && { column: block.column }),
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
  /** The width of one character of a stage's number, which is set smaller than the words. */
  digit: 6.6,
}

/** The words of a block that are there to draw: a block named '' has none. */
const wordsOf = (part: FlowPart) => part.lines.filter((line) => line !== '')

/**
 * Where the middle of each line of a block's words stands, from the first line down. A box's
 * words are inside it. An adder's are under its circle, so that they are not struck through by
 * its cross, or over it where a path comes into it from below; and where a path that went
 * round a block comes down into it as well, over the height that path runs at. Where its words
 * stand beside it (`place`), they are level with it at its left or its right, or over the row.
 */
export function wordsAt(node: FlowNode): number[] {
  const count = node.lines.length
  if (node.shape !== 'sum' || node.place === 'left' || node.place === 'right') {
    return node.lines.map((_, i) => node.y + (i - (count - 1) / 2) * FLOW.line)
  }
  const high = node.fromBelow && node.fromAbove && node.place === undefined
  const clear = (high ? FLOW.lift : node.h / 2) + FLOW.line * 0.75
  const over = node.fromBelow || node.place !== undefined
  return node.lines.map((_, i) =>
    over ? node.y - clear - (count - 1 - i) * FLOW.line : node.y + clear + i * FLOW.line,
  )
}

/** Between two paths that come back into one block, where they run side by side. */
const BACKS = 10
/** How far from an adder's middle its words start, where they stand over the row beside a path. */
const BESIDE = 8
/** How far from a block's side an adder's words start, in a picture that runs downward. */
const ASIDE = 6

/**
 * Where a block's words are set from, across the picture: its middle, or for an adder whose
 * words stand beside it (`place`) the edge of them that is nearer the adder.
 */
export function wordsPlace(node: FlowNode): { x: number; anchor: 'start' | 'middle' | 'end' } {
  if (node.shape !== 'sum' || node.place === undefined) return { x: node.x, anchor: 'middle' }
  if (node.place === 'beside') return { x: node.x + BESIDE, anchor: 'start' }
  if (node.place === 'corner') return { x: node.x - BESIDE, anchor: 'end' }
  if (node.place === 'left') return { x: node.x - node.w / 2 - ASIDE, anchor: 'end' }
  return { x: node.x + node.w / 2 + ASIDE, anchor: 'start' }
}

/** How wide the widest line of a block's words is. */
const wordsWide = (part: FlowPart) =>
  Math.max(0, ...wordsOf(part).map((line) => line.length * FLOW.letter))

/** The foot of a block and of an adder's words under it: the number of its stage stands under this. */
export function footOf(node: FlowNode): number {
  const under =
    node.shape === 'sum' && !node.fromBelow && node.place === undefined && wordsOf(node).length > 0
  return under ? wordsAt(node)[node.lines.length - 1]! + FLOW.line / 2 : node.y + node.h / 2
}

/**
 * Where the number of a block's stage is written, on its baseline: under the block's middle;
 * or, where a path leaves or reaches the block there, under its left corner, and beside the
 * path where the corner leaves it too little room. In a picture that runs downward a path
 * leaves every block at its foot, and an adder's number stands on the side its words do not.
 */
export function numberAt(node: FlowNode): {
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
} {
  const y = footOf(node) + FLOW.number - 3
  if (!node.down && !node.fromBelow) return { x: node.x, y, anchor: 'middle' }
  // Clear of the paths at the block's foot: two that come back stand a little to each side of
  // its middle, and each ends in an arrowhead.
  const clear = 10
  const wide = (node.n ?? '').length * FLOW.digit
  if (node.w / 2 - clear >= wide) return { x: node.x - node.w / 2, y, anchor: 'start' }
  const right = node.down && (node.place === 'left' || node.place === 'corner')
  return right ? { x: node.x + clear, y, anchor: 'start' } : { x: node.x - clear, y, anchor: 'end' }
}

/** How far a block reaches each way, with an adder's words and the number under it. */
function reachOf(node: FlowNode) {
  const words = node.shape === 'sum' ? wordsOf(node) : []
  const wide = wordsWide(node)
  const at = wordsPlace(node)
  const from = at.anchor === 'middle' ? at.x - wide / 2 : at.anchor === 'end' ? at.x - wide : at.x
  const ys = wordsAt(node)
  const stands = words.length > 0
  const number = node.n ? numberAt(node) : undefined
  const digits = (node.n ?? '').length * FLOW.digit
  const numberLeft =
    number === undefined
      ? Infinity
      : number.anchor === 'middle'
        ? number.x - digits / 2
        : number.anchor === 'end'
          ? number.x - digits
          : number.x
  return {
    left: Math.min(node.x - node.w / 2, stands ? from : Infinity, numberLeft),
    right: Math.max(
      node.x + node.w / 2,
      stands ? from + wide : -Infinity,
      number ? numberLeft + digits : -Infinity,
    ),
    top: Math.min(node.y - node.h / 2, stands ? ys[0]! - FLOW.line / 2 : Infinity),
    bottom: Math.max(
      footOf(node) + (node.n ? FLOW.number : 0),
      stands ? ys[ys.length - 1]! + FLOW.line / 2 : -Infinity,
    ),
  }
}

function sizeOf(part: FlowPart): { w: number; h: number } {
  if (part.shape === 'dot') return { w: 8, h: 8 }
  if (part.shape === 'sum') return { w: 24, h: 24 }
  // A whole, even width, so that a block's edges and its middle stand on round numbers.
  const even = (width: number) => Math.ceil(width / 2) * 2
  const letters = Math.max(...part.lines.map((line) => line.length))
  // Bare words are as tall as their lines, so that a number under them is under the last line.
  if (part.shape === 'end') {
    return { w: even(letters * FLOW.letter + 8), h: 20 + (part.lines.length - 1) * FLOW.line }
  }
  return { w: Math.max(56, even(letters * FLOW.letter + 24)), h: FLOW.boxHeight }
}

/**
 * The width a block's column keeps for it: its own, or for an adder the width of its words;
 * and twice the reach of words that stand `beside` a path into it, which start past its middle.
 */
function roomOf(part: FlowPart, own: number, beside = false): number {
  if (part.shape !== 'sum') return own
  const wide = wordsWide(part)
  if (beside && wide > 0) return Math.max(own, Math.ceil(BESIDE + wide + 4) * 2)
  return Math.max(own, Math.ceil((wide + 8) / 2) * 2)
}

/**
 * The column each block stands in along the flow: one after the last of what feeds it, or the
 * column it asks for when that is further along; and the next one along where another block of
 * its row already stands there.
 */
function columnsOf(parts: readonly FlowPart[]): Map<string, number> {
  const column = new Map<string, number>()
  const taken = new Set<string>()
  for (const part of alongTheFlow([...parts], 'the flow')) {
    let at = Math.max(part.column ?? 0, ...part.from.map((id) => column.get(id)! + 1))
    while (taken.has(`${part.row}:${at}`)) at += 1
    taken.add(`${part.row}:${at}`)
    column.set(part.id, at)
  }
  return column
}

/**
 * How a path from one block reaches another along the flow, by where the two stand: straight
 * along a row, round the blocks between, back into a row nearer the main path (`join`) or out
 * to a row further from it (`leave`). `round` says something stands in its plain way: a block
 * of the row it runs along, or, for a path that leaves, another path into the same block (one
 * along that block's own row, or one that leaves from further back), which the two would
 * otherwise share.
 */
function wayOf(
  from: FlowPart,
  to: FlowPart,
  parts: readonly FlowPart[],
  column: Map<string, number>,
): { kind: 'straight' | 'around' | 'join' | 'leave'; round: boolean } {
  const a = column.get(from.id)!
  const b = column.get(to.id)!
  const at = (one: FlowPart) => column.get(one.id)!
  if (from.row === to.row) {
    const between = parts.some((one) => one.row === to.row && at(one) > a && at(one) < b)
    return between ? { kind: 'around', round: true } : { kind: 'straight', round: false }
  }
  if (Math.abs(to.row) < Math.abs(from.row)) {
    const between = parts.some(
      (one) => one.row === from.row && one !== from && at(one) > a && at(one) <= b,
    )
    return { kind: 'join', round: between }
  }
  // Of the paths that leave for one block, the one from furthest back has the plain way.
  const feeders = to.from.map((id) => parts.find((one) => one.id === id)!)
  const leaving = feeders.filter(
    (one) => one.row !== to.row && Math.abs(to.row) >= Math.abs(one.row),
  )
  const plain = leaving.reduce((best, one) => (at(one) < at(best) ? one : best), from)
  return { kind: 'leave', round: plain !== from || feeders.some((one) => one.row === to.row) }
}

/**
 * The adders whose words stand beside a path: a path comes up into the adder's foot (feedback,
 * or a row under it joining it) and another comes down into its head from a row over it, so
 * that words under its circle or over it would both be crossed.
 */
function besideOf(parts: readonly FlowPart[], column: Map<string, number>): Set<string> {
  const byId = new Map(parts.map((part) => [part.id, part]))
  return new Set(
    parts
      .filter((part) => part.shape === 'sum' && wordsOf(part).length > 0)
      .filter((part) => {
        // The side of the adder a path from another row comes into; none for one along its row.
        const sides = part.from.map((id) => {
          const from = byId.get(id)!
          const way = wayOf(from, part, parts, column)
          if (way.kind === 'join' || (way.kind === 'leave' && way.round)) {
            return from.row > part.row ? 'below' : 'above'
          }
          return undefined
        })
        const below = part.back.length > 0 || sides.includes('below')
        return below && sides.includes('above')
      })
      .map((part) => part.id),
  )
}

/** Lay the blocks out: columns along the flow, rows as the blocks name them, and every path. */
export function layoutFlow(parts: readonly FlowPart[]): FlowLayout {
  // A block stands one column after the last of what feeds it, or where it asks to.
  const column = columnsOf(parts)
  const beside = besideOf(parts, column)
  const room = (part: FlowPart, own: number) => roomOf(part, own, beside.has(part.id))
  const sizes = new Map(parts.map((part) => [part.id, sizeOf(part)]))
  const columns = Math.max(0, ...column.values()) + 1
  const widths = Array.from({ length: columns }, (_, c) =>
    Math.max(
      0,
      ...parts.filter((p) => column.get(p.id) === c).map((p) => room(p, sizes.get(p.id)!.w)),
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
    ...(beside.has(part.id) && { place: 'beside' as const }),
  }))
  const node = (id: string) => nodes.find((one) => one.id === id)!
  const right = (one: FlowNode) => one.x + one.w / 2
  /**
   * Where a wire divides after a block: the block itself when it is a point, and otherwise half
   * a gap past it. Past an adder's words too, which reach further than its circle, so that a
   * path that turns up or down there does not run through them.
   */
  const tapOff = (one: FlowNode): [number, number] =>
    one.shape === 'dot' ? [one.x, one.y] : [one.x + room(one, one.w) / 2 + FLOW.gap / 2, one.y]
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
        const between = nodes.some(
          (one) => one.row === from.row && one !== from && one.x > from.x && one.x <= to.x,
        )
        if (!between) {
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
          continue
        }
        // A block of its own row stands in the way: the path goes round it between the two
        // rows, on the side of the row it is going to, as a path round a block of one row does.
        const run = from.y + (to.y > from.y ? FLOW.lift : -FLOW.lift)
        turned.add(id)
        edges.push({
          from: id,
          to: to.id,
          kind: 'join',
          signal,
          points: [...start(from), [tapOff(from)[0], run], [to.x, run], [to.x, to.y + side]],
        })
      } else if (wayOf(from, to, parts, column).round) {
        // Out to a block that its own row feeds too, or another path from further back: that
        // path has the block's left, so this one runs between the rows and comes into the
        // block's head or foot, and both are seen.
        const side = from.y < to.y ? -1 : 1
        const run = to.y + side * (to.h / 2 + 14)
        turned.add(id)
        edges.push({
          from: id,
          to: to.id,
          kind: 'leave',
          signal,
          points: [
            ...start(from),
            [tapOff(from)[0], run],
            [to.x, run],
            [to.x, to.y + (side * to.h) / 2],
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
    // Two paths that come back into one block run one under the other, the shorter loop
    // inside the longer, and come into its foot side by side.
    const backs = [...to.back].sort((a, b) => node(a).x - node(b).x)
    backs.forEach((id, i) => {
      const from = node(id)
      const under = Math.max(from.y, to.y) + FLOW.lift + i * BACKS
      const aside = ((backs.length - 1) / 2 - i) * BACKS
      // An adder is a circle: a path that comes in off its middle reaches it a little higher.
      const inset = to.shape === 'sum' ? to.h / 2 - Math.sqrt((to.h / 2) ** 2 - aside ** 2) : 0
      turned.add(id)
      to.fromBelow = true
      edges.push({
        from: id,
        to: to.id,
        kind: 'back',
        signal: from.signal,
        points: [
          ...start(from),
          [tapOff(from)[0], under],
          [to.x + aside, under],
          [to.x + aside, to.y + to.h / 2 - inset],
        ],
      })
    })
  }

  // A dot where a wire turns off after a block that also feeds something else.
  const joints = nodes
    .filter((one) => one.shape !== 'dot' && turned.has(one.id))
    .filter((one) => edges.filter((edge) => edge.from === one.id).length > 1)
    .map((one) => ({ x: tapOff(one)[0], y: one.y, signal: one.signal }))

  // The blocks a path reaches from under them, and those a path round a block comes down into.
  for (const edge of edges) {
    const [, y] = edge.points[edge.points.length - 1]!
    const to = node(edge.to)
    if (y >= to.y + to.h / 2) to.fromBelow = true
    if (edge.kind === 'around') to.fromAbove = true
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

/** The measures of a picture that runs downward. */
const DOWN = {
  /** Between two paths that run side by side, and from a block's side to the first of them. */
  lane: 12,
  /** Between two columns of blocks with no path running between them. */
  gap: 20,
  /** Between two paths that come into one side of a block. */
  spread: 10,
}

/**
 * The blocks laid out running downward, for a column too narrow for the picture and a picture
 * that cannot be cut into bands: each row of the flow is a column, the top row at the left,
 * and each column of the flow a level, so the flow reads from the top down. Every path is in
 * one piece. One along a row runs straight down; one that leaves for another row turns off
 * under its block and comes into the next from above, or into its side where the block's own
 * row feeds it too; one that joins a row nearer the main path comes into the side of the block
 * it reaches. A path round blocks of its row runs down the left of them and feedback up the
 * right, each in a line of its own, so that no two paths share a line and none crosses a block.
 * An adder's words stand beside its circle, on a side no path comes into.
 */
export function layoutDown(parts: readonly FlowPart[]): FlowLayout {
  const column = columnsOf(parts)
  const byId = new Map(parts.map((part) => [part.id, part]))
  const rows = [...new Set(parts.map((part) => part.row))].sort((a, b) => a - b)
  const sizes = new Map(parts.map((part) => [part.id, sizeOf(part)]))
  const levels = Math.max(0, ...column.values()) + 1
  const level = (part: FlowPart) => column.get(part.id)!
  const strip = (part: FlowPart) => rows.indexOf(part.row)

  // Every path before any place is known: the side of its block it comes into, and for one
  // that runs beside the blocks the channel it runs in. Channel k is at the left of the k-th
  // column of blocks, and the last one at the right of them all.
  interface Way {
    from: FlowPart
    to: FlowPart
    kind: FlowEdge['kind']
    side: 'top' | 'left' | 'right'
    channel?: number
    lane?: number
  }
  const ways: Way[] = []
  for (const to of parts) {
    for (const id of to.from) {
      const from = byId.get(id)!
      const way = wayOf(from, to, parts, column)
      if (way.kind === 'straight') ways.push({ from, to, kind: 'straight', side: 'top' })
      else if (way.kind === 'around') {
        ways.push({ from, to, kind: 'around', side: 'left', channel: strip(to) })
      } else if (way.kind === 'join') {
        const rightwards = strip(from) < strip(to)
        ways.push({
          from,
          to,
          kind: 'join',
          side: rightwards ? 'left' : 'right',
          ...(way.round && { channel: strip(from) + (rightwards ? 1 : 0) }),
        })
      } else {
        // A path that leaves comes into its block from above, unless that way is taken: by a
        // path along the block's own row, by another that leaves, or by a block of that row
        // standing between.
        const between = parts.some(
          (one) =>
            one.row === to.row &&
            level(one) < level(to) &&
            (level(one) > level(from) || (from.shape === 'dot' && level(one) === level(from))),
        )
        const rightwards = strip(from) < strip(to)
        const taken = ways.some((one) => one.to === to && one.side === 'top')
        if (!way.round && !between && !taken) ways.push({ from, to, kind: 'leave', side: 'top' })
        else {
          ways.push({
            from,
            to,
            kind: 'leave',
            side: rightwards ? 'left' : 'right',
            channel: strip(to) + (rightwards ? 0 : 1),
          })
        }
      }
    }
    for (const id of to.back) {
      const from = byId.get(id)!
      const channel = Math.max(strip(from), strip(to)) + 1
      ways.push({ from, to, kind: 'back', side: 'right', channel })
    }
  }

  // An adder's words stand at a side no path comes into, the left one first; where paths come
  // into both, over its left corner, in room of their own above its level.
  const placeOf = (part: FlowPart): FlowNode['place'] => {
    if (part.shape !== 'sum' || wordsOf(part).length === 0) return undefined
    const taken = (side: Way['side']) => ways.some((way) => way.to === part && way.side === side)
    return !taken('left') ? 'left' : !taken('right') ? 'right' : 'corner'
  }
  const nodes: FlowNode[] = parts.map((part) => {
    const place = placeOf(part)
    return { ...part, ...sizes.get(part.id)!, x: 0, y: 0, down: true, ...(place && { place }) }
  })
  const node = (part: FlowPart) => nodes.find((one) => one.id === part.id)!

  // The levels, from the top: room over a level for words over a corner, the blocks, room
  // under them for the numbers of their stages, and a gap in which a path turns off.
  const turns: number[] = []
  let y = 0
  for (let at = 0; at < levels; at += 1) {
    const here = nodes.filter((one) => level(one) === at)
    const corner = Math.max(
      0,
      ...here.filter((one) => one.place === 'corner').map((one) => one.lines.length),
    )
    if (corner > 0) y += corner * FLOW.line - 8
    const tall = Math.max(0, ...here.map((one) => one.h))
    for (const one of here) one.y = y + tall / 2
    y += tall + (here.some((one) => one.n !== undefined) ? FLOW.number : 0)
    turns.push(y + FLOW.gap / 2)
    y += FLOW.gap
  }
  /** Where a path that turns off after a block turns: the block itself when it is a point. */
  const turnOf = (one: FlowNode) => (one.shape === 'dot' ? one.y : turns[level(one)]!)

  // Where each path comes into the side of its block: two into one side stand a little apart.
  const entry = new Map<Way, number>()
  for (const to of nodes) {
    for (const side of ['left', 'right'] as const) {
      const into = ways.filter((way) => way.to.id === to.id && way.side === side)
      const spread = Math.min(DOWN.spread, (to.h - 8) / Math.max(1, into.length - 1))
      into.forEach((way, i) => entry.set(way, to.y + (i - (into.length - 1) / 2) * spread))
    }
  }

  // A line of its own for each path that runs beside the blocks: in each channel the shortest
  // run takes the line nearest the main path, and no two that pass each other share one.
  const span = (way: Way): [number, number] => {
    const a = turnOf(node(way.from))
    const b = entry.get(way)!
    return [Math.min(a, b), Math.max(a, b)]
  }
  const lanes = Array.from({ length: rows.length + 1 }, () => 0)
  for (let channel = 0; channel <= rows.length; channel += 1) {
    const runs = ways
      .filter((way) => way.channel === channel)
      .sort((a, b) => span(a)[1] - span(a)[0] - (span(b)[1] - span(b)[0]))
    const held: [number, number][][] = []
    for (const way of runs) {
      const [top, foot] = span(way)
      let lane = 0
      while (held[lane]?.some(([a, b]) => top < b + DOWN.lane && foot > a - DOWN.lane)) lane += 1
      ;(held[lane] ??= []).push([top, foot])
      way.lane = lane
    }
    lanes[channel] = held.length
  }

  // The columns of blocks, from the left: each as wide as its widest block reaches each way
  // with its words and its number, and between two of them room for the lines that run there.
  const reach = (one: FlowNode) => {
    const { left, right } = reachOf(one)
    return { left: one.x - left, right: right - one.x }
  }
  const main = Math.max(0, rows.indexOf(0))
  const edgesOf: { left: number; right: number }[] = []
  let x = 0
  rows.forEach((row, at) => {
    const here = nodes.filter((one) => one.row === row)
    const outer = at === 0
    x += lanes[at]! > 0 ? (lanes[at]! + (outer ? 0 : 1)) * DOWN.lane : outer ? 0 : DOWN.gap
    const left = Math.max(0, ...here.map((one) => reach(one).left))
    const right = Math.max(0, ...here.map((one) => reach(one).right))
    for (const one of here) one.x = x + left
    edgesOf.push({ left: x, right: x + left + right })
    x += left + right
  })
  /** Where a path's line stands in its channel: counted from the side nearer the main path. */
  const lineAt = (way: Way) => {
    const step = (way.lane! + 1) * DOWN.lane
    return way.channel! <= main
      ? edgesOf[way.channel!]!.left - step
      : edgesOf[way.channel! - 1]!.right + step
  }

  const foot = (one: FlowNode): [number, number] => [one.x, one.y + one.h / 2]
  /** A path that turns off after a block begins at its foot and runs down to where it turns. */
  const start = (one: FlowNode): [number, number][] =>
    one.shape === 'dot' ? [[one.x, one.y]] : [foot(one), [one.x, turnOf(one)]]
  const edges: FlowEdge[] = []
  const turned = new Set<string>()
  const parting: FlowLayout['joints'] = []
  for (const way of ways) {
    const from = node(way.from)
    const to = node(way.to)
    const head: [number, number] = [to.x, to.y - to.h / 2]
    const at = entry.get(way) ?? to.y
    // The side of the block the path comes into: an adder is a circle, so a path that comes in
    // off its middle reaches it a little further in.
    const inset = to.shape === 'sum' ? to.w / 2 - Math.sqrt((to.w / 2) ** 2 - (at - to.y) ** 2) : 0
    const side: [number, number] = [
      way.side === 'left' ? to.x - to.w / 2 + inset : to.x + to.w / 2 - inset,
      at,
    ]
    let points: [number, number][]
    if (way.channel !== undefined) {
      const line = lineAt(way)
      turned.add(from.id)
      points = [...start(from), [line, turnOf(from)], [line, at], side]
    } else if (way.kind === 'straight') points = [foot(from), head]
    else if (way.kind === 'join') {
      points = [foot(from), [from.x, at], side]
      // Where the block feeds its own row too, that path goes on down from where this one turns.
      if (ways.some((one) => one.from === way.from && one.kind === 'straight')) {
        parting.push({ x: from.x, y: at, signal: from.signal })
      }
    } else {
      turned.add(from.id)
      points = [...start(from), [to.x, turnOf(from)], head]
    }
    edges.push({ from: from.id, to: to.id, kind: way.kind, signal: from.signal, points })
  }

  // A dot where a wire turns off after a block that also feeds something else.
  const joints = nodes
    .filter((one) => one.shape !== 'dot' && turned.has(one.id))
    .filter((one) => edges.filter((edge) => edge.from === one.id).length > 1)
    .map((one) => ({ x: one.x, y: turnOf(one), signal: one.signal }))
    .concat(parting)

  const reaches = nodes.map(reachOf)
  const xs = [
    ...reaches.flatMap((one) => [one.left, one.right]),
    ...edges.flatMap((edge) => edge.points.map(([px]) => px)),
  ]
  const ys = [
    ...reaches.flatMap((one) => [one.top, one.bottom]),
    ...edges.flatMap((edge) => edge.points.map(([, py]) => py)),
  ]
  const dx = FLOW.pad - Math.min(...xs)
  const dy = FLOW.pad - Math.min(...ys)
  return {
    width: Math.max(...xs) + dx + FLOW.pad,
    height: Math.max(...ys) + dy + FLOW.pad,
    nodes: nodes.map((one) => ({ ...one, x: one.x + dx, y: one.y + dy })),
    edges: edges.map((edge) => ({
      ...edge,
      points: edge.points.map(([px, py]) => [px + dx, py + dy] as [number, number]),
    })),
    joints: joints.map((joint) => ({ ...joint, x: joint.x + dx, y: joint.y + dy })),
    down: true,
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

/**
 * The columns dealt into bands, each as many columns as `width` holds and never fewer than one.
 * Where `allowed` is given, a band ends only after a column it allows a cut after, and so may
 * be wider than `width`.
 */
function bandsOf(
  flow: FlowLayout,
  columns: { right: number }[],
  width: number,
  allowed: (column: number) => boolean = () => true,
): Band[] {
  const end = columns.length - 1
  const cutAfter = (c: number) => (c === end ? flow.width : columns[c]!.right + WRAP.cut)
  const bands: Band[] = []
  for (let first = 0; first <= end;) {
    const left = first === 0 ? 0 : cutAfter(first - 1)
    const wide = (last: number) =>
      cutAfter(last) - left + (first > 0 ? WRAP.lead : 0) + (last < end ? WRAP.lead : 0)
    let last = first
    while (last < end && (wide(last + 1) <= width || !allowed(last))) last += 1
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
 *
 * With `clean`, the picture is cut only where one plain path along a row crosses and nothing
 * else does, so that no loop, no side row and no path round a block is cut in two. A band may
 * then be wider than `width`, and a picture with no such place is given back as it is.
 */
export function wrapFlow(flow: FlowLayout, width: number, clean = false): FlowLayout {
  const columns = flow.columns
  if (flow.width <= width || !columns || columns.length < 2) return flow
  // The column each block stands in, and whether a cut after a column crosses one plain path.
  const columnOf = (id: string) => {
    const x = flow.nodes.find((one) => one.id === id)!.x
    return columns.findIndex((one) => x >= one.left - 0.5 && x <= one.right + 0.5)
  }
  const allowed = (column: number) => {
    if (!clean) return true
    const crossing = flow.edges.filter((edge) => {
      const [a, b] = [columnOf(edge.from), columnOf(edge.to)]
      return Math.min(a, b) <= column && column < Math.max(a, b)
    })
    return crossing.length <= 1 && crossing.every((edge) => edge.kind === 'straight')
  }
  let bands = bandsOf(flow, columns, width, allowed)
  for (let narrower = width - 8; narrower > 0; narrower -= 8) {
    const tried = bandsOf(flow, columns, narrower, allowed)
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
 * may be wide there, in bands or as it is (`fitFlow`). A picture is shown at four fifths of its size at the least
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

/**
 * A flow for a column `width` wide: as it is laid out where that fits; cut into bands where it
 * can be cut without cutting a loop or a side row in two, and the bands fit; and otherwise
 * running downward, every path in one piece. A flow of many rows and few columns is wider
 * running downward than along: where neither fits, the narrower of the two is given, and it
 * scrolls in its box.
 */
export function fitFlow(
  parts: readonly FlowPart[],
  width: number,
  wide: FlowLayout = layoutFlow(parts),
): FlowLayout {
  if (wide.width <= width) return wide
  const bands = wrapFlow(wide, width, true)
  if (bands !== wide && bands.width <= width) return bands
  const down = layoutDown(parts)
  return down.width <= width || down.width < wide.width ? down : wide
}

/** A flow laid out for each width of column: one picture for all the widths that take the same. */
export function flowLayouts(parts: readonly FlowPart[]): { fits: string[]; flow: FlowLayout }[] {
  const wide = layoutFlow(parts)
  const layouts: { fits: string[]; flow: FlowLayout; cut: string }[] = []
  for (const fit of FLOW_FITS) {
    const flow = fitFlow(parts, fit.width, wide)
    // Two pictures cut at the same places are the same picture, and so are two that run downward.
    const cut = flow.down ? 'down' : flow.nodes.map((one) => one.band ?? 0).join(' ')
    const same = layouts.find((one) => one.cut === cut)
    if (same) same.fits.push(fit.name)
    else layouts.push({ fits: [fit.name], flow, cut })
  }
  return layouts.map(({ fits, flow }) => ({ fits, flow }))
}

/** A path's corners as an SVG path. */
export const pathOf = (points: readonly [number, number][]): string =>
  points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join('')
