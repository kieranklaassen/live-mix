// Ableton Link in the plug-in host, against a second peer that is Ableton's
// own library and nothing else (`test/link/LinkPeer.cpp`). Both run on this
// machine and find each other the way Link peers do, by multicast, so the
// tests need a network interface that carries it; where there is none they
// are skipped unless LIVE_MIX_REQUIRE_LINK_SESSION is set.
//
//   LIVE_MIX_PLUGIN_HOST_BUILD  the build directory (default tmp/plugin-host)

import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { after, before, test } from 'node:test'

import { pluginHostBinaryPath, pluginHostLinkPeerPath, startPluginHost } from '../../shell.mjs'

const buildDir = resolve(process.env.LIVE_MIX_PLUGIN_HOST_BUILD ?? 'tmp/plugin-host')
const binary = pluginHostBinaryPath(buildDir)
const peerBinary = pluginHostLinkPeerPath(buildDir)
const wrapper = process.platform === 'linux' && !process.env.DISPLAY ? ['xvfb-run', '-a'] : []
const dataDir = mkdtempSync(join(tmpdir(), 'live-mix-link-test-'))
const requireSession = Boolean(process.env.LIVE_MIX_REQUIRE_LINK_SESSION)

const QUANTUM = 4
const SAMPLE_RATE = 48000
const LINK_AUDIO = 3
const LINK_AUDIO_HEADER = 24

let host
let control
let peer
/** Whether the host and the peer found each other; the session tests need it. */
let together = false

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

async function until(read, what, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const value = await read()
    if (value) return value
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`)
    await sleep(20)
  }
}

function open(url) {
  return new Promise((done, fail) => {
    const socket = new WebSocket(url)
    socket.binaryType = 'arraybuffer'
    socket.onopen = () => done(socket)
    socket.onerror = () =>
      fail(new Error(`could not open ${url.replace(/token=[^&]*/, 'token=…')}`))
  })
}

/** A control connection: requests by id, `link` events kept in order. */
async function connectControl() {
  const socket = await open(`${host.url}/control?token=${host.token}`)
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
    /** The newest `link` event `match` accepts, among those that arrive from now on. */
    linkEvent(match, what) {
      const from = events.length
      return until(
        () => events.slice(from).findLast((entry) => entry.event === 'link' && match(entry)),
        what,
      )
    },
    close: () => socket.close(),
  }
}

/** The second peer: commands in, its JSON lines out. */
function startPeer(name) {
  const child = spawn(peerBinary, [name], { stdio: ['pipe', 'pipe', 'inherit'] })
  const lines = []
  createInterface({ input: child.stdout }).on('line', (line) => {
    try {
      lines.push(JSON.parse(line))
    } catch {
      // Not ours.
    }
  })
  const send = (command) => child.stdin.write(`${command}\n`)
  return {
    lines,
    send,
    /** Sends `command` and returns the state the peer answers it with. */
    async ask(command) {
      const from = lines.length
      send(command)
      return (await until(() => lines.slice(from).findLast((line) => line.state), command)).state
    },
    /** The newest state `match` accepts, among those printed from now on. */
    async state(match, what) {
      const from = lines.length
      return (
        await until(
          () => lines.slice(from).findLast((line) => line.state && match(line.state)),
          what,
        )
      ).state
    },
    stop() {
      send('quit')
      return new Promise((done) => child.once('exit', done))
    },
  }
}

/** The beat a state puts at `micros`, by its tempo. */
const beatAt = (state, micros) => state.beat + ((micros - state.micros) * state.bpm) / 60e6
const phaseOf = (beat) => ((beat % QUANTUM) + QUANTUM) % QUANTUM
/** The distance between two phases, the short way round the bar. */
const phaseGap = (a, b) => {
  const gap = Math.abs(phaseOf(a) - phaseOf(b))
  return Math.min(gap, QUANTUM - gap)
}

const near = (actual, expected, tolerance, what = 'value') =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${what}: ${actual} is not within ${tolerance} of ${expected}`,
  )

function session(name, run) {
  test(name, async (t) => {
    if (!together) {
      t.skip('the host and the peer did not find each other on this machine')
      return
    }
    await run(t)
  })
}

before(async () => {
  assert.ok(existsSync(peerBinary), `no Link peer at ${peerBinary}; run pnpm host:build`)
  host = await startPluginHost({ binary, dataDir, wrapper })
  control = await connectControl()
  peer = startPeer('Second peer')
  await until(() => peer.lines.some((line) => line.ready), 'the peer to start')
})

after(async () => {
  control?.close()
  await peer?.stop()
  await host?.stop()
  rmSync(dataDir, { recursive: true, force: true })
})

test('says it has Link and which release', async () => {
  const hello = await control.call('hello')
  assert.equal(hello.link, true)
  assert.match(hello.linkVersion, /^\d+\.\d+/)
})

test('is not in a session until it is asked to be', async () => {
  const state = await control.call('link')
  assert.equal(state.available, true)
  assert.equal(state.enabled, false)
  assert.equal(state.peers, 0)
  assert.equal(state.bpm, 120)
  assert.equal(state.quantum, QUANTUM)
})

test('answers a ping with a microsecond clock that runs', async () => {
  const first = await control.call('linkPing')
  await sleep(100)
  const second = await control.call('linkPing')
  near(second.micros - first.micros, 100_000, 60_000, 'microseconds in a tenth of a second')
})

test('sets its own tempo and name while alone', async () => {
  const state = await control.call('link', { enabled: true, name: 'Ambient Live', bpm: 87.5 })
  assert.equal(state.enabled, true)
  near(state.bpm, 87.5, 1e-9)
  await until(async () => (await control.call('link')).name === 'Ambient Live', 'the name')
  near((await control.call('link', { bpm: 5000 })).bpm, 999, 1e-9, 'a tempo out of range')
  await control.call('link', { bpm: 120 })
})

test('alone, a beat asked for now falls now', async () => {
  const { micros } = await control.call('linkPing')
  const started = await control.call('linkStart', { beat: 8, atMicros: micros + 20_000 })
  // The time comes back through Link's beat arithmetic: to a beat and back,
  // each step rounded to a millionth of a beat or a microsecond. It lands a
  // few microseconds to either side of the one asked for (two, on a Mac
  // runner); five is the hundred-thousandth of a beat the next line allows.
  near(started.atMicros, micros + 20_000, 5, 'the time the beat falls at')
  near(beatAt(started, micros + 20_000), 8, 1e-5, 'the beat at that time')
})

test('finds the other peer', async (t) => {
  const joined = control.linkEvent((event) => event.peers === 1, 'the host to see the peer')
  peer.send('enable 1')
  try {
    await joined
    await until(async () => (await peer.ask('state')).peers === 1, 'the peer to see the host')
    together = true
  } catch (error) {
    if (requireSession) throw error
    t.skip('no multicast between two programs on this machine')
  }
})

session('follows the tempo a peer sets, and sets one the peer follows', async () => {
  const followed = control.linkEvent((event) => event.bpm === 96, 'the tempo to arrive')
  peer.send('tempo 96')
  await followed

  // A tempo crosses the network as whole microseconds per beat, so it arrives
  // a few millionths of a bpm from what was set.
  const heard = peer.state((state) => Math.abs(state.bpm - 132.25) < 0.001, 'the peer to follow')
  await control.call('link', { bpm: 132.25 })
  await heard
  await control.call('link', { bpm: 120 })
  await peer.state((state) => state.bpm === 120, 'the tempo to return')
})

session('counts the same beat at the same moment as the peer', async () => {
  await sleep(300)
  const ours = await control.call('link')
  const theirs = await peer.ask('state')
  // Both read one clock, so the two can be compared at any one time on it.
  const gap = phaseGap(beatAt(ours, theirs.micros), theirs.beat)
  assert.ok(gap < 0.001, `the bar is ${gap} beats apart`)
})

session('in a session, a beat asked for now waits for its place in the bar', async () => {
  const { micros } = await control.call('linkPing')
  const started = await control.call('linkStart', { beat: 0, atMicros: micros })
  assert.ok(started.atMicros >= micros, 'the start is not in the past')
  const barMicros = (QUANTUM * 60e6) / started.bpm
  assert.ok(started.atMicros - micros <= barMicros + 1000, 'the start is within a bar')
  near(beatAt(started, started.atMicros), 0, 1e-5, 'our beat at the start')
  // The peer is on a downbeat at that moment too.
  const theirs = await peer.ask('state')
  const gap = phaseGap(beatAt(theirs, started.atMicros), 0)
  assert.ok(gap < 0.001, `the peer is ${gap} beats off its downbeat`)
})

session('shares start and stop when both ask for it', async () => {
  await control.call('link', { startStopSync: true })
  await peer.ask('sync 1')

  // We start; the peer hears it.
  const { micros } = await control.call('linkPing')
  const heard = peer.state((state) => state.playing, 'the peer to start')
  const started = await control.call('linkStart', { beat: 0, atMicros: micros, playing: true })
  assert.equal(started.playing, true)
  await heard

  // The peer stops; we hear it.
  const stopped = control.linkEvent((event) => event.playing === false, 'our stop')
  peer.send('stop')
  await stopped

  // The peer starts; we hear it and find where our beat 16 falls for that start.
  const begun = control.linkEvent((event) => event.playing === true, 'our start')
  peer.send('play 0')
  const event = await begun
  const follow = await control.call('linkStart', { beat: 16, follow: true })
  assert.ok(follow.atMicros >= event.playingAtMicros - 1000, 'our start is not before theirs')
  const theirs = await peer.ask('state')
  const gap = phaseGap(beatAt(theirs, follow.atMicros), 16)
  assert.ok(gap < 0.001, `our start is ${gap} beats off the peer's bar`)

  // We stop; the peer hears it.
  const quiet = peer.state((state) => !state.playing, 'the peer to stop')
  await control.call('linkStop')
  await quiet
  await control.call('link', { startStopSync: false })
  await peer.ask('sync 0')
})

session('sends a channel a peer can listen to, with every sample on its beat', async () => {
  await control.call('link', { audio: true })
  await peer.ask('audio 1')
  const audio = await open(`${host.url}/link-audio?token=${host.token}&name=Main`)
  try {
    await until(
      async () =>
        (await peer.ask('state')).channels.some(
          (channel) => channel.name === 'Main' && channel.peerName === 'Ambient Live',
        ),
      'the peer to see the channel',
    )
    const from = peer.lines.length
    peer.send('listen Main')
    await until(() => peer.lines.slice(from).find((line) => line.listening === true), 'listening')

    // Stereo blocks of silence, each stamped with when it is heard, with one
    // full-scale sample on the left on the third beat of a bar and one at
    // minus full scale on the right on the fourth.
    const frames = 480
    const blockMicros = (frames / SAMPLE_RATE) * 1e6
    const state = await control.call('link')
    const microsAtBeat = (beat) => state.micros + ((beat - state.beat) * 60e6) / state.bpm
    const bar = Math.ceil((beatAt(state, state.micros + 1_200_000) + 1) / QUANTUM) * QUANTUM
    const marks = [
      { micros: microsAtBeat(bar + 2), channel: 0, value: 1 },
      { micros: microsAtBeat(bar + 3), channel: 1, value: -1 },
    ]
    const first = (await control.call('linkPing')).micros + 20_000
    const lastBlock = Math.ceil((marks[1].micros - first) / blockMicros) + 20
    for (let block = 0; block < lastBlock; block += 1) {
      const begins = first + block * blockMicros
      const message = new ArrayBuffer(LINK_AUDIO_HEADER + frames * 2 * 4)
      new Uint32Array(message, 0, 4).set([LINK_AUDIO, frames, 2, SAMPLE_RATE])
      new Float64Array(message, 16, 1)[0] = begins
      const samples = new Float32Array(message, LINK_AUDIO_HEADER)
      for (const mark of marks) {
        const frame = Math.round(((mark.micros - begins) / 1e6) * SAMPLE_RATE)
        if (frame >= 0 && frame < frames) samples[frame * 2 + mark.channel] = mark.value
      }
      audio.send(message)
      // In step with the clock, as a page sends it.
      const due = begins - 15_000 + blockMicros
      const now = (await control.call('linkPing')).micros
      if (due > now) await sleep((due - now) / 1000)
    }

    const impulses = await until(() => {
      const found = peer.lines.slice(from).filter((line) => line.impulse)
      return found.length >= 2 ? found.map((line) => line.impulse) : null
    }, 'both samples to arrive')
    assert.equal(impulses.length, 2, 'nothing else was loud')
    const [left, right] = impulses
    assert.deepEqual(
      [left.channel, left.channels, left.sampleRate, right.channel],
      [0, 2, SAMPLE_RATE, 1],
    )
    assert.ok(left.value > 0.99 && right.value < -0.99, 'full scale both ways')
    // One frame is 0.00004 beats at 120 bpm; the stamp is good to well under a millisecond.
    near(left.phase, 2, 0.001, 'the left sample in the bar')
    near(right.phase, 3, 0.001, 'the right sample in the bar')
  } finally {
    audio.close()
  }
  await until(
    async () => (await peer.ask('state')).channels.every((channel) => channel.name !== 'Main'),
    'the channel to go when its connection does',
  )
})

session('leaves the session when the page that asked for it goes', async () => {
  const gone = peer.state((state) => state.peers === 0, 'the peer to be alone')
  control.close()
  await gone
  control = await connectControl()
  assert.equal((await control.call('link')).enabled, false)
})
