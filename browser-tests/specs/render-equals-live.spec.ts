// AE6 in a real browser: the scripted session rendered through the real
// engine, worklets and WASM on an OfflineAudioContext must (1) tell its graph
// exactly what the Node mocks record for the same session — the mock golden
// the Vitest suite already asserts against — and (2) sound like the same
// session played live and captured through the recorder worklet, within a
// loudness and spectral tolerance.

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'
import { ParamLane, renderOffline } from '@kieranklaassen/live-mix'
import { createDattorroReverb } from '@kieranklaassen/live-mix/dsp'
import {
  createMockOfflineContext,
  type MockAudioContext,
  type MockOfflineAudioContext,
  type ScheduleSnapshot,
} from '@kieranklaassen/live-mix/testing'

import { compareFingerprints } from '../harness/fingerprint'
import type { HarnessResult } from '../harness/main'
import { DEFAULT_SESSION, buildSession } from '../session'
import { collectPageErrors } from './page-errors'

const wasmPath = fileURLToPath(new URL('../../dist/wasm/dattorro.wasm', import.meta.url))

/** The same session on the recording mocks: what the Vitest goldens assert against. */
async function mockGolden(): Promise<ScheduleSnapshot> {
  const wasm = await readFile(wasmPath)
  let ctx: MockOfflineAudioContext | null = null
  await renderOffline({
    durationSec: DEFAULT_SESSION.durationSec,
    sampleRate: DEFAULT_SESSION.sampleRate,
    createContext: (options) => {
      ctx = createMockOfflineContext(options)
      return ctx as unknown as OfflineAudioContext
    },
    build: (engine) =>
      buildSession(engine, DEFAULT_SESSION, {
        createReverb: (context) =>
          createDattorroReverb(context, {
            params: { mix: 0.3, decay: 0.6 },
            wasm: new Uint8Array(wasm),
            createNode: (c, name, options) =>
              (c as unknown as MockAudioContext).createWorkletNode(
                name,
                options,
              ) as unknown as AudioWorkletNode,
          }),
        createLane: (options) => new ParamLane(options),
      }),
  })
  if (!ctx) throw new Error('no mock context created')
  return (ctx as MockOfflineAudioContext).scheduleSnapshot()
}

/** Numbers rounded (6 places: float32 curves cross as JSON) and typed arrays flattened. */
function canonical(snapshot: ScheduleSnapshot): unknown {
  const round = (value: unknown): unknown => {
    if (typeof value === 'number') return Number(value.toFixed(6))
    if (value instanceof Float32Array) return Array.from(value).map(round)
    if (Array.isArray(value)) return value.map(round)
    return value
  }
  return {
    sources: snapshot.sources.map((source) => ({
      start: round(source.start),
      stop: round(source.stop),
      loop: source.loop,
      bufferLength: source.bufferLength,
    })),
    params: [...snapshot.params]
      .map((entry) => ({
        node: entry.node,
        param: entry.param,
        events: entry.events.map((event) => ({ method: event.method, args: round(event.args) })),
      }))
      .sort((a, b) => `${a.node}/${a.param}`.localeCompare(`${b.node}/${b.param}`)),
  }
}

test.describe('real-audio render-equals-live', () => {
  let result: HarnessResult

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/index.html')
    await page.waitForSelector('body[data-harness="ready"]')
    result = await page.evaluate(() => window.liveMixHarness.run())
    expect(errors, 'no page errors during the harness run').toEqual([])
    await page.close()
  })

  test('the offline render tells the real graph exactly what the mock golden records', async () => {
    const golden = await mockGolden()
    expect(result.offline.events.sources.length).toBeGreaterThan(0)
    expect(canonical(result.offline.events)).toEqual(canonical(golden))
  })

  test('the offline render carries audio through the real worklets and WASM', () => {
    const { fingerprint } = result.offline
    expect(fingerprint.frames).toBe(DEFAULT_SESSION.durationSec * DEFAULT_SESSION.sampleRate)
    expect(fingerprint.peakDb).toBeGreaterThan(-20)
    expect(fingerprint.rmsDb).toBeGreaterThan(-40)
    // The 220/330 Hz tones live in the low-mid bands; those must carry energy.
    const loudBands = fingerprint.bandsDb.filter((db) => db > -60)
    expect(loudBands.length).toBeGreaterThanOrEqual(3)
  })

  test('the live capture matches the offline render within loudness and spectral tolerance', () => {
    // Gate 25 dB under the loudest block/band: the Dattorro's free-running
    // modulation makes the quiet reverb tail differ between a context that
    // started at 0 and one already running, and that is not what this asserts.
    const diff = compareFingerprints(result.offline.fingerprint, result.live.fingerprint, -25)
    test.info().annotations.push(
      { type: 'offline', description: JSON.stringify(result.offline.fingerprint) },
      { type: 'live', description: JSON.stringify(result.live.fingerprint) },
      { type: 'diff', description: JSON.stringify(diff) },
      {
        type: 'context',
        description: JSON.stringify({
          userAgent: result.userAgent,
          baseLatency: result.live.baseLatency,
          outputLatency: result.live.outputLatency,
        }),
      },
    )
    expect(result.live.fingerprint.frames).toBe(result.offline.fingerprint.frames)
    expect(diff.rmsDb).toBeLessThan(1.5)
    expect(diff.peakDb).toBeLessThan(3)
    expect(diff.envelopeDb).toBeLessThan(3)
    expect(diff.bandsDb).toBeLessThan(3)
  })
})
