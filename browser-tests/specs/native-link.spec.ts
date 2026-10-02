// Ableton Link in a real browser: a page joins a Link session through the
// plug-in host, next to a second peer that is Ableton's own library
// (`native/host/test/link/LinkPeer.cpp`). Tempo, the place in the bar and
// start/stop are compared between the two, and a click the page schedules on
// a beat with a real AudioContext is sent over Link Audio and has to arrive at
// the peer on that beat.
//
// Needs the host built (`pnpm host:build`). The two peers find each other by
// multicast on this machine; where no interface carries it the tests skip,
// unless LIVE_MIX_REQUIRE_LINK_SESSION is set.

import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createInterface } from 'node:readline'

import { expect, test, type Page } from '@playwright/test'

import {
  pluginHostBinaryPath,
  pluginHostLinkPeerPath,
  pluginHostTestPluginsDir,
  startPluginHost,
  type RunningPluginHost,
} from '../../native/shell.mjs'
import type { NativeHarnessArgs } from '../harness/native'
import { collectPageErrors } from './page-errors'

const buildDir = resolve(process.env.LIVE_MIX_PLUGIN_HOST_BUILD ?? 'tmp/plugin-host')
const binary = pluginHostBinaryPath(buildDir)
const peerBinary = pluginHostLinkPeerPath(buildDir)
const required = Boolean(process.env.LIVE_MIX_REQUIRE_PLUGIN_HOST)
const requireSession = Boolean(process.env.LIVE_MIX_REQUIRE_LINK_SESSION)
const wrapper = process.platform === 'linux' && !process.env.DISPLAY ? ['xvfb-run', '-a'] : []

const QUANTUM = 4

interface PeerState {
  peers: number
  bpm: number
  beat: number
  micros: number
  playing: boolean
  channels: { name: string; peerName: string }[]
}
interface PeerImpulse {
  channel: number
  value: number
  beat?: number
  phase?: number
}
interface PeerLine {
  ready?: boolean
  state?: PeerState
  impulse?: PeerImpulse
  listening?: boolean
}

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms))

/** The last entry `match` accepts. */
function last<T>(entries: T[], match: (entry: T) => unknown): T | undefined {
  for (let i = entries.length - 1; i >= 0; i -= 1) if (match(entries[i])) return entries[i]
  return undefined
}

async function until<T>(read: () => T | undefined, what: string, timeoutMs = 8000): Promise<T> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const value = read()
    if (value) return value
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`)
    await sleep(20)
  }
}

/** The second peer: commands in, its JSON lines out. */
class Peer {
  readonly lines: PeerLine[] = []
  private readonly child: ChildProcess

  constructor(name: string) {
    this.child = spawn(peerBinary, [name], { stdio: ['pipe', 'pipe', 'inherit'] })
    if (!this.child.stdout) throw new Error('the Link peer has no output')
    createInterface({ input: this.child.stdout }).on('line', (line) => {
      try {
        this.lines.push(JSON.parse(line) as PeerLine)
      } catch {
        // Not ours.
      }
    })
  }

  send(command: string): void {
    this.child.stdin?.write(`${command}\n`)
  }

  /** Sends `command` and returns the state the peer answers it with. */
  async ask(command: string): Promise<PeerState> {
    const from = this.lines.length
    this.send(command)
    return (await until(() => last(this.lines.slice(from), (line) => line.state), command))
      .state as PeerState
  }

  /** The newest state `match` accepts, among those printed from now on. */
  async state(match: (state: PeerState) => boolean, what: string): Promise<PeerState> {
    const from = this.lines.length
    const line = await until(
      () => last(this.lines.slice(from), (entry) => entry.state && match(entry.state)),
      what,
    )
    return line.state as PeerState
  }

  stop(): Promise<void> {
    this.send('quit')
    return new Promise((done) => this.child.once('exit', () => done()))
  }
}

const phaseOf = (beat: number) => ((beat % QUANTUM) + QUANTUM) % QUANTUM
/** The distance between two places in the bar, the short way round. */
const phaseGap = (a: number, b: number) => {
  const gap = Math.abs(phaseOf(a) - phaseOf(b))
  return Math.min(gap, QUANTUM - gap)
}
const beatAt = (state: { beat: number; micros: number; bpm: number }, micros: number) =>
  state.beat + ((micros - state.micros) * state.bpm) / 60e6

let host: RunningPluginHost | undefined
let dataDir: string | undefined
let peer: Peer | undefined
let together = false

test.describe('Ableton Link through the plug-in host', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!required && !existsSync(binary), 'the plug-in host is not built: pnpm host:build')

  let page: Page
  let errors: string[]

  test.beforeAll(async ({ browser }) => {
    dataDir = mkdtempSync(join(tmpdir(), 'live-mix-link-browser-'))
    host = await startPluginHost({ binary, dataDir, wrapper })
    peer = new Peer('Second peer')
    await until(() => peer?.lines.some((line) => line.ready), 'the peer to start')
    await peer.ask('enable 1')
    await peer.ask('audio 1')

    page = await browser.newPage()
    errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/native.html')
    await page.waitForFunction(() => window.nativeHarness !== undefined)
    const args: NativeHarnessArgs = {
      host: { url: host.url, token: host.token },
      pluginDir: pluginHostTestPluginsDir(buildDir),
    }
    const opened = await page.evaluate(
      (a) => window.nativeHarness!.linkOpen(a, 'Browser page', 'Main'),
      args,
    )
    expect(opened.available).toBe(true)
    expect(opened.enabled).toBe(true)
    expect(opened.audioStatus).toBe('open')

    try {
      await until(
        () => last(peer?.lines ?? [], (line) => line.state)?.state?.peers === 1 || undefined,
        'the peer to find the page',
        6000,
      )
      together = true
    } catch (error) {
      if (requireSession) throw error
    }
  })

  test.afterAll(async () => {
    await page?.evaluate(() => window.nativeHarness!.linkClose()).catch(() => undefined)
    await page?.close()
    await peer?.stop()
    await host?.stop()
    if (dataDir) rmSync(dataDir, { recursive: true, force: true })
  })

  test.beforeEach(() => {
    test.skip(!together, 'the page and the peer did not find each other on this machine')
  })

  test('the page and the peer are in one session, at one tempo and one place in the bar', async () => {
    const state = await page.evaluate(() => window.nativeHarness!.linkState())
    expect(state.peers).toBe(1)
    // The clock offset rests on a loopback round trip.
    expect(state.clockTripMs).toBeLessThan(5)

    const theirs = await peer!.ask('state')
    expect(Math.abs(theirs.bpm - state.bpm)).toBeLessThan(0.001)
    // The page's beat, worked out on the page's clock, against the peer's own
    // reading at the same host microsecond.
    const mine = await page.evaluate(() => window.nativeHarness!.linkState())
    const theirsNow = await peer!.ask('state')
    expect(phaseGap(beatAt(mine, theirsNow.micros), theirsNow.beat)).toBeLessThan(0.002)
    expect(phaseGap(mine.beatNow, beatAt(theirsNow, mine.hostMicrosNow))).toBeLessThan(0.004)
  })

  test('tempo goes both ways', async () => {
    const waiting = peer!.state((state) => Math.abs(state.bpm - 96) < 0.001, 'the peer at 96')
    await page.evaluate(() => window.nativeHarness!.linkSet({ bpm: 96 }))
    await waiting

    peer!.send('tempo 132.5')
    await page.waitForFunction(
      () => Math.abs(window.nativeHarness!.linkState().bpm - 132.5) < 0.001,
    )
    peer!.send('tempo 120')
    await page.waitForFunction(() => Math.abs(window.nativeHarness!.linkState().bpm - 120) < 0.001)
  })

  test('a start waits for the bar, and start and stop are shared', async () => {
    await peer!.ask('sync 1')
    await page.evaluate(() => window.nativeHarness!.linkSet({ startStopSync: true }))

    const before = await page.evaluate(() => window.nativeHarness!.linkState())
    const playing = peer!.state((state) => state.playing, 'the peer to hear the start')
    const started = await page.evaluate(() => window.nativeHarness!.linkStart(64, true))
    // Beat 64 is a downbeat: it falls at the end of the bar the session is in.
    const left = (QUANTUM - before.phaseNow) * (60_000 / before.bpm)
    expect(started.waitMs).toBeGreaterThan(0)
    expect(started.waitMs).toBeLessThanOrEqual(QUANTUM * (60_000 / before.bpm) + 5)
    expect(Math.abs(started.waitMs - left)).toBeLessThan(60)
    expect(Math.abs(started.beatThen - 64)).toBeLessThan(0.001)
    await playing

    const stopped = peer!.state((state) => !state.playing, 'the peer to hear the stop')
    await page.evaluate(() => window.nativeHarness!.linkStop())
    await stopped

    // The other way: the peer starts, the page hears it and finds its beat.
    peer!.send('play 0')
    await page.waitForFunction(() => window.nativeHarness!.linkState().playing)
    const followed = await page.evaluate(() => window.nativeHarness!.linkFollowStart(8))
    expect(followed.waitMs).toBeLessThan(QUANTUM * 500 + 50)
    expect(followed.state.playing).toBe(true)
    peer!.send('stop')
    await page.waitForFunction(() => !window.nativeHarness!.linkState().playing)
  })

  test('a click scheduled on a beat reaches the peer over Link Audio on that beat', async () => {
    const seen = await peer!
      .state(
        (state) => state.channels.some((channel) => channel.name === 'Main'),
        'the peer to see the channel',
      )
      .catch(() => peer!.ask('state'))
    const channel = seen.channels.find((entry) => entry.name === 'Main')
    expect(channel).toMatchObject({ name: 'Main', peerName: 'Browser page' })

    peer!.send('listen Main')
    await until(() => peer!.lines.some((line) => line.listening), 'the peer to listen')
    // Let the stream settle: the first buffers tell the peer the format.
    await sleep(700)

    // A click is scheduled on the audio clock a beat ahead, by where the
    // page then has the output and the host's clock. If either moves before
    // the click is sent, the click says nothing about the path and another is
    // played: a headless browser's stand-in audio device drops a buffer now
    // and then on a busy machine, which moves the sound itself by 10 ms.
    const phases = [0, 1, 2.5, 3, 0, 2, 1.25, 3.75]
    const gaps: number[] = []
    const log: string[] = []
    for (let attempt = 0; gaps.length < phases.length && attempt < 40; attempt += 1) {
      const phase = phases[gaps.length]
      const from = peer!.lines.length
      const click = await page.evaluate((p) => window.nativeHarness!.linkClick(p, 1), phase)
      expect(click.phase).toBeCloseTo(phase, 6)
      const line = await until(
        () => peer!.lines.slice(from).find((entry) => entry.impulse?.channel === 0),
        `the click on ${phase}`,
      )
      const impulse = line.impulse as PeerImpulse
      expect(impulse.value).toBeGreaterThan(0.8)
      expect(impulse.phase).toBeDefined()
      const gap = phaseGap(impulse.phase as number, phase)
      const after = await page.evaluate(() => window.nativeHarness!.linkState())
      const outputMoved = Math.abs(after.outputOffsetMs - click.outputOffsetMs)
      const clockMoved = Math.abs(after.clockOffsetMicros - click.clockOffsetMicros) / 1000
      const steady = outputMoved < 0.5 && clockMoved < 0.5
      log.push(
        `${phase}: ${(gap * 500).toFixed(3)} ms off` +
          (steady ? '' : ` (the output moved ${outputMoved.toFixed(2)} ms; played again)`),
      )
      if (steady) gaps.push(gap)
    }
    console.log(`link audio, clicks against the beat at 120 bpm:\n  ${log.join('\n  ')}`)
    test.info().annotations.push({ type: 'link-audio', description: log.join('; ') })
    expect(gaps).toHaveLength(phases.length)
    // Within a millisecond at 120 bpm (0.002 beats).
    for (const gap of gaps) expect(gap).toBeLessThan(0.002)
  })

  test('nothing went wrong on the page', () => {
    expect(errors).toEqual([])
  })
})
