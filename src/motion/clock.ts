// A steady clock for drawing. Motion is a function of time, so motion is as
// smooth as the time it is given. A preview reads its time from the audio
// clock once per frame, and an audio clock moves in the audio thread's own
// steps (128 samples: 2.7 ms at 48 kHz), so from one frame to the next it
// advances by 5, 8 or 11 ms where the frame took 8. Drawn at those times, a
// layer that moves at a constant speed judders.
//
// A steady clock reads the same clock and gives a time that advances with
// the display between readings, and leans toward the reading so it never
// drifts from it. It decides what time it is; what is drawn at that time is
// still a function of the time alone.

export interface SteadyClock {
  /**
   * The steady time for a `reading` of the clock, in seconds, taken at `now`
   * milliseconds of a monotonic timer such as `performance.now()`.
   */
  read(reading: number, now: number): number
  /** Forgets the pace, so the next reading is taken as it is: when the clock is started, stopped or moved. */
  reset(): void
}

export interface SteadyClockOptions {
  /** A reading this many seconds from the steady time is a jump (a seek), and is taken at once. Default 0.05. */
  tolerance?: number
  /** Seconds the steady time takes to close most of a gap to the readings. Shorter follows closer and shakes more. Default 0.25. */
  settle?: number
}

/**
 * The steady time is never this many seconds ahead of a reading. A clock
 * that stands still, as an audio clock does until its first sound is heard,
 * is followed to a stop and not run on past: more than the few milliseconds
 * a running clock's steps put a reading behind, and under a frame.
 */
const LEAD = 0.01

export function steadyClock({
  tolerance = 0.05,
  settle = 0.25,
}: SteadyClockOptions = {}): SteadyClock {
  // The steady time was `time` at `now`.
  let anchor: { time: number; now: number } | null = null

  return {
    read(reading, now) {
      const elapsed = anchor ? (now - anchor.now) / 1000 : -1
      const steady = anchor ? anchor.time + elapsed : reading
      const off = reading - steady
      if (elapsed < 0 || Math.abs(off) > tolerance) {
        anchor = { time: reading, now }
        return reading
      }
      // Lean toward the reading by a share that grows with the time since the last one: asked twice in a frame, it moves once.
      const time = Math.min(steady + off * (1 - Math.exp(-elapsed / settle)), reading + LEAD)
      anchor = { time, now }
      return time
    },
    reset() {
      anchor = null
    },
  }
}
