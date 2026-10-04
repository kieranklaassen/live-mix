// Displays of the devices an LFO moves: the modulation as it runs, the last
// moments at the left of a mark that stands for now and the next ones at its
// right, drawn from the same shapes the device computes and kept in step with
// it by the phase the device reports. A swept comb or a chain of all-pass
// stages is drawn as what it does across the spectrum, at the place the
// device says its sweep is; a turning speaker as its rotors seen from above.

import {
  FLOOR_DB,
  FREQ_MAX,
  FREQ_MIN,
  History,
  INK,
  clamp,
  clipped,
  dbGrid,
  dot,
  freqGrid,
  ground,
  handle,
  hzOfX,
  hzText,
  lerp,
  rule,
  text,
  trace,
  trackPhase,
  xOfHz,
  yOfDb,
  type Box,
  type PhaseTrack,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

/** How much time a modulation display spans, and where in it now stands. */
const SPAN_SEC = 2
const NOW_AT = 0.7

const scopeBox = (frame: Pick<DisplayFrame, 'width' | 'height'>): Box => ({
  x: 4,
  y: 5,
  w: frame.width - 8,
  h: frame.height - 10,
})

// --- Tremolo ----------------------------------------------------------------

const TREMOLO_SHAPES = ['sine', 'triangle', 'square', 'random'] as const
const TREMOLO_MODES = ['tremolo', 'pan', 'harmonic', 'vibrato'] as const
/** Points in one cycle of the table the trace is read from. */
const CYCLE = 256

/** One cycle of a Tremolo shape before the slew, as `tremolo.h` computes it: rising through zero at 0. */
function tremoloWave(shape: (typeof TREMOLO_SHAPES)[number], phase: number): number {
  if (shape === 'triangle')
    return phase < 0.25 ? 4 * phase : phase < 0.75 ? 2 - 4 * phase : 4 * phase - 4
  if (shape === 'square') return phase < 0.5 ? 1 : -1
  return Math.sin(phase * Math.PI * 2)
}

/**
 * One cycle of the modulator as the device hears it: the shape through the
 * slew, two poles of `0.001 + smooth · 0.08 / rate` seconds each. Run round
 * the cycle three times so the table holds the settled cycle.
 */
function tremoloCycle(
  shape: (typeof TREMOLO_SHAPES)[number],
  rate: number,
  smooth: number,
  table: Float32Array,
): void {
  const seconds = 0.001 + (smooth * 0.08) / rate
  const coeff = Math.exp(-1 / (seconds * rate * CYCLE))
  let a = tremoloWave(shape, 0)
  let b = a
  for (let i = 0; i < CYCLE * 3; i++) {
    const raw = tremoloWave(shape, (i % CYCLE) / CYCLE)
    a = raw + (a - raw) * coeff
    b = a + (b - a) * coeff
    if (i >= CYCLE * 2) table[i - CYCLE * 2] = b
  }
}

interface TremoloState {
  table: Float32Array
  /** What the table was made from, so it is made again only when one of them moves. */
  made: string
  phase: PhaseTrack | null
  /** The modulator as the device reports it, for Random, which no formula follows. */
  left: History
  right: History
}

/** What a point's ring takes about its middle when it is lit: the kit's 4.5 px and half its 1.5 px line. */
const RING_ROOM = 5.25

/** Where the ring of a scope's point stands for a line at `y`: on it, and whole on the strip at its two edges. */
const ringY = (view: Pick<DisplayView, 'height'>, y: number): number =>
  clamp(y, RING_ROOM, view.height - RING_ROOM)

/** The line a ring dragged to `y` stands for: the same height, and past the scope where the ring can go no further. */
const lineOfRing = (view: Pick<DisplayView, 'height'>, y: number): number =>
  y <= RING_ROOM + 1e-6 ? -Infinity : y >= view.height - RING_ROOM - 1e-6 ? Infinity : y

/**
 * The one point of the Tremolo's scope: on the line the swing reaches at its
 * furthest, at the scope's left end, where nothing rides the LFO. Up and down
 * is Depth. Tremolo and Harmonic swing down from the top, where the sound is
 * untouched; Pan and Vibrato swing about the middle, and the point stands on
 * the upper end. Mix scales the swing with Depth, so the line stands at their
 * product and a drag is taken back through it. At the box's two ends the ring
 * stands a quarter pixel in from the line, so that it is whole when it is lit.
 */
function tremoloHandles(view: DisplayView): DisplayHandle[] {
  const box = scopeBox(view)
  const mode = TREMOLO_MODES[Math.round(view.value('mode'))] ?? 'tremolo'
  const depth = view.value('depth')
  const spec = view.spec('depth')
  const falls = mode === 'tremolo' || mode === 'harmonic'
  const from = falls ? box.y : box.y + box.h / 2
  // How far the line travels for the whole of Depth: down the box, or up half of it.
  const reach = (falls ? box.h : -box.h / 2) * view.value('mix')
  const y = ringY(view, from + depth * reach)
  return [
    {
      key: 'depth',
      name: 'Depth',
      x: box.x + 5,
      y,
      // With no Mix nothing swings, and the line has nowhere to go.
      drag: (_x, toY) => ({
        depth:
          Math.abs(toY - y) < 1e-6 || Math.abs(reach) < 1e-6
            ? depth
            : clamp((lineOfRing(view, toY) - from) / reach, spec?.min ?? 0, spec?.max ?? 1),
      }),
      reset: () => ({ depth: spec?.default ?? depth }),
    },
  ]
}

const tremolo = plateDisplay<TremoloState>({
  place: 'strip',
  params: ['mode', 'rate', 'depth', 'shape', 'phase', 'smooth', 'mix'],
  live: { meters: true, fps: 60 },
  info: 'The modulation over two seconds, running to the left: the mark is now, the past at its left and what comes at its right. Up is louder for Tremolo, left for Pan, the low band for Harmonic and sharp for Vibrato. The fainter line is the right side, set apart by Stereo Phase. The ring sets Depth.',
  init: () => ({
    table: new Float32Array(CYCLE),
    made: '',
    phase: null,
    left: new History(SPAN_SEC * NOW_AT, 124, 0),
    right: new History(SPAN_SEC * NOW_AT, 124, 0),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const box = scopeBox(frame)
    const mode = TREMOLO_MODES[Math.round(frame.value('mode'))] ?? 'tremolo'
    const shape = TREMOLO_SHAPES[Math.round(frame.value('shape'))] ?? 'sine'
    const rate = frame.value('rate')
    const depth = frame.value('depth') * frame.value('mix')
    const offset = frame.value('phase') / 360
    const smooth = frame.value('smooth')
    const running = frame.powered && frame.hasMeter('phase') && frame.dt > 0

    if (running) {
      state.phase = trackPhase(state.phase, frame.meter('phase'), rate, frame.dt)
      state.left.push(frame.now, frame.meter('left'))
      state.right.push(frame.now, frame.meter('right'))
    }
    const made = `${shape} ${rate.toFixed(3)} ${smooth.toFixed(3)}`
    if (made !== state.made) {
      tremoloCycle(shape, rate, smooth, state.table)
      state.made = made
    }

    // The modulator (−1..1) as a height: what it does to the sound in this mode.
    const top = box.y
    const foot = box.y + box.h
    const middle = box.y + box.h / 2
    const height = (m: number, side: 0 | 1): number => {
      if (mode === 'tremolo') return top + depth * (1 - m) * 0.5 * box.h
      if (mode === 'harmonic') return top + depth * (1 + (side === 0 ? -m : m)) * 0.5 * box.h
      // Pan and Vibrato swing about the middle. The device pans to the right as the modulator rises: down here.
      return middle + (mode === 'pan' ? depth : -depth) * m * (box.h / 2)
    }
    const nowX = box.x + box.w * NOW_AT
    const read = (phase: number): number => {
      const at = (phase - Math.floor(phase)) * CYCLE
      const i = Math.floor(at)
      const next = state.table[(i + 1) % CYCLE]
      return state.table[i] + (next - state.table[i]) * (at - i)
    }
    // Vibrato bends the pitch by how fast the delay moves: the slope of the modulator, upside down.
    const value = (phase: number): number =>
      mode === 'vibrato'
        ? (read(phase - 0.5 / CYCLE) - read(phase + 0.5 / CYCLE)) * (CYCLE / (2 * Math.PI))
        : read(phase)

    // The scale: where the sound is untouched.
    rule(
      ctx,
      box.x,
      mode === 'tremolo' || mode === 'harmonic' ? top : middle,
      box.x + box.w,
      mode === 'tremolo' || mode === 'harmonic' ? top : middle,
      {
        colour: colours.ink,
        alpha: INK.grid,
      },
    )
    // How far the swing goes at the most: the line Depth is taken by.
    const [point] = tremoloHandles(frame)
    const most =
      mode === 'tremolo' || mode === 'harmonic' ? top + depth * box.h : middle - depth * (box.h / 2)
    rule(ctx, box.x, most, box.x + box.w, most, { colour: colours.ink, alpha: INK.grid })
    rule(ctx, nowX, box.y - 2, nowX, foot + 2, { colour: colours.ink, alpha: INK.rule })

    const phaseNow = state.phase?.phase ?? 0
    // Harmonic shows its two bands; the others show the right side when it is set apart.
    const sides: (0 | 1)[] =
      mode === 'harmonic' || (offset > 0.002 && mode !== 'pan') ? [1, 0] : [0]
    clipped(ctx, { x: box.x, y: box.y - 3, w: box.w, h: box.h + 6 }, () => {
      for (const side of sides) {
        const lead = mode === 'harmonic' ? 0 : side * offset
        const past: Point[] = []
        const next: Point[] = []
        if (shape === 'random') {
          // No formula follows Random: draw what the device reported, up to now.
          const history = side === 0 ? state.left : state.right
          past.push(...history.points({ ...box, w: nowX - box.x }, (m) => height(m, side)))
        } else {
          for (let x = box.x; x <= box.x + box.w; x += 0.5) {
            const seconds = ((x - nowX) / box.w) * SPAN_SEC
            const point: Point = [x, height(value(phaseNow + lead + seconds * rate), side)]
            if (x <= nowX) past.push(point)
            if (x >= nowX) next.push(point)
          }
        }
        const back = side === 1 && mode !== 'harmonic'
        trace(ctx, past, { colour: colours.ink, width: back ? 1 : 1.5, alpha: back ? INK.back : 1 })
        trace(ctx, next, {
          colour: colours.ink,
          width: 1,
          alpha: back ? INK.grid * 2 : INK.back,
          dash: [2, 2],
        })
      }
    })
    if (running || !frame.powered || shape !== 'random') {
      for (const side of sides) {
        const m =
          shape === 'random'
            ? (side === 0 ? state.left : state.right).at(0)
            : value(phaseNow + (mode === 'harmonic' ? 0 : side * offset))
        dot(ctx, nowX, height(m, side), side === 0 ? 3 : 2, colours.accent, { ring: colours.ink })
      }
    }
    // What the height means, at the two ends of the scale.
    const [high, low] =
      mode === 'pan'
        ? ['L', 'R']
        : mode === 'harmonic'
          ? ['LO', 'HI']
          : mode === 'vibrato'
            ? ['♯', '♭']
            : ['', '']
    if (high) {
      text(frame, high, box.x + box.w, box.y + 6, { align: 'right', alpha: INK.back })
      text(frame, low, box.x + box.w, foot, { align: 'right', alpha: INK.back })
    }
    handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: tremoloHandles,
})

// --- Lines kept between frames ----------------------------------------------

const TWO_PI = Math.PI * 2
const wrap = (cycles: number): number => cycles - Math.floor(cycles)
/** A difference of two places in a cycle, taken the short way round: −½..½. */
const shortWay = (cycles: number): number => wrap(cycles + 0.5) - 0.5

/** Points kept in two arrays between frames, so a trace drawn on every frame makes nothing new. */
interface Line {
  x: Float32Array
  y: Float32Array
}

const line = (size = 0): Line => ({
  x: new Float32Array(size),
  y: new Float32Array(size),
})

/** Room for `size` points; the arrays are made again only when the display grew. */
function room(kept: Line, size: number): void {
  if (kept.x.length >= size) return
  kept.x = new Float32Array(size)
  kept.y = new Float32Array(size)
}

interface LineStyle {
  colour: string
  width?: number
  alpha?: number
  dotted?: boolean
}

const SOLID: number[] = []
const DOTTED = [2, 2]

/** What the kit's `trace` draws, through the points of a kept line from `from` up to `to`. */
function strokeLine(
  ctx: CanvasRenderingContext2D,
  xs: Float32Array,
  ys: Float32Array,
  from: number,
  to: number,
  style: LineStyle,
): void {
  if (to - from < 2) return
  ctx.beginPath()
  ctx.moveTo(xs[from], ys[from])
  for (let i = from + 1; i < to; i++) ctx.lineTo(xs[i], ys[i])
  ctx.globalAlpha = style.alpha ?? 1
  ctx.strokeStyle = style.colour
  ctx.lineWidth = style.width ?? 1.5
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.setLineDash(style.dotted ? DOTTED : SOLID)
  ctx.stroke()
  ctx.setLineDash(SOLID)
  ctx.globalAlpha = 1
}

/**
 * The most cycles of a modulation a scope spans. A faster one is given less
 * time across the same width, so it stays a wave that runs and does not
 * close up into a hatching.
 */
const SCOPE_CYCLES = 4

/** How much time a scope of a modulation at `rateHz` spans, in seconds: `most`, or `SCOPE_CYCLES` of it. */
export function scopeSpanSec(rateHz: number, most = SPAN_SEC): number {
  return rateHz * most > SCOPE_CYCLES ? SCOPE_CYCLES / rateHz : most
}

/** A reading that has not changed for this long is of a device that is not being run. */
const STANDS_SEC = 0.15

/** An LFO followed from the device's readings of its phase, and for how long no new reading has come. */
interface Followed {
  track: PhaseTrack | null
  stoodFor: number
}

const followed = (): Followed => ({ track: null, stoodFor: 0 })

/**
 * The kit's `trackPhase`, for a reading that may stop coming. A free-running
 * LFO never reports the same place twice (the slowest moves every reading),
 * so the same reading for `STANDS_SEC` means nothing runs the device: the
 * sound engine is stopped. Then the phase stands on the last reading and is
 * not carried on by the clock. Returns false while it stands.
 */
function followPhase(kept: Followed, reading: number, rateHz: number, dt: number): boolean {
  kept.stoodFor = kept.track !== null && reading === kept.track.reading ? kept.stoodFor + dt : 0
  if (kept.stoodFor >= STANDS_SEC) {
    kept.track = { phase: reading, reading }
    return false
  }
  kept.track = trackPhase(kept.track, reading, rateHz, dt)
  return true
}

// --- Chorus -----------------------------------------------------------------

/** The most a Chorus voice swings either side of Delay, in ms: `kMaxDeviationMs` in `chorus.h`. */
const CHORUS_SWING_MS = 5
/** Room at the right of the scope for the time its middle line stands for. */
const CHORUS_MARGIN = 30

/** How far the voices swing either side of Delay, in ms: `chorus.h`, `apply(kDepth)`. */
export function chorusSwingMs(depthPercent: number, delayMs: number): number {
  return (depthPercent / 100) * Math.min(CHORUS_SWING_MS, delayMs - 1)
}

/**
 * Where a Chorus voice reads, in ms off Delay, with the LFO at `phase`:
 * `chorus.h`, `read_voices`. Voice `voice` of `voices` runs that share of a
 * cycle ahead, and the right side `apart` cycles further (Spread · ¼).
 */
export function chorusVoiceMs(
  phase: number,
  voice: number,
  voices: number,
  swingMs: number,
  apart = 0,
): number {
  return Math.sin((phase + voice / voices + apart) * TWO_PI) * swingMs
}

interface ChorusState {
  lfo: Followed
  /** The LFO at every point across the scope, as its sine and cosine: each voice is a turn of the two. */
  sin: Float32Array
  cos: Float32Array
  kept: Line
}

/** The scope of the Chorus: the strip less the room for the words at its right. */
function chorusBox(view: Pick<DisplayView, 'width' | 'height'>): Box {
  const all = scopeBox(view)
  return { ...all, w: all.w - CHORUS_MARGIN }
}

/**
 * The one point of the Chorus's scope: on the line the voices swing up to, at
 * the scope's left end, where nothing rides the LFO. Up and down is Depth, on
 * the scope's own scale of 5 ms either side of Delay, which no knob stretches.
 */
function chorusHandles(view: DisplayView): DisplayHandle[] {
  const box = chorusBox(view)
  const middle = box.y + box.h / 2
  const perMs = box.h / 2 / CHORUS_SWING_MS
  const depth = view.value('depth')
  const spec = view.spec('depth')
  // The whole of Depth, in ms: less than the scale's 5 where Delay is under 6 ms.
  const most = chorusSwingMs(100, view.value('delayMs'))
  // At the top of the scope the ring stands a quarter pixel under the line, whole when it is lit.
  const y = ringY(view, middle - chorusSwingMs(depth, view.value('delayMs')) * perMs)
  return [
    {
      key: 'depth',
      name: 'Depth',
      x: box.x + 5,
      y,
      drag: (_x, toY) => ({
        depth:
          Math.abs(toY - y) < 1e-6
            ? depth
            : clamp(
                ((middle - lineOfRing(view, toY)) / (most * perMs)) * 100,
                spec?.min ?? 0,
                spec?.max ?? 100,
              ),
      }),
      reset: () => ({ depth: spec?.default ?? depth }),
    },
  ]
}

const chorus = plateDisplay<ChorusState>({
  place: 'strip',
  params: ['voices', 'rate', 'depth', 'delayMs', 'spread'],
  // Three voices a third of a cycle apart make a figure that comes round three times in a cycle: 30 frames a second cannot follow it at a few Hz.
  live: { meters: true, fps: 60 },
  info: 'Each line is one voice: the delay it reads at, swinging around Delay and running to the left, two seconds across or four cycles when Rate is fast. The mark is now. Up is a longer delay, a steeper line more bend in pitch. The fainter lines are the right side, set apart by Spread. The ring sets Depth.',
  init: () => ({
    lfo: followed(),
    sin: new Float32Array(0),
    cos: new Float32Array(0),
    kept: line(),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const all = scopeBox(frame)
    const box = chorusBox(frame)
    const voices = frame.value('voices') >= 0.5 ? 3 : 2
    const rate = frame.value('rate')
    const delay = frame.value('delayMs')
    const swing = chorusSwingMs(frame.value('depth'), delay)
    const apart = (frame.value('spread') / 100) * 0.25
    if (frame.powered && frame.hasMeter('phase') && frame.dt > 0)
      followPhase(state.lfo, frame.meter('phase'), rate, frame.dt)
    const phaseNow = state.lfo.track?.phase ?? 0

    // Delay is the middle line, and the most a voice can swing fills the box.
    const middle = box.y + box.h / 2
    const perMs = box.h / 2 / CHORUS_SWING_MS
    const nowX = box.x + box.w * NOW_AT
    rule(ctx, box.x, middle, box.x + box.w, middle, { colour: colours.ink, alpha: INK.grid })
    // How far up the voices swing: the line Depth is taken by.
    const [point] = chorusHandles(frame)
    const most = middle - swing * perMs
    rule(ctx, box.x, most, box.x + box.w, most, { colour: colours.ink, alpha: INK.grid })
    rule(ctx, nowX, box.y - 2, nowX, box.y + box.h + 2, { colour: colours.ink, alpha: INK.rule })

    // The LFO across the scope, once: some thirty points a cycle, with one exactly at now.
    const span = scopeSpanSec(rate)
    const step = clamp(box.w / (span * rate) / 32, 1, 3)
    const before = Math.max(1, Math.ceil((nowX - box.x) / step))
    const after = Math.max(1, Math.ceil((box.x + box.w - nowX) / step))
    const count = before + after + 1
    room(state.kept, count)
    if (state.sin.length < count) {
      state.sin = new Float32Array(count)
      state.cos = new Float32Array(count)
    }
    const { x, y } = state.kept
    for (let i = 0; i < count; i++) {
      x[i] =
        i <= before
          ? box.x + ((nowX - box.x) * i) / before
          : nowX + ((box.x + box.w - nowX) * (i - before)) / after
      const angle = (phaseNow + ((x[i] - nowX) / box.w) * span * rate) * TWO_PI
      state.sin[i] = Math.sin(angle)
      state.cos[i] = Math.cos(angle)
    }
    // The right side behind, where Spread sets it apart: what it has done, and not what comes.
    const sides = apart > 0.002 ? 1 : 0
    ctx.save()
    ctx.beginPath()
    ctx.rect(box.x, box.y - 3, box.w, box.h + 6)
    ctx.clip()
    for (let side = sides; side >= 0; side--) {
      for (let voice = 0; voice < voices; voice++) {
        // sin(lfo + ahead), as the device turns one sine and cosine to each voice.
        const ahead = (voice / voices + side * apart) * TWO_PI
        const c = Math.cos(ahead) * swing * perMs
        const s = Math.sin(ahead) * swing * perMs
        for (let i = 0; i < count; i++) y[i] = middle - (state.sin[i] * c + state.cos[i] * s)
        if (side === 1) {
          strokeLine(ctx, x, y, 0, before + 1, { colour: colours.ink, width: 1, alpha: INK.rule })
          continue
        }
        strokeLine(ctx, x, y, 0, before + 1, { colour: colours.ink })
        strokeLine(ctx, x, y, before, count, {
          colour: colours.ink,
          width: 1,
          alpha: INK.back,
          dotted: true,
        })
      }
    }
    ctx.restore()
    for (let side = sides; side >= 0; side--) {
      for (let voice = 0; voice < voices; voice++) {
        const ms = chorusVoiceMs(phaseNow, voice, voices, swing, side * apart)
        dot(ctx, nowX, middle - ms * perMs, side === 0 ? 2.5 : 1.5, colours.accent, {
          ring: side === 0 ? colours.ink : undefined,
        })
      }
    }
    // The scale: what the middle line stands for.
    text(
      frame,
      `${delay.toFixed(delay < 10 ? 1 : 0).replace(/\.0$/, '')} ms`,
      all.x + all.w,
      middle,
      {
        align: 'right',
        baseline: 'middle',
      },
    )
    handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: chorusHandles,
})

// --- A sweep across the spectrum (Flanger, Phaser) --------------------------

/** The levels a swept response spans, top to foot: a resonance at full feedback is whole, a notch runs off the foot. */
const SWEPT_TOP_DB = 24
const SWEPT_FOOT_DB = -36

/**
 * One cycle of a sweep shape at `phase`, −1..1, as the Flanger's and the
 * Phaser's `mod_lfo.h` computes it (`ModLfo::value_at`): Sine, Triangle, Saw
 * up, Saw down, Square. Random is held by the device from cycle to cycle and
 * no formula follows it: 0 here.
 */
export function sweepWave(shape: number, phase: number): number {
  const p = wrap(phase)
  switch (Math.round(shape)) {
    case 0:
      return Math.sin(p * TWO_PI)
    case 1:
      return 1 - 4 * Math.abs(p - 0.5)
    case 2:
      return 2 * p - 1
    case 3:
      return 1 - 2 * p
    case 4:
      return p < 0.5 ? 1 : -1
    default:
      return 0
  }
}

/**
 * What a dry signal mixed with a turned and fed-back copy of itself comes to,
 * in dB: `out = in + (wet − in) · mix`, where the wet path turns the phase by
 * `phi` radians and its loop, fed back by `feedback`, comes round at `psi`:
 * H = 1 − mix + mix · e^(j·phi) / (1 − feedback · e^(j·psi)). Both devices
 * here are this, with a delay or a chain of all-pass stages as the turn.
 */
export function mixedDb(phi: number, psi: number, feedback: number, mix: number): number {
  const loopRe = 1 - feedback * Math.cos(psi)
  const loopIm = -feedback * Math.sin(psi)
  const scale = mix / (loopRe * loopRe + loopIm * loopIm)
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)
  const re = 1 - mix + (cos * loopRe + sin * loopIm) * scale
  const im = (sin * loopRe - cos * loopIm) * scale
  const power = re * re + im * im
  return power > 1e-12 ? 10 * Math.log10(power) : FLOOR_DB
}

/**
 * A response kept between frames: a line through `x` and `y` where the curve
 * can be followed, and from index `dense` on two lines, `y` and `low`, the
 * bounds of a comb whose teeth stand closer than the pixels.
 */
interface Curve {
  x: Float32Array
  y: Float32Array
  low: Float32Array
  n: number
  dense: number
}

const curve = (): Curve => ({
  x: new Float32Array(0),
  y: new Float32Array(0),
  low: new Float32Array(0),
  n: 0,
  dense: 0,
})

/**
 * The highest and the lowest a comb reaches at each column of a box, over one
 * whole turn of its phase. It depends on the feedback and the mix alone, not
 * on where the comb stands, so it is made again only when one of them moves.
 */
interface Bounds {
  high: Float32Array
  low: Float32Array
  columns: number
  feedback: number
  mix: number
  sampleRate: number
}

const bounds = (): Bounds => ({
  high: new Float32Array(0),
  low: new Float32Array(0),
  columns: 0,
  feedback: NaN,
  mix: NaN,
  sampleRate: 0,
})

/** Steps round the loop's phase the bounds are taken at: the resonance is on one of them. */
const BOUND_STEPS = 24
/** A comb whose teeth stand closer than this many pixels is drawn as its bounds. */
const TEETH_APART = 3

/**
 * How far the loop's extra sample moves a notch off the half turn, in
 * radians. Over a common denominator the mix is 1 − mix + e^(j·phi) ·
 * (mix − (1 − mix) · feedback · e^(−j·lag)), which is smallest where phi and
 * the angle of that last factor make half a turn together; `lag` is the
 * phase of one sample at the frequency.
 */
function notchLean(lag: number, feedback: number, mix: number): number {
  const fed = (1 - mix) * feedback
  return Math.atan2(fed * Math.sin(lag), mix - fed * Math.cos(lag))
}

function makeBounds(
  kept: Bounds,
  box: Box,
  columns: number,
  feedback: number,
  mix: number,
  sampleRate: number,
): void {
  if (
    kept.columns === columns &&
    kept.feedback === feedback &&
    kept.mix === mix &&
    kept.sampleRate === sampleRate
  )
    return
  if (kept.high.length < columns + 1) {
    kept.high = new Float32Array(columns + 1)
    kept.low = new Float32Array(columns + 1)
  }
  for (let c = 0; c <= columns; c++) {
    const lag = (hzOfX(box.x + (c / columns) * box.w, box) * TWO_PI) / sampleRate
    // Where the notch and the peak between two notches stand, then round the loop from its resonance.
    const lean = notchLean(lag, feedback, mix)
    const peak = mixedDb(-lean, -lean - lag, feedback, mix)
    const notch = mixedDb(Math.PI - lean, Math.PI - lean - lag, feedback, mix)
    let high = Math.max(peak, notch)
    let low = Math.min(peak, notch)
    for (let step = 0; step < BOUND_STEPS; step++) {
      const psi = (step / BOUND_STEPS) * TWO_PI
      const db = mixedDb(psi + lag, psi, feedback, mix)
      if (db > high) high = db
      if (db < low) low = db
    }
    kept.high[c] = high
    kept.low[c] = low
  }
  kept.columns = columns
  kept.feedback = feedback
  kept.mix = mix
  kept.sampleRate = sampleRate
}

const sweptY = (db: number, box: Box): number =>
  yOfDb(clamp(db, SWEPT_FOOT_DB - 12, SWEPT_TOP_DB + 12), box, SWEPT_TOP_DB, SWEPT_FOOT_DB)

/**
 * The response of a wet path that turns the phase by `phaseAt(hz)` (radians,
 * falling as the frequency rises) inside a loop one sample longer, across a
 * box: a point every `step` pixels, and between two of them a point at every
 * place a notch or a resonance stands (the turn, with its lean, or the loop
 * passing a whole or a half turn), so none is lost between pixels and none
 * flickers as it moves. Where the teeth of a comb stand closer than
 * `TEETH_APART` the curve cannot be followed: from there on its bounds are
 * given, when `kept` has them.
 */
function sampleResponse(
  out: Curve,
  box: Box,
  sampleRate: number,
  phaseAt: (hz: number) => number,
  feedback: number,
  mix: number,
  step: number,
  kept?: Bounds,
): void {
  const columns = Math.max(2, Math.round(box.w / step))
  // How far the turn may go on in one column before the teeth are too close to draw.
  const most = (TWO_PI / TEETH_APART) * (box.w / columns)
  const size = columns * 6 + 8
  if (out.x.length < size) {
    out.x = new Float32Array(size)
    out.y = new Float32Array(size)
    out.low = new Float32Array(size)
  }
  const perHz = TWO_PI / sampleRate
  let n = 0
  const put = (x: number, db: number): void => {
    if (n >= size) return
    out.x[n] = x
    out.y[n] = out.low[n] = sweptY(db, box)
    n += 1
  }
  let xBefore = box.x
  let phiBefore = phaseAt(FREQ_MIN)
  let psiBefore = phiBefore - FREQ_MIN * perHz
  let leanBefore = notchLean(FREQ_MIN * perHz, feedback, mix)
  put(xBefore, mixedDb(phiBefore, psiBefore, feedback, mix))
  let dense = -1
  for (let c = 1; c <= columns; c++) {
    const x = box.x + (c / columns) * box.w
    const hz = hzOfX(x, box)
    const phi = phaseAt(hz)
    if (phiBefore - phi > most) {
      dense = c
      break
    }
    const psi = phi - hz * perHz
    const lean = notchLean(hz * perHz, feedback, mix)
    // The half turns passed since the column before, highest first: of the
    // turn with its lean (a notch, or the peak between two) and of the loop
    // (its resonance, or the hollow between two).
    let turn = Math.ceil((phiBefore + leanBefore) / Math.PI) - 1
    const turnEnd = Math.ceil((phi + lean) / Math.PI)
    let loop = Math.ceil(psiBefore / Math.PI) - 1
    const loopEnd = Math.ceil(psi / Math.PI)
    while (turn >= turnEnd || loop >= loopEnd) {
      const turnAt =
        turn >= turnEnd
          ? (phiBefore + leanBefore - turn * Math.PI) / (phiBefore + leanBefore - phi - lean)
          : 2
      const loopAt = loop >= loopEnd ? (psiBefore - loop * Math.PI) / (psiBefore - psi) : 2
      const at = Math.min(turnAt, loopAt)
      put(
        lerp(xBefore, x, at),
        turnAt <= loopAt
          ? mixedDb(
              turn * Math.PI - lerp(leanBefore, lean, at),
              lerp(psiBefore, psi, at),
              feedback,
              mix,
            )
          : mixedDb(lerp(phiBefore, phi, at), loop * Math.PI, feedback, mix),
      )
      if (turnAt <= loopAt) turn -= 1
      else loop -= 1
    }
    put(x, mixedDb(phi, psi, feedback, mix))
    xBefore = x
    phiBefore = phi
    psiBefore = psi
    leanBefore = lean
  }
  out.dense = n
  if (dense >= 0 && kept) {
    makeBounds(kept, box, columns, feedback, mix, sampleRate)
    for (let c = dense; c <= columns && n < size; c++) {
      out.x[n] = box.x + (c / columns) * box.w
      out.y[n] = sweptY(kept.high[c], box)
      out.low[n] = sweptY(kept.low[c], box)
      n += 1
    }
  }
  out.n = n
}

/**
 * A response as the plate shows it: filled from the line where nothing is
 * changed and drawn over, and where its teeth run together a band between
 * the highest and the lowest they reach, fainter than the teeth that can be
 * read so the eye stays on what slides.
 */
function drawResponse(frame: DisplayFrame, kept: Curve, zero: number): void {
  const { ctx, colours } = frame
  const { x, y, low, n, dense } = kept
  ctx.fillStyle = colours.ink
  if (dense >= 2) {
    ctx.beginPath()
    ctx.moveTo(x[0], zero)
    for (let i = 0; i < dense; i++) ctx.lineTo(x[i], y[i])
    ctx.lineTo(x[dense - 1], zero)
    ctx.closePath()
    ctx.globalAlpha = INK.fill
    ctx.fill()
  }
  const from = Math.max(0, dense - 1)
  if (n - from >= 2) {
    ctx.beginPath()
    ctx.moveTo(x[from], y[from])
    for (let i = from + 1; i < n; i++) ctx.lineTo(x[i], y[i])
    for (let i = n - 1; i >= from; i--) ctx.lineTo(x[i], low[i])
    ctx.closePath()
    ctx.globalAlpha = INK.fill
    ctx.fill()
  }
  ctx.globalAlpha = 1
  strokeLine(ctx, x, y, from, n, { colour: colours.ink, width: 1, alpha: INK.back })
  strokeLine(ctx, x, low, from, n, { colour: colours.ink, width: 1, alpha: INK.back })
  strokeLine(ctx, x, y, 0, dense, { colour: colours.ink })
}

interface SweptBoxes {
  /** Where the response is drawn. */
  plot: Box
  /** The level of the bar under it that carries the sweep. */
  rail: number
  /** Where nothing is changed. */
  zero: number
  /** How far the point travels up from `zero` for full feedback. */
  reach: number
}

function sweptBoxes(view: Pick<DisplayView, 'width' | 'height'>): SweptBoxes {
  const plot: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 17 }
  const zero = yOfDb(0, plot, SWEPT_TOP_DB, SWEPT_FOOT_DB)
  return { plot, rail: Math.floor(view.height) - 7.5, zero, reach: zero - plot.y - 2 }
}

/**
 * The one point of a swept display: across is where the sweep is centred
 * (`param`, which `toHz` places on the frequency scale), up and down is
 * Feedback, with none of it on the line where nothing is changed.
 */
function sweptHandles(
  view: DisplayView,
  param: string,
  name: string,
  toHz: (value: number) => number,
  fromHz: (hz: number) => number,
): DisplayHandle[] {
  const { plot, zero, reach } = sweptBoxes(view)
  const most = view.spec('feedback')?.max ?? 95
  const spec = view.spec(param)
  return [
    {
      key: param,
      name,
      x: xOfHz(toHz(view.value(param)), plot),
      y: zero - (view.value('feedback') / most) * reach,
      drag: (x, y) => ({
        [param]: clamp(fromHz(hzOfX(x, plot)), spec?.min ?? 0, spec?.max ?? 1),
        feedback: clamp(((zero - y) / reach) * most, -most, most),
      }),
      reset: () => ({
        [param]: spec?.default ?? view.value(param),
        feedback: view.spec('feedback')?.default ?? 0,
      }),
    },
  ]
}

/**
 * How far the sweep goes, behind the response: the part of the spectrum it
 * crosses a shade darker, and under it a bar from one end to the other.
 */
function drawSweepRange(
  frame: DisplayFrame,
  boxes: SweptBoxes,
  fromHz: number,
  toHz: number,
): void {
  const { ctx, colours } = frame
  const { plot, rail } = boxes
  const from = xOfHz(fromHz, plot)
  const to = xOfHz(toHz, plot)
  ctx.globalAlpha = INK.ground
  ctx.fillStyle = colours.ink
  ctx.fillRect(from, plot.y, to - from, plot.h)
  ctx.globalAlpha = 1
  // `rail` is the middle of a row of pixels; `rule` puts a level line on the row under what it is given.
  rule(ctx, from, rail - 0.5, to, rail - 0.5, { colour: colours.ink, alpha: INK.back })
  rule(ctx, from, rail - 2.5, from, rail + 2.5, { colour: colours.ink, alpha: INK.back })
  rule(ctx, to, rail - 2.5, to, rail + 2.5, { colour: colours.ink, alpha: INK.back })
}

/**
 * Where the sweep is now, over the response: a line in the accent at the left
 * side's place, from the bar up through the response, and a smaller dot on
 * the bar for the right side where it is elsewhere.
 */
function drawSweepNow(
  frame: DisplayFrame,
  boxes: SweptBoxes,
  leftHz: number,
  rightHz: number,
): void {
  const { ctx, colours } = frame
  const { plot, rail } = boxes
  const left = xOfHz(leftHz, plot)
  const right = xOfHz(rightHz, plot)
  // Not on whole pixels: a line that slides, not one that steps.
  ctx.beginPath()
  ctx.moveTo(left, plot.y)
  ctx.lineTo(left, rail)
  ctx.globalAlpha = INK.back
  ctx.strokeStyle = colours.accent
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.globalAlpha = 1
  if (Math.abs(right - left) > 0.5) dot(ctx, right, rail, 1.75, colours.accent)
  dot(ctx, left, rail, 2.75, colours.accent, { ring: colours.ink })
}

/** The point of a swept display and, while it is under the pointer or in hand, what it is set to. */
function drawSweptHandle(
  frame: DisplayFrame,
  boxes: SweptBoxes,
  point: DisplayHandle,
  words: string,
): void {
  const hot = frame.hot === point.key
  rule(frame.ctx, point.x, boxes.zero, point.x, point.y, {
    colour: frame.colours.ink,
    alpha: INK.back,
  })
  handle(frame, point.x, point.y, { hot })
  // The words stand at the top, or at the foot when the point is up there itself.
  const { plot } = boxes
  if (hot) text(frame, words, plot.x + 2, point.y > plot.y + 18 ? plot.y + 8 : plot.y + plot.h - 3)
}

const signed = (percent: number): string => {
  const rounded = Math.round(percent)
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded)} %`
}

interface SweptState {
  lfo: Followed
  curve: Curve
  bounds: Bounds
  /** The Phaser's stage coefficients, one side at a time. */
  stages: Float32Array
}

const sweptState = (): SweptState => ({
  lfo: followed(),
  curve: curve(),
  bounds: bounds(),
  stages: new Float32Array(12),
})

/**
 * Where the LFO of a swept device is on this frame, and how far each side has
 * moved since the device last said where it was: `shape(now) − shape(then)`
 * for the left and the right side, which runs `lead` cycles ahead. A reading
 * carried on by it moves smoothly between two arrivals and still is the
 * device's own. Returns false while the display is not running.
 */
function trackSweep(
  frame: DisplayFrame<SweptState>,
  shape: number,
  lead: number,
  moved: [number, number],
): boolean {
  const { state } = frame
  const running = frame.powered && frame.hasMeter('phase') && frame.dt > 0
  if (running) followPhase(state.lfo, frame.meter('phase'), frame.value('rate'), frame.dt)
  const now = state.lfo.track?.phase ?? 0
  const then = state.lfo.track?.reading ?? 0
  moved[0] = sweepWave(shape, now) - sweepWave(shape, then)
  moved[1] = sweepWave(shape, now + lead) - sweepWave(shape, then + lead)
  return running
}

const MOVED: [number, number] = [0, 0]

// --- Flanger ----------------------------------------------------------------

/** Depth is the most the read point leaves Delay by, as a share of it: `kDepthScale` in `flanger.h`. */
const FLANGER_DEPTH = 0.95
/** The longest read the Flanger's line can make, in samples: `kLineSize` less the interpolator's margin. */
const FLANGER_MOST = 2044

/**
 * The delay one side of the Flanger is read at, in ms, with its LFO at
 * `sweep` (−1..1): `flanger.h`, `process`. Two samples is the shortest read.
 */
export function flangerDelayMs(
  delayMs: number,
  depthPercent: number,
  sweep: number,
  sampleRate: number,
): number {
  const samples = (delayMs * (1 + sweep * (depthPercent / 100) * FLANGER_DEPTH) * sampleRate) / 1000
  return (clamp(samples, 2, FLANGER_MOST) * 1000) / sampleRate
}

/**
 * What the Flanger does to a frequency, in dB, read at `delayMs`. From
 * `flanger.h`, `process`: wet[n] = line[n − D], line[n] = in[n] + feedback ·
 * wet[n − 1], out = in + (wet − in) · mix. The wet path is a delay of D
 * samples in a loop of D + 1.
 */
export function flangerDb(
  hz: number,
  delayMs: number,
  feedback: number,
  mix: number,
  sampleRate: number,
): number {
  const turn = (hz * TWO_PI * delayMs) / 1000
  return mixedDb(-turn, -turn - (hz * TWO_PI) / sampleRate, feedback, mix)
}

/**
 * The frequency from which a comb's teeth stand closer than `TEETH_APART`
 * pixels across a box: there `sampleResponse` gives its bounds.
 */
function teethMergeHz(delayMs: number, box: Box): number {
  return (box.w * 1000) / (TEETH_APART * delayMs * Math.log(FREQ_MAX / FREQ_MIN))
}

/** Where the comb's first notch stands for a delay: half a cycle fits in it. */
const firstNotchHz = (delayMs: number): number => 500 / delayMs

const flangerHandles = (view: DisplayView): DisplayHandle[] =>
  sweptHandles(view, 'delayMs', 'Delay and feedback', firstNotchHz, firstNotchHz)

const flanger = plateDisplay<SweptState>({
  place: 'window',
  columns: 2,
  // Rate is not among them: the sweep's place comes from the device, and Rate only carries it from one reading to the next.
  params: ['delayMs', 'depth', 'feedback', 'shape', 'stereo', 'mix'],
  live: { meters: true },
  info: 'The comb the Flanger cuts, from 20 Hz at the left to 20 kHz at the right: each dip is a notch, and they slide together as the delay sweeps. The shaded span is how far the first notch travels, and the line in it is where it is now. The point sets Delay across and Feedback up and down.',
  init: sweptState,
  draw(frame) {
    const { ctx, colours, state, sampleRate } = frame
    ground(frame)
    const boxes = sweptBoxes(frame)
    const { plot, zero } = boxes
    const delay = frame.value('delayMs')
    const depth = frame.value('depth')
    const shape = Math.round(frame.value('shape'))
    const feedback = frame.value('feedback') / 100
    const mix = frame.value('mix')
    const lead = frame.value('stereo') / 360
    const running = trackSweep(frame, shape, lead, MOVED)
    const phase = state.lfo.track?.phase ?? 0
    const swing = delay * (depth / 100) * FLANGER_DEPTH
    const most = (FLANGER_MOST * 1000) / sampleRate
    const side = (name: 'left' | 'right', moved: number, ahead: number): number => {
      const reading = running ? frame.meter(name) : 0
      // The device's own reading, carried on to this frame; at rest, where the shape would have it.
      return reading > 0
        ? clamp(reading + moved * swing, 2000 / sampleRate, most)
        : flangerDelayMs(delay, depth, sweepWave(shape, phase + ahead), sampleRate)
    }
    const left = side('left', MOVED[0], 0)
    const right = side('right', MOVED[1], lead)

    drawSweepRange(
      frame,
      boxes,
      firstNotchHz(flangerDelayMs(delay, depth, 1, sampleRate)),
      firstNotchHz(flangerDelayMs(delay, depth, -1, sampleRate)),
    )
    freqGrid(frame, plot)
    dbGrid(frame, plot, SWEPT_TOP_DB, SWEPT_FOOT_DB, 12)
    clipped(ctx, plot, () => {
      const comb = (ms: number) => (hz: number) => (-hz * TWO_PI * ms) / 1000
      if (Math.abs(right - left) > left * 0.004) {
        // The right side's comb, behind and fainter, as far as the teeth of both can be told apart.
        sampleResponse(state.curve, plot, sampleRate, comb(right), feedback, mix, 2)
        const { x, y, dense } = state.curve
        const until = xOfHz(teethMergeHz(left, plot), plot)
        let end = dense
        while (end > 0 && x[end - 1] > until) end -= 1
        strokeLine(ctx, x, y, 0, end, { colour: colours.ink, width: 1, alpha: INK.rule })
      }
      sampleResponse(state.curve, plot, sampleRate, comb(left), feedback, mix, 1, state.bounds)
      drawResponse(frame, state.curve, zero)
    })
    drawSweepNow(frame, boxes, firstNotchHz(left), firstNotchHz(right))
    const [point] = flangerHandles(frame)
    drawSweptHandle(
      frame,
      boxes,
      point,
      `${delay.toFixed(delay < 10 ? 1 : 0)} ms  ${signed(frame.value('feedback'))}`,
    )
  },
  handles: flangerHandles,
})

// --- Phaser -----------------------------------------------------------------

/** Depth at full swings the sweep this many octaves each way: `kSweepOctaves` in `phaser.h`. */
const PHASER_OCTAVES = 2.5

/** A stage's coefficient for a frequency: `allpass_coefficient` in `phaser_stage.h`, with its tangent. */
export function phaserCoefficient(hz: number, sampleRate: number): number {
  const x = (Math.PI * clamp(hz, 10, sampleRate * 0.45)) / sampleRate
  const x2 = x * x
  const n = x * (945 + x2 * (x2 - 105))
  const d = 945 + x2 * (15 * x2 - 420)
  return (n - d) / (n + d)
}

/**
 * The coefficients of a chain of `count` stages swept to `sweepHz`:
 * `Chain::tune` in `phaser.h`. Spread (0..1) lays them from that many octaves
 * under the sweep to as many over it.
 */
export function phaserTune(
  stages: Float32Array,
  count: number,
  sweepHz: number,
  spread: number,
  sampleRate: number,
): void {
  const step = Math.pow(2, (2 * spread) / (count - 1))
  let hz = sweepHz * Math.pow(2, -spread)
  for (let s = 0; s < count; s++) {
    stages[s] = phaserCoefficient(hz, sampleRate)
    hz *= step
  }
}

/**
 * How far a chain turns the phase of a frequency, in radians: nothing at the
 * foot of the spectrum, half a turn a stage at its top. A stage is
 * y[n] = a·x[n] + x[n−1] − a·y[n−1] (`phaser_stage.h`), whose turn is
 * −w + 2·atan(a·sin w / (1 + a·cos w)), which is −2·atan(k·tan(w/2)) with
 * k = (1 − a) / (1 + a). The turns of the stages add as the angles of the
 * numbers 1 + j·k·tan(w/2) do when they are multiplied, so the chain costs
 * one arctangent and not one a stage. Each factor turns less than a quarter,
 * so every time the product passes half a turn it is seen and counted.
 */
export function phaserTurn(
  stages: Float32Array,
  count: number,
  hz: number,
  sampleRate: number,
): number {
  const t = Math.tan((Math.PI * Math.min(hz, sampleRate * 0.499)) / sampleRate)
  let re = 1
  let im = 0
  let wholes = 0
  for (let s = 0; s < count; s++) {
    const q = (t * (1 - stages[s])) / (1 + stages[s])
    const turned = im + re * q
    re -= im * q
    if (im >= 0 && turned < 0) wholes += 1
    im = turned
  }
  return -2 * (Math.atan2(im, re) + wholes * TWO_PI)
}

/**
 * What the Phaser does to a frequency, in dB, swept to `sweepHz`. From
 * `phaser.h`, `Chain::process`: the chain is fed in + feedback · its own last
 * output, and out = in + (wet − in) · mix.
 */
export function phaserDb(
  hz: number,
  sweepHz: number,
  count: number,
  spread: number,
  feedback: number,
  mix: number,
  sampleRate: number,
): number {
  const stages = new Float32Array(count)
  phaserTune(stages, count, sweepHz, spread, sampleRate)
  const turn = phaserTurn(stages, count, hz, sampleRate)
  return mixedDb(turn, turn - (hz * TWO_PI) / sampleRate, feedback, mix)
}

const sameHz = (hz: number): number => hz

const phaserHandles = (view: DisplayView): DisplayHandle[] =>
  sweptHandles(view, 'centerHz', 'Centre and feedback', sameHz, sameHz)

const phaser = plateDisplay<SweptState>({
  place: 'window',
  columns: 2,
  // Rate is not among them: the sweep's place comes from the device, and Rate only carries it from one reading to the next.
  params: ['stages', 'centerHz', 'spread', 'feedback', 'depth', 'shape', 'stereo', 'mix'],
  live: { meters: true },
  info: 'What the Phaser does across the spectrum, from 20 Hz at the left to 20 kHz at the right: every two stages cut one notch, and the notches slide as the sweep moves. The shaded span is how far the sweep goes, and the line in it is where it is now. The point sets Centre across and Feedback up and down.',
  init: sweptState,
  draw(frame) {
    const { ctx, colours, state, sampleRate } = frame
    ground(frame)
    const boxes = sweptBoxes(frame)
    const { plot, zero } = boxes
    const count = 4 + 2 * clamp(Math.round(frame.value('stages')), 0, 4)
    const centre = frame.value('centerHz')
    const spread = frame.value('spread') / 100
    const octaves = (frame.value('depth') / 100) * PHASER_OCTAVES
    const shape = Math.round(frame.value('shape'))
    const feedback = frame.value('feedback') / 100
    const mix = frame.value('mix')
    const lead = frame.value('stereo') / 360
    const running = trackSweep(frame, shape, lead, MOVED)
    const phase = state.lfo.track?.phase ?? 0
    const side = (name: 'left' | 'right', moved: number, ahead: number): number => {
      const reading = running ? frame.meter(name) : 0
      // The device's own reading, carried on to this frame; at rest, where the shape would have it.
      return reading > 0
        ? reading * Math.pow(2, moved * octaves)
        : centre * Math.pow(2, sweepWave(shape, phase + ahead) * octaves)
    }
    const left = side('left', MOVED[0], 0)
    const right = side('right', MOVED[1], lead)

    drawSweepRange(frame, boxes, centre * Math.pow(2, -octaves), centre * Math.pow(2, octaves))
    freqGrid(frame, plot)
    dbGrid(frame, plot, SWEPT_TOP_DB, SWEPT_FOOT_DB, 12)
    clipped(ctx, plot, () => {
      const chain = (hz: number): number => phaserTurn(state.stages, count, hz, sampleRate)
      if (Math.abs(right - left) > left * 0.004) {
        // The right side's notches, behind and fainter.
        phaserTune(state.stages, count, right, spread, sampleRate)
        sampleResponse(state.curve, plot, sampleRate, chain, feedback, mix, 2)
        strokeLine(ctx, state.curve.x, state.curve.y, 0, state.curve.dense, {
          colour: colours.ink,
          width: 1,
          alpha: INK.rule,
        })
      }
      phaserTune(state.stages, count, left, spread, sampleRate)
      sampleResponse(state.curve, plot, sampleRate, chain, feedback, mix, 1)
      drawResponse(frame, state.curve, zero)
    })
    drawSweepNow(frame, boxes, left, right)
    const [point] = phaserHandles(frame)
    drawSweptHandle(frame, boxes, point, `${hzText(centre)}  ${signed(frame.value('feedback'))}`)
  },
  handles: phaserHandles,
})

// --- Rotary -----------------------------------------------------------------

type RotorKind = 'horn' | 'drum'

/** What `rotary.h` turns its rotors at, Slow and Fast, in Hz: `kHornHz` and `kDrumHz`. */
const ROTOR_HZ: Record<RotorKind, readonly [number, number]> = {
  horn: [0.8, 6.7],
  drum: [0.67, 5.8],
}
/** Where the rotors stand when the device starts, in cycles. */
const ROTOR_START: Record<RotorKind, number> = { horn: 0, drum: 0.37 }
/** The horn's angle rises as it turns; the drum goes the other way. */
const ROTOR_WAY: Record<RotorKind, 1 | -1> = { horn: 1, drum: -1 }
/** A microphone stands this far off the front at full Spread, in cycles: half of `kMaxMicCycles`. */
const ROTARY_MIC = 0.2
/**
 * The most of the past a rotor's level is drawn over (less when it turns
 * fast: `scopeSpanSec`), and in how many steps it is kept.
 */
const ROTARY_PAST_SEC = 1.5
const ROTARY_SLOTS = 90
/** The microphones as they are drawn: the right one first, behind, where Spread sets it apart. */
const TWO_MICS: readonly (-1 | 1)[] = [1, -1]
const ONE_MIC: readonly (-1 | 1)[] = [-1]
/** The level at the top of a rotor's scope: over the loudest a swing's make-up reaches. */
const ROTARY_TOP = 1.5

/**
 * How far a rotor's level swings at a microphone, 0..1: `control` in
 * `rotary.h` (`horn_am`, `drum_am`). A microphone further off hears less of it.
 */
export function rotarySwing(kind: RotorKind, depth: number, distance: number): number {
  return kind === 'horn' ? depth * 0.75 * (1 - 0.6 * distance) : depth * 0.5 * (1 - 0.5 * distance)
}

/**
 * The gain a microphone gets from a rotor that points `angle` cycles off the
 * front: `process` in `rotary.h`. `side` is −1 for the left microphone and 1
 * for the right; they stand Spread · 0.2 of a turn off the front for the horn
 * and half as far for the drum. Full when the rotor faces the microphone,
 * 1 − swing when it faces away, times the make-up that keeps the mean power
 * (`swing_makeup`).
 */
export function rotaryGain(
  kind: RotorKind,
  angle: number,
  side: -1 | 1,
  swing: number,
  spread: number,
): number {
  const mic = side * ROTARY_MIC * spread * (kind === 'horn' ? 1 : 0.5)
  const towards = Math.cos((angle - mic) * TWO_PI)
  const mean = 1 - 0.5 * swing
  const makeup = 1 / Math.sqrt(mean * mean + 0.125 * swing * swing)
  return (1 - swing * (0.5 - 0.5 * towards)) * makeup
}

/**
 * An angle over the last so many seconds, in cycles and never wrapped, kept
 * by the clock as the kit's `History` keeps a level. A rotor turns evenly
 * between two frames, so the steps a frame skipped lie on the line between,
 * and a level read from them is smooth however fast the rotor turns.
 */
class Turns {
  private readonly values: Float64Array
  private head = 0
  private lastSlot: number | null = null

  constructor(
    readonly seconds: number,
    readonly slots: number,
  ) {
    this.values = new Float64Array(slots)
  }

  get empty(): boolean {
    return this.lastSlot === null
  }

  push(now: number, angle: number): void {
    const slot = Math.floor((now / this.seconds) * this.slots)
    const newest = (this.head + this.slots - 1) % this.slots
    if (this.lastSlot === null || slot - this.lastSlot >= this.slots) {
      // Nothing is known of the time before: the rotor is drawn as standing here.
      this.values.fill(angle)
    } else if (slot <= this.lastSlot) {
      this.values[newest] = angle
    } else {
      const steps = slot - this.lastSlot
      const from = this.values[newest]
      for (let i = 1; i <= steps; i++) {
        this.values[this.head] = from + ((angle - from) * i) / steps
        this.head = (this.head + 1) % this.slots
      }
    }
    this.lastSlot = slot
  }

  /** The angle `back` steps ago, between two steps where `back` is not whole; 0 is the newest. */
  at(back: number): number {
    const whole = Math.min(this.slots - 1, Math.floor(back))
    const next = Math.min(this.slots - 1, whole + 1)
    const a = this.values[(this.head + this.slots * 2 - 1 - whole) % this.slots]
    const b = this.values[(this.head + this.slots * 2 - 1 - next) % this.slots]
    return a + (b - a) * clamp(back - whole, 0, 1)
  }

  clear(): void {
    this.lastSlot = null
  }
}

interface Rotor {
  track: PhaseTrack | null
  /** Where it points, in cycles, never wrapped. */
  turn: number
  past: Turns
}

interface RotaryState {
  horn: Rotor
  drum: Rotor
  kept: Line
  /** The angles the device last reported, and for how long they have been the same. */
  hornAt: number
  drumAt: number
  stoodFor: number
}

/** Rotors that have not moved for this long stand: braked to rest, or the device sleeps on silence. */
const ROTARY_STANDS_SEC = 0.15

const rotor = (kind: RotorKind): Rotor => ({
  track: null,
  turn: ROTOR_START[kind],
  past: new Turns(ROTARY_PAST_SEC, ROTARY_SLOTS),
})

/**
 * Follow a rotor from the device's readings of its angle and speed: carried
 * forward at its speed between two arrivals, as `trackPhase` does for an LFO
 * (which counts upward, so the drum is followed in a mirror).
 */
function followRotor(
  kept: Rotor,
  kind: RotorKind,
  angle: number,
  hz: number,
  frame: DisplayFrame,
): void {
  const way = ROTOR_WAY[kind]
  const before = kept.track ? way * kept.track.phase : null
  kept.track = trackPhase(kept.track, wrap(way * angle), Math.max(0, hz), frame.dt)
  const expected = way * Math.max(0, hz) * frame.dt
  const here = way * kept.track.phase
  // The whole turns are counted from how far it should have gone, so a fast rotor is never taken to go backwards.
  kept.turn =
    before === null ? wrap(here) : kept.turn + expected + shortWay(here - before - expected)
  kept.past.push(frame.now, kept.turn)
}

interface RotorBoxes {
  /** The rotor seen from above: its centre and how far it reaches. */
  cx: number
  cy: number
  radius: number
  /** The level its microphones hear, over time. */
  scope: Box
}

function rotorBoxes(view: Pick<DisplayView, 'width' | 'height'>, row: 0 | 1): RotorBoxes {
  const height = (view.height - 12) / 2
  const y = 4 + row * (height + 4)
  const radius = clamp(Math.floor(height / 2) - 8, 6, 16)
  const disc = 2 * radius + 18
  return {
    cx: 4 + disc / 2,
    cy: y + radius + 2,
    radius,
    scope: { x: 4 + disc + 2, y, w: view.width - 10 - disc, h: height },
  }
}

/**
 * The one point of the Rotary's display: the horn's left microphone, which
 * stands still while the rotors turn. Taken round the horn it sets Spread:
 * at the front the two microphones are one, a fifth of a turn off it they are
 * as far apart as they go. Past either end the nearer one holds, as far as
 * the place opposite the middle of the travel.
 */
function rotaryHandles(view: DisplayView): DisplayHandle[] {
  const { cx, cy, radius } = rotorBoxes(view, 0)
  const spread = view.value('spread')
  const spec = view.spec('spread')
  const mic = -ROTARY_MIC * spread * TWO_PI
  const reach = radius + 4 + 3 * view.value('distance')
  const x = cx + reach * Math.sin(mic)
  const y = cy + reach * Math.cos(mic)
  return [
    {
      key: 'spread',
      name: 'Spread',
      x,
      y,
      drag: (toX, toY) => {
        if (Math.abs(toX - x) < 1e-6 && Math.abs(toY - y) < 1e-6) return { spread }
        // How far round to the left of the front, which is down the display, in turns.
        const turn = wrap(Math.atan2(cx - toX, toY - cy) / TWO_PI)
        const most = spec?.max ?? 1
        if (turn <= ROTARY_MIC) return { spread: clamp((turn / ROTARY_MIC) * most, 0, most) }
        return { spread: turn < 0.5 + ROTARY_MIC / 2 ? most : (spec?.min ?? 0) }
      },
      reset: () => ({ spread: spec?.default ?? spread }),
    },
  ]
}

function drawRotor(
  frame: DisplayFrame<RotaryState>,
  kind: RotorKind,
  kept: Rotor,
  /** The speed it turns at now, and the one it is on its way to, in Hz. */
  hz: number,
  target: number,
  running: boolean,
): void {
  const { ctx, colours, state } = frame
  const { cx, cy, radius, scope } = rotorBoxes(frame, kind === 'horn' ? 0 : 1)
  const depth = frame.value(kind === 'horn' ? 'hornDepth' : 'drumDepth')
  const distance = frame.value('distance')
  const spread = frame.value('spread')
  const swing = rotarySwing(kind, depth, distance)
  const way = ROTOR_WAY[kind]
  const angle = kept.turn

  // From above: the path of the rotor, and the part of it that throws the sound.
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, TWO_PI)
  ctx.globalAlpha = INK.back
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.stroke()
  // Canvas angles run from the right, clockwise; the front is down.
  const facing = Math.PI / 2 - angle * TWO_PI
  ctx.beginPath()
  if (kind === 'horn') {
    // The horn: a flare from the hub, longer the further Depth swings its mouth.
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius * (0.4 + 0.6 * depth), facing - 0.5, facing + 0.5)
  } else {
    // The drum: a scoop in its rim, wider with Depth.
    const half = 0.5 + 0.7 * depth
    ctx.arc(cx, cy, radius - 2, facing - half, facing + half)
  }
  ctx.closePath()
  ctx.globalAlpha = 1
  ctx.fillStyle = colours.accent
  ctx.fill()
  dot(ctx, cx, cy, 1.5, colours.ink)
  // The two microphones in front: further out with Distance, further apart with Spread.
  const sides = spread > 0.005 ? TWO_MICS : ONE_MIC
  for (const side of sides) {
    // `side` cycles off the front, which is down the display.
    const mic = side * ROTARY_MIC * spread * (kind === 'horn' ? 1 : 0.5) * TWO_PI
    const reach = radius + 4 + 3 * distance
    // The horn's left microphone is the point that sets Spread: a ring round it.
    if (kind === 'horn' && side === -1) {
      const [point] = rotaryHandles(frame)
      handle(frame, point.x, point.y, { hot: frame.hot === point.key, radius: 3 })
    }
    dot(ctx, cx + reach * Math.sin(mic), cy + reach * Math.cos(mic), 1.75, colours.ink, {
      alpha: side === -1 ? 1 : INK.back,
    })
  }

  // Beside it: the level each microphone gets, the last moments up to now at the right.
  const top = scope.y + 2
  const foot = scope.y + scope.h
  const level = (gain: number): number => foot - (gain / ROTARY_TOP) * (foot - top)
  rule(ctx, scope.x, level(1), scope.x + scope.w, level(1), {
    colour: colours.ink,
    alpha: INK.grid,
  })
  // A point a pixel: the span is short enough for that when the rotor is fast.
  const steps = Math.max(2, Math.round(scope.w))
  const span = scopeSpanSec(hz, ROTARY_PAST_SEC)
  const perSlot = ROTARY_PAST_SEC / ROTARY_SLOTS
  room(state.kept, steps + 1)
  const nowX = scope.x + scope.w - 3
  clipped(ctx, scope, () => {
    for (const side of sides) {
      for (let i = 0; i <= steps; i++) {
        const back = (1 - i / steps) * span
        // What it did, where that is known; at rest, what it would do at its speed.
        const then =
          running && !kept.past.empty ? kept.past.at(back / perSlot) : angle - way * hz * back
        state.kept.x[i] = scope.x + (i / steps) * (nowX - scope.x)
        state.kept.y[i] = level(rotaryGain(kind, then, side, swing, spread))
      }
      strokeLine(ctx, state.kept.x, state.kept.y, 0, steps + 1, {
        colour: colours.ink,
        width: side === -1 ? 1.5 : 1,
        alpha: side === -1 ? 1 : INK.rule,
      })
    }
  })
  for (const side of sides) {
    dot(
      ctx,
      nowX,
      level(rotaryGain(kind, angle, side, swing, spread)),
      side === -1 ? 2.5 : 1.75,
      colours.accent,
      { ring: side === -1 ? colours.ink : undefined },
    )
  }
  // Which rotor, and how fast it turns; an arrow while it is on its way to another speed.
  text(frame, `${kind === 'horn' ? 'HORN' : 'DRUM'}  ${hz.toFixed(1)} Hz`, scope.x + 1, foot - 2)
  const change = target - hz
  if (running && Math.abs(change) > 0.03 + 0.02 * target) {
    const x = scope.x + scope.w - 9
    const tip = change > 0 ? foot - 8 : foot - 2
    const base = change > 0 ? foot - 3 : foot - 7
    ctx.beginPath()
    ctx.moveTo(x, tip)
    ctx.lineTo(x + 3, base)
    ctx.lineTo(x - 3, base)
    ctx.closePath()
    ctx.fillStyle = colours.accent
    ctx.fill()
  }
}

const rotary = plateDisplay<RotaryState>({
  place: 'window',
  columns: 2,
  params: ['speed', 'hornDepth', 'drumDepth', 'distance', 'spread'],
  live: { meters: true, fps: 60 },
  info: 'The cabinet from above: the horn, then the drum, each turning at its own speed past the two microphones in front. Beside each is the level its microphones got over the last moments, the right one fainter. An arrow is a rotor changing speed. The ringed microphone sets Spread.',
  init: () => ({
    horn: rotor('horn'),
    drum: rotor('drum'),
    kept: line(),
    hornAt: 0,
    drumAt: 0,
    stoodFor: 0,
  }),
  draw(frame) {
    const { state } = frame
    ground(frame)
    const speed = clamp(Math.round(frame.value('speed')), 0, 2)
    const live = frame.powered && frame.hasMeter('hornAngle') && frame.dt > 0
    const hornAt = live ? frame.meter('hornAngle') : 0
    const drumAt = live ? frame.meter('drumAngle') : 0
    // The device turns its rotors only while it has sound to work on. While
    // they stand, the display is at rest too: it shows what they would do.
    state.stoodFor =
      live && hornAt === state.hornAt && drumAt === state.drumAt ? state.stoodFor + frame.dt : 0
    state.hornAt = hornAt
    state.drumAt = drumAt
    // Until the first reading arrives every one of them is nothing.
    const turning = live && (hornAt !== 0 || drumAt !== 0) && state.stoodFor < ROTARY_STANDS_SEC
    for (const kind of ['horn', 'drum'] as const) {
      const kept = state[kind]
      const target = speed === 2 ? 0 : ROTOR_HZ[kind][speed]
      // A rotor that stands takes up again at the speed it had, when it had one.
      const reading = live ? frame.meter(kind === 'horn' ? 'hornSpeed' : 'drumSpeed') : 0
      const hz = turning || reading > 0 ? reading : target
      if (turning) followRotor(kept, kind, kind === 'horn' ? hornAt : drumAt, hz, frame)
      else {
        // What was kept is of another time: begin again when it turns, from
        // where the device has the rotor now.
        kept.past.clear()
        kept.track = null
        if (live && (hornAt !== 0 || drumAt !== 0)) kept.turn = kind === 'horn' ? hornAt : drumAt
      }
      drawRotor(frame, kind, kept, hz, target, turning)
    }
  },
  handles: rotaryHandles,
})

export const MODULATION_FACES: Readonly<Record<string, PlateFace>> = {
  tremolo: {
    display: tremolo,
    face: ['rate', 'depth', 'shape', 'mode'],
  },
  chorus: {
    display: chorus,
    face: ['voices', 'rate', 'depth', 'spread'],
  },
  // Delay and Feedback are the point on the display.
  flanger: {
    display: flanger,
    face: ['rate', 'depth', 'shape', 'mix'],
  },
  // Centre and Feedback are the point on the display.
  phaser: {
    display: phaser,
    face: ['rate', 'depth', 'stages', 'mix'],
  },
  rotary: {
    display: rotary,
    face: ['speed', 'hornDepth', 'drumDepth', 'drive'],
    labels: { hornDepth: 'Horn', drumDepth: 'Drum', acceleration: 'Accel' },
  },
}
