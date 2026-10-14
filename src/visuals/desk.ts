// Where a page's picture is worked out: once a frame, for every screen that shows it.
//
// The page says how to read the piece and the music now; the desk follows them (`follow.ts`) and hands out the
// frame the piece's visuals come to (`frame.ts`). Asked twice in the same frame it answers the same, so the
// picture in the bar, the one that fills the window and the one sent to a second screen are one picture.
//
// A style shown by itself in the browser is drawn with the same signals while the piece plays, so it shows what it
// would do in this piece. A piece that stands still, or has no strokes yet, has nothing moving to follow: there a
// small stand-in piece plays for the browser alone, never for the piece's own picture.
//
// Pure but for what the followers keep: no React, no DOM, no audio.

import { VisualFollower, type FollowedStroke, type Heard } from './follow'
import { frameOf, sampleFrame, type VisualFrame, type VisualSignals } from './frame'
import type { VisualSet } from './model'
import { visualPalette } from './palettes'

/** The piece and the music as they are now. */
export interface DeskReading {
  set: VisualSet
  /** Where the playhead is, in seconds from the start of the piece; how long the piece and a beat are. */
  playheadSec: number
  pieceSec: number
  beatSec: number
  playing: boolean
  strokes: readonly FollowedStroke[]
  /** What is heard; null where nothing can be: before audio starts, and on a station that makes no sound. */
  heard: Heard | null
  energy: number
  space: number
  tone: number
  /** How loud the live input is, 0 to 1. */
  input: number
}

/** Two asks closer together than this are the same frame, in milliseconds. */
const SAME_FRAME_MS = 2

/** The piece a style is shown with where the real one has no strokes: sixteen seconds, a few sounds of each kind. */
const STAND_IN_SEC = 16
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
const STAND_IN: readonly FollowedStroke[] = [
  standIn(1, 'drone', 0, 16, 0.84, [0.25, 0.62, 0.68]),
  standIn(2, 'pad', 0.6, 7, 0.52, [0.5, 0.36, 0.72]),
  standIn(3, 'pad', 8.6, 6.4, 0.4, [0.5, 0.36, 0.72]),
  standIn(4, 'texture', 3, 9, 0.68, [0.74, 0.56, 0.3]),
  standIn(5, 'melodic', 5, 3, 0.22, [0.42, 0.68, 0.34]),
  standIn(6, 'melodic', 12.4, 2.6, 0.14, [0.42, 0.68, 0.34]),
  standIn(7, 'hits', 2, 1.1, 0.3, [0.78, 0.36, 0.32]),
  standIn(8, 'hits', 10, 1.1, 0.27, [0.78, 0.36, 0.32]),
]

export class VisualDesk {
  private readonly follower = new VisualFollower()
  private stand: VisualFollower | null = null
  private at: number | null = null
  private standAt: number | null = null
  private made: VisualFrame | null = null
  private reading: DeskReading | null = null

  constructor(private readonly read: () => DeskReading) {}

  /** A cue was fired. */
  cue(): void {
    this.follower.cue()
  }

  /** A note was played on the keys, this loud (0 to 1). */
  note(gain: number): void {
    this.follower.note(gain)
  }

  /** The frame the piece's visuals come to at `now`, a time in milliseconds that only ever grows. */
  frame(now: number): VisualFrame {
    if (this.made !== null && this.at !== null && Math.abs(now - this.at) < SAME_FRAME_MS)
      return this.made
    const reading = this.read()
    const { signals, strokeLevels } = this.follower.step({
      dtSec: this.at === null ? 0 : Math.max(0, (now - this.at) / 1000),
      playheadSec: reading.playheadSec,
      pieceSec: reading.pieceSec,
      playing: reading.playing,
      strokes: reading.strokes,
      heard: reading.heard,
      energy: reading.energy,
      space: reading.space,
      tone: reading.tone,
      input: reading.input,
    })
    this.at = now
    this.reading = reading
    this.made = frameOf(
      reading.set,
      signals,
      reading.beatSec > 0 ? reading.playheadSec / reading.beatSec : 0,
      strokeLevels,
    )
    return this.made
  }

  /** The frame that shows one kind alone at `now`, in the piece's palette and grain: what the browser draws. */
  sample(kind: string, variation: 0 | 1, now: number): VisualFrame {
    const frame = this.frame(now)
    // `frame` has just read it, or read it earlier in this same frame.
    const reading = this.reading ?? this.read()
    // With the piece while it plays; stopped, or with nothing painted, with a piece of its own, so a style is seen moving.
    const own = reading.playing && reading.strokes.length > 0
    return sampleFrame(
      kind,
      variation,
      own ? frame.signals : this.standIn(now, reading),
      visualPalette(reading.set.palette),
      reading.set.grain,
    )
  }

  private standIn(now: number, reading: DeskReading): VisualSignals {
    this.stand ??= new VisualFollower()
    const dtSec = this.standAt === null ? 0 : Math.max(0, (now - this.standAt) / 1000)
    if (this.standAt !== null && dtSec * 1000 < SAME_FRAME_MS) return this.stand.signals
    this.standAt = now
    return this.stand.step({
      dtSec,
      playheadSec: (now / 1000) % STAND_IN_SEC,
      pieceSec: STAND_IN_SEC,
      playing: true,
      strokes: STAND_IN,
      heard: null,
      energy: reading.energy,
      space: reading.space,
      tone: reading.tone,
      input: 0,
    }).signals
  }
}
