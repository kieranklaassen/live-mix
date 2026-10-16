// The signal-flow picture: blocks that name a row and what feeds them are laid out, every
// connection is drawn, and a block that names a tap the lab lacks stops the build.
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Flow from '../../src/figures/Flow.tsx'
import {
  FLOW,
  FLOW_FITS,
  fitFlow,
  flowBlocks,
  flowLayouts,
  layoutDown,
  layoutFlow,
  wrapFlow,
  type FlowBlock,
  type FlowEdge,
  type FlowLayout,
} from '../../src/figures/flow.ts'
import type { TapInfo } from '../../src/lab/describe.ts'

const taps: TapInfo[] = [
  { index: 0, id: 'in', name: 'Input', unit: '', kind: 'audio', origin: 'source', channels: 2 },
  {
    index: 1,
    id: 'sidechain',
    name: 'Side chain, high-passed',
    unit: '',
    kind: 'audio',
    origin: 'device',
    channels: 2,
  },
  {
    index: 2,
    id: 'level',
    name: 'Level',
    unit: 'dB',
    kind: 'control',
    origin: 'lesson',
    channels: 1,
  },
  { index: 3, id: 'out', name: 'Output', unit: '', kind: 'audio', origin: 'device', channels: 2 },
]

/** A compressor: the side chain leaves the main path at the split and comes back into the gain. */
const SIDE: FlowBlock[] = [
  { id: 'in', label: 'in', shape: 'end', tap: 'in' },
  { id: 'split', shape: 'dot', from: 'in' },
  { id: 'hp', row: 1, from: 'split', tap: 'sidechain', label: 'high-pass' },
  { id: 'level', row: 1, from: 'hp', tap: 'level' },
  { id: 'gain', label: '× gain', from: ['split', 'level'] },
  { id: 'mix', label: 'make-up and mix', from: ['gain', 'split'], tap: 'out' },
  { id: 'out', label: 'out', shape: 'end', from: 'mix' },
]

/** A string: what comes out of the filter goes back into the sum. */
const LOOP: FlowBlock[] = [
  { id: 'pluck', label: 'pluck', shape: 'end' },
  { id: 'sum', shape: 'sum', from: 'pluck', back: 'filter' },
  { id: 'delay', label: 'delay line', from: 'sum' },
  { id: 'filter', label: 'loop filter', from: 'delay' },
  { id: 'out', label: 'out', shape: 'end', from: 'filter' },
]

const edge = (edges: FlowEdge[], from: string, to: string) => {
  const found = edges.find((one) => one.from === from && one.to === to)
  if (!found) throw new Error(`no connection from ${from} to ${to}`)
  return found
}
const first = (one: FlowEdge) => one.points[0]!
const last = (one: FlowEdge) => one.points[one.points.length - 1]!

describe('a flow with a side row', () => {
  const flow = layoutFlow(flowBlocks(SIDE, taps, 'a lesson'))
  const node = (id: string) => flow.nodes.find((one) => one.id === id)!

  it('draws every connection once', () => {
    expect(flow.edges.map((one) => `${one.from}>${one.to}`).sort()).toEqual(
      [
        'in>split',
        'split>hp',
        'hp>level',
        'split>gain',
        'level>gain',
        'gain>mix',
        'split>mix',
        'mix>out',
      ].sort(),
    )
  })

  it('stands the blocks along the flow, the side row under the main path', () => {
    const main = ['in', 'split', 'gain', 'mix', 'out'].map((id) => node(id).x)
    expect(main).toEqual([...main].sort((a, b) => a - b))
    expect(new Set(main).size).toBe(main.length)
    expect(node('hp').y).toBeGreaterThan(node('split').y)
    expect(node('level').y).toBe(node('hp').y)
    expect(node('level').x).toBeGreaterThan(node('hp').x)
    // What a side row feeds stands after it.
    expect(node('gain').x).toBeGreaterThan(node('level').x)
  })

  it('leaves the main path downwards from the split, then runs into the side row from its left', () => {
    const leaving = edge(flow.edges, 'split', 'hp')
    expect(leaving.kind).toBe('leave')
    expect(first(leaving)).toEqual([node('split').x, node('split').y])
    expect(leaving.points[1]).toEqual([node('split').x, node('hp').y])
    expect(last(leaving)).toEqual([node('hp').x - node('hp').w / 2, node('hp').y])
  })

  it('comes back into the main path from below', () => {
    const joining = edge(flow.edges, 'level', 'gain')
    expect(joining.kind).toBe('join')
    expect(first(joining)).toEqual([node('level').x + node('level').w / 2, node('level').y])
    expect(last(joining)).toEqual([node('gain').x, node('gain').y + node('gain').h / 2])
  })

  it('takes a path round a block over it, and into the top of the block it reaches', () => {
    const round = edge(flow.edges, 'split', 'mix')
    expect(round.kind).toBe('around')
    const over = Math.min(...round.points.map(([, y]) => y))
    expect(over).toBeLessThan(node('gain').y - node('gain').h / 2)
    expect(last(round)).toEqual([node('mix').x, node('mix').y - node('mix').h / 2])
    // Nothing of the picture is cut off: the path is inside it.
    expect(over).toBeGreaterThan(0)
  })

  it('runs a plain connection straight along its row', () => {
    const straight = edge(flow.edges, 'gain', 'mix')
    expect(straight.kind).toBe('straight')
    expect(straight.points).toEqual([
      [node('gain').x + node('gain').w / 2, node('gain').y],
      [node('mix').x - node('mix').w / 2, node('mix').y],
    ])
  })

  it('carries a value where the block before it gives one, and sound elsewhere', () => {
    expect(edge(flow.edges, 'level', 'gain').signal).toBe('value')
    expect(edge(flow.edges, 'hp', 'level').signal).toBe('sound')
    expect(edge(flow.edges, 'gain', 'mix').signal).toBe('sound')
  })

  it('names a block after its tap when the lesson gives it no words', () => {
    expect(node('level').lines.join(' ')).toBe('Level')
    expect(node('hp').lines.join(' ')).toBe('high-pass')
  })

  it('holds every block and every path inside the picture', () => {
    for (const one of flow.nodes) {
      expect(one.x - one.w / 2).toBeGreaterThanOrEqual(0)
      expect(one.x + one.w / 2).toBeLessThanOrEqual(flow.width)
      expect(one.y + one.h / 2).toBeLessThanOrEqual(flow.height)
    }
    for (const one of flow.edges) {
      for (const [x, y] of one.points) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(flow.width)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(flow.height)
      }
    }
  })
})

describe('a flow with a feedback path', () => {
  const flow = layoutFlow(flowBlocks(LOOP, taps, 'a lesson'))
  const node = (id: string) => flow.nodes.find((one) => one.id === id)!

  it('draws every connection, the one that comes back among them', () => {
    expect(flow.edges.map((one) => `${one.from}>${one.to}`).sort()).toEqual(
      ['pluck>sum', 'sum>delay', 'delay>filter', 'filter>out', 'filter>sum'].sort(),
    )
  })

  it('draws the feedback back against the flow, under the row, into the foot of the sum', () => {
    const back = edge(flow.edges, 'filter', 'sum')
    expect(back.kind).toBe('back')
    // It starts after the filter and ends before it: right to left.
    expect(first(back)[0]).toBeGreaterThan(node('filter').x)
    expect(last(back)).toEqual([node('sum').x, node('sum').y + node('sum').h / 2])
    const under = Math.max(...back.points.map(([, y]) => y))
    expect(under).toBeGreaterThan(node('delay').y + node('delay').h / 2)
    expect(under).toBeLessThanOrEqual(flow.height)
    // The feedback does not move the blocks: the flow still runs left to right.
    expect(node('sum').x).toBeLessThan(node('delay').x)
    expect(node('delay').x).toBeLessThan(node('filter').x)
  })

  it('marks where the wire divides', () => {
    const [x, y] = edge(flow.edges, 'filter', 'sum').points[1]!
    expect(flow.joints).toContainEqual({ x, y, signal: 'sound' })
  })
})

/** An adder that names the tap read at its output, and has no words of its own. */
const ADDER: FlowBlock[] = [
  { id: 'in', label: 'in', shape: 'end' },
  { id: 'sum', shape: 'sum', from: 'in', tap: 'sidechain' },
  { id: 'out', label: 'out', shape: 'end', from: 'sum' },
]

/** The texts of a block as the page has them, and its circle. */
function drawn(blocks: FlowBlock[], id: string) {
  const html = renderToStaticMarkup(
    createElement(Flow, { blocks: flowBlocks(blocks, taps, 'a lesson'), label: 'A flow' }),
  )
  // The picture for the widest column: the flow as it is laid out along its rows.
  const block = new RegExp(`<g class="flow-block" data-block="${id}"[^>]*>(.*?)</g>`).exec(
    html.slice(html.lastIndexOf('<svg ')),
  )![1]!
  const circle = /<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/.exec(block)!
  return {
    circle: { x: Number(circle[1]), y: Number(circle[2]), r: Number(circle[3]) },
    words: [...block.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)</g)].map(
      ([, x, y, text]) => ({ x: Number(x), y: Number(y), text }),
    ),
  }
}

describe('an adder that names a tap', () => {
  const flow = layoutFlow(flowBlocks(ADDER, taps, 'a lesson'))
  const node = (id: string) => flow.nodes.find((one) => one.id === id)!

  it('is named after its tap and keeps the size of its circle', () => {
    expect(node('sum').lines).toEqual(['Side chain,', 'high-passed'])
    expect(node('sum').w).toBe(24)
    expect(node('sum').h).toBe(24)
  })

  it('stands its neighbours clear of its words', () => {
    const half = (11 * FLOW.letter) / 2
    expect(node('sum').x - half).toBeGreaterThanOrEqual(node('in').x + node('in').w / 2)
    expect(node('sum').x + half).toBeLessThanOrEqual(node('out').x - node('out').w / 2)
  })

  it('has its words under its circle, not across it, and inside the picture', () => {
    const { circle, words } = drawn(ADDER, 'sum')
    expect(words.map((one) => one.text)).toEqual(['Side chain,', 'high-passed'])
    // The type is 13 tall and set about its middle.
    expect(words[0]!.y - 6.5).toBeGreaterThan(circle.y + circle.r)
    expect(words[1]!.y).toBeGreaterThan(words[0]!.y + 13)
    expect(words[1]!.y + 6.5).toBeLessThanOrEqual(flow.height)
    for (const one of words) expect(one.x).toBe(circle.x)
  })

  it('has its words over its circle where a path comes into it from below', () => {
    const back = LOOP.map((block) => (block.id === 'sum' ? { ...block, tap: 'level' } : block))
    const { circle, words } = drawn(back, 'sum')
    expect(words.map((one) => one.text)).toEqual(['Level'])
    expect(words[0]!.y + 6.5).toBeLessThan(circle.y - circle.r)
    expect(words[0]!.y - 6.5).toBeGreaterThanOrEqual(0)
  })
})

/** The pieces a connection is drawn in. */
const pieces = (flow: FlowLayout, from: string, to: string) =>
  flow.edges.filter((one) => one.from === from && one.to === to)

describe('a flow wrapped into a narrow column', () => {
  const wide = layoutFlow(flowBlocks(SIDE, taps, 'a lesson'))
  const flow = wrapFlow(wide, 340)
  const node = (id: string) => flow.nodes.find((one) => one.id === id)!
  const inBand = (band: number) => flow.nodes.filter((one) => one.band === band)

  it('is left as it is where it fits', () => {
    expect(wide.width).toBeGreaterThan(340)
    expect(wrapFlow(wide, wide.width)).toBe(wide)
    expect(wide.bands).toBeUndefined()
  })

  it('is cut into bands no wider than the column, each wholly under the one before', () => {
    expect(flow.bands).toBeGreaterThan(1)
    expect(flow.width).toBeLessThanOrEqual(340)
    expect(flow.nodes.map((one) => one.id)).toEqual(wide.nodes.map((one) => one.id))
    for (const one of flow.nodes) {
      expect(one.x - one.w / 2).toBeGreaterThanOrEqual(0)
      expect(one.x + one.w / 2).toBeLessThanOrEqual(flow.width)
      expect(one.y - one.h / 2).toBeGreaterThanOrEqual(0)
      expect(one.y + one.h / 2).toBeLessThanOrEqual(flow.height)
    }
    for (let band = 1; band < flow.bands!; band += 1) {
      const foot = Math.max(...inBand(band - 1).map((one) => one.y + one.h / 2))
      const head = Math.min(...inBand(band).map((one) => one.y - one.h / 2))
      expect(inBand(band).length).toBeGreaterThan(0)
      expect(head).toBeGreaterThan(foot)
    }
  })

  it('keeps the order of the flow, along a band and then onto the next, and the rows', () => {
    const main = ['in', 'split', 'gain', 'mix', 'out'].map(node)
    main.slice(1).forEach((one, i) => {
      const before = main[i]!
      expect(one.band).toBeGreaterThanOrEqual(before.band!)
      if (one.band === before.band) expect(one.x).toBeGreaterThan(before.x)
      // The main path is one row in every band: a block of it stands level with the one before.
      if (one.band === before.band) expect(one.y).toBe(before.y)
    })
    // The side row is still under the main path of its band.
    const beside = main.find((one) => one.band === node('hp').band)!
    expect(node('hp').y).toBeGreaterThan(beside.y)
  })

  it('draws a connection that crosses a cut in two pieces: off the end of its band, and in at the start of the next at the height of its row', () => {
    const cut = wide.edges.find(
      (one) => one.kind === 'straight' && node(one.to).band === node(one.from).band! + 1,
    )!
    const from = node(cut.from)
    const to = node(cut.to)
    const [leaves, comes, ...more] = pieces(flow, cut.from, cut.to)
    expect(more).toEqual([])
    expect(leaves!.goesOn).toBe(true)
    expect(leaves!.band).toBe(from.band)
    expect(first(leaves!)).toEqual([from.x + from.w / 2, from.y])
    expect(last(leaves!)[1]).toBe(from.y)
    // Past every block of its band, and still inside the picture.
    expect(last(leaves!)[0]).toBeGreaterThan(
      Math.max(...inBand(from.band!).map((one) => one.x + one.w / 2)),
    )
    expect(last(leaves!)[0]).toBeLessThanOrEqual(flow.width)

    expect(comes!.goesOn).toBeUndefined()
    expect(comes!.band).toBe(to.band)
    expect(first(comes!)[1]).toBe(to.y)
    expect(first(comes!)[0]).toBeGreaterThanOrEqual(0)
    expect(first(comes!)[0]).toBeLessThan(
      Math.min(...inBand(to.band!).map((one) => one.x - one.w / 2)),
    )
    expect(last(comes!)).toEqual([to.x - to.w / 2, to.y])
  })

  it('draws every connection, in one piece more than the cuts it crosses, and only the last reaches its block', () => {
    for (const one of wide.edges) {
      const drawnIn = pieces(flow, one.from, one.to)
      expect(drawnIn).toHaveLength(Math.abs(node(one.to).band! - node(one.from).band!) + 1)
      expect(drawnIn.map((piece) => piece.goesOn === true)).toEqual(
        drawnIn.map((_, i) => i < drawnIn.length - 1),
      )
      expect(drawnIn.every((piece) => piece.kind === one.kind && piece.signal === one.signal)).toBe(
        true,
      )
    }
    expect(flow.joints).toHaveLength(wide.joints.length)
  })

  it('holds every path inside the picture', () => {
    for (const one of flow.edges) {
      for (const [x, y] of one.points) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(flow.width)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(flow.height)
      }
    }
  })
})

describe('a wrapped flow with a feedback path', () => {
  const flow = wrapFlow(layoutFlow(flowBlocks(LOOP, taps, 'a lesson')), 240)
  const node = (id: string) => flow.nodes.find((one) => one.id === id)!

  it('carries the feedback back through the bands, right to left, into the foot of the sum', () => {
    const from = node('filter').band!
    const to = node('sum').band!
    expect(from).toBeGreaterThan(to)
    const back = pieces(flow, 'filter', 'sum')
    expect(back.map((piece) => piece.band)).toEqual(
      Array.from({ length: from - to + 1 }, (_, i) => from - i),
    )
    // Each piece but the first comes in at the right of its band and runs leftwards.
    for (const piece of back.slice(1)) {
      expect(first(piece)[0]).toBeGreaterThan(last(piece)[0])
      expect(first(piece)[0]).toBeGreaterThan(
        Math.max(
          ...flow.nodes.filter((one) => one.band === piece.band).map((one) => one.x + one.w / 2),
        ),
      )
    }
    expect(last(back.at(-1)!)).toEqual([node('sum').x, node('sum').y + node('sum').h / 2])
  })
})

/** A place in a picture: a block's box, or the box an adder's words fill. */
interface Box {
  left: number
  right: number
  top: number
  bottom: number
}

/** Whether any stretch of a path runs through the inside of a box. */
const through = (path: FlowEdge, box: Box) =>
  path.points.slice(1).some(([x, y], i) => {
    const [x0, y0] = path.points[i]!
    return (
      Math.min(x, x0) < box.right - 0.5 &&
      Math.max(x, x0) > box.left + 0.5 &&
      Math.min(y, y0) < box.bottom - 0.5 &&
      Math.max(y, y0) > box.top + 0.5
    )
  })

/** The box the words of an adder fill, as the page draws them: 13 tall, set about their middle. */
function wordsBox(blocks: FlowBlock[], id: string): Box {
  const { words } = drawn(blocks, id)
  const half = Math.max(...words.map((one) => (one.text.length * FLOW.letter) / 2))
  return {
    left: words[0]!.x - half,
    right: words[0]!.x + half,
    top: Math.min(...words.map((one) => one.y)) - 6.5,
    bottom: Math.max(...words.map((one) => one.y)) + 6.5,
  }
}

describe('a path round a block, beside an adder with its words over its circle', () => {
  /** A string whose sum is also sent on round the delay and the filter, into the mix. */
  const LEAVING: FlowBlock[] = [
    { id: 'pluck', label: 'pluck', shape: 'end' },
    { id: 'sum', shape: 'sum', from: 'pluck', back: 'filter', tap: 'sidechain' },
    { id: 'delay', label: 'delay line', from: 'sum' },
    { id: 'filter', label: 'loop filter', from: 'delay' },
    { id: 'mix', label: 'mix', from: ['filter', 'sum'] },
    { id: 'out', label: 'out', shape: 'end', from: 'mix' },
  ]
  /** A string whose pluck also goes round a shaper, into the sum from over it. */
  const ARRIVING: FlowBlock[] = [
    { id: 'pluck', label: 'pluck', shape: 'end' },
    { id: 'shape', label: 'shaper', from: 'pluck' },
    { id: 'sum', shape: 'sum', from: ['shape', 'pluck'], back: 'filter', tap: 'sidechain' },
    { id: 'delay', label: 'delay line', from: 'sum' },
    { id: 'filter', label: 'loop filter', from: 'delay' },
    { id: 'out', label: 'out', shape: 'end', from: 'filter' },
  ]

  it('leaves the adder past its words, and does not rise through them', () => {
    const flow = layoutFlow(flowBlocks(LEAVING, taps, 'a lesson'))
    const { circle, words } = drawn(LEAVING, 'sum')
    // The words are over the circle, since the feedback comes in under it, and wider than it.
    expect(words.map((one) => one.text)).toEqual(['Side chain,', 'high-passed'])
    expect(words[1]!.y + 6.5).toBeLessThan(circle.y - circle.r)
    const round = edge(flow.edges, 'sum', 'mix')
    expect(round.kind).toBe('around')
    const box = wordsBox(LEAVING, 'sum')
    expect(through(round, box)).toBe(false)
    // It still starts at the circle's edge, and turns up before the next block.
    const sum = flow.nodes.find((one) => one.id === 'sum')!
    const delay = flow.nodes.find((one) => one.id === 'delay')!
    expect(first(round)).toEqual([sum.x + sum.w / 2, sum.y])
    expect(round.points[1]![0]).toBeGreaterThan(box.right)
    expect(round.points[1]![0]).toBeLessThan(delay.x - delay.w / 2)
    // No path of the picture runs through the words.
    for (const one of flow.edges) expect(through(one, box), `${one.from}>${one.to}`).toBe(false)
  })

  it('comes into the adder from over it under its words, which stand over the path', () => {
    const flow = layoutFlow(flowBlocks(ARRIVING, taps, 'a lesson'))
    const round = edge(flow.edges, 'pluck', 'sum')
    expect(round.kind).toBe('around')
    const sum = flow.nodes.find((one) => one.id === 'sum')!
    expect(last(round)).toEqual([sum.x, sum.y - sum.h / 2])
    const box = wordsBox(ARRIVING, 'sum')
    for (const one of flow.edges) expect(through(one, box), `${one.from}>${one.to}`).toBe(false)
    // The words are over the circle and over the path that comes down into it, inside the picture.
    const run = Math.min(...round.points.map(([, y]) => y))
    expect(box.bottom).toBeLessThanOrEqual(run)
    expect(box.top).toBeGreaterThanOrEqual(0)
  })

  it('leaves the words of an adder that no path comes round to where they were', () => {
    const back = LOOP.map((block) => (block.id === 'sum' ? { ...block, tap: 'level' } : block))
    const { circle, words } = drawn(back, 'sum')
    // One line, its middle three quarters of a line over the circle's top.
    expect(words[0]!.y).toBe(circle.y - circle.r - FLOW.line * 0.75)
  })
})

describe('a side row that joins the main path past a block of its own row', () => {
  /** Two side chains: the slow one joins the main path further along than the fast one stands. */
  const TWO: FlowBlock[] = [
    { id: 'in', label: 'in', shape: 'end' },
    { id: 'split', shape: 'dot', from: 'in' },
    { id: 'slow', row: 1, from: 'split', label: 'slow level' },
    { id: 'gain', label: '× gain', from: 'split' },
    { id: 'fast', row: 1, from: 'gain', label: 'fast level' },
    { id: 'duck', label: 'duck', from: ['gain', 'fast'] },
    { id: 'mix', label: 'mix', from: ['duck', 'slow'] },
    { id: 'out', label: 'out', shape: 'end', from: 'mix' },
  ]
  const flow = layoutFlow(flowBlocks(TWO, taps, 'a lesson'))
  const node = (id: string) => flow.nodes.find((one) => one.id === id)!
  const boxOf = (id: string): Box => {
    const one = node(id)
    return {
      left: one.x - one.w / 2,
      right: one.x + one.w / 2,
      top: one.y - one.h / 2,
      bottom: one.y + one.h / 2,
    }
  }

  it('stands the block between on the row the path would run along', () => {
    expect(node('fast').y).toBe(node('slow').y)
    expect(node('fast').x).toBeGreaterThan(node('slow').x)
    expect(node('fast').x).toBeLessThan(node('mix').x)
  })

  it('goes round the block between, on the side of the main path, and still into the foot of the block it reaches', () => {
    const joining = edge(flow.edges, 'slow', 'mix')
    expect(joining.kind).toBe('join')
    expect(through(joining, boxOf('fast'))).toBe(false)
    expect(first(joining)).toEqual([node('slow').x + node('slow').w / 2, node('slow').y])
    expect(last(joining)).toEqual([node('mix').x, node('mix').y + node('mix').h / 2])
    // Its run is between the two rows: over the side row's blocks, under the main path's.
    const run = joining.points.at(-2)![1]
    expect(run).toBeLessThan(boxOf('fast').top)
    expect(run).toBeGreaterThan(boxOf('duck').bottom)
    // And through no other block of the picture.
    for (const one of flow.nodes) {
      if (one.id !== 'slow' && one.id !== 'mix') {
        expect(through(joining, boxOf(one.id)), one.id).toBe(false)
      }
    }
  })

  it('leaves a path with nothing between running along its own row', () => {
    const joining = edge(flow.edges, 'fast', 'duck')
    expect(joining.points).toEqual([
      [node('fast').x + node('fast').w / 2, node('fast').y],
      [node('duck').x, node('fast').y],
      [node('duck').x, node('duck').y + node('duck').h / 2],
    ])
  })

  it('goes round a block of a row over the main path too, under it', () => {
    const over = TWO.map((block) => (block.row === 1 ? { ...block, row: -1 } : block))
    const up = layoutFlow(flowBlocks(over, taps, 'a lesson'))
    const at = (id: string) => up.nodes.find((one) => one.id === id)!
    const joining = edge(up.edges, 'slow', 'mix')
    const fast = at('fast')
    expect(
      through(joining, {
        left: fast.x - fast.w / 2,
        right: fast.x + fast.w / 2,
        top: fast.y - fast.h / 2,
        bottom: fast.y + fast.h / 2,
      }),
    ).toBe(false)
    expect(last(joining)).toEqual([at('mix').x, at('mix').y - at('mix').h / 2])
    expect(joining.points.at(-2)![1]).toBeGreaterThan(fast.y + fast.h / 2)
  })

  it('wraps into a narrow column with every path inside the picture', () => {
    const narrow = wrapFlow(flow, 340)
    expect(narrow.bands).toBeGreaterThan(1)
    for (const one of narrow.edges) {
      for (const [x, y] of one.points) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(narrow.width)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(narrow.height)
      }
    }
  })
})

describe('what stops the build', () => {
  it('a block that names a tap the lab lacks, with the lesson and the taps there are', () => {
    expect(() => flowBlocks([{ id: 'a', tap: 'levle' }], taps, 'compression')).toThrow(
      /compression: .*"levle".*in, sidechain, level, out/,
    )
  })

  it('a block fed by one that is not in the picture', () => {
    expect(() => flowBlocks([{ id: 'a', label: 'a', from: 'b' }], taps, 'compression')).toThrow(
      /compression: .*"a".*"b"/,
    )
  })

  it('a block with neither words nor a tap, unless it is a point', () => {
    expect(() => flowBlocks([{ id: 'a' }], taps, 'compression')).toThrow(/compression: .*"a"/)
    expect(() => flowBlocks([{ id: 'a', shape: 'dot' }], taps, 'compression')).not.toThrow()
  })

  it('two blocks with one id', () => {
    expect(() =>
      flowBlocks(
        [
          { id: 'a', label: 'a' },
          { id: 'a', label: 'b' },
        ],
        taps,
        'compression',
      ),
    ).toThrow(/compression: .*"a"/)
  })

  it('blocks that feed each other along the flow: a path that comes back is said with `back`', () => {
    expect(() =>
      flowBlocks(
        [
          { id: 'a', label: 'a', from: 'b' },
          { id: 'b', label: 'b', from: 'a' },
        ],
        taps,
        'compression',
      ),
    ).toThrow(/compression: .*back/)
  })
})

describe('the picture as it is built into the page', () => {
  const blocks = flowBlocks(SIDE, taps, 'a lesson')
  const html = renderToStaticMarkup(
    createElement(Flow, { blocks, label: 'How the signal flows through the compressor' }),
  )

  it('has a path for every connection and a shape for every block', () => {
    for (const one of layoutFlow(blocks).edges) {
      expect(html).toContain(`data-edge="${one.from}&gt;${one.to}"`)
    }
    for (const block of SIDE) expect(html).toContain(`data-block="${block.id}"`)
  })

  it('says what it shows to a reader who cannot see it, and prints a key of its lines', () => {
    expect(html).toContain('aria-label="How the signal flows through the compressor"')
    expect(html).toMatch(/class="key"[^>]*>.*sound/s)
    expect(html).toMatch(/class="key"[^>]*>.*value/s)
  })

  it('lights no block before anything sounds', () => {
    expect(html).not.toContain('data-lit')
  })

  const fits = (page: string) =>
    [...page.matchAll(/data-fits="([^"]*)"/g)].map((found) => found[1]!.split(' '))

  it('is laid out for each width of column, a narrow one wrapped, and each width is given one', () => {
    const laid = fits(html)
    expect(laid.flat().sort()).toEqual(FLOW_FITS.map((fit) => fit.name).sort())
    // This flow fits the widest columns as it is and is wrapped for the narrowest.
    expect(laid.length).toBeGreaterThan(1)
    expect(laid.at(-1)).toContain('full')
    expect(html.match(/<svg /g)).toHaveLength(laid.length)
    // Its side row would be cut in two by a band, so the narrowest runs downward, in one piece.
    expect(html).not.toContain('class="flow-on"')
    expect(flowLayouts(blocks)[0]!.flow.down).toBe(true)
  })

  it('ends a path that is cut in a mark that it goes on', () => {
    const chain = renderToStaticMarkup(
      createElement(Flow, { blocks: flowBlocks(CHAIN, taps, 'a lesson'), label: 'A chain' }),
    )
    expect(chain).toContain('class="flow-on"')
  })

  it('is built once where it fits the narrowest column as it is', () => {
    const small = renderToStaticMarkup(
      createElement(Flow, { blocks: flowBlocks(ADDER, taps, 'a lesson'), label: 'A small flow' }),
    )
    expect(fits(small)).toEqual([FLOW_FITS.map((fit) => fit.name)])
    expect(small.match(/<svg /g)).toHaveLength(1)
    expect(small).not.toContain('class="flow-on"')
  })
})

/** A plain chain: nothing leaves the row and nothing comes back. */
const CHAIN: FlowBlock[] = [
  { id: 'in', label: 'in', shape: 'end' },
  { id: 'a', label: 'a first stage', from: 'in' },
  { id: 'b', label: 'a second stage', from: 'a' },
  { id: 'c', label: 'a third stage', from: 'b' },
  { id: 'd', label: 'a fourth stage', from: 'c' },
  { id: 'out', label: 'out', shape: 'end', from: 'd' },
]

/** A tank: a dry path round everything, a loop through a side row, and stage numbers. */
const TANK: FlowBlock[] = [
  { id: 'in', label: 'in', shape: 'end' },
  { id: 'split', shape: 'dot', from: 'in' },
  { id: 'drive', label: 'drive circuit', from: 'split', n: 1 },
  { id: 'sum', shape: 'sum', from: 'drive', back: 'far', tap: 'sidechain', n: 2 },
  { id: 'line', label: 'line and pickup', from: 'sum', n: 4 },
  { id: 'tap', shape: 'dot', from: 'line' },
  { id: 'up', label: 'up, tone, level', from: 'tap', n: 8 },
  { id: 'far', row: 1, label: 'far end', from: 'tap', n: '5, 6' },
  { id: 'mix', label: 'width and mix', from: ['up', 'split'], n: 9 },
  { id: 'out', label: 'out', shape: 'end', from: 'mix' },
]

/** A text of a block as the page draws it: where it is set from, and the box it fills. */
interface Words extends Box {
  text: string
  number: boolean
}

/** Every picture of a flow as the page builds it, narrowest first: the texts of each block. */
function pictures(blocks: FlowBlock[]): Map<string, Words[]>[] {
  const html = renderToStaticMarkup(
    createElement(Flow, { blocks: flowBlocks(blocks, taps, 'a lesson'), label: 'A flow' }),
  )
  return html
    .split('<svg ')
    .slice(1)
    .map((svg) => {
      const found = new Map<string, Words[]>()
      for (const [, id, inside] of svg.matchAll(
        /<g class="flow-block" data-block="([^"]*)"[^>]*>(.*?)<\/g>/g,
      )) {
        const texts = [...inside!.matchAll(/<text ([^>]*)>([^<]*)</g)].map(([, given, text]) => {
          const read = (name: string) => new RegExp(` ?${name}="([^"]*)"`).exec(` ${given}`)?.[1]
          const number = read('class') === 'flow-number'
          const x = Number(read('x'))
          const y = Number(read('y'))
          // The words are 13 tall and set about their middle; a number is 11 tall on its baseline.
          const wide = text!.length * (number ? 6.6 : FLOW.letter)
          const anchor = read('text-anchor')
          const left = anchor === 'middle' ? x - wide / 2 : anchor === 'end' ? x - wide : x
          return {
            text: text!,
            number,
            left,
            right: left + wide,
            top: number ? y - 9 : y - 6.5,
            bottom: number ? y + 2 : y + 6.5,
          }
        })
        found.set(id!, texts)
      }
      return found
    })
}

const overlap = (a: Box, b: Box) =>
  a.left < b.right - 0.5 &&
  a.right > b.left + 0.5 &&
  a.top < b.bottom - 0.5 &&
  a.bottom > b.top + 0.5

const boxOfNode = (one: { x: number; y: number; w: number; h: number }): Box => ({
  left: one.x - one.w / 2,
  right: one.x + one.w / 2,
  top: one.y - one.h / 2,
  bottom: one.y + one.h / 2,
})

/** Whether two paths run along one line for a stretch. */
function shares(a: FlowEdge, b: FlowEdge): boolean {
  const stretches = (one: FlowEdge) =>
    one.points.slice(1).map(([x, y], i) => ({ x0: one.points[i]![0], y0: one.points[i]![1], x, y }))
  return stretches(a).some((p) =>
    stretches(b).some((q) => {
      const level = p.y0 === p.y && q.y0 === q.y && p.y === q.y
      const upright = p.x0 === p.x && q.x0 === q.x && p.x === q.x
      if (level) {
        return (
          Math.min(Math.max(p.x0, p.x), Math.max(q.x0, q.x)) -
            Math.max(Math.min(p.x0, p.x), Math.min(q.x0, q.x)) >
          1
        )
      }
      if (upright) {
        return (
          Math.min(Math.max(p.y0, p.y), Math.max(q.y0, q.y)) -
            Math.max(Math.min(p.y0, p.y), Math.min(q.y0, q.y)) >
          1
        )
      }
      return false
    }),
  )
}

describe('an adder on a side row, fed from its own row and from the main row', () => {
  const BOTH: FlowBlock[] = [
    { id: 'in', label: 'in', shape: 'end' },
    { id: 'split', shape: 'dot', from: 'in' },
    { id: 'copy', row: 1, label: 'a copy', from: 'split' },
    { id: 'gain', label: '× gain', from: 'split' },
    { id: 'sum', row: 1, shape: 'sum', from: ['copy', 'gain'] },
    { id: 'out', row: 1, label: 'out', shape: 'end', from: 'sum' },
  ]
  const flow = layoutFlow(flowBlocks(BOTH, taps, 'a lesson'))
  const sum = flow.nodes.find((one) => one.id === 'sum')!

  it('draws both wires, each to the adder and neither along the other', () => {
    const along = edge(flow.edges, 'copy', 'sum')
    const down = edge(flow.edges, 'gain', 'sum')
    expect(last(along)).toEqual([sum.x - sum.w / 2, sum.y])
    // The wire from the main row comes down into the adder's head, not along its row.
    expect(last(down)).toEqual([sum.x, sum.y - sum.h / 2])
    expect(shares(along, down)).toBe(false)
    for (const one of flow.nodes) {
      if (one.id !== 'gain' && one.id !== 'sum') {
        expect(through(down, boxOfNode(one)), one.id).toBe(false)
      }
    }
  })

  it('leaves a path to a side block that nothing else feeds running into its left', () => {
    const leaving = edge(flow.edges, 'split', 'copy')
    const copy = flow.nodes.find((one) => one.id === 'copy')!
    expect(last(leaving)).toEqual([copy.x - copy.w / 2, copy.y])
  })
})

describe('two paths into one block', () => {
  it('parts two that leave the main row for it: one into its left, one into its head', () => {
    const TWICE: FlowBlock[] = [
      { id: 'in', label: 'in', shape: 'end' },
      { id: 'split', shape: 'dot', from: 'in' },
      { id: 'pole', label: 'one pole', from: 'split' },
      { id: 'low', label: 'low', shape: 'end', from: 'pole' },
      { id: 'minus', row: 1, label: 'in minus low', from: ['split', 'pole'] },
    ]
    const flow = layoutFlow(flowBlocks(TWICE, taps, 'a lesson'))
    const minus = flow.nodes.find((one) => one.id === 'minus')!
    const far = edge(flow.edges, 'split', 'minus')
    const near = edge(flow.edges, 'pole', 'minus')
    expect(last(far)).toEqual([minus.x - minus.w / 2, minus.y])
    expect(last(near)).toEqual([minus.x, minus.y - minus.h / 2])
    expect(shares(far, near)).toBe(false)
  })

  it('parts two that come back into one adder: side by side into its foot, one loop inside the other', () => {
    const TWO_BACK: FlowBlock[] = [
      { id: 'in', label: 'in', shape: 'end' },
      { id: 'sum', shape: 'sum', from: 'in', back: ['first', 'second'] },
      { id: 'first', label: 'integrator', from: 'sum' },
      { id: 'second', label: 'integrator', from: 'first' },
      { id: 'out', label: 'out', shape: 'end', from: 'second' },
    ]
    const flow = layoutFlow(flowBlocks(TWO_BACK, taps, 'a lesson'))
    const sum = flow.nodes.find((one) => one.id === 'sum')!
    const short = edge(flow.edges, 'first', 'sum')
    const long = edge(flow.edges, 'second', 'sum')
    expect(shares(short, long)).toBe(false)
    for (const one of [short, long]) {
      expect(Math.abs(last(one)[0] - sum.x)).toBeLessThan(sum.w / 2)
      expect(last(one)[1]).toBeGreaterThan(sum.y)
      expect(last(one)[1]).toBeLessThanOrEqual(sum.y + sum.h / 2)
    }
    expect(last(short)[0]).not.toBe(last(long)[0])
    // The longer loop runs under the shorter, and the two never cross.
    const under = (one: FlowEdge) => Math.max(...one.points.map(([, y]) => y))
    expect(under(long)).toBeGreaterThan(under(short))
    expect(last(long)[0]).toBeLessThan(last(short)[0])
    expect(sum.fromBelow).toBe(true)
    expect(under(long)).toBeLessThanOrEqual(flow.height)
  })
})

describe('a block that says where it stands', () => {
  const blocks = (placed: Partial<FlowBlock>): FlowBlock[] => [
    { id: 'in', label: 'in', shape: 'end' },
    { id: 'split', shape: 'dot', from: 'in' },
    { id: 'a', label: 'a stage', from: 'split' },
    { id: 'b', label: 'b stage', from: 'a' },
    { id: 'lfo', row: 1, label: 'oscillator', ...placed },
    { id: 'cutoff', row: 1, label: 'cutoff', from: 'lfo' },
    { id: 'c', label: 'c stage', from: ['b', 'cutoff'] },
  ]
  const laid = (placed: Partial<FlowBlock>) => {
    const flow = layoutFlow(flowBlocks(blocks(placed), taps, 'a lesson'))
    return (id: string) => flow.nodes.find((one) => one.id === id)!
  }

  it('stands in the first column when it says nothing and nothing feeds it', () => {
    const node = laid({})
    expect(node('lfo').x).toBe(node('in').x)
  })

  it('stands in the column it names, and what it feeds after it', () => {
    const node = laid({ column: 2 })
    expect(node('lfo').x).toBe(node('a').x)
    expect(node('lfo').y).toBeGreaterThan(node('a').y)
    expect(node('cutoff').x).toBe(node('b').x)
    expect(node('c').x).toBeGreaterThan(node('cutoff').x)
  })

  it('never stands before what feeds it', () => {
    const flow = layoutFlow(
      flowBlocks(
        blocks({}).map((one) => (one.id === 'c' ? { ...one, column: 1 } : one)),
        taps,
        'a lesson',
      ),
    )
    const node = (id: string) => flow.nodes.find((one) => one.id === id)!
    expect(node('c').x).toBeGreaterThan(node('b').x)
  })

  it('stands two blocks of one side row that nothing feeds in two cells', () => {
    const two: FlowBlock[] = [
      { id: 'in', label: 'in', shape: 'end' },
      { id: 'lfo', row: 1, label: 'oscillator' },
      { id: 'env', row: 1, label: 'envelope' },
      { id: 'a', label: 'a stage', from: ['in', 'lfo', 'env'] },
    ]
    const flow = layoutFlow(flowBlocks(two, taps, 'a lesson'))
    const node = (id: string) => flow.nodes.find((one) => one.id === id)!
    expect(overlap(boxOfNode(node('lfo')), boxOfNode(node('env')))).toBe(false)
    expect(node('env').x).toBeGreaterThan(node('lfo').x + node('lfo').w / 2)
    expect(node('a').x).toBeGreaterThan(node('env').x)
  })

  it('stops the build on a column that is not a whole number from 0', () => {
    expect(() => flowBlocks(blocks({ column: 1.5 }), taps, 'compression')).toThrow(
      /compression: .*"lfo".*column/,
    )
    expect(() => flowBlocks(blocks({ column: -1 }), taps, 'compression')).toThrow(/column/)
  })
})

describe('an adder with words, a path into its foot and a side row joining it from above', () => {
  const JOINED: FlowBlock[] = [
    { id: 'pluck', label: 'pluck', shape: 'end' },
    { id: 'lfo', row: -1, label: 'oscillator' },
    { id: 'sum', shape: 'sum', from: ['pluck', 'lfo'], back: 'filter', tap: 'sidechain' },
    { id: 'delay', label: 'delay line', from: 'sum' },
    { id: 'filter', label: 'loop filter', from: 'delay' },
    { id: 'out', label: 'out', shape: 'end', from: 'filter' },
  ]
  const flow = layoutFlow(flowBlocks(JOINED, taps, 'a lesson'))
  const words = pictures(JOINED).at(-1)!.get('sum')!

  it('has the join come down into its head and the feedback up into its foot', () => {
    const sum = flow.nodes.find((one) => one.id === 'sum')!
    expect(last(edge(flow.edges, 'lfo', 'sum'))).toEqual([sum.x, sum.y - sum.h / 2])
    expect(last(edge(flow.edges, 'filter', 'sum'))).toEqual([sum.x, sum.y + sum.h / 2])
  })

  it('stands its words where no path crosses them, and clear of every block', () => {
    expect(words.map((one) => one.text)).toEqual(['Side chain,', 'high-passed'])
    for (const line of words) {
      for (const one of flow.edges) expect(through(one, line), `${one.from}>${one.to}`).toBe(false)
      for (const one of flow.nodes) expect(overlap(line, boxOfNode(one)), one.id).toBe(false)
      expect(line.left).toBeGreaterThanOrEqual(0)
      expect(line.right).toBeLessThanOrEqual(flow.width)
      expect(line.top).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('the number of a stage', () => {
  const numbered = (shape: FlowBlock['shape'], label: string): FlowBlock[] => [
    { id: 'in', label: 'in', shape: 'end' },
    { id: 'sum', shape: 'sum', from: 'in', back: 'more' },
    { id: 'x', shape, label, from: 'sum', n: '5, 6' },
    { id: 'more', label: 'a longer block here', from: 'x' },
    { id: 'last', label: 'and one more block', from: 'more' },
    { id: 'out', label: 'out', shape: 'end', from: 'last' },
  ]

  for (const shape of ['box', 'end', 'sum'] as const) {
    for (const label of ['one line', 'two lines\nof words']) {
      it(`never lies over the words of a block: ${shape}, ${label.replace('\n', ' / ')}`, () => {
        const drawnAt = pictures(numbered(shape, label))
        // The narrowest picture runs downward and the widest along: both are held.
        expect(drawnAt.length).toBeGreaterThan(1)
        for (const picture of drawnAt) {
          const texts = picture.get('x')!
          const number = texts.find((one) => one.number)!
          const words = texts.filter((one) => !one.number)
          expect(number.text).toBe('5, 6')
          expect(words).toHaveLength(label.split('\n').length)
          for (const line of words) expect(overlap(number, line), line.text).toBe(false)
        }
      })
    }
  }

  it('stands clear of every path, along the flow and downward', () => {
    const parts = flowBlocks(TANK, taps, 'a lesson')
    const layouts = [fitFlow(parts, 340), layoutFlow(parts)]
    pictures(TANK)
      .filter((_, index, all) => index === 0 || index === all.length - 1)
      .forEach((picture, index) => {
        for (const [id, texts] of picture) {
          for (const text of texts.filter((one) => one.number)) {
            for (const one of layouts[index]!.edges) {
              expect(through(one, text), `${id}: ${one.from}>${one.to}`).toBe(false)
            }
          }
        }
      })
  })
})

describe('a flow too wide for its column', () => {
  it('is cut into bands where one plain path crosses, and a loop stays whole', () => {
    const short = LOOP.map((one) => ({ ...one, label: one.label?.split(' ').at(-1) }))
    const parts = flowBlocks(short, taps, 'a lesson')
    const flow = fitFlow(parts, 340)
    expect(layoutFlow(parts).width).toBeGreaterThan(340)
    expect(flow.down).toBeUndefined()
    expect(flow.bands).toBeGreaterThan(1)
    expect(flow.width).toBeLessThanOrEqual(340)
    for (const one of flow.edges) if (one.goesOn) expect(one.kind).toBe('straight')
    expect(pieces(flow, 'filter', 'sum')).toHaveLength(1)
    const band = (id: string) => flow.nodes.find((one) => one.id === id)!.band
    expect(band('delay')).toBe(band('sum'))
    expect(band('filter')).toBe(band('sum'))
  })

  it('wraps a plain chain as a line of text wraps', () => {
    const flow = fitFlow(flowBlocks(CHAIN, taps, 'a lesson'), 340)
    expect(flow.down).toBeUndefined()
    expect(flow.bands).toBeGreaterThan(1)
    expect(flow.width).toBeLessThanOrEqual(340)
  })

  it('is given back as it is where it fits', () => {
    const parts = flowBlocks(ADDER, taps, 'a lesson')
    const flow = fitFlow(parts, 340)
    expect(flow.down).toBeUndefined()
    expect(flow.bands).toBeUndefined()
    expect(flow).toEqual(layoutFlow(parts))
  })

  it('runs downward where a band would cut a loop or a side row in two', () => {
    for (const blocks of [SIDE, TANK]) {
      const flow = fitFlow(flowBlocks(blocks, taps, 'a lesson'), 340)
      expect(flow.down).toBe(true)
      expect(flow.bands).toBeUndefined()
    }
  })
})

describe('a flow that runs downward', () => {
  const parts = flowBlocks(TANK, taps, 'a lesson')
  const wide = layoutFlow(parts)
  const flow = layoutDown(parts)
  const node = (id: string) => flow.nodes.find((one) => one.id === id)!
  const texts = pictures(TANK)[0]!

  it('fits a narrow column, with every block and every path inside it', () => {
    expect(flow.down).toBe(true)
    expect(flow.width).toBeLessThanOrEqual(340)
    for (const one of flow.nodes) {
      const box = boxOfNode(one)
      expect(box.left).toBeGreaterThanOrEqual(0)
      expect(box.right).toBeLessThanOrEqual(flow.width)
      expect(box.top).toBeGreaterThanOrEqual(0)
      expect(box.bottom).toBeLessThanOrEqual(flow.height)
    }
    for (const one of flow.edges) {
      for (const [x, y] of one.points) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(flow.width)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(flow.height)
      }
    }
    for (const [, lines] of texts) {
      for (const line of lines) {
        expect(line.left).toBeGreaterThanOrEqual(0)
        expect(line.right).toBeLessThanOrEqual(flow.width)
        expect(line.bottom).toBeLessThanOrEqual(flow.height)
      }
    }
  })

  it('stands each row of the flow as a column, the main path at the left, in the order of the flow', () => {
    const main = ['in', 'split', 'drive', 'sum', 'line', 'tap', 'up', 'mix', 'out'].map(node)
    for (const one of main) expect(one.x).toBe(main[0]!.x)
    main.slice(1).forEach((one, i) => expect(one.y).toBeGreaterThan(main[i]!.y))
    expect(node('far').x).toBeGreaterThan(node('line').x + node('line').w / 2)
    expect(node('far').y).toBeGreaterThan(node('tap').y)
  })

  it('draws every connection once, in one piece, in level and upright stretches', () => {
    expect(flow.edges.map((one) => `${one.from}>${one.to}`).sort()).toEqual(
      wide.edges.map((one) => `${one.from}>${one.to}`).sort(),
    )
    for (const one of flow.edges) {
      expect(one.goesOn).toBeUndefined()
      expect(one.signal).toBe(edge(wide.edges, one.from, one.to).signal)
      one.points.slice(1).forEach(([x, y], i) => {
        const [x0, y0] = one.points[i]!
        expect(x === x0 || y === y0, `${one.from}>${one.to}`).toBe(true)
      })
    }
  })

  it("runs no path through a block, through a block's words or through a number", () => {
    for (const one of flow.edges) {
      for (const block of flow.nodes) {
        // A path that turns off at a point starts at its middle.
        if (block.shape === 'dot' && block.id === one.from) continue
        expect(through(one, boxOfNode(block)), `${one.from}>${one.to} through ${block.id}`).toBe(
          false,
        )
      }
      for (const [id, lines] of texts) {
        for (const line of lines) {
          expect(through(one, line), `${one.from}>${one.to} over "${line.text}" of ${id}`).toBe(
            false,
          )
        }
      }
    }
  })

  it('stands no words on a block or on other words', () => {
    const all = [...texts].flatMap(([id, lines]) => lines.map((line) => ({ id, line })))
    for (const { id, line } of all) {
      for (const block of flow.nodes) {
        if (block.id !== id) expect(overlap(line, boxOfNode(block)), `${line.text}`).toBe(false)
      }
      for (const other of all) {
        if (other.line !== line) expect(overlap(line, other.line), line.text).toBe(false)
      }
    }
  })

  it('runs no two paths from different blocks along one line', () => {
    for (const a of flow.edges) {
      for (const b of flow.edges) {
        if (a.from !== b.from)
          expect(shares(a, b), `${a.from}>${a.to} ${b.from}>${b.to}`).toBe(false)
      }
    }
  })

  it('takes the feedback up one side, clear of every block, into the side of the adder', () => {
    const back = edge(flow.edges, 'far', 'sum')
    expect(back.kind).toBe('back')
    const sum = node('sum')
    expect(last(back)[0]).toBe(sum.x + sum.w / 2)
    expect(Math.abs(last(back)[1] - sum.y)).toBeLessThanOrEqual(sum.h / 2)
    // It goes up: its end is higher on the page than its start.
    expect(last(back)[1]).toBeLessThan(first(back)[1])
    const run = Math.max(...back.points.map(([x]) => x))
    for (const one of flow.nodes) expect(run).toBeGreaterThan(one.x + one.w / 2)
  })

  it('takes a path round blocks of its row down the other side', () => {
    const round = edge(flow.edges, 'split', 'mix')
    expect(round.kind).toBe('around')
    const mix = node('mix')
    expect(last(round)[0]).toBe(mix.x - mix.w / 2)
    const run = Math.min(...round.points.map(([x]) => x))
    for (const one of flow.nodes) expect(run).toBeLessThan(one.x - one.w / 2)
  })

  it('marks where a wire divides after a block', () => {
    expect(flow.joints.length).toBe(wide.joints.length)
  })

  it('says under the picture how its rows stand', () => {
    const html = renderToStaticMarkup(createElement(Flow, { blocks: parts, label: 'A tank' }))
    expect(html).toMatch(/class="flow-turned"[^>]*>[^<]*top row[^<]*left/)
    const chain = renderToStaticMarkup(
      createElement(Flow, { blocks: flowBlocks(ADDER, taps, 'a lesson'), label: 'A small flow' }),
    )
    expect(chain).not.toContain('flow-turned')
  })

  it('holds a flow with a row over the main path and one under it', () => {
    const three: FlowBlock[] = [
      ...SIDE,
      { id: 'lfo', row: -1, label: 'oscillator' },
      { id: 'depth', row: -1, label: 'depth', from: 'lfo' },
    ].map((one) => (one.id === 'mix' ? { ...one, from: ['gain', 'split', 'depth'] } : one))
    const down = layoutDown(flowBlocks(three, taps, 'a lesson'))
    const at = (id: string) => down.nodes.find((one) => one.id === id)!
    expect(at('lfo').x).toBeLessThan(at('in').x)
    expect(at('hp').x).toBeGreaterThan(at('in').x)
    for (const one of down.edges) {
      for (const block of down.nodes) {
        if (block.shape === 'dot' && block.id === one.from) continue
        expect(through(one, boxOfNode(block)), `${one.from}>${one.to} through ${block.id}`).toBe(
          false,
        )
      }
    }
  })
})

describe('a block that is lit', () => {
  const styles = fs.readFileSync(
    fileURLToPath(new URL('../../src/styles/parts.css', import.meta.url)),
    'utf8',
  )
  /** The rules that colour the words of a lit block: each selector with what it declares. */
  const rules = [...styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(([, selector, body]) => ({ selector: selector!.trim(), body: body! }))
    .filter(({ selector }) => selector.includes('[data-lit]') && /\btext\b/.test(selector))

  it('keeps its name: only words inside a box are set in the colour of the page', () => {
    const ground = rules.filter(({ body }) => /fill:\s*var\(--lm-bg\)/.test(body))
    expect(ground.length).toBeGreaterThan(0)
    // Bare words at an end of the flow and an adder's words stand on the picture's own ground.
    for (const { selector } of ground) expect(selector).toContain("[data-shape='box']")
    const others = rules.filter(
      ({ selector }) => !selector.includes('data-shape') && !selector.endsWith('text.flow-number'),
    )
    expect(others.length).toBeGreaterThan(0)
    for (const { body } of others) expect(body).toMatch(/fill:\s*var\(--lm-accent\)/)
  })
})
