// Runs real separation models through the built `./separation` entry on a
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
//     [--out <folder for the parts and report.json>] [--threads <n>]
//
// That is one hybrid model of the four stems, run once over the track. The
// rest is said with these:
//
//   --separator '<json>'    A model, as { "kind", "model", "spec", "take" }.
//                           `kind` is hybrid, waveform or spectrogram. `model`
//                           is the path of its .onnx. `spec` is the kind's
//                           spec, written out or as the path of a JSON file
//                           that holds it, and a hybrid model with none is one
//                           of the four. `take` is the stems kept of it, every
//                           one when it is left out. The flag is repeated for
//                           a set, and a set is joined into one separator.
//                           `--model <path>` is a hybrid model with no spec
//                           and no `take`, the first of the set.
//   --overlap <x>           How much of a segment the next one covers again.
//   --shifts <n>            How many times each model goes over the track.
//   --seed <n>              What the offsets of the later passes are drawn from.
//                           The three are handed to every model's runner, and
//                           left out they are 0.25, 1 and 0, the runner's own.
//   --split '<json>'        A part split by a second model, as { "part",
//                           "rest", "kind", "model", "spec", "take" }: the part
//                           to split, the name of what the model leaves of it
//                           (the part's own when left out), and the model as
//                           above. Repeated, the splits are made in order.
//   --compare <folder>      An earlier run's `--out`. Each part of this run is
//                           held against the file of the same name there.
//   --compare-as <a>=<b>    This run's part `a` held against the earlier run's
//                           part `b` as well. Repeated for more pairs.
//   --silence <frames>      In place of `--wav`: a silent track of two channels
//                           and that many frames at 44,100 Hz. The separator is
//                           then run alone and not through `separateTrack`, so
//                           what it answers to silence is measured whether or
//                           not the guard would take it, and the report says
//                           which. It takes no split and no comparison.
//
// The report is printed, and written as report.json where `--out` is given. A
// run that fails says its error there and exits with 1.
//
// The runtime's WebAssembly build runs in Node, so this is the code a browser
// runs, on a processor. It says nothing of a run on a graphics card.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import { decodeWav, encodeWav, seededUnit } from '../dist/index.js'
import {
  HYBRID_MODEL_SPEC,
  createHybridModel,
  createSegmentSeparator,
  createSpectrogramModel,
  createWaveformModel,
  joinSeparators,
  partNames,
  separateTrack,
  splitPart,
  stemNames,
} from '../dist/separation/index.js'

const { values } = parseArgs({
  options: {
    runtime: { type: 'string' },
    model: { type: 'string' },
    separator: { type: 'string', multiple: true },
    split: { type: 'string', multiple: true },
    wav: { type: 'string' },
    silence: { type: 'string' },
    overlap: { type: 'string' },
    shifts: { type: 'string' },
    seed: { type: 'string' },
    compare: { type: 'string' },
    'compare-as': { type: 'string', multiple: true },
    out: { type: 'string' },
    threads: { type: 'string' },
  },
})
if (
  !values.runtime ||
  (!values.model && !values.separator) ||
  (values.wav === undefined) === (values.silence === undefined)
) {
  console.error(
    'try-separation: pass --runtime <onnxruntime-web module>, --model <.onnx> or --separator <json>,\n' +
      'and --wav <file> or --silence <frames>.\n' +
      'See the comment at the top of scripts/try-separation.mjs.',
  )
  process.exit(1)
}

/** The sample rate of the silent track that stands in for a recording. */
const SILENCE_RATE = 44100

const overlap = values.overlap === undefined ? 0.25 : Number(values.overlap)
const shifts = values.shifts === undefined ? 1 : Number(values.shifts)
const seed = values.seed === undefined ? 0 : Number(values.seed)

const db = (ratio) => (ratio > 0 ? 10 * Math.log10(ratio) : -Infinity)
const squares = (channels) =>
  channels.reduce((sum, channel) => sum + channel.reduce((s, x) => s + x * x, 0), 0)
const largest = (channels) =>
  channels.reduce((peak, channel) => channel.reduce((p, x) => Math.max(p, Math.abs(x)), peak), 0)
/** A figure as a report holds it: rounded, or in words where JSON has no number for it. */
const figure = (value, digits) =>
  Number.isFinite(value) ? Number(value.toFixed(digits)) : String(value)
const secondsSince = (from) => Number(((performance.now() - from) / 1000).toFixed(1))

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

/** The sound of a WAV file. */
async function readWav(path) {
  const bytes = await readFile(path)
  return decodeWav(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
}

/** The segment model of `kind` over a session, with the kind's spec. */
function modelOf(kind, runtime, spec) {
  if (kind === 'hybrid') {
    return spec === undefined ? createHybridModel(runtime) : createHybridModel(runtime, spec)
  }
  if (kind !== 'waveform' && kind !== 'spectrogram') {
    throw new Error(
      `a model's kind is hybrid, waveform or spectrogram, not ${JSON.stringify(kind)}`,
    )
  }
  if (spec === undefined) {
    throw new Error(
      `a ${kind} model is given its spec: only a hybrid model has one to fall back on`,
    )
  }
  return kind === 'waveform'
    ? createWaveformModel(runtime, spec)
    : createSpectrogramModel(runtime, spec)
}

/**
 * The silence in front of the track in each pass of a model at `sampleRate`.
 * The entry does not hand these out. They are drawn here by the runner's own
 * rule: none for the first pass, and for pass `k` from the second on a whole
 * number of frames up to half a second, from the seed and `k` alone.
 */
const offsetsOf = (sampleRate) =>
  Array.from({ length: shifts }, (_, index) =>
    index === 0
      ? 0
      : Math.floor(
          seededUnit(seed, 'separation-shift', index + 1) * (Math.floor(0.5 * sampleRate) + 1),
        ),
  )

/**
 * The model an entry of the command line names, with its session made: the
 * separator that runs it over a track, the stems kept of it, and what the
 * report says of it.
 */
async function memberOf(ort, entry) {
  const making = performance.now()
  const session = await ort.InferenceSession.create(await readFile(entry.model), {
    executionProviders: ['wasm'],
  })
  const sessionSeconds = secondsSince(making)
  const file = basename(entry.model)
  console.log(
    `session of ${file}: ${sessionSeconds.toFixed(1)} s to make, ` +
      `${ort.env.wasm.numThreads || 'the runtime’s own count of'} thread(s), ` +
      `inputs [${session.inputNames.join(', ')}], outputs [${session.outputNames.join(', ')}]`,
  )
  const spec =
    typeof entry.spec === 'string' ? JSON.parse(await readFile(entry.spec, 'utf8')) : entry.spec
  const model = modelOf(entry.kind, { Tensor: ort.Tensor, session }, spec)
  const separator = createSegmentSeparator(model, { overlap, shifts, seed })
  return {
    separator,
    take: entry.take,
    said: {
      kind: entry.kind,
      model: file,
      spec: spec ?? HYBRID_MODEL_SPEC,
      stems: separator.stems,
      take: entry.take ?? separator.stems,
      sampleRate: model.sampleRate,
      segmentFrames: model.segmentFrames,
      standardized: model.standardize ?? true,
      sessionSeconds,
      ...(shifts > 1 ? { offsets: offsetsOf(model.sampleRate) } : {}),
    },
  }
}

/** The members of a set as one separator: the one itself when it stands alone and every stem is kept. */
const standing = (members) =>
  members.length === 1 && members[0].take === undefined
    ? members[0].separator
    : joinSeparators(members.map(({ separator, take }) => ({ separator, take })))

/** Times the steps of a run as they are reported, and prints each. */
function stepsOf(label) {
  const seconds = []
  let mark = performance.now()
  let said
  return {
    seconds,
    total: () => said,
    onProgress: ({ done, total }) => {
      const now = performance.now()
      seconds.push((now - mark) / 1000)
      mark = now
      said = total
      console.log(`${label} ${done} of ${total}: ${seconds.at(-1).toFixed(1)} s`)
    },
  }
}
const stepsSaid = (steps) => ({
  steps: steps.seconds.length,
  stepsSaid: steps.total(),
  segmentSeconds: steps.seconds.map((value) => Number(value.toFixed(1))),
})

/** How far `now` is from an earlier part's sound, or why the two cannot be held against each other. */
function differenceOf(now, sampleRate, earlier) {
  const frames = now[0].length
  if (
    earlier.sampleRate !== sampleRate ||
    earlier.channels.length !== now.length ||
    earlier.channels[0].length !== frames
  ) {
    return {
      error:
        `the earlier file is ${earlier.channels.length} channel(s) of ${earlier.channels[0].length} frames ` +
        `at ${earlier.sampleRate} Hz, and this part ${now.length} of ${frames} at ${sampleRate}`,
    }
  }
  let peak = 0
  let difference = 0
  let whole = 0
  now.forEach((channel, index) => {
    const other = earlier.channels[index]
    for (let i = 0; i < frames; i += 1) {
      const off = channel[i] - other[i]
      peak = Math.max(peak, Math.abs(off))
      difference += off * off
      whole += other[i] * other[i]
    }
  })
  return {
    // The largest sample of the difference, against full scale.
    largestDb: figure(2 * db(peak), 2),
    // The difference's level against the earlier part's, both as mean squares.
    differenceDb: figure(db(difference / whole), 2),
    same: peak === 0,
  }
}

const startedAt = performance.now()
const report = { at: new Date().toISOString(), options: {}, stageSeconds: {} }

/** Runs one stage of the run and says how long it took, whether or not it ended well. */
async function stage(name, work) {
  const from = performance.now()
  try {
    return await work()
  } finally {
    report.stageSeconds[name] = secondsSince(from)
  }
}

async function run() {
  const pairs = (values['compare-as'] ?? []).map((pair) => {
    const [part, against, ...more] = pair.split('=')
    if (!part || !against || more.length > 0) {
      throw new Error(`--compare-as takes <part>=<earlier part>, not ${pair}`)
    }
    return [part, against]
  })
  if (pairs.length > 0 && !values.compare) {
    throw new Error('--compare-as names parts of an earlier run: pass its folder as --compare')
  }
  const silent = values.silence !== undefined
  if (silent && (values.split || values.compare)) {
    throw new Error('--silence runs the separator alone: it takes no --split and no --compare')
  }
  const entries = [
    ...(values.model ? [{ kind: 'hybrid', model: values.model }] : []),
    ...(values.separator ?? []).map((text) => JSON.parse(text)),
  ]
  const splitEntries = (values.split ?? []).map((text) => JSON.parse(text))
  Object.assign(report.options, {
    overlap,
    shifts,
    seed,
    ...(values.compare ? { compare: basename(resolve(values.compare)), compareAs: pairs } : {}),
  })

  let track
  if (silent) {
    const frames = Number(values.silence)
    if (!(Number.isInteger(frames) && frames > 0)) {
      throw new Error(`--silence takes a whole number of frames over zero, not ${values.silence}`)
    }
    track = {
      channels: [new Float32Array(frames), new Float32Array(frames)],
      sampleRate: SILENCE_RATE,
    }
  } else {
    track = await readWav(values.wav)
  }
  const frames = track.channels[0].length
  const seconds = frames / track.sampleRate
  report.options.recording = {
    file: silent ? 'none: silence' : basename(values.wav),
    frames,
    seconds: Number(seconds.toFixed(2)),
    sampleRate: track.sampleRate,
    channels: track.channels.length,
  }
  console.log(
    `track: ${seconds.toFixed(2)} s, ${track.channels.length} channel(s) at ${track.sampleRate} Hz` +
      (silent ? ', silent' : ''),
  )

  const ort = await import(pathToFileURL(resolve(values.runtime)).href)
  if (values.threads) ort.env.wasm.numThreads = Number(values.threads)
  report.options.runtime = { file: basename(values.runtime), versions: ort.env.versions }
  report.options.node = process.version

  const { members, splits } = await stage('sessions', async () => {
    const members = []
    report.options.separators = []
    for (const entry of entries) {
      const member = await memberOf(ort, entry)
      members.push(member)
      report.options.separators.push(member.said)
    }
    const splits = []
    report.options.splits = []
    for (const { part, rest, ...entry } of splitEntries) {
      const member = await memberOf(ort, entry)
      splits.push({ part, rest, separator: standing([member]) })
      report.options.splits.push({ part, rest: rest ?? part, ...member.said })
    }
    // Read once a session is made: a runtime left to choose says its choice by then.
    report.options.threads = ort.env.wasm.numThreads ?? null
    return { members, splits }
  })
  const separator = standing(members)

  if (silent) {
    report.ran =
      'the separator alone, on silence, and not through separateTrack: ' +
      'what it answered is measured whether or not the guard takes it'
    const steps = stepsOf('segment')
    const answer = await stage('separation', () =>
      separator.separate(track.channels, { onProgress: steps.onProgress }),
    )
    Object.assign(report, stepsSaid(steps))
    report.stems = Object.fromEntries(
      Object.entries(answer).map(([name, channels]) => {
        const peak = largest(channels)
        return [
          name,
          {
            peak: Number(peak.toPrecision(4)),
            peakDb: figure(2 * db(peak), 1),
            rms: Number(Math.sqrt(squares(channels) / (channels.length * frames)).toPrecision(4)),
          },
        ]
      }),
    )
    // Whether a run would take this answer: the same stems, handed to
    // `separateTrack` by a separator that runs no model.
    try {
      await separateTrack(track, {
        sampleRate: track.sampleRate,
        stems: Object.keys(answer),
        separate: () => Promise.resolve(answer),
      })
      report.guard = { refused: false }
    } catch (error) {
      report.guard = { refused: true, message: error instanceof Error ? error.message : error }
    }
    return
  }

  const steps = stepsOf('segment')
  let separation = await stage('separation', () =>
    separateTrack(track, separator, { onProgress: steps.onProgress }),
  )
  Object.assign(report, {
    seconds: Number(seconds.toFixed(2)),
    sampleRate: track.sampleRate,
    channels: track.channels.length,
    runSeconds: report.stageSeconds.separation,
    ...stepsSaid(steps),
    ...separation.report,
    remainderDb: figure(separation.report.remainderDb, 2),
  })

  if (splits.length > 0) {
    report.splits = []
    await stage('splits', async () => {
      for (const { part, rest, separator: second } of splits) {
        const splitSteps = stepsOf(`split of ${part}, segment`)
        const from = performance.now()
        separation = await splitPart(separation, part, second, {
          rest,
          onProgress: splitSteps.onProgress,
        })
        const said = separation.report.splits.at(-1)
        report.splits.push({
          ...said,
          restDb: figure(said.restDb, 2),
          runSeconds: secondsSince(from),
          ...stepsSaid(splitSteps),
        })
      }
    })
  }

  const names = partNames(separation)
  const soundOf = (name) => (name === 'remainder' ? separation.remainder : separation.stems[name])
  await stage('measures', () => {
    const trackSquares = squares(track.channels)
    report.names = names
    report.parts = Object.fromEntries(
      names.map((name) => {
        const channels = soundOf(name)
        return [
          name,
          {
            levelDb: figure(db(squares(channels) / trackSquares), 2),
            centroidHz: Math.round(centroidHz(channels, separation.sampleRate)),
          },
        ]
      }),
    )
    // The parts added as a mixer adds them, against the track.
    let off = 0
    for (let channel = 0; channel < track.channels.length; channel += 1) {
      const sum = new Float32Array(track.channels[channel].length)
      for (const name of stemNames(separation)) {
        for (let i = 0; i < sum.length; i += 1) sum[i] += separation.stems[name][channel][i]
      }
      for (let i = 0; i < sum.length; i += 1) {
        off = Math.max(
          off,
          Math.abs(sum[i] + separation.remainder[channel][i] - track.channels[channel][i]),
        )
      }
    }
    report.sumAgainstTrackDb = figure(2 * db(off), 1)
    const lowest = stemNames(separation).toSorted(
      (a, b) => report.parts[a].centroidHz - report.parts[b].centroidHz,
    )[0]
    console.log(`the stem that sits lowest is ${lowest}`)
  })

  if (values.compare) {
    await stage('comparison', async () => {
      const earlier = new Map()
      /** A part of the earlier run, or nothing when its folder has no such file. */
      const earlierOf = async (name) => {
        if (!earlier.has(name)) {
          const sound = await readWav(join(values.compare, `${name}.wav`)).catch((error) => {
            if (error.code === 'ENOENT') return undefined
            throw error
          })
          earlier.set(name, sound)
        }
        return earlier.get(name)
      }
      report.compare = []
      // Each part against the earlier part of its own name, then the pairs that were asked for.
      for (const [part, against] of [...names.map((name) => [name, name]), ...pairs]) {
        if (!names.includes(part)) {
          report.compare.push({ part, against, error: `this run has no part named ${part}` })
          continue
        }
        const sound = await earlierOf(against)
        report.compare.push({
          part,
          against,
          ...(sound === undefined
            ? { absent: true }
            : differenceOf(soundOf(part), separation.sampleRate, sound)),
        })
      }
    })
  }

  if (values.out) {
    await stage('writing', async () => {
      await mkdir(values.out, { recursive: true })
      for (const name of names) {
        const wav = encodeWav(
          { channels: soundOf(name), sampleRate: separation.sampleRate },
          { bitDepth: 32 },
        )
        await writeFile(join(values.out, `${name}.wav`), Buffer.from(wav))
      }
    })
    console.log(`wrote the ${names.length} parts to ${values.out}`)
  }
}

try {
  await run()
} catch (error) {
  console.error(error)
  report.error = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  process.exitCode = 1
}
report.wholeSeconds = secondsSince(startedAt)
report.residentMegabytes = Math.round(process.memoryUsage().rss / 1e6)
// The most the process held at any time, which `maxRSS` gives in kilobytes of 1,024.
report.peakResidentMegabytes = Math.round((process.resourceUsage().maxRSS * 1024) / 1e6)
console.log(JSON.stringify(report, null, 2))
if (values.out) {
  await mkdir(values.out, { recursive: true })
  await writeFile(join(values.out, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`wrote report.json to ${values.out}`)
}
