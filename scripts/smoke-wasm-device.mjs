// Loads one spec device's built .wasm exactly as the worklet does (no
// imports, one instance, fixed memory) and checks the things that can differ
// from the native harness: exports, memory size, silence when idle, sound
// when excited, parameter extremes, and the cost of a block in WASM.
//
// Usage: node scripts/smoke-wasm-device.mjs <id>

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const id = process.argv[2]
if (!id) {
  console.error('usage: node scripts/smoke-wasm-device.mjs <id>')
  process.exit(1)
}
const manifest = JSON.parse(readFileSync(join(root, 'cpp/devices', id, 'device.json'), 'utf8'))
const bytes = readFileSync(join(root, 'src/dsp/wasm', `${id}.wasm`))
const instrument = manifest.category === 'instrument'
const RATE = 48000
const BLOCK = 128
const failures = []
const expect = (condition, message) => {
  if (!condition) failures.push(message)
}

async function load() {
  const { instance } = await WebAssembly.instantiate(bytes, {})
  const device = instance.exports
  device._initialize?.()
  device.device_init(RATE, device.device_max_block_frames())
  const view = (pointer, frames) => new Float32Array(device.memory.buffer, pointer, frames)
  return { device, view }
}

function render({ device, view }, seconds, input) {
  const total = Math.floor(seconds * RATE)
  let peak = 0
  let phase = 0
  for (let done = 0; done < total; done += BLOCK) {
    const frames = Math.min(BLOCK, total - done)
    if (input) {
      const left = view(device.device_in_left(), frames)
      const right = view(device.device_in_right(), frames)
      for (let i = 0; i < frames; i += 1) {
        const value = input.gain * Math.sin(phase)
        phase += (2 * Math.PI * input.hz) / RATE
        left[i] = value
        right[i] = value
      }
    }
    device.device_process(frames)
    const left = view(device.device_out_left(), frames)
    const right = view(device.device_out_right(), frames)
    for (let i = 0; i < frames; i += 1) {
      if (!Number.isFinite(left[i]) || !Number.isFinite(right[i])) return Infinity
      peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]))
    }
  }
  return peak
}

function loadTestSound({ device, view }) {
  if (!manifest.samples) return
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

const params = manifest.params.map((param, index) => ({
  ...param,
  id: index,
  min: param.choices ? 0 : param.min,
  max: param.choices ? param.choices.length - 1 : param.max,
}))

{
  const host = await load()
  const exported = Object.keys(host.device)
  for (const name of ['device_init', 'device_set_param', 'device_process', 'device_in_left']) {
    expect(exported.includes(name), `missing export ${name}`)
  }
  expect(exported.includes('device_note_on') === instrument, 'note exports must match the category')
  expect(
    exported.includes('device_sample_commit') === (manifest.samples === true),
    'sample exports must match "samples" in the manifest',
  )
  const meters = manifest.meters ?? []
  expect(
    exported.includes('device_meter') === meters.length > 0,
    'the meter export must match "meters" in the manifest',
  )
  for (let index = 0; index < meters.length; index += 1) {
    expect(
      Number.isFinite(host.device.device_meter(index)),
      `meter ${meters[index].key} must read a finite value at rest`,
    )
  }
  expect(
    host.device.memory.buffer.byteLength === (manifest.memoryMb ?? 4) * 1024 * 1024,
    'memory size must match memoryMb',
  )
  expect(render(host, 0.25) === 0, 'must be silent before anything excites it')
}

{
  const host = await load()
  loadTestSound(host)
  let peak
  if (instrument) {
    host.device.device_note_on(1, 220, 0.7)
    peak = render(host, 1.5)
  } else {
    const mix = params.find((param) => param.key === 'mix')
    if (mix) host.device.device_set_param(mix.id, mix.max)
    peak = Math.max(render(host, 1.5, { hz: 330, gain: 0.5 }), render(host, 0.5))
  }
  expect(Number.isFinite(peak) && peak > 1e-4 && peak < 8, `must make bounded sound (peak ${peak})`)
}

for (const edge of ['min', 'max']) {
  const host = await load()
  loadTestSound(host)
  for (const param of params) host.device.device_set_param(param.id, param[edge])
  if (instrument) {
    host.device.device_note_on(1, 110, 0.9)
    host.device.device_note_on(2, 660, 0.9)
  }
  const peak = render(host, 0.5, instrument ? undefined : { hz: 330, gain: 0.9 })
  expect(Number.isFinite(peak), `all params at ${edge} must stay finite`)
}

// Cost in WASM under a realistic load: 8 held notes, or continuous input.
{
  const host = await load()
  loadTestSound(host)
  if (instrument) {
    for (let n = 0; n < 8; n += 1) host.device.device_note_on(n, 110 * 2 ** ((n * 3) / 12), 0.7)
  }
  const seconds = 10
  render(host, 1, instrument ? undefined : { hz: 330, gain: 0.3 })
  const start = performance.now()
  render(host, seconds, instrument ? undefined : { hz: 330, gain: 0.3 })
  const elapsed = performance.now() - start
  const share = (100 * elapsed) / (seconds * 1000)
  console.log(
    `${id} wasm cost: ${((elapsed * 1000) / ((seconds * RATE) / BLOCK)).toFixed(1)} us per 128-frame block, ` +
      `${share.toFixed(2)}% of real time at 48 kHz${instrument ? ' (8 notes held)' : ''}`,
  )
  if (share > 5 && manifest.experimental !== true) {
    failures.push(
      `costs ${share.toFixed(1)}% of real time: over the 5% budget, set "experimental": true or optimise`,
    )
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${id}: ${failure}`)
  process.exit(1)
}
console.log(`${id} wasm smoke: ok (${bytes.length} bytes)`)
