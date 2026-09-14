// Seconds ↔ beats/bars. Seconds stay the engine's primary unit (KD5); the
// tempo map is a view layered over the clock for the grid, warping and
// quantised launches. Piecewise-constant tempo: each segment starts at a
// timeline second with a BPM and a meter, so both directions are closed-form.

export interface TempoSegment {
  /** Timeline second the segment starts at. The first segment starts at 0. */
  atSec: number
  bpm: number
  /** Beats per bar from this point on. Default 4. */
  beatsPerBar?: number
}

export interface BarBeat {
  /** 0-based bar index. */
  bar: number
  /** 0-based beat within the bar, fractional. */
  beat: number
}

export type QuantizeGrid = 'beat' | 'bar' | number

interface ResolvedSegment {
  atSec: number
  atBeat: number
  atBar: number
  bpm: number
  beatsPerBar: number
  secondsPerBeat: number
}

export const DEFAULT_BPM = 120
export const DEFAULT_BEATS_PER_BAR = 4

export class TempoMap {
  private readonly segments: ResolvedSegment[]

  constructor(segments: readonly TempoSegment[] = [{ atSec: 0, bpm: DEFAULT_BPM }]) {
    if (segments.length === 0) throw new Error('live-mix: a TempoMap needs at least one segment')
    const sorted = [...segments].sort((a, b) => a.atSec - b.atSec)
    if (sorted[0].atSec !== 0) throw new Error('live-mix: the first tempo segment must start at 0')
    const resolved: ResolvedSegment[] = []
    let atBeat = 0
    let atBar = 0
    let previous: ResolvedSegment | null = null
    for (const segment of sorted) {
      if (!(segment.bpm > 0) || !Number.isFinite(segment.bpm)) {
        throw new Error(`live-mix: tempo segment at ${segment.atSec}s needs a positive bpm`)
      }
      const beatsPerBar = segment.beatsPerBar ?? previous?.beatsPerBar ?? DEFAULT_BEATS_PER_BAR
      if (!(beatsPerBar > 0)) throw new Error('live-mix: beatsPerBar must be positive')
      if (previous) {
        const beats = (segment.atSec - previous.atSec) / previous.secondsPerBeat
        atBeat = previous.atBeat + beats
        atBar = previous.atBar + beats / previous.beatsPerBar
      }
      const current: ResolvedSegment = {
        atSec: segment.atSec,
        atBeat,
        atBar,
        bpm: segment.bpm,
        beatsPerBar,
        secondsPerBeat: 60 / segment.bpm,
      }
      resolved.push(current)
      previous = current
    }
    this.segments = resolved
  }

  /** A constant-tempo map. */
  static constant(bpm: number, beatsPerBar = DEFAULT_BEATS_PER_BAR): TempoMap {
    return new TempoMap([{ atSec: 0, bpm, beatsPerBar }])
  }

  /** The tempo in force at `sec`. */
  bpmAt(sec: number): number {
    return this.segmentAtSec(sec).bpm
  }

  beatsPerBarAt(sec: number): number {
    return this.segmentAtSec(sec).beatsPerBar
  }

  /** Continuous beat position (0 at the timeline origin). */
  secondsToBeats(sec: number): number {
    const segment = this.segmentAtSec(sec)
    return segment.atBeat + (sec - segment.atSec) / segment.secondsPerBeat
  }

  beatsToSeconds(beat: number): number {
    const segment = this.segmentAtBeat(beat)
    return segment.atSec + (beat - segment.atBeat) * segment.secondsPerBeat
  }

  /** Bar and beat-in-bar at `sec`, both 0-based, the beat fractional. */
  barBeatAt(sec: number): BarBeat {
    const segment = this.segmentAtSec(sec)
    const beatsIn = (sec - segment.atSec) / segment.secondsPerBeat
    const barsFloat = segment.atBar + beatsIn / segment.beatsPerBar
    let bar = Math.floor(barsFloat + 1e-9)
    let beat = (barsFloat - bar) * segment.beatsPerBar
    if (beat < 1e-7) beat = 0
    if (segment.beatsPerBar - beat < 1e-7) {
      beat = 0
      bar += 1
    }
    return { bar, beat }
  }

  /** Timeline second where `bar` (0-based) begins. */
  barToSeconds(bar: number): number {
    const segment = this.segmentAtBar(bar)
    return segment.atSec + (bar - segment.atBar) * segment.beatsPerBar * segment.secondsPerBeat
  }

  /**
   * The next grid line at or after `sec`: 'beat', 'bar' or a beat count
   * (e.g. 0.5 for eighths). A position already on the grid returns itself.
   */
  quantize(sec: number, grid: QuantizeGrid = 'bar'): number {
    if (grid === 'bar') {
      const { bar, beat } = this.barBeatAt(sec)
      return this.barToSeconds(beat < 1e-6 ? bar : bar + 1)
    }
    const step = grid === 'beat' ? 1 : grid
    if (!(step > 0)) throw new Error('live-mix: quantize grid must be positive')
    const beats = this.secondsToBeats(sec)
    const snapped = Math.ceil(beats / step - 1e-9) * step
    return this.beatsToSeconds(snapped)
  }

  /** Seconds one beat lasts at `sec`. */
  secondsPerBeatAt(sec: number): number {
    return this.segmentAtSec(sec).secondsPerBeat
  }

  get tempoSegments(): readonly TempoSegment[] {
    return this.segments.map(({ atSec, bpm, beatsPerBar }) => ({ atSec, bpm, beatsPerBar }))
  }

  private segmentAtSec(sec: number): ResolvedSegment {
    let current = this.segments[0]
    for (const segment of this.segments) {
      if (segment.atSec <= sec) current = segment
      else break
    }
    return current
  }

  private segmentAtBeat(beat: number): ResolvedSegment {
    let current = this.segments[0]
    for (const segment of this.segments) {
      if (segment.atBeat <= beat) current = segment
      else break
    }
    return current
  }

  private segmentAtBar(bar: number): ResolvedSegment {
    let current = this.segments[0]
    for (const segment of this.segments) {
      if (segment.atBar <= bar + 1e-9) current = segment
      else break
    }
    return current
  }
}
