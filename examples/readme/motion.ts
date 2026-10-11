import { type LayerMotion, motionAt, resolveLayerMotion } from '@kieranklaassen/live-mix/motion'

// A title on screen for four seconds: it pops in, drifts to the right on a
// spring and fades out. Motion is plain data, stored with the layer.
const motion: LayerMotion = {
  in: { preset: 'pop' },
  out: { preset: 'fade' },
  keyframes: {
    x: [
      { time: 0, value: 0.1 },
      { time: 0.6, value: 0.3, easing: { spring: { bounce: 0.2 } } },
    ],
  },
}

// Resolve once per change, read once per frame. A value depends on the time
// alone, so a preview, a still and an export draw the same picture.
const rest = { x: 0.1, y: 0.4, rotation: 0, opacity: 1 }
const resolved = resolveLayerMotion(motion, { length: 4, rest })

// Lengths are fractions of the output, so this plays the same at any size.
export function titleStyle(seconds: number, width: number, height: number) {
  const { x, y, scale, rotation, opacity, blur, offsetX, offsetY } = motionAt(resolved, seconds)
  const left = x * width + offsetX * height
  const top = (y + offsetY) * height
  return {
    opacity,
    filter: `blur(${blur * height}px)`,
    transform: `translate(${left}px, ${top}px) rotate(${rotation}deg) scale(${scale})`,
  }
}
