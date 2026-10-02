// Times every built device the way the worklet runs it (one instance, no
// imports, 128-frame blocks at 48 kHz) and prints one JSON object: what a
// block costs while the device is at work, and what it costs once it has
// nothing to say. `smoke-wasm-device.mjs` checks one device and its budget;
// this compares the whole set between two builds.
//
// Usage: node scripts/bench-devices.mjs [--wasm <dir>] [--only id,id] [--seconds n] [--repeats n]
//
// The figures are flat-out costs in Node's V8. A device paced by a real audio
// clock reads about twice as much (cold caches each block, src/core/load.ts),
// so compare builds with these, and read real load from the engine's meter.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index >= 0 ? args[index + 1] : fallback
}
const wasmDir = option('wasm', join(root, 'src/dsp/wasm'))
const only = option('only', '')
  .split(',')
  .filter((id) => id.length > 0)
const seconds = Number(option('seconds', '3'))
const repeats = Number(option('repeats', '5'))

const RATE = 48000
const BLOCK = 128
const BLOCK_MICROS = (BLOCK / RATE) * 1e6
// A tail has this long to die before the idle cost is read anyway.
const SETTLE_SECONDS = 40

function manifestOf(id) {
  const path = join(root, 'cpp/devices', id, 'device.json')
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null
}

async function load(id) {
  const { instance } = await WebAssembly.instantiate(readFileSync(join(wasmDir, `${id}.wasm`)), {})
  const device = instance.exports
  device._initialize?.()
  device.device_init(RATE, device.device_max_block_frames())
  const view = (pointer, frames) => new Float32Array(device.memory.buffer, pointer, frames)
  return {
    device,
    inLeft: view(device.device_in_left(), BLOCK),
    inRight: view(device.device_in_right(), BLOCK),
    outLeft: view(device.device_out_left(), BLOCK),
    outRight: view(device.device_out_right(), BLOCK),
    view,
  }
}

function loadTestSound({ device, view }) {
  if (!device.device_sample_capacity) return
  const capacity = device.device_sample_capacity()
  const frames = Math.min(capacity, RATE * 2)
  const store = view(device.device_sample_buffer(), capacity * 2)
  for (let i = 0; i < frames; i += 1) {
    const value = 0.4 * Math.sin((2 * Math.PI * 220 * i) / RATE) * Math.sin((Math.PI * i) / frames)
    store[i] = value
    store[capacity + i] = value
  }
  device.device_sample_commit(frames, 2, RATE)
}

// One second of the smoke check's input (330 Hz at 0.3), cut into blocks, so
// the timed loop only copies.
const INPUT = new Float32Array(RATE)
for (let i = 0; i < RATE; i += 1) INPUT[i] = 0.3 * Math.sin((2 * Math.PI * 330 * i) / RATE)
const BLOCKS_PER_SECOND = Math.floor(RATE / BLOCK)

// An instrument plays eight notes and strikes one of them again every quarter
// second, in turn: held notes alone would time a plucked or struck instrument
// after it has died away.
const VOICES = 8
const STRIKE_BLOCKS = Math.floor(BLOCKS_PER_SECOND / 4)
const pitch = (note) => 110 * 2 ** ((note * 3) / 12)

/** Runs `blocks` blocks of the device at work; returns a peak of the output over the run. */
function run(host, blocks, playing) {
  const { device, inLeft, inRight, outLeft, outRight } = host
  const withInput = playing && !host.instrument
  const striking = playing && host.instrument
  let peak = 0
  for (let block = 0; block < blocks; block += 1) {
    if (striking) {
      host.sinceStrike += 1
      if (host.sinceStrike >= STRIKE_BLOCKS) {
        host.sinceStrike = 0
        const note = host.nextStrike
        host.nextStrike = (note + 1) % VOICES
        device.device_note_off(note)
        device.device_note_on(note, pitch(note), 0.7)
      }
    }
    if (withInput) {
      const at = (block % BLOCKS_PER_SECOND) * BLOCK
      const slice = INPUT.subarray(at, at + BLOCK)
      inLeft.set(slice)
      inRight.set(slice)
    }
    device.device_process(BLOCK)
    const a = Math.abs(outLeft[0])
    const b = Math.abs(outRight[BLOCK - 1])
    if (a > peak) peak = a
    if (b > peak) peak = b
  }
  return peak
}

/** The whole block's peak, for deciding that a device has fallen silent. */
function blockPeak({ outLeft, outRight }) {
  let peak = 0
  for (let i = 0; i < BLOCK; i += 1) {
    const a = Math.abs(outLeft[i])
    const b = Math.abs(outRight[i])
    if (a > peak) peak = a
    if (b > peak) peak = b
  }
  return peak
}

function time(host, playing) {
  const blocks = Math.floor((seconds * RATE) / BLOCK)
  const samples = []
  let peak = 0
  for (let repeat = 0; repeat < repeats; repeat += 1) {
    const start = performance.now()
    peak = Math.max(peak, run(host, blocks, playing))
    samples.push(((performance.now() - start) * 1000) / blocks)
  }
  samples.sort((a, b) => a - b)
  return { best: samples[0], median: samples[Math.floor(samples.length / 2)], peak }
}

async function measure(id) {
  const manifest = manifestOf(id)
  const host = await load(id)
  const { device } = host
  const instrument = typeof device.device_note_on === 'function'
  Object.assign(host, { instrument, sinceStrike: 0, nextStrike: 0 })
  loadTestSound(host)
  if (instrument) {
    for (let note = 0; note < VOICES; note += 1) device.device_note_on(note, pitch(note), 0.7)
  } else if (Array.isArray(manifest?.params)) {
    // Spec devices carry their parameter table; the older ones run at their defaults.
    const mix = manifest.params.findIndex((param) => param.key === 'mix')
    if (mix >= 0) device.device_set_param(mix, manifest.params[mix].max)
  }
  run(host, BLOCKS_PER_SECOND, true)
  const active = time(host, true)

  // Let go, wait for the tail, and time what is left.
  if (instrument) for (let note = 0; note < VOICES; note += 1) device.device_note_off(note)
  let silentFor = 0
  let waited = 0
  const limit = SETTLE_SECONDS * BLOCKS_PER_SECOND
  while (waited < limit && silentFor < BLOCKS_PER_SECOND) {
    device.device_process(BLOCK)
    silentFor = blockPeak(host) === 0 ? silentFor + 1 : 0
    waited += 1
  }
  const idle = time(host, false)
  return {
    id,
    kind: instrument ? 'instrument' : 'effect',
    experimental: manifest?.experimental === true,
    active_us: round(active.best),
    active_median_us: round(active.median),
    active_percent: round((100 * active.best) / BLOCK_MICROS),
    // Zero here means the workload did not make the device sound.
    active_peak: round(active.peak),
    idle_us: round(idle.best),
    idle_percent: round((100 * idle.best) / BLOCK_MICROS),
    idle_silent: silentFor >= BLOCKS_PER_SECOND,
    settle_seconds: round(waited / BLOCKS_PER_SECOND),
  }
}

function round(value) {
  return Math.round(value * 1000) / 1000
}

const ids = readdirSync(wasmDir)
  .filter((name) => name.endsWith('.wasm'))
  .map((name) => name.slice(0, -5))
  .filter((id) => only.length === 0 || only.includes(id))
  .sort()

const devices = []
for (const id of ids) devices.push(await measure(id))

const sum = (key) => round(devices.reduce((total, device) => total + device[key], 0))
const byActive = [...devices].sort((a, b) => b.active_us - a.active_us)
const byIdle = [...devices].sort((a, b) => b.idle_us - a.idle_us)
console.log(
  JSON.stringify(
    {
      devices_measured: devices.length,
      sum_active_us: sum('active_us'),
      sum_idle_us: sum('idle_us'),
      mean_active_percent: round(sum('active_percent') / devices.length),
      max_active_percent: byActive[0]?.active_percent ?? 0,
      over_budget: devices.filter((device) => device.active_percent > 5).length,
      never_silent: devices.filter((device) => !device.idle_silent).length,
      silent_at_work: devices.filter((device) => device.active_peak === 0).length,
      costliest_active: byActive.slice(0, 12).map((d) => `${d.id} ${d.active_percent}%`),
      costliest_idle: byIdle.slice(0, 12).map((d) => `${d.id} ${d.idle_us}us`),
      devices,
    },
    null,
    1,
  ),
)
