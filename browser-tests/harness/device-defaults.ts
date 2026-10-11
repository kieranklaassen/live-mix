// The page side of the check that a device does what its settings say, on the
// browser's own nodes. Three things only real audio can show:
//
// - a low cut or a high cut is flat above (below) its corner. A
//   BiquadFilterNode reads the Q of a highpass and a lowpass in decibels, so a
//   Q of √½ written as a number is a 0.7 dB resonance, and the mock context
//   cannot tell;
// - a compressor with no make-up leaves a sound under its threshold as loud as
//   it came in. The browser's DynamicsCompressorNode adds a make-up gain of its
//   own, worked out from threshold, knee and ratio;
// - a device that is bypassed still takes the time it reports, so turning one
//   off or on moves nothing in time.
//
// Everything is rendered on a real OfflineAudioContext and measured here; the
// spec only reads numbers.

import {
  COMPRESSOR_DESCRIPTOR,
  FILTER_DESCRIPTOR,
  createCompressor,
  createDelay,
  createFilter,
  createParametricEq,
  createRack,
  filterTypeIndex,
  presetParams,
  renderOffline,
  resolvePreset,
  type Clip,
  type Device,
} from '@kieranklaassen/live-mix'
import { createAmbientLimiter } from '@kieranklaassen/live-mix/dsp'

const RATE = 48000

type MakeDevice = (context: OfflineAudioContext) => Device | Promise<Device>

const db = (ratio: number): number => 20 * Math.log10(Math.max(ratio, 1e-12))

/** Magnitude of one frequency in `data[from, from + length)`, as a sine's amplitude would read. */
function magnitudeAt(data: Float32Array, hz: number, rate: number, from = 0, length = data.length) {
  let re = 0
  let im = 0
  const step = (2 * Math.PI * hz) / rate
  for (let i = 0; i < length; i += 1) {
    re += data[from + i] * Math.cos(step * i)
    im -= data[from + i] * Math.sin(step * i)
  }
  return Math.hypot(re, im)
}

function rmsDb(data: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let i = from; i < to; i += 1) sum += data[i] * data[i]
  return 10 * Math.log10(Math.max(sum / (to - from), 1e-30))
}

function sine(
  context: BaseAudioContext,
  channels: number,
  hz: number,
  peakDb: number,
  sec: number,
) {
  const buffer = context.createBuffer(
    channels,
    Math.round(sec * context.sampleRate),
    context.sampleRate,
  )
  const peak = Math.pow(10, peakDb / 20)
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < data.length; i += 1) {
      data[i] = peak * Math.sin((2 * Math.PI * hz * i) / context.sampleRate)
    }
  }
  return buffer
}

function play(context: BaseAudioContext, buffer: AudioBuffer, into: AudioNode): void {
  const source = context.createBufferSource()
  source.buffer = buffer
  source.connect(into)
  source.start(0)
}

// --- Cuts ----------------------------------------------------------------------------

/** Forty frequencies from 20 Hz to 20 kHz, evenly spaced by ear. */
const SWEEP = Array.from({ length: 40 }, (_, i) => Math.round(20 * Math.pow(1000, i / 39)))

export interface CutMeasure {
  /** The response at each asked frequency, in dB. */
  at: Record<number, number>
  /** The highest the response stands anywhere from 20 Hz to 20 kHz: 0 for a cut with no bump. */
  highestDb: number
}

/** What a device does to each frequency, read from an impulse through it. */
async function response(make: MakeDevice, probes: readonly number[]): Promise<CutMeasure> {
  const context = new OfflineAudioContext(1, RATE, RATE)
  const device = await make(context)
  const impulse = context.createBuffer(1, 1, RATE)
  impulse.getChannelData(0)[0] = 1
  play(context, impulse, device.input)
  device.output.connect(context.destination)
  const heard = (await context.startRendering()).getChannelData(0)
  const at: Record<number, number> = {}
  for (const hz of probes) at[hz] = db(magnitudeAt(heard, hz, RATE))
  let highestDb = -Infinity
  for (const hz of SWEEP) highestDb = Math.max(highestDb, db(magnitudeAt(heard, hz, RATE)))
  return { at, highestDb }
}

const DAMPING_HZ = 2000
const DAMPING_FEEDBACK = 0.9
const DAMPING_TIME_SEC = 0.2

/**
 * What one pass round the delay's feedback loop does to each frequency, the
 * feedback itself taken out: the second echo over the first.
 */
async function dampingResponse(probes: readonly number[]): Promise<CutMeasure> {
  const context = new OfflineAudioContext(1, RATE, RATE)
  const device = createDelay(context, {
    params: { timeSec: DAMPING_TIME_SEC, feedback: DAMPING_FEEDBACK, damping: DAMPING_HZ, mix: 1 },
  })
  const impulse = context.createBuffer(1, 1, RATE)
  impulse.getChannelData(0)[0] = 1
  play(context, impulse, device.input)
  device.output.connect(context.destination)
  const heard = (await context.startRendering()).getChannelData(0)
  const echo = Math.round(DAMPING_TIME_SEC * RATE)
  const pass = (hz: number): number =>
    db(
      magnitudeAt(heard, hz, RATE, 2 * echo, echo) /
        magnitudeAt(heard, hz, RATE, echo, echo) /
        DAMPING_FEEDBACK,
    )
  const at: Record<number, number> = {}
  for (const hz of probes) at[hz] = pass(hz)
  let highestDb = -Infinity
  // Whole cycles in an echo's window only, so one echo's spectrum is read cleanly.
  for (const hz of SWEEP)
    highestDb = Math.max(highestDb, pass(Math.max(20, Math.round(hz / 5) * 5)))
  return { at, highestDb }
}

// --- Compressor levels -----------------------------------------------------------------

export interface CompressorSettings {
  threshold: number
  knee: number
  ratio: number
  attack: number
  release: number
  makeupDb: number
}

const LEVEL_HZ = 1000
const LEVEL_SEC = 2

/**
 * How much louder (+) or quieter (−) a steady tone comes out of a compressor
 * than it went in, per channel, once the compressor has settled: in dB.
 */
async function compressorGain(
  settings: CompressorSettings,
  inDb: number,
  channels: 1 | 2,
): Promise<number> {
  const context = new OfflineAudioContext(2, LEVEL_SEC * RATE, RATE)
  const device = createCompressor(context, { params: { ...settings } })
  const tone = sine(context, channels, LEVEL_HZ, inDb, LEVEL_SEC)
  play(context, tone, device.input)
  device.output.connect(context.destination)
  const heard = await context.startRendering()
  const from = Math.round(1.5 * RATE)
  const to = LEVEL_SEC * RATE
  const out = rmsDb(heard.getChannelData(0), from, to)
  return out - rmsDb(tone.getChannelData(0), from, to)
}

/** What each factory preset held before the device stopped adding the node's own make-up. */
const PRESETS_BEFORE: Record<string, CompressorSettings> = {
  Gentle: { threshold: -18, knee: 12, ratio: 2, attack: 0.02, release: 0.3, makeupDb: 2 },
  Voice: { threshold: -20, knee: 6, ratio: 4, attack: 0.005, release: 0.15, makeupDb: 4 },
  Glue: { threshold: -12, knee: 10, ratio: 1.5, attack: 0.03, release: 0.4, makeupDb: 1 },
  Limit: { threshold: -6, knee: 0, ratio: 20, attack: 0.0005, release: 0.05, makeupDb: 0 },
}
const STEPS_DB = [-40, -20, -10, -3]
const STEP_SEC = 1

/** A tone that climbs in four steps, a second each. */
function steps(context: BaseAudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, STEPS_DB.length * STEP_SEC * RATE, RATE)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) {
    const peak = Math.pow(10, STEPS_DB[Math.floor(i / (STEP_SEC * RATE))] / 20)
    data[i] = peak * Math.sin((2 * Math.PI * LEVEL_HZ * i) / RATE)
  }
  return buffer
}

async function stepLevels(connect: (context: OfflineAudioContext) => AudioNode): Promise<number[]> {
  const context = new OfflineAudioContext(2, STEPS_DB.length * STEP_SEC * RATE, RATE)
  play(context, steps(context), connect(context))
  const heard = (await context.startRendering()).getChannelData(0)
  return STEPS_DB.map((_, step) =>
    rmsDb(heard, Math.round((step + 0.6) * STEP_SEC * RATE), (step + 1) * STEP_SEC * RATE),
  )
}

/**
 * How far a factory preset of today is from what it played before: the
 * browser's own compressor with the old numbers and the old make-up after
 * it, against the device with the preset. The largest difference over four
 * levels, in dB.
 */
async function presetDrift(name: string): Promise<number> {
  const before = PRESETS_BEFORE[name]
  const was = await stepLevels((context) => {
    const node = context.createDynamicsCompressor()
    node.threshold.value = before.threshold
    node.knee.value = before.knee
    node.ratio.value = before.ratio
    node.attack.value = before.attack
    node.release.value = before.release
    const makeup = context.createGain()
    makeup.gain.value = Math.pow(10, before.makeupDb / 20)
    node.connect(makeup)
    makeup.connect(context.destination)
    return node
  })
  const is = await stepLevels((context) => {
    const params = presetParams(COMPRESSOR_DESCRIPTOR, resolvePreset(COMPRESSOR_DESCRIPTOR, name))
    const device = createCompressor(context, { params })
    device.output.connect(context.destination)
    return device.input
  })
  return Math.max(...was.map((level, step) => Math.abs(level - is[step])))
}

// --- A voice track, as an app builds one ------------------------------------------------

const VOICE_HZ = 440
const VOICE_SEC = 3

/** A clip that names no place, so its sound reaches the strip with the channels it has. */
function clip(id: string, sourceId: string): Clip {
  return {
    id,
    sourceId,
    startSec: 0,
    offsetSec: 0,
    durationSec: VOICE_SEC,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear',
    gainDb: 0,
  }
}

/** The level of a quiet voice on a track whose strip is made, with or without a low cut and a compressor on it. */
async function voiceLevel(channels: 1 | 2, chain: boolean): Promise<number> {
  const result = await renderOffline({
    durationSec: VOICE_SEC,
    sampleRate: RATE,
    build: async (engine) => {
      await engine.samples.load('voice', sine(engine.context, channels, VOICE_HZ, -27, VOICE_SEC))
      const track = engine.addAudioTrack('voice')
      track.strip.materialize()
      if (chain) {
        track.strip.addInsert(createParametricEq(engine.context, { params: { lowCut: 80 } }))
        track.strip.addInsert(
          createCompressor(engine.context, {
            params: { threshold: -18, knee: 12, ratio: 2, attack: 0.02, release: 0.3, makeupDb: 0 },
          }),
        )
      }
      track.clips.add(clip('clip', 'voice'))
    },
  })
  return rmsDb(result.audio.channels[0], 2 * RATE, Math.round(2.9 * RATE))
}

// --- Bypass ------------------------------------------------------------------------------

export interface BypassMeasure {
  /** What the device says it takes, in samples. */
  latencySamples: number
  /** How late a click comes out of it while it runs. */
  activeDelay: number
  /** How late the same click comes out while it is bypassed. */
  bypassedDelay: number
}

const CLICK_AT = 12000
const BYPASS_AT_SEC = 0.05
const CLICK = 0.01

async function clickDelay(make: MakeDevice, rate: number, bypass: boolean) {
  const context = new OfflineAudioContext(2, rate, rate)
  const device = await make(context)
  // Turned off a moment into the render and well before the click: a device
  // that runs in a worklet hears of it between two blocks, as on a page.
  if (bypass) {
    void context.suspend(BYPASS_AT_SEC).then(async () => {
      device.bypass = true
      await new Promise((resolve) => setTimeout(resolve, 20))
      void context.resume()
    })
  }
  // The sound runs on past the click, as a clip does. Chromium empties a
  // DelayNode when the last source into it ends and its input falls from two
  // channels to one, so a click on a buffer's last sample would be lost there.
  const click = context.createBuffer(2, CLICK_AT + Math.round(rate / 2), rate)
  click.getChannelData(0)[CLICK_AT] = CLICK
  click.getChannelData(1)[CLICK_AT] = CLICK
  play(context, click, device.input)
  device.output.connect(context.destination)
  const heard = (await context.startRendering()).getChannelData(0)
  let loudest = 0
  for (let i = 1; i < heard.length; i += 1) {
    if (Math.abs(heard[i]) > Math.abs(heard[loudest])) loudest = i
  }
  return { delay: loudest - CLICK_AT, latencySamples: device.latencySamples ?? 0 }
}

async function bypassDelays(make: MakeDevice, rate = RATE): Promise<BypassMeasure> {
  const active = await clickDelay(make, rate, false)
  const bypassed = await clickDelay(make, rate, true)
  return {
    latencySamples: active.latencySamples,
    activeDelay: active.delay,
    bypassedDelay: bypassed.delay,
  }
}

const TOGGLE_HZ = 440
const TOGGLE_DB = -40
const TOGGLE_OFF_SEC = 0.5
const TOGGLE_ON_SEC = 0.75
const TOGGLE_FROM_SEC = 0.3

/**
 * A tone through a compressor that compresses nothing (ratio 1, so the device
 * is its look-ahead and no more), turned off at half a second and on again a
 * quarter later. What comes out should be the tone, late by the look-ahead,
 * all the way through: the largest departure from that, in dB under the tone.
 */
async function toggleDeparture(): Promise<number> {
  const context = new OfflineAudioContext(1, RATE, RATE)
  const device = createCompressor(context, {
    params: { threshold: 0, knee: 0, ratio: 1, attack: 0.003, release: 0.25, makeupDb: 0 },
  })
  const tone = sine(context, 1, TOGGLE_HZ, TOGGLE_DB, 1)
  play(context, tone, device.input)
  device.output.connect(context.destination)
  void context.suspend(TOGGLE_OFF_SEC).then(() => {
    device.bypass = true
    void context.resume()
  })
  void context.suspend(TOGGLE_ON_SEC).then(() => {
    device.bypass = false
    void context.resume()
  })
  const heard = (await context.startRendering()).getChannelData(0)
  const sent = tone.getChannelData(0)
  const late = device.latencySamples ?? 0
  let departure = 0
  // From 0.3 s: the browser's compressor takes a quarter of a second to settle on a tone that starts.
  for (let i = Math.round(TOGGLE_FROM_SEC * RATE); i < heard.length; i += 1) {
    departure = Math.max(departure, Math.abs(heard[i] - sent[i - late]))
  }
  return db(departure) - TOGGLE_DB
}

// --- All of it ---------------------------------------------------------------------------

/** Under the threshold, inside the knee and over it: threshold −18 dB, knee 12, ratio 2. */
const VOICE_SETTINGS: CompressorSettings = {
  threshold: -18,
  knee: 12,
  ratio: 2,
  attack: 0.02,
  release: 0.3,
  makeupDb: 0,
}
const HARD_SETTINGS: CompressorSettings = { ...VOICE_SETTINGS, threshold: -24, knee: 0, ratio: 4 }

export interface DeviceDefaultsMeasure {
  cuts: {
    /** The parametric EQ with its low cut at 80 Hz and nothing else touched. */
    lowCut: CutMeasure
    /** The parametric EQ with its high cut at 8 kHz. */
    highCut: CutMeasure
    /** The filter device's "High-pass rumble" preset: a highpass at 80 Hz. */
    rumble: CutMeasure
    /** The filter device as a lowpass at 1 kHz with a Q of 2: a 6 dB peak at the corner. */
    resonant: CutMeasure
    /** One pass round the delay's feedback loop, damping at 2 kHz. */
    damping: CutMeasure
  }
  compressor: {
    /** Out minus in for a tone at each level (dBFS peak), make-up 0: mono in, then stereo in. */
    mono: Record<number, number>
    stereo: Record<number, number>
    /** The same with no knee: threshold −24 dB, ratio 4. */
    hard: Record<number, number>
    /** The default device: threshold −24 dB, knee 30, ratio 12. */
    untouched: number
    /** Each factory preset against what it played before, in dB. */
    presetDrift: Record<string, number>
  }
  /** A −27 dBFS voice on a made strip: with the low cut and the compressor on it, minus without. */
  voice: { stereo: number; mono: number }
  bypass: {
    compressor: BypassMeasure
    compressorAt44100: BypassMeasure
    limiter: BypassMeasure
    rack: BypassMeasure
    /** Off and on again under a tone: the largest departure from the tone made late, in dB under it. */
    toggleDb: number
  }
}

export async function measureDeviceDefaults(): Promise<DeviceDefaultsMeasure> {
  const probes = [50, 80, 110, 160, 440, 1000]
  const levels = async (settings: CompressorSettings, channels: 1 | 2, at: readonly number[]) => {
    const out: Record<number, number> = {}
    for (const inDb of at) out[inDb] = await compressorGain(settings, inDb, channels)
    return out
  }
  const drift: Record<string, number> = {}
  for (const name of Object.keys(PRESETS_BEFORE)) drift[name] = await presetDrift(name)
  const compressor: MakeDevice = (context) => createCompressor(context)

  return {
    cuts: {
      lowCut: await response(
        (context) => createParametricEq(context, { params: { lowCut: 80 } }),
        probes,
      ),
      highCut: await response(
        (context) => createParametricEq(context, { params: { highCut: 8000 } }),
        [1000, 4000, 8000, 12000],
      ),
      rumble: await response(
        (context) =>
          createFilter(context, {
            params: presetParams(
              FILTER_DESCRIPTOR,
              resolvePreset(FILTER_DESCRIPTOR, 'High-pass rumble'),
            ),
          }),
        probes,
      ),
      resonant: await response(
        (context) =>
          createFilter(context, {
            params: { type: filterTypeIndex('lowpass'), frequency: 1000, q: 2 },
          }),
        [100, 1000],
      ),
      damping: await dampingResponse([500, DAMPING_HZ, 4000]),
    },
    compressor: {
      mono: await levels(VOICE_SETTINGS, 1, [-40, -27, -20, -4, 0]),
      stereo: await levels(VOICE_SETTINGS, 2, [-40, -27, -20, -4, 0]),
      hard: await levels(HARD_SETTINGS, 1, [-40, -26, -12, 0]),
      untouched: await compressorGain(
        { threshold: -24, knee: 30, ratio: 12, attack: 0.003, release: 0.25, makeupDb: 0 },
        -40,
        1,
      ),
      presetDrift: drift,
    },
    voice: {
      stereo: (await voiceLevel(2, true)) - (await voiceLevel(2, false)),
      mono: (await voiceLevel(1, true)) - (await voiceLevel(1, false)),
    },
    bypass: {
      compressor: await bypassDelays(compressor),
      compressorAt44100: await bypassDelays(compressor, 44100),
      limiter: await bypassDelays((context) => createAmbientLimiter(context)),
      rack: await bypassDelays((context) => {
        const rack = createRack(context)
        rack.addChain().addInsert(createCompressor(context))
        return rack
      }),
      toggleDb: await toggleDeparture(),
    },
  }
}
