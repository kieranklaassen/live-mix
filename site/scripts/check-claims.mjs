// Every quantity a lesson states is written through <Claim id="…">, and a test must hold it.
// This fails when a claim's id is in no test's name as "claim <id>", in the lesson's lab test
// (tests/labs/<lesson>.test.ts) or a browser test (tests/browser/*.spec.ts). In a long lesson
// (`long: true`) it also fails when a number with a unit that the claim writes is not in that
// test as written: in its title, or passed to the written-number helper of
// tests/labs/support.ts, `expectWritten(measured, '39 ms')` or `matchesWritten`.
//
//   node scripts/check-claims.mjs [lesson]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { escapeRegExp } from './shared.mjs'

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** The ids of the claims in a lesson's text, in order, with any id used twice. */
export function claimsIn(text) {
  const ids = [
    ...text.matchAll(/<Claim\s+id=(?:"([^"]+)"|'([^']+)'|\{['"`]([^'"`]+)['"`]\})/g),
  ].map((match) => match[1] ?? match[2] ?? match[3])
  const twice = ids.filter((id, index) => ids.indexOf(id) !== index)
  return { ids: [...new Set(ids)], twice: [...new Set(twice)] }
}

/** Whether a test file's text names a claim: "claim <id>" with nothing of an id after it. */
export function holds(testText, id) {
  return new RegExp(`claim ${escapeRegExp(id)}(?![\\w-])`).test(testText)
}

/** Each claim of a lesson's text with the words it wraps, tags taken out. */
export function claimsWritten(text) {
  return [
    ...text.matchAll(
      /<Claim\s+id=(?:"([^"]+)"|'([^']+)'|\{['"`]([^'"`]+)['"`]\})\s*>([\s\S]*?)<\/Claim>/g,
    ),
  ].map((match) => ({
    id: match[1] ?? match[2] ?? match[3],
    text: match[4]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  }))
}

const UNITS = 'dBFS|dBTP|dB|LUFS|LU|kHz|Hz|ms|µs|μs|s|rad|samples?|cents?|semitones?|octaves?'
const NUMBER = new RegExp(
  `(?<![\\w.,])[+−-]?\\d[\\d,]*(?:\\.\\d+)?(?:\\s?[%°]|\\s(?:${UNITS})(?!\\w))`,
  'g',
)

/** The numbers with a unit that a text writes, as written: "39 ms", "−46.8 dB", "63 %". */
export function numbersIn(text) {
  return [...text.matchAll(NUMBER)].map((match) => match[0].replace(/\s+/g, ' '))
}

/** Whether `text` writes that number: the same, and not as the end or the start of another. */
const writes = (text, number) =>
  new RegExp(`(?<![\\d.,])${escapeRegExp(number)}(?!\\w)`).test(text.replace(/\s+/g, ' '))

const STRING = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/

/** What a call's brackets hold, from just after its opening one; strings are stepped over. */
function argumentsFrom(text, from) {
  const string = new RegExp(STRING.source, 'y')
  let depth = 1
  let at = from
  while (at < text.length && depth > 0) {
    string.lastIndex = at
    const quoted = string.exec(text)
    if (quoted) {
      at += quoted[0].length
      continue
    }
    if (text[at] === '(') depth += 1
    if (text[at] === ')') depth -= 1
    at += 1
  }
  return text.slice(from, at - 1)
}

/**
 * The tests of a test file that name a claim in their title, each with its title and the
 * numbers it passes to the written-number helper, as strings. A test runs from its `it(` or
 * `test(` to the next one.
 */
export function testsNaming(testText, id) {
  const starts = [
    ...testText.matchAll(
      new RegExp(`^[ \\t]*(?:it|test)(?:\\.\\w+)*\\(\\s*${STRING.source}`, 'gm'),
    ),
  ]
  return starts
    .map((start, index) => ({
      title: start[2],
      body: testText.slice(start.index, starts[index + 1]?.index),
    }))
    .filter(({ title }) => holds(title, id))
    .map(({ title, body }) => ({
      title,
      written: [...body.matchAll(/\b(?:expectWritten|matchesWritten)\(/g)].flatMap((call) => {
        const last = new RegExp(`,\\s*${STRING.source}\\s*,?\\s*$`).exec(
          argumentsFrom(body, call.index + call[0].length),
        )
        return last ? [last[2]] : []
      }),
    }))
}

/**
 * What is wrong, one line each; empty when every claim is held. With `lesson`, of that lesson's
 * claims only.
 */
export function checkClaims(site = SITE, lesson) {
  const lessons = path.join(site, 'src/content/lessons')
  const browserDir = path.join(site, 'tests/browser')
  const read = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '')
  const browser = fs.existsSync(browserDir)
    ? fs
        .readdirSync(browserDir)
        .filter((name) => name.endsWith('.spec.ts'))
        .map((name) => read(path.join(browserDir, name)))
        .join('\n')
    : ''
  const problems = []
  let count = 0
  const files = fs.existsSync(lessons)
    ? fs
        .readdirSync(lessons)
        .filter((name) => name.endsWith('.mdx') && (!lesson || name === `${lesson}.mdx`))
    : []
  for (const name of files.sort()) {
    const lesson = name.replace(/\.mdx$/, '')
    const text = read(path.join(lessons, name))
    const { ids, twice } = claimsIn(text)
    const tests = `${read(path.join(site, 'tests/labs', `${lesson}.test.ts`))}\n${browser}`
    for (const id of twice)
      problems.push(`${lesson}: the claim "${id}" is written twice; each claim has its own id`)
    const unheld = ids.filter((id) => !holds(tests, id))
    for (const id of ids) {
      count += 1
      if (unheld.includes(id)) {
        problems.push(
          `${lesson}: the claim "${id}" is held by no test. Name a test "… (claim ${id})" in tests/labs/${lesson}.test.ts`,
        )
      }
    }
    // A long lesson: the numbers a claim writes are the numbers its test holds.
    if (!/^long:\s*true\s*$/m.test(/^---\n[\s\S]*?\n---/.exec(text)?.[0] ?? '')) continue
    for (const claim of claimsWritten(text)) {
      if (unheld.includes(claim.id)) continue
      const held = testsNaming(tests, claim.id).flatMap(({ title, written }) => [title, ...written])
      for (const number of numbersIn(claim.text)) {
        if (held.some((one) => writes(one, number))) continue
        problems.push(
          `${lesson}: the claim "${claim.id}" writes "${number}", and the test that names it does not: write it in the test's title, or hold the measurement with expectWritten(measured, '${number}') (tests/labs/${lesson}.test.ts)`,
        )
      }
    }
  }
  return { problems, count, lessons: files.length }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const lesson = process.argv[2]
  const { problems, count, lessons } = checkClaims(SITE, lesson)
  if (problems.length > 0) {
    console.error(problems.join('\n'))
    process.exit(1)
  }
  console.log(`${count} claims in ${lesson ?? `${lessons} lessons`}, each held by a test.`)
}
