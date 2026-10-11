// What the instruments' displays share. An effect's display is drawn from its
// knobs, its own readings and the sound through it; an instrument's has one
// thing more, the notes it was sent (`frame.notes`), and one thing less: no
// sound goes in. So every one of them is the instrument as its knobs set it,
// lit where it is played, over the level that comes out.
//
// The notes are what the instrument was told, not what still sounds. How long
// a note rings on is worked out here from the device's own figures, the same
// way the device works it out, and each display says where they come from.

import { INK, clamp, fillRect, gainToDb, type Box } from '../display-kit'
import { type DisplayFrame } from '../plate-display'

type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

/** The key nearest a pitch, as a MIDI number; 69 is the A at 440 Hz. */
export const keyOfHz = (hz: number): number =>
  Math.round(69 + 12 * Math.log2(Math.max(hz, 1) / 440))
export const hzOfKey = (key: number): number => 440 * Math.pow(2, (key - 69) / 12)

/** A pitch as it is said: "C4" for middle C. */
export function pitchName(hz: number): string {
  const key = keyOfHz(hz)
  return `${NOTE_NAMES[((key % 12) + 12) % 12]}${Math.floor(key / 12) - 1}`
}

/** Where a pitch stands across a box, by its octave: `lowHz` at the left edge, `highHz` at the right. */
export function xOfPitch(hz: number, box: Box, lowHz: number, highHz: number): number {
  const share = Math.log(Math.max(hz, 1) / lowHz) / Math.log(highHz / lowHz)
  return box.x + clamp(share, 0, 1) * box.w
}

/** How far a number of cents moves a pitch across that box, in pixels. */
export function pxOfCents(cents: number, box: Box, lowHz: number, highHz: number): number {
  return (cents / (1200 * Math.log2(highHz / lowHz))) * box.w
}

/** The level that comes out, as a share of a scale from `floorDb` up to full scale: 0 while no sound is read. */
export function outShare(frame: Pick<DisplayFrame, 'signal' | 'powered'>, floorDb = -60): number {
  if (!frame.powered || !frame.signal) return 0
  const db = gainToDb(frame.signal.output.rms)
  return Number.isFinite(db) ? clamp(1 - db / floorDb, 0, 1) : 0
}

/**
 * The foot of an instrument's display: a bar across the box, as thick as it is
 * given, that fills from the middle outwards with the level coming out. It is
 * the one part every instrument's display has, so the eye knows where to look
 * for "is it sounding".
 */
export function levelFoot(frame: Paint, box: Box, share: number): void {
  const { ctx, colours } = frame
  fillRect(ctx, box, colours.ink, INK.fill)
  const wide = clamp(share, 0, 1) * box.w
  if (wide > 0)
    fillRect(ctx, { x: box.x + (box.w - wide) / 2, y: box.y, w: wide, h: box.h }, colours.accent)
  ctx.globalAlpha = INK.rule
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1)
  ctx.globalAlpha = 1
}
