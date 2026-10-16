// A signal-flow picture, apart from any page: blocks that each name a row and what feeds them,
// checked against the lab and laid out as boxes joined by paths. A path may leave the main row
// for a side row and come back into it, go round a block, or come back against the flow.
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
}

export interface FlowLayout {
  width: number
  height: number
  nodes: FlowNode[]
  edges: FlowEdge[]
  /** Where a wire divides after a block: drawn as a dot. */
  joints: { x: number; y: number; signal: FlowSignal }[]
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
    Math.max(0, ...parts.filter((p) => column.get(p.id) === c).map((p) => sizes.get(p.id)!.w)),
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

  // Move everything so the picture starts at its own top left corner, with room round it.
  const xs = [
    ...nodes.flatMap((one) => [one.x - one.w / 2, one.x + one.w / 2]),
    ...edges.flatMap((edge) => edge.points.map(([x]) => x)),
  ]
  const ys = [
    ...nodes.flatMap((one) => [one.y - one.h / 2, one.y + one.h / 2 + (one.n ? FLOW.number : 0)]),
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
  }
}

/** A path's corners as an SVG path. */
export const pathOf = (points: readonly [number, number][]): string =>
  points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join('')
