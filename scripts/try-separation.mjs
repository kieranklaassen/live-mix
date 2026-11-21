// Runs a real separation model through the built `./separation` entry on a
// real recording, in Node, and says what it measured. Not part of
// `pnpm check`: it needs an ONNX runtime, an export of a model and a WAV file,
// and the repository holds none of the three (docs/separation.md says what an
// export has to look like and where the license of a model's weights stands).
//
//   pnpm build
//   node scripts/try-separation.mjs \
//     --runtime <path to onnxruntime-web's dist/ort.node.min.mjs> \
//     --model <path to a hybrid model's .onnx> \
//     --wav <path to a WAV file> \
//     [--out <folder for the five parts and report.json>] [--threads <n>]
//
// The runtime's WebAssembly build runs in Node, so this is the code a browser
// runs, on a processor. It says nothing of a run on a graphics card.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import { decodeWav, encodeWav } from '../dist/index.js'
import {
  PART_NAMES,
  STEM_NAMES,
  createHybridModel,
  createSegmentSeparator,
  separateTrack,
} from '../dist/separation/index.js'

const { values } = parseArgs({
  options: {
    runtime: { type: 'string' },
    model: { type: 'string' },
    wav: { type: 'string' },
    out: { type: 'string' },
    threads: { type: 'string' },
  },
})
if (!values.runtime || !values.model || !values.wav) {
  console.error(
    'try-separation: pass --runtime <onnxruntime-web module>, --model <.onnx> and --wav <file>.\n' +
      'See the comment at the top of scripts/try-separation.mjs.',
  )
  process.exit(1)
}

const db = (ratio) => (ratio > 0 ? 10 * Math.log10(ratio) : -Infinity)
const squares = (channels) =>
  channels.reduce((sum, channel) => sum + channel.reduce((s, x) => s + x * x, 0), 0)

/** Where the weight of a sound's spectrum lies, in Hz: the mean frequency of its power. */
function centroidHz(channels, sampleRate) {
  const size = 4096
  let weighted = 0
  let total = 0
  const re = new Float64Array(size)
  const im = new Float64Array(size)
  for (const channel of channels) {
    for (let from = 0; from + size <= channel.length; from += size) {
      for (let n = 0; n < size; n += 1) {
        re[n] = channel[from + n] * (0.5 - 0.5 * Math.cos((2 * Math.PI * n) / size))
        im[n] = 0
      }
      fft(re, im)
      for (let bin = 1; bin < size / 2; bin += 1) {
        const power = re[bin] * re[bin] + im[bin] * im[bin]
        weighted += power * ((bin * sampleRate) / size)
        total += power
      }
    }
  }
  return total > 0 ? weighted / total : 0
}

/** An in-place radix-2 transform, enough for a measure. */
function fft(re, im) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let half = 1; half < n; half *= 2) {
    for (let k = 0; k < half; k += 1) {
      const angle = (-Math.PI * k) / half
      const wr = Math.cos(angle)
      const wi = Math.sin(angle)
      for (let a = k; a < n; a += 2 * half) {
        const b = a + half
        const tr = re[b] * wr - im[b] * wi
        const ti = re[b] * wi + im[b] * wr
        re[b] = re[a] - tr
        im[b] = im[a] - ti
        re[a] += tr
        im[a] += ti
      }
    }
  }
}

const ort = await import(pathToFileURL(resolve(values.runtime)).href)
if (values.threads) ort.env.wasm.numThreads = Number(values.threads)
const bytes = await readFile(values.wav)
const track = decodeWav(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
const seconds = track.channels[0].length / track.sampleRate
console.log(
  `track: ${seconds.toFixed(2)} s, ${track.channels.length} channel(s) at ${track.sampleRate} Hz`,
)

const loading = performance.now()
const session = await ort.InferenceSession.create(await readFile(values.model), {
  executionProviders: ['wasm'],
})
console.log(
  `session: ${((performance.now() - loading) / 1000).toFixed(1)} s to make, ` +
    `${ort.env.wasm.numThreads || 'the runtime’s own count of'} thread(s), ` +
    `inputs [${session.inputNames.join(', ')}], outputs [${session.outputNames.join(', ')}]`,
)

const separator = createSegmentSeparator(createHybridModel({ Tensor: ort.Tensor, session }))
const segmentSeconds = []
let mark = performance.now()
const started = mark
const separation = await separateTrack(track, separator, {
  onProgress: ({ done, total }) => {
    const now = performance.now()
    segmentSeconds.push((now - mark) / 1000)
    mark = now
    console.log(`segment ${done} of ${total}: ${segmentSeconds.at(-1).toFixed(1)} s`)
  },
})
const runSeconds = (performance.now() - started) / 1000

const trackSquares = squares(track.channels)
const parts = Object.fromEntries(
  PART_NAMES.map((name) => {
    const channels = name === 'remainder' ? separation.remainder : separation.stems[name]
    return [
      name,
      {
        levelDb: Number(db(squares(channels) / trackSquares).toFixed(2)),
        centroidHz: Math.round(centroidHz(channels, separation.sampleRate)),
      },
    ]
  }),
)

// The five parts added as a mixer adds them, against the track.
let off = 0
for (let channel = 0; channel < track.channels.length; channel += 1) {
  const sum = new Float32Array(track.channels[channel].length)
  for (const name of STEM_NAMES) {
    for (let i = 0; i < sum.length; i += 1) sum[i] += separation.stems[name][channel][i]
  }
  for (let i = 0; i < sum.length; i += 1) {
    off = Math.max(
      off,
      Math.abs(sum[i] + separation.remainder[channel][i] - track.channels[channel][i]),
    )
  }
}

const report = {
  seconds: Number(seconds.toFixed(2)),
  sampleRate: track.sampleRate,
  channels: track.channels.length,
  runSeconds: Number(runSeconds.toFixed(1)),
  segmentSeconds: segmentSeconds.map((value) => Number(value.toFixed(1))),
  ...separation.report,
  remainderDb: Number(separation.report.remainderDb.toFixed(2)),
  sumAgainstTrackDb: Number((2 * db(off)).toFixed(1)),
  parts,
  residentMegabytes: Math.round(process.memoryUsage().rss / 1e6),
}
console.log(JSON.stringify(report, null, 2))

const lowest = STEM_NAMES.toSorted((a, b) => parts[a].centroidHz - parts[b].centroidHz)[0]
console.log(`the stem that sits lowest is ${lowest}`)

if (values.out) {
  await mkdir(values.out, { recursive: true })
  for (const name of PART_NAMES) {
    const channels = name === 'remainder' ? separation.remainder : separation.stems[name]
    const wav = encodeWav({ channels, sampleRate: separation.sampleRate }, { bitDepth: 32 })
    await writeFile(join(values.out, `${name}.wav`), Buffer.from(wav))
  }
  await writeFile(join(values.out, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`wrote the five parts and report.json to ${values.out}`)
}
