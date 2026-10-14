// The strokes of a piece as the visuals follow them.
//
// Pure: no React, no DOM, no audio.

import type { KindSlot } from './frame'
import type { FollowedStroke, Rgb } from './follow'

/** A stroke as the piece keeps it, as far as the visuals need it. */
export interface PieceStroke {
  id: string
  sampleId: number
  startSec: number
  durationSec: number
  fadeInSec: number
  fadeOutSec: number
  row: number
  rows: number
  muted: boolean
}

/** How a stroke plays its sound: which part of it is one pass, and whether the stroke comes round to it again. */
export interface StrokePass {
  /** Where in the sound one pass begins, and how long it is, in seconds. */
  fromSec: number
  lengthSec: number
  repeats: boolean
  /** How far into a pass the stroke begins, in seconds: 0 at the top. */
  phaseSec: number
  reversed: boolean
}

export interface PieceRead<Stroke extends PieceStroke = PieceStroke> {
  /** The rows of the room, front to back. */
  roomRows: number
  /** What kind of sound it is, as its analysis says; null where that is not known. */
  kindOf(sampleId: number): string | null
  colourOf(sampleId: number): Rgb
  /** How loud the stroke is painted, in dB: its size and its own level together. */
  levelDbOf(stroke: Stroke): number
  /** Where the sound's hits fall, in seconds from its start. */
  onsetsOf?(sampleId: number): readonly number[] | undefined
  /** How the stroke plays its sound; undefined while that is not known, when it is taken to play it once from its start. */
  passOf?(stroke: Stroke): StrokePass | undefined
  /** A sound nothing is heard of now: muted on its channel, or left out of the scene. */
  silent?(sampleId: number): boolean
}

const clamp01 = (value: number): number => (value > 0 ? (value < 1 ? value : 1) : 0)

/** The slot a kind of sound is followed in. One shots and beats are hits; a sound of no known kind counts as a pad. */
export function slotOfKind(kind: string | null): KindSlot {
  switch (kind) {
    case 'drone':
    case 'pad':
    case 'texture':
    case 'melodic':
      return kind
    case 'oneshot':
    case 'beat':
      return 'hits'
    default:
      return 'pad'
  }
}

/** A colour written as #rgb or #rrggbb; a soft grey for anything else. */
export function rgbOfHex(hex: string): Rgb {
  const text = hex.trim().replace(/^#/, '')
  const full = text.length === 3 ? text.replace(/./g, (digit) => digit + digit) : text
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return [0.6, 0.6, 0.6]
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ]
}

/** The hits of one pass, in seconds into it as the stroke plays it: those of the part it plays, turned round with it. */
export function hitsOfPass(onsets: readonly number[], pass: StrokePass): number[] {
  const hits: number[] = []
  for (const onset of onsets) {
    const into = onset - pass.fromSec
    if (into < 0 || into >= pass.lengthSec) continue
    hits.push(pass.reversed ? pass.lengthSec - into : into)
  }
  return hits.sort((a, b) => a - b)
}

export function followedStrokes<Stroke extends PieceStroke>(
  strokes: readonly Stroke[],
  piece: PieceRead<Stroke>,
): FollowedStroke[] {
  return strokes.map((stroke) => {
    const slot = slotOfKind(piece.kindOf(stroke.sampleId))
    const quiet = stroke.muted || (piece.silent?.(stroke.sampleId) ?? false)
    const onsets = slot === 'hits' ? piece.onsetsOf?.(stroke.sampleId) : undefined
    const pass = slot === 'hits' ? piece.passOf?.(stroke) : undefined
    return {
      id: stroke.id,
      startSec: stroke.startSec,
      durationSec: stroke.durationSec,
      fadeInSec: stroke.fadeInSec,
      fadeOutSec: stroke.fadeOutSec,
      // Row 0 is the front of the room.
      depth: clamp01(1 - (stroke.row + stroke.rows / 2) / piece.roomRows),
      thickness: clamp01(stroke.rows / piece.roomRows),
      // A stroke of the usual size and level reads as most of the way up.
      gain: quiet ? 0 : clamp01(0.8 * Math.pow(10, piece.levelDbOf(stroke) / 20)),
      slot,
      colour: piece.colourOf(stroke.sampleId),
      onsets: onsets && pass ? hitsOfPass(onsets, pass) : onsets,
      ...(pass?.repeats ? { repeatSec: pass.lengthSec, phaseSec: pass.phaseSec } : {}),
    }
  })
}
