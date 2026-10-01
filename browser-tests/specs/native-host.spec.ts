// U39 in a real browser: a VST3 plug-in in the plug-in host, played through a
// real AudioContext by the bridge worklet and the pump worker, and rendered
// through a real OfflineAudioContext. The plug-ins are the host's own two
// test plug-ins, so nothing depends on what the machine has installed.
//
// Needs the host built (`pnpm host:build`); without it the tests skip, unless
// LIVE_MIX_REQUIRE_PLUGIN_HOST is set (the CI job that builds the host sets it).

import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { expect, test, type Page } from '@playwright/test'

import {
  pluginHostBinaryPath,
  pluginHostTestPluginsDir,
  startPluginHost,
  type RunningPluginHost,
} from '../../native/shell.mjs'
import type {
  HostLossResult,
  InstrumentOfflineResult,
  InstrumentResult,
  LiveResult,
  NativeHarnessArgs,
  OfflineResult,
} from '../harness/native'
import { collectPageErrors } from './page-errors'

const buildDir = resolve(process.env.LIVE_MIX_PLUGIN_HOST_BUILD ?? 'tmp/plugin-host')
const binary = pluginHostBinaryPath(buildDir)
const required = Boolean(process.env.LIVE_MIX_REQUIRE_PLUGIN_HOST)
const wrapper = process.platform === 'linux' && !process.env.DISPLAY ? ['xvfb-run', '-a'] : []

/** What the test gain plug-in delays by and reports as its own latency. */
const PLUGIN_LATENCY = 64

let host: RunningPluginHost | undefined
let dataDir: string | undefined

test.describe('hosted plug-ins', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!required && !existsSync(binary), 'the plug-in host is not built: pnpm host:build')

  test.beforeAll(async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'live-mix-host-browser-'))
    host = await startPluginHost({ binary, dataDir, wrapper })
  })

  test.afterAll(async () => {
    await host?.stop()
    if (dataDir) rmSync(dataDir, { recursive: true, force: true })
  })

  async function harness(page: Page): Promise<NativeHarnessArgs> {
    if (!host) throw new Error('the plug-in host is not running')
    await page.goto('/browser-tests/harness/native.html')
    await page.waitForFunction(() => window.nativeHarness !== undefined)
    return {
      host: { url: host.url, token: host.token },
      pluginDir: pluginHostTestPluginsDir(buildDir),
    }
  }

  test('a plug-in plays through a live context, sample for sample, at its reported latency', async ({
    page,
  }) => {
    const errors = collectPageErrors(page)
    const args = await harness(page)
    const result: LiveResult = await page.evaluate((a) => window.nativeHarness!.live(a), args)

    expect(result.isolated).toBe(true)
    expect(result.status).toBe('running')
    // The default budget follows the audio device: its buffer plus 512 frames.
    const deviceFrames = Math.ceil(Math.round(result.baseLatency * 48000) / 128) * 128
    expect(result.bridgeLatency).toBe(Math.max(512, deviceFrames + 512))
    expect(result.reportedLatency).toBe(result.bridgeLatency + PLUGIN_LATENCY)
    expect(result.measuredLag).toBe(result.reportedLatency)
    // A late answer costs one quantum of silence and never shifts the stream:
    // a loaded CI machine may drop a few, nothing else may differ.
    expect(result.underruns).toBeLessThan(40)
    expect(result.mismatched).toBeLessThanOrEqual(result.underruns * 128)

    expect(result.paramNames).toEqual(['Gain', 'Mode'])
    expect(result.halved).toBeCloseTo(0.5, 3)
    expect(result.gainText).toMatch(/^0\.5/)
    expect(errors).toEqual([])
  })

  test('an offline render through three instances is bit-exact and never late', async ({
    page,
  }) => {
    const errors = collectPageErrors(page)
    const args = await harness(page)
    const result: OfflineResult = await page.evaluate((a) => window.nativeHarness!.offline(a), args)

    expect(result.latencies).toEqual([512, 256, 1024])
    expect(result.lag).toBe(512 + 256 + 1024 + 3 * PLUGIN_LATENCY)
    expect(result.underruns).toEqual([0, 0, 0])
    expect(result.maxError).toBe(0)
    expect(result.head).toBe(0)
    expect(errors).toEqual([])
  })

  test('an instrument plays the note it is sent and stops', async ({ page }) => {
    const errors = collectPageErrors(page)
    const args = await harness(page)
    const result: InstrumentResult = await page.evaluate(
      (a) => window.nativeHarness!.instrument(a),
      args,
    )

    expect(result.isInstrument).toBe(true)
    // A4: 440 Hz crosses zero 880 times a second.
    expect(result.crossingsPerSec).toBeGreaterThan(860)
    expect(result.crossingsPerSec).toBeLessThan(900)
    // Full velocity at the test synth's default level of a half.
    expect(result.heldPeak).toBeCloseTo(0.5, 2)
    expect(result.releasedPeak).toBe(0)
    expect(errors).toEqual([])
  })

  test('an instrument in an offline render takes each note on the block it was sent at', async ({
    page,
  }) => {
    const errors = collectPageErrors(page)
    const args = await harness(page)
    // Twice: a file must come out the same every time it is rendered.
    for (let pass = 0; pass < 2; pass += 1) {
      const result: InstrumentOfflineResult = await page.evaluate(
        (a) => window.nativeHarness!.instrumentOffline(a),
        args,
      )
      expect(result.underruns).toBe(0)
      expect(result.peak).toBeCloseTo(0.5, 2)
      // A sine starts at zero, so its first frame that sounds is the second.
      expect(result.firstSound).toBe(result.lag + 1)
      expect(result.gapStart).toBe(result.lag + result.offFrame)
      expect(result.gapEnd).toBe(result.lag + result.onFrame + 1)
    }
    expect(errors).toEqual([])
  })

  // Last: it ends the host.
  test('when the host goes away the device stops and passes the dry signal', async ({ page }) => {
    const args = await harness(page)
    await page.exposeFunction('stopPluginHost', async () => {
      await host?.stop()
    })
    const result: HostLossResult = await page.evaluate(
      (a) => window.nativeHarness!.hostLoss(a),
      args,
    )

    expect(result.before).toBe('running')
    expect(result.after).toBe('stopped')
    expect(result.dryPeak).toBeCloseTo(0.5, 3)
  })
})
