/**
 * `@kieranklaassen/live-mix/analysis`: what a stretch of sound measures.
 * Loudness (ITU-R BS.1770-4, EBU Tech 3341 and 3342), peaks, crest factor,
 * the level in seven bands, and how left and right stand to each other.
 *
 * An entry of its own on purpose. It works on plain arrays and takes the
 * sound a chunk at a time, so a worker can read a file by slices and measure
 * it without holding the whole of it. Nothing here needs a DOM or Web Audio,
 * and nothing here is reached from `.`.
 *
 * @module live-mix/analysis
 */

export { Measurer, measure } from './measure'
export type { BandLevels, Measurement, ShortTermSeries } from './types'
