// The offline patch renderer on the committed device modules: where notes
// land, that a render repeats exactly, and what the loop, skip, normalise and
// fade options do to the result.

import { describe, expect, it } from 'vitest'

import { type Patch } from '../../core/devices/patch'
import { NODE_DEVICES } from '../../core/devices/native'
import { type PlanarAudio } from '../../core/render/encode'
import {
  type RenderPatchOptions,
  canRenderPatch,
  foldLoop,
  noteFrequency,
  peakOf,
  renderPatch,
} from '../patch-render'
import { compileFromDisk, toDb } from './render-support'

const RATE = 48000

const BELL: Patch = {
  id: 'bell',
  name: 'Bell',
  category: 'bell',
  description: 'A struck bell.',
  instrument: { deviceId: 'modal-bells' },
  effects: [],
}

const ECHO: Patch = {
  id: 'echo',
  name: 'Echo',
  category: 'echo',
  description: 'One tape echo.',
  effects: [{ deviceId: 'tape-echo', params: { time: 500, mix: 0.5, feedback: 0.5 } }],
}

const render = (patch: Patch, options: Partial<RenderPatchOptions> & { durationSec: number }) =>
  renderPatch(patch, { compile: compileFromDisk, sliceMs: 0, ...options })

const firstSound = (audio: PlanarAudio): number =>
  audio.channels[0].findIndex((value, i) => value !== 0 || audio.channels[1][i] !== 0)

function click(seconds: number): PlanarAudio {
  const channel = new Float32Array(Math.round(seconds * RATE))
  for (let i = 0; i < 480; i += 1) channel[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / RATE)
  return { channels: [channel], sampleRate: RATE }
}

function tone(seconds: number, hz: number): PlanarAudio {
  const channel = new Float32Array(Math.round(seconds * RATE))
  for (let i = 0; i < channel.length; i += 1)
    channel[i] = 0.5 * Math.sin((2 * Math.PI * hz * i) / RATE)
  return { channels: [channel], sampleRate: RATE }
}

describe('renderPatch', () => {
  it('starts a note on the frame the phrase names, at any block offset', async () => {
    for (const atSec of [0, 0.5, 0.7531]) {
      const audio = await render(BELL, {
        durationSec: 1.5,
        phrase: { notes: [{ atSec, durSec: 0.2, note: 69 }] },
      })
      expect(audio.sampleRate).toBe(RATE)
      expect(audio.channels).toHaveLength(2)
      expect(audio.channels[0]).toHaveLength(1.5 * RATE)
      const start = firstSound(audio)
      expect(start).toBeGreaterThanOrEqual(Math.round(atSec * RATE))
      // The first non-zero sample is within a millisecond of the note.
      expect(start - Math.round(atSec * RATE)).toBeLessThan(48)
    }
  })

  it('gives the same samples every time, sliced or not', async () => {
    const options = {
      durationSec: 2,
      phrase: {
        notes: [
          { atSec: 0, durSec: 1, note: 57 },
          { atSec: 0.31, durSec: 1, note: 64, gain: 0.5 },
        ],
      },
    }
    const patch: Patch = { ...BELL, effects: [{ deviceId: 'shimmer' }] }
    const once = await render(patch, options)
    const again = await render(patch, options)
    const sliced = await render(patch, { ...options, sliceMs: 1 })
    expect(peakOf(once.channels)).toBeGreaterThan(0.01)
    expect(again.channels[0]).toEqual(once.channels[0])
    expect(sliced.channels[1]).toEqual(once.channels[1])
  })

  it('plays a phrase note at its pitch', async () => {
    const audio = await render(
      {
        ...BELL,
        instrument: {
          deviceId: 'wavetable',
          preset: 'Still sine',
          params: { sub: 0, detune: 0, attack: 0.01 },
        },
      },
      { durationSec: 1, phrase: { notes: [{ atSec: 0, durSec: 1, note: 69 }] } },
    )
    // Count upward zero crossings of the steady part: 440 Hz within a couple of hertz.
    const channel = audio.channels[0]
    let crossings = 0
    for (let i = RATE / 2 + 1; i < RATE; i += 1)
      if (channel[i - 1] < 0 && channel[i] >= 0) crossings += 1
    expect(crossings * 2).toBeGreaterThan(noteFrequency(69) - 6)
    expect(crossings * 2).toBeLessThan(noteFrequency(69) + 6)
    expect(noteFrequency(57)).toBeCloseTo(220)
  })

  it('runs an input through an effect chain and lets the tail ring past it', async () => {
    const audio = await render(ECHO, { durationSec: 2, input: click(0.1) })
    const energy = (from: number, to: number) => {
      let sum = 0
      for (let i = Math.round(from * RATE); i < Math.round(to * RATE); i += 1) {
        sum += audio.channels[0][i] ** 2
      }
      return sum
    }
    // The dry click, a gap, then repeats half a second apart.
    expect(energy(0, 0.05)).toBeGreaterThan(0.1)
    expect(energy(0.48, 0.6)).toBeGreaterThan(energy(0.2, 0.4) * 10)
    expect(energy(0.98, 1.1)).toBeGreaterThan(energy(0.7, 0.9) * 10)
  })

  it('skips bypassed effects', async () => {
    const options = { durationSec: 1, phrase: { notes: [{ atSec: 0, durSec: 0.5, note: 60 }] } }
    const dry = await render(BELL, options)
    const bypassed = await render(
      { ...BELL, effects: [{ deviceId: 'shimmer', bypass: true }] },
      options,
    )
    expect(bypassed.channels[0]).toEqual(dry.channels[0])
  })

  it('renders a bypassed instrument silent', async () => {
    const audio = await render(
      { ...BELL, instrument: { deviceId: 'modal-bells', bypass: true } },
      { durationSec: 1, phrase: { notes: [{ atSec: 0, durSec: 0.5, note: 60 }] } },
    )
    expect(peakOf(audio.channels)).toBe(0)
  })

  it('drops the skipped start, so what is left is the later part of the same render', async () => {
    const phrase = { notes: [{ atSec: 0, durSec: 3, note: 48 }] }
    const patch: Patch = { ...BELL, instrument: { deviceId: 'string-machine' } }
    const whole = await render(patch, { durationSec: 3, phrase })
    const late = await render(patch, { durationSec: 1, skipSec: 2, phrase })
    expect(late.channels[0]).toEqual(whole.channels[0].slice(2 * RATE))
  })

  it('folds the overhang onto the start so the sound loops without a step', async () => {
    const phrase = { notes: [{ atSec: 0, durSec: 30, note: 45 }] }
    const patch: Patch = { ...BELL, instrument: { deviceId: 'string-machine' } }
    const loop = await render(patch, { durationSec: 2, skipSec: 3, loopCrossfadeSec: 0.5, phrase })
    const plain = await render(patch, { durationSec: 2, skipSec: 3, phrase })
    const steps = (channel: Float32Array) => {
      let largest = 0
      for (let i = 1; i < channel.length; i += 1) {
        largest = Math.max(largest, Math.abs(channel[i] - channel[i - 1]))
      }
      return largest
    }
    for (const index of [0, 1]) {
      const channel = loop.channels[index]
      const seam = Math.abs(channel[0] - channel[channel.length - 1])
      // The wrap is no bigger a step than the sound makes anyway…
      expect(seam).toBeLessThanOrEqual(steps(channel))
      // …and after the crossfade the loop is the plain render again.
      expect(channel.slice(RATE)).toEqual(plain.channels[index].slice(RATE))
    }
  })

  it('normalises the peak and fades the ends', async () => {
    const audio = await render(BELL, {
      durationSec: 1,
      phrase: { notes: [{ atSec: 0, durSec: 1, note: 72 }] },
      normalizePeakDb: -6,
      fadeOutSec: 0.1,
    })
    expect(toDb(peakOf(audio.channels))).toBeCloseTo(-6, 1)
    expect(Math.abs(audio.channels[0][audio.channels[0].length - 1])).toBe(0)

    const silent = await render(BELL, { durationSec: 0.25, normalizePeakDb: -6 })
    expect(peakOf(silent.channels)).toBe(0)
  })

  it('hands a sample instrument the sound it plays', async () => {
    const patch: Patch = { ...BELL, instrument: { deviceId: 'sampler' } }
    const phrase = { notes: [{ atSec: 0, durSec: 0.5, note: 60 }] }
    // Without one the sampler plays its built-in tone; with one, that sound.
    const builtIn = await render(patch, { durationSec: 0.5, phrase })
    const fed = await render(patch, { durationSec: 0.5, phrase, sample: tone(1, 330) })
    expect(peakOf(fed.channels)).toBeGreaterThan(0.01)
    expect(fed.channels[0]).not.toEqual(builtIn.channels[0])
  })

  it('refuses what it cannot render and says why', async () => {
    await expect(render(ECHO, { durationSec: 1 })).rejects.toThrow(/needs an input/)
    await expect(
      render(ECHO, { durationSec: 1, input: { ...click(0.1), sampleRate: 44100 } }),
    ).rejects.toThrow(/44100 Hz/)
    await expect(render(BELL, { durationSec: 0 })).rejects.toThrow(/positive durationSec/)
    await expect(
      render({ ...BELL, instrument: { deviceId: 'nope' } }, { durationSec: 1 }),
    ).rejects.toThrow(/unknown device "nope"/)
    await expect(
      render({ ...BELL, instrument: { deviceId: 'shimmer' } }, { durationSec: 1 }),
    ).rejects.toThrow(/takes no notes/)

    const nodes = new Map(NODE_DEVICES.map((descriptor) => [descriptor.id, descriptor]))
    const withNode: Patch = { ...ECHO, effects: [{ deviceId: 'delay' }] }
    const describe = (id: string) => nodes.get(id)
    expect(canRenderPatch(withNode, describe)).toBe(false)
    expect(canRenderPatch(withNode)).toBe(false)
    expect(canRenderPatch(ECHO)).toBe(true)
    await expect(render(withNode, { durationSec: 1, input: click(0.1), describe })).rejects.toThrow(
      /not a WASM device/,
    )
  })

  it('stops when its signal aborts', async () => {
    const controller = new AbortController()
    const pending = renderPatch(BELL, {
      durationSec: 60,
      compile: compileFromDisk,
      sliceMs: 1,
      signal: controller.signal,
    })
    controller.abort()
    await expect(pending).rejects.toThrow()
  })
})

describe('foldLoop', () => {
  it('keeps the body, blends the overhang into the start, and returns the loop length', () => {
    const frames = 1000
    const crossfade = 100
    const channel = new Float32Array(frames + crossfade)
    for (let i = 0; i < channel.length; i += 1) channel[i] = Math.sin(i * 0.05)
    const out = foldLoop(channel, frames, crossfade)
    expect(out).toHaveLength(frames)
    expect(out.slice(crossfade)).toEqual(channel.slice(crossfade, frames))
    // The loop start continues from where the body ended.
    expect(Math.abs(out[0] - channel[frames])).toBeLessThan(0.02)
    expect(Math.abs(out[0] - out[frames - 1])).toBeLessThan(0.07)
    // No overhang to fold: the body comes back as it is.
    expect(foldLoop(channel.slice(0, frames), frames, crossfade)).toEqual(channel.slice(0, frames))
  })

  it('adds a stretch to itself at equal amplitude when the fold is linear', () => {
    const frames = 1000
    const crossfade = 200
    // The overhang is the start over again, as it is for a phrase played round.
    const channel = new Float32Array(frames + crossfade)
    for (let i = 0; i < channel.length; i += 1) channel[i] = Math.sin((i % frames) * 0.05)
    const linear = foldLoop(channel, frames, crossfade, 'linear')
    const power = foldLoop(channel, frames, crossfade)
    for (let i = 0; i < crossfade; i += 1) expect(linear[i]).toBeCloseTo(channel[i], 6)
    // Equal power swells by up to 3 dB where the two are the same sound.
    const middle = crossfade / 2
    const peak = Math.max(...power.slice(middle - 70, middle + 70).map(Math.abs))
    expect(peak).toBeGreaterThan(1.35)
    expect(linear.slice(crossfade)).toEqual(channel.slice(crossfade, frames))
  })
})
