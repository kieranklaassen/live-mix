// The lesson packet, held: what a long lesson is made of (site/LESSONS.md). This reads the lesson
// pages as built and fails on a page that carries `data-long` and is short of the packet: a part
// missing or out of its order, a part or the whole lesson under its floor, a figure with no key,
// a caption or a key that names a colour, text that calls a control by what it looks like. A
// lesson that is not long yet is skipped.
//
//   node scripts/check-lessons.mjs [lesson] [folder]     # every lesson of site/dist
//
// It also knows which files are a lesson's own, for scripts/lesson.sh and the wording check.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { siteFolder } from './site-env.mjs'

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** The nine parts in their order, as src/lib/parts.ts has them: a unit test holds the two alike. */
export const PART_IDS = [
  'why',
  'picture',
  'uses',
  'build',
  'engine',
  'ways',
  'wrong',
  'myths',
  'device',
]

/** The least a long lesson holds (LESSONS.md, "The lesson packet"). */
export const FLOORS = {
  words: 3500,
  figures: 12,
  listings: 4,
  equations: 6,
  uses: 3,
  steps: 4,
  flows: 1,
  stages: 1,
  ways: 4,
  faults: 3,
  faultsHeard: 2,
  myths: 4,
  predictions: 1,
  openings: 1,
}

/**
 * The names of colours. A caption or a key names a line by its label: the two schemes colour the
 * roles differently. A colour before "noise" is that noise's name, and is left.
 */
const COLOURS =
  /(?<![\w-])(red|grey|gray|green|blue|orange|olive|teal|yellow|purple|violet|lilac|brown|rust|peach|mint|cyan|magenta|amber|black|white|pink)(?![\w-])(?! noise)/i

/**
 * A control named by what it looks like. "Switch" only as a thing: "switch it off" is no control,
 * and neither is a word of code.
 */
const CONTROL_WORDS =
  /(?<![\w-])(knobs?|sliders?|(?:a|the|this|that|its|each|every) switch(?:es)?)(?![\w-])/i

const VOID = new Set('area base br col embed hr img input link meta source track wbr'.split(' '))
// Tags that sit in the run of a sentence: no word ends at their edges.
const INLINE = new Set('a abbr b code em i q small span strong sub sup'.split(' '))
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
const plain = (text) =>
  text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&(\w+);/g, (whole, name) => ENTITIES[name] ?? whole)

/**
 * A built page as a tree: an element is { tag, attrs, children, parent }, text is { text }.
 * Enough of HTML for a page the framework wrote: quoted attributes, void and self-closed tags,
 * and scripts and styles, whose insides are not read.
 */
export function parse(html) {
  const root = { tag: '#root', attrs: {}, children: [] }
  const token =
    /<!--[\s\S]*?-->|<![^>]*>|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g
  let node = root
  let last = 0
  const text = (to) => {
    if (to > last) node.children.push({ text: plain(html.slice(last, to)) })
  }
  for (let found = token.exec(html); found; found = token.exec(html)) {
    text(found.index)
    last = token.lastIndex
    const [, closed, opened, inside = ''] = found
    if (closed) {
      const name = closed.toLowerCase()
      let up = node
      while (up !== root && up.tag !== name) up = up.parent
      if (up !== root) node = up.parent
    } else if (opened) {
      const tag = opened.toLowerCase()
      const attrs = {}
      for (const [, name, a, b, c] of inside.matchAll(
        /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>]+)))?/g,
      )) {
        attrs[name.toLowerCase()] = plain(a ?? b ?? c ?? '')
      }
      const element = { tag, attrs, children: [], parent: node }
      node.children.push(element)
      if (tag === 'script' || tag === 'style') {
        const end = html.toLowerCase().indexOf(`</${tag}`, last)
        last = token.lastIndex = end < 0 ? html.length : html.indexOf('>', end) + 1
      } else if (!VOID.has(tag) && !inside.trimEnd().endsWith('/')) {
        node = element
      }
    }
  }
  text(html.length)
  return root
}

const classes = (node) => (node.attrs.class ?? '').split(/\s+/)
/** A test of an element: its tag, a class, an attribute, each where given. */
const is =
  ({ tag, cls, attr }) =>
  (node) =>
    (!tag || node.tag === tag) &&
    (!cls || classes(node).includes(cls)) &&
    (!attr || attr in node.attrs)

/** Every element under `node` that passes `test`, in the page's order. */
function all(node, test, found = []) {
  for (const child of node.children) {
    if (!child.tag) continue
    if (test(child)) found.push(child)
    all(child, test, found)
  }
  return found
}

/** The text under `node` as a reader meets it, leaving out what is under an element `skip` takes. */
function textOf(node, skip = () => false) {
  let out = ''
  for (const child of node.children) {
    if (!child.tag) out += child.text
    else if (!skip(child)) {
      const edge = INLINE.has(child.tag) ? '' : ' '
      out += edge + textOf(child, skip) + edge
    }
  }
  return out
}
const tidy = (text) => text.replace(/\s+/g, ' ').trim()

const LISTING = is({ tag: 'figure', cls: 'listing' })
const FIGURE = is({ tag: 'figure', cls: 'fig' })
const KEY = (node) =>
  node.tag === 'ul' && (classes(node).includes('key') || classes(node).includes('fig-legend'))
const MATHS = (node) => classes(node).includes('math') || classes(node).includes('math-inline')
/**
 * Not the lesson's running text: listings with their captions, mathematics, a picture with the
 * numbers on its axes, a key, and what a script draws.
 */
const NOT_TEXT = (node) =>
  LISTING(node) ||
  MATHS(node) ||
  KEY(node) ||
  classes(node).includes('still-plot') ||
  ['pre', 'svg', 'astro-island', 'script', 'style'].includes(node.tag)

const count = (n) => n.toLocaleString('en-GB')
const cut = (text) => (text.length > 120 ? `${text.slice(0, 117)}…` : text)
/** The sentence of `text` that `found` is in, to show where a word was written. */
function sentenceAt(text, found) {
  const from = Math.max(text.lastIndexOf('. ', found.index) + 2, 0)
  const end = text.indexOf('. ', found.index)
  return cut(text.slice(from, end < 0 ? text.length : end + 1))
}

/**
 * What a built lesson page is short of, one line each: the lesson, the part, and what is short
 * and by how much. Undefined for a page that does not carry the long mark.
 */
export function shapeOf(html, lesson) {
  const article = all(parse(html), is({ tag: 'article', cls: 'lesson', attr: 'data-long' }))[0]
  if (!article) return undefined
  const problems = []
  const say = (where, what) => problems.push(`${lesson}: ${where}: ${what}`)
  const floor = (where, have, least, what) => {
    if (have < least)
      say(where, `${count(have)} ${what}, ${count(least - have)} short of ${count(least)}`)
  }
  const named = (id) => `part ${PART_IDS.indexOf(id) + 1} (${id})`
  const WHOLE = 'the whole lesson'

  // The nine parts, each there, in their order.
  const parts = all(article, is({ tag: 'section', cls: 'part', attr: 'data-part' }))
  const partOf = (id) => parts.find((part) => part.attrs['data-part'] === id)
  for (const id of PART_IDS) if (!partOf(id)) say(named(id), 'missing')
  parts.forEach((part, at) => {
    const before = parts[at - 1]?.attrs['data-part']
    const id = part.attrs['data-part']
    if (before && PART_IDS.indexOf(id) <= PART_IDS.indexOf(before)) {
      say(named(id), `comes after ${named(before)}`)
    }
  })
  /** Where an element is: its part, or the opening above the first of them. */
  const where = (node) => {
    for (let up = node; up; up = up.parent) {
      if (parts.includes(up)) return named(up.attrs['data-part'])
    }
    return 'the opening'
  }

  // The floor of each part, where the part is there.
  const within = (id, test) => (partOf(id) ? all(partOf(id), test) : undefined)
  const held = (id, test, least, what) => {
    const found = within(id, test)
    if (found) floor(named(id), found.length, least, what)
  }
  const card = (kind, set) => (node) =>
    is({ tag: 'article', cls: 'lesson-card' })(node) &&
    classes(node).includes(kind) &&
    (!set || 'data-set' in node.attrs)
  held(
    'uses',
    (node) =>
      card('use', true)(node) &&
      all(node, is({ cls: 'lesson-card-picture' })).some(
        (picture) => all(picture, FIGURE).length > 0,
      ),
    FLOORS.uses,
    'use cards with a picture and a set',
  )
  held('build', is({ cls: 'build-step', attr: 'data-step' }), FLOORS.steps, 'build steps')
  held(
    'engine',
    (node) => FIGURE(node) && all(node, is({ cls: 'flow' })).length > 0,
    FLOORS.flows,
    'signal-flow pictures',
  )
  held(
    'engine',
    is({ cls: 'stage-block', attr: 'data-stage-block' }),
    FLOORS.stages,
    'stage blocks',
  )
  held('ways', card('way'), FLOORS.ways, 'way cards')
  held('wrong', card('fault'), FLOORS.faults, 'faults')
  held('wrong', card('fault', true), FLOORS.faultsHeard, 'faults with a set to hear')
  held('myths', is({ cls: 'myth' }), FLOORS.myths, 'misconceptions')

  // The floors of the whole lesson.
  const figures = all(article, FIGURE)
  const text = parts.map((part) => textOf(part, NOT_TEXT)).join(' ')
  const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []
  floor(
    'the opening',
    figures.filter((figure) => classes(figure).includes('opening')).length,
    FLOORS.openings,
    'opening pictures',
  )
  floor(
    WHOLE,
    all(article, is({ cls: 'predict', attr: 'data-predict' })).length,
    FLOORS.predictions,
    'predictions',
  )
  floor(WHOLE, words.length, FLOORS.words, 'words of running text')
  floor(WHOLE, figures.length, FLOORS.figures, 'figures')
  floor(WHOLE, all(article, LISTING).length, FLOORS.listings, 'listings')
  floor(
    WHOLE,
    all(article, is({ tag: 'div', cls: 'math' })).length,
    FLOORS.equations,
    'equations on a line of their own',
  )

  // Every figure has a key, and neither its key nor its caption names a colour.
  for (const figure of figures) {
    const keys = all(figure, KEY)
    const caption = tidy(
      all(figure, is({ tag: 'figcaption' }))
        .map((one) => textOf(one, NOT_TEXT))
        .join(' '),
    )
    const label = all(figure, (node) => 'aria-label' in node.attrs)[0]?.attrs['aria-label']
    if (!keys.some((key) => all(key, is({ tag: 'li' })).length > 0)) {
      say(where(figure), `a figure has no key: "${cut(caption || label || 'no caption')}"`)
    }
    for (const [what, said] of [
      ['caption', caption],
      ['key', tidy(keys.map((key) => textOf(key, NOT_TEXT)).join(' '))],
    ]) {
      const colour = COLOURS.exec(said)
      if (colour) {
        say(
          where(figure),
          `a ${what} names a colour ("${colour[1]}"); name the line by its label: "${cut(said)}"`,
        )
      }
    }
  }

  // The text names a control by its label.
  for (const part of parts) {
    const said = tidy(textOf(part, (node) => NOT_TEXT(node) || node.tag === 'code'))
    const found = CONTROL_WORDS.exec(said)
    if (found) {
      say(
        named(part.attrs['data-part']),
        `the text calls a control "${found[1]}"; name it by its label: "${sentenceAt(said, found)}"`,
      )
    }
  }
  return problems
}

/**
 * What the long lessons built in `folder` are short of, one line each. Reads
 * `<folder>/lessons/<id>/index.html`: every lesson there, or the one of that id.
 */
export function checkLessons(folder = path.join(SITE, siteFolder), lesson) {
  const lessons = path.join(folder, 'lessons')
  const ids = fs.existsSync(lessons)
    ? fs
        .readdirSync(lessons)
        .filter(
          (id) => (!lesson || id === lesson) && fs.existsSync(path.join(lessons, id, 'index.html')),
        )
        .sort()
    : []
  const problems = []
  let long = 0
  for (const id of ids) {
    const found = shapeOf(fs.readFileSync(path.join(lessons, id, 'index.html'), 'utf8'), id)
    if (!found) continue
    long += 1
    problems.push(...found)
  }
  return { problems, long, pages: ids.length }
}

/**
 * The files that are a lesson's own, as paths from site/: its lab, its lab test, its text, its
 * settings and a figure pair of its own, each where it is there. A figure pair
 * (src/figures/<Name>.tsx with src/components/lesson/<Name>.astro) is a lesson's own when that
 * lesson's text uses it and no other lesson's does.
 */
export function packetFiles(lesson, site = SITE) {
  const lessons = path.join(site, 'src/content/lessons')
  const texts = new Map(
    (fs.existsSync(lessons) ? fs.readdirSync(lessons) : [])
      .filter((name) => name.endsWith('.mdx'))
      .map((name) => [
        name.replace(/\.mdx$/, ''),
        fs.readFileSync(path.join(lessons, name), 'utf8'),
      ]),
  )
  const uses = (id, name) => new RegExp(`<${name}[\\s/>]`).test(texts.get(id) ?? '')
  const others = [...texts.keys()].filter((id) => id !== lesson)
  const wrappers = path.join(site, 'src/components/lesson')
  const pairs = (fs.existsSync(wrappers) ? fs.readdirSync(wrappers) : [])
    .filter((file) => file.endsWith('.astro'))
    .map((file) => file.replace(/\.astro$/, ''))
    .filter((name) => fs.existsSync(path.join(site, `src/figures/${name}.tsx`)))
    .filter((name) => uses(lesson, name) && !others.some((id) => uses(id, name)))
    .flatMap((name) => [`src/figures/${name}.tsx`, `src/components/lesson/${name}.astro`])
  return [
    `labs/${lesson}.cpp`,
    `tests/labs/${lesson}.test.ts`,
    `src/content/lessons/${lesson}.mdx`,
    `src/content/settings/${lesson}.json`,
    ...pairs,
  ].filter((file) => fs.existsSync(path.join(site, file)))
}

// Where a tool says the file it could not compile: the C++ compiler, the test runner's
// transform, the bundler's frame, the framework's compiler, the browser tests' transform.
const STOPPED_AT = [
  /^(\S+?):\d+:\d+: (?:fatal )?error: /m,
  /^(\S+?):\d+:\d+: ERROR: /m,
  /╭─\[ (\S+?):\d+:\d+ \]/,
  /\[CompilerError\].*\n\s*Location:\s*\n\s*(\S+?):\d+:\d+/,
  /^SyntaxError: (\S+?): /m,
]

/**
 * The file a failed step's output blames, as a path from the repository's root, when it is not
 * one of the lesson's own: the first file a tool could not compile. Undefined when that file is
 * the lesson's, when the C++ compiler's notes on it point into the lesson's lab, and when the
 * step failed for any other reason (a test that does not hold is the lesson's to mend).
 */
export function blamedOutside(output, lesson, site = SITE) {
  const text = output.replace(/\x1b\[[0-9;]*m/g, '')
  const first = STOPPED_AT.map((pattern) => pattern.exec(text))
    .filter(Boolean)
    .sort((a, b) => a.index - b.index)[0]
  if (!first) return undefined
  const repo = path.resolve(site, '..')
  // A tool names a file from where it ran: site/, or the repository's root.
  const inRepo = (file) => {
    const full = [path.resolve(site, file), path.resolve(repo, file)].find((one) =>
      fs.existsSync(one),
    )
    const from = full && path.relative(repo, full)
    return from && !from.startsWith('..') && !from.includes('node_modules') ? from : undefined
  }
  const own = packetFiles(lesson, site).map((file) => path.relative(repo, path.join(site, file)))
  const blamed = inRepo(first[1])
  if (!blamed || own.includes(blamed)) return undefined
  const rest = text.slice(first.index + first[0].length)
  const next = rest.search(/^\S+?:\d+:\d+: (?:fatal )?error: /m)
  const notes = (next < 0 ? rest : rest.slice(0, next)).matchAll(/^(\S+?):\d+:\d+: note: /gm)
  if ([...notes].some((note) => own.includes(inRepo(note[1])))) return undefined
  return blamed
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [first, second, third] = process.argv.slice(2)
  if (first === '--packet') {
    // The lesson's own files, one a line.
    console.log(packetFiles(second).join('\n'))
  } else if (first === '--outside') {
    // The file outside the lesson's packet that a failed step's output blames, if it blames one.
    const blamed = blamedOutside(fs.readFileSync(third, 'utf8'), second)
    if (blamed) console.log(blamed)
  } else {
    const folder = path.resolve(second ?? path.join(SITE, siteFolder))
    const { problems, long, pages } = checkLessons(folder, first)
    if (first && pages === 0) {
      console.error(`No page of the lesson "${first}" is built in ${folder}.`)
      process.exit(1)
    }
    for (const problem of problems) console.error(problem)
    console.log(
      problems.length
        ? `Places where a long lesson is short of its packet (LESSONS.md): ${problems.length}.`
        : `Lesson pages read: ${pages}. Long: ${long}, and none is short of its packet.`,
    )
    process.exit(problems.length ? 1 : 0)
  }
}
