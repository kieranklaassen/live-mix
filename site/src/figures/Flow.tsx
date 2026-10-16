// A signal-flow picture: the blocks of a technique and the paths between them, laid out by
// flow.ts. It is in the page as built, so it reads with scripts off; with them on, the block
// whose tap is sounding is lit.

import { useLab } from '../lab/page.ts'
import { FLOW, layoutFlow, pathOf, type FlowEdge, type FlowPart, type FlowSignal } from './flow.ts'

/** What the key calls the two kinds of wire. */
const SIGNAL_NAME: Record<FlowSignal, string> = {
  sound: 'sound: what can be heard',
  value: 'a value worked out from the sound: never heard',
}

const HEAD = 7
/** How far the picture may shrink, as a part of its own size. */
const SMALLEST = 0.8

/** An arrowhead at the end of a path, pointing the way its last stretch runs. */
function headOf(edge: FlowEdge): string {
  const [x, y] = edge.points[edge.points.length - 1]!
  const [px, py] = edge.points[edge.points.length - 2]!
  const length = Math.hypot(x - px, y - py) || 1
  const ux = (x - px) / length
  const uy = (y - py) / length
  const bx = x - ux * HEAD
  const by = y - uy * HEAD
  const wing = HEAD * 0.55
  return `M${x},${y}L${bx - uy * wing},${by + ux * wing}L${bx + uy * wing},${by - ux * wing}Z`
}

interface Props {
  blocks: FlowPart[]
  /** What the picture shows, for a reader who cannot see it. */
  label: string
}

export default function Flow({ blocks, label }: Props) {
  const state = useLab()
  const flow = layoutFlow(blocks)
  const lit = state.playing ? state.sounding : undefined
  // The blocks a path reaches from under them.
  const fromBelow = new Set(
    flow.edges
      .filter((edge) => {
        const [, y] = edge.points[edge.points.length - 1]!
        const to = flow.nodes.find((node) => node.id === edge.to)
        return to !== undefined && y >= to.y + to.h / 2
      })
      .map((edge) => edge.to),
  )
  const signals = (['sound', 'value'] as const).filter((signal) =>
    blocks.some((block) => block.signal === signal),
  )
  return (
    <div className="flow">
      <div className="flow-scroll">
        <svg
          viewBox={`0 0 ${flow.width} ${flow.height}`}
          role="img"
          aria-label={label}
          // Its own size at most, and never so small that its words cannot be read: in a window
          // narrower than that it scrolls in its box.
          style={{ maxWidth: flow.width, minWidth: Math.round(flow.width * SMALLEST) }}
        >
          {flow.edges.map((edge) => (
            <path
              key={`${edge.from}>${edge.to}`}
              className="flow-wire"
              data-edge={`${edge.from}>${edge.to}`}
              data-kind={edge.kind}
              data-signal={edge.signal}
              d={pathOf(edge.points)}
            />
          ))}
          {flow.edges.map((edge) => {
            const to = flow.nodes.find((node) => node.id === edge.to)
            return to?.shape === 'dot' ? null : (
              <path
                key={`${edge.from}>${edge.to}`}
                className="flow-head"
                data-signal={edge.signal}
                d={headOf(edge)}
              />
            )
          })}
          {flow.joints.map((joint) => (
            <circle
              key={`${joint.x},${joint.y}`}
              className="flow-joint"
              data-signal={joint.signal}
              cx={joint.x}
              cy={joint.y}
              r={3.5}
            />
          ))}
          {flow.nodes.map((node) => (
            <g
              key={node.id}
              className="flow-block"
              data-block={node.id}
              data-shape={node.shape}
              data-signal={node.signal}
              data-lit={node.tap !== undefined && node.tap === lit ? '' : undefined}
            >
              {node.shape === 'box' && (
                <rect
                  x={node.x - node.w / 2}
                  y={node.y - node.h / 2}
                  width={node.w}
                  height={node.h}
                />
              )}
              {node.shape === 'dot' && <circle cx={node.x} cy={node.y} r={4} />}
              {node.shape === 'sum' && (
                <>
                  <circle cx={node.x} cy={node.y} r={node.w / 2} />
                  <path
                    className="flow-plus"
                    d={`M${node.x - 6},${node.y}h12M${node.x},${node.y - 6}v12`}
                  />
                </>
              )}
              {node.lines.map((line, i) => (
                <text
                  key={line}
                  x={node.x}
                  y={node.y + (i - (node.lines.length - 1) / 2) * 16}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {line}
                </text>
              ))}
              {node.n !== undefined && (
                <text
                  className="flow-number"
                  // Under the block's middle, or under its corner where a path comes in there.
                  x={fromBelow.has(node.id) ? node.x - node.w / 2 : node.x}
                  y={node.y + node.h / 2 + FLOW.number - 3}
                  textAnchor={fromBelow.has(node.id) ? 'start' : 'middle'}
                >
                  {node.n}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <ul className="key">
        {signals.map((signal) => (
          <li key={signal}>
            <i data-signal={signal} />
            {SIGNAL_NAME[signal]}
          </li>
        ))}
      </ul>
    </div>
  )
}
