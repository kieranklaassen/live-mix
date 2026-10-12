// The offline patch renderer on the committed device modules: where notes
// land, that a render repeats exactly, and what the loop, skip, normalise and
// fade options do to the result.

import { describe, expect, it } from 'vitest'

import { type Patch } from '../../core/devices/patch'
import { NODE_DEVICES } from '../../core/devices/native'
import { type PlanarAudio } from '../../core/render/encode'
import { TAPE_DEVICE } from '../devices/tape.gen'
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

  it('takes what the devices are late by out of the start, when asked to', async () => {
    const phrase = { notes: [{ atSec: 0.25, durSec: 0.2, note: 69 }] }
    // A tape is 415 frames late at this rate, and says so; a bell is not late at all.
    const taped: Patch = { ...BELL, effects: [{ deviceId: 'tape' }] }
    const late = TAPE_DEVICE.latencySamples?.(RATE) ?? 0
    expect(late).toBe(415)
    const whole = await render(taped, { durationSec: 2, phrase })
    const aligned = await render(taped, { durationSec: 1, phrase, alignLatency: true })
    expect(aligned.channels[0]).toHaveLength(RATE)
    expect(aligned.channels[0]).toEqual(whole.channels[0].slice(late, late + RATE))
    // With a skip too: both are left out, the latency first.
    const skipped = await render(taped, {
      durationSec: 1,
      skipSec: 0.5,
      phrase,
      alignLatency: true,
    })
    expect(skipped.channels[0]).toEqual(
      whole.channels[0].slice(late + RATE / 2, late + RATE / 2 + RATE),
    )
    // Not asked, the render is what the devices put out; and a chain that is not late is the same either way.
    expect((await render(taped, { durationSec: 1, phrase })).channels[0]).toEqual(
      whole.channels[0].slice(0, RATE),
    )
    const plain = await render(BELL, { durationSec: 1, phrase })
    expect(
      (await render(BELL, { durationSec: 1, phrase, alignLatency: true })).channels[0],
    ).toEqual(plain.channels[0])
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

  it('asked to, levels by the peak the fades leave, so a sound that is loudest as it ends is as loud as asked', async () => {
    // Struck inside the fade: the largest sample of the render is one the fade takes down.
    const options = {
      durationSec: 1,
      phrase: { notes: [{ atSec: 0.93, durSec: 0.07, note: 72 }] },
      fadeOutSec: 0.1,
    }
    const plain = await render(BELL, options)
    const levelled = await render(BELL, { ...options, normalizePeakDb: -6, peakAfterFades: true })
    expect(toDb(peakOf(levelled.channels))).toBeCloseTo(-6, 3)
    // The same sound, only louder or softer: one gain for every sample.
    const gain = peakOf(levelled.channels) / peakOf(plain.channels)
    const at = plain.channels[0].findIndex((value) => Math.abs(value) > 0.01)
    expect(levelled.channels[0][at] / plain.channels[0][at]).toBeCloseTo(gain, 4)
  })

  it('not asked to, levels by the peak before the fades, so a recipe a host kept renders as it did', async () => {
    // What a host makes of a sound of its own: a held chord cut short with a fade and brought
    // to a peak. Its largest sample lies in the fade, and the level is taken without the fade.
    const ORGAN: Patch = { ...BELL, id: 'organ', instrument: { deviceId: 'organ' } }
    const cut = {
      durationSec: 1,
      phrase: {
        notes: [
          { atSec: 0, durSec: 4, note: 60 },
          { atSec: 0.9, durSec: 3, note: 67 },
        ],
      },
    }
    const unfaded = await render(ORGAN, cut)
    const made = await render(ORGAN, { ...cut, fadeOutSec: 0.5, normalizePeakDb: -6 })
    const frames = unfaded.channels[0].length
    const scale = 10 ** (-6 / 20) / peakOf(unfaded.channels)
    const fade = Math.round(0.5 * RATE)
    // Every sample is the unfaded one, times the one gain that brings the unfaded peak to −6,
    // times the fade: nothing of the fade is in the gain.
    let apart = 0
    for (let i = 0; i < frames; i += 1) {
      const fromEnd = frames - 1 - i
      const want = unfaded.channels[0][i] * scale * (fromEnd < fade ? fromEnd / fade : 1)
      apart = Math.max(apart, Math.abs(made.channels[0][i] - want))
    }
    expect(apart).toBeLessThan(1e-6)
    // The case that tells the two rules apart: the peak handed back is under the level asked for.
    expect(toDb(peakOf(made.channels))).toBeLessThan(-6.5)
    const asked = await render(ORGAN, {
      ...cut,
      fadeOutSec: 0.5,
      normalizePeakDb: -6,
      peakAfterFades: true,
    })
    expect(toDb(peakOf(asked.channels))).toBeCloseTo(-6, 3)
  })

  it('asked to, lays every pass of a phrase played round on the same frames, so the fold leaves the first stroke as it is', async () => {
    // A closed hat that repeats exactly, on the first beat of each pass; a pass is 24000.6
    // frames, so the third pass rounded on its own would start a frame before twice the second.
    const hat: Patch = {
      ...BELL,
      instrument: { deviceId: 'club-kit', params: { variation: 0 } },
      effects: [],
    }
    const durationSec = 24000.6 / 48000
    const stroke = (atSec: number) => ({ atSec, durSec: 0.1, note: 65 })
    const round = {
      durationSec,
      skipSec: durationSec,
      loopFold: 'linear' as const,
      wholeFramePasses: true,
    }
    const phrase = { notes: [0, 1, 2].map((pass) => stroke(pass * durationSec)) }
    const straight = await render(hat, { ...round, phrase })
    const folded = await render(hat, { ...round, phrase, loopCrossfadeSec: 0.03 })
    const apart = (a: PlanarAudio, b: PlanarAudio): number => {
      let most = 0
      for (let i = 0; i < 1440; i += 1) {
        most = Math.max(most, Math.abs(a.channels[0][i] - b.channels[0][i]))
      }
      return most
    }
    expect(peakOf(straight.channels)).toBeGreaterThan(0.05)
    expect(apart(folded, straight)).toBeLessThan(1e-6)
    // The measure can tell: with the last pass a frame early the fold changes the stroke.
    const early = { notes: [stroke(0), stroke(durationSec), stroke(2 * durationSec - 1 / 48000)] }
    const slipped = await render(hat, { ...round, phrase: early, loopCrossfadeSec: 0.03 })
    expect(apart(slipped, straight)).toBeGreaterThan(1e-3)
    // Not asked to, every stroke is rounded on its own, as a loop a host had was rendered: the
    // third pass starts a frame early there too, and the fold changes the stroke as it did.
    const own = {
      durationSec,
      skipSec: durationSec,
      loopFold: 'linear' as const,
      phrase,
      loopCrossfadeSec: 0.03,
    }
    const before = await render(hat, own)
    expect(apart(before, straight)).toBeGreaterThan(1e-3)
    const refused = await render(hat, { ...own, wholeFramePasses: false })
    expect(refused.channels[0]).toEqual(before.channels[0])
  })

  it('puts a stroke half a frame into its pass on the same frame of every pass', async () => {
    // 22711.5 frames in at 44.1 kHz, a clap 15 ms behind the second beat of a bar at 120: half a
    // frame only as near as its seconds are kept, a hair under in one pass and over in the next.
    const hat: Patch = {
      ...BELL,
      instrument: { deviceId: 'club-kit', params: { variation: 0 } },
      effects: [],
    }
    const durationSec = 2
    const stroke = (atSec: number) => ({ atSec, durSec: 0.1, note: 65 })
    const phrase = {
      notes: [0, 1, 2, 3].flatMap((pass) => [
        stroke(pass * durationSec),
        stroke(pass * durationSec + 0.515),
      ]),
    }
    const round = {
      durationSec,
      sampleRate: 44100,
      loopFold: 'linear' as const,
      wholeFramePasses: true,
      loopCrossfadeSec: 0.03,
      phrase,
    }
    // Whichever pass is kept, the render is the same.
    const second = await render(hat, { ...round, skipSec: durationSec })
    const third = await render(hat, { ...round, skipSec: 2 * durationSec })
    let most = 0
    let peak = 0
    for (let i = 22000; i < 26000; i += 1) {
      most = Math.max(most, Math.abs(second.channels[0][i] - third.channels[0][i]))
      peak = Math.max(peak, Math.abs(second.channels[0][i]))
    }
    expect(peak).toBeGreaterThan(0.01)
    expect(most).toBeLessThan(1e-6)
  })

  it('keeps a skip and a stroke from before the start at the start, laid round or not', async () => {
    const options = {
      durationSec: 0.5,
      loopFold: 'linear' as const,
      wholeFramePasses: true,
      loopCrossfadeSec: 0.03,
      phrase: { notes: [{ atSec: -0.25, durSec: 0.4, note: 72 }] },
    }
    const early = await render(BELL, { ...options, skipSec: -0.5 })
    expect(early.channels[0].length).toBe(24000)
    // Held its whole length from the first frame, as a stroke written at nothing is.
    const atStart = {
      ...options,
      phrase: { notes: [{ atSec: 0, durSec: 0.4, note: 72 }] },
    }
    expect(early.channels[0]).toEqual((await render(BELL, atStart)).channels[0])
  })

  it('turns what the devices put out up or down by a fixed gain where no peak is asked for', async () => {
    const options = { durationSec: 0.5, phrase: { notes: [{ atSec: 0, durSec: 0.4, note: 72 }] } }
    const plain = await render(BELL, options)
    const down = await render(BELL, { ...options, gainDb: -6 })
    expect(toDb(peakOf(down.channels)) - toDb(peakOf(plain.channels))).toBeCloseTo(-6, 3)
    // A peak asked for wins: the gain is for a result that keeps its own level.
    const levelled = await render(BELL, { ...options, gainDb: -6, normalizePeakDb: -3 })
    expect(toDb(peakOf(levelled.channels))).toBeCloseTo(-3, 3)
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

  it('refuses to hand back a sample that is no number', async () => {
    // Every effect bypassed: what comes out is what went in.
    const through: Patch = { ...ECHO, effects: [{ deviceId: 'tape-echo', bypass: true }] }
    for (const bad of [Infinity, -Infinity, NaN]) {
      const input = click(0.1)
      input.channels[0][100] = bad
      expect(Number.isFinite(peakOf(input.channels)), `the peak with ${bad} in it`).toBe(false)
      await expect(render(through, { durationSec: 0.5, input }), `${bad}`).rejects.toThrow(
        /non-finite/,
      )
    }
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

  it('does not render for a signal that has aborted already, however short the render', async () => {
    const controller = new AbortController()
    controller.abort()
    const options = { durationSec: 0.01, compile: compileFromDisk, signal: controller.signal }
    // Too short to reach the end of a slice, where the signal is looked at…
    await expect(renderPatch(BELL, options)).rejects.toThrow()
    // …and in one go there is no slice at all.
    await expect(renderPatch(BELL, { ...options, sliceMs: 0 })).rejects.toThrow()
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
