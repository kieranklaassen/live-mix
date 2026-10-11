// The studio look in a real browser: the plate bench of the built playground
// (`pnpm playground:build`) with `?look=studio`. The unit tests stand on a
// WebGL that takes every call, and a shader that does not compile leaves the
// plates flat without a word, so this is where the shader is really compiled
// and really drawn: every plate carries the look's mark, its photograph has
// paint where paint is and a knob where a knob is, and the page says nothing.
// Skipped when the playground is not built.

import { access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

import { collectPageErrors } from './page-errors'

const built = fileURLToPath(new URL('../../playground/dist/plates.html', import.meta.url))

// A headless browser on a machine with no graphics card draws WebGL in
// software only when it is told it may.
test.use({
  launchOptions: {
    executablePath: process.env.LIVE_MIX_BROWSER_PATH,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  },
})

interface Seen {
  id: string | null
  look: string | null
  /** The paint the photograph says it was taken in, and what is under the plate's name. */
  paint: number[] | null
  foot: number[]
  /** How many different colours lie along a line through the first knob, and along one under the name. */
  acrossKnob: number
  acrossFoot: number
}

test.describe('the studio look', () => {
  test.beforeAll(async () => {
    try {
      await access(built)
    } catch {
      test.skip(true, 'playground not built (run pnpm playground:build)')
    }
  })

  test('compiles its shader and photographs every plate on the bench', async ({ page }) => {
    const errors = collectPageErrors(page)
    // One plate of each of the four caps, upright and at rest.
    await page.goto(
      '/playground/dist/plates.html?look=studio&upright=1&still=1&only=filter,tape-echo,saturator,shimmer,tremolo,chorus',
    )
    await page.waitForFunction(() => (window as { plates?: { ready?: boolean } }).plates?.ready)
    const webgl = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl'))
    // Without WebGL the plates are flat by design; in CI the browser is given it above.
    if (!webgl) {
      expect(process.env.CI, 'CI has WebGL').toBeFalsy()
      test.skip(true, 'this browser has no WebGL')
    }
    const plates = page.locator('.lm-plate')
    await expect(plates).toHaveCount(6)
    await expect(page.locator('.lm-plate[data-lm-look="studio"]')).toHaveCount(6)

    const seen = await page.evaluate<Seen[]>(() =>
      [...document.querySelectorAll<HTMLElement>('.lm-plate')].map((plate) => {
        const face = plate.querySelector<HTMLCanvasElement>(':scope > .lm-plate__studio')!
        const k = face.width / plate.offsetWidth
        const at = plate.getBoundingClientRect()
        const middle = (part: Element): [number, number] => {
          const box = part.getBoundingClientRect()
          return [
            Math.round((box.left + box.width / 2 - at.left) * k),
            Math.round((box.top + box.height / 2 - at.top) * k),
          ]
        }
        const ctx = face.getContext('2d')!
        const colours = (x: number, y: number, wide: number): number => {
          const row = ctx.getImageData(Math.round(x - wide / 2), y, Math.round(wide), 1).data
          const found = new Set<number>()
          for (let i = 0; i < row.length; i += 4) {
            found.add(((row[i] >> 3) << 10) | ((row[i + 1] >> 3) << 5) | (row[i + 2] >> 3))
          }
          return found.size
        }
        const [kx, ky] = middle(plate.querySelector('.lm-plate__knob .lm-knob__control')!)
        const [nx, ny] = middle(plate.querySelector('.lm-plate__name')!)
        const paint = /rgb\((\d+)[ ,]+(\d+)[ ,]+(\d+)\)/.exec(
          plate.style.getPropertyValue('--lm-studio-paint'),
        )
        return {
          id: plate.getAttribute('data-lm-device'),
          look: plate.getAttribute('data-lm-look'),
          paint: paint ? paint.slice(1).map(Number) : null,
          foot: [...ctx.getImageData(nx, ny, 1, 1).data],
          acrossKnob: colours(kx, ky, 30 * k),
          acrossFoot: colours(nx, ny, 30 * k),
        }
      }),
    )
    for (const plate of seen) {
      const where = `${plate.id ?? 'a plate'}`
      expect(plate.look, where).toBe('studio')
      expect(plate.paint, `${where} says its paint`).not.toBeNull()
      // Under the name there is paint and nothing else: the plate's own colour, lit, and not see-through.
      expect(plate.foot[3], `${where} is painted under its name`).toBe(255)
      plate.paint!.forEach((channel, index) => {
        expect(
          Math.abs(plate.foot[index] - channel),
          `${where} paint, channel ${index}`,
        ).toBeLessThan(48)
      })
      // A knob is a turned and lit thing: far more colours cross it than cross bare paint.
      expect(plate.acrossKnob, `${where} has a knob drawn`).toBeGreaterThan(12)
      expect(plate.acrossKnob, `${where} knob against its paint`).toBeGreaterThan(plate.acrossFoot)
    }
    expect(errors).toEqual([])
  })
})
