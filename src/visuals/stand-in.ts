// The piece a style is shown with where the real one has nothing moving to follow.
//
// Pure: no React, no DOM, no audio.

import { VisualFollower, type FollowedStroke } from './follow'
import type { VisualSignals } from './frame'

/** The piece a style is shown with where the real one has no strokes: sixteen seconds, a few sounds of each kind. */
export const STAND_IN_SEC = 16
const standIn = (
  id: number,
  slot: FollowedStroke['slot'],
  startSec: number,
  durationSec: number,
  depth: number,
  colour: FollowedStroke['colour'],
): FollowedStroke => ({
  id: `stand-in-${id}`,
  startSec,
  durationSec,
  fadeInSec: 0.6,
  fadeOutSec: 0.6,
  depth,
  thickness: 0.16,
  gain: 0.8,
  slot,
  colour,
})
export const STAND_IN: readonly FollowedStroke[] = [
  standIn(1, 'drone', 0, 16, 0.84, [0.25, 0.62, 0.68]),
  standIn(2, 'pad', 0.6, 7, 0.52, [0.5, 0.36, 0.72]),
  standIn(3, 'pad', 8.6, 6.4, 0.4, [0.5, 0.36, 0.72]),
  standIn(4, 'texture', 3, 9, 0.68, [0.74, 0.56, 0.3]),
  standIn(5, 'melodic', 5, 3, 0.22, [0.42, 0.68, 0.34]),
  standIn(6, 'melodic', 12.4, 2.6, 0.14, [0.42, 0.68, 0.34]),
  standIn(7, 'hits', 2, 1.1, 0.3, [0.78, 0.36, 0.32]),
  standIn(8, 'hits', 10, 1.1, 0.27, [0.78, 0.36, 0.32]),
]

/** The stand-in piece as it is followed this many seconds in: what a picture is looked at with, always the same. */
export function standInSignals(atSec: number): VisualSignals {
  const follower = new VisualFollower()
  const input = {
    pieceSec: STAND_IN_SEC,
    playing: true,
    strokes: STAND_IN,
    heard: null,
    energy: 0.6,
    space: 0.5,
    tone: 0.5,
    input: 0,
  }
  // Followed from a second before, in steps of a frame, so that every level has come to where it would be.
  const from = Math.max(0, atSec - 1)
  let signals = follower.signals
  for (let frame = 0; frame <= 60; frame++)
    signals = follower.step({
      ...input,
      dtSec: 1 / 60,
      playheadSec: (from + (atSec - from) * (frame / 60)) % STAND_IN_SEC,
    }).signals
  signals.time = atSec
  return signals
}
