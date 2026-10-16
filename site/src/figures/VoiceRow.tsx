// A voice as blocks in a row. Each block is one place along the signal's path, and under its
// name stand two small pictures of the sound there: two cycles of its wave, and the level of
// each harmonic of the note as a bar. Read along the row, the pictures say what each block did
// to the sound that reached it.
//
// The lab hands over both pictures of a block as curve taps: the wave against cycles, and the
// harmonics in dB against their number. The picture is SVG. The page as built carries it as the
// lab stood when the site was built, so it is there with scripts off; with `live` it follows the
// running lab.

import { useLab } from '../lab/page.ts'
import { ROLE_VAR, type TapRef } from './roles.ts'

/** One block of the row: the two curve taps that show the sound at its output. */
export interface RowBlock {
  /** A curve of the wave, against cycles of the note. Its name is the block's. */
  wave: TapRef
  /** A curve of the harmonics' levels in dB, against the harmonic's number. */
  parts: TapRef
}

/** The row as it stood when the site was built: each tap's points, by its id. */
export interface BuiltRow {
  curves: Record<string, number[]>
  /** What each tap's last point stands at: cycles for a wave, the highest harmonic for bars. */
  ends: Record<string, number>
}

interface Props {
  blocks: RowBlock[]
  built?: BuiltRow
  /** Follow the lab as it runs. Left out, the picture stays as it was built. */
  live?: boolean
  /** The bottom and the top of the bars, in dB. */
  min?: number
  max?: number
  /** Draw each wave to its own peak. Left out, every wave is drawn to the largest of the row. */
  own?: boolean
  label: string
}

/**
 * One block's picture, in SVG units: the wave above, the bars under it. A block that stands
 * alone is drawn on a wider sheet, so that its lettering is the size a row's is.
 */
const WIDE_IN_A_ROW = 180
const WIDE_ALONE = 320
const HIGH = 180
const LEFT = 28
/** The widest a block that stands alone is drawn. */
const ALONE_AT_MOST = '27rem'
const WAVE_TOP = 6
const WAVE_BOTTOM = 62
const BARS_TOP = 86
const BARS_BOTTOM = 152
/** The room the word "cycles" takes at the right end of the wave's axis, in SVG units. */
const UNIT_ROOM = 44
/** The least a wave's scale is, so that silence is a level line and not a division by 0. */
const LEAST_PEAK = 1e-4

const MONO = { fontFamily: 'var(--lm-font-mono)', fontSize: 10.5, fill: 'var(--lm-muted)' } as const

const peakOf = (ys: ArrayLike<number>) => {
  let most = 0
  for (let i = 0; i < ys.length; i += 1) most = Math.max(most, Math.abs(ys[i]!))
  return most
}

/** A wave as the points of an SVG line from `LEFT` to `right`, to a scale of `peak`. */
function waveLine(ys: ArrayLike<number>, peak: number, right: number): string {
  const middle = (WAVE_TOP + WAVE_BOTTOM) / 2
  const half = (WAVE_BOTTOM - WAVE_TOP) / 2 - 2
  // More points than pixels says nothing more: a line of at most 360.
  const stride = Math.max(1, Math.ceil(ys.length / 360))
  let d = ''
  for (let i = 0; i < ys.length; i += stride) {
    const x = LEFT + (i / Math.max(1, ys.length - 1)) * (right - LEFT)
    const y = middle - Math.max(-1, Math.min(1, ys[i]! / peak)) * half
    d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return d
}

export default function VoiceRow({
  blocks,
  built,
  live = false,
  min = -96,
  max = 0,
  own = false,
  label,
}: Props) {
  const state = useLab()
  const result = live ? state.result : undefined
  const curve = (tap: TapRef): ArrayLike<number> =>
    result?.taps[tap.id]?.channels_data[0] ?? built?.curves[tap.id] ?? []
  const endOf = (tap: TapRef): number => result?.taps[tap.id]?.x1 ?? built?.ends[tap.id] ?? 0

  const waves = blocks.map((block) => curve(block.wave))
  const bars = blocks.map((block) => curve(block.parts))
  const shared = Math.max(LEAST_PEAK, ...waves.map(peakOf))
  const has = waves.some((ys) => ys.length > 0) || bars.some((ys) => ys.length > 0)
  const up = (db: number) =>
    BARS_BOTTOM -
    ((Math.max(min, Math.min(max, db)) - min) / (max - min)) * (BARS_BOTTOM - BARS_TOP)
  const levels = [max, (max + min) / 2, min]
  const alone = blocks.length === 1
  const sheet = alone ? WIDE_ALONE : WIDE_IN_A_ROW
  const right = sheet - 4

  return (
    <div className="voice-row" data-figure data-drawn={has ? '' : undefined}>
      <ol
        role="img"
        aria-label={label}
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: alone
            ? `minmax(0, ${ALONE_AT_MOST})`
            : 'repeat(auto-fit, minmax(9.4rem, 1fr))',
          gap: '0.6rem 0.5rem',
        }}
      >
        {blocks.map((block, at) => {
          const ink = `var(${ROLE_VAR[block.wave.role]})`
          const wave = waves[at]!
          const levelsOf = bars[at]!
          const cycles = endOf(block.wave)
          const count = Math.max(1, levelsOf.length)
          const slot = (right - LEFT) / count
          const peak = own ? Math.max(LEAST_PEAK, peakOf(wave)) : shared
          const middle = (WAVE_TOP + WAVE_BOTTOM) / 2
          return (
            <li
              key={block.wave.id}
              style={{
                margin: 0,
                border: '1px solid var(--lm-edge)',
                borderRadius: 'var(--lm-radius)',
                background: 'var(--lm-panel)',
                padding: '0.4rem 0.35rem 0.2rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '0.35rem',
                  alignItems: 'baseline',
                  fontSize: '0.8rem',
                  lineHeight: 1.25,
                  minHeight: '2.1rem',
                  padding: '0 0.2rem',
                  color: 'var(--lm-text)',
                }}
              >
                <span aria-hidden="true" style={{ color: 'var(--lm-muted)' }}>
                  {at === 0 ? '●' : '→'}
                </span>
                <span>{block.wave.name}</span>
              </div>
              <svg
                viewBox={`0 0 ${sheet} ${HIGH}`}
                aria-hidden="true"
                style={{ display: 'block', width: '100%', height: 'auto' }}
              >
                {/* The wave: a level line at nothing, and a mark at each whole cycle. */}
                <line
                  x1={LEFT}
                  y1={middle}
                  x2={right}
                  y2={middle}
                  stroke="var(--sig-grid)"
                  strokeWidth={1}
                />
                {cycles > 0 &&
                  Array.from({ length: Math.floor(cycles + 1e-3) + 1 }, (_, cycle) => {
                    const x = LEFT + (cycle / cycles) * (right - LEFT)
                    // The unit stands at the right end, where a number would run into it.
                    const numbered = right - x > UNIT_ROOM
                    return (
                      <g key={cycle}>
                        <line
                          x1={x}
                          y1={WAVE_TOP}
                          x2={x}
                          y2={WAVE_BOTTOM}
                          stroke="var(--lm-grid-line)"
                          strokeWidth={1}
                        />
                        {numbered && (
                          <text
                            x={x}
                            y={WAVE_BOTTOM + 11}
                            textAnchor={cycle === 0 ? 'start' : 'middle'}
                            style={MONO}
                          >
                            {cycle}
                          </text>
                        )}
                      </g>
                    )
                  })}
                <text x={right} y={WAVE_BOTTOM + 11} textAnchor="end" style={MONO}>
                  cycles
                </text>
                <path
                  d={waveLine(wave, peak, right)}
                  fill="none"
                  stroke={ink}
                  strokeWidth={1.4}
                  strokeLinejoin="round"
                />
                {/* The harmonics: a bar each, from the bottom of the scale up to its level. */}
                {levels.map((db) => (
                  <g key={db}>
                    <line
                      x1={LEFT}
                      y1={up(db)}
                      x2={right}
                      y2={up(db)}
                      stroke={db === min ? 'var(--sig-grid)' : 'var(--lm-grid-line)'}
                      strokeWidth={1}
                    />
                    <text x={LEFT - 3} y={up(db) + 3} textAnchor="end" style={MONO}>
                      {Math.round(db)}
                    </text>
                  </g>
                ))}
                <text x={0} y={BARS_TOP - 8} style={MONO}>
                  dB
                </text>
                {Array.from(levelsOf, (db, k) =>
                  db > min ? (
                    <rect
                      key={k}
                      x={LEFT + (k + 0.2) * slot}
                      y={up(db)}
                      width={slot * 0.6}
                      height={BARS_BOTTOM - up(db)}
                      fill={ink}
                    />
                  ) : null,
                )}
                {[1, Math.round(count / 2), count]
                  .filter((k, i, all) => k >= 1 && all.indexOf(k) === i)
                  .map((k) => (
                    <text
                      key={k}
                      x={LEFT + (k - 0.5) * slot}
                      y={BARS_BOTTOM + 11}
                      textAnchor="middle"
                      style={MONO}
                    >
                      {k}
                    </text>
                  ))}
                <text x={right} y={HIGH - 2} textAnchor="end" style={MONO}>
                  harmonic
                </text>
              </svg>
            </li>
          )
        })}
      </ol>
      <ul className="fig-legend key" style={{ paddingLeft: 0 }}>
        {blocks.map((block) => (
          <li key={block.wave.id}>
            <i style={{ background: `var(${ROLE_VAR[block.wave.role]})` }} />
            {block.wave.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
