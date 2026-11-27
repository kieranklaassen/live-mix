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
import {
  PerformFollower,
  performAsk,
  performedFrame,
  type PerformAsk,
  type PerformDials,
  type PerformNow,
  type PerformReading,
} from './perform'
import type { VisualLook, VisualPreset } from './preset'
import { STAND_IN, STAND_IN_SEC } from './stand-in'

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
  /**
   * Where the performance stands, for a picture that follows it (`perform.ts`). Left out or null, the picture is
   * the one the piece's visuals come to and the dials are handed to the styles as they are.
   */
  perform?: PerformReading | null
}

/** What a performance asks of a frame, and the performance as it has come to for that frame. */
interface Followed {
  ask: PerformAsk
  now: PerformNow
}

/** Two asks closer together than this are the same frame, in milliseconds. */
const SAME_FRAME_MS = 2

export class VisualDesk {
  private readonly follower = new VisualFollower()
  private stand: VisualFollower | null = null
  private at: number | null = null
  private standAt: number | null = null
  private made: VisualFrame | null = null
  private reading: DeskReading | null = null
  private readonly performance = new PerformFollower()
  /** Null where no performance is followed. */
  private asked: Followed | null = null

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
    const dtSec = this.at === null ? 0 : Math.max(0, (now - this.at) / 1000)
    this.asked = this.follow(reading, dtSec)
    const { signals, strokeLevels } = this.follower.step({
      dtSec,
      playheadSec: reading.playheadSec,
      pieceSec: reading.pieceSec,
      playing: reading.playing,
      strokes: reading.strokes,
      heard: reading.heard,
      ...this.dials(reading),
      input: reading.input,
    })
    this.at = now
    this.reading = reading
    const made = frameOf(
      reading.set,
      signals,
      reading.beatSec > 0 ? reading.playheadSec / reading.beatSec : 0,
      strokeLevels,
      this.asked?.ask.full,
    )
    this.made = this.asked ? performedFrame(made, this.asked.ask) : made
    return this.made
  }

  /** Where the performance has the picture this frame; null where the page follows none. */
  private follow(reading: DeskReading, dtSec: number): Followed | null {
    if (!reading.perform) {
      this.performance.rest()
      return null
    }
    const now = this.performance.step(reading.perform, reading, dtSec)
    return { ask: performAsk(now), now }
  }

  /** The dials the styles are handed: as they have come to with the performance, else as the page reads them. */
  private dials(reading: DeskReading): PerformDials {
    return this.asked
      ? { energy: this.asked.ask.energy, space: this.asked.now.space, tone: this.asked.now.tone }
      : { energy: reading.energy, space: reading.space, tone: reading.tone }
  }

  /** The frame that shows one kind alone at `now`, or one preset or look of it, in the piece's palette and grain: what the browser draws. */
  sample(
    kind: string,
    variation: 0 | 1,
    now: number,
    preset: VisualPreset | VisualLook | null = null,
  ): VisualFrame {
    const frame = this.frame(now)
    // `frame` has just read it, or read it earlier in this same frame.
    const reading = this.reading ?? this.read()
    // With the piece while it plays; stopped, or with nothing painted, with a piece of its own, so a style is seen moving.
    const own = reading.playing && reading.strokes.length > 0
    const sample = sampleFrame(
      kind,
      variation,
      own ? frame.signals : this.standIn(now, reading),
      visualPalette(reading.set.palette),
      reading.set.grain,
      preset,
    )
    return this.asked ? performedFrame(sample, this.asked.ask) : sample
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
      ...this.dials(reading),
      input: 0,
    }).signals
  }
}
