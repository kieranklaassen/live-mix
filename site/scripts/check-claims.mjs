// Every quantity a lesson states is written through <Claim id="…">, and a test must hold it.
// This fails when a claim's id is in no test's name as "claim <id>", in the lesson's lab test
// (tests/labs/<lesson>.test.ts) or a browser test (tests/browser/*.spec.ts).
//
//   node scripts/check-claims.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`claim ${escaped}(?![\\w-])`).test(testText)
}

/** What is wrong, one line each; empty when every claim is held. */
export function checkClaims(site = SITE) {
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
    ? fs.readdirSync(lessons).filter((name) => name.endsWith('.mdx'))
    : []
  for (const name of files.sort()) {
    const lesson = name.replace(/\.mdx$/, '')
    const { ids, twice } = claimsIn(read(path.join(lessons, name)))
    const tests = `${read(path.join(site, 'tests/labs', `${lesson}.test.ts`))}\n${browser}`
    for (const id of twice)
      problems.push(`${lesson}: the claim "${id}" is written twice; each claim has its own id`)
    for (const id of ids) {
      count += 1
      if (!holds(tests, id)) {
        problems.push(
          `${lesson}: the claim "${id}" is held by no test. Name a test "… (claim ${id})" in tests/labs/${lesson}.test.ts`,
        )
      }
    }
  }
  return { problems, count, lessons: files.length }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { problems, count, lessons } = checkClaims()
  if (problems.length > 0) {
    console.error(problems.join('\n'))
    process.exit(1)
  }
  console.log(`${count} claims in ${lessons} lessons, each held by a test.`)
}
