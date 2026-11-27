import { createHash } from 'node:crypto'
import { runInNewContext } from 'node:vm'

import { describe, expect, it } from 'vitest'

import { MockAudioBuffer } from '../../../testing'
import {
  audioBufferToWav,
  decodeWav,
  deinterleave,
  encodeWav,
  interleave,
  planarFromAudioBuffer,
  readWavInfo,
  wavBlob,
} from '../encode'

function ramp(frames: number, scale = 1): Float32Array {
  return Float32Array.from({ length: frames }, (_, i) => scale * ((2 * i) / (frames - 1) - 1))
}

const RATE = 48000

/** The whole numbers a depth counts in: one step is one of them. */
const STEPS = { 16: 32768, 24: 8388608 } as const

/** A second of two tones that share no period, inside full scale. */
function second(level = 0.8): Float32Array {
  return Float32Array.from(
    { length: RATE },
    (_, i) =>
      level *
      (0.6 * Math.sin((2 * Math.PI * 440 * i) / RATE) +
        0.4 * Math.sin((2 * Math.PI * 1234.5 * i) / RATE + 1)),
  )
}

/** Each sample of a one-channel file, counted in steps of its depth. */
function inSteps(wav: ArrayBuffer, depth: 16 | 24): number[] {
  return Array.from(decodeWav(wav).channels[0], (value) => value * STEPS[depth])
}

function sha256(wav: ArrayBuffer): string {
  return createHash('sha256').update(new Uint8Array(wav)).digest('hex')
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

  it.each([16, 24] as const)(
    'writes a %i-bit file that, read and written again, is the same file',
    (bitDepth) => {
      // Every whole number 16 bits hold, and at 24 bits the same count of them spread over its range.
      const spread = STEPS[bitDepth] / 32768
      const source = Float32Array.from({ length: 65536 }, (_, i) => (i - 32768) / 32768)
      const wav = encodeWav({ channels: [source, source], sampleRate: RATE }, { bitDepth })
      expect(readWavInfo(wav)).toMatchObject({ bitDepth, format: 'pcm', frames: 65536 })
      const view = new DataView(wav)
      const { dataOffset } = readWavInfo(wav)
      expect(view.getInt16(dataOffset + (bitDepth === 16 ? 0 : 1), true)).toBe(-32768)
      expect(inSteps(wav, bitDepth)[40000]).toBe((40000 - 32768) * spread)
      const again = encodeWav(decodeWav(wav), { bitDepth })
      expect(again.byteLength).toBe(wav.byteLength)
      expect(sha256(again)).toBe(sha256(wav))
    },
  )

  it.each([16, 24] as const)(
    'writes each sample of a %i-bit file within half a step of the sound, with no dither',
    (bitDepth) => {
      const steps = STEPS[bitDepth]
      const source = second(1)
      // The lowest and the highest a file holds: full scale down, and one step under it up.
      source[0] = -1
      source[1] = (steps - 1) / steps
      const wav = encodeWav({ channels: [source], sampleRate: RATE }, { bitDepth })
      const written = inSteps(wav, bitDepth)
      const worst = Math.max(...written.map((code, i) => Math.abs(code - source[i] * steps)))
      expect(worst).toBeLessThanOrEqual(0.5)
      expect(worst).toBeGreaterThan(0.49)
      expect(written.every(Number.isInteger)).toBe(true)
      expect(written[0]).toBe(-steps)
      expect(written[1]).toBe(steps - 1)
      // Nothing is drawn: the same sound is the same file.
      expect(sha256(encodeWav({ channels: [source], sampleRate: RATE }, { bitDepth }))).toBe(
        sha256(wav),
      )
    },
  )

  it.each([16, 24] as const)(
    'dithers a %i-bit file: within a step and a half, right on average, three values for silence',
    (bitDepth) => {
      const steps = STEPS[bitDepth]
      const source = second()
      const wav = encodeWav(
        { channels: [source], sampleRate: RATE },
        { bitDepth, dither: { seed: 7 } },
      )
      const errors = inSteps(wav, bitDepth).map((code, i) => code - source[i] * steps)
      const worst = Math.max(...errors.map(Math.abs))
      expect(worst).toBeLessThan(1.5)
      // More than rounding alone can be off by: the noise is there.
      expect(worst).toBeGreaterThan(1)
      const mean = errors.reduce((sum, error) => sum + error, 0) / errors.length
      expect(Math.abs(mean)).toBeLessThan(0.01)
      // Half a step, as a level: a twelfth of a step squared for the rounding and a sixth for the noise.
      const power = errors.reduce((sum, error) => sum + error * error, 0) / errors.length
      expect(Math.sqrt(power)).toBeGreaterThan(0.49)
      expect(Math.sqrt(power)).toBeLessThan(0.51)

      const silence = encodeWav(
        { channels: [new Float32Array(RATE)], sampleRate: RATE },
        { bitDepth, dither: { seed: 7 } },
      )
      const values = [...new Set(inSteps(silence, bitDepth))].sort((a, b) => a - b)
      expect(values).toEqual([-1, 0, 1])
    },
  )

  it('draws the same noise for the same seed, another for another seed, and its own for each channel', () => {
    const source = second()
    const audio = { channels: [source, source], sampleRate: RATE }
    for (const bitDepth of [16, 24] as const) {
      const first = encodeWav(audio, { bitDepth, dither: { seed: 20261122 } })
      const second_ = encodeWav(audio, { bitDepth, dither: { seed: 20261122 } })
      const other = encodeWav(audio, { bitDepth, dither: { seed: 20261123 } })
      const plain = encodeWav(audio, { bitDepth })
      expect(second_.byteLength).toBe(first.byteLength)
      expect(sha256(second_)).toBe(sha256(first))
      expect(sha256(other)).not.toBe(sha256(first))
      expect(sha256(plain)).not.toBe(sha256(first))
      expect(other.byteLength).toBe(first.byteLength)
      // The two channels hold one sound, and each has noise of its own.
      const [left, right] = decodeWav(first).channels
      expect(left.some((value, i) => value !== right[i])).toBe(true)
    }
  })

  it('holds a sample over full scale at full scale at 16 and 24 bits, dithered or not', () => {
    for (const bitDepth of [16, 24] as const) {
      const steps = STEPS[bitDepth]
      const over = Float32Array.from({ length: 2000 }, (_, i) => (i % 2 === 0 ? 1.7 : -1.7))
      for (const dither of [undefined, { seed: 3 }]) {
        const written = inSteps(
          encodeWav({ channels: [over], sampleRate: RATE }, { bitDepth, dither }),
          bitDepth,
        )
        expect(written.every((code, i) => code === (i % 2 === 0 ? steps - 1 : -steps))).toBe(true)
      }
      // At full scale itself the noise has nowhere to go past the last whole number.
      const edge = Float32Array.from({ length: 2000 }, (_, i) => (i % 2 === 0 ? 1 : -1))
      const dithered = inSteps(
        encodeWav({ channels: [edge], sampleRate: RATE }, { bitDepth, dither: { seed: 3 } }),
        bitDepth,
      )
      expect(Math.max(...dithered)).toBe(steps - 1)
      expect(Math.min(...dithered)).toBe(-steps)
    }
  })

  it('writes the 32-bit float file it always wrote, and the same one when dither is asked for', () => {
    const tone = (hz: number, level: number): Float32Array =>
      Float32Array.from({ length: 480 }, (_, i) => level * Math.sin((2 * Math.PI * hz * i) / RATE))
    const left = tone(440, 0.5)
    const right = tone(660, 0.25)
    left[7] = 1.5
    right[9] = -2
    const audio = { channels: [left, right], sampleRate: RATE }
    const wav = encodeWav(audio, { bitDepth: 32 })
    // Taken from the writer as it was before it could dither, for this sound.
    expect(wav.byteLength).toBe(3920)
    expect(sha256(wav)).toBe('fcce9157c469b38a0fb2d729f535d37ab8281a4a2e388d8408030fe84c521635')
    expect(sha256(encodeWav(audio, { bitDepth: 32, dither: { seed: 5 } }))).toBe(sha256(wav))
    const decoded = decodeWav(wav)
    expect(decoded.channels[0][7]).toBe(1.5)
    expect(decoded.channels[1][9]).toBe(-2)
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

  it('refuses a WAV whose header names no channels, rather than counting frames without end', () => {
    const wav = encodeWav({ channels: [ramp(8)], sampleRate: 48000 })
    new DataView(wav).setUint16(22, 0, true) // channel count
    // Asked of the header first: before it was refused, decoding this file never returned.
    expect(() => readWavInfo(wav)).toThrow(/no channels/)
    expect(() => decodeWav(wav)).toThrow(/no channels/)
  })

  it('refuses a WAV whose header names a sample of no bits', () => {
    const wav = encodeWav({ channels: [ramp(8)], sampleRate: 48000 })
    new DataView(wav).setUint16(34, 0, true) // bits per sample
    expect(() => readWavInfo(wav)).toThrow(/no bits/)
  })
})

describe('planarFromAudioBuffer', () => {
  it("copies into arrays of its own, also from a buffer of another page's", () => {
    const theirs = runInNewContext('Float32Array.of(0.25, -0.5, 1)') as Float32Array<ArrayBuffer>
    expect(theirs).not.toBeInstanceOf(Float32Array)
    const buffer = { numberOfChannels: 1, sampleRate: RATE, getChannelData: () => theirs }
    const { channels, sampleRate } = planarFromAudioBuffer(buffer as unknown as AudioBuffer)
    expect(sampleRate).toBe(RATE)
    expect(channels[0]).toBeInstanceOf(Float32Array)
    expect(channels[0].buffer).not.toBe(theirs.buffer)
    expect(Array.from(channels[0])).toEqual([0.25, -0.5, 1])
  })
})
