// Displays of the devices that move pitch: where each voice lands against the
// sound that went in. A shifter by an interval has a ruler in semitones with
// the input at 0; the octave voices stand in their octaves over the spectrum;
// a slowed sound is a stretch of tape with the heads moving through it; a
// frequency shifter has a scale in hertz, because that is what it moves by;
// a harmonizer has the lattice of its scale.

import {
  INK,
  clamp,
  clipped,
  crisp,
  dot,
  fillRect,
  fillTo,
  follow,
  gainToDb,
  ground,
  handle,
  rule,
  spectrum,
  text,
  trace,
  trackPhase,
  yOfDb,
  type Box,
  type PhaseTrack,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

type Size = Pick<DisplayView, 'width' | 'height'>
/** A point of a trace kept between frames, so drawing makes no new arrays. */
type Spot = [number, number]

const spots = (count: number): Spot[] => Array.from({ length: count }, (): Spot => [0, 0])
/** The same list when it already has so many points: a new one only when the display changes size. */
const sized = (list: Spot[], count: number): Spot[] => (list.length === count ? list : spots(count))

/** A number with its sign, the minus a real one: "+12", "−5", "0". */
const signed = (value: number, digits = 0): string =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(digits)}`

/**
 * What the low pass of `kit::Svf` (the trapezoidal state variable filter in
 * `cpp/kit/filters.h`) leaves of a frequency, as a gain: the analogue second
 * order response with the frequency warped as the filter warps it.
 */
function svfLowGain(hz: number, cutHz: number, q: number, sampleRate: number): number {
  const warp = (f: number): number =>
    Math.tan((Math.PI * clamp(f, 5, sampleRate * 0.49)) / sampleRate)
  const r = warp(hz) / warp(cutHz)
  const k = 1 / Math.max(q, 0.1)
  const a = 1 - r * r
  return 1 / Math.sqrt(a * a + k * k * r * r)
}

// --- A ruler in semitones ---------------------------------------------------

interface Ruler {
  x: number
  w: number
  /** Where a mark of full height ends, and where every mark stands. */
  top: number
  base: number
  min: number
  max: number
}

/** A ruler across the display from `min` to `max` semitones, its numbers under it. */
function semitoneRuler(view: Size, min: number, max: number): Ruler {
  return { x: 11, w: view.width - 22, top: 8, base: view.height - 13, min, max }
}

const xOfSt = (st: number, ruler: Ruler): number =>
  ruler.x + ((st - ruler.min) / (ruler.max - ruler.min)) * ruler.w
const stOfX = (x: number, ruler: Ruler): number =>
  ruler.min + ((x - ruler.x) / ruler.w) * (ruler.max - ruler.min)
/** How high a mark of that level stands: 1 is the full height. */
const yOfLevel = (level: number, ruler: Ruler): number =>
  ruler.base - clamp(level, 0, 1) * (ruler.base - ruler.top)

/** The ruler itself: a tick for every semitone, a line and a number for every octave, the middle one stronger. */
function drawRuler(frame: DisplayFrame, ruler: Ruler): void {
  const { ctx, colours } = frame
  const perSt = ruler.w / (ruler.max - ruler.min)
  rule(ctx, ruler.x - 4, ruler.base, ruler.x + ruler.w + 4, ruler.base, {
    colour: colours.ink,
    alpha: INK.rule,
  })
  for (let st = Math.ceil(ruler.min); st <= ruler.max; st++) {
    const x = xOfSt(st, ruler)
    if (st % 12 === 0) {
      rule(ctx, x, ruler.top - 3, x, ruler.base + 3, {
        colour: colours.ink,
        alpha: st === 0 ? INK.rule : INK.grid,
      })
      text(frame, signed(st), x, frame.height - 3, { align: 'center', alpha: INK.back })
    } else if (perSt >= 3) {
      rule(ctx, x, ruler.base, x, ruler.base + 2, { colour: colours.ink, alpha: INK.rule })
    }
  }
}

/** A mark standing on the ruler: a line from the foot up to its level. */
function mark(
  frame: DisplayFrame,
  ruler: Ruler,
  st: number,
  level: number,
  colour: string,
  width: number,
  alpha = 1,
): void {
  const x = xOfSt(st, ruler)
  trace(
    frame.ctx,
    [
      [x, ruler.base],
      [x, yOfLevel(level, ruler)],
    ],
    { colour, width, alpha },
  )
}

// --- Pitch Shifter ----------------------------------------------------------

const SHIFT_RANGE = 24
/** How far Jitter scatters the pitch of a piece, in cents at full Jitter, by mode (`ShiftVoice.h`). */
const SHIFT_SCATTER_CENTS = [
  // Smooth: kSmoothCents.
  20,
  // Grain: kGrainCents.
  40,
  // Vintage: a pass is stretched by up to kSweepStretch, 3 %.
  1200 * Math.log2(1.03),
  // Chords has no pieces to scatter.
  0,
]
/** A repeat quieter than this is not drawn. */
const REPEAT_FLOOR = 0.04
/** How many times round the loop the picture follows: a semitone a pass crosses the ruler in so many. */
const REPEAT_PASSES = 24

/** Where the two voices stand: `pitch_shifter.h` pushes A sharp and B flat by Detune. */
function shiftVoices(view: DisplayView): { a: number; b: number; levelB: number } {
  const detune = view.value('detune') * 0.01
  return {
    a: view.value('pitchA') + detune,
    b: view.value('pitchB') - detune,
    levelB: view.value('levelB'),
  }
}

function shiftHandles(view: DisplayView): DisplayHandle[] {
  const ruler = semitoneRuler(view, -SHIFT_RANGE, SHIFT_RANGE)
  const { a, b, levelB } = shiftVoices(view)
  const detune = view.value('detune') * 0.01
  const perSt = ruler.w / (2 * SHIFT_RANGE)
  // An interval is dragged in whole semitones; one that was set finer stays
  // as it is until the drag has moved it half a semitone.
  const pitch = (x: number, at: number, lean: number, now: number): number =>
    Math.abs(x - xOfSt(at, ruler)) < perSt / 2
      ? now
      : clamp(Math.round(stOfX(x, ruler) - lean), -SHIFT_RANGE, SHIFT_RANGE)
  return [
    {
      key: 'b',
      name: 'Voice B',
      x: xOfSt(b, ruler),
      y: yOfLevel(levelB, ruler),
      drag: (x, y) => ({
        pitchB: pitch(x, b, -detune, view.value('pitchB')),
        levelB:
          Math.abs(y - yOfLevel(levelB, ruler)) < 0.5
            ? levelB
            : clamp((ruler.base - y) / (ruler.base - ruler.top), 0, 1),
      }),
      reset: () => ({
        pitchB: view.spec('pitchB')?.default ?? -12,
        levelB: view.spec('levelB')?.default ?? 0,
      }),
    },
    {
      key: 'a',
      name: 'Voice A',
      x: xOfSt(a, ruler),
      y: ruler.top,
      drag: (x) => ({ pitchA: pitch(x, a, detune, view.value('pitchA')) }),
      reset: () => ({ pitchA: view.spec('pitchA')?.default ?? 12 }),
    },
  ]
}

interface ShiftLabel {
  key: string
  words: string
  spot: Box
}

/**
 * Where the two voices are named. The words go beside the handle on the side
 * away from 0; where that is off the display or on the other voice's mark,
 * the place that covers least of the marks: under the handle, over it, or on
 * the side towards 0.
 */
function shiftLabels(view: DisplayView, ruler: Ruler, points: DisplayHandle[]): ShiftLabel[] {
  const { a, b, levelB } = shiftVoices(view)
  const zeroX = xOfSt(0, ruler)
  // What is not written over: the handles, the marks under them, the input's mark.
  const taken: Box[] = [{ x: zeroX - 2, y: ruler.top, w: 4, h: ruler.base - ruler.top }]
  for (const point of points) {
    taken.push({ x: point.x - 5, y: point.y - 5, w: 10, h: 10 })
    taken.push({ x: point.x - 2, y: point.y + 5, w: 4, h: Math.max(0, ruler.base - point.y - 5) })
  }
  const covered = (spot: Box): number => {
    let area = 0
    for (const other of taken) {
      const w = Math.min(spot.x + spot.w, other.x + other.w) - Math.max(spot.x, other.x)
      const h = Math.min(spot.y + spot.h, other.y + other.h) - Math.max(spot.y, other.y)
      if (w > 0 && h > 0) area += w * h
    }
    return area
  }
  const labels: ShiftLabel[] = []
  // A first: it is the voice that is always there.
  for (const point of [...points].reverse()) {
    const isA = point.key === 'a'
    const st = isA ? a : b
    const words =
      isA || levelB > 0 ? `${isA ? 'A' : 'B'} ${signed(st, Number.isInteger(st) ? 0 : 2)}` : 'B'
    const wide = words.length * 5
    const high = 9
    const out = (st === 0 ? isA : st > 0) ? 1 : -1
    const beside = (side: number): number => (side > 0 ? point.x + 7 : point.x - 7 - wide)
    const within = clamp(point.x - wide / 2, 2, view.width - 2 - wide)
    const level = Math.min(point.y - 4, ruler.base - high)
    const under = Math.min(point.y + 4, ruler.base - high)
    const over = point.y - 14
    // In the order they are liked.
    const places: [number, number][] = [
      [beside(out), level],
      [beside(-out), under],
      [beside(out), under],
      [within, over],
      [beside(-out), level],
      [beside(-out), over],
      [beside(out), over],
      [clamp(point.x + 5, 2, view.width - 2 - wide), under],
      [clamp(point.x - 5 - wide, 2, view.width - 2 - wide), under],
    ]
    let best: Box | null = null
    let least = Infinity
    places.forEach(([x, y], liked) => {
      if (x < 1 || x + wide > view.width - 1 || y < 0) return
      const spot: Box = { x, y, w: wide, h: high }
      const cost = covered(spot) * 10 + liked
      if (cost < least) {
        least = cost
        best = spot
      }
    })
    const spot: Box = best ?? { x: within, y: Math.max(0, level), w: wide, h: high }
    taken.push(spot)
    labels.push({ key: point.key, words, spot })
  }
  return labels
}

const pitchShifter = plateDisplay({
  place: 'strip',
  params: ['pitchA', 'pitchB', 'levelB', 'detune', 'feedback', 'mode', 'jitter'],
  info: 'A ruler in semitones with the octaves numbered. The sound going in stands at 0, voice A and voice B at their intervals, B as tall as its level. The thin marks are what Feedback adds: every repeat shifted again. Drag A or B along the ruler, and B up or down for its level.',
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const ruler = semitoneRuler(frame, -SHIFT_RANGE, SHIFT_RANGE)
    drawRuler(frame, ruler)
    const { a, b, levelB } = shiftVoices(frame)
    const perSt = ruler.w / (2 * SHIFT_RANGE)

    // What went in: the mark every interval is measured from.
    mark(frame, ruler, 0, 1, colours.ink, 2, INK.back)

    // Feedback sends A + B round again, so pass n holds every sum of n
    // intervals. `pitch_shifter.h` feeds the pair back at the level of one:
    // Feedback / (1 + Voice B) a pass. The Tone filter takes more off each.
    const loop = frame.value('feedback') / (1 + levelB)
    clipped(ctx, { x: ruler.x - 6, y: 0, w: ruler.w + 12, h: frame.height }, () => {
      // A pass is followed while all of it together is over the floor.
      let pass = loop
      for (
        let n = 2;
        n <= REPEAT_PASSES && pass * (1 + levelB) ** n >= REPEAT_FLOOR;
        n++, pass *= loop
      ) {
        let ways = 1
        for (let ofB = 0; ofB <= n; ofB++) {
          const level = ways * Math.pow(levelB, ofB) * pass
          const st = (n - ofB) * a + ofB * b
          if (level >= REPEAT_FLOOR && Math.abs(st) <= SHIFT_RANGE + 0.5)
            mark(frame, ruler, st, level, colours.accent, 1, 0.75)
          ways = (ways * (n - ofB)) / (ofB + 1)
          if (levelB <= 0) break
        }
      }
    })

    // Jitter scatters the pitch of every piece about the voice: a band as wide as it reaches.
    const jitter = frame.value('jitter')
    const scatter =
      ((SHIFT_SCATTER_CENTS[Math.round(frame.value('mode'))] ?? 0) * jitter * jitter) / 100
    const voices: [number, number][] = [
      [b, levelB],
      [a, 1],
    ]
    for (const [st, level] of voices) {
      if (level <= 0) continue
      if (scatter * perSt >= 0.5) {
        const top = yOfLevel(level, ruler)
        fillRect(
          ctx,
          {
            x: xOfSt(st - scatter, ruler),
            y: top,
            w: 2 * scatter * perSt,
            h: ruler.base - top,
          },
          colours.accent,
          0.3,
        )
      }
      mark(frame, ruler, st, level, colours.accent, 2.5)
    }

    // Which voice it is and where it stands, Detune included.
    const points = shiftHandles(frame)
    const labels = shiftLabels(frame, ruler, points)

    // From the sound that went in across to each voice, at the voice's
    // height: the interval. The line stops where a label is written on it.
    const zeroX = xOfSt(0, ruler)
    for (const [st, level] of voices) {
      if (level <= 0) continue
      const y = yOfLevel(level, ruler)
      const to = xOfSt(st, ruler)
      const end = Math.max(zeroX, to)
      let x = Math.min(zeroX, to)
      const across = labels
        .map((label) => label.spot)
        .filter((spot) => spot.y - 1 < y && spot.y + spot.h + 1 > y)
        .sort((one, other) => one.x - other.x)
      for (const spot of across) {
        if (spot.x - 2 > x) {
          rule(ctx, x, y, Math.min(end, spot.x - 2), y, { colour: colours.accent, alpha: 0.5 })
        }
        x = Math.max(x, spot.x + spot.w + 2)
      }
      if (x < end) rule(ctx, x, y, end, y, { colour: colours.accent, alpha: 0.5 })
    }

    for (const point of points) handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    for (const { key, words, spot } of labels) {
      text(frame, words, spot.x, spot.y + 7, { alpha: frame.hot === key ? 1 : INK.text })
    }
  },
  handles: shiftHandles,
})

// --- Octaves ----------------------------------------------------------------

/** The five levels of Octaves, low to high: the dry sound stands between its voices. */
const OCTAVE_VOICES = [
  { param: 'sub2', octave: -2, name: 'Two down' },
  { param: 'sub1', octave: -1, name: 'One down' },
  { param: 'dry', octave: 0, name: 'Dry' },
  { param: 'up1', octave: 1, name: 'One up' },
  { param: 'up2', octave: 2, name: 'Two up' },
] as const
/** The display spans this many octaves either side of the note played. */
const OCTAVES_EITHER_SIDE = 3
/** The top of the scale of levels: a little over 1, so a filter's peak has room. */
const OCTAVE_LEVEL_TOP = 1.2
/** The note the picture is drawn for until one has been heard. */
const OCTAVE_REST_HZ = 220
const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

interface OctaveLayout {
  box: Box
  /** Where level 0 stands. */
  base: number
  /** Pixels per octave, and where the note played stands. */
  perOctave: number
  centre: number
}

function octaveLayout(view: Size): OctaveLayout {
  const box: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  return {
    box,
    base: box.y + box.h - 14,
    perOctave: box.w / (2 * OCTAVES_EITHER_SIDE),
    centre: box.x + box.w / 2,
  }
}

const yOfOctaveLevel = (level: number, layout: OctaveLayout): number =>
  layout.base -
  (clamp(level, 0, OCTAVE_LEVEL_TOP) / OCTAVE_LEVEL_TOP) * (layout.base - layout.box.y - 3)

function octaveHandles(view: DisplayView): DisplayHandle[] {
  const layout = octaveLayout(view)
  const span = layout.base - layout.box.y - 3
  return OCTAVE_VOICES.map(({ param, octave, name }): DisplayHandle => ({
    key: param,
    name,
    x: layout.centre + octave * layout.perOctave,
    y: yOfOctaveLevel(view.value(param), layout),
    drag: (_x, y) => ({
      [param]: clamp(((layout.base - y) / span) * OCTAVE_LEVEL_TOP, 0, 1),
    }),
    reset: () => ({ [param]: view.spec(param)?.default ?? 0 }),
  }))
}

/**
 * How much of a voice there is for a partial at `hz`, as `OctaveBank::init`
 * sets it per channel: the low voices leave out what would land under about
 * 30 Hz, the high ones what would pass the bank's own Nyquist frequency.
 */
function octaveReach(octave: number, hz: number, bankRate: number): number {
  const fadeIn = (from: number, to: number): number => {
    const t = clamp((hz - from) / (to - from), 0, 1)
    return t * t * (3 - 2 * t)
  }
  if (octave === -2) return fadeIn(110, 154)
  if (octave === -1) return fadeIn(55, 77)
  if (octave === 1) return 1 - fadeIn(0.21 * bankRate * 0.8, 0.21 * bankRate)
  if (octave === 2) return 1 - fadeIn(0.105 * bankRate * 0.8, 0.105 * bankRate)
  return 1
}

/** A frequency as a note: "A2", "F♯4". */
function noteName(hz: number): string {
  const midi = Math.round(69 + 12 * Math.log2(hz / 440))
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`
}

interface OctaveState {
  /** The loudest partial the device heard last, Hz; 0 until there has been one. */
  note: number
  curve: Spot[]
}

const octaves = plateDisplay<OctaveState>({
  place: 'window',
  columns: 2,
  params: ['sub2', 'sub1', 'dry', 'up1', 'up2', 'filter', 'resonance'],
  live: { meters: true, spectrum: true },
  info: 'Five bars: your own sound in the middle and its octaves two down to two up, each as tall as its level. Drag a bar to set it. Behind them is the spectrum of what comes out, with the note played kept in the middle, so a voice shows as energy under its bar. The line is the filter on the voices.',
  init: () => ({ note: 0, curve: [] }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const layout = octaveLayout(frame)
    const { box, base, perOctave, centre } = layout
    const running = frame.powered && frame.signal !== null
    const reading = running ? frame.meter('note') : 0
    const heard = Number.isFinite(reading) && reading > 20
    if (heard) {
      // The reading steps from channel to channel; the picture follows it over a moment.
      state.note =
        state.note > 0 && frame.dt > 0
          ? Math.exp(follow(Math.log(state.note), Math.log(reading), frame.dt, 0.05, 0.05))
          : reading
    }
    const note = state.note > 0 ? state.note : OCTAVE_REST_HZ
    const plot: Box = { x: box.x, y: box.y, w: box.w, h: base - box.y }

    // What comes out, with the note played in the middle: an octave is one bar's step.
    if (running && state.note > 0) {
      clipped(ctx, plot, () =>
        spectrum(frame, plot, {
          minHz: note / 2 ** OCTAVES_EITHER_SIDE,
          maxHz: note * 2 ** OCTAVES_EITHER_SIDE,
          bottomDb: -84,
          alpha: 0.4,
        }),
      )
    }
    rule(ctx, box.x, base, box.x + box.w, base, { colour: colours.ink, alpha: INK.rule })

    // The low pass on the voices (`octaves.h`): Resonance takes Q from √½ to 9.
    const cut = frame.value('filter')
    const q = Math.SQRT1_2 * Math.pow(9 / Math.SQRT1_2, frame.value('resonance'))
    const passes = (hz: number): number => svfLowGain(hz, cut, q, frame.sampleRate)
    const count = Math.max(2, Math.floor(box.w / 2) + 1)
    state.curve = sized(state.curve, count)
    for (let i = 0; i < count; i++) {
      const x = box.x + (i / (count - 1)) * box.w
      state.curve[i][0] = x
      state.curve[i][1] = yOfOctaveLevel(passes(note * 2 ** ((x - centre) / perOctave)), layout)
    }
    trace(ctx, state.curve, { colour: colours.ink, width: 1, alpha: INK.back })

    const bankRate =
      frame.sampleRate / (frame.sampleRate >= 60000 ? 4 : frame.sampleRate >= 30000 ? 2 : 1)
    const wide = Math.max(4, Math.min(11, Math.round(perOctave * 0.5)))
    for (const { param, octave } of OCTAVE_VOICES) {
      const x = Math.round(centre + octave * perOctave - wide / 2)
      const level = frame.value(param)
      const top = yOfOctaveLevel(level, layout)
      // What is set, in the ink; and in the second ink what the note played
      // gets of it now, after the filter and the ends of the voice's range.
      fillRect(ctx, { x, y: top, w: wide, h: base - top }, colours.ink, INK.fill * 1.5)
      if (heard) {
        const hz = note * 2 ** octave
        const gets = octave === 0 ? level : level * octaveReach(octave, note, bankRate) * passes(hz)
        const now = yOfOctaveLevel(gets, layout)
        fillRect(ctx, { x, y: now, w: wide, h: base - now }, colours.accent, 0.9)
      }
      rule(ctx, x, top, x + wide, top, { colour: colours.ink, width: 1.5 })
      const words = octave === 0 ? (state.note > 0 ? noteName(note) : '0') : signed(octave)
      text(frame, words, centre + octave * perOctave, frame.height - 5, {
        align: 'center',
        alpha: octave === 0 ? INK.text : INK.back,
      })
    }

    const handles = octaveHandles(frame)
    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    const hot = handles.find((point) => point.key === frame.hot)
    if (hot) {
      text(frame, `${hot.name}  ${Math.round(frame.value(hot.key) * 100)}%`, box.x + 2, box.y + 8)
    }
  },
  handles: octaveHandles,
})

// --- Half Speed -------------------------------------------------------------

/** The four speeds, as `half_speed.h` has them (`kSpeeds`). */
const HALF_SPEEDS = [0.75, 2 / 3, 0.5, 0.25]
/** `kMinFadeSeconds`: no splice is shorter than this. */
const HALF_MIN_FADE_SEC = 0.004
/** Columns of held sound in one cycle. */
const HELD = 96
/** The levels the held sound is drawn between. */
const HELD_FLOOR_DB = -54
/** Where the cycle stands in the still picture: three quarters through. */
const HALF_REST_PHASE = 0.75

interface HalfLayout {
  box: Box
  middle: number
  half: number
  /** The width of one cycle, and where this cycle starts: the last one lies at its left. */
  cycle: number
  start: number
}

function halfLayout(view: Size): HalfLayout {
  const box: Box = { x: 5, y: 5, w: view.width - 10, h: view.height - 10 }
  return {
    box,
    middle: box.y + box.h / 2,
    half: box.h / 2 - 1,
    cycle: box.w / 2,
    start: box.x + box.w / 2,
  }
}

const halfSpeedOf = (view: DisplayView): number =>
  HALF_SPEEDS[clamp(Math.round(view.value('speed')), 0, 3)]

/** The fade of the chop layout as `HalfSpeed::weigh` has it: a raised cosine over the first `fade` of the cycle. */
const chopIn = (phase: number, fade: number): number =>
  phase < fade ? 0.5 - 0.5 * Math.cos((Math.PI * phase) / fade) : 1
const hann = (phase: number): number => 0.5 - 0.5 * Math.cos(2 * Math.PI * phase)

/**
 * The gains of the three heads at a place in the cycle, ported from
 * `HalfSpeed::weigh`: the cycle's own head, the last cycle's and the one
 * started mid-cycle. They sum to one.
 */
function headGains(phase: number, fade: number, smooth: number): [number, number, number] {
  const chop = chopIn(phase, fade)
  const window = hann(phase)
  return [(1 - smooth) * chop + smooth * window, (1 - smooth) * (1 - chop), smooth * (1 - window)]
}

/**
 * How much of the sound at a place in a cycle (0..1 of its length) is played
 * in the end: the gain of each head as it passes that place, summed. A head
 * moves through the sound at `speed`, so it is at place `c` when the cycle
 * clock is at `c / speed`; what no head reaches is skipped.
 */
function heardGain(c: number, speed: number, fade: number, smooth: number): number {
  let gain = 0
  // Heads of this cycle, and of the one before reading on into it.
  for (let before = 0; before <= 1; before++) {
    const p = c + before
    if (p < speed) {
      gain += headGains(p / speed, fade, smooth)[0]
    } else if (p < speed * (1 + fade)) {
      // The same head a cycle later, fading out as the last cycle's.
      gain += headGains((p - speed) / speed, fade, smooth)[1]
    }
    if (p >= 0.5 && p < 0.5 + speed) gain += headGains(0.5 + (p - 0.5) / speed, fade, smooth)[2]
  }
  return gain
}

interface HalfState {
  /** The level of the sound held in this cycle and in the last, a column at a time; −1 where nothing is held yet. */
  held: Float32Array
  last: Float32Array
  column: number
  phase: PhaseTrack | null
  wasAt: number
  /** The cycle clock's last reading and when it last moved, to tell a device that plays from one at rest. */
  reading: number | null
  movedAt: number
  live: boolean
  /** How long this cycle and the last one are, seconds. */
  cycleSec: number
  lastSec: number
  upper: Spot[]
  lower: Spot[]
  fades: Spot[]
}

function halfFadeOf(view: DisplayView): number {
  // Never a shorter splice than 4 ms, however short the cycle.
  const shortest = HALF_MIN_FADE_SEC / (view.value('length') / 1000)
  const fade = view.value('fade')
  return fade < shortest ? Math.min(shortest, 0.5) : fade
}

function halfHandles(view: DisplayView): DisplayHandle[] {
  const layout = halfLayout(view)
  const speed = halfSpeedOf(view)
  const fade = view.value('fade')
  const x = layout.start + speed * fade * layout.cycle
  return [
    {
      key: 'fade',
      name: 'Fade',
      x,
      y: layout.middle - layout.half,
      // Where the cycle's head has faded in: further along is a longer fade.
      drag: (to) => ({
        fade:
          Math.abs(to - x) < 0.25
            ? fade
            : clamp((to - layout.start) / (speed * layout.cycle), 0.01, 0.5),
      }),
      reset: () => ({ fade: view.spec('fade')?.default ?? 0.15 }),
    },
  ]
}

const halfSpeed = plateDisplay<HalfState>({
  place: 'strip',
  params: ['power', 'length', 'speed', 'fade', 'smooth'],
  live: { meters: true, signal: true },
  info: 'Two cycles of the sound as it is held: the last one at the left, this one at the right. The upright line writes it at full speed; the marks in the second colour read it at the slower speed, each as tall as its share. The darker shape is what gets played. Drag its corner for the fade.',
  init: () => ({
    held: new Float32Array(HELD).fill(-1),
    last: new Float32Array(HELD).fill(-1),
    column: 0,
    phase: null,
    wasAt: 0,
    reading: null,
    movedAt: -Infinity,
    live: false,
    cycleSec: 1,
    lastSec: 1,
    upper: spots(2 * HELD),
    lower: spots(2 * HELD),
    fades: spots(2 * HELD),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const layout = halfLayout(frame)
    const { box, middle, half, cycle, start } = layout
    const speed = halfSpeedOf(frame)
    const fade = halfFadeOf(frame)
    const smooth = frame.value('smooth')
    const lengthSec = frame.value('length') / 1000
    // The device's own Power: off, the sound passes as it came and no head reads.
    const engaged = Math.round(frame.value('power')) === 0
    const signal = frame.powered && engaged ? frame.signal : null
    // The cycle clock turns only while the device plays. A reading that has
    // stopped moving is a device at rest, and the picture is the still one.
    const reading = clamp(frame.meter('phase'), 0, 1)
    if (state.reading === null) {
      state.reading = reading
    } else if (reading !== state.reading) {
      state.reading = reading
      state.movedAt = frame.now
    }
    const live = signal !== null && frame.hasMeter('phase') && frame.now - state.movedAt < 0.3

    // Where the cycle clock is, and the sound written since the frame before.
    let phase = HALF_REST_PHASE
    if (live && signal) {
      if (!state.live) {
        state.held.fill(-1)
        state.last.fill(-1)
        state.phase = null
        state.column = 0
        state.wasAt = 0
      }
      const cycleSec = frame.meter('cycle') > 0.001 ? frame.meter('cycle') : lengthSec
      if (frame.dt > 0) state.phase = trackPhase(state.phase, reading, 1 / cycleSec, frame.dt)
      phase = state.phase ? state.phase.phase : reading
      if (phase < state.wasAt - 0.5) {
        // A new cycle: what was held becomes the last cycle.
        const spare = state.last
        state.last = state.held
        state.held = spare.fill(-1)
        state.lastSec = state.cycleSec
        state.column = 0
      }
      state.wasAt = phase
      state.cycleSec = cycleSec
      // The level of what went in, for every column the write head has passed:
      // read from the wave where it reaches back that far.
      const level = signal.input ?? signal.output
      const wave = level.wave
      const to = Math.min(HELD, Math.floor(phase * HELD) + 1)
      const perColumn = (cycleSec / HELD) * frame.sampleRate
      for (let column = Math.min(state.column, to - 1); column < to; column++) {
        const ago = (phase * HELD - column - 1) * perColumn
        const first = Math.floor(wave.length - ago - perColumn)
        let peak = first < 0 ? level.peak : 0
        for (let i = Math.max(0, first); i < Math.min(wave.length, first + perColumn + 1); i++) {
          const size = wave[i] < 0 ? -wave[i] : wave[i]
          if (size > peak) peak = size
        }
        const height = clamp(1 - gainToDb(peak) / HELD_FLOOR_DB, 0, 1)
        state.held[column] = column < state.column ? Math.max(state.held[column], height) : height
      }
      state.column = to
    }
    state.live = live
    const cycleSec = live ? state.cycleSec : lengthSec
    const lastSec = live ? state.lastSec : lengthSec
    const xOf = (c: number): number => start + c * cycle

    // The two cycles, and where one ends and the next begins.
    rule(ctx, box.x, middle, box.x + box.w, middle, { colour: colours.ink, alpha: INK.grid })
    rule(ctx, start, box.y - 1, start, box.y + box.h + 1, {
      colour: colours.ink,
      alpha: INK.rule,
      dash: [2, 2],
    })

    // The sound as it is held, faint, and darker what the heads play of it.
    // At rest there is no sound to hold: the shape of what would be played.
    const { upper, lower } = state
    const shape = (heard: boolean): number => {
      let n = 0
      for (let k = 0; k < 2 * HELD; k++) {
        const column = k % HELD
        const c = (column + 0.5) / HELD
        const sound = live ? (k < HELD ? state.last : state.held)[column] : heard ? 1 : -1
        if (sound < 0) continue
        const size = half * sound * (heard ? Math.min(1, heardGain(c, speed, fade, smooth)) : 1)
        upper[n][0] = lower[n][0] = xOf(c + (k < HELD ? -1 : 0))
        upper[n][1] = middle - size
        lower[n][1] = middle + size
        n++
      }
      return n
    }
    const fillShape = (count: number, alpha: number): void => {
      if (count < 2) return
      ctx.beginPath()
      ctx.moveTo(upper[0][0], upper[0][1])
      for (let i = 1; i < count; i++) ctx.lineTo(upper[i][0], upper[i][1])
      for (let i = count - 1; i >= 0; i--) ctx.lineTo(lower[i][0], lower[i][1])
      ctx.closePath()
      ctx.globalAlpha = alpha
      ctx.fillStyle = colours.ink
      ctx.fill()
      ctx.globalAlpha = 1
    }
    const drawHandles = (): void => {
      for (const point of halfHandles(frame)) {
        handle(frame, point.x, point.y, { hot: frame.hot === point.key, radius: 3 })
      }
    }
    if (!engaged) {
      // Nothing is held back: the two cycles stand empty, the fade still to be set.
      text(frame, 'Off', box.x + 2, box.y + 8, { alpha: INK.back })
      drawHandles()
      return
    }
    clipped(ctx, { x: box.x, y: box.y - 1, w: box.w, h: box.h + 2 }, () => {
      if (live) fillShape(shape(false), INK.fill)
      fillShape(shape(true), live ? INK.back : INK.fill * 1.5)
      // The fades themselves, over both cycles: how much of each place is played.
      for (let k = 0; k < 2 * HELD; k++) {
        const c = ((k % HELD) + 0.5) / HELD
        state.fades[k][0] = xOf(c + (k < HELD ? -1 : 0))
        state.fades[k][1] = middle - half * Math.min(1, heardGain(c, speed, fade, smooth))
      }
      trace(ctx, state.fades, { colour: colours.ink, width: 1, alpha: INK.back })
    })

    // The heads. One writes at the speed of the sound; three read behind it,
    // falling back by (1 − Speed) of a second every second.
    const behind = (name: string, sinceStart: number): number =>
      live ? Math.max(0, frame.meter(name)) : (1 - speed) * sinceStart * cycleSec
    const place = (seconds: number): number => {
      // Seconds behind the present, as a place in this cycle or in the last.
      const at = phase * cycleSec - seconds
      return at >= 0 ? at / cycleSec : at / lastSec
    }
    const gains = headGains(phase, fade, smooth)
    const heads: [number, number][] = [
      [place(behind('prev', 1 + phase)), gains[1]],
      [place(behind('mid', phase >= 0.5 ? phase - 0.5 : phase + 0.5)), gains[2]],
      [place(behind('cur', phase)), gains[0]],
    ]
    clipped(ctx, { x: box.x - 1, y: box.y - 2, w: box.w + 2, h: box.h + 4 }, () => {
      const writeX = xOf(phase)
      rule(ctx, writeX, box.y - 1, writeX, box.y + box.h + 1, { colour: colours.ink, width: 1.5 })
      for (const [c, gain] of heads) {
        if (gain < 0.02) continue
        const x = xOf(c)
        trace(
          ctx,
          [
            [x, middle - half * gain],
            [x, middle + half * gain],
          ],
          { colour: colours.accent, width: 2.5 },
        )
      }
    })
    drawHandles()
  },
  handles: halfHandles,
})

// --- Frequency Shifter ------------------------------------------------------

/** The scale runs from 0 to this, in equal hertz: a shift is the same step everywhere on it. */
const SHIFT_AXIS_HZ = 3000
/** The tone the picture is drawn for: six partials of 300 Hz. */
const TONE_HZ = 300
const TONE_PARTIALS = 6
/** The partial the handle stands on: the fourth can go a full 1000 Hz either way and stay on the scale. */
const HANDLE_PARTIAL = 4
/** How many times round the loop the picture follows. */
const PASSES = 5
/** How high a partial of full level stands, as a share of the height. */
const PARTIAL_HEIGHT = 0.74
/** The direction per mode and side, as `freq_shifter.h` has it (`kDirection`): +1 up, −1 down, 0 both. */
const SHIFT_DIRECTION: readonly (readonly [number, number])[] = [
  [1, 1],
  [-1, -1],
  [1, -1],
  [0, 0],
]

interface HertzLayout {
  box: Box
  base: number
  /** The scale's own width; the dial stands at its right. */
  w: number
  dialX: number
  dialY: number
}

function hertzLayout(view: Size): HertzLayout {
  const box: Box = { x: 6, y: 5, w: view.width - 12, h: view.height - 10 }
  return {
    box,
    base: view.height - 13,
    w: box.w - 20,
    dialX: box.x + box.w - 7,
    dialY: view.height - 13 - 8,
  }
}

const xOfShiftHz = (hz: number, layout: HertzLayout): number =>
  layout.box.x + (clamp(hz, 0, SHIFT_AXIS_HZ) / SHIFT_AXIS_HZ) * layout.w
const yOfPartial = (gain: number, layout: HertzLayout): number =>
  layout.base - clamp(gain, 0, 1.25) * PARTIAL_HEIGHT * (layout.base - layout.box.y)

function hertzHandles(view: DisplayView): DisplayHandle[] {
  const layout = hertzLayout(view)
  const direction = SHIFT_DIRECTION[clamp(Math.round(view.value('mode')), 0, 3)][0] < 0 ? -1 : 1
  const shift = view.value('shift')
  const fine = view.value('fine')
  const partial = TONE_HZ * HANDLE_PARTIAL
  const x = xOfShiftHz(partial + direction * (shift + fine), layout)
  return [
    {
      key: 'shift',
      name: 'Shift',
      x,
      y: yOfPartial(1, layout),
      // A partial taken along the scale: where it is put, less where it was, is the shift.
      drag: (to) => ({
        shift:
          Math.abs(to - x) < 0.25
            ? shift
            : clamp(
                Math.round(
                  direction * (((to - layout.box.x) / layout.w) * SHIFT_AXIS_HZ - partial) - fine,
                ),
                -1000,
                1000,
              ),
      }),
      // The wheel is Fine: a tenth of a hertz a step.
      wheel: (steps) => ({ fine: clamp(Math.round((fine + steps * 0.1) * 10) / 10, -10, 10) }),
      reset: () => ({ shift: 0 }),
    },
  ]
}

interface HertzState {
  spectrum: Spot[]
  /** The level at each step away from a partial, this pass and the next. */
  walk: Float32Array
  next: Float32Array
}

const freqShifter = plateDisplay<HertzState>({
  place: 'strip',
  params: ['shift', 'fine', 'mode', 'feedback', 'tone', 'width'],
  live: { meters: true, spectrum: true },
  info: 'A scale in hertz, not in notes. The faint marks are six partials of one tone; the strong ones are where each is sent, all by the same step, so they stop being harmonics. Thin marks are what Feedback adds. The dial turns once for every beat against the dry sound. Drag a mark to set the shift.',
  init: () => ({
    spectrum: [],
    walk: new Float32Array(2 * PASSES + 3),
    next: new Float32Array(2 * PASSES + 3),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const layout = hertzLayout(frame)
    const { box, base } = layout
    const mode = clamp(Math.round(frame.value('mode')), 0, 3)
    const running = frame.powered && frame.signal !== null && frame.hasMeter('shift')
    const set = frame.value('shift') + frame.value('fine')
    // The shift as it is now: the LFO sways it, and the device reports where it is.
    const hz = running && Number.isFinite(frame.meter('shift')) ? frame.meter('shift') : set
    const feedback = frame.value('feedback')
    const tone = frame.value('tone')
    const plot: Box = { x: box.x, y: box.y, w: layout.w, h: base - box.y }

    // What comes out, on the same scale of equal hertz.
    const bins = frame.signal?.spectrum
    const binHz = frame.signal?.binHz ?? 0
    if (frame.powered && bins && binHz > 0) {
      const count = Math.max(2, Math.floor(plot.w / 2) + 1)
      state.spectrum = sized(state.spectrum, count)
      const perPoint = SHIFT_AXIS_HZ / (count - 1)
      let any = false
      for (let i = 0; i < count; i++) {
        // The loudest bin in the column, so a narrow partial is kept.
        const first = clamp(Math.round(((i - 0.5) * perPoint) / binHz), 1, bins.length - 1)
        const last = clamp(Math.round(((i + 0.5) * perPoint) / binHz), first, bins.length - 1)
        let db = -Infinity
        for (let bin = first; bin <= last; bin++) if (bins[bin] > db) db = bins[bin]
        if (!Number.isFinite(db)) db = -120
        if (db > -84) any = true
        state.spectrum[i][0] = plot.x + (i / (count - 1)) * plot.w
        state.spectrum[i][1] = clamp(yOfDb(db, plot, 0, -84), plot.y, base)
      }
      if (any) fillTo(ctx, state.spectrum, base, colours.ink, 0.4)
    }

    // The scale: a line every 1000 Hz.
    rule(ctx, box.x - 2, base, box.x + layout.w + 2, base, { colour: colours.ink, alpha: INK.rule })
    for (let k = 0; k <= SHIFT_AXIS_HZ; k += 500) {
      const x = xOfShiftHz(k, layout)
      if (k % 1000 === 0) {
        rule(ctx, x, box.y, x, base + 3, { colour: colours.ink, alpha: INK.grid })
        text(frame, k === 0 ? '0' : `${k / 1000}k`, x, frame.height - 3, {
          align: 'center',
          alpha: INK.back,
        })
      } else {
        rule(ctx, x, base, x, base + 2, { colour: colours.ink, alpha: INK.rule })
      }
    }

    // Where the partials were.
    for (let n = 1; n <= TONE_PARTIALS; n++) {
      const x = xOfShiftHz(TONE_HZ * n, layout)
      trace(
        ctx,
        [
          [x, base],
          [x, yOfPartial(1, layout)],
        ],
        { colour: colours.ink, width: 1.5, alpha: INK.back },
      )
    }

    // Where they are sent. `freq_shifter.h`: each pass moves a partial by the
    // shift, up, down, or both ways at half the power each (Ring); what goes
    // round again is Feedback of it through the Tone filter (Q 0.6), shifted
    // once more. A partial sent under 0 Hz comes back up from it.
    const sides: number[] = mode === 2 ? [1, -1] : [SHIFT_DIRECTION[mode][0]]
    const middle = PASSES + 1
    clipped(ctx, { x: box.x - 2, y: 0, w: layout.w + 4, h: frame.height }, () => {
      for (const side of sides) {
        for (let n = 1; n <= TONE_PARTIALS; n++) {
          const partial = TONE_HZ * n
          let { walk, next } = state
          walk.fill(0)
          walk[middle] = 1
          for (let pass = 1; pass <= PASSES; pass++) {
            next.fill(0)
            let loudest = 0
            for (let step = -pass + 1; step <= pass - 1; step++) {
              const level = walk[middle + step]
              if (level <= 0) continue
              const from = Math.abs(partial + step * hz)
              const through =
                pass === 1
                  ? level
                  : level * feedback * svfLowGain(from, tone, 0.6, frame.sampleRate)
              if (side === 0) {
                next[middle + step + 1] += through * Math.SQRT1_2
                next[middle + step - 1] += through * Math.SQRT1_2
              } else {
                next[middle + step + side] += through
              }
              loudest = Math.max(loudest, through)
            }
            if (loudest < 0.05) break
            for (let step = -pass; step <= pass; step++) {
              const level = next[middle + step]
              if (level < 0.05) continue
              const x = xOfShiftHz(Math.abs(partial + step * hz), layout)
              trace(
                ctx,
                [
                  [x, base],
                  [x, yOfPartial(level, layout)],
                ],
                {
                  colour: colours.accent,
                  width: pass === 1 ? 2.5 : 1,
                  alpha: pass === 1 ? 1 : 0.75,
                },
              )
            }
            const spare = walk
            walk = next
            next = spare
          }
        }
      }
    })

    // The shift in hertz, and the carrier as a dial: it turns once for every
    // beat of the shifted sound against the dry. The mark is drawn as long as
    // the way it went in one frame, so a fast shift is a ring. The smaller
    // mark is the right side, which Width turns out of step.
    const words = `${signed(hz, Math.abs(hz) < 10 ? (Math.abs(hz) < 1 ? 2 : 1) : 0)} Hz`
    text(frame, words, box.x + box.w, box.y + 7, { align: 'right' })
    const radius = 5.5
    ctx.beginPath()
    ctx.arc(layout.dialX, layout.dialY, radius, 0, Math.PI * 2)
    ctx.globalAlpha = INK.rule
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.globalAlpha = 1
    const carrier = running && Number.isFinite(frame.meter('carrier')) ? frame.meter('carrier') : 0
    const sweep = Math.min(1, Math.abs(hz) / 30)
    const offset = frame.value('width') * 0.25
    for (const channel of [1, 0] as const) {
      const turns = SHIFT_DIRECTION[mode][channel]
      for (const way of turns === 0 ? [1, -1] : [turns]) {
        const at = (way * (carrier + channel * offset) - 0.25) * Math.PI * 2
        const tail = at - way * Math.sign(hz || 1) * sweep * Math.PI * 2
        ctx.beginPath()
        ctx.arc(layout.dialX, layout.dialY, radius, Math.min(at, tail), Math.max(at, tail))
        ctx.globalAlpha = channel === 0 ? 1 : 0.6
        ctx.strokeStyle = colours.accent
        ctx.lineWidth = channel === 0 ? 3 : 2
        ctx.lineCap = 'round'
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }

    for (const point of hertzHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key, radius: 3 })
    }
  },
  handles: hertzHandles,
})

// --- Lattice ----------------------------------------------------------------

/** The scales of Lattice in semitones, as `Scale.h` has them; the one after the last is Custom. */
const LATTICE_SCALES: readonly (readonly number[])[] = [
  [0, 2, 4, 5, 7, 9, 11],
  [0, 2, 3, 5, 7, 8, 10],
  [0, 2, 3, 5, 7, 8, 11],
  [0, 2, 3, 5, 7, 9, 11],
  [0, 2, 3, 5, 7, 9, 10],
  [0, 1, 3, 5, 7, 8, 10],
  [0, 2, 4, 6, 7, 9, 11],
  [0, 2, 4, 5, 7, 9, 10],
  [0, 1, 3, 5, 6, 8, 10],
  [0, 2, 4, 7, 9],
  [0, 3, 5, 7, 10],
  [0, 3, 5, 6, 7, 10],
  [0, 2, 4, 6, 8, 10],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
]
const LATTICE_CUSTOM = 14
const LATTICE_VOICES = [1, 2, 3, 4] as const
/** The roles of a voice, in the order of the Role choice (`Voicing.h`). */
const ROLE_OFF = 0
/** The lattice covers the notes from 24 semitones above the lowest root: every Center Note is on it. */
const LATTICE_FOOT_CENTS = 2400
const LATTICE_SPAN_CENTS = 7200
/** A repeat quieter than this is not drawn. */
const ECHO_FLOOR = 0.1

/** A scale as `Scale.h` keeps it: the steps of one period in cents, sorted, and the period. */
interface LatticeScale {
  degrees: number[]
  period: number
  /** The root's pitch class in cents (C is 0). */
  root: number
}

function latticeScale(view: DisplayView): LatticeScale {
  const root = clamp(Math.round(view.value('root')), 0, 11) * 100
  const choice = Math.round(view.value('scale'))
  if (choice !== LATTICE_CUSTOM) {
    const steps = LATTICE_SCALES[choice] ?? LATTICE_SCALES[0]
    return { degrees: steps.map((step) => step * 100), period: 1200, root }
  }
  // `Scale::fromCustom`: the steps that are on, wrapped into the period and sorted.
  const period = Math.max(100, view.value('customPeriod'))
  const degrees: number[] = []
  for (let i = 1; i <= 12; i++) {
    if (view.value(`customOn${i}`) > 0.5) degrees.push(view.value(`customCents${i}`) % period)
  }
  if (degrees.length === 0) degrees.push(0)
  degrees.sort((a, b) => a - b)
  return { degrees, period, root }
}

/** `ScaleMap::degreeToCents`: the pitch of step `n`, counted from the root at 0 cents. */
function degreeCents(scale: LatticeScale, n: number): number {
  const count = scale.degrees.length
  const period = Math.floor(n / count)
  return scale.root + period * scale.period + scale.degrees[n - period * count]
}

/** `ScaleMap::nearestDegree`: the step a pitch is nearest to, the first on a tie. */
function nearestDegree(scale: LatticeScale, cents: number): number {
  const count = scale.degrees.length
  const rel = cents - scale.root
  const period = Math.floor(rel / scale.period)
  const within = rel - period * scale.period
  let best = period * count
  let nearest = Math.abs(within - scale.degrees[0])
  for (let k = 1; k < count; k++) {
    const distance = Math.abs(within - scale.degrees[k])
    if (distance < nearest) {
      nearest = distance
      best = period * count + k
    }
  }
  const next = Math.abs(within - (scale.degrees[0] + scale.period))
  if (next < nearest) {
    nearest = next
    best = (period + 1) * count
  }
  const previous = Math.abs(within - (scale.degrees[count - 1] - scale.period))
  if (previous < nearest) best = period * count - 1
  return best
}

/** `targetDegree` of `Voicing.h`: the step a voice goes to for a played step, or null when it is off. */
function voiceDegree(
  role: number,
  played: number,
  centre: number,
  perPeriod: number,
  offset: number,
): number | null {
  const middle = Math.floor((played + centre) / 2)
  switch (role) {
    case 1:
      return played + offset
    case 2:
      return centre - (played - centre) + offset
    case 3:
      return middle + offset
    case 4:
      return centre - (middle - centre) + offset
    case 5:
      return played > centre
        ? played - perPeriod + offset
        : played < centre
          ? played + perPeriod + offset
          : played + offset
    case 6:
      return centre + offset
    default:
      return null
  }
}

interface LatticeLayout {
  box: Box
  /** The first period drawn and how many there are, the lowest at the foot. */
  first: number
  rows: number
  rowHeight: number
  /** Where a period starts and how wide it is. */
  x: number
  w: number
}

function latticeLayout(view: Size, scale: LatticeScale): LatticeLayout {
  // The lattice itself; the names of the notes stand under it.
  const box: Box = { x: 5, y: 4, w: view.width - 10, h: view.height - 17 }
  const first = Math.floor(LATTICE_FOOT_CENTS / scale.period)
  // Enough periods to hold the highest Center Note, whatever the period.
  let rows = Math.ceil(LATTICE_SPAN_CENTS / scale.period)
  if ((first + rows) * scale.period < 8500) rows += 1
  return { box, first, rows, rowHeight: box.h / rows, x: box.x + 6, w: box.w - 8 }
}

/** Where a pitch stands: across by its place in the period, up by the period it is in. */
function latticePlace(
  cents: number,
  scale: LatticeScale,
  layout: LatticeLayout,
): { x: number; y: number; row: number } {
  const rel = cents - scale.root
  const period = Math.floor(rel / scale.period)
  const row = period - layout.first
  return {
    x: layout.x + ((rel - period * scale.period) / scale.period) * layout.w,
    y: layout.box.y + layout.box.h - (row + 0.5) * layout.rowHeight,
    row,
  }
}

/** The step under a point of the display. */
function latticeDegreeAt(x: number, y: number, scale: LatticeScale, layout: LatticeLayout): number {
  const row = clamp(
    Math.floor((layout.box.y + layout.box.h - y) / layout.rowHeight),
    0,
    layout.rows - 1,
  )
  const within = clamp((x - layout.x) / layout.w, 0, 1) * scale.period
  return nearestDegree(scale, scale.root + (layout.first + row) * scale.period + within)
}

function latticeHandles(view: DisplayView): DisplayHandle[] {
  const scale = latticeScale(view)
  const layout = latticeLayout(view, scale)
  const centre = view.value('center')
  const degree = nearestDegree(scale, centre * 100)
  const place = latticePlace(degreeCents(scale, degree), scale, layout)
  return [
    {
      key: 'center',
      name: 'Center Note',
      x: place.x,
      y: clamp(place.y, layout.box.y, layout.box.y + layout.box.h),
      // Taken to another step of the lattice: the Center Note is the note there.
      drag: (x, y) => {
        const to = latticeDegreeAt(x, y, scale, layout)
        return {
          center: to === degree ? centre : clamp(Math.round(degreeCents(scale, to) / 100), 36, 84),
        }
      },
      reset: () => ({ center: view.spec('center')?.default ?? 62 }),
    },
  ]
}

const latticeParams: string[] = ['root', 'scale', 'center', 'feedbackPath', 'customPeriod']
for (let i = 1; i <= 12; i++) latticeParams.push(`customOn${i}`, `customCents${i}`)
for (const v of LATTICE_VOICES)
  latticeParams.push(`v${v}Role`, `v${v}Degrees`, `v${v}Level`, `v${v}Delay`, `v${v}Feedback`)

const lattice = plateDisplay({
  place: 'window',
  columns: 2,
  params: latticeParams,
  live: { meters: true },
  info: 'The scale as a lattice: its steps run across from the root, each row an octave higher. The square is the note being played, the dots the voices at the steps they are sent to, larger when louder, with rings or a trail for their repeats. Drag the ring to move the Center Note.',
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const scale = latticeScale(frame)
    const layout = latticeLayout(frame, scale)
    const { box, rows, rowHeight } = layout
    const count = scale.degrees.length
    const foot = box.y + box.h
    const lineTop = foot - (rows - 0.5) * rowHeight
    const lineFoot = foot - 0.5 * rowHeight

    // The lattice: a line up for every step of the scale, the root's the
    // strongest, a line across for every period, a node where they meet.
    // Under a scale of tempered notes that repeats at the octave, their names.
    let nameEnd = -Infinity
    for (let k = 0; k < count; k++) {
      const x = layout.x + (scale.degrees[k] / scale.period) * layout.w
      const isRoot = scale.degrees[k] === 0
      rule(ctx, x, lineTop, x, lineFoot, {
        colour: colours.ink,
        alpha: isRoot ? INK.rule : INK.grid,
      })
      const semitones = scale.degrees[k] / 100
      if (scale.period !== 1200 || !Number.isInteger(semitones)) continue
      const name = NOTE_NAMES[(scale.root / 100 + semitones) % 12]
      const wide = name.length * 2.6 + 0.5
      if (x - wide < nameEnd) continue
      nameEnd = x + wide
      text(frame, name, x, frame.height - 4, {
        align: 'center',
        alpha: isRoot ? INK.text : INK.back,
      })
    }
    for (let row = 0; row < rows; row++) {
      const y = foot - (row + 0.5) * rowHeight
      rule(ctx, layout.x, y, layout.x + layout.w, y, { colour: colours.ink, alpha: INK.grid })
      for (let k = 0; k < count; k++) {
        const x = layout.x + (scale.degrees[k] / scale.period) * layout.w
        fillRect(
          ctx,
          { x: Math.round(x) - 1, y: Math.round(y) - 1, w: 3, h: 3 },
          colours.ink,
          INK.back,
        )
      }
    }

    // The note played: what the device tracked last, held while nothing
    // pitched comes in. Before any note, the picture is drawn for a note two
    // steps above the Center Note, in outline.
    const centre = nearestDegree(scale, frame.value('center') * 100)
    const reading = frame.meter('note')
    const tracked = frame.hasMeter('note') && Number.isFinite(reading) && reading > 0
    const sounding = tracked && frame.powered && frame.meter('voiced') > 0.5
    const played = tracked ? nearestDegree(scale, reading * 100) : centre + 2
    const playedCents = tracked ? reading * 100 : degreeCents(scale, played)
    const cascade = frame.value('feedbackPath') > 0.5

    // A place on the lattice, or at its edge for a pitch that is off it.
    const placed = (cents: number): { x: number; y: number } => {
      const place = latticePlace(cents, scale, layout)
      return {
        x: place.x,
        y: place.row < 0 ? foot + 1 : place.row >= rows ? box.y - 1 : place.y,
      }
    }
    const from = placed(playedCents)

    // The Center Note's ring lies under the marks, so a voice sent to it shows inside.
    for (const point of latticeHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key, radius: 5 })
    }

    clipped(ctx, { x: box.x - 3, y: box.y - 3, w: box.w + 6, h: box.h + 6 }, () => {
      for (const v of LATTICE_VOICES) {
        const role = Math.round(frame.value(`v${v}Role`))
        if (role === ROLE_OFF) continue
        const target = voiceDegree(
          role,
          played,
          centre,
          count,
          Math.round(frame.value(`v${v}Degrees`)),
        )
        if (target === null) continue
        // The shift as the device has it now, on its way at the Glide time;
        // at rest, where the role sends the voice.
        const shift = tracked
          ? clamp(frame.meter(`shift${v}`), -2400, 2400)
          : clamp(degreeCents(scale, target) - playedCents, -2400, 2400)
        const at = placed(playedCents + shift)
        const db = frame.value(`v${v}Level`)
        const muted = db <= -60
        const radius = muted ? 2 : 2 + 2.2 * clamp((db + 30) / 36, 0, 1)
        trace(
          ctx,
          [
            [from.x, from.y],
            [at.x, at.y],
          ],
          { colour: colours.accent, width: 1, alpha: 0.45 },
        )
        // Repeats (`VoiceDelay.h`: Feedback fades in over the first 5 ms of
        // Delay). Echo keeps the pitch: rings. Cascade shifts each repeat
        // again: a trail along the lattice.
        const again =
          (frame.value(`v${v}Feedback`) / 100) * Math.min(1, frame.value(`v${v}Delay`) / 5)
        let level = again
        for (let n = 1; n <= 3 && level >= ECHO_FLOOR; n++, level *= again) {
          if (cascade) {
            const next = placed(playedCents + shift * (n + 1))
            dot(ctx, next.x, next.y, Math.max(1.2, radius * 0.75 ** n), colours.accent, {
              alpha: clamp(level, 0.25, 1),
            })
          } else {
            ctx.beginPath()
            ctx.arc(at.x, at.y, radius + 2.5 * n, 0, Math.PI * 2)
            ctx.globalAlpha = clamp(level, 0.25, 1)
            ctx.strokeStyle = colours.accent
            ctx.lineWidth = 1
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
        if (tracked && !muted) {
          dot(ctx, at.x, at.y, radius, colours.accent, { ring: colours.ink })
        } else {
          dot(ctx, at.x, at.y, radius, colours.plate, { ring: colours.accent })
        }
      }
      // The note played, a square: filled while it sounds.
      const side = 6
      const square: Box = {
        x: crisp(from.x - side / 2),
        y: crisp(from.y - side / 2),
        w: side,
        h: side,
      }
      fillRect(ctx, square, sounding ? colours.ink : colours.plate)
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1.5
      ctx.strokeRect(square.x, square.y, square.w, square.h)
    })
  },
  handles: latticeHandles,
})

// --- Spectral Drifter -------------------------------------------------------

const DRIFT_RANGE = 12
const DRIFT_GRAINS = 8
/** Under this a sample is silence to the age tracker (`kAgeActivityThreshold`). */
const DRIFT_ACTIVE = 0.0001
/** In silence the age falls by 0.9999 a sample at 44.1 kHz: a time constant of this many seconds. */
const DRIFT_FALL_SEC = 1 / (44100 * -Math.log(0.9999))

/**
 * The interval one grain is sent towards, in semitones, as
 * `SpectralDrifter::process` assigns it when the grain starts: a fixed fifth
 * or octave, every third grain the other way in Scatter; in Atonal as far as
 * the drift itself reaches (`calculatePitchRatio`).
 */
function grainTarget(grain: number, interval: number, direction: number, drift: number): number {
  if (interval === 3) {
    const most = 12 * drift
    if (direction === 0) return most
    if (direction === 1) return -most
    return grain % 2 === 0 ? most * 0.7 : -most * 0.5
  }
  const semitones = interval === 0 ? 7 : interval === 1 ? 12 : grain % 2 === 0 ? 12 : 7
  const down = direction === 1 ? -semitones : semitones
  return direction === 2 && grain % 3 === 0 ? -down : down
}

/** Where a grain plays: the device blends its speed from 1 towards the target's by the drift. */
function grainShift(target: number, drift: number): number {
  const ratio = Math.pow(2, clamp(target, -12, 12) / 12)
  return 12 * Math.log2(1 + (ratio - 1) * drift)
}

interface DriftState {
  /** How long the sound has been ringing, seconds: the device's own tracker, run here on the same input. */
  age: number
}

const spectralDrifter = plateDisplay<DriftState>({
  place: 'strip',
  params: ['bloom', 'direction', 'interval', 'decay', 'ageMode', 'age'],
  live: { signal: true },
  info: 'A ruler in semitones with the sound going in at 0. Each mark is a group of grains, as tall as its share of them, at the pitch it plays now. The longer the sound rings the further it drifts along its line, towards the dashed interval. The faint end of the line is where a fresh sound starts.',
  init: () => ({ age: 0 }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const ruler = semitoneRuler(frame, -DRIFT_RANGE, DRIFT_RANGE)
    drawRuler(frame, ruler)
    const bloom = frame.value('bloom')
    const direction = clamp(Math.round(frame.value('direction')), 0, 2)
    const interval = clamp(Math.round(frame.value('interval')), 0, 3)
    const longest = 2 * clamp(frame.value('decay'), 1, 30)

    // The age, as `SpectralDrifterDevice::track_age` counts it: a second a
    // second while there is sound, up to twice Decay, and falling in silence.
    let age = 0
    if (frame.value('ageMode') >= 0.5) {
      age = clamp(frame.value('age'), 0, 1)
    } else if (frame.powered && frame.signal) {
      const wave = (frame.signal.input ?? frame.signal.output).wave
      let active = 0
      for (const sample of wave) if (sample > DRIFT_ACTIVE || sample < -DRIFT_ACTIVE) active++
      const share = wave.length > 0 ? active / wave.length : 0
      state.age =
        Math.min(longest, state.age + share * frame.dt) *
        Math.exp((-(1 - share) * frame.dt) / DRIFT_FALL_SEC)
      age = clamp(state.age / longest, 0, 1)
    } else {
      state.age = 0
    }
    // `intensityFactor`: Bloom, from three tenths of it for a fresh sound to all of it for an old one.
    const drift = (at: number): number => bloom * (0.3 + 0.7 * at)

    mark(frame, ruler, 0, 1, colours.ink, 2, INK.back)

    // The grains in groups that play the same pitch.
    const seen: number[] = []
    for (let grain = 0; grain < DRIFT_GRAINS; grain++) {
      const key = grainTarget(grain, interval, direction, 1)
      if (seen.includes(key)) continue
      seen.push(key)
      let share = 0
      for (let other = 0; other < DRIFT_GRAINS; other++)
        if (grainTarget(other, interval, direction, 1) === key) share++
      const level = share / DRIFT_GRAINS
      const fresh = grainShift(grainTarget(grain, interval, direction, drift(0)), drift(0))
      const old = grainShift(grainTarget(grain, interval, direction, drift(1)), drift(1))
      const now = grainShift(grainTarget(grain, interval, direction, drift(age)), drift(age))
      // Where the grain is drawn towards: its interval in full.
      const whole = grainTarget(grain, interval, direction, 1)
      const wholeX = xOfSt(whole, ruler)
      rule(ctx, wholeX, yOfLevel(level, ruler), wholeX, ruler.base, {
        colour: colours.ink,
        alpha: INK.back,
        dash: [2, 2],
      })
      // The way it drifts as the sound ages, at the height of its mark.
      const y = yOfLevel(level, ruler)
      rule(ctx, xOfSt(fresh, ruler), y, xOfSt(old, ruler), y, {
        colour: colours.ink,
        alpha: INK.back,
      })
      rule(ctx, xOfSt(fresh, ruler), y - 2, xOfSt(fresh, ruler), y + 3, {
        colour: colours.ink,
        alpha: INK.back,
      })
      mark(frame, ruler, now, level, colours.accent, 2.5)
      dot(ctx, xOfSt(now, ruler), y, 2.5, colours.accent, { ring: colours.ink })
    }
  },
})

export const PITCH_FACES: Readonly<Record<string, PlateFace>> = {
  'pitch-shifter': {
    display: pitchShifter,
    face: ['pitchA', 'mode', 'feedback', 'mix'],
  },
  octaves: {
    display: octaves,
    face: ['attack', 'filter', 'detune', 'spread'],
    // The five levels are on the bars, so their knobs go behind the plate
    // under their own names; the skin's short labels were for the face.
    labels: {},
  },
  'half-speed': {
    display: halfSpeed,
    face: ['length', 'speed', 'smooth', 'mix'],
  },
  'freq-shifter': {
    display: freqShifter,
    face: ['shift', 'fine', 'feedback', 'mix'],
  },
  lattice: {
    display: lattice,
    face: ['root', 'scale', 'glide', 'mix'],
  },
  'spectral-drifter': {
    display: spectralDrifter,
    face: ['bloom', 'direction', 'interval', 'mix'],
  },
}
