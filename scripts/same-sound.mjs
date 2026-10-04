// Proves that a change to a spec device left its sound alone: the same input
// through the .wasm as it is at a git ref and as it is in the working tree,
// at the device's defaults, at every factory preset and with every parameter
// swept while it plays, compared sample for sample. A device that gains a
// reading for a display (`meters` in device.json) changes its .wasm and must
// not change one sample of what it puts out; this is the check for that.
//
// Usage: node scripts/same-sound.mjs <id> [<id> ...] [--ref <git ref>]   (default ref: origin/main)
//        the new .wasm is read while `device_meter` is being called, as a watched device is.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const refAt = args.indexOf('--ref')
const ref = refAt === -1 ? 'origin/main' : args[refAt + 1]
const ids = args.filter(
  (arg, index) => !arg.startsWith('--') && (refAt === -1 || index !== refAt + 1),
)
if (ids.length === 0) {
  console.error('usage: node scripts/same-sound.mjs <id> [<id> ...] [--ref <git ref>]')
  process.exit(1)
}

const RATE = 48000
const BLOCK = 128
const SECONDS = 6

/** The same noise every time: a tone, a second tone that comes and goes, and hiss, with a silence in the middle. */
function inputAt(frame) {
  const t = frame / RATE
  if (t > 2.6 && t < 3.3) return [0, 0]
  let s = (Math.imul(frame | 0, 374761393) + 668265263) >>> 0
  s = Math.imul(s ^ (s >>> 13), 1274126177) >>> 0
  const hiss = (((s ^ (s >>> 16)) >>> 0) / 4294967295 - 0.5) * 0.1
  const swell = 0.5 - 0.5 * Math.cos(t * 2.1)
  const left =
    0.35 * Math.sin(2 * Math.PI * 220 * t) + 0.3 * swell * Math.sin(2 * Math.PI * 587 * t) + hiss
  const right =
    0.35 * Math.sin(2 * Math.PI * 221 * t) + 0.3 * swell * Math.sin(2 * Math.PI * 880 * t) - hiss
  return [left, right]
}

async function load(bytes) {
  const { instance } = await WebAssembly.instantiate(bytes, {})
  const device = instance.exports
  device._initialize?.()
  device.device_init(RATE, device.device_max_block_frames())
  return device
}

/** Render one run: `moves` is a list of [frame, param id, value] applied as the sound plays. */
function render(device, params, moves, watch) {
  for (const [id, value] of params) device.device_set_param(id, value)
  const total = SECONDS * RATE
  const out = new Float32Array(total * 2)
  const view = (pointer, frames) => new Float32Array(device.memory.buffer, pointer, frames)
  let next = 0
  for (let done = 0; done < total; done += BLOCK) {
    while (next < moves.length && moves[next][0] <= done) {
      device.device_set_param(moves[next][1], moves[next][2])
      next += 1
    }
    const left = view(device.device_in_left(), BLOCK)
    const right = view(device.device_in_right(), BLOCK)
    for (let i = 0; i < BLOCK; i += 1) {
      const [l, r] = inputAt(done + i)
      left[i] = l
      right[i] = r
    }
    device.device_process(BLOCK)
    if (watch && device.device_meter) for (let m = 0; m < watch; m += 1) device.device_meter(m)
    out.set(view(device.device_out_left(), BLOCK), done * 2)
    out.set(view(device.device_out_right(), BLOCK), done * 2 + BLOCK)
  }
  return out
}

function same(a, b) {
  const x = new Uint32Array(a.buffer)
  const y = new Uint32Array(b.buffer)
  for (let i = 0; i < x.length; i += 1) if (x[i] !== y[i]) return i
  return -1
}

let failed = false
for (const id of ids) {
  const manifest = JSON.parse(readFileSync(join(root, 'cpp/devices', id, 'device.json'), 'utf8'))
  if (manifest.category === 'instrument') {
    console.log(`${id}: an instrument; this check plays effects only`)
    continue
  }
  const before = execFileSync('git', ['show', `${ref}:src/dsp/wasm/${id}.wasm`], {
    cwd: root,
    maxBuffer: 64 * 1024 * 1024,
  })
  const after = readFileSync(join(root, 'src/dsp/wasm', `${id}.wasm`))
  const specs = manifest.params.map((param, index) => ({
    id: index,
    key: param.key,
    min: param.choices ? 0 : param.min,
    max: param.choices ? param.choices.length - 1 : param.max,
    default: param.default,
    step: param.choices ? 1 : 0,
  }))
  const byKey = new Map(specs.map((spec) => [spec.key, spec]))
  const runs = [['defaults', [], []]]
  for (const [name, preset] of Object.entries(manifest.presets ?? {})) {
    runs.push([
      `preset ${name}`,
      Object.entries(preset).map(([key, value]) => [byKey.get(key).id, value]),
      [],
    ])
  }
  // Every parameter to its foot, its top and back while the sound plays.
  const moves = []
  specs.forEach((spec, index) => {
    const at = Math.floor(((index + 0.5) / specs.length) * (SECONDS - 1) * RATE)
    moves.push(
      [at, spec.id, spec.min],
      [at + 4800, spec.id, spec.max],
      [at + 9600, spec.id, spec.default],
    )
  })
  moves.sort((a, b) => a[0] - b[0])
  runs.push(['every parameter swept', [], moves])

  let differs = null
  for (const [name, params, sweep] of runs) {
    const a = render(await load(before), params, sweep, 0)
    const b = render(await load(after), params, sweep, (manifest.meters ?? []).length)
    const at = same(a, b)
    if (at !== -1) {
      differs = `${name}: first difference at sample ${at}`
      break
    }
  }
  if (differs) {
    failed = true
    console.log(`${id}: DIFFERENT from ${ref} (${differs})`)
  } else {
    const unchanged = Buffer.compare(before, after) === 0
    console.log(
      `${id}: the same sound as ${ref} in ${runs.length} runs${unchanged ? ' (the .wasm itself is unchanged)' : ''}`,
    )
  }
}
process.exit(failed ? 1 : 0)
