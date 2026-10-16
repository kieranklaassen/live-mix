// The site says things in its own words: nothing in it is named after a product, a brand, a
// maker, an artist or a track, and nothing is described by setting it beside another program.
// This reads the site's sources, and the lesson pages as built when there is a build, for the
// names and phrases in scripts/wording-names.txt. With a lesson's id it reads that lesson's own
// files and its page as built, and nothing else.
//
//   node scripts/check-wording.mjs [lesson] [folder]     # the build is site/dist when not given
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { packetFiles } from './check-lessons.mjs'
import { escapeRegExp, htmlFiles } from './shared.mjs'
import { siteFolder } from './site-env.mjs'

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const NAMES = path.join(SITE, 'scripts/wording-names.txt')

/** The patterns of a names file: a name as whole words, a line starting with ~ as written. */
export function patternsOf(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      if (line.startsWith('~'))
        return { said: line.slice(1), pattern: new RegExp(line.slice(1), 'i') }
      return { said: line, pattern: new RegExp(`(?<![\\w-])${escapeRegExp(line)}(?![\\w-])`, 'i') }
    })
}

/** Every line of `text` a pattern is found in, as "name: line N: the line". */
export function wordingIn(text, patterns) {
  const found = []
  text.split('\n').forEach((line, index) => {
    for (const { said, pattern } of patterns) {
      if (pattern.test(line)) found.push({ line: index + 1, said, text: line.trim().slice(0, 160) })
    }
  })
  return found
}

const SOURCES = ['src', 'labs', 'tests', 'LESSONS.md', 'README.md']
const READ = /\.(ts|tsx|astro|mdx|md|css|cpp|h|mjs|json)$/
// The check's own test writes the phrases it looks for.
const NOT_READ = ['tests/unit/checks.test.ts']

function files(start) {
  if (!fs.existsSync(start)) return []
  if (fs.statSync(start).isFile()) return [start]
  return fs
    .readdirSync(start, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && READ.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name))
}

/** A built page as its reader reads it: the tags and the scripts gone. */
const textOf = (html) =>
  html.replace(/<(script|style|astro-island)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, '\n')

/**
 * Every place a name or a comparison is used, one line each. With `lesson`, in that lesson's own
 * files (scripts/check-lessons.mjs says which) and its page of the build in `built`.
 * @param {string} [site]
 * @param {{ lesson?: string, built?: string }} [only]
 */
export function checkWording(site = SITE, { lesson, built = path.join(site, siteFolder) } = {}) {
  const patterns = patternsOf(fs.readFileSync(NAMES, 'utf8'))
  const problems = []
  let read = 0
  for (const start of lesson ? packetFiles(lesson, site) : SOURCES) {
    for (const file of files(path.join(site, start))) {
      if (NOT_READ.includes(path.relative(site, file).split(path.sep).join('/'))) continue
      read += 1
      for (const hit of wordingIn(fs.readFileSync(file, 'utf8'), patterns)) {
        problems.push(`${path.relative(site, file)}:${hit.line}: "${hit.said}" in: ${hit.text}`)
      }
    }
  }
  const lessons = path.join(built, 'lessons', lesson ?? '')
  for (const file of fs.existsSync(lessons) ? htmlFiles(lessons) : []) {
    read += 1
    for (const hit of wordingIn(textOf(fs.readFileSync(file, 'utf8')), patterns)) {
      problems.push(`${path.relative(site, file)}: "${hit.said}" in: ${hit.text}`)
    }
  }
  return { problems, read }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [lesson, folder] = process.argv.slice(2)
  const { problems, read } = checkWording(SITE, {
    lesson,
    built: folder ? path.resolve(folder) : undefined,
  })
  for (const problem of problems) console.error(problem)
  console.log(
    problems.length
      ? `${problems.length} places use a name or a comparison the site does not (scripts/wording-names.txt).`
      : `${read} files read: none uses a name or a comparison in scripts/wording-names.txt.`,
  )
  process.exit(problems.length ? 1 : 0)
}
