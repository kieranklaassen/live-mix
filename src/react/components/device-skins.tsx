// Skins for devices: what makes an effect its own object in a chain. A skin
// is five choices (a plate colour, two inks, a finish, a knob cap, a picture)
// and the four knobs that sit on the face; `DevicePlate` draws it. Nothing
// here is an image file: a finish is noise or a gradient drawn once, and a
// picture is drawn from what the effect does and follows its settings, so
// more Feedback on the Tape Echo draws more repeats.
//
// The looks are the kit's own. Names are the devices' names, and no plate
// borrows a maker's colours or layout.

import { type ReactNode } from 'react'

import { type Device, isEditorDevice } from '../../core/devices/Device'
import { type KnobCap } from './Knob'
import { PLATE_FACES } from './displays'
import { type PlateDisplay } from './plate-display'
import { HOSTED_PLATES, PLATE_PALETTES } from './plate-palettes'

/** How a plate's surface is worked. */
export type PlateFinish =
  'matte' | 'grain' | 'brushed' | 'speckle' | 'hammered' | 'linen' | 'fade' | 'gloss'

export const PLATE_FINISHES: readonly PlateFinish[] = [
  'matte',
  'grain',
  'brushed',
  'speckle',
  'hammered',
  'linen',
  'fade',
  'gloss',
]

/** A plate's picture box: every picture is drawn in it, in the lower half, under the knobs. */
export const PLATE_PICTURE_WIDTH = 240
export const PLATE_PICTURE_HEIGHT = 140

/**
 * A picture of what the device does, in the plate's two inks. `draw` gets the
 * position (0..1) of any parameter and returns SVG for the picture box; it is
 * drawn again only when one of `params` moves.
 */
export interface PlatePicture {
  params: readonly string[]
  draw: (at: (param: string) => number) => ReactNode
}

export interface DeviceSkin {
  /** The name on the tag, when the device's own is too long for it. */
  name?: string
  /** The plate's colour; any CSS colour, so a quiet skin can follow the theme. */
  plate: string
  /** Lines, knobs and the name tag. */
  ink: string
  /** The second ink: the lamp and what the picture points out. */
  accent: string
  /** Whether the plate is dark, which decides the finish's light; read off a hex `plate` when left out. */
  dark?: boolean
  finish: PlateFinish
  cap: Exclude<KnobCap, 'arc'>
  /**
   * The knobs on the face, in order: four over a picture, eight without one.
   * Left out, they are the device's first parameters.
   */
  face?: readonly string[]
  /** Shorter words for a knob than its parameter's name. */
  labels?: Readonly<Record<string, string>>
  picture?: PlatePicture
  /**
   * What the device is doing, on a canvas that moves with it (`plate-display.ts`).
   * It stands where the picture would, and a skin with both shows the display.
   * The face is four knobs over a strip, and two, four or six beside a window.
   */
  display?: PlateDisplay
}

const INK = 'var(--lm-plate-ink)'
const ACCENT = 'var(--lm-plate-accent)'
const PLATE = 'var(--lm-plate)'

const r1 = (value: number): number => Math.round(value * 10) / 10
const path = (points: readonly (readonly [number, number])[]): string =>
  points.map(([x, y], index) => `${index ? 'L' : 'M'}${r1(x)} ${r1(y)}`).join('')
const range = (count: number): number[] => Array.from({ length: Math.max(0, count) }, (_, i) => i)
const lerp = (from: number, to: number, t: number): number => from + (to - from) * t

/** The same scatter every time: a number in 0..1 from two integers. */
function scatter(a: number, b = 0): number {
  let s = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) >>> 0
  s = Math.imul(s ^ (s >>> 13), 1274126177) >>> 0
  return ((s ^ (s >>> 16)) >>> 0) / 4294967295
}

/** Rings of a hall, from the far corner: Decay adds rings, Size spreads them. */
const tides: PlatePicture = {
  params: ['decay', 'size'],
  draw: (at) => {
    const step = lerp(10, 18, at('size'))
    const rings = 4 + Math.round(at('decay') * 6)
    return range(rings).map((k) => (
      <circle
        key={k}
        cx={178}
        cy={152}
        r={r1(18 + k * step)}
        fill="none"
        stroke={k % 3 === 0 ? ACCENT : INK}
        strokeWidth={k === 0 ? 2 : 1.2}
        opacity={r1(1 - k / (rings + 1))}
      />
    ))
  },
}

/** A sun on a horizon: Size widens the halo, Decay adds to it. */
const expanse: PlatePicture = {
  params: ['size', 'decay'],
  draw: (at) => {
    const halos = 2 + Math.round(at('decay') * 4)
    const reach = lerp(0.6, 1, at('size'))
    return (
      <>
        <path d="M0 112H240" stroke={INK} strokeWidth={1} opacity={0.7} />
        <path d="M108 112A12 12 0 0 1 132 112Z" fill={ACCENT} />
        {range(halos).map((k) => {
          const r = r1((24 + k * k * 4 + k * 14) * reach)
          return (
            <path
              key={k}
              d={`M${120 - r} 112A${r} ${r} 0 0 1 ${120 + r} 112`}
              fill="none"
              stroke={k === 0 ? ACCENT : INK}
              strokeWidth={1.2}
              opacity={r1(0.85 - (k * 0.7) / halos)}
            />
          )
        })}
        {[
          [118, 30],
          [124, 20],
          [130, 10],
        ].map(([y, half], k) => (
          <path
            key={y}
            d={`M${120 - half} ${y}H${120 + half}`}
            stroke={ACCENT}
            strokeWidth={1.2}
            opacity={r1(0.7 - k * 0.2)}
          />
        ))}
      </>
    )
  },
}

/** A wave, and with Freeze on its last cycle held over and over. */
const ether: PlatePicture = {
  params: ['freeze', 'decay'],
  draw: (at) => {
    const wave = (x: number): number =>
      92 + 14 * Math.sin(x / 9) * (0.4 + 0.6 * Math.sin(x / 31) ** 2)
    const frozen = at('freeze') >= 0.5
    const live: [number, number][] = []
    for (let x = 8; x <= 100; x += 2) live.push([x, wave(x)])
    if (!frozen) {
      // Unfrozen, the wave runs on and dies away as fast as Decay lets it.
      const fall = lerp(26, 110, at('decay'))
      const tail: [number, number][] = []
      for (let x = 100; x <= 232; x += 2)
        tail.push([x, 92 + (wave(x) - 92) * Math.exp(-(x - 100) / fall)])
      return (
        <>
          <path d={path(live)} fill="none" stroke={INK} strokeWidth={1.4} />
          <path d={path(tail)} fill="none" stroke={INK} strokeWidth={1.2} opacity={0.6} />
          <path d="M100 70V112" stroke={ACCENT} strokeWidth={1.2} strokeDasharray="2 3" />
        </>
      )
    }
    return (
      <>
        <path d={path(live)} fill="none" stroke={INK} strokeWidth={1.2} opacity={0.55} />
        <path d="M100 70V112" stroke={ACCENT} strokeWidth={1.6} />
        {range(5).map((cycle) => {
          const held: [number, number][] = []
          for (let x = 0; x <= 26; x += 2) held.push([100 + cycle * 26 + x, wave(74 + x)])
          return (
            <g key={cycle}>
              <path d={path(held)} fill="none" stroke={INK} strokeWidth={1.4} />
              <rect x={98 + cycle * 26} y={70} width={4} height={4} fill={ACCENT} />
            </g>
          )
        })}
      </>
    )
  },
}

/** Grains: Density is how many, Spray how far they stray, Size how big. */
const cloud: PlatePicture = {
  params: ['density', 'spray', 'size'],
  draw: (at) => {
    const grains = 30 + Math.round(at('density') * 140)
    const spread = lerp(50, 170, at('spray'))
    const size = lerp(0.6, 1.5, at('size'))
    return range(grains).map((k) => (
      <circle
        key={k}
        cx={r1(128 + (scatter(k, 1) + scatter(k, 2) + scatter(k, 3) - 1.5) * spread)}
        cy={r1(102 + (scatter(k, 4) + scatter(k, 5) - 1) * 44)}
        r={r1((0.7 + 1.9 * scatter(k, 6)) * size)}
        fill={k % 5 === 0 ? ACCENT : INK}
        opacity={r1(0.3 + 0.6 * scatter(k, 7))}
      />
    ))
  },
}

/** A reel and its repeats: Feedback adds repeats, Time sets them apart. */
const tapeEcho: PlatePicture = {
  params: ['time', 'feedback'],
  draw: (at) => {
    const repeats = 2 + Math.round(at('feedback') * 6)
    const gap = lerp(30, 52, at('time'))
    const reels: ReactNode[] = []
    let x = 34
    let step = gap
    for (let k = 0; k < repeats && x < 232; k += 1) {
      const r = r1(20 * 0.82 ** k)
      const fade = r1(1 - k * 0.12)
      reels.push(
        k === 0 ? (
          <g key={k}>
            <circle cx={x} cy={96} r={r} fill={ACCENT} />
            <circle cx={x} cy={96} r={5} fill={PLATE} />
          </g>
        ) : (
          <g key={k} opacity={fade}>
            <circle cx={r1(x)} cy={96} r={r} fill="none" stroke={INK} strokeWidth={1.5} />
            {k < 3 ? <circle cx={r1(x)} cy={96} r={2} fill={INK} /> : null}
          </g>
        ),
      )
      x += step
      step *= 0.84
    }
    return (
      <>
        {reels}
        <path d="M8 96H232" stroke={INK} strokeWidth={0.8} opacity={0.4} />
      </>
    )
  },
}

/** Rays that rise and end in sparks: Shimmer lifts them, Decay draws more sparks. */
const shimmer: PlatePicture = {
  params: ['shimmer', 'decay'],
  draw: (at) => {
    const lift = lerp(0.35, 1.25, at('shimmer'))
    const sparks = 1 + Math.round(at('decay') * 2)
    const diamond = (x: number, y: number, r: number): string =>
      `M${x} ${r1(y - r)}L${r1(x + r)} ${r1(y)}L${x} ${r1(y + r)}L${r1(x - r)} ${r1(y)}Z`
    return range(14).map((k) => {
      const x = 18 + k * 16
      const top = 126 - (10 + k * 3.6 + 8 * scatter(k, 9)) * lift
      return (
        <g key={k}>
          <path d={`M${x} 138V${r1(top)}`} stroke={INK} strokeWidth={1} opacity={0.6} />
          <path d={diamond(x, top, 3)} fill={ACCENT} />
          {sparks > 1 ? <path d={diamond(x, top - 10, 2)} fill={ACCENT} opacity={0.7} /> : null}
          {sparks > 2 ? <path d={diamond(x, top - 17, 1.3)} fill={ACCENT} opacity={0.45} /> : null}
        </g>
      )
    })
  },
}

/** A loop of tape past a head: Length makes the loop longer. */
const tapeLoop: PlatePicture = {
  params: ['length'],
  draw: (at) => {
    const left = r1(lerp(150, 60, at('length')))
    const loop = (inset: number): string => {
      const r = 22 - inset
      return `M${left} ${80 + inset}H203A${r} ${r} 0 0 1 203 ${124 - inset}H${left}A${r} ${r} 0 0 1 ${left} ${80 + inset}Z`
    }
    const mid = r1((left + 203) / 2)
    return (
      <>
        <path d={loop(0)} fill="none" stroke={INK} strokeWidth={7} opacity={0.28} />
        <path d={loop(0)} fill="none" stroke={INK} strokeWidth={1.2} />
        <path
          d={loop(10)}
          fill="none"
          stroke={INK}
          strokeWidth={1}
          strokeDasharray="2 5"
          opacity={0.7}
        />
        <rect x={mid - 5} y={72} width={10} height={16} fill={ACCENT} />
        <path
          d={`M${mid + 20} 76l6 4l-6 4M${mid - 20} 120l-6 4l6 4`}
          fill="none"
          stroke={INK}
          strokeWidth={1.2}
        />
      </>
    )
  },
}

/** A lattice with voices running through it: Mix brings the voices up. */
const lattice: PlatePicture = {
  params: ['mix', 'scale'],
  draw: (at) => {
    const notes = 4 + Math.round(at('scale') * 4)
    const voices = lerp(0.35, 1, at('mix'))
    const lines: string[] = []
    for (let x = -80; x < 260; x += 18) lines.push(`M${x} 138L${x + 72} 66M${x + 72} 138L${x} 66`)
    return (
      <>
        <path d={lines.join('')} stroke={INK} strokeWidth={1} opacity={0.3} />
        {[
          [84, 1],
          [100, 0.8],
          [124, 0.6],
        ].map(([y, weight]) => (
          <g key={y}>
            <path
              d={`M8 ${y}H232`}
              stroke={ACCENT}
              strokeWidth={1.6}
              opacity={r1(weight * voices)}
            />
            {range(notes).map((k) => (
              <circle key={k} cx={r1(30 + (k * 180) / (notes - 1))} cy={y} r={2.2} fill={INK} />
            ))}
          </g>
        ))}
      </>
    )
  },
}

/** Three voices of one wave: Depth pulls them apart, Rate adds cycles. */
const chorus: PlatePicture = {
  params: ['rate', 'depth'],
  draw: (at) => {
    const cycles = lerp(3, 7, at('rate'))
    const apart = lerp(0.2, 1.1, at('depth'))
    const voices: [number, string, number, number][] = [
      [0, INK, 1.6, 1],
      [apart, ACCENT, 1.6, 1],
      [apart * 2, INK, 1, 0.55],
    ]
    return voices.map(([phase, colour, width, opacity], index) => {
      const points: [number, number][] = []
      for (let x = 0; x <= 240; x += 4)
        points.push([x, 102 + 17 * Math.sin((x / 240) * Math.PI * cycles + phase)])
      return (
        <path
          key={index}
          d={path(points)}
          fill="none"
          stroke={colour}
          strokeWidth={width}
          opacity={opacity}
        />
      )
    })
  },
}

/** A filter curve and where it has been: Cutoff moves it, Resonance raises the peak. */
const autoFilter: PlatePicture = {
  params: ['cutoffHz', 'resonance'],
  draw: (at) => {
    const now = lerp(60, 212, at('cutoffHz'))
    const peak = lerp(6, 30, at('resonance'))
    return range(5).map((k) => {
      const last = k === 4
      const corner = now - (4 - k) * 22
      const points: [number, number][] = []
      for (let x = 0; x <= 240; x += 3) {
        const t = (x - corner) / 14
        points.push([
          x,
          Math.min(134, 104 - peak * Math.exp(-t * t) + (x > corner ? (x - corner) * 1.5 : 0)),
        ])
      }
      return (
        <path
          key={k}
          d={path(points)}
          fill="none"
          stroke={last ? ACCENT : INK}
          strokeWidth={last ? 2 : 1.1}
          opacity={last ? 1 : r1(0.25 + 0.15 * k)}
        />
      )
    })
  },
}

/** Tape running past: Wow bends it slowly, Flutter shakes it, Age wears a gap in it. */
const tape: PlatePicture = {
  params: ['wow', 'flutter', 'age'],
  draw: (at) => {
    const wow = lerp(0.5, 6, at('wow'))
    const flutter = lerp(0, 2.2, at('flutter'))
    const worn = lerp(0, 34, at('age'))
    return range(7).map((line) => {
      const y = (x: number): number =>
        78 +
        line * 8 +
        wow * Math.sin((x / 240) * Math.PI * 2.6 + line * 0.12) +
        flutter * Math.sin((x / 240) * Math.PI * 22)
      const run = (from: number, to: number): string => {
        const points: [number, number][] = []
        for (let x = from; x <= to; x += 3) points.push([x, y(x)])
        return path(points)
      }
      const gap = worn >= 2 && line >= 2 && line <= 4
      const middle = line === 3
      return (
        <path
          key={line}
          d={
            gap
              ? run(0, 158 - worn / 2 - line * 3) + run(158 + worn / 2 + line * 2, 240)
              : run(0, 240)
          }
          fill="none"
          stroke={middle ? ACCENT : INK}
          strokeWidth={middle ? 1.8 : 1.1}
          opacity={middle ? 1 : 0.7}
        />
      )
    })
  },
}

/** Swells that rise and cut off: Feedback adds swells, Time makes them longer. */
const reverseDelay: PlatePicture = {
  params: ['time', 'feedback'],
  draw: (at) => {
    const swells = 2 + Math.round(at('feedback') * 3)
    const length = lerp(26, 44, at('time'))
    return range(swells).map((k) => {
      const end = 232 - k * (length + 6)
      const height = 54 * (1 - k * 0.16)
      return (
        <path
          key={k}
          d={`M${r1(end - length)} 132L${r1(end)} ${r1(132 - height)}V132Z`}
          fill={k === 0 ? ACCENT : INK}
          opacity={k === 0 ? 1 : r1(0.75 - k * 0.15)}
        />
      )
    })
  },
}

/** A spectrum going soft: Blur widens every band, Smear evens them out. */
const spectralBlur: PlatePicture = {
  params: ['blur', 'smear'],
  draw: (at) => {
    const soft = lerp(0.2, 1.6, at('blur'))
    const even = at('smear')
    return range(24).map((k) => {
      const x = 10 + k * 9.4
      const own = 12 + 46 * scatter(k, 21) * (0.5 + 0.5 * Math.sin((k / 24) * Math.PI))
      const height = lerp(own, 34, even * 0.8)
      const colour = k % 6 === 2 ? ACCENT : INK
      const band = (half: number, opacity: number) => (
        <rect
          x={r1(x - half)}
          y={r1(134 - height)}
          width={r1(half * 2)}
          height={r1(height)}
          fill={colour}
          opacity={opacity}
        />
      )
      return (
        <g key={k}>
          {band(1.2 + 3.5 * soft, 0.14)}
          {band(1.2 + 1.8 * soft, 0.28)}
          {band(1.2, 0.9)}
        </g>
      )
    })
  },
}

/** A flower opening: Bloom is how far. */
const bloom: PlatePicture = {
  params: ['bloom'],
  draw: (at) => {
    const open = lerp(0.45, 1.15, at('bloom'))
    return (
      <>
        {range(18).map((k) => {
          const angle = (k / 18) * Math.PI * 2
          const reach = (22 + 18 * scatter(k, 31)) * open
          const x = 176 + reach * Math.cos(angle)
          const y = 104 + reach * Math.sin(angle) * 0.85
          return (
            <g key={k}>
              <path
                d={`M${r1(176 + 8 * Math.cos(angle))} ${r1(104 + 8 * Math.sin(angle) * 0.85)}L${r1(x)} ${r1(y)}`}
                stroke={INK}
                strokeWidth={1.1}
              />
              <circle cx={r1(x)} cy={r1(y)} r={2.4} fill={k % 3 === 0 ? ACCENT : INK} />
            </g>
          )
        })}
        <circle cx={176} cy={104} r={5} fill={ACCENT} />
      </>
    )
  },
}

/** Strings between two bridges: Sympathy sets more of them ringing, and wider. */
const sympathetic: PlatePicture = {
  params: ['sympathy'],
  draw: (at) => {
    const order = [5, 2, 7, 0, 4, 8]
    const ringing = new Set(order.slice(0, Math.round(at('sympathy') * 5)))
    const swing = lerp(4, 10, at('sympathy'))
    return (
      <>
        {range(9).map((string) => {
          const y = 72 + string * 7.5
          return ringing.has(string) ? (
            <g key={string}>
              <path
                d={`M22 ${y}Q120 ${r1(y - swing)} 218 ${y}Q120 ${r1(y + swing)} 22 ${y}Z`}
                fill={ACCENT}
                opacity={0.35}
              />
              <path
                d={`M22 ${y}Q120 ${r1(y - swing)} 218 ${y}M22 ${y}Q120 ${r1(y + swing)} 218 ${y}`}
                fill="none"
                stroke={INK}
                strokeWidth={1}
              />
            </g>
          ) : (
            <path key={string} d={`M22 ${y}H218`} stroke={INK} strokeWidth={1} opacity={0.6} />
          )
        })}
        <path d="M22 68V136M218 68V136" stroke={INK} strokeWidth={2.4} />
      </>
    )
  },
}

/** A sine pushed into the rails: Drive flattens it, Bias leans it. */
const saturator: PlatePicture = {
  params: ['driveDb', 'bias'],
  draw: (at) => {
    const drive = lerp(0.7, 5, at('driveDb'))
    const lean = (at('bias') - 0.5) * 1.2
    const curve = (v: number): number => Math.tanh(drive * (v + lean)) - Math.tanh(drive * lean)
    const scale = 19 / Math.max(Math.abs(curve(1)), Math.abs(curve(-1)), 0.001)
    const points: [number, number][] = []
    for (let x = 0; x <= 240; x += 3)
      points.push([x, 102 - scale * curve(Math.sin((x / 240) * Math.PI * 5))])
    const line = path(points)
    return (
      <>
        <path d={`${line}L240 140L0 140Z`} fill={ACCENT} opacity={0.4} />
        <path d={line} fill="none" stroke={INK} strokeWidth={2.4} />
        <path
          d="M0 82.5H240M0 121.5H240"
          stroke={INK}
          strokeWidth={0.8}
          strokeDasharray="2 4"
          opacity={0.7}
        />
      </>
    )
  },
}

/** A spring between two blocks: Tension winds it tighter, Drip lets drops fall. */
const spring: PlatePicture = {
  params: ['tension', 'drip'],
  draw: (at) => {
    const wind = lerp(0.36, 0.9, at('tension'))
    const drops = Math.round(at('drip') * 4)
    const points: [number, number][] = []
    for (let t = 22; t <= 212; t += 0.6)
      points.push([t + 6 * Math.cos(t * wind), 100 + 15 * Math.sin(t * wind)])
    return (
      <>
        <path d={path(points)} fill="none" stroke={INK} strokeWidth={1.3} />
        <rect x={10} y={82} width={8} height={36} fill={ACCENT} />
        <rect x={222} y={82} width={8} height={36} fill={ACCENT} />
        {[
          [160, 124, 2.8, 1],
          [176, 127, 2.4, 0.9],
          [192, 130, 1.8, 0.6],
          [204, 133, 1.2, 0.4],
        ]
          .slice(4 - drops)
          .map(([x, y, r, opacity]) => (
            <circle key={x} cx={x} cy={y} r={r} fill={INK} opacity={opacity} />
          ))}
      </>
    )
  },
}

/** A horn turning over a drum: Speed draws its wake, Horn Depth opens the horn. */
const rotary: PlatePicture = {
  params: ['speed', 'hornDepth'],
  draw: (at) => {
    const wake = Math.round(at('speed') * 2)
    const mouth = lerp(0.2, 0.75, at('hornDepth'))
    const on = (r: number, angle: number): string =>
      `${r1(180 + r * Math.cos(angle))} ${r1(102 + r * Math.sin(angle))}`
    return (
      <>
        <circle cx={180} cy={102} r={30} fill="none" stroke={INK} strokeWidth={1.4} />
        <path d={`M180 102L${on(30, -mouth)}A30 30 0 0 1 ${on(30, mouth)}Z`} fill={ACCENT} />
        <circle cx={180} cy={102} r={4} fill={INK} />
        {range(wake).map((k) => (
          <path
            key={k}
            d={`M${on(38 + k * 7, 0.7 + k * 0.2)}A${38 + k * 7} ${38 + k * 7} 0 0 1 ${on(38 + k * 7, 1.9 - k * 0.2)}`}
            fill="none"
            stroke={INK}
            strokeWidth={1}
            opacity={r1(0.6 - k * 0.25)}
          />
        ))}
        <circle cx={112} cy={112} r={17} fill="none" stroke={INK} strokeWidth={1.2} opacity={0.8} />
        <path d="M100 112H124" stroke={INK} strokeWidth={3} opacity={0.8} />
      </>
    )
  },
}

/** Which of `count` choices a position names. */
const choice = (position: number, count: number): number =>
  Math.min(count - 1, Math.max(0, Math.round(position * (count - 1))))

/** A wave along the picture: `y` for each `x` from `from` to `to`. */
function wave(from: number, to: number, y: (x: number) => number, step = 2): string {
  const points: [number, number][] = []
  for (let x = from; x <= to; x += step) points.push([x, y(x)])
  return path(points)
}

/**
 * A picture drawn ten up, so that the line it stands on is clear of the name
 * tag along the plate's foot.
 */
const lifted = (picture: PlatePicture): PlatePicture => ({
  params: picture.params,
  draw: (at) => <g transform="translate(0 -10)">{picture.draw(at)}</g>,
})

/** A row of buckets handing the sound on: Feedback fills more of them, Time sets them apart. */
const analogDelay: PlatePicture = lifted({
  params: ['time', 'feedback'],
  draw: (at) => {
    const buckets = 3 + Math.round(at('feedback') * 5)
    const gap = lerp(21, 27, at('time'))
    return (
      <>
        {range(buckets).map((k) => {
          const x = r1(14 + k * gap)
          const level = r1(26 * 0.8 ** k)
          return (
            <g key={k}>
              <rect
                x={x}
                y={r1(116 - level)}
                width={13}
                height={level}
                fill={k === 0 ? ACCENT : INK}
                opacity={k === 0 ? 1 : r1(0.75 - k * 0.07)}
              />
              <path
                d={`M${x} 84V116H${r1(x + 13)}V84`}
                fill="none"
                stroke={INK}
                strokeWidth={1.2}
              />
            </g>
          )
        })}
        <path d="M10 78H230" stroke={INK} strokeWidth={0.8} strokeDasharray="2 4" opacity={0.6} />
      </>
    )
  },
})

/** What goes in against what comes out: Drive bends the line, Circuit leans it. */
const analogDrive: PlatePicture = lifted({
  params: ['drive', 'circuit'],
  draw: (at) => {
    const gain = lerp(1, 7, at('drive'))
    const lean = [0, 0.08, 0.2, 0.34, -0.3][choice(at('circuit'), 5)]
    const curve = (v: number): number => Math.tanh(gain * (v + lean)) - Math.tanh(gain * lean)
    const scale = 22 / Math.max(Math.abs(curve(1)), Math.abs(curve(-1)), 0.001)
    return (
      <>
        <path d="M126 98H226M176 74V122" stroke={INK} strokeWidth={0.8} opacity={0.5} />
        <path
          d="M128 122L224 74"
          stroke={INK}
          strokeWidth={1}
          strokeDasharray="2 4"
          opacity={0.7}
        />
        <path
          d={wave(128, 224, (x) => 98 - scale * curve((x - 176) / 48), 3)}
          fill="none"
          stroke={ACCENT}
          strokeWidth={2.4}
        />
        <rect x={126} y={72} width={100} height={52} fill="none" stroke={INK} strokeWidth={1.2} />
      </>
    )
  },
})

/** Loops stacked at octave speeds: Repeats adds to each row, High adds the rows above. */
const cascade: PlatePicture = lifted({
  params: ['repeats', 'high', 'time'],
  draw: (at) => {
    const repeats = 2 + Math.round(at('repeats') * 5)
    const rows = 1 + Math.round(at('high') * 2)
    const gap = lerp(24, 31, at('time'))
    return range(rows).map((row) => {
      const step = gap / 2 ** row
      return range(repeats * 2 ** row).map((k) => (
        <rect
          key={`${row} ${k}`}
          x={r1(12 + k * step)}
          y={110 - row * 16}
          width={r1(step - 2)}
          height={10}
          fill={row === 0 && k === 0 ? ACCENT : INK}
          opacity={r1(Math.max(0.12, (row === 0 ? 1 : 0.8) - (k / (repeats * 2 ** row)) * 0.75))}
        />
      ))
    })
  },
})

/** Repeats that die away, and pieces of earlier playing drifting back over them. */
const echoMemory: PlatePicture = lifted({
  params: ['time', 'feedback', 'memory'],
  draw: (at) => {
    const repeats = 2 + Math.round(at('feedback') * 6)
    const gap = lerp(16, 27, at('time'))
    const memories = Math.round(at('memory') * 7)
    return (
      <>
        {range(memories).map((k) => {
          const x = 44 + scatter(k, 51) * 150
          const y = 76 + scatter(k, 52) * 16
          const turned = scatter(k, 53) < 0.4 ? -1 : 1
          return (
            <path
              key={k}
              d={wave(
                x,
                x + 22,
                (px) => y + 4 * turned * Math.sin((px - x) / 2.4) * (1 - (px - x) / 26),
              )}
              fill="none"
              stroke={ACCENT}
              strokeWidth={1.2}
              opacity={r1(0.35 + 0.5 * scatter(k, 54))}
            />
          )
        })}
        {range(repeats).map((k) => (
          <rect
            key={k}
            x={r1(16 + k * gap)}
            y={r1(120 - 40 * 0.76 ** k)}
            width={5}
            height={r1(40 * 0.76 ** k)}
            fill={INK}
            opacity={r1(1 - k * 0.09)}
          />
        ))}
        <path d="M10 120H230" stroke={INK} strokeWidth={0.8} opacity={0.5} />
      </>
    )
  },
})

/** A wave cut in slices, some of them out of place: Chance is how many. */
const glitch: PlatePicture = lifted({
  params: ['time', 'chance', 'repeat'],
  draw: (at) => {
    const slices = Math.round(lerp(20, 9, at('time')))
    const width = 224 / slices
    const chance = 0.08 + at('chance') * 0.8
    const again = at('repeat')
    return range(slices).map((k) => {
      const off = k > 0 && scatter(k, 61) < chance
      // A slice that sticks plays the one before it again.
      const from = off && scatter(k, 62) < again ? k - 1 : k
      const shift = off ? (scatter(k, 63) < 0.5 ? -9 : 9) : 0
      const left = 8 + k * width
      return (
        <g key={k}>
          <path
            d={wave(
              left,
              left + width - 1.5,
              (x) => 98 + shift + 11 * Math.sin((x - (k - from) * width) / 11),
              1.5,
            )}
            fill="none"
            stroke={off ? ACCENT : INK}
            strokeWidth={off ? 2 : 1.3}
          />
          {off ? (
            <path
              d={`M${r1(left)} 76V120`}
              stroke={INK}
              strokeWidth={0.8}
              strokeDasharray="1 3"
              opacity={0.7}
            />
          ) : null}
        </g>
      )
    })
  },
})

/** The same wave under itself, slower and deeper: Speed stretches it, Length sets the cycles. */
const halfSpeed: PlatePicture = lifted({
  params: ['speed', 'length'],
  draw: (at) => {
    const ratio = [0.75, 2 / 3, 0.5, 0.25][choice(at('speed'), 4)]
    const cycles = Math.round(lerp(6, 2, at('length')))
    return (
      <>
        {range(cycles + 1).map((k) => (
          <path
            key={k}
            d={`M${r1(12 + (k * 216) / cycles)} 72V122`}
            stroke={INK}
            strokeWidth={0.8}
            strokeDasharray="2 4"
            opacity={0.55}
          />
        ))}
        <path
          d={wave(12, 228, (x) => 82 + 6 * Math.sin((x / 216) * Math.PI * 2 * 12))}
          fill="none"
          stroke={INK}
          strokeWidth={1.2}
          opacity={0.75}
        />
        <path
          d={wave(12, 228, (x) => 106 + 10 * Math.sin((x / 216) * Math.PI * 2 * 12 * ratio))}
          fill="none"
          stroke={ACCENT}
          strokeWidth={2}
        />
      </>
    )
  },
})

/** A stream in blocks: Loss throws the quiet ones away, top first; Dropouts lose whole packets. */
const lowBitrate: PlatePicture = lifted({
  params: ['loss', 'dropouts'],
  draw: (at) => {
    const loss = at('loss')
    const dropped = at('dropouts') * 0.5
    return range(24).map((column) => {
      const x = r1(10 + column * 9.2)
      if (scatter(column, 71) < dropped)
        return <rect key={column} x={x} y={117} width={7.2} height={2} fill={ACCENT} />
      return (
        <g key={column}>
          {range(6).map((row) =>
            scatter(column, 80 + row) < 0.04 + loss * (0.25 + 0.14 * row) ? null : (
              <rect
                key={row}
                x={x}
                y={112 - row * 8}
                width={7.2}
                height={6}
                fill={(column + row * 3) % 11 === 0 ? ACCENT : INK}
                opacity={r1(0.95 - row * 0.11)}
              />
            ),
          )}
        </g>
      )
    })
  },
})

/** A loop going round: Length is how much of what was played it holds, Fade how long older loops stay. */
const microLooper: PlatePicture = lifted({
  params: ['length', 'fade', 'speed'],
  draw: (at) => {
    const held = lerp(22, 86, at('length'))
    const sweep = lerp(0.9, 5.6, at('length'))
    const older = Math.round(at('fade') * 3)
    const backwards = choice(at('speed'), 6) < 3
    const on = (r: number, angle: number): string =>
      `${r1(184 + r * Math.cos(angle))} ${r1(98 + r * Math.sin(angle))}`
    const start = -Math.PI / 2
    return (
      <>
        <path
          d={wave(12, 126, (x) => 98 + 9 * Math.sin(x / 7) * Math.sin(x / 23))}
          fill="none"
          stroke={INK}
          strokeWidth={1.2}
          opacity={0.75}
        />
        <path
          d={`M${r1(126 - held)} 82V114H126V82`}
          fill="none"
          stroke={ACCENT}
          strokeWidth={1.6}
        />
        {range(older).map((k) => (
          <circle
            key={k}
            cx={184}
            cy={98}
            r={15 - k * 5}
            fill="none"
            stroke={INK}
            strokeWidth={1}
            opacity={r1(0.6 - k * 0.17)}
          />
        ))}
        <circle cx={184} cy={98} r={22} fill="none" stroke={INK} strokeWidth={1} opacity={0.4} />
        <path
          d={`M${on(22, start)}A22 22 0 ${sweep > Math.PI ? 1 : 0} 1 ${on(22, start + sweep)}`}
          fill="none"
          stroke={INK}
          strokeWidth={4}
        />
        <circle
          cx={r1(184 + 22 * Math.cos(backwards ? start : start + sweep))}
          cy={r1(98 + 22 * Math.sin(backwards ? start : start + sweep))}
          r={4}
          fill={ACCENT}
        />
      </>
    )
  },
})

/** What lies under the sound: Level raises the bed, Movement makes it swell. */
const noiseFloor: PlatePicture = lifted({
  params: ['level', 'movement'],
  draw: (at) => {
    const specks = 50 + Math.round(at('level') * 170)
    const depth = lerp(7, 40, at('level'))
    const swell = at('movement')
    return (
      <>
        {range(specks).map((k) => {
          const x = 8 + scatter(k, 91) * 224
          const lift = 1 - swell * 0.6 * (0.5 + 0.5 * Math.sin((x / 240) * Math.PI * 5))
          return (
            <circle
              key={k}
              cx={r1(x)}
              cy={r1(118 - scatter(k, 92) ** 1.6 * depth * lift)}
              r={r1(0.6 + 0.9 * scatter(k, 93))}
              fill={k % 8 === 0 ? ACCENT : INK}
              opacity={r1(0.45 + 0.5 * scatter(k, 94))}
            />
          )
        })}
        <path d="M8 120H232" stroke={INK} strokeWidth={1.4} />
      </>
    )
  },
})

/** The note and its octaves, two below to two above: each line swings as far as its level. */
const octaves: PlatePicture = lifted({
  params: ['sub2', 'sub1', 'dry', 'up1', 'up2'],
  draw: (at) =>
    (['sub2', 'sub1', 'dry', 'up1', 'up2'] as const).map((name, row) => {
      const level = at(name)
      const dry = name === 'dry'
      return (
        <path
          key={name}
          d={wave(
            10,
            230,
            (x) =>
              120 -
              row * 11.5 -
              4.6 * level * Math.sin(((x - 10) / 220) * Math.PI * 2 * 1.5 * 2 ** row),
            1.5,
          )}
          fill="none"
          stroke={dry ? ACCENT : INK}
          strokeWidth={dry ? 2 : 1.3}
          opacity={r1(dry ? 1 : 0.3 + 0.7 * level)}
        />
      )
    }),
})

/** Notes played, and the pad that swells in behind them: Rise is how fast, Fall how long it stays. */
const padFollower: PlatePicture = lifted({
  params: ['rise', 'fall'],
  draw: (at) => {
    const top = 26 + lerp(10, 70, at('rise'))
    const end = 136 + lerp(16, 92, at('fall'))
    const points: [number, number][] = []
    for (let x = 26; x <= end; x += 3) {
      const t = x < top ? (x - 26) / (top - 26) : x < 136 ? 1 : 1 - (x - 136) / (end - 136)
      points.push([x, 120 - 34 * t * t * (3 - 2 * t)])
    }
    const line = path(points)
    return (
      <>
        <path d={`${line}L${r1(end)} 120L26 120Z`} fill={ACCENT} opacity={0.4} />
        <path d={line} fill="none" stroke={ACCENT} strokeWidth={1.6} />
        {[
          [26, 40],
          [62, 30],
          [98, 36],
          [136, 26],
        ].map(([x, height]) => (
          <path key={x} d={`M${x} 120V${120 - height}`} stroke={INK} strokeWidth={2} />
        ))}
        <path d="M10 120H230" stroke={INK} strokeWidth={0.8} opacity={0.6} />
      </>
    )
  },
})

/** The medium and what it does to a steady line: Wobble bends it, Wear narrows the band, Noise specks it. */
const patina: PlatePicture = lifted({
  params: ['medium', 'wobble', 'wear', 'noise'],
  draw: (at) => {
    const swing = lerp(0.6, 9, at('wobble'))
    const band = lerp(24, 11, at('wear'))
    const specks = Math.round(at('noise') * 44)
    const medium = [
      // Reel, cassette, record, radio, sampler, valve.
      'M18 98a12 12 0 1 0 24 0a12 12 0 1 0 -24 0M27 98a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
      'M16 88H44V108H16ZM22 98a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M32 98a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
      'M18 98a12 12 0 1 0 24 0a12 12 0 1 0 -24 0M23 98a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M29 98h2',
      'M30 110V88M24 92a8 8 0 0 1 0 -10M36 92a8 8 0 0 0 0 -10M20 96a14 14 0 0 1 0 -18M40 96a14 14 0 0 0 0 -18',
      'M22 90H38V106H22ZM18 94h4M18 102h4M38 94h4M38 102h4M26 86v4M34 86v4M26 106v4M34 106v4',
      'M24 110V96a6 10 0 0 1 12 0V110ZM27 110v4M33 110v4M27 99h6',
    ][choice(at('medium'), 6)]
    return (
      <>
        <path d={medium} fill="none" stroke={ACCENT} strokeWidth={1.6} />
        <path
          d={`M56 ${r1(98 - band)}H232M56 ${r1(98 + band)}H232`}
          stroke={INK}
          strokeWidth={0.8}
          strokeDasharray="2 4"
          opacity={0.7}
        />
        {range(specks).map((k) => (
          <circle
            key={k}
            cx={r1(58 + scatter(k, 101) * 172)}
            cy={r1(98 + (scatter(k, 102) * 2 - 1) * (band - 2))}
            r={0.9}
            fill={INK}
            opacity={0.6}
          />
        ))}
        <path
          d={wave(56, 232, (x) => 98 + swing * Math.sin((x / 240) * Math.PI * 5))}
          fill="none"
          stroke={INK}
          strokeWidth={1.8}
        />
      </>
    )
  },
})

/** Two voices stepping away from the note: Pitch sets how far, Feedback makes each repeat climb again. */
const pitchShifter: PlatePicture = lifted({
  params: ['pitchA', 'pitchB', 'feedback'],
  draw: (at) => {
    const steps = 1 + Math.round(at('feedback') * 4)
    const stairs = (pitch: number): string => {
      const rise = ((pitch - 0.5) * 2 * 26) / steps
      const run = 196 / steps
      let d = 'M10 98H24'
      for (let k = 1; k <= steps; k += 1) d += `V${r1(98 - rise * k)}H${r1(24 + run * k)}`
      return d
    }
    return (
      <>
        <path d="M10 98H230" stroke={INK} strokeWidth={0.8} strokeDasharray="2 4" opacity={0.7} />
        <path d={stairs(at('pitchB'))} fill="none" stroke={INK} strokeWidth={1.4} />
        <path d={stairs(at('pitchA'))} fill="none" stroke={ACCENT} strokeWidth={2} />
        <circle cx={10} cy={98} r={3} fill={INK} />
      </>
    )
  },
})

/** A dial and the station on it: Tuning moves the needle, Fading sinks the signal, Static specks it. */
const radio: PlatePicture = lifted({
  params: ['tuning', 'fading', 'static'],
  draw: (at) => {
    const needle = r1(lerp(22, 218, at('tuning')))
    const fade = at('fading') * 0.85
    const specks = Math.round(at('static') * 60)
    const ticks = range(21)
      .map((k) => `M${20 + k * 10} 118V${k % 5 === 0 ? 110 : 114}`)
      .join('')
    return (
      <>
        <path
          d={wave(
            12,
            228,
            (x) =>
              90 +
              11 *
                (1 - fade * (0.5 + 0.5 * Math.sin((x / 240) * Math.PI * 3 + 1))) *
                Math.sin(x / 2.6),
            1.5,
          )}
          fill="none"
          stroke={INK}
          strokeWidth={1.1}
        />
        {range(specks).map((k) => (
          <circle
            key={k}
            cx={r1(12 + scatter(k, 111) * 216)}
            cy={r1(74 + scatter(k, 112) * 32)}
            r={0.9}
            fill={INK}
            opacity={0.7}
          />
        ))}
        <path d={`M20 118H220${ticks}`} fill="none" stroke={INK} strokeWidth={1} />
        <path d={`M${needle} 72V120`} stroke={ACCENT} strokeWidth={2} />
      </>
    )
  },
})

/** A speaker and the microphone in front of it: Distance pulls it back, Angle turns it away, Room answers. */
const reAmp: PlatePicture = lifted({
  params: ['distance', 'angle', 'room'],
  draw: (at) => {
    const mic = lerp(84, 196, at('distance'))
    const turn = at('angle') * 1.1
    const walls = Math.round(at('room') * 3)
    const waves = Math.max(1, Math.floor((mic - 70) / 16))
    return (
      <>
        <path
          d="M18 86H30V110H18ZM30 86L50 72V124L30 110"
          fill="none"
          stroke={INK}
          strokeWidth={1.4}
        />

        {range(waves).map((k) => {
          const r = 14 + k * 16
          // An arc of the wave front, never taller than the speaker.
          const half = Math.min(r * 0.6, 24)
          const x = r1(52 + Math.sqrt(r * r - half * half))
          return (
            <path
              key={k}
              d={`M${x} ${r1(98 - half)}A${r} ${r} 0 0 1 ${x} ${r1(98 + half)}`}
              fill="none"
              stroke={INK}
              strokeWidth={1.1}
              opacity={r1(0.85 - k * 0.1)}
            />
          )
        })}
        {range(walls).map((k) => (
          <path
            key={k}
            d={`M${224 - k * 7} ${78 + k * 4}A30 30 0 0 0 ${224 - k * 7} ${118 - k * 4}`}
            fill="none"
            stroke={INK}
            strokeWidth={1}
            strokeDasharray="2 3"
            opacity={r1(0.7 - k * 0.18)}
          />
        ))}
        <path d="M232 70V126" stroke={INK} strokeWidth={1.6} opacity={0.7} />
        <path
          d={`M${r1(mic)} 98L${r1(mic + 16 * Math.cos(turn))} ${r1(98 + 16 * Math.sin(turn))}`}
          stroke={INK}
          strokeWidth={2}
        />
        <circle cx={r1(mic)} cy={98} r={5.5} fill={ACCENT} />
      </>
    )
  },
})

/** The shape the reverb is held to: a gate, a rise into a cut, a bloom, a fall, or waves. */
const shapedReverb: PlatePicture = lifted({
  params: ['shape', 'time', 'tail'],
  draw: (at) => {
    const shape = choice(at('shape'), 5)
    const length = lerp(86, 170, at('time'))
    const tail = at('tail')
    const level = (t: number): number =>
      [
        1,
        t * t,
        Math.sin(t * Math.PI) ** 1.4,
        1 - t,
        (0.55 + 0.45 * Math.sin(t * Math.PI * 7 - Math.PI / 2)) * (1 - t * 0.6),
      ][shape]
    const points: [number, number][] = [[28, 120]]
    for (let x = 0; x <= length; x += 2) points.push([28 + x, 120 - 44 * level(x / length)])
    const end = 28 + length
    const last = 44 * level(1)
    // What rings on after the shape ends.
    for (let x = 2; x <= 30; x += 2)
      points.push([end + x, 120 - Math.max(last, 12) * tail * Math.exp(-x / 9)])
    points.push([end + 30, 120])
    const line = path(points)
    return (
      <>
        <path d={`${line}Z`} fill={ACCENT} opacity={0.45} />
        <path d={line} fill="none" stroke={ACCENT} strokeWidth={1.8} />
        <path d="M22 70V120" stroke={INK} strokeWidth={2.4} />
        <path d="M10 120H230" stroke={INK} strokeWidth={0.8} opacity={0.6} />
      </>
    )
  },
})

/** One wave and its two copies, one sharp and one flat: Detune pulls their pitch apart, Width their place. */
const stereoDetune: PlatePicture = lifted({
  params: ['detune', 'delay', 'width'],
  draw: (at) => {
    const apart = lerp(4, 15, at('width'))
    const cents = at('detune') * 0.22
    const late = lerp(2, 12, at('delay'))
    const copy = (shift: number, pitch: number) =>
      wave(
        10 + late,
        230,
        (x) => 95 + shift + 6 * Math.sin(((x - late) / 220) * Math.PI * 2 * 7 * pitch),
      )
    return (
      <>
        <path
          d={wave(10, 230, (x) => 95 + 6 * Math.sin((x / 220) * Math.PI * 2 * 7))}
          fill="none"
          stroke={INK}
          strokeWidth={1}
          opacity={0.45}
        />
        <path d={copy(-apart, 1 + cents)} fill="none" stroke={ACCENT} strokeWidth={1.8} />
        <path d={copy(apart, 1 - cents)} fill="none" stroke={INK} strokeWidth={1.8} />
      </>
    )
  },
})

/** A note that would have died, held: Attack is how it comes in, Decay how long it hangs, Motion stirs it. */
const sustainer: PlatePicture = lifted({
  params: ['attack', 'decay', 'motion'],
  draw: (at) => {
    const full = 30 + lerp(6, 56, at('attack'))
    const hangs = lerp(120, 300, at('decay'))
    const stir = at('motion') * 3.2
    const top: [number, number][] = []
    for (let x = 30; x <= 232; x += 2) {
      const rise = Math.min(1, (x - 30) / (full - 30))
      const hold = x < hangs - 60 ? 1 : Math.max(0, (hangs - x) / 60)
      top.push([x, 108 - (20 * rise * hold + stir * Math.sin(x / 9) * rise * hold)])
    }
    const line = path(top)
    return (
      <>
        <path d={`${line}L232 120L30 120Z`} fill={ACCENT} opacity={0.42} />
        <path d={line} fill="none" stroke={ACCENT} strokeWidth={1.8} />
        <path
          d={wave(30, 110, (x) => 120 - 46 * Math.exp(-(x - 30) / 16))}
          fill="none"
          stroke={INK}
          strokeWidth={1.4}
        />
        <path d="M30 120V74" stroke={INK} strokeWidth={1.4} />
        <path d="M10 120H232" stroke={INK} strokeWidth={0.8} opacity={0.6} />
      </>
    )
  },
})

/** A cave of short echoes: Length is how deep, Blur how they smear, Stretch leans the lot. */
const swarmReverb: PlatePicture = lifted({
  params: ['length', 'blur', 'stretch'],
  draw: (at) => {
    const deep = lerp(80, 212, at('length'))
    const smear = lerp(1, 3.4, at('blur'))
    const lean = (at('stretch') - 0.5) * 16
    return range(64).map((k) => {
      const far = scatter(k, 121) ** 1.3
      const x = 14 + far * deep
      const height = (8 + 36 * scatter(k, 122)) * (1 - far * 0.8)
      return (
        <path
          key={k}
          d={`M${r1(x)} 120L${r1(x + (lean * height) / 44)} ${r1(120 - height)}`}
          stroke={k % 7 === 0 ? ACCENT : INK}
          strokeWidth={r1(smear)}
          opacity={r1((0.9 - far * 0.55) / Math.sqrt(smear))}
        />
      )
    })
  },
})

/** A wave as an early converter holds it: Rate is how often it looks, Bits how many heights it knows. */
const vintageDigital: PlatePicture = lifted({
  params: ['rate', 'bits'],
  draw: (at) => {
    const samples = Math.round(lerp(9, 54, at('rate')))
    const heights = Math.round(lerp(3, 17, at('bits')))
    const smooth = (x: number): number => Math.sin((x / 220) * Math.PI * 2 * 1.5)
    const step = 220 / samples
    let held = ''
    for (let k = 0; k < samples; k += 1) {
      const x = 10 + k * step
      const y = r1(
        97 - 22 * (Math.round(smooth(k * step) * ((heights - 1) / 2)) / ((heights - 1) / 2)),
      )
      held += `${k ? 'V' + y : `M${r1(x)} ${y}`}H${r1(x + step)}`
    }
    return (
      <>
        <path
          d={wave(10, 230, (x) => 97 - 22 * smooth(x - 10))}
          fill="none"
          stroke={ACCENT}
          strokeWidth={1.2}
          opacity={0.8}
        />
        <path d={held} fill="none" stroke={INK} strokeWidth={1.7} />
      </>
    )
  },
})

/** A record and what its groove gives back: Warp bends the disc, Crackle specks the groove. */
const vinyl: PlatePicture = lifted({
  params: ['warp', 'crackle'],
  draw: (at) => {
    const bend = at('warp') * 3.4
    const ticks = Math.round(at('crackle') * 26)
    const groove = (r: number): string => {
      const points: [number, number][] = []
      for (let a = 0; a <= 64; a += 1) {
        const angle = (a / 64) * Math.PI * 2
        const out = r + bend * Math.sin(angle * 2 + r / 5)
        points.push([180 + out * Math.cos(angle), 98 + out * Math.sin(angle) * 0.72])
      }
      return `${path(points)}Z`
    }
    return (
      <>
        <path
          d={wave(10, 132, (x) => 98 + bend * 1.6 * Math.sin(x / 18))}
          fill="none"
          stroke={INK}
          strokeWidth={1.2}
        />
        {range(ticks).map((k) => {
          const x = 12 + scatter(k, 131) * 118
          const y = 98 + bend * 1.6 * Math.sin(x / 18)
          const height = 3 + 11 * scatter(k, 132) ** 2
          return (
            <path
              key={k}
              d={`M${r1(x)} ${r1(y - height)}V${r1(y + height * 0.4)}`}
              stroke={k % 5 === 0 ? ACCENT : INK}
              strokeWidth={1}
            />
          )
        })}
        {[34, 28, 22, 16].map((r) => (
          <path key={r} d={groove(r)} fill="none" stroke={INK} strokeWidth={1} opacity={0.8} />
        ))}
        <ellipse cx={180} cy={98} rx={10} ry={7.2} fill={ACCENT} />
        <circle cx={180} cy={98} r={1.6} fill={PLATE} />
      </>
    )
  },
})

/** The mouth the hall sings with: Vowel moves its peaks, Resonance sharpens them, Decay lets them ring on. */
const vowelReverb: PlatePicture = lifted({
  params: ['vowel', 'resonance', 'decay'],
  draw: (at) => {
    // Where the three peaks of A, E, I, O and U sit along the picture.
    const mouths = [
      [78, 122, 190],
      [56, 160, 196],
      [36, 184, 210],
      [56, 96, 186],
      [38, 80, 180],
    ]
    const place = at('vowel') * 4
    const from = mouths[Math.min(3, Math.floor(place))]
    const to = mouths[Math.min(3, Math.floor(place)) + 1]
    const mix = place - Math.min(3, Math.floor(place))
    const peaks = from.map((x, k) => lerp(x, to[k], mix))
    const sharp = lerp(26, 11, at('resonance'))
    const rings = Math.round(at('decay') * 3)
    const curve = (lift: number): string =>
      wave(
        8,
        232,
        (x) =>
          120 -
          lift -
          peaks.reduce(
            (sum, peak, k) => sum + [36, 28, 16][k] * Math.exp(-(((x - peak) / sharp) ** 2)),
            0,
          ),
        3,
      )
    return (
      <>
        {range(rings).map((k) => (
          <path
            key={k}
            d={curve((rings - k) * 5)}
            fill="none"
            stroke={INK}
            strokeWidth={1}
            opacity={r1(0.2 + (0.45 * (k + 1)) / (rings + 1))}
          />
        ))}
        <path d={`${curve(0)}L232 120L8 120Z`} fill={ACCENT} opacity={0.4} />
        <path d={curve(0)} fill="none" stroke={INK} strokeWidth={1.8} />
      </>
    )
  },
})

/**
 * Lattice's twelve custom degrees have two knobs each, and their names
 * ("Custom Degree 1 On", "Custom Degree 1 Cents") take three lines where a
 * knob's word has two: both were cut to "Custom Degree 1". On the plate they
 * go by the words that tell them apart, which stand whole in two lines of a
 * knob's column. The parameter keeps its name everywhere else.
 */
const LATTICE_LABELS: Record<string, string> = {}
for (let degree = 1; degree <= 12; degree++) {
  LATTICE_LABELS[`customOn${degree}`] = `Degree ${degree} on`
  LATTICE_LABELS[`customCents${degree}`] = `Degree ${degree} cents`
}

/** The skins the kit ships, by device id. */
const SKINS: Readonly<Record<string, DeviceSkin>> = {
  'fdn-reverb': {
    name: 'Tides',
    ...PLATE_PALETTES['fdn-reverb'],
    finish: 'grain',
    cap: 'disc',
    face: ['decay', 'size', 'damping', 'mix'],
    picture: tides,
  },
  expanse: {
    ...PLATE_PALETTES.expanse,
    finish: 'fade',
    cap: 'dot',
    face: ['size', 'decay', 'gravity', 'mix'],
    picture: expanse,
  },
  'ether-reverb': {
    name: 'Ether',
    ...PLATE_PALETTES['ether-reverb'],
    finish: 'speckle',
    cap: 'skirt',
    face: ['decay', 'size', 'freeze', 'mix'],
    picture: ether,
  },
  'grain-cloud': {
    ...PLATE_PALETTES['grain-cloud'],
    finish: 'grain',
    cap: 'dot',
    face: ['position', 'size', 'density', 'spray'],
    picture: cloud,
  },
  'tape-echo': {
    ...PLATE_PALETTES['tape-echo'],
    finish: 'brushed',
    cap: 'pointer',
    face: ['time', 'feedback', 'wow', 'drive'],
    picture: tapeEcho,
  },
  shimmer: {
    ...PLATE_PALETTES.shimmer,
    finish: 'gloss',
    cap: 'disc',
    face: ['decay', 'shimmer', 'tone', 'mix'],
    picture: shimmer,
  },
  'tape-loop': {
    ...PLATE_PALETTES['tape-loop'],
    finish: 'linen',
    cap: 'pointer',
    face: ['length', 'feedback', 'speed', 'wear'],
    picture: tapeLoop,
  },
  lattice: {
    ...PLATE_PALETTES.lattice,
    finish: 'matte',
    cap: 'skirt',
    face: ['root', 'scale', 'glide', 'mix'],
    labels: LATTICE_LABELS,
    picture: lattice,
  },
  chorus: {
    ...PLATE_PALETTES.chorus,
    finish: 'gloss',
    cap: 'disc',
    face: ['voices', 'rate', 'depth', 'spread'],
    picture: chorus,
  },
  'auto-filter': {
    ...PLATE_PALETTES['auto-filter'],
    finish: 'hammered',
    cap: 'pointer',
    face: ['cutoffHz', 'resonance', 'driveDb', 'envAmount'],
    labels: { resonance: 'Reso', envAmount: 'Env' },
    picture: autoFilter,
  },
  tape: {
    ...PLATE_PALETTES.tape,
    finish: 'brushed',
    cap: 'skirt',
    face: ['drive', 'wow', 'flutter', 'age'],
    picture: tape,
  },
  'reverse-delay': {
    name: 'Reverse',
    ...PLATE_PALETTES['reverse-delay'],
    finish: 'grain',
    cap: 'dot',
    face: ['time', 'feedback', 'smooth', 'mix'],
    picture: reverseDelay,
  },
  'spectral-blur': {
    name: 'Blur',
    ...PLATE_PALETTES['spectral-blur'],
    finish: 'fade',
    cap: 'disc',
    face: ['blur', 'smear', 'tilt', 'freeze'],
    picture: spectralBlur,
  },
  'bloom-reverb': {
    ...PLATE_PALETTES['bloom-reverb'],
    finish: 'speckle',
    cap: 'dot',
    face: ['bloom', 'season', 'decay', 'mix'],
    picture: bloom,
  },
  sympathetic: {
    ...PLATE_PALETTES.sympathetic,
    finish: 'linen',
    cap: 'pointer',
    face: ['root', 'sympathy', 'decay', 'mix'],
    picture: sympathetic,
  },
  saturator: {
    ...PLATE_PALETTES.saturator,
    finish: 'hammered',
    cap: 'skirt',
    face: ['driveDb', 'bias', 'toneDb', 'mix'],
    picture: saturator,
  },
  'spring-reverb': {
    ...PLATE_PALETTES['spring-reverb'],
    finish: 'speckle',
    cap: 'pointer',
    face: ['decay', 'tension', 'drip', 'mix'],
    picture: spring,
  },
  rotary: {
    ...PLATE_PALETTES.rotary,
    finish: 'brushed',
    cap: 'skirt',
    face: ['speed', 'hornDepth', 'drumDepth', 'drive'],
    labels: { hornDepth: 'Horn', drumDepth: 'Drum' },
    picture: rotary,
  },
  'analog-delay': {
    ...PLATE_PALETTES['analog-delay'],
    finish: 'grain',
    cap: 'skirt',
    face: ['time', 'feedback', 'modDepth', 'mix'],
    labels: { modDepth: 'Mod' },
    picture: analogDelay,
  },
  'analog-drive': {
    ...PLATE_PALETTES['analog-drive'],
    finish: 'brushed',
    cap: 'pointer',
    face: ['drive', 'circuit', 'tone', 'output'],
    picture: analogDrive,
  },
  cascade: {
    ...PLATE_PALETTES.cascade,
    finish: 'gloss',
    cap: 'dot',
    face: ['time', 'repeats', 'decay', 'mix'],
    picture: cascade,
  },
  'echo-memory': {
    ...PLATE_PALETTES['echo-memory'],
    finish: 'fade',
    cap: 'disc',
    face: ['time', 'feedback', 'memory', 'mix'],
    picture: echoMemory,
  },
  glitch: {
    ...PLATE_PALETTES.glitch,
    finish: 'speckle',
    cap: 'pointer',
    face: ['time', 'chance', 'repeat', 'mix'],
    picture: glitch,
  },
  'half-speed': {
    ...PLATE_PALETTES['half-speed'],
    finish: 'linen',
    cap: 'disc',
    face: ['length', 'speed', 'smooth', 'mix'],
    picture: halfSpeed,
  },
  'low-bitrate': {
    ...PLATE_PALETTES['low-bitrate'],
    finish: 'matte',
    cap: 'dot',
    face: ['loss', 'dropouts', 'smear', 'mix'],
    picture: lowBitrate,
  },
  'micro-looper': {
    ...PLATE_PALETTES['micro-looper'],
    finish: 'grain',
    cap: 'skirt',
    face: ['length', 'speed', 'fade', 'mix'],
    picture: microLooper,
  },
  'noise-floor': {
    ...PLATE_PALETTES['noise-floor'],
    finish: 'speckle',
    cap: 'disc',
    face: ['type', 'level', 'follow', 'tone'],
    picture: noiseFloor,
  },
  octaves: {
    ...PLATE_PALETTES.octaves,
    finish: 'matte',
    cap: 'pointer',
    face: ['sub2', 'sub1', 'up1', 'up2'],
    labels: { sub2: '−2', sub1: '−1', up1: '+1', up2: '+2' },
    picture: octaves,
  },
  'pad-follower': {
    ...PLATE_PALETTES['pad-follower'],
    finish: 'fade',
    cap: 'disc',
    face: ['rise', 'fall', 'brightness', 'mix'],
    labels: { brightness: 'Bright' },
    picture: padFollower,
  },
  patina: {
    ...PLATE_PALETTES.patina,
    finish: 'hammered',
    cap: 'skirt',
    face: ['medium', 'drive', 'wobble', 'wear'],
    picture: patina,
  },
  'pitch-shifter': {
    ...PLATE_PALETTES['pitch-shifter'],
    finish: 'gloss',
    cap: 'pointer',
    face: ['pitchA', 'pitchB', 'levelB', 'mix'],
    picture: pitchShifter,
  },
  radio: {
    ...PLATE_PALETTES.radio,
    finish: 'linen',
    cap: 'skirt',
    face: ['tuning', 'fading', 'static', 'bandwidth'],
    labels: { bandwidth: 'Width' },
    picture: radio,
  },
  're-amp': {
    ...PLATE_PALETTES['re-amp'],
    finish: 'brushed',
    cap: 'pointer',
    face: ['speaker', 'drive', 'distance', 'room'],
    picture: reAmp,
  },
  'shaped-reverb': {
    ...PLATE_PALETTES['shaped-reverb'],
    finish: 'fade',
    cap: 'dot',
    face: ['shape', 'time', 'tail', 'mix'],
    picture: shapedReverb,
  },
  'stereo-detune': {
    ...PLATE_PALETTES['stereo-detune'],
    finish: 'gloss',
    cap: 'disc',
    face: ['detune', 'delay', 'width', 'mix'],
    picture: stereoDetune,
  },
  sustainer: {
    ...PLATE_PALETTES.sustainer,
    finish: 'linen',
    cap: 'dot',
    face: ['attack', 'decay', 'motion', 'mix'],
    picture: sustainer,
  },
  'swarm-reverb': {
    ...PLATE_PALETTES['swarm-reverb'],
    finish: 'grain',
    cap: 'skirt',
    face: ['length', 'blur', 'stretch', 'mix'],
    picture: swarmReverb,
  },
  'vintage-digital': {
    ...PLATE_PALETTES['vintage-digital'],
    finish: 'speckle',
    cap: 'pointer',
    face: ['rate', 'bits', 'aliasing', 'jitter'],
    picture: vintageDigital,
  },
  vinyl: {
    ...PLATE_PALETTES.vinyl,
    finish: 'gloss',
    cap: 'disc',
    face: ['warp', 'crackle', 'wear', 'mix'],
    picture: vinyl,
  },
  'vowel-reverb': {
    ...PLATE_PALETTES['vowel-reverb'],
    finish: 'fade',
    cap: 'skirt',
    face: ['vowel', 'resonance', 'decay', 'mix'],
    labels: { resonance: 'Reso' },
    picture: vowelReverb,
  },
  // The tools and the rest. What each shows is its display (`displays/`).
  filter: { ...PLATE_PALETTES.filter, finish: 'gloss', cap: 'pointer' },
  eq3: { ...PLATE_PALETTES.eq3, finish: 'matte', cap: 'skirt' },
  'parametric-eq': { ...PLATE_PALETTES['parametric-eq'], finish: 'fade', cap: 'dot' },
  'ambient-eq': { ...PLATE_PALETTES['ambient-eq'], finish: 'linen', cap: 'disc' },
  tamer: { ...PLATE_PALETTES.tamer, finish: 'brushed', cap: 'pointer' },
  compressor: { ...PLATE_PALETTES.compressor, finish: 'hammered', cap: 'skirt' },
  // A short name on the plate where the whole one leaves a preset's name no room at the foot.
  'ambient-comp': {
    ...PLATE_PALETTES['ambient-comp'],
    finish: 'grain',
    cap: 'disc',
    name: 'Ambient Comp',
  },
  'ambient-limiter': { ...PLATE_PALETTES['ambient-limiter'], finish: 'matte', cap: 'dot' },
  'fet-limiter': { ...PLATE_PALETTES['fet-limiter'], finish: 'brushed', cap: 'pointer' },
  ducker: { ...PLATE_PALETTES.ducker, finish: 'gloss', cap: 'disc', name: 'Ducker' },
  swell: { ...PLATE_PALETTES.swell, finish: 'fade', cap: 'dot' },
  delay: { ...PLATE_PALETTES.delay, finish: 'matte', cap: 'disc' },
  'grain-delay': { ...PLATE_PALETTES['grain-delay'], finish: 'speckle', cap: 'dot' },
  'convolver-reverb': {
    ...PLATE_PALETTES['convolver-reverb'],
    finish: 'fade',
    cap: 'skirt',
    name: 'Convolver',
  },
  'plate-reverb': { ...PLATE_PALETTES['plate-reverb'], finish: 'brushed', cap: 'pointer' },
  'hall-reverb': { ...PLATE_PALETTES['hall-reverb'], finish: 'grain', cap: 'skirt' },
  'stereo-widener': { ...PLATE_PALETTES['stereo-widener'], finish: 'gloss', cap: 'disc' },
  utility: { ...PLATE_PALETTES.utility, finish: 'matte', cap: 'pointer' },
  'spectral-drifter': {
    ...PLATE_PALETTES['spectral-drifter'],
    finish: 'speckle',
    cap: 'dot',
    name: 'Drifter',
  },
  flanger: { ...PLATE_PALETTES.flanger, finish: 'gloss', cap: 'pointer' },
  'freq-shifter': {
    ...PLATE_PALETTES['freq-shifter'],
    finish: 'linen',
    cap: 'dot',
    name: 'Freq Shifter',
  },
  phaser: { ...PLATE_PALETTES.phaser, finish: 'fade', cap: 'skirt' },
  tremolo: { ...PLATE_PALETTES.tremolo, finish: 'grain', cap: 'skirt' },
  falling: { ...PLATE_PALETTES.falling, finish: 'speckle', cap: 'dot' },
  glints: { ...PLATE_PALETTES.glints, finish: 'gloss', cap: 'dot' },
}

/**
 * The kit's skin for every stock effect, by device id: a plate of its own
 * colour and finish with, where the kit has one, a display of what the device
 * is doing (`PLATE_FACES`) and the knobs that stand with it. A skin that has
 * a display keeps its picture for a host that wants the still plate.
 */
export const DEVICE_SKINS: Readonly<Record<string, DeviceSkin>> = Object.fromEntries(
  Object.entries(SKINS).map(([id, skin]): [string, DeviceSkin] => {
    const face = Object.hasOwn(PLATE_FACES, id) ? PLATE_FACES[id] : undefined
    return [id, face ? { ...skin, ...face } : skin]
  }),
)

/**
 * The plate of a device with no skin of its own, and of the tools (an EQ, a
 * compressor): the theme's colours, no finish and no picture, so it sits
 * quietly between the others.
 */
export const QUIET_SKIN: DeviceSkin = {
  plate: 'var(--lm-raised)',
  ink: 'var(--lm-text)',
  accent: 'var(--lm-accent)',
  finish: 'matte',
  cap: 'disc',
}

/** A number from a text, the same every time. */
function textHash(text: string): number {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0
  return hash
}

/**
 * A plug-in's own window, small: a title bar and three sliders, each at the
 * place of one of the plug-in's first parameters. It says what the plate
 * cannot show, that the rest is in a window of the plug-in's own. It stands
 * under a knob's name of two lines and above the name tag.
 */
function windowPicture(params: readonly string[]): PlatePicture {
  const shown = params.slice(0, 3)
  return {
    params: shown,
    draw: (at) => (
      <g fill="none" stroke={INK} strokeWidth={1}>
        <rect x={70} y={66} width={100} height={40} />
        <path d="M70 74H170" />
        {range(3).map((i) => (
          <circle key={i} cx={76 + i * 6} cy={70} r={1.5} fill={INK} stroke="none" />
        ))}
        {shown.map((param, i) => {
          const y = 81 + i * 9
          return (
            <g key={param}>
              <path d={`M80 ${y}H160`} opacity={0.45} />
              <rect
                x={r1(80 + at(param) * 76)}
                y={y - 3}
                width={4}
                height={6}
                fill={ACCENT}
                stroke="none"
              />
            </g>
          )
        })}
      </g>
    ),
  }
}

const HOSTED_FINISHES: readonly PlateFinish[] = ['brushed', 'hammered', 'matte', 'grain']
const HOSTED_CAPS: readonly Exclude<KnobCap, 'arc'>[] = ['pointer', 'skirt', 'disc', 'dot']
const hostedSkins = new WeakMap<Device, DeviceSkin>()

/**
 * The skin of a hosted plug-in, which the kit has no look for: a case picked
 * by the plug-in's id (colour, finish and knob cap, the same every time), its
 * first four parameters on the face and its own window drawn small under them.
 * Kept per device, so the picture is drawn again only when a slider moves.
 */
export function hostedSkin(device: Device): DeviceSkin {
  const kept = hostedSkins.get(device)
  if (kept) return kept
  const hash = textHash(device.id)
  const palette = HOSTED_PLATES[hash % HOSTED_PLATES.length]
  const params = (device.panelParams ?? Object.keys(device.params)).filter(
    (name) => device.params[name],
  )
  const skin: DeviceSkin = {
    ...palette,
    finish: HOSTED_FINISHES[(hash >>> 8) % HOSTED_FINISHES.length],
    cap: HOSTED_CAPS[(hash >>> 16) % HOSTED_CAPS.length],
    picture: windowPicture(params),
  }
  hostedSkins.set(device, skin)
  return skin
}

/**
 * The skin a device is drawn with: its own from `skins`, else the quiet one.
 * A hosted plug-in, which has a window of its own, gets a case by its id
 * (`hostedSkin`). Null for a device that has something to say instead of
 * knobs (a plug-in that is missing): that one keeps the plain panel.
 */
export function deviceSkin(
  device: Device,
  skins: Readonly<Record<string, DeviceSkin>> = DEVICE_SKINS,
): DeviceSkin | null {
  if (device.notice) return null
  if (isEditorDevice(device)) return hostedSkin(device)
  return Object.hasOwn(skins, device.id) ? skins[device.id] : QUIET_SKIN
}

/** Whether a plate colour is dark; a colour that is not `#rrggbb` counts as light. */
export function isDarkPlate(plate: string): boolean {
  const hex = /^#([0-9a-f]{6})$/i.exec(plate)?.[1]
  if (!hex) return false
  const n = parseInt(hex, 16)
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 128
}

/**
 * A finish as SVG: noise or a gradient over the whole plate, light on a dark
 * plate and dark on a light one. `id` keeps its filter apart from every other
 * plate's on the page.
 */
export function PlateFinishLayer({
  finish,
  dark,
  id,
}: {
  finish: PlateFinish
  dark: boolean
  id: string
}) {
  if (finish === 'matte') return null
  const tone = dark ? 1 : 0
  const noise = (frequency: string, octaves: number, gain: number, cut: number) => (
    <filter id={id} x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves={octaves} seed={7} />
      <feColorMatrix
        type="matrix"
        values={`0 0 0 0 ${tone} 0 0 0 0 ${tone} 0 0 0 0 ${tone} ${gain} 0 0 0 ${cut}`}
      />
    </filter>
  )
  const filtered = (opacity: number) => (
    <rect width="100%" height="100%" filter={`url(#${id})`} opacity={opacity} />
  )
  const filled = <rect width="100%" height="100%" fill={`url(#${id})`} />
  let defs: ReactNode
  let body: ReactNode
  if (finish === 'grain') {
    defs = noise('0.9', 2, 2.2, -0.75)
    body = filtered(0.2)
  } else if (finish === 'brushed') {
    defs = noise('0.004 0.9', 2, 1.6, -0.55)
    body = filtered(0.2)
  } else if (finish === 'speckle') {
    defs = noise('0.32', 1, 7, -4.3)
    body = filtered(0.45)
  } else if (finish === 'hammered') {
    defs = (
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="turbulence" baseFrequency="0.07" numOctaves={1} seed={4} />
        <feDiffuseLighting surfaceScale={2.2} diffuseConstant={1} lightingColor="white">
          <feDistantLight azimuth={235} elevation={58} />
        </feDiffuseLighting>
        <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 0.5" />
      </filter>
    )
    body = (
      <rect
        width="100%"
        height="100%"
        filter={`url(#${id})`}
        style={{ mixBlendMode: 'soft-light' }}
      />
    )
  } else if (finish === 'linen') {
    defs = (
      <pattern id={id} width={3} height={3} patternUnits="userSpaceOnUse">
        <path d="M0 0.5H3M0.5 0V3" stroke={dark ? '#fff' : '#000'} strokeWidth={1} opacity={0.1} />
      </pattern>
    )
    body = filled
  } else if (finish === 'fade') {
    defs = (
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={0.16} />
        <stop offset="1" stopColor="#000" stopOpacity={0.22} />
      </linearGradient>
    )
    body = filled
  } else {
    defs = (
      <linearGradient id={id} x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={0.4} />
        <stop offset="0.42" stopColor="#fff" stopOpacity={0} />
      </linearGradient>
    )
    body = filled
  }
  return (
    <svg className="lm-plate__finish" width="100%" height="100%" aria-hidden="true">
      <defs>{defs}</defs>
      {body}
    </svg>
  )
}
