// Every lesson, opened in a browser. Runs on whatever lessons exist, and takes whatever a lesson
// has: no case names a lesson's own taps, controls or sets.
//
// A lesson in the long shape: it opens with no error and reads through (the contents list, the
// predictions, every figure, a control by the keys and not by the wheel); it fits a narrow
// window; play starts the sound and each stage can be heard; a card plays its set and is lit
// alone, a second takes over, and "back" puts the page back; the build shows a step at a time,
// sounds and steps forward. A lesson not yet rewritten keeps the cases it had. Either kind ends
// with the real device's plate, and says what it has to say with JavaScript off.
import fs from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import {
  farEnd,
  turnToFarEnd,
  isLong,
  labReady,
  lessonIds,
  lessonSets,
  meter,
  openPlate,
  overflow,
  pictures,
  press,
  renders,
  scrolled,
  scrollThrough,
  sounds,
  valueOf,
  watch,
  wordCount,
} from './support.ts'

/** The cases of a lesson in the long shape: nine parts under a hero. */
function longCases(lesson: string) {
  test('opens and reads through: the contents lead to every part, a prediction opens, every figure draws, a control moves by the keys and not by the wheel', async ({
    page,
  }) => {
    const problems = watch(page)
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`lessons/${lesson}/`)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('article.lesson[data-long]')).toBeVisible()
    await labReady(page)
    // Nothing sounds until the reader starts it.
    expect(await meter(page)).toBe(0)

    // The contents list names the parts the page has, in the page's order, and a link goes there.
    const parts = await page
      .locator('section.part[data-part]')
      .evaluateAll((sections) => sections.map((section) => `#${section.id}`))
    expect(parts.length).toBeGreaterThan(1)
    const links = page.locator('.lesson-contents a')
    expect(await links.evaluateAll((all) => all.map((link) => link.getAttribute('href')))).toEqual(
      parts,
    )
    await links.last().click()
    await expect(page.locator(`section.part${parts.at(-1)}`)).toBeInViewport()

    // A prediction keeps its answer shut until the reader asks for it.
    const predictions = page.locator('.predict[data-predict]')
    const asked = await predictions.count()
    expect(asked).toBeGreaterThan(0)
    for (let i = 0; i < asked; i += 1) {
      const answer = predictions.nth(i).locator('details')
      await expect(answer).not.toHaveAttribute('open')
      await expect(answer.locator('.predict-answer')).toBeHidden()
      await answer.locator('summary').click()
      await expect(answer).toHaveAttribute('open')
      await expect(answer.locator('.predict-answer')).toBeVisible()
    }

    // Every figure that shows has drawn. A step of the build that is not the one shown is held
    // by the build's own case.
    await scrollThrough(page)
    expect(await page.locator('[data-figure]:visible').count()).toBeGreaterThan(1)
    await expect(page.locator('[data-figure]:visible:not([data-drawn])')).toHaveCount(0)

    // A ranged control is a knob, found by its role. A key sends it to the far end of its
    // range: the lab renders again and at least one picture is another picture.
    const controls = page.locator('.dials')
    const knob = controls.getByRole('slider').first()
    if ((await knob.count()) > 0) {
      const before = await pictures(page)
      const count = await renders(page)
      const far = { value: await turnToFarEnd(knob) }
      await expect.poll(() => renders(page)).toBeGreaterThan(count)
      await expect
        .poll(async () => (await pictures(page)).some((one, i) => one !== before[i]))
        .toBe(true)

      // The wheel, turned with the pointer on the knob, scrolls the page and leaves the knob.
      await knob.evaluate((element) =>
        element.scrollIntoView({ block: 'center', behavior: 'instant' }),
      )
      const box = (await knob.boundingBox())!
      const at = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
      await page.mouse.move(at.x, at.y)
      expect(
        await knob.evaluate(
          (element, point) => element.contains(document.elementFromPoint(point.x, point.y)),
          at,
        ),
        'the pointer is on the knob',
      ).toBe(true)
      const top = await scrolled(page)
      await page.mouse.wheel(0, 240)
      await expect.poll(() => scrolled(page)).toBeGreaterThan(top)
      expect(await valueOf(knob)).toBe(far.value)
    } else {
      // A lesson whose controls are all choices: the arrow keys move the choice along.
      const count = await renders(page)
      const chosen = controls.getByRole('radiogroup').first().getByRole('radio', { checked: true })
      const name = (await chosen.textContent()) ?? ''
      await chosen.focus()
      await chosen.press('ArrowRight')
      await expect(chosen).not.toHaveText(name)
      await expect.poll(() => renders(page)).toBeGreaterThan(count)
    }

    // Nothing sticks out sideways; open, the plate scrolls in its own box and widens nothing.
    expect(await overflow(page)).toBe(0)
    await openPlate(page)
    expect(await overflow(page)).toBe(0)
    expect(problems).toEqual([])
  })

  test('opens with no problem in a window 390 px wide, and nothing sticks out sideways', async ({
    page,
  }) => {
    const problems = watch(page)
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto(`lessons/${lesson}/`)
    await labReady(page)
    await scrollThrough(page)
    await expect(page.locator('[data-figure]:visible:not([data-drawn])')).toHaveCount(0)
    expect(await overflow(page)).toBe(0)
    await openPlate(page)
    expect(await overflow(page)).toBe(0)
    expect(problems).toEqual([])
  })

  test('plays on a click, and every stage that is sound can be heard', async ({ page }) => {
    const problems = watch(page)
    await page.goto(`lessons/${lesson}/`)
    await labReady(page)
    expect(await meter(page)).toBe(0)

    await page.locator('.playbar-play').click()
    await expect(page.locator('.playbar-play[data-playing]')).toBeVisible()
    await sounds(page)

    // Every stage says where it comes from, and is either heard or says what it is.
    const stages = page.locator('.stage-block')
    const count = await stages.count()
    expect(count).toBeGreaterThan(1)
    const origins = await page
      .locator('.stage-block > .stage-block-origin')
      .evaluateAll((all) => all.map((one) => one.textContent?.trim() ?? ''))
    expect(origins).toHaveLength(count)
    expect(origins.filter((origin) => origin === '')).toEqual([])
    const heard = page.locator('.stage-block:has(.stage-block-listen)')
    const said = page.locator('.stage-block:has(.stage-block-kind)')
    expect((await heard.count()) + (await said.count())).toBe(count)

    for (let i = 0; i < (await heard.count()); i += 1) {
      const button = heard.nth(i).locator('.stage-block-listen button')
      // The page opens on the lab's last sound: a stage that reads that tap is lit already,
      // and a press would put it out.
      if ((await button.getAttribute('aria-pressed')) !== 'true') await press(button)
      await expect(button).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('#lab-stage')).toHaveValue(
        (await button.getAttribute('data-tap')) ?? '',
      )
      await expect(page.locator('.stage-block-listen button[aria-pressed="true"]')).toHaveCount(1)
    }
    // A stage that is not sound has no button to hear it.
    await expect(said.locator('.stage-block-listen button')).toHaveCount(0)
    for (const words of await said.locator('.stage-block-kind').allTextContents()) {
      expect(words.trim()).not.toBe('')
    }

    await page.locator('.playbar-play').click()
    await expect(page.locator('.playbar-play[data-playing]')).toHaveCount(0)
    expect(problems).toEqual([])
  })

  test('a card plays its set and is the only one lit, a second card takes over, and back puts the page back', async ({
    page,
  }) => {
    const problems = watch(page)
    const sets = lessonSets(lesson)
    await page.goto(`lessons/${lesson}/`)
    await labReady(page)

    const cards = page.locator('.lesson-card[data-set]')
    expect(await cards.count()).toBeGreaterThan(1)
    const lit = page.locator('button[aria-pressed="true"]')
    const bar = page.locator('.playbar')
    /** A card, the button that plays it, and the set its lesson's settings file gives it. */
    const card = async (nth: number) => {
      const one = cards.nth(nth)
      const set = sets[(await one.getAttribute('data-set')) ?? '']
      expect(set, 'the card names a set of the settings file').toBeDefined()
      return { button: one.locator('button[data-card]'), set: set! }
    }

    // Before any card the reader moves a control and, where there is one, picks another sound:
    // that, and not the lesson's start, is what "back" must bring back.
    const knob = page.locator('.dials').getByRole('slider').first()
    const turns = (await knob.count()) > 0
    let control = ''
    let start = 0
    let moved = 0
    if (turns) {
      control =
        (await knob.locator('xpath=ancestor::*[@data-control][1]').getAttribute('data-control')) ??
        ''
      start = await valueOf(knob)
      moved = await turnToFarEnd(knob)
    }
    const source = page.locator('#lab-source')
    const picks = (await source.count()) > 0
    const sound = page.locator('.sounds-choices').getByRole('radio')
    if (picks && (await sound.count()) > 1) {
      await sound.nth(1).click()
      await expect(sound.nth(1)).toHaveAttribute('aria-checked', 'true')
    }
    const picked = picks ? await source.inputValue() : ''
    expect(await meter(page)).toBe(0)

    /** The card is the one lit, the bar names it, and the page is at its set. */
    const plays = async (one: Awaited<ReturnType<typeof card>>, from: string) => {
      await expect(one.button).toHaveAttribute('aria-pressed', 'true')
      await expect(lit).toHaveCount(1)
      await expect(bar).toHaveAttribute(
        'data-audition',
        (await one.button.getAttribute('data-card')) ?? '',
      )
      await expect(bar.locator('.playbar-play')).toHaveAccessibleName(
        new RegExp(` · ${escaped(one.set.label)}$`),
      )
      // A set is complete: a control it does not name is back at the lesson's start.
      if (turns)
        await expect.poll(() => valueOf(knob)).toBeCloseTo(one.set.values?.[control] ?? start, 5)
      // It may name a sound; when it names none, the page stays on the one it was on.
      if (picks) await expect(source).toHaveValue(one.set.source ?? from)
    }

    // The first card, from silence: it sounds, and the way back is on offer.
    const first = await card(0)
    await press(first.button)
    await sounds(page)
    await plays(first, picked)
    await expect(bar.locator('.playbar-back')).toBeVisible()

    // A second card takes over: the first goes dark, and the sound goes on.
    const second = await card(1)
    await press(second.button)
    await plays(second, first.set.source ?? picked)
    await expect(first.button).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('.playbar-play[data-playing]')).toBeVisible()
    await sounds(page)

    // Back: the control and the sound from before the first card, no card lit, no way back left.
    await bar.locator('.playbar-back').click()
    if (turns) await expect.poll(() => valueOf(knob)).toBe(moved)
    if (picks) await expect(source).toHaveValue(picked)
    await expect(page.locator('button[data-card][aria-pressed="true"]')).toHaveCount(0)
    await expect(bar).not.toHaveAttribute('data-audition')
    await expect(bar.locator('.playbar-back')).toHaveCount(0)

    await page.locator('.playbar-play').click()
    await expect(page.locator('.playbar-play[data-playing]')).toHaveCount(0)
    expect(problems).toEqual([])
  })

  test('the build shows one step at a time: it sounds so far, Add steps forward with the sound going on, and the last step has no Add', async ({
    page,
  }) => {
    const problems = watch(page)
    await page.goto(`lessons/${lesson}/`)
    await labReady(page)

    const build = page.locator('[data-build]')
    const steps = build.locator('[data-step]')
    const shown = build.locator('[data-step]:visible')
    const count = await steps.count()
    expect(count).toBeGreaterThan(1)
    /** The step shown is the nth and no other, and its picture has drawn. */
    const stands = async (nth: number) => {
      await expect(shown).toHaveCount(1)
      await expect(steps.nth(nth)).toBeVisible()
      const picture = shown.locator('[data-figure]').first()
      if ((await picture.count()) > 0) {
        await picture.scrollIntoViewIfNeeded()
        await expect(picture).toHaveAttribute('data-drawn', '')
      }
    }
    await stands(0)
    expect(await meter(page)).toBe(0)

    const hear = shown.getByRole('button', { name: /^Hear it so far/ })
    await hear.click()
    await sounds(page)
    await expect(hear).toHaveAttribute('aria-pressed', 'true')

    const add = shown.getByRole('button', { name: /^Add: / })
    for (let step = 1; step < count; step += 1) {
      const before = await renders(page)
      await add.click()
      await stands(step)
      // The sound so far is now the sound with the new piece, from the render that carries it.
      await expect.poll(() => renders(page)).toBeGreaterThan(before)
      await expect(page.locator('.playbar-play[data-playing]')).toBeVisible()
      await expect(hear).toHaveAttribute('aria-pressed', 'true')
      await sounds(page)
    }
    // Nothing is left to add.
    await expect(build.getByRole('button', { name: /^Add\b/ })).toHaveCount(0)

    await page.locator('.playbar-play').click()
    await expect(page.locator('.playbar-play[data-playing]')).toHaveCount(0)
    expect(problems).toEqual([])
  })

  test('with JavaScript off it has its text, equations, listings, stills, captions, every build step in order and each answer, and no button that needs the lab', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(`lessons/${lesson}/`)
    await expect(page.locator('h1')).toBeVisible()

    // Each prediction's answer is shut and opens: the disclosure is the browser's own. They
    // stay open for the rest, so that what an answer holds is looked at with everything else.
    const predictions = page.locator('.predict[data-predict] details')
    const asked = await predictions.count()
    expect(asked).toBeGreaterThan(0)
    for (let i = 0; i < asked; i += 1) {
      const answer = predictions.nth(i).locator('.predict-answer')
      await expect(answer).toBeHidden()
      await predictions.nth(i).locator('summary').click()
      await expect(answer).toBeVisible()
      expect(await wordCount(answer)).toBeGreaterThan(5)
    }

    // The text: every part under its own headline, with words in it.
    const parts = page.locator('section.part[data-part]')
    const count = await parts.count()
    expect(count).toBeGreaterThan(1)
    for (let i = 0; i < count; i += 1) {
      const part = parts.nth(i)
      const id = (await part.getAttribute('data-part')) ?? ''
      await expect(part.locator('h2').first(), id).toBeVisible()
      expect(await wordCount(part), id).toBeGreaterThan(20)
    }
    expect(await wordCount(page.locator('main'))).toBeGreaterThan(600)

    // The mathematics is written into the page when it is built, and so is every listing,
    // under the name of its file.
    const equations = page.locator('.katex')
    expect(await equations.count()).toBeGreaterThan(0)
    await expect(equations.first()).toBeVisible()
    const listings = page.locator('figure.listing')
    const listed = await listings.count()
    expect(listed).toBeGreaterThan(0)
    for (let i = 0; i < listed; i += 1) {
      await expect(listings.nth(i).locator('figcaption a.src')).toBeVisible()
      expect((await listings.nth(i).locator('pre').innerText()).trim()).not.toBe('')
    }

    // A still is a picture in the page itself, with its key and its caption.
    const stills = page.locator('figure.still')
    const drawn = await stills.count()
    expect(drawn).toBeGreaterThan(0)
    for (let i = 0; i < drawn; i += 1) {
      const still = stills.nth(i)
      await expect(still.locator('svg').first()).toBeVisible()
      expect(await still.locator('.fig-legend li').count()).toBeGreaterThan(0)
      expect(await wordCount(still.locator('figcaption'))).toBeGreaterThan(0)
    }
    // The captions of the live figures are words in the page too.
    const captions = await page.locator('figure.fig:not(.still) > figcaption').allInnerTexts()
    expect(captions.filter((caption) => caption.trim() !== '').length).toBeGreaterThan(0)

    // Every step of the build shows, one after another, in the build's order.
    const steps = page.locator('[data-build] [data-step]')
    const built = await steps.count()
    expect(built).toBeGreaterThan(1)
    for (let i = 0; i < built; i += 1) {
      await expect(steps.nth(i)).toBeVisible()
      await expect(steps.nth(i).locator('.build-count')).toHaveText(`Step ${i + 1} of ${built}`)
      expect(await wordCount(steps.nth(i).locator('[data-step-title]'))).toBeGreaterThan(0)
    }

    // No button, control or play bar that would do nothing.
    const idle = page.locator(
      'article.lesson button:visible, article.lesson [role="slider"]:visible, article.lesson [role="radio"]:visible, .playbar:visible',
    )
    expect(
      await idle.evaluateAll((all) =>
        all.map((one) => `${one.tagName.toLowerCase()}: ${one.textContent?.trim()}`),
      ),
      'what shows and needs a script to do anything',
    ).toEqual([])
    await context.close()
  })
}

/** The cases of a lesson not yet rewritten: a strip of stages and three closing sections. */
function shortCases(lesson: string) {
  test('opens, draws every figure, and draws them again when a control moves', async ({ page }) => {
    const problems = watch(page)
    await page.goto(`lessons/${lesson}/`)
    await expect(page.locator('h1')).toBeVisible()
    await labReady(page)
    await scrollThrough(page)

    const figures = page.locator('[data-figure]')
    expect(await figures.count()).toBeGreaterThan(2)
    await expect(page.locator('[data-figure]:not([data-drawn])')).toHaveCount(0)
    // Every stage says where it comes from.
    const stages = page.locator('.stage')
    expect(await stages.count()).toBeGreaterThan(1)
    await expect(page.locator('.stage .stage-origin:empty')).toHaveCount(0)

    // Move the first control to the far end of its range: the lab renders again and at least
    // one picture is another picture.
    const before = await pictures(page)
    const count = await renders(page)
    // A ranged control is a knob, found by its role and moved by the keys.
    const controls = page.locator('.dials')
    const knob = controls.getByRole('slider').first()
    if ((await knob.count()) > 0) {
      await knob.focus()
      await knob.press((await farEnd(knob)).key)
    } else {
      await controls.getByRole('radio', { checked: false }).first().click()
    }
    await expect.poll(() => renders(page)).toBeGreaterThan(count)
    await expect
      .poll(async () => (await pictures(page)).some((one, i) => one !== before[i]))
      .toBe(true)
    await expect(page.locator('[data-figure]:not([data-drawn])')).toHaveCount(0)

    expect(problems).toEqual([])
  })

  test('plays on a click, and every stage that is sound can be heard', async ({ page }) => {
    const problems = watch(page)
    await page.goto(`lessons/${lesson}/`)
    await labReady(page)
    expect(await meter(page)).toBe(0)

    await page.locator('.playbar-play').click()
    await expect(page.locator('.playbar-play[data-playing]')).toBeVisible()
    await sounds(page)

    const listens = page.locator('.stage-listen')
    const count = await listens.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i += 1) {
      const stage = page.locator('.stage', { has: page.locator('.stage-listen') }).nth(i)
      await stage.locator('.stage-listen').click()
      await expect(stage).toHaveAttribute('data-sounding', '')
      await expect(page.locator('.stage[data-sounding]')).toHaveCount(1)
    }
    // A stage that is not sound has no button.
    await expect(page.locator('.stage:has(.stage-kind) button')).toHaveCount(0)

    await page.locator('.playbar-play').click()
    await expect(page.locator('.playbar-play[data-playing]')).toHaveCount(0)
    expect(problems).toEqual([])
  })

  for (const width of [390, 1280]) {
    test(`fits a window ${width} px wide`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`lessons/${lesson}/`)
      await labReady(page)
      await scrollThrough(page)
      expect(await overflow(page)).toBe(0)
      // Open, the plate scrolls in its own box and still does not widen the page.
      await openPlate(page)
      expect(await overflow(page)).toBe(0)
    })
  }

  test('with JavaScript off it still has its headings, its prose and its captions', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(`lessons/${lesson}/`)
    await expect(page.locator('h1')).toBeVisible()
    expect(await page.locator('main h2').count()).toBeGreaterThan(2)
    expect(await wordCount(page.locator('main'))).toBeGreaterThan(600)
    expect(await page.locator('figure figcaption').count()).toBeGreaterThan(2)
    // The mathematics is written into the page when it is built.
    expect(await page.locator('.katex').count()).toBeGreaterThan(0)
    await context.close()
  })
}

/** A set's label as a pattern reads it, sign for sign. */
const escaped = (words: string) => words.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Either kind of lesson ends with the engine's own device, live. */
async function endsWithTheDevice(page: Page, lesson: string) {
  const problems = watch(page)
  await page.goto(`lessons/${lesson}/`)
  await labReady(page)
  const bench = await openPlate(page)
  // Opening the bench makes no sound.
  expect(await meter(page)).toBe(0)
  await bench.locator('.bench-bar button').click()
  await expect(page.locator('#lab-stage')).toHaveValue('@bench')
  await sounds(page)
  // The play bar's stop governs it.
  await page.locator('.playbar-play').click()
  await expect(page.locator('.playbar-play[data-playing]')).toHaveCount(0)
  expect(problems).toEqual([])
}

for (const lesson of lessonIds()) {
  test.describe(lesson, () => {
    if (isLong(lesson)) longCases(lesson)
    else shortCases(lesson)

    test('ends with the real device: its plate appears and sound goes through it', ({ page }) =>
      endsWithTheDevice(page, lesson))
  })
}

test('a lesson named in the text links to it, with the number and the title the map gives', async ({
  page,
}) => {
  const map: { lessons: { id: string; title: string }[] }[] = JSON.parse(
    fs.readFileSync(new URL('../../src/content/families.json', import.meta.url), 'utf8'),
  )
  const inOrder = map.flatMap((family) => family.lessons)
  let found = 0
  for (const lesson of lessonIds()) {
    await page.goto(`lessons/${lesson}/`)
    const mentions = await page.locator('.lesson-body a', { hasText: /^lesson \d+, /i }).all()
    for (const mention of mentions) {
      const id = /\/lessons\/([^/]+)\/$/.exec((await mention.getAttribute('href')) ?? '')?.[1]
      const number = inOrder.findIndex((one) => one.id === id) + 1
      // A capital only where the mention starts a sentence.
      const words = ((await mention.textContent()) ?? '').replace(/^L/, 'l')
      expect(words, `${lesson}, naming ${id}`).toBe(
        `lesson ${number}, ${inOrder[number - 1]?.title}`,
      )
      found += 1
    }
  }
  // With every lesson run, some lesson names another.
  if (!process.env.LESSONS) expect(found).toBeGreaterThan(0)
})
