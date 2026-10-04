// A plate's display: a small canvas that shows what the device is doing while
// it does it. Where a picture (`PlatePicture`) is drawn once from the knobs, a
// display is drawn on frames from three things: the parameters, the device's
// own readings (`MeteredDevice`: a compressor's gain reduction, an LFO's
// phase) and the sound going in and coming out (two analysers the plate hangs
// on the device while the display is in view). It is a canvas so nothing is
// laid out per frame, and it runs only while it can be seen.
//
// This file is the contract and the parts that do not draw: the types, the one
// frame loop every display shares, and the taps. `display-kit.ts` has the
// drawing the displays share, `displays/` the displays, `PlateDisplay.tsx` the
// component that runs one.

import { type ParamSpec } from '../../core/params'
import { defaultFrameScheduler, type FrameScheduler } from '../frame'

/**
 * Where a display stands on its plate.
 * - `strip`: under a row of four knobs, 184 by 48 on a plate 240 wide. For
 *   things that happen in time: a delay's repeats, a reverb's tail, an LFO.
 * - `window`: beside the knobs at the plate's full working height, 100 high
 *   and 80, 128 or 176 wide on a plate 280 wide, with the knobs in two rows.
 *   For things with two axes: an EQ's curve, a compressor's transfer curve.
 */
export type DisplayPlace = 'strip' | 'window'

/** The plate's three colours as the canvas can paint them. */
export interface DisplayColours {
  plate: string
  ink: string
  accent: string
}

/** The level of one side of the device over the latest window of about 40 ms. */
export interface DisplayLevel {
  /** Highest sample, linear (1 is full scale). */
  peak: number
  /** Root mean square, linear. */
  rms: number
  /**
   * The samples themselves, oldest first: the window the two numbers above
   * were taken from. The same array is written again on the next frame, so a
   * display reads it while it draws and does not keep it.
   */
  wave: Float32Array
}

/** The sound at the device, read once per frame. */
export interface DisplaySignal {
  /** What goes in; null when the plate was not told what feeds the device. */
  input: DisplayLevel | null
  /** What comes out. */
  output: DisplayLevel
  /**
   * The output's spectrum in dB per bin (bin `i` is `i * binHz`), smoothed by
   * the analyser; null unless the display asks for `spectrum`.
   */
  spectrum: Float32Array | null
  binHz: number
  /**
   * What comes out, one side at a time, for a display that shows width or
   * balance; null unless the display asks for `stereo`. A mono sound is the
   * same on both sides.
   */
  left: DisplayLevel | null
  right: DisplayLevel | null
}

/** What a display may read without a canvas: enough to lay out its handles. */
export interface DisplayView {
  /** The display's size in CSS pixels; a display draws to whatever it is given. */
  width: number
  height: number
  /** A parameter's position, 0..1 under its taper; 0 for a name the device lacks. */
  at(param: string): number
  /** A parameter's value in its own unit; 0 for a name the device lacks. */
  value(param: string): number
  /** A parameter's spec, for its range; undefined for a name the device lacks. */
  spec(param: string): ParamSpec | undefined
}

/** Everything a display is given to draw one frame. */
export interface DisplayFrame<S = unknown> extends DisplayView {
  /** Scaled so that one unit is one CSS pixel; cleared before `draw`. */
  ctx: CanvasRenderingContext2D
  colours: DisplayColours
  /** The font the plate's words are set in, for `ctx.font`. */
  fontFamily: string
  /**
   * One of the device's own readings by name; 0 for a device without it, and
   * until the first reading arrives. They arrive 30 times a second.
   */
  meter(name: string): number
  /** Whether the device has that reading at all. */
  hasMeter(name: string): boolean
  /** The sound at the device; null while the display is not running (off, out of view, no audio). */
  signal: DisplaySignal | null
  /** Seconds on a clock that only runs forward; for motion the device does not report. */
  now: number
  /** Seconds since the frame before; 0 on the first frame and on a still draw. */
  dt: number
  /** False while the device is bypassed: draw what it would do, without motion. */
  powered: boolean
  sampleRate: number
  /** The handle under the pointer or in hand, by key; null for none. */
  hot: string | null
  /** True while a handle is being dragged. */
  dragging: boolean
  /** What the display keeps between frames (a history); made by `init`. */
  state: S
}

/** A point on a display that can be dragged, and what dragging it sets. */
export interface DisplayHandle {
  key: string
  /** What it is, for the info view: "Band 2", "Threshold". */
  name: string
  /** Where it stands, in the display's pixels. */
  x: number
  y: number
  /**
   * The parameters a drag to (x, y) sets, by name, in their own units. The
   * plate clamps them and writes them as one undo step per drag.
   */
  drag(x: number, y: number): Readonly<Record<string, number>>
  /** What a turn of the wheel over the handle sets (an EQ band's width); `steps` is positive for up. */
  wheel?(steps: number): Readonly<Record<string, number>>
  /** What a double press sets: the parameters back where the device starts. Left out, a double press does nothing. */
  reset?(): Readonly<Record<string, number>>
}

export interface PlateDisplay<S = unknown> {
  place: DisplayPlace
  /**
   * Window only: how many columns of two knobs stand beside it on the face (1,
   * 2 or 3; default 2). Fewer knobs leave a wider window: 176, 128 or 80 px.
   */
  columns?: 1 | 2 | 3
  /** The parameters the display reads. A still display is drawn again only when one of them moves. */
  params: readonly string[]
  /**
   * What it follows while it runs. Left out, the display is still: drawn from
   * the parameters alone, like a picture, and it costs nothing while it sits.
   */
  live?: {
    /** Reads the device's own readings (`frame.meter`). */
    meters?: boolean
    /** Reads the levels going in and coming out (`frame.signal`). */
    signal?: boolean
    /** Reads the output's spectrum too (`frame.signal.spectrum`). */
    spectrum?: boolean
    /** Reads the output's two sides apart too (`frame.signal.left` and `right`). */
    stereo?: boolean
    /** Frames per second: 30 unless something small moves fast enough to need 60. */
    fps?: 30 | 60
    /**
     * Seconds of silence, in and out, after which it stands still until sound
     * comes again: 8 unless it has more of the past than that to show.
     */
    settle?: number
  }
  /** One or two sentences for the info view: what the display shows and how to read it. */
  info: string
  init?: () => S
  draw(frame: DisplayFrame<S>): void
  /** The points that can be dragged, where they stand now. Left out, the display is only looked at. */
  handles?: (view: DisplayView) => readonly DisplayHandle[]
}

/** What the kit says about one device's plate beyond its colours: its display, and the knobs that stand with it. */
export interface PlateFace {
  display: PlateDisplay
  /** The knobs on the face, in order: four over a strip, two for each column beside a window. */
  face?: readonly string[]
  /** Shorter words for a knob than its parameter's name; only where the name does not fit. */
  labels?: Readonly<Record<string, string>>
}

/** Keeps the type of a display's state between `init` and `draw`. */
export function plateDisplay<S>(display: PlateDisplay<S>): PlateDisplay {
  return display
}

/** A strip's size on a plate with its face knobs, and a window's height. */
export const DISPLAY_STRIP_WIDTH = 184
export const DISPLAY_STRIP_HEIGHT = 48
export const DISPLAY_WINDOW_HEIGHT = 100

/** A window's width beside so many columns of knobs, on a plate 280 wide. */
export function displayWindowWidth(columns: number): number {
  return 224 - 48 * Math.min(3, Math.max(1, Math.round(columns)))
}

// --- The frame loop ---------------------------------------------------------

type FrameListener = (nowMs: number) => void

/** The displays on one frame source, and the frame they wait for. */
interface FrameLoop {
  listeners: Set<FrameListener>
  handle: unknown
  waiting: boolean
}

const frameLoops = new Map<FrameScheduler, FrameLoop>()

function ask(scheduler: FrameScheduler, loop: FrameLoop): void {
  loop.waiting = true
  loop.handle = scheduler.request((nowMs) => {
    loop.waiting = false
    for (const listener of [...loop.listeners]) listener(nowMs)
    if (loop.listeners.size > 0 && !loop.waiting) ask(scheduler, loop)
  })
}

/**
 * Call `listener` on every frame until the returned function is called.
 * Every display on one frame source (the provider's, or the page's own)
 * shares one loop, and the loop stops when the last of them leaves.
 */
export function onDisplayFrame(
  listener: FrameListener,
  scheduler: FrameScheduler = defaultFrameScheduler,
): () => void {
  let loop = frameLoops.get(scheduler)
  if (!loop) {
    loop = { listeners: new Set(), handle: null, waiting: false }
    frameLoops.set(scheduler, loop)
  }
  loop.listeners.add(listener)
  if (!loop.waiting) ask(scheduler, loop)
  const joined = loop
  return () => {
    joined.listeners.delete(listener)
    if (joined.listeners.size > 0) return
    if (joined.waiting) scheduler.cancel(joined.handle)
    joined.waiting = false
    frameLoops.delete(scheduler)
  }
}

/** How many displays are running now; for a test or a measurement. */
export function runningDisplays(): number {
  let count = 0
  for (const loop of frameLoops.values()) count += loop.listeners.size
  return count
}

// --- Taps -------------------------------------------------------------------

/** About 43 ms at 48 kHz: longer than a frame at 30 fps, so no peak falls between two readings. */
const TAP_WINDOW = 2048

/**
 * One analyser hung on a node. It takes nothing from the sound and adds
 * nothing to it. A chain may cut every connection of the node it hangs on
 * when the chain changes, so `mend` connects it again; connecting twice is
 * the same as once.
 */
class Tap {
  private readonly analyser: AnalyserNode
  private readonly wave: Float32Array<ArrayBuffer>
  private bins: Float32Array<ArrayBuffer> | null = null

  constructor(
    private readonly context: BaseAudioContext,
    private readonly node: AudioNode,
    spectrum: boolean,
    /** Which output of `node` to read: a splitter's left (0) or right (1). */
    private readonly side = 0,
  ) {
    this.analyser = context.createAnalyser()
    this.analyser.fftSize = TAP_WINDOW
    this.analyser.smoothingTimeConstant = 0.7
    this.wave = new Float32Array(TAP_WINDOW)
    if (spectrum) this.bins = new Float32Array(this.analyser.frequencyBinCount)
    this.mend()
  }

  mend(): void {
    try {
      this.node.connect(this.analyser, this.side)
    } catch {
      // The node is gone with its device; the display goes with it.
    }
  }

  level(): DisplayLevel {
    this.analyser.getFloatTimeDomainData(this.wave)
    let peak = 0
    let sum = 0
    for (const sample of this.wave) {
      const size = sample < 0 ? -sample : sample
      if (size > peak) peak = size
      sum += sample * sample
    }
    // A bad sample upstream must not stop a display for good.
    return {
      peak: Number.isFinite(peak) ? peak : 0,
      rms: Number.isFinite(sum) ? Math.sqrt(sum / this.wave.length) : 0,
      wave: this.wave,
    }
  }

  /** Whether anything louder than `floor` is on the node now: the cheapest thing a tap can say. */
  heard(floor: number): boolean {
    this.analyser.getFloatTimeDomainData(this.wave)
    for (const sample of this.wave) if (sample > floor || sample < -floor) return true
    return false
  }

  spectrum(): Float32Array | null {
    if (!this.bins) return null
    this.analyser.getFloatFrequencyData(this.bins)
    return this.bins
  }

  get binHz(): number {
    return this.context.sampleRate / this.analyser.fftSize
  }

  release(): void {
    try {
      this.node.disconnect(this.analyser, this.side)
    } catch {
      // Already cut by the chain.
    }
  }
}

/**
 * The two sides of a node apart. A node that puts out one channel is heard
 * on both sides, so it is read on both: the gain in front takes the sound as
 * speakers would.
 */
class Sides {
  private readonly both: GainNode
  private readonly splitter: ChannelSplitterNode
  readonly left: Tap
  readonly right: Tap

  constructor(
    context: BaseAudioContext,
    private readonly node: AudioNode,
  ) {
    this.both = context.createGain()
    this.both.channelCount = 2
    this.both.channelCountMode = 'explicit'
    this.both.channelInterpretation = 'speakers'
    this.splitter = context.createChannelSplitter(2)
    this.both.connect(this.splitter)
    this.left = new Tap(context, this.splitter, false, 0)
    this.right = new Tap(context, this.splitter, false, 1)
    this.mend()
  }

  mend(): void {
    try {
      this.node.connect(this.both)
    } catch {
      // The node is gone with its device.
    }
  }

  release(): void {
    try {
      this.node.disconnect(this.both)
    } catch {
      // Already cut by the chain.
    }
    this.left.release()
    this.right.release()
    this.both.disconnect()
  }
}

/** What a display asks its taps for beyond the two levels. */
export interface DisplayTapOptions {
  spectrum?: boolean
  stereo?: boolean
}

/** The taps of one display: on what feeds the device, when that is known, and on what it puts out. */
export class DisplayTaps {
  private constructor(
    private readonly input: Tap | null,
    private readonly output: Tap,
    private readonly sides: Sides | null,
  ) {}

  /**
   * Null where analysers cannot be made (a context without them). `context`
   * is the one the device lives in; a node says which made it, and where it
   * does not (a test's stand-in) the caller does.
   */
  static open(
    source: AudioNode | null | undefined,
    output: AudioNode,
    options: DisplayTapOptions = {},
    context: BaseAudioContext | null = null,
  ): DisplayTaps | null {
    try {
      const made = (output.context as BaseAudioContext | undefined) ?? context
      if (typeof made?.createAnalyser !== 'function') return null
      const out = new Tap(made, output, options.spectrum === true)
      let sides: Sides | null = null
      if (options.stereo) {
        try {
          sides = new Sides(made, output)
        } catch {
          // No splitter here: the display has the two levels and not the two sides.
        }
      }
      return new DisplayTaps(source ? new Tap(made, source, false) : null, out, sides)
    } catch {
      return null
    }
  }

  read(): DisplaySignal {
    return {
      input: this.input ? this.input.level() : null,
      output: this.output.level(),
      spectrum: this.output.spectrum(),
      binHz: this.output.binHz,
      left: this.sides ? this.sides.left.level() : null,
      right: this.sides ? this.sides.right.level() : null,
    }
  }

  /** Whether there is sound at the device, going in or coming out, louder than `floor`. */
  heard(floor: number): boolean {
    return this.output.heard(floor) || (this.input?.heard(floor) ?? false)
  }

  mend(): void {
    this.input?.mend()
    this.output.mend()
    this.sides?.mend()
  }

  release(): void {
    this.input?.release()
    this.output.release()
    this.sides?.release()
  }
}
