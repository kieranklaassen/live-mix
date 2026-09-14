// Playground smoke (U40): the built playground (`pnpm playground:build`) in a
// real browser, driven the way a person drives it — load on the mock demo,
// switch to real audio from a click, play, look at a device chain, bounce the
// score offline, call agent tools, launch a scene on the grid — and fail on
// any page error, console error or failed load. Screenshots of the mixer, the
// device chain, the agent console, the grid and the page land in
// playground/screenshots/ (gitignored; the CI job uploads them). Skipped when
// the playground is not built. `pnpm playground:smoke` runs just this spec.

import { access, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { expect, test, type Page } from '@playwright/test'

import { collectPageErrors } from './page-errors'

const built = fileURLToPath(new URL('../../playground/dist/index.html', import.meta.url))
const screenshots = process.env.PLAYGROUND_SCREENSHOTS
  ? process.env.PLAYGROUND_SCREENSHOTS
  : fileURLToPath(new URL('../../playground/screenshots/', import.meta.url))

const shot = (name: string): string => `${screenshots.replace(/\/?$/, '/')}${name}.png`

/** `window.playground.demo` is the running demo the page exposes for this. */
function inDemo<T>(page: Page, body: string): Promise<T> {
  return page.evaluate<T>(`(() => { const demo = window.playground.demo; ${body} })()`)
}

test.describe('playground smoke', () => {
  test.beforeAll(async () => {
    try {
      await access(built)
    } catch {
      test.skip(true, 'playground not built (run pnpm playground:build)')
    }
    await mkdir(screenshots, { recursive: true })
  })

  test('loads without errors and mounts the app', async ({ page }) => {
    const errors = collectPageErrors(page)
    await page.goto('/playground/dist/index.html')
    await expect(page).toHaveTitle(/live-mix playground/)
    await expect(page.locator('#root')).not.toBeEmpty()
    await expect(page.getByTestId('mixer')).toBeVisible()
    const strips = await page.locator('[data-testid="mixer"] .lm-strip').count()
    expect(strips, '4 tracks + group + return + master').toBeGreaterThanOrEqual(6)
    expect(errors).toEqual([])
  })

  test('plays real audio through WASM devices, bounces, follows the agent and the grid', async ({
    page,
  }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 2400 })
    const errors = collectPageErrors(page)
    await page.goto('/playground/dist/index.html')
    await expect(page.getByTestId('mixer')).toBeVisible()

    // Real audio from a click — the gesture browsers want before audio starts.
    await page.getByTestId('mode-toggle').click()
    await page.waitForFunction(() => window.playground?.demo?.mode === 'live', undefined, {
      timeout: 30_000,
    })
    const live = await inDemo<{ state: string; hall: string; devices: number }>(
      page,
      `return { state: demo.engine.context.state, hall: demo.returns[0].device.id, devices: demo.engine.devices.list().length }`,
    )
    expect(live.state).toBe('running')
    expect(live.hall, 'the hall return is the Dattorro plate (WASM)').toBe('dattorro')
    expect(live.devices).toBeGreaterThanOrEqual(17)

    // Play; signal reaches the master meter through the worklets.
    await page.getByTestId('transport-play').click()
    await expect(page.getByTestId('transport-state')).toContainText('playing')
    await page.waitForFunction(
      () => window.playground.demo.engine.master.level() > 0.001,
      undefined,
      {
        timeout: 10_000,
      },
    )
    await page.waitForTimeout(1200)
    await page.getByTestId('mixer').screenshot({ path: shot('mixer') })

    // The keys chain: a node device (eq3) and a WASM device (stereo-widener).
    await page.locator('[data-testid="mixer-keys"] .lm-strip__name').click()
    await expect(page.locator('[data-testid="devices"] h2')).toContainText('keys')
    await expect(page.locator('[data-testid="chain"] .lm-device')).toHaveCount(2)
    await page.getByTestId('devices').screenshot({ path: shot('devices') })

    // The offline bounce of the same score (U33), WASM and all.
    await page.getByTestId('render-button').click()
    await expect(page.getByTestId('render')).toHaveAttribute('data-status', /done|failed/, {
      timeout: 90_000,
    })
    const renderText = (await page.getByTestId('render-status').textContent()) ?? ''
    expect(await page.getByTestId('render').getAttribute('data-status'), renderText).toBe('done')
    const peak = /peak (-?[\d.]+) dBFS/.exec(renderText)
    expect(peak, 'the bounce reports a peak').not.toBeNull()
    expect(Number(peak?.[1]), 'the bounce is not silence').toBeGreaterThan(-40)

    // The agent console (U29): a tool call edits the score, the engine follows.
    const before = await inDemo<number>(page, `return demo.engine.track('pad').strip.level`)
    await page.getByTestId('agent-quick-music-down').click()
    await expect(page.getByTestId('agent-result')).toHaveAttribute('data-ok', 'true')
    await page.waitForFunction(
      () => Math.abs(window.playground.demo.engine.track('pad').strip.level - 0.4) < 1e-6,
    )
    expect(before).not.toBeCloseTo(0.4)
    // AE2: an out-of-range request is clamped, noted and applied.
    const clamped = await inDemo<{ ok: boolean; rails: string[]; level: unknown }>(
      page,
      `const r = demo.agent.call('set_music_volume', { level: 3 }); return { ok: r.ok, rails: r.rails.map((n) => n.rail), level: r.ok ? r.result.level : null }`,
    )
    expect(clamped).toEqual({ ok: true, rails: ['range'], level: 1 })
    await page.getByTestId('agent-quick-undo').click()
    await page.waitForFunction(
      () => Math.abs(window.playground.demo.engine.track('pad').strip.level - 0.4) < 1e-6,
    )
    await page.getByTestId('agent').screenshot({ path: shot('agent') })

    // The session grid (U31): launch a scene on the next bar; its slots queue,
    // then play as arrangement clips on their tracks.
    await page.getByTestId('grid-scene-groove').click()
    await expect(page.getByTestId('grid-slot-groove-drums')).toHaveAttribute(
      'data-state',
      /queued|playing/,
    )
    await expect(page.getByTestId('grid-slot-groove-drums')).toHaveAttribute(
      'data-state',
      'playing',
      {
        timeout: 10_000,
      },
    )
    const placed = await inDemo<number>(
      page,
      `return demo.document.score.tracks.find((t) => t.id === 'drums').clips.filter((c) => c.id.startsWith('groove-drums@')).length`,
    )
    expect(placed, 'the launch is a clip on the drums lane').toBe(1)
    await page.getByTestId('grid-section').screenshot({ path: shot('grid') })
    await page.getByTestId('grid-stop-all').click()
    await expect(page.getByTestId('grid-slot-groove-drums')).toHaveAttribute(
      'data-state',
      'stopped',
      {
        timeout: 10_000,
      },
    )

    await page.screenshot({ path: shot('page'), fullPage: true })
    await inDemo(page, `demo.engine.transport.stop()`)
    expect(errors).toEqual([])
  })
})

declare global {
  interface Window {
    playground: {
      /** Null only while the page switches demo mode. */
      demo: {
        mode: string
        engine: {
          context: { state: string }
          master: { level(): number }
          devices: { list(): unknown[] }
          track(name: string): { strip: { level: number } }
          transport: { stop(): void }
        }
        returns: { device: { id: string } }[]
        agent: { call(name: string, args: Record<string, unknown>): unknown }
        document: { score: { tracks: { id: string; clips: { id: string }[] }[] } }
      }
    }
  }
}
