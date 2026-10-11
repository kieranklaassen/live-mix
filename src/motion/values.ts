// Every animated value of a layer at one moment, and the rest pose they
// start from: where the layer's frame, rotation and opacity put it when
// nothing animates.

/** Where a layer is when nothing animates it. */
export interface RestPose {
  /** The left edge of its frame, as a fraction of the output's width. */
  x: number
  /** The top edge of its frame, as a fraction of the output's height. */
  y: number
  /** Degrees clockwise about its frame's centre. */
  rotation: number
  /** From 0 to 1. */
  opacity: number
}

/** A layer at the picture's top left, upright and opaque: the rest pose when none is given. */
export const ORIGIN: RestPose = { x: 0, y: 0, rotation: 0, opacity: 1 }

export interface MotionValues {
  /** The left edge of the layer's frame, as a fraction of the output's width: its own, or its keyframes'. */
  x: number
  /** The top edge of the layer's frame, as a fraction of the output's height. */
  y: number
  /** How many times its size the layer is drawn, about its frame's centre. 1 is its size. */
  scale: number
  /** Degrees clockwise about its frame's centre. */
  rotation: number
  /** From 0 to 1, with the layer's own opacity in it. */
  opacity: number
  /** How far the layer is blurred: the standard deviation of a Gaussian, as a fraction of the output's height. */
  blur: number
  /** How much of the layer's text has been typed, from 0, none, to 1. */
  reveal: number
  /** How far an entrance or exit has moved the layer to the right of its place, as a fraction of the output's height. */
  offsetX: number
  /** How far an entrance or exit has moved the layer down from its place, as a fraction of the output's height. */
  offsetY: number
}

/** The values of a layer that nothing animates. */
export function restValues(rest: RestPose = ORIGIN): MotionValues {
  return {
    x: rest.x,
    y: rest.y,
    scale: 1,
    rotation: rest.rotation,
    opacity: rest.opacity,
    blur: 0,
    reveal: 1,
    offsetX: 0,
    offsetY: 0,
  }
}
