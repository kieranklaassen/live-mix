// The zone sampler's committed artefact, driven the three ways an app reaches
// it: rendered without an audio context (`renderPatch` with `zones`), through
// the worklet processor's messages, and from a `WasmDevice` on the main
// thread. What each zone does in detail is asserted natively
// (cpp/test/zone_sampler_test.cpp); here the question is whether an
// instrument that starts as a zone map, or as another tool's file, comes out
// of the device at the right pitch.

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { type Patch } from '../../core/devices/patch'
import { asAudioContext, createMockContext, type MockAudioContext } from '../../testing'
import { type DeviceMessage } from '../abi'
import { PLATE_REVERB_DEVICE } from '../devices/plate-reverb'
import { ZONE_SAMPLER_DEVICE, ZONE_SAMPLER_PARAMS } from '../devices/zone-sampler.gen'
import { noteFrequency, renderPatch } from '../patch-render'
import { WasmDevice, type WorkletNodeFactory } from '../WasmDevice'
import { parseDspreset, writeDspreset } from '../zones/dspreset'
import { parseSfz } from '../zones/sfz'
import { prepareZoneLoad, type ZoneMap, type ZoneSample } from '../zones/zone-map'
import { compileFromDisk } from './render-support'
// Registers the processor into the shimmed `registerProcessor`.
import '../worklets/wasm-device.processor'

const registry = vi.hoisted(() => {
  const processors = new Map<string, unknown>()
  class MockMessagePortShim {
    posted: unknown[] = []
    onmessage: ((event: { data: unknown }) => void) | null = null
    postMessage(message: unknown): void {
      this.posted.push(message)
    }
    receive(data: unknown): void {
      this.onmessage?.({ data })
    }
  }
  class AudioWorkletProcessorShim {
    port = new MockMessagePortShim()
  }
  Object.assign(globalThis, {
    AudioWorkletProcessor: AudioWorkletProcessorShim,
    registerProcessor: (name: string, ctor: unknown) => processors.set(name, ctor),
    sampleRate: 48000,
  })
  return processors
})

const RATE = 48000
const CAPACITY = ZONE_SAMPLER_DEVICE.zones ?? { maxZones: 0, maxSamples: 0, poolFloats: 0 }

/** A sine on `hz` with a partial `marker` times above it: the marker says which sound a key played. */
function marked(hz: number, marker: number, seconds: number, sampleRate = RATE): ZoneSample {
  const channel = new Float32Array(Math.round(seconds * sampleRate))
  for (let i = 0; i < channel.length; i += 1) {
    const phase = (2 * Math.PI * hz * i) / sampleRate
    channel[i] = 0.5 * (Math.sin(phase) + Math.sin(marker * phase) / 3)
  }
  return { channels: [channel], sampleRate }
}

/** Level of the `hz` component over the second half of `x` (Hann-windowed). */
function toneLevel(x: Float32Array, hz: number, sampleRate = RATE): number {
  const from = Math.floor(x.length / 2)
  const n = x.length - from
  let re = 0
  let im = 0
  let sum = 0
  for (let i = 0; i < n; i += 1) {
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n)
    const phase = (2 * Math.PI * hz * i) / sampleRate
    re += window * x[from + i] * Math.cos(phase)
    im -= window * x[from + i] * Math.sin(phase)
    sum += window
  }
  return (2 * Math.hypot(re, im)) / sum
}

/** The strongest frequency within a third of an octave of `near`, to a tenth of a cent. */
function pitchNear(x: Float32Array, near: number): number {
  let best = near
  let level = -1
  let span = near * 0.26
  for (let pass = 0; pass < 5; pass += 1) {
    const centre = best
    for (let step = -20; step <= 20; step += 1) {
      const hz = centre + (span * step) / 20
      const found = toneLevel(x, hz)
      if (found > level) {
        level = found
        best = hz
      }
    }
    span /= 10
  }
  return best
}

const markerOf = (x: Float32Array, hz: number): number =>
  [3, 5, 7].reduce((best, marker) =>
    toneLevel(x, hz * marker) > toneLevel(x, hz * best) ? marker : best,
  )

// Three recorded notes, a few keys each, the second one at another sample rate.
const THREE_ZONES: ZoneMap = {
  name: 'Three notes',
  zones: [
    { sample: 'c3', rootKey: 48, loKey: 45, hiKey: 51 },
    { sample: 'c4', rootKey: 60, loKey: 57, hiKey: 63 },
    { sample: 'c5', rootKey: 72, loKey: 69, hiKey: 75 },
  ],
}
const THREE_SOUNDS: Record<string, ZoneSample> = {
  c3: marked(noteFrequency(48), 3, 2),
  c4: marked(noteFrequency(60), 5, 2, 44100),
  c5: marked(noteFrequency(72), 7, 2),
}

const PATCH: Patch = {
  id: 'three-notes',
  name: 'Three notes',
  category: 'keys',
  description: 'Three marked tones an octave apart, with no envelope to speak of.',
  instrument: {
    deviceId: 'zone-sampler',
    params: { attack: 0.001, release: 0.05, tone: 18000, velocity: 0, volume: 0 },
  },
  effects: [],
}

async function playKey(map: ZoneMap, sounds: Record<string, ZoneSample>, note: number) {
  const { plan, load } = prepareZoneLoad(map, sounds, CAPACITY)
  expect(plan.ok).toBe(true)
  const audio = await renderPatch(PATCH, {
    durationSec: 0.8,
    sampleRate: RATE,
    phrase: { notes: [{ atSec: 0, durSec: 0.8, note, gain: 0.8 }] },
    zones: load ?? undefined,
    compile: compileFromDisk,
    sliceMs: 0,
  })
  return audio.channels[0]
}

describe('zone-sampler: a three-zone instrument rendered offline', () => {
  const cases: [note: number, marker: number, where: string][] = [
    [48, 3, 'on the first root'],
    [60, 5, 'on the second root'],
    [72, 7, 'on the third root'],
    [51, 3, 'at the top of the first zone'],
    [53, 3, 'between the first two, nearer the first'],
    [55, 5, 'between the first two, nearer the second'],
    [65, 5, 'between the last two, nearer the second'],
    [67, 7, 'between the last two, nearer the third'],
    [36, 3, 'an octave below every zone'],
    [84, 7, 'an octave above every zone'],
    [96, 7, 'two octaves above'],
  ]

  it.each(cases)('key %i plays its own pitch from zone %i (%s)', async (note, marker) => {
    const out = await playKey(THREE_ZONES, THREE_SOUNDS, note)
    const expected = noteFrequency(note)
    // Within two cents.
    expect(Math.abs(1200 * Math.log2(pitchNear(out, expected) / expected))).toBeLessThan(2)
    expect(markerOf(out, expected)).toBe(marker)
  })

  it('plays nothing where the instrument is empty, and the built-in tones where none was loaded', async () => {
    const phrase = { notes: [{ atSec: 0, durSec: 0.4, note: 60 }] }
    const options = { durationSec: 0.4, phrase, compile: compileFromDisk, sliceMs: 0 }
    const builtIn = await renderPatch(PATCH, options)
    expect(Math.max(...builtIn.channels[0].map(Math.abs))).toBeGreaterThan(0.05)
    const empty = await renderPatch(PATCH, {
      ...options,
      zones: { samples: [], fields: new Float32Array(0) },
    })
    expect(Math.max(...empty.channels[0].map(Math.abs))).toBe(0)
  })

  it('plays an instrument that arrives as SFZ text, and the same one as a .dspreset', async () => {
    const sfz = `
      <control> default_path=notes/
      <global> ampeg_release=0.3
      <region> sample=low.wav lokey=45 hikey=51 pitch_keycenter=c3
      <region> sample=mid.wav lokey=57 hikey=63 pitch_keycenter=c4 tune=50
      <region> sample=high.wav lokey=69 hikey=75 pitch_keycenter=c5 cutoff=900
    `
    const read = parseSfz(sfz)
    expect(read.unsupported).toEqual([{ name: 'cutoff', count: 1 }])
    const sounds = {
      'notes/low.wav': THREE_SOUNDS.c3,
      'notes/mid.wav': THREE_SOUNDS.c4,
      'notes/high.wav': THREE_SOUNDS.c5,
    }
    for (const map of [read.map, parseDspreset(writeDspreset(read.map).text).map]) {
      // Key 67 lies between the second zone and the third, nearer the third.
      const between = await playKey(map, sounds, 67)
      expect(markerOf(between, noteFrequency(67))).toBe(7)
      expect(
        Math.abs(1200 * Math.log2(pitchNear(between, noteFrequency(67)) / noteFrequency(67))),
      ).toBeLessThan(2)
      // The second zone is tuned a quarter tone sharp.
      const sharp = await playKey(map, sounds, 60)
      expect(
        1200 * Math.log2(pitchNear(sharp, noteFrequency(60.5)) / noteFrequency(60)),
      ).toBeCloseTo(50, 0)
    }
  })
})

describe('zone-sampler: through the worklet processor', () => {
  type Processor = {
    port: { posted: unknown[]; receive(data: DeviceMessage): void }
    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean
  }
  let module: WebAssembly.Module

  beforeAll(async () => {
    const wasm = join(dirname(fileURLToPath(import.meta.url)), '../wasm/zone-sampler.wasm')
    module = await WebAssembly.compile(await readFile(wasm))
  })

  function construct(): Processor {
    const Ctor = registry.get('live-mix-wasm-device') as new (options: unknown) => Processor
    const params = ZONE_SAMPLER_PARAMS
    return new Ctor({
      processorOptions: {
        module,
        deviceId: 'zone-sampler',
        params: [
          [params.attack.id, 0.001],
          [params.tone.id, 18000],
          [params.velocity.id, 0],
          [params.volume.id, 0],
        ],
      },
    })
  }

  function render(processor: Processor, seconds: number): Float32Array {
    const out = new Float32Array(Math.round(seconds * RATE))
    for (let done = 0; done < out.length; done += 128) {
      const outputs = [[new Float32Array(128), new Float32Array(128)]]
      processor.process([], outputs)
      out.set(outputs[0][0].subarray(0, Math.min(128, out.length - done)), done)
    }
    return out
  }

  function send(processor: Processor, map: ZoneMap, sounds: Record<string, ZoneSample>) {
    const { load } = prepareZoneLoad(map, sounds, CAPACITY)
    if (!load) throw new Error('the instrument did not fit')
    processor.port.receive({ type: 'zones-begin' })
    for (const sample of load.samples) processor.port.receive({ type: 'zone-sample', ...sample })
    processor.port.receive({ type: 'zones', fields: load.fields })
  }

  it('takes an instrument one message a sound and plays a key between two zones', () => {
    const processor = construct()
    send(processor, THREE_ZONES, THREE_SOUNDS)
    processor.port.receive({ type: 'note-on', noteId: 1, frequency: noteFrequency(55), gain: 0.8 })
    const out = render(processor, 0.6)
    expect(
      Math.abs(1200 * Math.log2(pitchNear(out, noteFrequency(55)) / noteFrequency(55))),
    ).toBeLessThan(2)
    expect(markerOf(out, noteFrequency(55))).toBe(5)
  })

  it('replaces the instrument while a note sounds, without a step and without the old sound', () => {
    const processor = construct()
    send(processor, THREE_ZONES, THREE_SOUNDS)
    processor.port.receive({ type: 'note-on', noteId: 1, frequency: noteFrequency(60), gain: 0.8 })
    const before = render(processor, 0.3)
    send(
      processor,
      { zones: [{ sample: 'only', rootKey: 60 }] },
      { only: marked(noteFrequency(60), 3, 1) },
    )
    const during = render(processor, 0.1)
    const steepest = (x: Float32Array) =>
      x.reduce((worst, value, i) => (i === 0 ? 0 : Math.max(worst, Math.abs(value - x[i - 1]))), 0)
    expect(steepest(during)).toBeLessThanOrEqual(steepest(before) * 1.5)
    // The held note ended with its instrument; the next one plays the new sound.
    expect(Math.max(...during.subarray(2400).map(Math.abs))).toBe(0)
    processor.port.receive({ type: 'note-on', noteId: 2, frequency: noteFrequency(72), gain: 0.8 })
    expect(markerOf(render(processor, 0.5), noteFrequency(72))).toBe(3)
  })

  it('adds no zones when a sound did not fit, rather than zones that name the wrong sounds', () => {
    const processor = construct()
    processor.port.receive({ type: 'zones-begin' })
    // Larger than the pool: the device refuses it.
    processor.port.receive({
      type: 'zone-sample',
      channels: [new Float32Array(CAPACITY.poolFloats + 1)],
      sampleRate: RATE,
    })
    processor.port.receive({
      type: 'zone-sample',
      channels: [...THREE_SOUNDS.c3.channels],
      sampleRate: THREE_SOUNDS.c3.sampleRate,
    })
    processor.port.receive({
      type: 'zones',
      fields: Float32Array.of(0, 60, 0, 0, 127, 0, 127, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0),
    })
    processor.port.receive({ type: 'note-on', noteId: 1, frequency: 261.63, gain: 0.8 })
    expect(Math.max(...render(processor, 0.3).map(Math.abs))).toBe(0)
  })
})

describe('WasmDevice.loadZones', () => {
  const mockNodeFactory: WorkletNodeFactory = (context, name, options) =>
    (context as unknown as MockAudioContext).createWorkletNode(
      name,
      options,
    ) as unknown as AudioWorkletNode
  let emptyModule: WebAssembly.Module

  beforeAll(async () => {
    emptyModule = await WebAssembly.compile(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]))
  })

  async function create(definition: typeof ZONE_SAMPLER_DEVICE | typeof PLATE_REVERB_DEVICE) {
    const context = createMockContext()
    const device = await WasmDevice.create(
      asAudioContext(context),
      definition as typeof ZONE_SAMPLER_DEVICE,
      {
        wasm: emptyModule,
        processorUrl: 'p',
        createNode: mockNodeFactory,
      },
    )
    const posted = () =>
      context.workletNodes[0].port.posted.calls as [DeviceMessage, ArrayBuffer[] | undefined][]
    return { device, posted }
  }

  it('posts the sounds one message each, then the zones, and transfers its own copies', async () => {
    const { device, posted } = await create(ZONE_SAMPLER_DEVICE)
    expect(device.zones).toEqual({ maxZones: 512, maxSamples: 512, poolFloats: 16_000_000 })
    const plan = device.loadZones(THREE_ZONES, THREE_SOUNDS)
    expect(plan).toMatchObject({ ok: true, samples: ['c3', 'c4', 'c5'], thinned: [] })
    const calls = posted()
    expect(calls.map(([message]) => message.type)).toEqual([
      'zones-begin',
      'zone-sample',
      'zone-sample',
      'zone-sample',
      'zones',
    ])
    const [second, transfer] = calls[2]
    if (second.type !== 'zone-sample') throw new Error('not a sound')
    expect(second.sampleRate).toBe(44100)
    expect(second.channels[0]).not.toBe(THREE_SOUNDS.c4.channels[0])
    expect([...second.channels[0].subarray(0, 8)]).toEqual([
      ...THREE_SOUNDS.c4.channels[0].subarray(0, 8),
    ])
    expect(transfer).toEqual([second.channels[0].buffer])
    const last = calls[4][0]
    if (last.type !== 'zones') throw new Error('not the zones')
    expect(last.fields).toHaveLength(60)
    expect([...last.fields.subarray(20, 25)]).toEqual([1, 60, 0, 57, 63])
    device.dispose()
  })

  it('posts nothing for an instrument it refuses, and says why', async () => {
    const { device, posted } = await create(ZONE_SAMPLER_DEVICE)
    const plan = device.loadZones(THREE_ZONES, THREE_SOUNDS, { budgetBytes: 100_000 })
    expect(plan).toMatchObject({
      ok: false,
      reason: 'it needs 1.1 MB of sample memory and the budget is 0.1 MB',
    })
    expect(posted()).toEqual([])
    const thinned = device.loadZones(THREE_ZONES, THREE_SOUNDS, {
      budgetBytes: 800_000,
      overBudget: 'thin',
    })
    expect(thinned).toMatchObject({ ok: true, samples: ['c3', 'c5'] })
    expect(posted().map(([message]) => message.type)).toEqual([
      'zones-begin',
      'zone-sample',
      'zone-sample',
      'zones',
    ])
    device.dispose()
    expect(device.loadZones(THREE_ZONES, THREE_SOUNDS).ok).toBe(true)
    // Nothing after the dispose itself.
    expect(
      posted()
        .map(([message]) => message.type)
        .slice(4),
    ).toEqual(['dispose'])
  })

  it('refuses on a device that takes no zones', async () => {
    const { device, posted } = await create(PLATE_REVERB_DEVICE)
    expect(device.zones).toBeUndefined()
    expect(device.loadZones(THREE_ZONES, THREE_SOUNDS)).toMatchObject({
      ok: false,
      reason: 'plate-reverb takes no zones',
    })
    expect(posted()).toEqual([])
  })
})
