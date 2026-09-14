// A clip slot: one cell of the session grid (a scene × an audio track) that
// holds a clip template and its launch settings. Slots live in the score
// (`score.slots`); this module holds their types and the pure lookups the
// `Session` runtime, the operations and the React hooks share.
//
// A slot's clip is the core `Clip` record minus its identity and position on
// the timeline: launching places a copy on the track at the quantised launch
// time, so the arrangement holds exactly what the grid played.

import { type Clip } from '../clips/Clip'
import { type LaunchQuantize } from './launch'
import { type ScoreFollowAction } from './followActions'

/** A clip as a slot holds it: what to play, not where. */
export type SlotClip = Omit<Clip, 'id' | 'startSec'>

/**
 * How a slot reacts to press and release:
 * - `trigger`: press launches (a playing slot retriggers from the top); release is ignored.
 * - `gate`: press launches, release stops — both quantised.
 * - `toggle`: press launches when stopped or queued-to-stop, stops when playing or queued.
 */
export type LaunchMode = 'trigger' | 'gate' | 'toggle'

export const LAUNCH_MODES: readonly LaunchMode[] = ['trigger', 'gate', 'toggle']

export interface ScoreSlot {
  /** Unique across the score's slots. */
  id: string
  /** Audio track the slot plays on. */
  track: string
  /** Scene (row) the slot sits in. One slot per track × scene. */
  scene: string
  /** What the slot launches; `null` is an empty slot that stops the track when launched. */
  clip: SlotClip | null
  /** Overrides the score's global launch quantisation when set. */
  quantize?: LaunchQuantize
  launchMode: LaunchMode
  /**
   * Legato: a launch that replaces a playing slot on the same track enters
   * the new clip at the position the old one had reached instead of its
   * start, so the groove carries across.
   */
  legato: boolean
  /** What happens after the follow time; absent means the slot plays (or loops) until stopped. */
  follow?: ScoreFollowAction
}

/**
 * Where a slot stands on the grid:
 * - `empty`: the slot holds no clip (or the cell has no slot record);
 * - `stopped`: it has a clip and nothing of it is queued or sounding;
 * - `queued`: a launch is placed but its quantised start has not come;
 * - `playing`: its clip is sounding;
 * - `recording`: reserved for the recorder (U33) — the runtime never enters it yet.
 */
export type SlotState = 'empty' | 'stopped' | 'queued' | 'playing' | 'recording'

export const SLOT_STATES: readonly SlotState[] = [
  'empty',
  'stopped',
  'queued',
  'playing',
  'recording',
]

/** Defaults a `slot.add` fills in for a slot that only names its cell and clip. */
export function defaultSlot(
  slot: Pick<ScoreSlot, 'id' | 'track' | 'scene'> & Partial<ScoreSlot>,
): ScoreSlot {
  const out: ScoreSlot = {
    id: slot.id,
    track: slot.track,
    scene: slot.scene,
    clip: slot.clip ?? null,
    launchMode: slot.launchMode ?? 'trigger',
    legato: slot.legato ?? false,
  }
  if (slot.quantize !== undefined) out.quantize = slot.quantize
  if (slot.follow !== undefined) out.follow = slot.follow
  return out
}

/** A slot clip from a placed arrangement clip: the same slice and envelope, no position. */
export function slotClipOf(clip: Clip): SlotClip {
  const out: SlotClip = {
    sourceId: clip.sourceId,
    offsetSec: clip.offsetSec,
    durationSec: clip.durationSec,
    fadeInSec: clip.fadeInSec,
    fadeOutSec: clip.fadeOutSec,
    fadeCurve: clip.fadeCurve,
    gainDb: clip.gainDb,
  }
  if (clip.loop) out.loop = true
  if (clip.warp !== undefined) out.warp = clip.warp
  if (clip.semitones !== undefined) out.semitones = clip.semitones
  return out
}

/** A document that has slots (a `Score`, or anything shaped like one). */
export interface SlotHolder {
  slots: readonly ScoreSlot[]
}

export function findSlot(holder: SlotHolder, id: string): ScoreSlot | undefined {
  return holder.slots.find((slot) => slot.id === id)
}

/** The slot in a cell, if the cell has one. */
export function slotAt(holder: SlotHolder, track: string, scene: string): ScoreSlot | undefined {
  return holder.slots.find((slot) => slot.track === track && slot.scene === scene)
}

/** A track's slots in the given scene order — its column of the grid. */
export function trackSlots(
  holder: SlotHolder,
  track: string,
  sceneOrder: readonly string[],
): ScoreSlot[] {
  const rank = new Map(sceneOrder.map((id, index) => [id, index] as const))
  return holder.slots
    .filter((slot) => slot.track === track)
    .sort((a, b) => (rank.get(a.scene) ?? Infinity) - (rank.get(b.scene) ?? Infinity))
}

/** A scene's slots — its row of the grid — in the track order given. */
export function sceneSlots(
  holder: SlotHolder,
  scene: string,
  trackOrder: readonly string[],
): ScoreSlot[] {
  const rank = new Map(trackOrder.map((id, index) => [id, index] as const))
  return holder.slots
    .filter((slot) => slot.scene === scene)
    .sort((a, b) => (rank.get(a.track) ?? Infinity) - (rank.get(b.track) ?? Infinity))
}
