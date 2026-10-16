// The grains a pool started, over the recording they read. Along the top, what is recorded,
// against the loop's time, with a dot where the middle of each grain reads it. Under it, on the
// same clock, each grain as a bead: where it lies across says when it sounds, how far down says
// how far behind the write point it reads. A bead is as long as its grain sounds and as thick
// as its window is open; it lies level when the grain reads at the speed of the recording,
// climbs towards the write point when it reads faster, and falls away when it reads slower or
// backwards. One grain is picked out and joined to the piece of the recording it reads: a piece
// to its left, since that sound was recorded earlier, and wider than the bead when the grain
// reads faster than the recording runs.
//
// The lab lays the grains out as a picture of six rows, one column a grain: when it starts (s),
// how long it lasts (s), how far behind it starts reading (ms), its speed (below zero:
// backwards), its gain, and a mark: 1 for the grain to pick out, 2 for a read head that is no
// grain and is drawn as a level line.
//
// The picture is SVG, so the page as built carries it at the values it was built at and it is
// there with scripts off. With `still` it stays that picture; without, it follows the lab once
// the lab has rendered.

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { pagePlayer, useLab, waitingText } from '../lab/page.ts'
import { label as number, loopAxis, minMaxColumns, roomyAxis, ticks } from './draw.ts'
import { linesAt } from './Plot.tsx'
import { ROLE_VAR, type TapRef } from './roles.ts'

/** The picture as it stood when the site was built. */
export interface BuiltCloud {
  /** Six numbers a grain, as the lab's tap lays them out: the grains that touch the stretch shown. */
  grains: number[]
  /** How many grains the whole loop holds, and how long the loop is, in seconds. */
  count: number
  seconds: number
  /** The deepest any grain of the loop reads, in milliseconds behind the write point. */
  deepest: number
  /** The recording over the stretch shown: its lowest and its highest sample in each column. */
  wave?: number[]
  /** The level lines, at the values the picture was built at. */
  lines?: { y: number; text: string }[]
}

interface Props {
  tap: TapRef
  /** A sound tap drawn along the top as the recording the grains read. */
  wave?: TapRef
  /** Where the stretch shown starts and how long it is, in seconds. The whole loop when left out. */
  from?: number
  span?: number
  /** Controls in milliseconds drawn as a level line across the picture: [id, name] pairs. */
  lines?: [string, string][]
  /** Milliseconds behind at the bottom of the picture; fitted to the grains when left out. */
  max?: number
  height?: number
  /** A small picture, for a card. */
  compact?: boolean
  /** The picture as built, and no more: it does not follow the lab. */
  still?: boolean
  built?: BuiltCloud
  label: string
}

const ROWS = 6
/** Points along each edge of a bead. */
const STEPS = 12
/** Columns of the recording as built: a column is two numbers in the page. */
export const WAVE_COLUMNS = 240
const MONO = { fontFamily: 'var(--lm-font-mono)', fontSize: 11, fill: 'var(--lm-muted)' } as const
/** Words that stand on the picture keep a rim of the page's colour, so a bead under them does not hide them. */
const RIM = { paintOrder: 'stroke', stroke: 'var(--lm-bg)', strokeWidth: 4 } as const
const role = (name: keyof typeof ROLE_VAR) => `var(${ROLE_VAR[name]})`
const fixed = (value: number) => value.toFixed(1)

interface Grain {
  start: number
  lasts: number
  behind: number
  rate: number
  mark: number
}

export default function GrainCloud({
  tap,
  wave,
  from = 0,
  span,
  lines = [],
  max,
  height,
  compact = false,
  still = false,
  built,
  label,
}: Props) {
  const state = useLab()
  const clip = useId()
  const result = still ? undefined : state.result
  const found = result?.taps[tap.id]
  const live = result !== undefined
  const loop = loopAxis(result, from, span)
  const seconds = live ? loop.seconds : (built?.seconds ?? loop.seconds)
  const length = live ? loop.length : (span ?? seconds - from)
  const data: ArrayLike<number> = live ? (found?.channels_data[0] ?? []) : (built?.grains ?? [])
  const rows = live ? (found?.columns ?? 0) : Math.floor(data.length / ROWS)
  const total = live ? rows : (built?.count ?? rows)
  const marks = live ? linesAt(lines, state.values) : (built?.lines ?? [])
  const has = rows > 0
  const waiting = has || still ? undefined : waitingText(state)

  // The picture is drawn at the width it is shown at, so its words stay the size they are set in.
  const box = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(compact ? 400 : 680)
  useEffect(() => {
    const element = box.current
    if (still || !element) return
    const fit = () => setWidth(Math.max(240, Math.round(element.clientWidth)))
    fit()
    const watch = new ResizeObserver(fit)
    watch.observe(element)
    return () => watch.disconnect()
  }, [still])

  const tall = height ?? (compact ? 190 : 300)
  const left = compact ? 34 : 44
  // A card's picture runs to the card's edge: room for half of the last number along the bottom.
  const right = compact ? 18 : 10
  const stripTop = 8
  const stripHeight = wave ? (compact ? 34 : 52) : 0
  const gap = wave ? (compact ? 16 : 26) : 0
  const top = stripTop + stripHeight + gap
  const bottomEdge = tall - 22
  const w = Math.max(1, width - left - right)
  const h = Math.max(1, bottomEdge - top)

  // The grains that touch the stretch, the deepest any reads, and the one picked out.
  const grains: Grain[] = []
  let deepest = live ? 0 : (built?.deepest ?? 0)
  for (let g = 0; g < rows; g += 1) {
    const start = data[g * ROWS]!
    const lasts = data[g * ROWS + 1]!
    const behind = data[g * ROWS + 2]!
    const rate = data[g * ROWS + 3]!
    const mark = data[g * ROWS + 5]!
    deepest = Math.max(deepest, behind, behind - (rate - 1) * lasts * 1000)
    if (start + lasts < from || start > from + length) continue
    grains.push({ start, lasts, behind, rate, mark })
  }
  for (const mark of marks) deepest = Math.max(deepest, mark.y)
  const floor = max ?? roomyAxis(0, Math.max(deepest, 1)).max

  const px = (at: number) => left + ((at - from) / length) * w
  const py = (behind: number) => top + (Math.min(behind, floor * 1.5) / floor) * h
  /** Where in the loop's time a grain starts to read the recording, and where it stops. */
  const readFrom = (g: Grain) => g.start - g.behind / 1000
  const readTo = (g: Grain) => readFrom(g) + g.rate * g.lasts
  const inside = (at: number) => at >= from && at <= from + length

  // The grain picked out: the one the lab marks, where it and its piece of the recording are
  // both in the picture, or else the first after a third of the stretch of which that is so.
  const beads = grains.filter((g) => g.mark !== 2)
  const heads = grains.filter((g) => g.mark === 2)
  const whole = (g: Grain) =>
    inside(g.start) && inside(g.start + g.lasts) && inside(readFrom(g)) && inside(readTo(g))
  const picked =
    beads.find((g) => g.mark === 1 && whole(g)) ??
    beads.find((g) => g.start >= from + length / 3 && whole(g)) ??
    beads.find(whole)

  // Thick enough to see a bead's shape, thin enough for a spray of them to stay apart.
  const fat = Math.max(3, Math.min(8, h / 22))
  const bead = (g: Grain) => {
    const x0 = px(g.start)
    const x1 = px(g.start + g.lasts)
    // Reading faster than the recording runs, a grain gains on the write point.
    const y0 = py(g.behind)
    const y1 = py(g.behind - (g.rate - 1) * g.lasts * 1000)
    if (x1 - x0 < 2.5) {
      const lo = Math.min(y0, y1) - fat * 0.6
      const hi = Math.max(y0, y1) + fat * 0.6
      const wide = Math.max(1, x1 - x0)
      return `M${fixed(x0)},${fixed(lo)}h${fixed(wide)}V${fixed(hi)}h${fixed(-wide)}Z`
    }
    let path = ''
    for (let k = 0; k <= STEPS; k += 1) {
      const part = k / STEPS
      const open = 0.5 - 0.5 * Math.cos(2 * Math.PI * part)
      path += `${k === 0 ? 'M' : 'L'}${fixed(x0 + (x1 - x0) * part)},${fixed(y0 + (y1 - y0) * part - fat * open)}`
    }
    for (let k = STEPS; k >= 0; k -= 1) {
      const part = k / STEPS
      const open = 0.5 - 0.5 * Math.cos(2 * Math.PI * part)
      path += `L${fixed(x0 + (x1 - x0) * part)},${fixed(y0 + (y1 - y0) * part + fat * open)}`
    }
    return `${path}Z`
  }
  const others = beads
    .filter((g) => g !== picked)
    .map(bead)
    .join('')

  // The recording along the top, and a dot on it where the middle of each grain reads.
  const liveWave = wave ? result?.taps[wave.id]?.channels_data[0] : undefined
  const columns = useMemo(() => {
    if (!wave) return undefined
    if (!live) return built?.wave
    if (!liveWave || !result) return undefined
    const rate = result.frames / seconds
    return minMaxColumns(liveWave, from * rate, (from + length) * rate, WAVE_COLUMNS)
  }, [wave, live, built, liveWave, result, seconds, from, length])
  const stripMiddle = stripTop + stripHeight / 2
  let envelope = ''
  if (wave && columns && columns.length >= 4) {
    const count = columns.length / 2
    let peak = 1e-6
    for (let i = 0; i < columns.length; i += 1) {
      if (Number.isFinite(columns[i]!)) peak = Math.max(peak, Math.abs(columns[i]!))
    }
    const half = stripHeight / 2 - 1
    const x = (c: number) => fixed(left + ((c + 0.5) / count) * w)
    const y = (value: number) =>
      fixed(stripMiddle - ((Number.isFinite(value) ? value : 0) / peak) * half)
    for (let c = 0; c < count; c += 1)
      envelope += `${c === 0 ? 'M' : 'L'}${x(c)},${y(columns[2 * c + 1]!)}`
    for (let c = count - 1; c >= 0; c -= 1) envelope += `L${x(c)},${y(columns[2 * c]!)}`
    envelope += 'Z'
  }
  const dot = compact ? 1.6 : 2.2
  let dots = ''
  if (wave) {
    for (const g of beads) {
      const at = (readFrom(g) + readTo(g)) / 2
      if (g === picked || !inside(at)) continue
      dots += `M${fixed(px(at) - dot)},${fixed(stripMiddle)}a${dot},${dot} 0 1,0 ${2 * dot},0a${dot},${dot} 0 1,0 ${-2 * dot},0Z`
    }
  }

  // The moving line, while the loop plays.
  const line = useRef<SVGLineElement | null>(null)
  const playing = !still && state.playing
  useEffect(() => {
    const bar = line.current
    if (!bar) return
    if (!playing || !has) {
      bar.style.display = 'none'
      return
    }
    let frame = 0
    const move = () => {
      frame = requestAnimationFrame(move)
      const at = pagePlayer().position()
      if (at === null || !(at >= from && at <= from + length)) {
        bar.style.display = 'none'
        return
      }
      const x = fixed(left + ((at - from) / length) * w)
      bar.style.display = 'inline'
      bar.setAttribute('x1', x)
      bar.setAttribute('x2', x)
    }
    move()
    return () => cancelAnimationFrame(frame)
  }, [playing, has, from, length, left, w])

  const across = ticks({ min: from, max: from + length }, compact ? 3 : 5)
  const down = ticks({ min: 0, max: floor }, compact ? 3 : 4).filter((value) => value > 0)
  const grid = { stroke: 'var(--lm-grid-line)', strokeWidth: 1 } as const
  const each = seconds > 0 ? total / seconds : 0
  const pickedColour = role('alt')

  return (
    <div className="fig-plot" data-figure data-drawn={has ? '' : undefined}>
      <div className="fig-canvas" ref={box}>
        <svg
          viewBox={`0 0 ${width} ${tall}`}
          width="100%"
          role="img"
          aria-label={label}
          style={{ display: 'block', height: 'auto' }}
        >
          <defs>
            <clipPath id={clip}>
              <rect x={left} y={0} width={w} height={tall} />
            </clipPath>
          </defs>

          {across.map((value) => (
            <g key={`x${value}`}>
              <line x1={px(value)} x2={px(value)} y1={stripTop} y2={bottomEdge} {...grid} />
              <text x={px(value)} y={tall - 7} textAnchor="middle" {...MONO}>
                {number(value)}
              </text>
            </g>
          ))}
          {down.map((value) => (
            <g key={`y${value}`}>
              <line x1={left} x2={left + w} y1={py(value)} y2={py(value)} {...grid} />
              <text x={left - 6} y={py(value) + 4} textAnchor="end" {...MONO}>
                {number(value)}
              </text>
            </g>
          ))}
          <line
            x1={left}
            x2={left + w}
            y1={top}
            y2={top}
            stroke="var(--lm-muted)"
            strokeWidth={1}
          />
          <text x={left - 6} y={top + 4} textAnchor="end" {...MONO}>
            0
          </text>

          <g clipPath={`url(#${clip})`}>
            {wave && (
              <>
                <path d={envelope} fill={role(wave.role)} opacity={0.45} />
                {picked && (
                  <rect
                    x={Math.min(px(readFrom(picked)), px(readTo(picked)))}
                    y={stripTop}
                    width={Math.max(1, Math.abs(px(readTo(picked)) - px(readFrom(picked))))}
                    height={stripHeight}
                    fill={pickedColour}
                    opacity={0.3}
                  />
                )}
                <path d={dots} fill={role(tap.role)} />
              </>
            )}

            {marks.map((mark) => (
              <line
                key={mark.text}
                x1={left}
                x2={left + w}
                y1={py(mark.y)}
                y2={py(mark.y)}
                stroke="var(--lm-muted)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            ))}

            {heads.map((g) => (
              <line
                key={`h${g.start}`}
                x1={px(g.start)}
                x2={px(g.start + g.lasts)}
                y1={py(g.behind)}
                y2={py(g.behind - (g.rate - 1) * g.lasts * 1000)}
                stroke={role(tap.role)}
                strokeWidth={3}
              />
            ))}
            <path d={others} fill={role(tap.role)} opacity={0.55} />
            {picked && wave && (
              <path
                d={
                  `M${fixed(px(readFrom(picked)))},${fixed(stripTop + stripHeight)}` +
                  `L${fixed(px(picked.start))},${fixed(py(picked.behind))}` +
                  `M${fixed(px(readTo(picked)))},${fixed(stripTop + stripHeight)}` +
                  `L${fixed(px(picked.start + picked.lasts))},${fixed(py(picked.behind - (picked.rate - 1) * picked.lasts * 1000))}`
                }
                fill="none"
                stroke={pickedColour}
                strokeWidth={1}
              />
            )}
            {picked && <path d={bead(picked)} fill={pickedColour} />}

            {marks.map((mark) => (
              <text
                key={`t${mark.text}`}
                x={left + w - 6}
                y={Math.max(top + 12, py(mark.y) - fat - 4)}
                textAnchor="end"
                {...MONO}
                style={RIM}
              >
                {mark.text}
              </text>
            ))}
            <line
              ref={line}
              y1={stripTop}
              y2={bottomEdge}
              stroke="var(--lm-playhead)"
              strokeWidth={1}
              style={{ display: 'none' }}
            />
          </g>

          {wave && (
            <text x={left + 6} y={stripTop + 11} {...MONO} style={RIM}>
              {compact ? 'recorded' : wave.name.toLowerCase()}
            </text>
          )}
          <text x={left + 6} y={top + 14} {...MONO} style={RIM}>
            the write point: now
          </text>
          <text x={left + 6} y={bottomEdge - 6} {...MONO} style={RIM}>
            ms behind it
          </text>
          <text x={left + w - 6} y={bottomEdge - 6} textAnchor="end" {...MONO} style={RIM}>
            seconds
          </text>
        </svg>
        {waiting && <p className="fig-waiting">{waiting}</p>}
      </div>
      <ul className="fig-legend key">
        {wave && (
          <li>
            <i style={{ background: `var(${ROLE_VAR[wave.role]})` }} />
            {wave.name}
            {beads.length > 0 ? ', with a dot where the middle of each grain reads it' : ''}
          </li>
        )}
        {heads.length > 0 ? (
          <li>
            <i style={{ background: `var(${ROLE_VAR[tap.role]})` }} />
            One read head, no grain: the same distance behind all the way
          </li>
        ) : (
          <li>
            <i style={{ background: `var(${ROLE_VAR[tap.role]})` }} />A grain: as long as it sounds,
            as thick as its window is open
          </li>
        )}
        {picked && (
          <li>
            <i style={{ background: `var(${ROLE_VAR.alt})` }} />
            {wave
              ? 'One grain, joined to the piece of the recording it reads'
              : 'The grain looked at'}
          </li>
        )}
        {has && heads.length === 0 && (
          <li className="at">
            {compact ? (
              `${total} grains in the loop, ${number(Math.round(each * 10) / 10)} a second`
            ) : (
              <>
                <b>{total}</b> grains in the loop, <b>{number(Math.round(each * 10) / 10)}</b> a
                second
              </>
            )}
          </li>
        )}
      </ul>
    </div>
  )
}
