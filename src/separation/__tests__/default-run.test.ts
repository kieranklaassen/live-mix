// The default run, held to its bits. Seeded noise goes through a stand-in
// model, the segment runner and `separateTrack`, and every channel of every
// part is compared with a checksum of its bytes, taken from what the code
// gave when a separation was four stems and nothing else. A run of the four,
// with one pass, has to give these samples whatever the entry learns to do
// beside it. A threshold would let a sample move: a checksum does not.
//
// This file is not edited. A change that moves one of these checksums has
// changed the default run.

import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { HYBRID_MODEL_SPEC, createHybridModel, type HybridModelSpec } from '../hybrid-model'
import { createSegmentSeparator, type SegmentModel } from '../segments'
import { separateTrack } from '../separate'
import { type Channels, type ModelSession, type Separation } from '../types'

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
 * A model of plain arithmetic. Each stem is some of the segment's own
 * channel and some of the other one, more of both toward the segment's end,
 * so that where a frame sits in its segment shows in the answer.
 */
function standIn(): SegmentModel {
  const mixed = (segment: Channels, own: number, cross: number): Channels =>
    [0, 1].map((channel) => {
      const out = new Float32Array(SEGMENT)
      for (let i = 0; i < SEGMENT; i += 1) {
        const lean = 1 + (0.2 * i) / SEGMENT
        out[i] = (own * segment[channel][i] + cross * segment[1 - channel][i]) * lean
      }
      return out
    })
  return {
    sampleRate: 44100,
    segmentFrames: SEGMENT,
    run: (segment) =>
      Promise.resolve({
        vocals: mixed(segment, 0.3, 0.05),
        drums: mixed(segment, 0.25, -0.1),
        bass: mixed(segment, 0.2, 0.02),
        other: mixed(segment, 0.1, 0.07),
      }),
  }
}

class Tensor {
  constructor(
    readonly type: 'float32',
    readonly data: Float32Array,
    readonly dims: readonly number[],
  ) {}
}

/** A small hybrid model: 64 frames of 128 bins for a segment of 4096. */
const SMALL: HybridModelSpec = {
  sampleRate: 44100,
  segmentFrames: 4096,
  fftSize: 256,
  hop: 64,
  stems: ['drums', 'bass', 'other', 'vocals'],
}

/** How much of the mix's spectrogram, and of its waveform, each of a session's four stems is answered with. */
const OF_SPECTROGRAM = [0.2, 0.15, 0.1, 0.25]
const OF_WAVEFORM = [0.05, 0.1, 0.02, 0.03]

/** A session of plain arithmetic: each stem is the mix's spectrogram and the mix's waveform, each times a gain. */
function standInSession(spec: HybridModelSpec): ModelSession<Tensor> {
  const bins = spec.fftSize / 2
  const frames = Math.ceil(spec.segmentFrames / spec.hop)
  return {
    inputNames: ['mix', 'mix_spectrogram'],
    outputNames: ['stems_spectrogram', 'stems'],
    run: (fed) => {
      const waveform = fed.mix.data
      const spectrogram = fed.mix_spectrogram.data
      const spectrograms = new Float32Array(4 * spectrogram.length)
      const waveforms = new Float32Array(4 * waveform.length)
      for (let stem = 0; stem < 4; stem += 1) {
        const ofSpectrogram = OF_SPECTROGRAM[stem]
        const ofWaveform = OF_WAVEFORM[stem]
        const spectrogramAt = stem * spectrogram.length
        const waveformAt = stem * waveform.length
        for (let i = 0; i < spectrogram.length; i += 1) {
          spectrograms[spectrogramAt + i] = spectrogram[i] * ofSpectrogram
        }
        for (let i = 0; i < waveform.length; i += 1) {
          waveforms[waveformAt + i] = waveform[i] * ofWaveform
        }
      }
      return Promise.resolve({
        stems_spectrogram: new Tensor('float32', spectrograms, [1, 4, 4, bins, frames]),
        stems: new Tensor('float32', waveforms, [1, 4, 2, spec.segmentFrames]),
      })
    },
  }
}

describe('the default run gives the samples it gave before a separator could name its stems', () => {
  it('through a stand-in model, a track at the model’s rate and six segments long', async () => {
    const track = { channels: [noise(4321, 1), noise(4321, 2)], sampleRate: 44100 }
    const separation = await separateTrack(track, createSegmentSeparator(standIn()))
    expect(checksums(separation)).toEqual({
      vocals: ['97d31e8c1caf93aa', 'a432b8ef4b680b4a'],
      drums: ['70a0c16f8ba2ab6e', '2e1dc0be776d12f5'],
      bass: ['bf02e63cfba89196', '6654950e8dbe7086'],
      other: ['791a14a337573604', 'be47e7fb15b94024'],
      remainder: ['3aeec2868e8045b8', 'c513cff0d3a9363a'],
    })
  })

  it('through a stand-in model, a track at 48 kHz and six segments long', async () => {
    const track = { channels: [noise(4801, 3), noise(4801, 4)], sampleRate: 48000 }
    const separation = await separateTrack(track, createSegmentSeparator(standIn()))
    expect(checksums(separation)).toEqual({
      vocals: ['f1b408824b657cfd', 'afaf9d32ebb9880a'],
      drums: ['068b1ed2abc5c4e8', '959db6ff89dd8d42'],
      bass: ['c33185be046e58e1', 'a9bc1c9753adff79'],
      other: ['9a665b2a1e02b5ef', 'c4aea28bc3852cfd'],
      remainder: ['998ad5da4205d02a', '33e64402c24e5145'],
    })
  })

  it('through a small hybrid model on a stand-in session, a track at the model’s rate and four segments long', async () => {
    const track = { channels: [noise(10000, 5), noise(10000, 6)], sampleRate: 44100 }
    const model = createHybridModel({ Tensor, session: standInSession(SMALL) }, SMALL)
    const separation = await separateTrack(track, createSegmentSeparator(model))
    expect(checksums(separation)).toEqual({
      vocals: ['0dc28e989c4077fd', 'bc8fddf4463195ef'],
      drums: ['c49c082ef5fbee60', 'dc61c506a73f2b36'],
      bass: ['1f7fd4956a3a638e', '91f96d91f3dc92be'],
      other: ['247db0bb4f0021d4', '40971f233c120a7a'],
      remainder: ['21e9ead2d84c2ee0', 'ddb820c4f0cd0111'],
    })
  })

  it('through a small hybrid model on a stand-in session, a track at 48 kHz and three segments long', async () => {
    const track = { channels: [noise(10000, 7), noise(10000, 8)], sampleRate: 48000 }
    const model = createHybridModel({ Tensor, session: standInSession(SMALL) }, SMALL)
    const separation = await separateTrack(track, createSegmentSeparator(model))
    expect(checksums(separation)).toEqual({
      vocals: ['b3d3e68274ce5eed', '18f8d389b3c8a2d9'],
      drums: ['2885dd7af84b2e71', '2ba9ea3e41436d8a'],
      bass: ['0b3db7b876274423', '02699fde4a42d8a8'],
      other: ['06d7ad4f65db637d', '946cc33d83708b8a'],
      remainder: ['54d7ae10a20da67a', '452b81b8776394ad'],
    })
  })

  it('through a hybrid model made with no spec, a track two of its segments long', async () => {
    const track = { channels: [noise(260000, 9), noise(260000, 10)], sampleRate: 44100 }
    const model = createHybridModel({ Tensor, session: standInSession(HYBRID_MODEL_SPEC) })
    const separation = await separateTrack(track, createSegmentSeparator(model))
    expect(checksums(separation)).toEqual({
      vocals: ['46bbfe6d31dee70c', '2789d223ad9341e4'],
      drums: ['46ca58e825a8c372', '140dbdfda3ab3ffb'],
      bass: ['17de2032bcbc42c6', '38789213c0c64651'],
      other: ['8408faaeb8b69bec', '772f04bfb42ca599'],
      remainder: ['682b17bdd81af973', 'de7a24a7b369562c'],
    })
  })
})
