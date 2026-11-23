// The default run of a one-channel track, held to its bits as
// default-run.test.ts holds a two-channel one. A separator is handed the one
// channel twice and each part is the mean of the two channels it answers, so
// the stand-in here answers two channels that differ. The checksums are of
// what the code gave when a separation was four stems and nothing else.
//
// This file is not edited. A change that moves one of these checksums has
// changed the default run.

import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { createSegmentSeparator, type SegmentModel } from '../segments'
import { separateTrack } from '../separate'
import { type Channels, type Separation } from '../types'

/** Noise between -0.5 and 0.5, the same for the same seed. */
function noise(length: number, seed: number): Float32Array {
  const out = new Float32Array(length)
  let state = seed >>> 0
  for (let i = 0; i < length; i += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    out[i] = state / 4294967296 - 0.5
  }
  return out
}

/** The first sixteen hex digits of the SHA-256 of a channel's bytes. */
function checksum(channel: Float32Array): string {
  const bytes = new Uint8Array(channel.buffer, channel.byteOffset, channel.byteLength)
  return createHash('sha256').update(bytes).digest('hex').slice(0, 16)
}

/** A checksum for each channel of each of the five parts. */
function checksums(separation: Separation): Record<string, string[]> {
  return {
    vocals: separation.stems.vocals.map(checksum),
    drums: separation.stems.drums.map(checksum),
    bass: separation.stems.bass.map(checksum),
    other: separation.stems.other.map(checksum),
    remainder: separation.remainder.map(checksum),
  }
}

const SEGMENT = 1000

/**
 * A model of plain arithmetic. Each stem is some of each channel of the
 * segment, less of the right one than of the left, and more of both toward
 * the segment's end, so that the two channels of an answer differ for a
 * channel handed twice and where a frame sits in its segment shows.
 */
function standIn(): SegmentModel {
  const scaled = (segment: Channels, left: number, right: number): Channels =>
    [left, right].map((gain, channel) => {
      const out = new Float32Array(SEGMENT)
      for (let i = 0; i < SEGMENT; i += 1) {
        out[i] = gain * segment[channel][i] * (1 + (0.2 * i) / SEGMENT)
      }
      return out
    })
  return {
    sampleRate: 44100,
    segmentFrames: SEGMENT,
    run: (segment) =>
      Promise.resolve({
        vocals: scaled(segment, 0.3, 0.21),
        drums: scaled(segment, 0.25, 0.13),
        bass: scaled(segment, 0.2, 0.19),
        other: scaled(segment, 0.1, 0.02),
      }),
  }
}

describe('the default run of a one-channel track gives the samples it gave before a separator could name its stems', () => {
  it('through a stand-in model, a track at the model’s rate and six segments long', async () => {
    const track = { channels: [noise(4321, 11)], sampleRate: 44100 }
    const separation = await separateTrack(track, createSegmentSeparator(standIn()))
    expect(checksums(separation)).toEqual({
      vocals: ['10c131f4223af415'],
      drums: ['78a41cf894209513'],
      bass: ['c31d4b33979a4095'],
      other: ['90066e2a5bbe36dc'],
      remainder: ['8938e4cc05cb557a'],
    })
  })

  it('through a stand-in model, a track at 48 kHz and six segments long', async () => {
    const track = { channels: [noise(4801, 12)], sampleRate: 48000 }
    const separation = await separateTrack(track, createSegmentSeparator(standIn()))
    expect(checksums(separation)).toEqual({
      vocals: ['9b25fa0cc67bd34e'],
      drums: ['0fbbc76b5e5c9959'],
      bass: ['1cdb5e1312fc753d'],
      other: ['76274d3bf5abee55'],
      remainder: ['1bd91f56c5ddcfcf'],
    })
  })
})
