// The checks that read the site as a whole, tried on small sites made for the purpose: a dead
// link is found and a sound one is not, a name is found and a word that only holds one is not,
// a long lesson short of its packet is found and one at its floors is not, a claim's number is
// found missing from its test, and a lesson's own files are told from everybody's.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { checkClaims, numbersIn, testsNaming } from '../../scripts/check-claims.mjs'
import {
  blamedOutside,
  checkLessons,
  FLOORS,
  packetFiles,
  PART_IDS,
  shapeOf,
} from '../../scripts/check-lessons.mjs'
import { checkLinks } from '../../scripts/check-links.mjs'
import { checkWording, patternsOf, wordingIn } from '../../scripts/check-wording.mjs'
import { PARTS } from '../../src/lib/parts.ts'

const made: string[] = []
function site(pages: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-links-'))
  made.push(root)
  for (const [file, html] of Object.entries(pages)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), html)
  }
  return root
}
afterAll(() => made.forEach((root) => fs.rmSync(root, { recursive: true, force: true })))

describe('check-links', () => {
  it('passes a site whose links all lead somewhere', () => {
    const dist = site({
      'index.html':
        '<a href="/live-mix/lessons/one/#idea">one</a> <a href="https://example.com/">out</a>',
      'lessons/one/index.html':
        '<h2 id="idea">Idea</h2> <a href="../../">home</a> <img src="/live-mix/a.svg">',
      'a.svg': '<svg/>',
    })
    expect(checkLinks(dist, '/live-mix')).toEqual({ problems: [], internal: 3, external: 1 })
  })

  it('finds a page that is not there, a heading that is not there, and a link that leaves the base path', () => {
    const dist = site({
      'index.html':
        '<a href="/live-mix/lessons/two/">two</a> <a href="/live-mix/lessons/one/#gone">gone</a> <a href="/lessons/one/">no base</a>',
      'lessons/one/index.html': '<h2 id="idea">Idea</h2>',
    })
    const { problems } = checkLinks(dist, '/live-mix')
    expect(problems).toHaveLength(3)
    expect(problems[0]).toContain('leads to nothing')
    expect(problems[1]).toContain('#gone')
    expect(problems[2]).toContain("leaves the site's base path")
  })

  it('works for a site at a domain’s root', () => {
    const dist = site({
      'index.html': '<a href="/lessons/one/">one</a>',
      'lessons/one/index.html': '<a href="/">home</a>',
    })
    expect(checkLinks(dist, '/').problems).toEqual([])
  })

  it('does not look for headings in the API reference', () => {
    const dist = site({
      'index.html': '<a href="/live-mix/api/classes/Engine.html#render">render</a>',
      'api/classes/Engine.html': '<h1>Engine</h1>',
    })
    expect(checkLinks(dist, '/live-mix').problems).toEqual([])
  })
})

describe('check-wording', () => {
  const patterns = patternsOf('# a comment\nAcme Sound\nZed\n~\\b[\\w-]+-style\\b\n')

  it('finds a name whatever its capitals, and says the line', () => {
    expect(wordingIn('A plate.\nAs the acme sound unit does.', patterns)).toEqual([
      { line: 2, said: 'Acme Sound', text: 'As the acme sound unit does.' },
    ])
  })

  it('leaves a word that only holds a name', () => {
    expect(wordingIn('Zedoary is a root. A buzzed tone.', patterns)).toEqual([])
  })

  it('finds a comparison by pattern', () => {
    expect(wordingIn('A ladder-style filter.', patterns)).toHaveLength(1)
  })
})

// A long lesson's page, made up from the marks the lesson's components leave in a built page.
const key = '<ul class="fig-legend key"><li><i></i>Input</li><li><i></i>Output</li></ul>'
const still = (caption = 'What to notice in the two lines.') =>
  `<figure class="fig still"><div class="still-plot"><svg><path d="M0 0" /></svg></div><ul class="fig-legend"><li><i></i>Input</li></ul><figcaption>${caption}</figcaption></figure>`
const live = (legend = key) =>
  `<figure class="fig"><astro-island props="{&quot;a&quot;:1}" ssr><div class="fig-plot" data-figure="true"><canvas></canvas>${legend}</div></astro-island><figcaption><p>Try the threshold, and notice the hits.</p></figcaption></figure>`
const listing =
  '<figure class="listing"><figcaption><a class="src"><code>cpp/kit/filters.h</code></a><span class="label">lines 1 to 2</span></figcaption><pre><code>float y = a * x;\nreturn y;</code></pre></figure>'
const equation = '<div class="math"><span class="katex"><math><mi>y</mi></math></span></div>'
const card = (kind: string, set?: string, picture = '') =>
  `<article class="lesson-card ${kind}"${set ? ` data-set="${set}"` : ''}>${picture && `<div class="lesson-card-picture">${picture}</div>`}<div class="lesson-card-text"><h3>A card</h3><p>Why it is here.</p></div></article>`
const step = `<article class="build-step" data-step><div class="build-text"><h3 data-step-title>A piece</h3><p>What it is for.</p>${listing}</div><div class="build-side">${live()}</div></article>`
const stage = `<section class="stage-block" data-stage-block="level"><h3>A stage</h3><p>What it is for.</p>${equation}</section>`
const flow =
  '<figure class="fig"><astro-island ssr><div class="flow"><svg></svg><ul class="key"><li><i data-signal="sound"></i>sound</li></ul></div></astro-island><figcaption>The path of the sound.</figcaption></figure>'
const myth =
  '<div class="myth"><p class="myth-says"><q>It makes things louder.</q></p><div class="myth-true"><p>It turns them down.</p></div></div>'
const predict =
  '<div class="predict" data-predict><fieldset><legend>What happens?</legend></fieldset><details><summary>Show the answer</summary><div class="predict-answer"><p>They stay.</p></div></details></div>'

/** The parts of a lesson that is exactly at its floors, by id, as the body of each. */
function partsAtTheFloors(): Record<string, string> {
  return {
    why: `<p>${Array(FLOORS.words).fill('word').join(' ')}</p>${still()}${still()}${predict}`,
    picture: live(),
    uses: `<div class="lesson-cards uses">${['a', 'b', 'c'].map((set) => card('use', set, still())).join('')}</div>`,
    build: `<section class="build" data-build><div class="build-steps">${step.repeat(4)}</div></section>`,
    engine: `${flow}${stage.repeat(6)}`,
    ways: `<div class="lesson-cards ways">${card('way', 'a').repeat(4)}</div>`,
    wrong: `<div class="lesson-cards faults">${card('fault', 'a')}${card('fault', 'b')}${card('fault')}</div>`,
    myths: `<div class="myths">${myth.repeat(4)}</div>`,
    device: '<p>Here is the device itself.</p>',
  }
}

/** A lesson's page as built, from its parts in the order given. */
function longPage(parts: Record<string, string>, order = Object.keys(parts), long = true): string {
  const sections = order
    .map(
      (id) =>
        `<section class="part" id="${id}" data-part="${id}" aria-labelledby="${id}-title"><p class="part-label"><b>1</b> A part</p><div class="part-body"><h2 id="${id}-title">Its headline</h2>${parts[id]}</div></section>`,
    )
    .join('\n')
  const opening =
    '<figure class="fig opening"><div class="still-plot"><svg></svg></div><ul class="fig-legend"><li><i></i>Input<astro-island ssr><button class="listen">Hear it</button></astro-island></li></ul></figure>'
  return `<!doctype html><html><head><title>A lesson</title><style>.a > .b { color: red }</style></head><body><article class="lesson" data-lesson="made-up"${long ? ' data-long' : ''}><header class="lesson-hero"><h1>A lesson</h1></header><div class="lesson-opening">${opening}</div><div class="lesson-body">${sections}</div></article><astro-island ssr><div class="playbar">Play the slider</div></astro-island><script>const red = "<p>"</script></body></html>`
}

describe('check-lessons', () => {
  it('knows the nine parts as the page does', () => {
    expect(PART_IDS).toEqual(PARTS.map((part) => part.id))
  })

  it('passes a page with the nine parts, each at its floor', () => {
    expect(shapeOf(longPage(partsAtTheFloors()), 'made-up')).toEqual([])
  })

  it('finds a part that is missing', () => {
    const parts = partsAtTheFloors()
    delete parts.myths
    expect(shapeOf(longPage(parts), 'made-up')).toEqual(['made-up: part 8 (myths): missing'])
  })

  it('finds parts out of their order', () => {
    const parts = partsAtTheFloors()
    const order = ['why', 'picture', 'uses', 'build', 'engine', 'wrong', 'ways', 'myths', 'device']
    expect(shapeOf(longPage(parts, order), 'made-up')).toEqual([
      'made-up: part 6 (ways): comes after part 7 (wrong)',
    ])
  })

  it('finds two cards where three are the floor, and says how many are short', () => {
    const parts = partsAtTheFloors()
    parts.uses = `<div class="lesson-cards uses">${card('use', 'a', still())}${card('use', 'b', still())}${card('use', undefined, still())}</div>`
    expect(shapeOf(longPage(parts), 'made-up')).toEqual([
      'made-up: part 3 (uses): 2 use cards with a picture and a set, 1 short of 3',
    ])
  })

  it('finds an equation that links to a line no listing of the page has', () => {
    const linked = (to: string) =>
      `<div class="math"><span class="katex"><a href="#${to}"><span>a</span></a></span></div>`
    const keyed = listing.replace(
      '<code>float y',
      '<code><span class="line" id="pole-step">float y',
    )
    const parts = partsAtTheFloors()
    parts.engine = `${flow}${stage.repeat(6)}${keyed}${linked('pole-step')}`
    expect(shapeOf(longPage(parts), 'made-up')).toEqual([])
    parts.engine = `${flow}${stage.repeat(6)}${keyed}${linked('pole-coeff')}`
    expect(shapeOf(longPage(parts), 'made-up')).toEqual([
      'made-up: part 5 (engine): an equation links to "pole-coeff", and no listing of the page has a line with that key',
    ])
  })

  it('finds a figure with no key', () => {
    const parts = partsAtTheFloors()
    parts.picture = live('')
    expect(shapeOf(longPage(parts), 'made-up')).toEqual([
      'made-up: part 2 (picture): a figure has no key: "Try the threshold, and notice the hits."',
    ])
  })

  it('finds a caption that names a colour, and leaves a word that only holds one', () => {
    const parts = partsAtTheFloors()
    parts.why = parts.why.replace(
      'What to notice in the two lines.',
      'The red line is the output; it is not bored, and white noise is no colour.',
    )
    parts.picture = parts.picture.replace('Try the threshold', 'Try it on pink noise')
    expect(shapeOf(longPage(parts), 'made-up')).toEqual([
      'made-up: part 1 (why): a caption names a colour ("red"); name the line by its label: "The red line is the output; it is not bored, and white noise is no colour."',
    ])
  })

  it('finds text that calls a control a slider, and leaves the play bar and a verb alone', () => {
    const parts = partsAtTheFloors()
    parts.ways +=
      '<p>The <code>switch</code> picks the kind. Switch the piece off, then move the slider to its lowest.</p>'
    expect(shapeOf(longPage(parts), 'made-up')).toEqual([
      'made-up: part 6 (ways): the text calls a control "slider"; name it by its label: "Switch the piece off, then move the slider to its lowest."',
    ])
  })

  it('counts words without listings, mathematics, pictures, keys and what a script draws', () => {
    const drawn =
      '<figure class="fig still"><div class="still-plot"><svg><text>six</text></svg><div aria-hidden="true"><span>0</span> <span>1</span> seconds</div></div><ul class="fig-legend"><li><i></i>Input</li></ul><figcaption>seven</figcaption></figure>'
    // Eleven words: "1 A part", "Its headline", "one two three" and the captions' "four five" and "seven".
    const body = `<p>one <b>two</b> three</p>${listing}${equation}<span class="math-inline">x</span>${live().replace('Try the threshold, and notice the hits.', 'four five')}${drawn}`
    expect(shapeOf(longPage({ why: body }, ['why']), 'made-up')).toContain(
      'made-up: the whole lesson: 11 words of running text, 3,489 short of 3,500',
    )
  })

  it('says how far the whole lesson is under each floor', () => {
    const parts = partsAtTheFloors()
    parts.engine = `${flow}${stage}`
    parts.build = parts.build.replaceAll(listing, '')
    expect(shapeOf(longPage(parts), 'made-up')).toEqual([
      'made-up: the whole lesson: 0 listings, 4 short of 4',
      'made-up: the whole lesson: 1 equations on a line of their own, 5 short of 6',
    ])
  })

  it('has nothing to say of a lesson that is not long yet', () => {
    expect(shapeOf(longPage({ why: '<p>Short.</p>' }, ['why'], false), 'old')).toBeUndefined()
  })

  it('reads the lessons of a built folder, one of them when asked, and skips the old shape', () => {
    const parts = partsAtTheFloors()
    delete parts.myths
    const dist = site({
      'lessons/index.html': '<h1>Lessons</h1>',
      'lessons/whole/index.html': longPage(partsAtTheFloors()),
      'lessons/short/index.html': longPage(parts),
      'lessons/old/index.html': longPage({ why: '<p>Short.</p>' }, ['why'], false),
    })
    expect(checkLessons(dist)).toEqual({
      problems: ['short: part 8 (myths): missing'],
      long: 2,
      pages: 3,
    })
    expect(checkLessons(dist, 'whole')).toEqual({ problems: [], long: 1, pages: 1 })
    expect(checkLessons(dist, 'old')).toEqual({ problems: [], long: 0, pages: 1 })
    expect(checkLessons(site({ 'index.html': '<h1>Home</h1>' }))).toEqual({
      problems: [],
      long: 0,
      pages: 0,
    })
  })
})

describe('check-claims', () => {
  const lesson = (claim: string, long = true) =>
    `---\ntitle: Made up\n${long ? 'long: true\n' : ''}---\n\nAt a release of 100 ms the gain is back <Claim id="back">${claim}</Claim> after the hit.\n`
  const tested = (title: string, body = 'expect(measured).toBeCloseTo(0.04)') =>
    `import { it } from 'vitest'\n\nit('${title}', async () => {\n  ${body}\n})\n\nit('does something else, in 39 ms', () => {})\n`
  const claims = (text: string, test: string) =>
    checkClaims(
      site({ 'src/content/lessons/made-up.mdx': text, 'tests/labs/made-up.test.ts': test }),
    )

  it('reads the numbers with a unit that a claim writes', () => {
    expect(numbersIn('about 39 ms, or −46.8 dB at 23,750 Hz and 63 %, in 3 hits')).toEqual([
      '39 ms',
      '−46.8 dB',
      '23,750 Hz',
      '63 %',
    ])
    expect(numbersIn('in a straight line')).toEqual([])
  })

  it('finds the test that names a claim, with its title and what it passes to the written-number helper', () => {
    const test = tested(
      'comes back (claim back)',
      "expectWritten(onsetMs(gain, at), '39 ms')\n  expect(matchesWritten(level(x, 1, 2), 'less than 0.5 dB')).toBe(true)",
    )
    expect(testsNaming(test, 'back')).toEqual([
      { title: 'comes back (claim back)', written: ['39 ms', 'less than 0.5 dB'] },
    ])
    expect(testsNaming(test, 'bac')).toEqual([])
  })

  it('fails a long lesson whose claim writes 39 ms where its test holds 41 ms', () => {
    expect(claims(lesson('39 ms'), tested('is back in 41 ms (claim back)')).problems).toEqual([
      'made-up: the claim "back" writes "39 ms", and the test that names it does not: write it in the test\'s title, or hold the measurement with expectWritten(measured, \'39 ms\') (tests/labs/made-up.test.ts)',
    ])
  })

  it('passes when the title says the same, or the helper holds the same', () => {
    expect(claims(lesson('39 ms'), tested('is back in 39 ms (claim back)')).problems).toEqual([])
    expect(
      claims(lesson('39 ms'), tested('is back (claim back)', "expectWritten(ms, '39 ms')"))
        .problems,
    ).toEqual([])
  })

  it('does not take a longer number, or another test, for the one written', () => {
    expect(claims(lesson('39 ms'), tested('is back in 139 ms (claim back)')).problems).toHaveLength(
      1,
    )
    // The other test of the made-up file says "39 ms", and names no claim.
    expect(claims(lesson('39 ms'), tested('is back (claim back)')).problems).toHaveLength(1)
  })

  it('leaves a lesson that is not long, and a claim with no number, as they were', () => {
    expect(
      claims(lesson('39 ms', false), tested('is back in 41 ms (claim back)')).problems,
    ).toEqual([])
    expect(
      claims(lesson('in a straight line'), tested('is back in 41 ms (claim back)')).problems,
    ).toEqual([])
  })

  it('still fails a claim no test names, and takes one lesson by its id', () => {
    const made = site({
      'src/content/lessons/made-up.mdx': lesson('39 ms'),
      'src/content/lessons/other.mdx': lesson('12 dB'),
      'tests/labs/made-up.test.ts': tested('is back in 39 ms (claim back)'),
    })
    expect(checkClaims(made).problems).toEqual([
      'other: the claim "back" is held by no test. Name a test "… (claim back)" in tests/labs/other.test.ts',
    ])
    expect(checkClaims(made, 'made-up')).toEqual({ problems: [], count: 1, lessons: 1 })
  })
})

describe("a lesson's own files", () => {
  // A repository with two lessons: both use the wave, and each has a figure only it uses.
  const made = () => {
    const root = site({
      'site/src/content/lessons/one.mdx':
        '---\ntitle: One\n---\n<Wave taps="in" />\n<Beads tap="x" />\n',
      'site/src/content/lessons/two.mdx': '---\ntitle: Two\n---\n<Wave taps="in" />\n<Turns />\n',
      'site/src/components/lesson/Wave.astro': '',
      'site/src/figures/Wave.tsx': '',
      'site/src/components/lesson/Beads.astro': '',
      'site/src/figures/Beads.tsx': '',
      'site/src/components/lesson/Turns.astro': '',
      'site/src/figures/Turns.tsx': '',
      'site/labs/one.cpp': '',
      'site/labs/lab.h': '',
      'site/tests/labs/one.test.ts': '',
      'site/tests/labs/support.ts': '',
      'site/tests/browser/support.ts': '',
      'site/src/content/settings/one.json': '{}',
      'site/dist/lessons/one/index.html': '<p>One</p>',
      'site/dist/lessons/two/index.html': '<p>Two</p>',
      'cpp/kit/filters.h': '',
    })
    return path.join(root, 'site')
  }

  it('are its lab, its test, its text, its settings and the figure pair that only its text uses', () => {
    const root = made()
    expect(packetFiles('one', root)).toEqual([
      'labs/one.cpp',
      'tests/labs/one.test.ts',
      'src/content/lessons/one.mdx',
      'src/content/settings/one.json',
      'src/figures/Beads.tsx',
      'src/components/lesson/Beads.astro',
    ])
    expect(packetFiles('two', root)).toEqual([
      'src/content/lessons/two.mdx',
      'src/figures/Turns.tsx',
      'src/components/lesson/Turns.astro',
    ])
  })

  it('are all the wording check reads when it is given the lesson, with its page as built', () => {
    // Six files and one page.
    expect(checkWording(made(), { lesson: 'one' })).toEqual({ problems: [], read: 7 })
  })

  it('are not blamed for a file of another lesson, or of everybody, that a tool could not compile', () => {
    const root = made()
    const bundler =
      "[UNRESOLVED_IMPORT] Could not resolve './gone.ts' in src/figures/Turns.tsx\n   ╭─[ src/figures/Turns.tsx:1:25 ]\n   │\n"
    expect(blamedOutside(bundler, 'one', root)).toBe('site/src/figures/Turns.tsx')
    expect(blamedOutside(bundler, 'two', root)).toBeUndefined()
    expect(
      blamedOutside(
        `[CompilerError] Unexpected token\n  Location:\n    ${root}/src/components/lesson/Turns.astro:2:10\n  Stack trace:\n`,
        'one',
        root,
      ),
    ).toBe('site/src/components/lesson/Turns.astro')
    expect(
      blamedOutside(`${root}/tests/labs/support.ts:1:17: ERROR: Unexpected "="\n`, 'one', root),
    ).toBe('site/tests/labs/support.ts')
    expect(
      blamedOutside(
        `SyntaxError: ${root}/tests/browser/support.ts: Unexpected token (1:17)\n`,
        'one',
        root,
      ),
    ).toBe('site/tests/browser/support.ts')
    expect(
      blamedOutside("site/labs/lab.h:12:3: error: unknown type name 'tap'\n", 'one', root),
    ).toBe('site/labs/lab.h')
  })

  it('are blamed when the fault is in them, or comes from them, or is no fault of compiling', () => {
    const root = made()
    expect(
      blamedOutside("site/labs/one.cpp:3:1: error: expected ';'\n", 'one', root),
    ).toBeUndefined()
    // The compiler stops in the kit, at a line the lab asked for.
    expect(
      blamedOutside(
        "In file included from site/labs/one.cpp:2:\ncpp/kit/filters.h:40:5: error: no matching function\nsite/labs/one.cpp:9:3: note: in instantiation of function template specialization 'x' requested here\n",
        'one',
        root,
      ),
    ).toBeUndefined()
    // A test that does not hold, thrown from a helper everybody shares.
    expect(
      blamedOutside(
        ' FAIL  tests/labs/one.test.ts > a\nAssertionError: expected 1 to be 2\n ❯ help tests/labs/support.ts:1:45\n ❯ tests/labs/one.test.ts:2:17\n',
        'one',
        root,
      ),
    ).toBeUndefined()
  })
})
