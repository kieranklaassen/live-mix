// The signal-flow picture: blocks that name a row and what feeds them are laid out, every
// connection is drawn, and a block that names a tap the lab lacks stops the build.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Flow from '../../src/figures/Flow.tsx'
import { flowBlocks, layoutFlow, type FlowBlock, type FlowEdge } from '../../src/figures/flow.ts'
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
})
