// The convolution lesson leans on the browser's own convolver, which is what the engine plays
// its room through. A ConvolverNode does not run in Node, so what the lesson says of it is held
// here: it adds no delay, a sound rings on for the impulse's length, and the lab's convolution
// with the kit's transform is the same convolution.
import { expect, test } from '@playwright/test'
import { labReady, renders, watch } from './support.ts'

const LESSON = 'lessons/15-convolution-reverb/'

/** In the page: seeded noise through a ConvolverNode holding `impulse`, with `normalize` off. */
async function throughConvolver({
  impulse,
  frames,
  ring,
}: {
  impulse: number[]
  frames: number
  ring: number
}): Promise<{ input: number[]; output: number[] }> {
  let state = 0x2545f491
  const input = new Float32Array(frames)
  for (let i = 0; i < frames; i += 1) {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    input[i] = ((state >>> 0) / 0xffffffff) * 2 - 1
  }
  const context = new OfflineAudioContext(1, frames + ring, 48_000)
  const sound = context.createBuffer(1, frames, 48_000)
  sound.copyToChannel(input, 0)
  const room = context.createBuffer(1, impulse.length, 48_000)
  room.copyToChannel(new Float32Array(impulse), 0)
  const source = context.createBufferSource()
  source.buffer = sound
  const convolver = context.createConvolver()
  convolver.normalize = false
  convolver.buffer = room
  source.connect(convolver).connect(context.destination)
  source.start()
  const rendered = await context.startRendering()
  return { input: [...input], output: [...rendered.getChannelData(0)] }
}

test.describe('the browser convolver the engine uses', () => {
  test('returns its input at the same sample for an impulse of one unit sample, below −80 dB (claim unit-impulse)', async ({
    page,
  }) => {
    await page.goto(LESSON)
    const { input, output } = await page.evaluate(throughConvolver, {
      impulse: [1],
      frames: 4800,
      ring: 0,
    })
    let difference = 0
    let reference = 0
    for (let i = 0; i < input.length; i += 1) {
      difference += (output[i]! - input[i]!) ** 2
      reference += input[i]! ** 2
    }
    expect(10 * Math.log10(Math.max(difference / reference, 1e-14))).toBeLessThan(-80)
  })

  test("rings on after the sound stops for the impulse's length, less one sample (claim rings-on)", async ({
    page,
  }) => {
    await page.goto(LESSON)
    // An impulse of 1,000 samples, none of them zero, and a sound of 4,800 with none zero either.
    const impulse = Array.from({ length: 1000 }, (_, k) => (k % 2 ? -0.5 : 0.5) * 0.999 ** k)
    const { input, output } = await page.evaluate(throughConvolver, {
      impulse,
      frames: 4800,
      ring: 2000,
    })
    expect(output.every((v) => Number.isFinite(v))).toBe(true)
    let last = output.length - 1
    // The convolver works by transforms in blocks, whose rounding leaves a little under a
    // millionth after the true end: the last sample above that is the end.
    while (last > 0 && Math.abs(output[last]!) < 1e-5) last -= 1
    // The sound's last sample is at 4,799; the impulse's last tap is 999 later.
    expect(last).toBe(input.length + impulse.length - 2)
  })
})

test.describe('the convolution lesson', () => {
  test("does the browser convolver's convolution with the kit's transform, below −80 dB (claim browser-convolver)", async ({
    page,
  }) => {
    const problems = watch(page)
    await page.goto(LESSON)
    await labReady(page)
    const check = page.locator('[data-convolver], [data-convolver-failed]')
    await page.locator('.check').last().scrollIntoViewIfNeeded()
    await expect(check).toBeVisible({ timeout: 30_000 })
    const read = async () =>
      Number(await page.locator('[data-convolver]').getAttribute('data-convolver'))
    const first = await read()
    console.log(`the lab's convolution against the browser's: ${first} dB`)
    expect(first).toBeLessThan(-80)

    // On another room, and with only part of the impulse in use: checked again.
    const count = await renders(page)
    const decay = page.locator('#control-decay').first()
    await decay.focus()
    await decay.press('Home')
    await expect.poll(() => renders(page)).toBeGreaterThan(count)
    await expect.poll(read, { timeout: 30_000 }).not.toBe(first)
    expect(await read()).toBeLessThan(-80)
    expect(problems).toEqual([])
  })
})
