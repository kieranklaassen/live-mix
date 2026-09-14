import { describe, expect, it } from 'vitest'

import { MockAudioBuffer } from '../../../testing'
import {
  audioBufferToWav,
  decodeWav,
  deinterleave,
  encodeWav,
  interleave,
  readWavInfo,
  wavBlob,
} from '../encode'

function ramp(frames: number, scale = 1): Float32Array {
  return Float32Array.from({ length: frames }, (_, i) => scale * ((2 * i) / (frames - 1) - 1))
}

describe('interleave / deinterleave', () => {
  it('round-trips planar channels', () => {
    const left = Float32Array.from([1, 2, 3])
    const right = Float32Array.from([4, 5, 6])
    const mixed = interleave([left, right])
    expect(Array.from(mixed)).toEqual([1, 4, 2, 5, 3, 6])
    const back = deinterleave(mixed, 2)
    expect(Array.from(back[0])).toEqual([1, 2, 3])
    expect(Array.from(back[1])).toEqual([4, 5, 6])
  })

  it('handles empty input', () => {
    expect(interleave([]).length).toBe(0)
    expect(deinterleave(new Float32Array(0), 0)).toEqual([])
  })
})

describe('encodeWav', () => {
  it('writes a canonical 16-bit stereo header', () => {
    const wav = encodeWav({ channels: [ramp(100), ramp(100, 0.5)], sampleRate: 48000 })
    const info = readWavInfo(wav)
    expect(info).toMatchObject({
      channelCount: 2,
      sampleRate: 48000,
      bitDepth: 16,
      format: 'pcm',
      frames: 100,
      dataOffset: 44,
    })
    expect(wav.byteLength).toBe(44 + 100 * 2 * 2)
    const view = new DataView(wav)
    expect(view.getUint32(4, true)).toBe(wav.byteLength - 8)
    expect(view.getUint32(28, true)).toBe(48000 * 4) // byte rate
    expect(view.getUint16(32, true)).toBe(4) // block align
  })

  it('16-bit PCM round-trips within one quantisation step and clips out-of-range input', () => {
    const source = ramp(1000)
    source[0] = -1.7
    source[1] = 1.7
    const decoded = decodeWav(encodeWav({ channels: [source], sampleRate: 44100 }))
    expect(decoded.sampleRate).toBe(44100)
    expect(decoded.channels[0][0]).toBeCloseTo(-1, 3)
    expect(decoded.channels[0][1]).toBeCloseTo(32767 / 32768, 6)
    for (let i = 2; i < source.length; i += 1) {
      expect(Math.abs(decoded.channels[0][i] - source[i])).toBeLessThanOrEqual(2 / 32768)
    }
  })

  it('24-bit PCM round-trips within one step', () => {
    const source = ramp(777, 0.9)
    const wav = encodeWav({ channels: [source, source], sampleRate: 96000 }, { bitDepth: 24 })
    expect(readWavInfo(wav)).toMatchObject({ bitDepth: 24, format: 'pcm', frames: 777 })
    const decoded = decodeWav(wav)
    for (let i = 0; i < source.length; i += 1) {
      expect(Math.abs(decoded.channels[1][i] - source[i])).toBeLessThanOrEqual(1 / 8388608 + 1e-9)
    }
  })

  it('32-bit float is exact and uses the extensible header with a fact chunk', () => {
    const source = ramp(64, 0.3)
    source[5] = 1.5 // float keeps over-range values
    const wav = encodeWav({ channels: [source], sampleRate: 48000 }, { bitDepth: 32 })
    const info = readWavInfo(wav)
    expect(info).toMatchObject({ bitDepth: 32, format: 'float', frames: 64, channelCount: 1 })
    const view = new DataView(wav)
    expect(view.getUint16(20, true)).toBe(0xfffe)
    expect(String.fromCharCode(...new Uint8Array(wav, 60, 4))).toBe('fact')
    const decoded = decodeWav(wav)
    expect(Array.from(decoded.channels[0])).toEqual(Array.from(source))
  })

  it('uses the extensible header beyond stereo', () => {
    const wav = encodeWav({ channels: [ramp(8), ramp(8), ramp(8), ramp(8)], sampleRate: 48000 })
    const view = new DataView(wav)
    expect(view.getUint16(20, true)).toBe(0xfffe)
    expect(readWavInfo(wav)).toMatchObject({ channelCount: 4, format: 'pcm', bitDepth: 16 })
    expect(decodeWav(wav).channels).toHaveLength(4)
  })

  it('rejects empty or ragged input', () => {
    expect(() => encodeWav({ channels: [], sampleRate: 48000 })).toThrow(/at least one channel/)
    expect(() =>
      encodeWav({ channels: [new Float32Array(4), new Float32Array(3)], sampleRate: 48000 }),
    ).toThrow(/differ in length/)
  })

  it('encodes an AudioBuffer and wraps a Blob', () => {
    const buffer = new MockAudioBuffer(2, 10, 48000)
    buffer.getChannelData(0).fill(0.25)
    const wav = audioBufferToWav(buffer as unknown as AudioBuffer)
    const decoded = decodeWav(wav)
    expect(decoded.channels[0][3]).toBeCloseTo(0.25, 4)
    expect(decoded.channels[1][3]).toBe(0)
    const blob = wavBlob({ channels: [ramp(4)], sampleRate: 8000 })
    expect(blob.type).toBe('audio/wav')
    expect(blob.size).toBe(44 + 8)
  })

  it('readWavInfo rejects non-WAV data', () => {
    expect(() => readWavInfo(new ArrayBuffer(64))).toThrow(/not a WAV/)
  })
})
