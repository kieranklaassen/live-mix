// Displays of the devices an LFO moves: the modulation as it runs, the last
// moments at the left of a mark that stands for now and the next ones at its
// right, drawn from the same shapes the device computes and kept in step with
// it by the phase the device reports.

import {
  History,
  INK,
  clipped,
  dot,
  ground,
  rule,
  text,
  trace,
  trackPhase,
  type Box,
  type PhaseTrack,
  type Point,
} from '../display-kit'
import { plateDisplay, type DisplayFrame, type PlateFace } from '../plate-display'

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

const tremolo = plateDisplay<TremoloState>({
  place: 'strip',
  params: ['mode', 'rate', 'depth', 'shape', 'phase', 'smooth', 'mix'],
  live: { meters: true, fps: 60 },
  info: 'The modulation over two seconds, running to the left: the mark is now, with what has been at its left and what comes next at its right. Up is louder for Tremolo, left for Pan, the low band for Harmonic and sharp for Vibrato. A second, fainter line is the right side when Stereo Phase sets it apart.',
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
      // Pan and Vibrato swing about the middle.
      return middle - depth * m * (box.h / 2)
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
      text(frame, high, box.x + box.w, box.y + 6, { align: 'right', size: 7, alpha: INK.back })
      text(frame, low, box.x + box.w, foot, { align: 'right', size: 7, alpha: INK.back })
    }
  },
})

export const MODULATION_FACES: Readonly<Record<string, PlateFace>> = {
  tremolo: {
    display: tremolo,
    face: ['rate', 'depth', 'shape', 'mode'],
  },
}
