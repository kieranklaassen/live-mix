// The signal-flow picture: blocks that name a row and what feeds them are laid out, every
// connection is drawn, and a block that names a tap the lab lacks stops the build.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Flow from '../../src/figures/Flow.tsx'
import {
  FLOW,
  FLOW_FITS,
  flowBlocks,
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
  const block = new RegExp(`<g class="flow-block" data-block="${id}"[^>]*>(.*?)</g>`).exec(
    html,
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
    // A path that is cut ends in a mark that it goes on.
    expect(html).toContain('class="flow-on"')
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
