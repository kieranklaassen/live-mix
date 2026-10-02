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
import { PLATE_PALETTES } from './plate-palettes'

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

/** The skins the kit ships, by device id. */
export const DEVICE_SKINS: Readonly<Record<string, DeviceSkin>> = {
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
}

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

/**
 * The skin a device is drawn with: its own from `skins`, else the quiet one.
 * Null for a device that draws itself (a hosted plug-in with its own window)
 * or has something to say instead of knobs: those keep the plain panel.
 */
export function deviceSkin(
  device: Device,
  skins: Readonly<Record<string, DeviceSkin>> = DEVICE_SKINS,
): DeviceSkin | null {
  if (isEditorDevice(device) || device.notice) return null
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
