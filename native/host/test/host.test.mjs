// The plug-in host against its two test plug-ins, over the same protocol a
// page speaks. Build first (`pnpm host:build`), then `pnpm test:host`.
//
//   LIVE_MIX_PLUGIN_HOST_BUILD  the build directory (default tmp/plugin-host)
//
// On Linux without a display the host runs under xvfb-run: plug-in editors
// need one.

import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, before, test } from 'node:test'

import { pluginHostBinaryPath, pluginHostTestPluginsDir, startPluginHost } from '../../shell.mjs'

const buildDir = resolve(process.env.LIVE_MIX_PLUGIN_HOST_BUILD ?? 'tmp/plugin-host')
const binary = pluginHostBinaryPath(buildDir)
const testPlugins = pluginHostTestPluginsDir(buildDir)
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
    /** The first event of `name` that `match` accepts, waiting up to a second for it. */
    async event(name, match = () => true) {
      for (let i = 0; i < 100; i += 1) {
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

  const [gain, mode] = slot.params
  assert.equal(gain.name, 'Gain')
  near(gain.value, 0.5)
  assert.equal(gain.automatable, true)
  assert.equal(gain.discrete, false)
  assert.equal(mode.name, 'Mode')
  assert.equal(mode.steps, 3)
  assert.deepEqual(mode.choices, ['Normal', 'Invert', 'Mute'])
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

  control.notify('setParam', { slot: slot.slot, index: 0, value: 0.1 })
  await sleep(50)
  const restored = await control.call('setState', { slot: slot.slot, state })
  near(restored.params[0].value, 0.75)
  assert.equal(restored.latencySamples, GAIN_DELAY)
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

test('exits when its standard input closes', async () => {
  const second = await startPluginHost({ binary, dataDir, wrapper })
  const started = Date.now()
  await second.stop()
  const { code } = await second.exit
  assert.equal(code, 0)
  assert.ok(Date.now() - started < 3000, 'the host had to be killed')
})
