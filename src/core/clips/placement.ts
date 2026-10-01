// Where one clip sits in the mix, apart from the other clips on its track:
// left to right (`pan`), how dull (`lowpassHz`) and how far into the track's
// space (`spaceDb`). A clip with any of the three plays through nodes of its
// own, ahead of the track's strip, so two clips of one source on one track
// can sound in different places at the same moment. The same numbers are
// here as plain functions, so a drawing can show what the track plays.

import { type Clip } from './Clip'

/** The three placement fields of a clip. */
export type ClipPlacement = Pick<Clip, 'pan' | 'lowpassHz' | 'spaceDb'>

export type ClipPlacementKey = keyof ClipPlacement

export const CLIP_PLACEMENT_KEYS: readonly ClipPlacementKey[] = ['pan', 'lowpassHz', 'spaceDb']

/** The lowest cutoff a clip's low-pass takes. */
export const MIN_CLIP_LOWPASS_HZ = 20
/**
 * The cutoff of a placed clip that names none, and the highest a clip can
 * name. This close to half the sample rate the filter passes everything
 * that can be heard.
 */
export const OPEN_CLIP_LOWPASS_HZ = 24_000
/** At and below this a clip sends nothing into the space. */
export const SPACE_FLOOR_DB = -60
/** The most a clip may send into the space, against its own level. */
export const MAX_SPACE_DB = 24

/** True when the clip names where it sits, so the track gives it its own nodes. */
export function isPlacedClip(clip: ClipPlacement): boolean {
  return clip.pan !== undefined || clip.lowpassHz !== undefined || clip.spaceDb !== undefined
}

/** A clip's pan as the panner takes it: −1 … 1, centred when the clip names none. */
export function clipPan(pan: number | undefined): number {
  if (pan === undefined || !Number.isFinite(pan)) return 0
  return Math.min(1, Math.max(-1, pan))
}

/** The cutoff a clip's low-pass runs at on a context of `sampleRate`. */
export function clipLowpassHz(lowpassHz: number | undefined, sampleRate: number): number {
  // A biquad's cutoff has to stay under half the sample rate.
  const ceiling = Math.min(OPEN_CLIP_LOWPASS_HZ, sampleRate * 0.49)
  if (lowpassHz === undefined || !Number.isFinite(lowpassHz)) return ceiling
  return Math.min(ceiling, Math.max(MIN_CLIP_LOWPASS_HZ, lowpassHz))
}

/** Linear gain of a clip's send into the space; 0 when it sends nothing. */
export function spaceSendGain(spaceDb: number | undefined): number {
  if (spaceDb === undefined || !Number.isFinite(spaceDb) || spaceDb <= SPACE_FLOOR_DB) return 0
  return 10 ** (Math.min(MAX_SPACE_DB, spaceDb) / 20)
}
