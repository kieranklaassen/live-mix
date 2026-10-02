// The plug-in host against its two test plug-ins, over the same protocol a
// page speaks. Build first (`pnpm host:build`), then `pnpm test:host`.
//
//   LIVE_MIX_PLUGIN_HOST_BUILD  the build directory (default tmp/plugin-host)
//
// On Linux without a display the host runs under xvfb-run: plug-in editors
// need one.

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, before, test } from 'node:test'

import {
  pluginHostBinaryPath,
  pluginHostTestPluginsDir,
  pluginHostTroublePluginDir,
  startPluginHost,
} from '../../shell.mjs'

const buildDir = resolve(process.env.LIVE_MIX_PLUGIN_HOST_BUILD ?? 'tmp/plugin-host')
const binary = pluginHostBinaryPath(buildDir)
const testPlugins = pluginHostTestPluginsDir(buildDir)
const troublePlugin = pluginHostTroublePluginDir(buildDir)
const wrapper = process.platform === 'linux' && !process.env.DISPLAY ? ['xvfb-run', '-a'] : []
const dataDir = mkdtempSync(join(tmpdir(), 'live-mix-host-test-'))

const SAMPLE_RATE = 48000
const PROCESS = 1
const MIDI = 2
const HEADER = 16
/** What the test gain plug-in delays by, and reports as its latency. */
const GAIN_DELAY = 64

let host
let control

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

function open(url) {
  return new Promise((done, fail) => {
    const socket = new WebSocket(url)
    socket.binaryType = 'arraybuffer'
    socket.onopen = () => done(socket)
    socket.onerror = () =>
      fail(new Error(`could not open ${url.replace(/token=[^&]*/, 'token=…')}`))
  })
}

/** The control connection: requests by id, events collected by name. */
async function connectControl(token = host.token) {
  const socket = await open(`${host.url}/control?token=${token}`)
  const pending = new Map()
  const events = []
  let next = 1
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    if (message.event) {
      events.push(message)
      return
    }
    const waiter = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) waiter?.fail(new Error(message.error.message))
    else waiter?.done(message.result)
  }
  return {
    events,
    call: (method, params = {}) =>
      new Promise((done, fail) => {
        const id = next++
        pending.set(id, { done, fail })
        socket.send(JSON.stringify({ id, method, params }))
      }),
    notify: (method, params = {}) => socket.send(JSON.stringify({ method, params })),
    /** The first event of `name` that `match` accepts, waiting up to a second for it (or `tries` hundredths). */
    async event(name, match = () => true, tries = 100) {
      for (let i = 0; i < tries; i += 1) {
        const found = events.find((entry) => entry.event === name && match(entry))
        if (found) return found
        await sleep(10)
      }
      throw new Error(`no "${name}" event arrived`)
    },
    close: () => socket.close(),
  }
}

/** The audio connection of one slot: a block out, the processed block back. */
async function connectAudio(slot) {
  const socket = await open(`${host.url}/audio?token=${host.token}&slot=${slot}&out=2`)
  let sequence = 0
  return {
    process(channels, frames) {
      const message = new ArrayBuffer(HEADER + channels.length * frames * 4)
      new Uint32Array(message, 0, 4).set([PROCESS, frames, channels.length, sequence])
      const payload = new Float32Array(message, HEADER)
      channels.forEach((channel, index) => payload.set(channel, index * frames))
      const expected = sequence
      sequence += 1
      return new Promise((done) => {
        socket.onmessage = ({ data }) => {
          const [type, outFrames, outChannels, seq] = new Uint32Array(data, 0, 4)
          assert.deepEqual([type, outFrames, outChannels, seq], [PROCESS, frames, 2, expected])
          const samples = new Float32Array(data, HEADER)
          done([samples.slice(0, frames), samples.slice(frames, frames * 2)])
        }
        socket.send(message)
      })
    },
    midi(bytes) {
      const message = new ArrayBuffer(HEADER + Math.ceil(bytes.length / 4) * 4)
      new Uint32Array(message, 0, 4).set([MIDI, bytes.length, 0, 0])
      new Uint8Array(message, HEADER).set(bytes)
      socket.send(message)
    },
    closed: new Promise((done) => {
      socket.onclose = () => done(true)
    }),
    close: () => socket.close(),
  }
}

function ramp(frames, offset = 0) {
  return Float32Array.from({ length: frames }, (_, index) => ((offset + index) % 1000) / 1000)
}

const near = (actual, expected, tolerance = 1e-6) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} is not within ${tolerance} of ${expected}`,
  )

/** The process ids of the scanners running now: the host started again with `--scan-worker`. */
function scanners() {
  try {
    return execFileSync('pgrep', ['-f', 'live-mix-plugin-host.*--scan-worker'], {
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean)
  } catch {
    // pgrep ends with status 1 when nothing matches.
    return []
  }
}

async function loadTestPlugin(name, connection = control) {
  const { plugins } = await connection.call('plugins')
  const plugin = plugins.find((entry) => entry.name === name && entry.format === 'VST3')
  assert.ok(plugin, `${name} was not scanned`)
  return connection.call('load', { plugin: plugin.id, sampleRate: SAMPLE_RATE, blockSize: 512 })
}

before(async () => {
  host = await startPluginHost({ binary, dataDir, wrapper })
  control = await connectControl()
})

after(async () => {
  control?.close()
  await host?.stop()
  rmSync(dataDir, { recursive: true, force: true })
})

test('says hello with its protocol and formats', async () => {
  const hello = await control.call('hello')
  assert.equal(hello.protocol, 1)
  assert.equal(hello.name, 'live-mix-plugin-host')
  assert.ok(hello.formats.includes('VST3'))
  assert.equal(hello.formats.includes('AudioUnit'), process.platform === 'darwin')
})

test('refuses a connection without the token', async () => {
  await assert.rejects(connectControl('wrong'))
  await assert.rejects(open(`${host.url}/audio?token=wrong&slot=s1`))
})

test('scans a folder, reports progress and remembers what it found', async () => {
  const scan = await control.call('scan', { paths: [testPlugins], defaultPaths: false })
  const names = scan.plugins.map((plugin) => plugin.name).sort()
  assert.deepEqual(names, ['LiveMix Test Gain', 'LiveMix Test Sine'])
  assert.deepEqual(scan.failed, [])
  assert.deepEqual(scan.crashed, [])
  assert.ok(
    control.events.some((entry) => entry.event === 'scanProgress' && entry.format === 'VST3'),
  )

  const gain = scan.plugins.find((plugin) => plugin.name === 'LiveMix Test Gain')
  assert.equal(gain.format, 'VST3')
  assert.equal(gain.vendor, 'KKFonie')
  assert.equal(gain.isInstrument, false)
  const sine = scan.plugins.find((plugin) => plugin.name === 'LiveMix Test Sine')
  assert.equal(sine.isInstrument, true)

  const { plugins } = await control.call('plugins')
  assert.deepEqual(plugins, scan.plugins)
  // The list is kept where the shell said, for the next start.
  assert.ok(existsSync(join(dataDir, 'plugins.xml')))
})

test('answers an unknown method and an unknown plug-in with an error', async () => {
  await assert.rejects(control.call('nonsense'), /unknown method/)
  await assert.rejects(
    control.call('load', { plugin: 'VST3-Nothing-0-0', sampleRate: SAMPLE_RATE, blockSize: 512 }),
    /unknown plug-in/,
  )
  await assert.rejects(control.call('getParams', { slot: 'nope' }), /unknown slot/)
})

test('loads an effect and describes it', async () => {
  const slot = await loadTestPlugin('LiveMix Test Gain')
  assert.equal(slot.name, 'LiveMix Test Gain')
  assert.equal(slot.isInstrument, false)
  assert.equal(slot.inputs, 2)
  assert.equal(slot.outputs, 2)
  assert.equal(slot.sampleRate, SAMPLE_RATE)
  assert.equal(slot.latencySamples, GAIN_DELAY)
  assert.equal(slot.hasEditor, true)

  const [gain, mode, transport] = slot.params
  assert.equal(gain.name, 'Gain')
  near(gain.value, 0.5)
  assert.equal(gain.automatable, true)
  assert.equal(gain.discrete, false)
  assert.equal(mode.name, 'Mode')
  assert.equal(mode.steps, 3)
  assert.deepEqual(mode.choices, ['Normal', 'Invert', 'Mute'])
  assert.deepEqual(transport.choices, ['Ignore', 'Follow'])
  // No MIDI controller stand-ins among the parameters.
  assert.ok(slot.params.every((param) => !param.name.startsWith('MIDI CC')))
  await control.call('unload', { slot: slot.slot })
})

test('processes audio in order, and parameters reach the plug-in', async () => {
  const slot = await loadTestPlugin('LiveMix Test Gain')
  const audio = await connectAudio(slot.slot)

  // Three blocks of different sizes: the output is the input 64 frames later.
  const sizes = [128, 512, 256]
  const input = []
  const output = []
  for (const frames of sizes) {
    const block = ramp(frames, input.length)
    const [left, right] = await audio.process([block, block], frames)
    input.push(...block)
    output.push(...left)
    assert.deepEqual(right, left)
  }
  for (let index = 0; index < GAIN_DELAY; index += 1) assert.equal(output[index], 0)
  for (let index = GAIN_DELAY; index < output.length; index += 1) {
    near(output[index], input[index - GAIN_DELAY])
  }

  // Gain 0..2 over 0..1: a quarter of the way is half the level.
  control.notify('setParam', { slot: slot.slot, index: 0, value: 0.25 })
  const echoed = await control.event(
    'params',
    (entry) => entry.slot === slot.slot && entry.changes.some((change) => change.index === 0),
  )
  const change = echoed.changes.find((entry) => entry.index === 0)
  assert.equal(change.origin, 'client')
  near(change.value, 0.25)
  assert.match(change.text, /^0\.5/)
  let [left] = await audio.process([ramp(256).fill(1), ramp(256).fill(1)], 256)
  near(left[255], 0.5)

  // Mode 1 of three inverts.
  control.notify('setParam', { slot: slot.slot, index: 1, value: 0.5 })
  await sleep(50)
  ;[left] = await audio.process([ramp(256).fill(1), ramp(256).fill(1)], 256)
  near(left[255], -0.5)

  // A mono block is played into both inputs.
  ;[left] = await audio.process([ramp(256).fill(1)], 256)
  near(left[255], -0.5)

  const { params } = await control.call('getParams', { slot: slot.slot })
  near(params[0].value, 0.25)
  assert.equal(params[1].text, 'Invert')

  await control.call('unload', { slot: slot.slot })
  assert.equal(await audio.closed, true)
})

test('saves and restores the plug-in state', async () => {
  const slot = await loadTestPlugin('LiveMix Test Gain')
  control.notify('setParam', { slot: slot.slot, index: 0, value: 0.75 })
  await sleep(50)
  const { state } = await control.call('getState', { slot: slot.slot })
  assert.ok(state.length > 0)
  assert.match(state, /^[A-Za-z0-9+/]+=*$/)

  // The host says what it set on its own timer, which a busy machine runs
  // late: wait for it to have said so rather than for a length of time, or
  // the report of this value is counted with those after the restore.
  const saidOf = async (value) => {
    for (let waited = 0; waited < 5000; waited += 10) {
      const said = control.events.some(
        (entry) =>
          entry.event === 'params' &&
          entry.slot === slot.slot &&
          entry.changes.some(
            (change) => change.index === 0 && Math.abs(change.value - value) < 1e-4,
          ),
      )
      if (said) return
      await sleep(10)
    }
    assert.fail(`the host never said the parameter was set to ${value}`)
  }
  control.notify('setParam', { slot: slot.slot, index: 0, value: 0.1 })
  await saidOf(0.1)
  const heard = control.events.length
  const restored = await control.call('setState', { slot: slot.slot, state })
  near(restored.params[0].value, 0.75)
  assert.equal(restored.latencySamples, GAIN_DELAY)
  // The answer said where every parameter is: the restore is not told again
  // as the plug-in turning its own knobs, which would arrive after a client
  // has set its values on top. A report of the restore would come no later
  // than the one of the value set after it.
  control.notify('setParam', { slot: slot.slot, index: 0, value: 0.4 })
  await saidOf(0.4)
  await sleep(100)
  const told = control.events
    .slice(heard)
    .filter((entry) => entry.event === 'params' && entry.slot === slot.slot)
    .flatMap((entry) => entry.changes)
  assert.deepEqual(
    told.map((change) => [change.index, change.origin]),
    [[0, 'client']],
  )
  near(told[0].value, 0.4)
  await assert.rejects(control.call('setState', { slot: slot.slot, state: '***' }), /base64/)
  await control.call('unload', { slot: slot.slot })

  // A fresh instance starts from the saved state.
  const { plugins } = await control.call('plugins')
  const plugin = plugins.find((entry) => entry.name === 'LiveMix Test Gain')
  const again = await control.call('load', {
    plugin: plugin.id,
    sampleRate: SAMPLE_RATE,
    blockSize: 512,
    state,
  })
  near(again.params[0].value, 0.75)
  await control.call('unload', { slot: again.slot })
})

test('plays an instrument from MIDI', async () => {
  const slot = await loadTestPlugin('LiveMix Test Sine')
  assert.equal(slot.isInstrument, true)
  assert.equal(slot.acceptsMidi, true)
  const audio = await connectAudio(slot.slot)

  let [left] = await audio.process([], 512)
  assert.ok(left.every((sample) => sample === 0))

  // A4 at full velocity: 440 Hz, so 4.4 cycles in 480 frames.
  audio.midi([0x90, 69, 127])
  ;[left] = await audio.process([], 480)
  let crossings = 0
  let peak = 0
  for (let index = 1; index < left.length; index += 1) {
    if (left[index - 1] < 0 !== left[index] < 0) crossings += 1
    peak = Math.max(peak, Math.abs(left[index]))
  }
  assert.ok(crossings === 8 || crossings === 9, `${crossings} zero crossings`)
  assert.ok(peak > 0.1, `peak ${peak}`)

  audio.midi([0x80, 69, 0])
  ;[left] = await audio.process([], 256)
  assert.ok(left.every((sample) => sample === 0))
  await control.call('unload', { slot: slot.slot })
})

test('says when the state changed and brings back what no parameter shows', async () => {
  const slot = await loadTestPlugin('LiveMix Test Sine')
  const audio = await connectAudio(slot.slot)
  const crossings = async () => {
    audio.midi([0x90, 69, 127])
    const [left] = await audio.process([], 480)
    audio.midi([0x80, 69, 0])
    await audio.process([], 64)
    let count = 0
    for (let index = 1; index < left.length; index += 1) {
      if (left[index - 1] < 0 !== left[index] < 0) count += 1
    }
    return count
  }
  const inTune = await control.call('getState', { slot: slot.slot })
  const before = await crossings()
  assert.ok(before === 8 || before === 9, `${before} zero crossings`)

  // Controller 20 tunes the test instrument an octave up; no parameter moves.
  audio.midi([0xb0, 20, 76])
  await audio.process([], 64)
  await control.event('stateChanged', (entry) => entry.slot === slot.slot)
  const up = await crossings()
  assert.ok(up === 17 || up === 18, `${up} zero crossings`)
  const tuned = await control.call('getState', { slot: slot.slot })
  assert.notEqual(tuned.state, inTune.state)
  const { params } = await control.call('getParams', { slot: slot.slot })
  near(params[0].value, slot.params[0].value)

  await control.call('setState', { slot: slot.slot, state: inTune.state })
  const back = await crossings()
  assert.ok(back === 8 || back === 9, `${back} zero crossings`)
  await control.call('unload', { slot: slot.slot })

  // A fresh instance given the tuned state plays an octave up.
  const { plugins } = await control.call('plugins')
  const plugin = plugins.find(
    (entry) => entry.name === 'LiveMix Test Sine' && entry.format === 'VST3',
  )
  const again = await control.call('load', {
    plugin: plugin.id,
    sampleRate: SAMPLE_RATE,
    blockSize: 512,
    state: tuned.state,
  })
  const fresh = await connectAudio(again.slot)
  fresh.midi([0x90, 69, 127])
  const [left] = await fresh.process([], 480)
  let count = 0
  for (let index = 1; index < left.length; index += 1) {
    if (left[index - 1] < 0 !== left[index] < 0) count += 1
  }
  assert.ok(count === 17 || count === 18, `${count} zero crossings`)
  await control.call('unload', { slot: again.slot })
})

test('opens and closes the editor window', async () => {
  const slot = await loadTestPlugin('LiveMix Test Gain')
  assert.deepEqual(await control.call('showEditor', { slot: slot.slot }), { showing: true })
  // Asking again brings the same window forward.
  assert.deepEqual(await control.call('showEditor', { slot: slot.slot }), { showing: true })
  await control.call('hideEditor', { slot: slot.slot })
  // Unloading with the editor open must not take the host down.
  await control.call('showEditor', { slot: slot.slot })
  await control.call('unload', { slot: slot.slot })
  assert.equal((await control.call('hello')).protocol, 1)
})

test('unloads what a page loaded when the page goes away', async () => {
  const page = await connectControl()
  const slot = await loadTestPlugin('LiveMix Test Gain', page)
  await control.call('getParams', { slot: slot.slot })
  page.close()
  for (let i = 0; i < 100; i += 1) {
    try {
      await control.call('getParams', { slot: slot.slot })
    } catch (error) {
      assert.match(error.message, /unknown slot/)
      return
    }
    await sleep(10)
  }
  assert.fail('the slot outlived its connection')
})

test('a plug-in still loading when its page goes away is not kept', async () => {
  // Slot ids count up: this is the one the abandoned load would be given.
  const probe = await loadTestPlugin('LiveMix Test Gain')
  await control.call('unload', { slot: probe.slot })
  const next = `s${Number(probe.slot.slice(1)) + 1}`

  const page = await connectControl()
  const { plugins } = await control.call('plugins')
  const plugin = plugins.find((entry) => entry.name === 'LiveMix Test Gain')
  // The request and the goodbye go out together: the host reads both before
  // the plug-in is up.
  void page
    .call('load', { plugin: plugin.id, sampleRate: SAMPLE_RATE, blockSize: 512 })
    .catch(() => {})
  page.close()
  await sleep(500)
  await assert.rejects(control.call('getParams', { slot: next }), /unknown slot/)
})

test('a tempo change leaves a stopped transport stopped', async () => {
  const slot = await loadTestPlugin('LiveMix Test Gain')
  const audio = await connectAudio(slot.slot)
  const level = async () => {
    const ones = new Float32Array(256).fill(1)
    const [left] = await audio.process([ones, ones], 256)
    return left[255]
  }
  // Transport on Follow: the plug-in is silent while the play head is stopped.
  control.notify('setParam', { slot: slot.slot, index: 2, value: 1 })
  await control.event(
    'params',
    (entry) => entry.slot === slot.slot && entry.changes.some((change) => change.index === 2),
  )
  near(await level(), 1)

  await control.call('setTransport', { playing: false })
  near(await level(), 0)
  await control.call('setTransport', { bpm: 90 })
  near(await level(), 0)
  await control.call('setTransport', { playing: true })
  near(await level(), 1)

  await control.call('unload', { slot: slot.slot })
})

test('hosts an Audio Unit', { skip: process.platform !== 'darwin' }, async () => {
  // Apple's own units are on every Mac; no install needed.
  const scan = await control.call('scan', { paths: [testPlugins], defaultPaths: true })
  const units = scan.plugins.filter((plugin) => plugin.format === 'AudioUnit')
  assert.ok(units.length > 0, 'no Audio Units found')
  const unit =
    units.find((plugin) => plugin.name === 'AULowpass') ??
    units.find((plugin) => !plugin.isInstrument)
  const slot = await control.call('load', {
    plugin: unit.id,
    sampleRate: SAMPLE_RATE,
    blockSize: 512,
  })
  assert.equal(slot.format, 'AudioUnit')
  assert.ok(slot.params.length > 0)
  const audio = await connectAudio(slot.slot)
  let peak = 0
  for (let block = 0; block < 8; block += 1) {
    const tone = Float32Array.from({ length: 512 }, (_, index) =>
      Math.sin((2 * Math.PI * 110 * (block * 512 + index)) / SAMPLE_RATE),
    )
    const [left] = await audio.process([tone, tone], 512)
    for (const sample of left) peak = Math.max(peak, Math.abs(sample))
  }
  assert.ok(peak > 0.1, `an Audio Unit returned silence (peak ${peak})`)
  await control.call('unload', { slot: slot.slot })
})

test('a second start takes the port and token it is given and knows the scanned plug-ins', async () => {
  const second = await startPluginHost({
    binary,
    dataDir,
    wrapper,
    token: 'chosen-token',
    port: 47815,
  })
  try {
    assert.equal(second.token, 'chosen-token')
    assert.equal(second.port, 47815)
    const socket = await open(`${second.url}/control?token=chosen-token`)
    const plugins = await new Promise((done) => {
      socket.onmessage = ({ data }) => done(JSON.parse(data).result.plugins)
      socket.send(JSON.stringify({ id: 1, method: 'plugins', params: {} }))
    })
    // On a Mac the list also holds the Audio Units an earlier test scanned.
    const names = plugins.map((plugin) => plugin.name)
    for (const name of ['LiveMix Test Gain', 'LiveMix Test Sine']) {
      assert.ok(names.includes(name), `${name} is not in ${names.join(', ')}`)
    }
    socket.close()
  } finally {
    await second.stop()
  }
})

/**
 * A host of its own, in a data folder of its own, with the plug-in that goes
 * wrong told how to (`trouble`: "abort", "hang" or nothing).
 */
async function withTrouble(trouble, folder, body) {
  const env = { ...process.env }
  delete env.LIVE_MIX_TEST_TROUBLE
  if (trouble) env.LIVE_MIX_TEST_TROUBLE = trouble
  const previous = host
  const own = await startPluginHost({ binary, dataDir: folder, wrapper, env })
  host = own
  let connection
  try {
    connection = await connectControl(own.token)
    return await body(connection, own)
  } finally {
    host = previous
    connection?.close()
    await own.stop()
  }
}

const scanWithTrouble = (connection, more = {}) =>
  connection.call('scan', { paths: [testPlugins, troublePlugin], defaultPaths: false, ...more })

const namesOf = (scan) => scan.plugins.map((plugin) => plugin.name).sort()

// What a plug-in does to a scan, and what ends it: a crash by itself, one that
// only waits by the scanner noticing its thread uses no processor, one that
// keeps a processor busy by the time a plug-in is given. `goes` is how often
// the scan takes the plug-in up: a crash after other plug-ins may be their
// doing, so the plug-in gets a scanner to itself before it is left out.
for (const [trouble, what, limits, goes] of [
  ['abort', 'crashes', {}, 2],
  ['hang', 'never answers', { idle: 1 }, 1],
  ['spin', 'never finishes', { timeout: 2 }, 1],
]) {
  test(`a plug-in that ${what} while it is scanned is left out, and the host carries on`, async () => {
    const folder = mkdtempSync(join(tmpdir(), 'live-mix-host-trouble-'))
    try {
      const left = await withTrouble(trouble, folder, async (connection, own) => {
        const scan = await scanWithTrouble(connection, limits)
        // The two beside it are found, in the same scan and the same host.
        assert.deepEqual(namesOf(scan), ['LiveMix Test Gain', 'LiveMix Test Sine'])
        assert.equal(scan.crashed.length, 1)
        assert.match(scan.crashed[0], /LiveMix Test Trouble/)
        assert.deepEqual(scan.failed, scan.crashed)
        assert.equal(scan.names[scan.crashed[0]], 'LiveMix Test Trouble')
        assert.equal(own.process.exitCode, null, 'the host ended')
        const taken = connection.events.filter(
          (entry) => entry.event === 'scanProgress' && entry.name === 'LiveMix Test Trouble',
        )
        assert.equal(taken.length, goes)

        // Still a host: it loads and runs what it found.
        const slot = await loadTestPlugin('LiveMix Test Gain', connection)
        assert.equal(slot.name, 'LiveMix Test Gain')
        await connection.call('unload', { slot: slot.slot })

        // The next scan does not go near it again.
        const started = Date.now()
        const again = await scanWithTrouble(connection, limits)
        assert.ok(Date.now() - started < 1500, 'the scan tried the plug-in again')
        assert.deepEqual(again.failed, [])
        assert.deepEqual(again.crashed, scan.crashed)
        return scan.crashed
      })

      // Nor does a host started later, with the plug-in behaving by now.
      await withTrouble(null, folder, async (connection) => {
        const scan = await scanWithTrouble(connection)
        assert.deepEqual(namesOf(scan), ['LiveMix Test Gain', 'LiveMix Test Sine'])
        assert.deepEqual(scan.crashed, left)

        // Until a scan is asked to start over.
        const fresh = await scanWithTrouble(connection, { rescan: true })
        assert.deepEqual(namesOf(fresh), [
          'LiveMix Test Gain',
          'LiveMix Test Sine',
          'LiveMix Test Trouble',
        ])
        assert.deepEqual(fresh.crashed, [])
        assert.deepEqual(fresh.failed, [])
      })
    } finally {
      rmSync(folder, { recursive: true, force: true })
    }
  })
}

test('hands a list from one scanner to the next, which carries on where it stopped', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'live-mix-host-relay-'))
  try {
    await withTrouble(null, folder, async (connection) => {
      // One plug-in to a scanner: three scanners for the three plug-ins.
      const scan = await scanWithTrouble(connection, { perProcess: 1 })
      assert.deepEqual(namesOf(scan), [
        'LiveMix Test Gain',
        'LiveMix Test Sine',
        'LiveMix Test Trouble',
      ])
      assert.deepEqual(scan.failed, [])
      assert.deepEqual(scan.crashed, [])
      const taken = connection.events
        .filter((entry) => entry.event === 'scanProgress')
        .map((entry) => entry.name)
      assert.deepEqual(taken.sort(), namesOf(scan))
    })
  } finally {
    rmSync(folder, { recursive: true, force: true })
  }
})

test('keeps out a plug-in an earlier host noted as the one it ended in', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'live-mix-host-noted-'))
  try {
    const file = await withTrouble(null, folder, async (connection) => {
      const scan = await scanWithTrouble(connection)
      return scan.plugins.find((plugin) => plugin.name === 'LiveMix Test Trouble').file
    })
    rmSync(join(folder, 'plugins.xml'))
    writeFileSync(join(folder, 'scan-in-progress.txt'), file)

    await withTrouble(null, folder, async (connection) => {
      const scan = await scanWithTrouble(connection)
      assert.deepEqual(namesOf(scan), ['LiveMix Test Gain', 'LiveMix Test Sine'])
      assert.deepEqual(scan.crashed, [file])
      assert.ok(!existsSync(join(folder, 'scan-in-progress.txt')))
    })
  } finally {
    rmSync(folder, { recursive: true, force: true })
  }
})

test('a scan nobody waits for any more ends its scanner and keeps what it found', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'live-mix-host-gone-'))
  try {
    await withTrouble('hang', folder, async (connection) => {
      void scanWithTrouble(connection).catch(() => {})
      await connection.event(
        'scanProgress',
        (entry) => /LiveMix Test Trouble/.test(entry.file),
        1000,
      )
      assert.equal(scanners().length, 1)
      // The page that asked goes away in the middle of the plug-in.
      connection.close()
      for (let i = 0; i < 300 && scanners().length > 0; i += 1) await sleep(10)
      assert.equal(scanners().length, 0, 'the scanner outlived its scan')
    })

    // What it found until then is kept, and the host says it is not everything.
    await withTrouble(null, folder, async (connection) => {
      assert.equal((await connection.call('hello')).scanUnfinished, true)
      assert.deepEqual(namesOf(await connection.call('plugins')), [
        'LiveMix Test Gain',
        'LiveMix Test Sine',
      ])
      // The plug-in the scan was cut short in is not held against it.
      const scan = await scanWithTrouble(connection)
      assert.equal(scan.plugins.length, 3)
      assert.deepEqual(scan.crashed, [])
      assert.equal((await connection.call('hello')).scanUnfinished, false)
    })
  } finally {
    rmSync(folder, { recursive: true, force: true })
  }
})

test('exits when its standard input closes', async () => {
  const second = await startPluginHost({ binary, dataDir, wrapper })
  const started = Date.now()
  await second.stop()
  const { code } = await second.exit
  assert.equal(code, 0)
  assert.ok(Date.now() - started < 3000, 'the host had to be killed')
})
