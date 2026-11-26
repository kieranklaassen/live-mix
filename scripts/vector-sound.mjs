// Proves that a device built with the vector instructions (`"vector": true`, or
// `-msimd128` in scripts/build-wasm.sh) sounds as the plain loops beside them do: the
// native tests build only those, and what ships is only the other. The same notes,
// input and parameter moves go through both, in blocks of every length, and every
// sample is compared to the last bit.
//
// Usage: SCALAR=1 bash scripts/build-wasm.sh <dir>   (every device without the vector instructions)
//        node scripts/vector-sound.mjs <dir> [<id> ...]   (default: every device built with them)

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const [dir, ...asked] = process.argv.slice(2)
if (!dir) {
  console.error('usage: node scripts/vector-sound.mjs <dir of a SCALAR=1 build> [<id> ...]')
  process.exit(1)
}

const RATE = 48000
const BLOCK = 128
const RUNS = 12
const SECONDS = 6

const manifestOf = (id) => {
  const path = join(root, 'cpp/devices', id, 'device.json')
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}
}
const byHand = [
  ...readFileSync(join(root, 'scripts/build-wasm.sh'), 'utf8').matchAll(
    /^EXTRA_FLAGS="-msimd128".* build_device (\S+)/gm,
  ),
].map((match) => match[1])
const generated = readdirSync(join(root, 'cpp/devices')).filter(
  (id) => manifestOf(id).vector === true,
)
const ids = asked.length > 0 ? asked : [...byHand, ...generated]

/** What a parameter may be set to. A device built by hand has no manifest, or one with no ranges: 0 to 1. */
function rangesOf(id) {
  const { params } = manifestOf(id)
  if (!Array.isArray(params)) return Array.from({ length: 24 }, () => [0, 1])
  return params.map((param) =>
    param.choices ? [0, param.choices.length - 1] : [param.min, param.max],
  )
}

function load(path) {
  const device = new WebAssembly.Instance(new WebAssembly.Module(readFileSync(path)), {}).exports
  device._initialize?.()
  device.device_init(RATE, device.device_max_block_frames())
  return device
}

const words = (device, pointer, frames) => new Uint32Array(device.memory.buffer, pointer, frames)

let failed = false
for (const id of ids) {
  const ranges = rangesOf(id)
  let seed = 1
  const random = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 2 ** 32
  let compared = 0
  let sounded = false
  let differs = null
  for (let run = 0; run < RUNS && !differs; run += 1) {
    const pair = [load(join(dir, `${id}.wasm`)), load(join(root, 'src/dsp/wasm', `${id}.wasm`))]
    const plays = pair[0].device_note_on !== undefined
    const held = []
    let notes = 0
    const move = () => {
      const index = Math.floor(random() * ranges.length)
      const [least, most] = ranges[index]
      const value = least + random() * (most - least)
      for (const device of pair) device.device_set_param(index, value)
    }
    if (run > 0) for (let i = 0; i < 8; i += 1) move()
    for (let done = 0; done < SECONDS * RATE && !differs;) {
      if (run > 2 && random() < 0.01) move()
      // The last second has no new note and no input: what dies away is compared too.
      const rings = done < (SECONDS - 1) * RATE
      if (plays && rings && random() < 0.02) {
        const frequency = 440 * 2 ** ((Math.floor(random() * 80) - 45) / 12)
        const gain = random()
        held.push((notes += 1))
        for (const device of pair) device.device_note_on(notes, frequency, gain)
      }
      if (held.length > 0 && (!rings || random() < 0.012)) {
        const [note] = held.splice(Math.floor(random() * held.length), 1)
        for (const device of pair) device.device_note_off(note)
      }
      const frames = run % 3 === 2 ? 1 + Math.floor(random() * BLOCK) : BLOCK
      if (!plays) {
        for (const side of ['device_in_left', 'device_in_right']) {
          const input = Float32Array.from({ length: frames }, () =>
            rings ? random() * 0.5 - 0.25 : 0,
          )
          for (const device of pair)
            new Float32Array(device.memory.buffer, device[side](), frames).set(input)
        }
      }
      for (const device of pair) device.device_process(frames)
      for (const side of ['device_out_left', 'device_out_right']) {
        const [plain, vector] = pair.map((device) => words(device, device[side](), frames))
        for (let i = 0; i < frames; i += 1) {
          compared += 1
          if (plain[i] !== 0) sounded = true
          if (plain[i] !== vector[i]) differs ??= `run ${run}, frame ${done + i}, ${side}`
        }
      }
      done += frames
    }
  }
  if (differs || !sounded) failed = true
  console.log(
    differs
      ? `${id}: DIFFERENT (${differs})`
      : sounded
        ? `${id}: the same, ${compared} samples`
        : `${id}: SILENT, so nothing was compared`,
  )
}
process.exit(failed ? 1 : 0)
