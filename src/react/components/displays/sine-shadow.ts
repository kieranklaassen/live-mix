// The display of Sine Shadow: the sines it is making, each an upright line at
// its own pitch and as tall as it is loud, over the spectrum of what comes
// out. The device reports its sines through display meters (`hz1`, `level1`
// to `hz24`, `level24`, loudest first); the display draws them as they come
// and keeps nothing of them. While no reading has come (no sound, switched
// off) it shows a worked example from the settings alone: a low note of forty
// harmonics, the strongest few of them followed, moved and weighed exactly as
// the device would.

import {
  INK,
  clamp,
  freqGrid,
  gainToDb,
  ground,
  handle,
  label,
  rule,
  spectrum,
  trace,
  xOfHz,
  yOfDb,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// From cpp/devices/sine-shadow/sine_shadow.h.
/** The sines the device reports: `kShown`, and the most Partials asks for. */
export const SHADOW_SHOWN = 24
/** Tone leans dark above this and bright below that: `kDarkHz`, `kBrightHz`. */
const SHADOW_DARK_HZ = 300
const SHADOW_BRIGHT_HZ = 2500
/** The ends of what a sine may sound at: `kFadeInLowHz`, `kFadeInHighHz`, `kFadeOutLowHz`, `kFadeOutHighHz`. */
const SHADOW_IN_LOW_HZ = 16
const SHADOW_IN_HIGH_HZ = 22
const SHADOW_OUT_LOW_HZ = 12000
const SHADOW_OUT_HIGH_HZ = 16000

/** The scale the lines stand on: a full-scale sine reaches the top. */
export const SHADOW_TOP_DB = 0
export const SHADOW_FOOT_DB = -72
/** Under this nothing sounds, as for the plate that draws the display. */
const QUIET = 1e-4

/**
 * The worked example: a note of this pitch with so many harmonics, harmonic
 * `h` at this level over `h`. The 24 strongest sum to 0.94, under the least
 * the device's ceiling ever is (1.29, at Mix 0.62), so the ceiling never
 * turns the example down and it is left out here.
 */
export const SHADOW_EXAMPLE_HZ = 110
export const SHADOW_EXAMPLE_HARMONICS = 40
export const SHADOW_EXAMPLE_LEVEL = 0.25

/** What Tone makes of a partial at `hz`: `lean()`, 1 at the centre and never more, 6 dB an octave at the ends. */
export function shadowLean(tone: number, hz: number): number {
  const x = 2 * tone - 1
  if (x < 0) {
    const octaves = Math.log2(hz / SHADOW_DARK_HZ)
    return octaves > 0 ? Math.pow(2, x * octaves) : 1
  }
  const octaves = Math.log2(hz / SHADOW_BRIGHT_HZ)
  return octaves < 0 ? Math.pow(2, x * octaves) : 1
}

/** The fade at the two ends of what a sine may sound at: `band()`. */
export function shadowBand(hz: number, sampleRate = 48000): number {
  const top = Math.min(SHADOW_OUT_HIGH_HZ, 0.42 * sampleRate)
  const knee = top * (SHADOW_OUT_LOW_HZ / SHADOW_OUT_HIGH_HZ)
  if (hz <= SHADOW_IN_LOW_HZ || hz >= top) return 0
  if (hz < SHADOW_IN_HIGH_HZ)
    return (hz - SHADOW_IN_LOW_HZ) / (SHADOW_IN_HIGH_HZ - SHADOW_IN_LOW_HZ)
  if (hz > knee) return (top - hz) / (top - knee)
  return 1
}

/** The gain Mix gives the sines: `mix_gains()`, the sine of Mix quarter turns. */
export const shadowWet = (mix: number): number => Math.sin(clamp(mix, 0, 1) * (Math.PI / 2))

export interface ShadowLine {
  /** The sine's pitch. */
  hz: number
  /** Its level before Mix, 1 a full-scale sine. */
  level: number
}

/**
 * The sines the device makes of the example note, as `track()` and `aim()`
 * do: each harmonic scores its level as Tone weighs it at its own pitch, the
 * strongest `partials` are followed, and each sine sounds `transpose`
 * semitones away at that weighed level, faded at the ends of the range. Two
 * things the device does to a sine's pitch are under a pixel on this scale
 * (12 px an octave on a plate) and left out: Snap pulls it half a semitone at
 * the most, and a sine that Transpose puts within six cents of another
 * harmonic takes that harmonic's pitch.
 */
export function shadowExample(
  partials: number,
  transpose: number,
  tone: number,
  sampleRate = 48000,
): ShadowLine[] {
  const scored: { hz: number; score: number }[] = []
  for (let h = 1; h <= SHADOW_EXAMPLE_HARMONICS; h++) {
    const hz = SHADOW_EXAMPLE_HZ * h
    scored.push({ hz, score: (SHADOW_EXAMPLE_LEVEL / h) * shadowLean(tone, hz) })
  }
  scored.sort((a, b) => b.score - a.score)
  const count = clamp(Math.round(partials), 1, SHADOW_SHOWN)
  const shift = Math.pow(2, Math.round(transpose) / 12)
  return scored.slice(0, count).map(({ hz, score }) => ({
    hz: hz * shift,
    level: score * shadowBand(hz * shift, sampleRate),
  }))
}

interface ShadowLayout {
  /** The marks of how many partials are followed, along the top. */
  count: Box
  /** The spectrum and the sines. */
  box: Box
  /** The ruler of semitones along the foot. */
  ruler: Box
}

export function shadowLayout(view: Pick<DisplayView, 'width' | 'height'>): ShadowLayout {
  const { width, height } = view
  return {
    count: { x: 7, y: 5, w: width - 14, h: 7 },
    box: { x: 4, y: 16, w: width - 8, h: height - 34 },
    ruler: { x: 8, y: height - 12, w: width - 16, h: 7 },
  }
}

/** Where a line of that level (after Mix) tops out. */
export const shadowY = (level: number, box: Box): number =>
  clamp(yOfDb(gainToDb(level), box, SHADOW_TOP_DB, SHADOW_FOOT_DB), box.y, box.y + box.h)

function shadowHandles(view: DisplayView): DisplayHandle[] {
  const { count, ruler } = shadowLayout(view)
  const partials = view.spec('partials')
  const least = partials?.min ?? 1
  const most = partials?.max ?? SHADOW_SHOWN
  const step = count.w / most
  const followed = clamp(Math.round(view.value('partials')), least, most)
  const transpose = view.spec('transpose')
  const low = transpose?.min ?? -12
  const high = transpose?.max ?? 24
  const semitones = clamp(Math.round(view.value('transpose')), low, high)
  return [
    {
      key: 'partials',
      name: 'Partials',
      // On the last mark that is followed: the marks are one partial each.
      x: count.x + (followed - 0.5) * step,
      y: count.y + count.h / 2,
      drag: (x) => ({ partials: clamp(Math.round((x - count.x) / step + 0.5), least, most) }),
      reset: () => ({ partials: partials?.default ?? 8 }),
    },
    {
      key: 'transpose',
      name: 'Transpose',
      // On the ruler of semitones, which runs the control's whole range.
      x: ruler.x + ((semitones - low) / (high - low)) * ruler.w,
      y: ruler.y + ruler.h / 2,
      drag: (x) => ({
        transpose: clamp(Math.round(low + ((x - ruler.x) / ruler.w) * (high - low)), low, high),
      }),
      reset: () => ({ transpose: transpose?.default ?? 0 }),
    },
  ]
}

const SHADOW_HZ_METERS = Array.from({ length: SHADOW_SHOWN }, (_, n) => `hz${n + 1}`)
const SHADOW_LEVEL_METERS = Array.from({ length: SHADOW_SHOWN }, (_, n) => `level${n + 1}`)

interface ShadowState {
  /** What Tone takes off across the picture, and the setting and size it was worked out for. */
  tone: Point[]
  toneOf: [tone: number, width: number, height: number]
  /** The worked example, and the settings it was worked out for. */
  example: ShadowLine[]
  exampleOf: [partials: number, transpose: number, tone: number, sampleRate: number]
  /** Where this frame's lines top out, for their caps. */
  tops: Float32Array
}

const sineShadow = plateDisplay<ShadowState>({
  place: 'window',
  columns: 2,
  params: ['partials', 'transpose', 'tone', 'mix'],
  live: { meters: true, spectrum: true },
  info: 'Each sine the effect is making is an upright line at its pitch, as tall as it is loud, over the spectrum of what comes out. The thin line is what Tone takes off. The marks along the top are the partials followed and the ruler below is the transposition in semitones: drag either.',
  init: () => ({
    tone: [],
    toneOf: [Number.NaN, 0, 0],
    example: [],
    exampleOf: [Number.NaN, 0, 0, 0],
    tops: new Float32Array(2 * SHADOW_SHOWN),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { count, box, ruler } = shadowLayout(frame)
    const foot = box.y + box.h
    const tone = clamp(frame.value('tone'), 0, 1)
    const wet = shadowWet(frame.value('mix'))
    const heard = wet > QUIET
    // The device's own sines are read while it is on; the worked example stands in while it is off, and
    // while it is on with nothing sounding in or out of it.
    const reads = frame.powered && frame.hasMeter('level1')
    const signal = frame.signal
    const sounding =
      signal !== null && (signal.output.peak > QUIET || (signal.input?.peak ?? 0) > QUIET)

    freqGrid(frame, box)
    rule(ctx, box.x, foot, box.x + box.w, foot, { colour: colours.ink, alpha: INK.rule })
    if (reads) spectrum(frame, box)

    // What Tone takes off, on the lines' own scale: level at the top of the picture where it leaves a partial whole.
    if (heard) {
      const of = state.toneOf
      if (of[0] !== tone || of[1] !== frame.width || of[2] !== frame.height) {
        const points: Point[] = []
        const columns = Math.max(2, Math.floor(box.w / 2))
        for (let c = 0; c <= columns; c++) {
          const hz = 20 * Math.pow(1000, c / columns)
          points.push([box.x + (c / columns) * box.w, shadowY(shadowLean(tone, hz), box)])
        }
        state.tone = points
        of[0] = tone
        of[1] = frame.width
        of[2] = frame.height
      }
      trace(ctx, state.tone, { colour: colours.ink, width: 1, alpha: INK.back })
    }

    // The sines: the device's own, or the worked example while there are none and nothing sounds.
    let lines = 0
    const tops = state.tops
    const add = (hz: number, level: number): void => {
      const mixed = level * wet
      if (!(hz > 0) || !(mixed > QUIET) || lines >= SHADOW_SHOWN) return
      tops[2 * lines] = xOfHz(hz, box)
      tops[2 * lines + 1] = shadowY(mixed, box)
      lines += 1
    }
    if (reads) {
      for (let n = 0; n < SHADOW_SHOWN; n++)
        add(frame.meter(SHADOW_HZ_METERS[n]), frame.meter(SHADOW_LEVEL_METERS[n]))
    }
    const own = lines > 0
    if (!own && !(reads && sounding)) {
      const partials = frame.value('partials')
      const transpose = frame.value('transpose')
      const of = state.exampleOf
      if (
        of[0] !== partials ||
        of[1] !== transpose ||
        of[2] !== tone ||
        of[3] !== frame.sampleRate
      ) {
        state.example = shadowExample(partials, transpose, tone, frame.sampleRate)
        of[0] = partials
        of[1] = transpose
        of[2] = tone
        of[3] = frame.sampleRate
      }
      for (const line of state.example) add(line.hz, line.level)
    }
    if (lines > 0) {
      // The device's own sines are in the second colour: they are what is sounding now.
      const colour = own ? colours.accent : colours.ink
      ctx.beginPath()
      for (let n = 0; n < lines; n++) {
        ctx.moveTo(tops[2 * n], foot)
        ctx.lineTo(tops[2 * n], tops[2 * n + 1])
      }
      ctx.globalAlpha = own ? 1 : INK.text
      ctx.strokeStyle = colour
      ctx.lineWidth = 1.5
      ctx.lineCap = 'butt'
      ctx.setLineDash([])
      ctx.stroke()
      ctx.fillStyle = colour
      // A cap on each line that is tall enough to carry one, so its top is read over the spectrum.
      for (let n = 0; n < lines; n++) {
        if (foot - tops[2 * n + 1] >= 3) ctx.fillRect(tops[2 * n] - 1.5, tops[2 * n + 1] - 1, 3, 2)
      }
      ctx.globalAlpha = 1
    }

    // How many partials are followed: a mark each, the followed ones strong.
    const partialsSpec = frame.spec('partials')
    const most = partialsSpec?.max ?? SHADOW_SHOWN
    const step = count.w / most
    const wide = clamp(Math.floor(step) - 2, 2, 4)
    const followed = clamp(Math.round(frame.value('partials')), partialsSpec?.min ?? 1, most)
    ctx.fillStyle = colours.ink
    for (let n = 0; n < most; n++) {
      ctx.globalAlpha = n < followed ? 0.9 : INK.rule
      ctx.fillRect(count.x + (n + 0.5) * step - wide / 2, count.y, wide, count.h)
    }
    ctx.globalAlpha = 1

    // The transposition: a ruler of semitones with a tick at each octave, and a bar from none to the setting.
    const transposeSpec = frame.spec('transpose')
    const low = transposeSpec?.min ?? -12
    const high = transposeSpec?.max ?? 24
    const semitones = clamp(Math.round(frame.value('transpose')), low, high)
    const base = ruler.y + ruler.h
    const at = (value: number): number => ruler.x + ((value - low) / (high - low)) * ruler.w
    rule(ctx, ruler.x, base, ruler.x + ruler.w, base, { colour: colours.ink, alpha: INK.rule })
    for (let octave = Math.ceil(low / 12) * 12; octave <= high; octave += 12) {
      const x = at(octave)
      rule(ctx, x, octave === 0 ? ruler.y : base - 3, x, base, {
        colour: colours.ink,
        alpha: octave === 0 ? INK.text : INK.rule,
      })
    }
    if (semitones !== 0) {
      const from = Math.min(at(0), at(semitones))
      ctx.globalAlpha = 0.9
      ctx.fillStyle = colours.ink
      ctx.fillRect(from, ruler.y + ruler.h / 2 - 1, Math.abs(at(semitones) - at(0)), 2)
      ctx.globalAlpha = 1
    }

    const handles = shadowHandles(frame)
    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })

    // The point in hand, in words: at the top of the picture, at the end away from the point.
    const hot = handles.find((point) => point.key === frame.hot)
    if (hot) {
      const words =
        hot.key === 'partials'
          ? `${followed} ${followed === 1 ? 'partial' : 'partials'}`
          : `${semitones > 0 ? '+' : semitones < 0 ? '−' : ''}${Math.abs(semitones)} st`
      const left = hot.x > box.x + box.w / 2
      label(frame, words, left ? box.x + 4 : box.x + box.w - 4, box.y + 10, left ? 'left' : 'right')
    }
  },
  handles: shadowHandles,
})

export const SINE_SHADOW_FACES: Readonly<Record<string, PlateFace>> = {
  'sine-shadow': {
    display: sineShadow,
    face: ['partials', 'transpose', 'release', 'mix'],
    // "Transpose" between "Partials" and "Release" leaves no room between the words.
    labels: { transpose: 'Pitch' },
  },
}
