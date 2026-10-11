// Motion blur is drawn as the mean of several moments within a frame, the
// way a camera's shutter stays open while things move. These are the moments.

export interface MotionBlur {
  /** How many moments are drawn and averaged. 1 is no blur. */
  samples: number
  /** The share of the frame the shutter is open: 0.5 is a 180 degree shutter. */
  shutter: number
  /** Seconds between frames: 1 / 60 at 60 frames a second. */
  frameDuration: number
}

/** A 180 degree shutter, as film cameras and After Effects use. */
export const DEFAULT_SHUTTER = 0.5

/** Enough moments that a fast title's samples run together, at half After Effects' cost. */
export const DEFAULT_SAMPLES = 8

/**
 * The moments of the frame at `time` to draw. They are evenly spaced and
 * centred on `time`, so a blurred layer sits where the sharp one would.
 */
export function shutterTimes(
  time: number,
  { samples, shutter, frameDuration }: MotionBlur,
): number[] {
  const open = shutter * frameDuration
  if (!(samples > 1) || !(open > 0)) return [time]
  return Array.from(
    { length: samples },
    (_, index) => time + ((index + 0.5) / samples - 0.5) * open,
  )
}
