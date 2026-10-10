// The display of Ring: the spectrum as the ring modulator makes it. On a scale
// of pitch stand the partials of the sound going in, dashed where they were;
// the carrier, in the second colour, with the harmonics its shape has; and in
// the ink what the two make of each other, a sum and a difference for every
// partial and every harmonic of the carrier, as tall as the wet filters and
// Mix let them out. Behind them is what really comes out, on the same scale of
// decibels, so the marks stand where its peaks are.
//
// Every number here is `cpp/devices/ring/ring.h` or `ring_waves.h` again: the
// note's frequency, the shapes' series and where they are cut off, the gains
// of the two carriers, the Butterworth cuts, the equal-power mix, and the
// other law a carrier under 16 Hz goes over to (`Ring::slow`).

import {
  INK,
  clamp,
  clipped,
  follow,
  ground,
  handle,
  hzText,
  rule,
  spectrum,
  text,
  trace,
  type Box,
  type StrokeStyle,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayHold,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

type Size = Pick<DisplayView, 'width' | 'height'>
/** A point of a trace kept between frames, so drawing makes no new arrays. */
type Spot = [number, number]

// --- The device's own numbers -----------------------------------------------

/** `kFirstGain`, `kSecondGain` of `ring.h`: the two carriers with Second on (their squares sum to one). */
const FIRST_GAIN = 0.8
const SECOND_GAIN = 0.6
/** `kSecondRatio`: Off, a fifth (700 cents), an octave, an octave below. */
const SECOND_RATIO: readonly number[] = [1, 1.49830708, 2, 0.5]
/** `kDriftCents`: how far Drift leans at the top, by the square of the control. */
const DRIFT_CENTS = 50
/** `kBandLimit`: no harmonic of a shape is kept above this share of the sample rate. */
const BAND_LIMIT = 1 / 6
/** `Waves::kLimit` of `ring_waves.h`: the highest harmonic each table keeps. */
const LIMITS: readonly number[] = [1, 3, 5, 7, 11, 15, 23, 31, 47, 63, 95, 127]
/** `Waves::kSoft`, `Diode::kForward`, `Diode::kKnee`. */
const SOFT = 0.3
const FORWARD = 0.3
const KNEE = 0.12
/** `Waves::kPoints`: the series are summed over so many points of one cycle. */
const POINTS = 4096
/** `Waves::kSize`: the points of one cycle a table has. */
const TABLE = 2048
/** `Waves::kSlowSteps`: `slow_gain` is kept at so many steps of the offset between the sides. */
const SLOW_STEPS = 16
/** `kSlowHz`, `kFastHz` of `ring.h`: a tremolo's law at 4 Hz and under, a ring's from 16 Hz up. */
const SLOW_HZ = 4
const FAST_HZ = 16
/** Width turns the right side's carriers by up to this much of a cycle. */
const WIDTH_TURN = 0.25
/** The sample rate the handles are laid out at: where the cuts lie, the rate changes nothing a pixel can show. */
const NOMINAL_RATE = 48000

const NOTES: readonly string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** `Ring::note_hz`: Root 0..11 from C, Octave as in scientific pitch (A4 is 440 Hz). */
const noteHz = (root: number, octave: number): number =>
  440 * Math.pow(2, (12 * (octave + 1) + root - 69) / 12)

/** `Waves::ideal`: the three shapes that are not a sine, at `phase` in cycles. */
function idealShape(shape: number, phase: number): number {
  const s = Math.sin(2 * Math.PI * phase)
  if (shape === 0) {
    const p = phase - Math.floor(phase)
    return p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4
  }
  if (shape === 1) return s / Math.sqrt(s * s + SOFT * SOFT)
  return (
    0.5 *
    ((s - FORWARD) / Math.sqrt((s - FORWARD) * (s - FORWARD) + KNEE * KNEE) +
      (s + FORWARD) / Math.sqrt((s + FORWARD) * (s + FORWARD) + KNEE * KNEE))
  )
}

/**
 * `Waves::build`: the sine series of each shape, b_n = 2 · mean of
 * shape(φ)·sin(2πnφ) over the odd harmonics up to the last table's, scaled so
 * the whole series has a root mean square of one. Index 0 is the sine itself,
 * √2 at its one harmonic.
 */
function buildSeries(): Float64Array[] {
  const last = LIMITS[LIMITS.length - 1]
  const sine = new Float64Array(POINTS)
  for (let i = 0; i < POINTS; i++) sine[i] = Math.sin((2 * Math.PI * i) / POINTS)
  const plain = new Float64Array(last + 1)
  plain[1] = Math.SQRT2
  const all = [plain]
  const cycle = new Float64Array(POINTS)
  for (let shape = 0; shape < 3; shape++) {
    for (let i = 0; i < POINTS; i++) cycle[i] = idealShape(shape, i / POINTS)
    const harmonics = new Float64Array(last + 1)
    let power = 0
    for (let n = 1; n <= last; n += 2) {
      let sum = 0
      for (let i = 0; i < POINTS; i++) sum += cycle[i] * sine[(i * n) & (POINTS - 1)]
      harmonics[n] = (2 * sum) / POINTS
      power += 0.5 * harmonics[n] * harmonics[n]
    }
    const scale = 1 / Math.sqrt(power)
    for (let n = 1; n <= last; n += 2) harmonics[n] *= scale
    all.push(harmonics)
  }
  return all
}

// Worked out once, when a Ring is first drawn: numbers of the device, the same for every plate.
let builtSeries: Float64Array[] | undefined
const seriesOf = (wave: number): Float64Array =>
  (builtSeries ??= buildSeries())[clamp(Math.round(wave), 0, 3)]

/** `Ring::slow`: how much of a carrier at `hz` is a tremolo, 1 at 4 Hz and under, 0 from 16 Hz up. */
const slowness = (hz: number): number => clamp((FAST_HZ - hz) / (FAST_HZ - SLOW_HZ), 0, 1)

/**
 * The end of `Waves::build`: for each shape that is not a sine, and each of
 * 17 offsets between the two sides from none to a quarter cycle, the scale
 * that makes the loudest moment of the two sides together the dry sound's:
 * √(2 / the most that W(φ)² + W(φ + offset)² gets to), over the table that
 * holds the shape whole.
 */
function buildSlowGains(): Float64Array[] {
  const all: Float64Array[] = []
  const whole = new Float64Array(TABLE)
  for (let shape = 1; shape <= 3; shape++) {
    const series = seriesOf(shape)
    whole.fill(0)
    for (let n = 1; n < series.length; n += 2) {
      for (let i = 0; i < TABLE; i++)
        whole[i] += series[n] * Math.sin((2 * Math.PI * ((i * n) % TABLE)) / TABLE)
    }
    const gains = new Float64Array(SLOW_STEPS + 1)
    for (let j = 0; j <= SLOW_STEPS; j++) {
      const shift = (j * (TABLE / 4)) / SLOW_STEPS
      let most = 0
      for (let i = 0; i < TABLE; i++) {
        const other = whole[(i + shift) & (TABLE - 1)]
        most = Math.max(most, whole[i] * whole[i] + other * other)
      }
      gains[j] = Math.sqrt(2 / most)
    }
    all.push(gains)
  }
  return all
}

let builtSlowGains: Float64Array[] | undefined

/**
 * What a slow carrier of a shape is scaled by, the right side `offset` cycles
 * on from the left: the sine in closed form (`ring.h`), the rest read between
 * the 17 points (`Waves::slow_gain`).
 */
function slowGain(wave: number, offset: number): number {
  const shape = clamp(Math.round(wave), 0, 3)
  if (shape === 0) return Math.SQRT1_2 / Math.cos(Math.PI * offset)
  const gains = (builtSlowGains ??= buildSlowGains())[shape - 1]
  const position = clamp(offset * 4 * SLOW_STEPS, 0, SLOW_STEPS)
  const index = clamp(Math.floor(position), 0, SLOW_STEPS - 1)
  return gains[index] + (gains[index + 1] - gains[index]) * (position - index)
}

/**
 * How much of harmonic `n` a carrier at `hz` keeps: `Ring::choose_cut`. The
 * device reads two tables and blends them, the one whose highest harmonic
 * still lies under the limit and the one below it, so a harmonic comes in
 * gradually as the carrier falls and none is ever above the limit. The sine
 * has one harmonic and is never cut.
 */
function harmonicShare(n: number, hz: number, sampleRate: number): number {
  if (n <= LIMITS[0]) return 1
  const room = (sampleRate * BAND_LIMIT) / Math.max(hz, 1e-3)
  let cut = 0
  while (cut + 1 < LIMITS.length && LIMITS[cut + 1] <= room) cut++
  if (cut === 0) return 0
  if (n <= LIMITS[cut - 1]) return 1
  if (n > LIMITS[cut]) return 0
  const from = LIMITS[cut]
  const to = cut + 1 < LIMITS.length ? LIMITS[cut + 1] : 2 * from
  return clamp((room - from) / (to - from), 0, 1)
}

/**
 * What the wet sound's two filters leave of a frequency, as a gain: the high
 * and the low pass of `kit::Svf` at Q √½ (Butterworth), with the frequency
 * warped as the filter warps it.
 */
function wetFilterGain(hz: number, lowCut: number, tone: number, sampleRate: number): number {
  const warp = (f: number): number => Math.tan((Math.PI * f) / sampleRate)
  const at = warp(clamp(hz, 0, sampleRate * 0.499))
  const high = at / warp(clamp(lowCut, 5, sampleRate * 0.49))
  const low = at / warp(clamp(tone, 5, sampleRate * 0.49))
  return (
    (high * high) / Math.sqrt(1 + high * high * high * high) / Math.sqrt(1 + low * low * low * low)
  )
}

const toDb = (gain: number): number => (gain > 1e-9 ? 20 * Math.log10(gain) : -180)

/** Under this nothing of the ringing sound is heard, and nothing of it is drawn. */
const QUIET = 1e-4

/**
 * What Mix gives the dry sound and the ringing one. For a ring it is
 * `kit::equal_power`. By as much as the carriers are slow (`both`: each one's
 * slowness by the square of its gain) it goes over to a straight crossfade,
 * and two carriers to a sum of one.
 */
function mixGains(
  mix: number,
  both: number,
  gains: readonly [number, number],
): { dry: number; wet: number } {
  const set = clamp(mix, 0, 1)
  const dry = Math.cos(set * (Math.PI / 2))
  const wet = Math.sin(set * (Math.PI / 2))
  return {
    dry: dry + both * (1 - set - dry),
    wet: (wet + both * (set - wet)) * (1 + both * (1 / (gains[0] + gains[1]) - 1)),
  }
}

interface Carrier {
  free: boolean
  root: number
  octave: number
  /** What Fine multiplies the pitch by. */
  bend: number
  /** The carrier as it is set, Fine and all: `Ring::target_hz`. */
  hz: number
}

function carrierOf(view: Pick<DisplayView, 'value'>): Carrier {
  const free = Math.round(view.value('tune')) === 1
  const root = clamp(Math.round(view.value('root')), 0, 11)
  const octave = clamp(Math.floor(view.value('octave') + 0.5), 0, 7)
  const bend = Math.pow(2, view.value('fine') / 1200)
  return {
    free,
    root,
    octave,
    bend,
    hz: bend * (free ? view.value('frequency') : noteHz(root, octave)),
  }
}

/** The two carriers' gains and the second one's ratio to the first, as `Ring::apply` sets them. */
function secondOf(view: Pick<DisplayView, 'value'>): { gains: [number, number]; ratio: number } {
  const second = clamp(Math.round(view.value('second')), 0, 3)
  return {
    gains: second === 0 ? [1, 0] : [FIRST_GAIN, SECOND_GAIN],
    ratio: SECOND_RATIO[second],
  }
}

// --- The picture's scales ---------------------------------------------------

/** The scale of pitch: every note Root and Octave reach is on it, and the sums up to the top of hearing. */
const AXIS_MIN_HZ = 15
const AXIS_MAX_HZ = 20000
const AXIS_OCTAVES = Math.log2(AXIS_MAX_HZ / AXIS_MIN_HZ)
/** The scale of level: so far under its top a mark has no height. */
const RANGE_DB = 48
/** The carrier's harmonics that are drawn, and whose sums and differences are. */
const SHOWN_HARMONICS: readonly number[] = [1, 3, 5, 7]
/**
 * At rest there is no sound to show, and the marks are an example: four
 * partials of one tone, each as far under the first as its number.
 */
const EXAMPLE: readonly Partial[] = [1, 2, 3, 4].map((n) => ({ hz: 220 * n, db: toDb(1 / n) }))
/** How strongly the sums and differences against a harmonic of the carrier are drawn: they stand back from the rest. */
const HARMONIC_ALPHA = 0.4
/** How many partials of the sound going in are followed, and how far under the loudest one still counts. */
const MOST_PARTIALS = 5
const PARTIAL_REACH_DB = 30

interface Partial {
  hz: number
  /** Its level, in dB under the top of the scale (the example) or as it was read (the sound). */
  db: number
}

interface RingLayout {
  /** Where the marks stand: the scale of pitch across, the scale of level up. */
  plot: Box
  base: number
  /** The carrier in words: one line on a tall display, two on a strip. */
  words: { x: number; y: number; align: CanvasTextAlign; lines: 1 | 2 }
  /** The small scale of cents the drift is read on: its middle, its line and half its length. */
  cents: { x: number; y: number; half: number }
}

function ringLayout(view: Size): RingLayout {
  const base = view.height - 13
  const side = clamp(Math.round(view.width * 0.22), 40, 48)
  if (view.height >= 72) {
    // Room above: the words and the cents stand in a row over the whole width of the scale.
    return {
      plot: { x: 6, y: 20, w: view.width - 12, h: base - 20 },
      base,
      words: { x: 6, y: 13, align: 'left', lines: 1 },
      cents: { x: view.width - 6 - side / 2, y: 10, half: side / 2 - 2 },
    }
  }
  return {
    plot: { x: 6, y: 6, w: view.width - 18 - side, h: base - 6 },
    base,
    words: { x: view.width - 6, y: 13, align: 'right', lines: 2 },
    cents: { x: view.width - 6 - side / 2, y: base - 3, half: side / 2 - 2 },
  }
}

/** Where a frequency lies on the scale; left of the picture for one under its low end. */
const xAt = (hz: number, plot: Box): number =>
  plot.x + (Math.log2(Math.max(hz, 1e-3) / AXIS_MIN_HZ) / AXIS_OCTAVES) * plot.w
const hzAt = (x: number, plot: Box): number =>
  AXIS_MIN_HZ * Math.pow(2, ((x - plot.x) / plot.w) * AXIS_OCTAVES)
const onAxis = (hz: number): boolean => hz >= AXIS_MIN_HZ && hz <= AXIS_MAX_HZ
/** Where a level in dB under the top of the scale stands. */
const yAt = (db: number, plot: Box): number =>
  plot.y + (clamp(-db, 0, RANGE_DB) / RANGE_DB) * plot.h

/** A frequency in words, with the figures a slow carrier needs: "0.70 Hz", "13.0 Hz", "262 Hz", "1.2 kHz". */
function carrierText(hz: number): string {
  if (hz < 9.995) return `${hz.toFixed(2)} Hz`
  if (hz < 99.95) return `${hz.toFixed(1)} Hz`
  return hzText(hz)
}

// --- The sound going in -----------------------------------------------------
//
// The partials are read from the window of samples the plate hands over, the
// way the analyser reads what comes out (a Blackman window, the size of the
// transform taken out, magnitudes smoothed from frame to frame), so both are
// on one scale of decibels and a mark stands as high as the peak it foretells.

const FFT_SIZE = 2048
const BINS = FFT_SIZE / 2
/** The analyser's own smoothing (`Tap` in `plate-display.ts`). */
const SMOOTHING = 0.7

interface FftTables {
  cos: Float32Array
  sin: Float32Array
  reverse: Uint16Array
  window: Float32Array
}

function buildFft(): FftTables {
  const cos = new Float32Array(BINS)
  const sin = new Float32Array(BINS)
  for (let i = 0; i < BINS; i++) {
    cos[i] = Math.cos((2 * Math.PI * i) / FFT_SIZE)
    sin[i] = Math.sin((2 * Math.PI * i) / FFT_SIZE)
  }
  const bits = Math.log2(FFT_SIZE)
  const reverse = new Uint16Array(FFT_SIZE)
  for (let i = 0; i < FFT_SIZE; i++) {
    let r = 0
    for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b)
    reverse[i] = r
  }
  const window = new Float32Array(FFT_SIZE)
  for (let i = 0; i < FFT_SIZE; i++) {
    const turn = (2 * Math.PI * i) / FFT_SIZE
    window[i] = 0.42 - 0.5 * Math.cos(turn) + 0.08 * Math.cos(2 * turn)
  }
  return { cos, sin, reverse, window }
}

// Tables of the transform, the same for every plate; made when a Ring first hears a sound.
let builtFft: FftTables | undefined

/** The transform of `re` (with `im` zero), in place. */
function transform(re: Float32Array, im: Float32Array, tables: FftTables): void {
  const { cos, sin, reverse } = tables
  for (let i = 0; i < FFT_SIZE; i++) {
    const j = reverse[i]
    if (j > i) {
      const kept = re[i]
      re[i] = re[j]
      re[j] = kept
    }
  }
  for (let size = 2, step = BINS; size <= FFT_SIZE; size *= 2, step /= 2) {
    const half = size / 2
    for (let start = 0; start < FFT_SIZE; start += size) {
      for (let k = 0, turn = 0; k < half; k++, turn += step) {
        const i = start + k
        const j = i + half
        const real = re[j] * cos[turn] + im[j] * sin[turn]
        const imag = im[j] * cos[turn] - re[j] * sin[turn]
        re[j] = re[i] - real
        im[j] = im[i] - imag
        re[i] += real
        im[i] += imag
      }
    }
  }
}

interface RingState {
  re: Float32Array
  im: Float32Array
  /** The magnitude of every bin of the sound going in, smoothed over the frames. */
  heard: Float32Array
  /** False until a first window was read: there is nothing to smooth from. */
  primed: boolean
  /** The loudest partials of the sound going in, loudest first, and how many there are now. */
  partials: Partial[]
  bins: Int32Array
  found: number
  /** The top of the scale of level in dB: it follows the loudest thing in the picture. */
  top: number | null
  curve: Spot[]
}

/** Read the partials of the sound going in from its newest window. */
function listen(state: RingState, wave: Float32Array, sampleRate: number): void {
  const tables = (builtFft ??= buildFft())
  const { re, im, heard, bins, partials } = state
  const from = wave.length - FFT_SIZE
  for (let i = 0; i < FFT_SIZE; i++) {
    const sample = from + i >= 0 ? wave[from + i] : 0
    // A sample that is not a number is no sound: it must not stop the display.
    re[i] = sample > -64 && sample < 64 ? sample * tables.window[i] : 0
    im[i] = 0
  }
  transform(re, im, tables)
  let loudest = 0
  for (let k = 0; k < BINS; k++) {
    const now = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / FFT_SIZE
    heard[k] = state.primed ? SMOOTHING * heard[k] + (1 - SMOOTHING) * now : now
    if (k > 0 && heard[k] > loudest) loudest = heard[k]
  }
  state.primed = true
  // The peaks, loudest first: a bin above both its neighbours, within reach of the loudest.
  const floor = Math.max(loudest * Math.pow(10, -PARTIAL_REACH_DB / 20), 1e-5)
  let found = 0
  for (let k = 1; k < BINS - 1; k++) {
    const level = heard[k]
    if (level <= floor || level <= heard[k - 1] || level < heard[k + 1]) continue
    let slot = found
    while (slot > 0 && heard[bins[slot - 1]] < level) slot--
    if (slot >= MOST_PARTIALS) continue
    for (let move = Math.min(found, MOST_PARTIALS - 1); move > slot; move--)
      bins[move] = bins[move - 1]
    bins[slot] = k
    if (found < MOST_PARTIALS) found++
  }
  for (let n = 0; n < found; n++) {
    // Between the bins: the top of the parabola through the peak and its two neighbours, in dB.
    const k = bins[n]
    const below = toDb(heard[k - 1])
    const at = toDb(heard[k])
    const above = toDb(heard[k + 1])
    const bend = below - 2 * at + above
    const offset = bend < 0 ? clamp((0.5 * (below - above)) / bend, -0.5, 0.5) : 0
    partials[n].hz = ((k + offset) * sampleRate) / FFT_SIZE
    partials[n].db = at - 0.25 * (below - above) * offset
  }
  state.found = found
}

// --- Handles ----------------------------------------------------------------

function ringHandles(view: DisplayView): DisplayHandle[] {
  const { plot } = ringLayout(view)
  const carrier = carrierOf(view)
  const lies = xAt(carrier.hz, plot)
  const x = clamp(lies, plot.x, plot.x + plot.w)
  const frequency = view.value('frequency')
  const frequencySpec = view.spec('frequency')
  const lowCut = view.value('lowCut')
  const tone = view.value('tone')
  const cut = (key: 'lowCut' | 'tone', name: string, hz: number): DisplayHandle => {
    const spec = view.spec(key)
    const at = xAt(hz, plot)
    return {
      key,
      name,
      x: at,
      // On the curve, at the corner: 3 dB under the top, and whatever the other cut takes there.
      y: yAt(toDb(wetFilterGain(hz, lowCut, tone, NOMINAL_RATE)), plot),
      drag: (to) => ({
        [key]:
          Math.abs(to - at) < 0.25 ? hz : clamp(hzAt(to, plot), spec?.min ?? hz, spec?.max ?? hz),
      }),
      reset: () => ({ [key]: spec?.default ?? hz }),
    }
  }
  return [
    {
      key: 'carrier',
      name: 'Carrier',
      x,
      y: plot.y + plot.h / 2,
      // The carrier's line taken along the scale. With Tune on Note it goes
      // to the nearest octave of the root, the notes the scale has its ticks
      // on; on Free it sets Frequency. A slow carrier lies left of the
      // picture and its line waits at the edge: it is moved from where the
      // setting lies, as far past the edge as it lay at the press.
      drag: (to: number, _y: number, hold?: DisplayHold): Readonly<Record<string, number>> => {
        const kept = hold ?? {}
        kept.past ??= lies - x
        const asked = to + kept.past
        if (Math.abs(asked - lies) < 0.25)
          return carrier.free ? { frequency } : { octave: carrier.octave }
        const hz = hzAt(asked, plot) / carrier.bend
        if (carrier.free)
          return {
            frequency: clamp(hz, frequencySpec?.min ?? frequency, frequencySpec?.max ?? frequency),
          }
        return { octave: clamp(Math.round(Math.log2(hz / noteHz(carrier.root, 0))), 0, 7) }
      },
      // The wheel is a semitone a step: the next note, or Frequency by as much.
      wheel: (steps): Readonly<Record<string, number>> => {
        if (carrier.free)
          return {
            frequency: clamp(
              frequency * Math.pow(2, steps / 12),
              frequencySpec?.min ?? frequency,
              frequencySpec?.max ?? frequency,
            ),
          }
        const note = clamp(carrier.octave * 12 + carrier.root + Math.round(steps), 0, 95)
        return { root: note % 12, octave: Math.floor(note / 12) }
      },
      reset: (): Readonly<Record<string, number>> =>
        carrier.free
          ? { frequency: frequencySpec?.default ?? frequency }
          : { octave: view.spec('octave')?.default ?? carrier.octave },
    },
    cut('lowCut', 'Low Cut', lowCut),
    cut('tone', 'Tone', tone),
  ]
}

// --- The display ------------------------------------------------------------

const signed = (value: number): string =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(0)}`

const ringDisplay = plateDisplay<RingState>({
  place: 'strip',
  params: [
    'root',
    'octave',
    'fine',
    'tune',
    'frequency',
    'wave',
    'second',
    'drift',
    'lowCut',
    'tone',
    'width',
    'mix',
  ],
  live: { meters: true, signal: true, spectrum: true },
  info: 'Partials on a scale of pitch over what comes out: dashed where they went in (an example tone at rest), solid at the sum and the difference each makes with the carrier, the coloured line. The curve is what Low Cut and Tone leave. Drag the line and the two points; the small scale shows the drift.',
  init: () => ({
    re: new Float32Array(FFT_SIZE),
    im: new Float32Array(FFT_SIZE),
    heard: new Float32Array(BINS),
    primed: false,
    partials: Array.from({ length: MOST_PARTIALS }, (): Partial => ({ hz: 0, db: 0 })),
    bins: new Int32Array(MOST_PARTIALS),
    found: 0,
    top: null,
    curve: [],
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const layout = ringLayout(frame)
    const { plot, base } = layout
    const rate = frame.sampleRate
    const carrier = carrierOf(frame)
    const { gains, ratio } = secondOf(frame)
    const series = seriesOf(frame.value('wave'))
    const lowCut = frame.value('lowCut')
    const tone = frame.value('tone')

    // The carrier as it is now: the device reports it with the drift on it
    // and the glide to a new note. At rest it reports the pitch that is set.
    const reading = frame.hasMeter('carrier') ? frame.meter('carrier') : 0
    const running =
      frame.powered && frame.signal !== null && Number.isFinite(reading) && reading > 0
    const now = running ? reading : carrier.hz
    /** The two carriers where they are now: the pairs are made by these, not by the setting. */
    const carrierHz = [now, now * ratio]

    // A slow carrier is a gain on the sound and not a pair of new partials:
    // its shape is brought from a root mean square of one towards the scale
    // that keeps the loudest moment the dry sound's (by Width, which turns
    // the sides apart), and Mix from equal power towards a crossfade.
    const slow = [slowness(carrierHz[0]), slowness(carrierHz[1])]
    const tame =
      slow[0] > 0 || slow[1] > 0
        ? slowGain(frame.value('wave'), WIDTH_TURN * clamp(frame.value('width'), 0, 1))
        : 1
    const scales = [1 + slow[0] * (tame - 1), 1 + slow[1] * (tame - 1)]
    const both = Math.min(1, gains[0] * gains[0] * slow[0] + gains[1] * gains[1] * slow[1])
    const { dry, wet } = mixGains(frame.value('mix'), both, gains)
    const mixedIn = wet > QUIET

    // The sound: its partials going in, and the level the scale hangs from.
    const input = frame.powered ? (frame.signal?.input ?? null) : null
    if (input) listen(state, input.wave, rate)
    else {
      state.primed = false
      state.found = 0
    }
    let partials: readonly Partial[] = EXAMPLE
    let count = EXAMPLE.length
    let top = 0
    if (input) {
      let loudest = state.found > 0 ? state.partials[0].db : -Infinity
      const bins = frame.signal?.spectrum
      if (bins) for (let i = 1; i < bins.length; i++) if (bins[i] > loudest) loudest = bins[i]
      if (Number.isFinite(loudest) && loudest > -100)
        state.top = state.top === null ? loudest : follow(state.top, loudest, frame.dt, 0.05, 4)
      // In silence there is nothing to read, and the example stands in, as at rest.
      if (state.found > 0 && state.top !== null) {
        partials = state.partials
        count = state.found
        top = state.top
      }
    }

    // What comes out, on the same two scales.
    if (frame.powered && frame.signal?.spectrum && state.top !== null) {
      clipped(ctx, plot, () => {
        spectrum(frame, plot, {
          topDb: state.top ?? 0,
          bottomDb: (state.top ?? 0) - RANGE_DB,
          minHz: AXIS_MIN_HZ,
          maxHz: AXIS_MAX_HZ,
          alpha: 0.3,
        })
      })
    }

    // The scale of pitch. With Tune on Note its ticks are the root in every
    // octave, the notes the carrier's line goes to; on Free it is in hertz.
    rule(ctx, plot.x - 2, base, plot.x + plot.w + 2, base, { colour: colours.ink, alpha: INK.rule })
    if (carrier.free) {
      for (let decade = 10; decade < AXIS_MAX_HZ; decade *= 10) {
        for (const step of [1, 2, 5]) {
          const hz = decade * step
          if (!onAxis(hz)) continue
          const x = xAt(hz, plot)
          if (step === 1) {
            rule(ctx, x, plot.y, x, base + 3, { colour: colours.ink, alpha: INK.grid })
            text(frame, hz >= 1000 ? `${hz / 1000}k` : `${hz}`, x, frame.height - 3, {
              align: 'center',
              alpha: INK.back,
            })
          } else {
            rule(ctx, x, base, x, base + 2, { colour: colours.ink, alpha: INK.rule })
          }
        }
      }
    } else {
      const name = NOTES[carrier.root]
      const perOctave = plot.w / AXIS_OCTAVES
      const room = (name.length + 1) * 5.5 + 7
      const every = perOctave >= room ? 1 : perOctave * 2 >= room ? 2 : 3
      for (let octave = -1; octave <= 10; octave++) {
        const hz = noteHz(carrier.root, octave)
        if (!onAxis(hz)) continue
        const x = xAt(hz, plot)
        rule(ctx, x, plot.y, x, base + 3, { colour: colours.ink, alpha: INK.grid })
        // The carrier's own octave is always one of those that are named.
        if ((((octave - carrier.octave) % every) + every) % every === 0)
          text(frame, `${name}${octave}`, x, frame.height - 3, { align: 'center', alpha: INK.back })
      }
    }

    // What Low Cut and Tone leave of the ringing sound: the top of the scale is all of it.
    const points = Math.max(2, Math.floor(plot.w / 2) + 1)
    if (state.curve.length !== points)
      state.curve = Array.from({ length: points }, (): Spot => [0, 0])
    for (let i = 0; i < points; i++) {
      const x = plot.x + (i / (points - 1)) * plot.w
      state.curve[i][0] = x
      state.curve[i][1] = yAt(toDb(wetFilterGain(hzAt(x, plot), lowCut, tone, rate)), plot)
    }
    trace(ctx, state.curve, { colour: colours.ink, width: 1, alpha: INK.back })

    // A mark standing on the scale, from the foot up to its level.
    const mark = (hz: number, db: number, style: StrokeStyle): void => {
      if (!onAxis(hz) || !(db > -RANGE_DB)) return
      const x = xAt(hz, plot)
      rule(ctx, x, base, x, yAt(db, plot), style)
    }

    // The partials where they went in, dashed; and solid as far up as the
    // dry part of the mix still lets each be heard.
    for (let p = 0; p < count; p++) {
      const { hz, db } = partials[p]
      mark(hz, db - top, { colour: colours.ink, alpha: INK.back, dash: [2, 2] })
      if (dry > QUIET) mark(hz, db - top + toDb(dry), { colour: colours.ink, alpha: INK.back })
    }

    // What the ring makes of them. A partial at f against a harmonic of a
    // carrier at c, of height a, comes out as two, at c + f and |c − f|, each
    // at a/2 of the partial: then the two cuts and Mix. The carrier is the
    // one that is running, drift and glide and all, so the marks stand under
    // the peaks of what comes out. Every partial is shown against the two
    // carriers themselves, and the loudest against the harmonics of their
    // shape too. With nothing of it in the mix none of this is heard, and
    // none of it is drawn.
    if (mixedIn) {
      for (let pass = 0; pass < 3; pass++) {
        // The faintest first, so the strong marks lie on top: harmonics, the second carrier, the first.
        const k = pass === 2 ? 0 : 1
        const style: StrokeStyle =
          pass === 0
            ? { colour: colours.ink, alpha: HARMONIC_ALPHA }
            : pass === 1
              ? { colour: colours.ink, alpha: INK.text }
              : { colour: colours.ink, width: 1.5 }
        for (const side of pass === 0 ? [0, 1] : [k]) {
          const gain = gains[side]
          if (gain <= 0) continue
          const hz = carrierHz[side]
          for (const n of SHOWN_HARMONICS) {
            if ((pass === 0) !== n > 1) continue
            const height = gain * scales[side] * series[n] * harmonicShare(n, hz, rate)
            if (Math.abs(height) < QUIET) continue
            for (let p = 0; p < (n > 1 ? Math.min(1, count) : count); p++) {
              const partial = partials[p]
              for (const to of [n * hz + partial.hz, Math.abs(n * hz - partial.hz)]) {
                const through = 0.5 * Math.abs(height) * wet * wetFilterGain(to, lowCut, tone, rate)
                mark(to, partial.db - top + toDb(through), style)
              }
            }
          }
        }
      }
    }

    // The carrier, in the second colour while it is heard: a line for each
    // harmonic of its shape, as tall as the harmonic is (a sine alone reaches
    // the top; a slow one is as much lower as its law takes it down), for
    // the second carrier too. They stand where the device says the carrier
    // is now. With nothing of the ring in the mix they are the setting and
    // no more, and are drawn in the ink.
    for (const side of [1, 0]) {
      const gain = gains[side]
      if (gain <= 0) continue
      const hz = carrierHz[side]
      for (const n of SHOWN_HARMONICS) {
        const height =
          Math.abs(gain * scales[side] * series[n] * harmonicShare(n, hz, rate)) / Math.SQRT2
        if (height < QUIET) continue
        const first = side === 0 && n === 1
        // A slow carrier lies left of the scale: its line waits at the edge, where its handle is.
        const x = first ? clamp(xAt(hz, plot), plot.x, plot.x + plot.w) : xAt(n * hz, plot)
        if (!first && !onAxis(n * hz)) continue
        const y = yAt(toDb(height), plot)
        if (base - y < 0.5) continue
        trace(
          ctx,
          [
            [x, base],
            [x, y],
          ],
          mixedIn
            ? { colour: colours.accent, width: n === 1 ? 1.5 : 1, alpha: first ? 1 : 0.7 }
            : { colour: colours.ink, width: n === 1 ? 1.5 : 1, alpha: first ? INK.back : INK.rule },
        )
      }
    }

    // The carrier in words, as it is set, and the drift on a scale of cents:
    // the bar is how far Drift lets the carrier lean either way, the mark in
    // the second colour where it leans now.
    const cents = 1200 * Math.log2(carrier.bend)
    const bent = Math.abs(cents) >= 0.5 ? ` ${signed(cents)}` : ''
    const named = `${carrier.free ? 'Free' : `${NOTES[carrier.root]}${carrier.octave}`}${bent}`
    const { words } = layout
    if (words.lines === 2) {
      text(frame, named, words.x, words.y, { align: words.align })
      text(frame, carrierText(carrier.hz), words.x, words.y + 10, {
        align: words.align,
        alpha: INK.back,
      })
    } else {
      text(frame, `${named}  ${carrierText(carrier.hz)}`, words.x, words.y, { align: words.align })
    }
    const scale = layout.cents
    const perCent = scale.half / DRIFT_CENTS
    rule(ctx, scale.x - scale.half, scale.y, scale.x + scale.half, scale.y, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    for (const end of [-1, 0, 1]) {
      const x = scale.x + end * scale.half
      rule(ctx, x, scale.y - (end === 0 ? 3 : 2), x, scale.y + (end === 0 ? 3 : 2), {
        colour: colours.ink,
        alpha: INK.rule,
      })
    }
    const drift = clamp(frame.value('drift'), 0, 1)
    const reach = DRIFT_CENTS * drift * drift * perCent
    if (reach >= 0.5)
      trace(
        ctx,
        [
          [scale.x - reach, scale.y],
          [scale.x + reach, scale.y],
        ],
        { colour: colours.ink, width: 3, alpha: INK.back },
      )
    if (mixedIn) {
      const leans = running
        ? clamp(1200 * Math.log2(now / carrier.hz), -DRIFT_CENTS, DRIFT_CENTS)
        : 0
      const x = scale.x + leans * perCent
      trace(
        ctx,
        [
          [x, scale.y - 4],
          [x, scale.y + 4],
        ],
        { colour: colours.accent, width: 2 },
      )
    }

    for (const point of ringHandles(frame)) {
      handle(frame, point.x, point.y, {
        hot: frame.hot === point.key,
        radius: point.key === 'carrier' ? 3.5 : 3,
      })
    }
  },
  handles: ringHandles,
})

export const RING_FACES: Readonly<Record<string, PlateFace>> = {
  ring: {
    display: ringDisplay,
    face: ['root', 'octave', 'drift', 'mix'],
  },
}
