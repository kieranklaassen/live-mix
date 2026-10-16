// A listing is a piece of a file of the repository, shown in a lesson. Its lines are named by
// text they hold and never by number, so when the file has moved on the build fails and the
// page does not show, or link to, lines that are no longer the ones it meant.
import fs from 'node:fs'
import path from 'node:path'
import { REPO_ROOT, sourceUrl } from './site.ts'

/** Lines of a file, counted from 1, the last one among them. */
export interface Lines {
  first: number
  last: number
}

/** Who asks and of which file, for an error's first words. */
export interface Where {
  lesson?: string
  file: string
}

const who = (where: Where) => where.lesson ?? 'A page'
const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * The lines `text` lies on in `source`, or in the lines `within` of it. A space in the text
 * stands for any run of spaces and line breaks, so "return y; }" names a closing brace that
 * stands on a line of its own. Throws when the text is not there, or is there more than once.
 */
export function linesOf(source: string, text: string, where: Where, within?: Lines): Lines {
  const starts = [0]
  for (let at = source.indexOf('\n'); at !== -1; at = source.indexOf('\n', at + 1))
    starts.push(at + 1)
  const lineAt = (offset: number) => starts.findLastIndex((start) => start <= offset) + 1
  const from = within ? starts[within.first - 1] : 0
  const to = within ? (starts[within.last] ?? source.length) : source.length

  const pattern = new RegExp(text.trim().split(/\s+/).map(escaped).join('\\s+'), 'g')
  const found = [...source.slice(from, to).matchAll(pattern)].map((match) => ({
    first: lineAt(from + match.index),
    last: lineAt(from + match.index + Math.max(match[0].length - 1, 0)),
  }))
  if (found.length === 1) return found[0]

  const place = within ? `lines ${within.first} to ${within.last} of ${where.file}` : where.file
  const once = 'A listing and a link to the source name text that is there once.'
  if (found.length === 0) throw new Error(`${who(where)}: "${text}" is not in ${place}. ${once}`)
  const lines = found.slice(0, 3).map((one) => one.first)
  const listed =
    found.length > 3
      ? `${lines.join(', ')} and ${found.length - 3} more`
      : `${lines.slice(0, -1).join(', ')} and ${lines.at(-1)}`
  throw new Error(
    `${who(where)}: "${text}" is in ${place} ${found.length} times, at lines ${listed}. ${once}`,
  )
}

/**
 * The lines from the text `from` to the text `to`, both among them; with no `to`, the lines of
 * `from` alone. Each text is looked for in the whole of `source`, or in the lines `within`.
 */
export function rangeOf(
  source: string,
  from: string,
  to: string | undefined,
  where: Where,
  within?: Lines,
): Lines {
  const start = linesOf(source, from, where, within)
  if (to === undefined) return start
  const end = linesOf(source, to, where, within)
  if (end.last < start.first) {
    throw new Error(
      `${who(where)}: in ${where.file}, "${to}" (line ${end.last}) is above "${from}" (line ${start.first}).`,
    )
  }
  return { first: start.first, last: end.last }
}

/** A file of the repository as text. Throws, naming the lesson, when it is not there. */
export function readSource(file: string, lesson?: string): string {
  const full = path.join(REPO_ROOT, file)
  if (!fs.existsSync(full)) {
    throw new Error(`${lesson ?? 'A page'} names ${file}, which is not in the repository.`)
  }
  return fs.readFileSync(full, 'utf8')
}

/**
 * The lines of the file `file` of the repository that the text `at` lies on, or the lines from
 * `at` to the text `to`: what a link to the source is made from.
 */
export function sourceLines(file: string, at: string, to?: string, lesson?: string): Lines {
  return rangeOf(readSource(file, lesson), at, to, { lesson, file })
}

/** Lines as the end of a link to a source file: "#L40" or "#L40-L62". */
export function lineAnchor({ first, last }: Lines): string {
  return first === last ? `#L${first}` : `#L${first}-L${last}`
}

/**
 * The anchor of a link to a file of the engine, as <Src> writes it: the line its `at` is on,
 * the lines from there to its `to`, or nothing for the whole file. A link is never given by
 * line numbers: they move when the file does and nothing would say so, so `lines` stops the
 * build, naming the lesson and the file.
 */
export function sourceAnchor(
  file: string,
  asked: { at?: string; to?: string; lines?: unknown },
  lesson?: string,
): string {
  if (asked.lines !== undefined) {
    throw new Error(
      `${lesson ?? 'A page'}: <Src path="${file}" lines="${String(asked.lines)}"> gives its lines by number, ` +
        `which moves when the file does. Give text that is on the line, <Src path="${file}" at="…">, ` +
        `and for several lines text on the last as well, to="…".`,
    )
  }
  return asked.at === undefined ? '' : lineAnchor(sourceLines(file, asked.at, asked.to, lesson))
}

/** What of a file a listing shows. */
export interface Cut {
  /** Text on the first line shown. */
  from: string
  /** Text on the last line shown. */
  to: string
  /** Text on a line to mark as new, or several. Each is in the lines shown, once. */
  mark?: string | string[]
  /** Lines to leave out, from one text to another: shown as one line that says how many. */
  skip?: [from: string, to: string]
  /**
   * Lines an equation links to, each under a key: text on the line, in the lines shown, once.
   * The line with the key `coeff` of the listing `pole` has the id `pole-coeff`.
   */
  at?: Record<string, string>
}

/** One line of a listing as shown: a line of the file, or the place where lines are left out. */
export type Row = { line: number; marked: boolean; key?: string } | { gap: number }

/** A key a line is linked by: small letters, digits and hyphens, and not a line's number. */
const KEY = /^[a-z][a-z0-9-]*$/

/** The rows a listing shows, each line with its number in the file. */
export function rowsOf(source: string, cut: Cut, where: Where): Row[] {
  const range = rangeOf(source, cut.from, cut.to, where)
  const marked = new Set<number>()
  for (const text of [cut.mark ?? []].flat()) {
    const { first, last } = linesOf(source, text, where, range)
    for (let line = first; line <= last; line++) marked.add(line)
  }
  const left = cut.skip && rangeOf(source, cut.skip[0], cut.skip[1], where, range)

  const keys = new Map<number, string>()
  for (const [key, text] of Object.entries(cut.at ?? {})) {
    if (!KEY.test(key) || /^l\d+$/.test(key)) {
      throw new Error(
        `${who(where)}: a line of ${where.file} is given the key "${key}". A key is small ` +
          `letters, digits and hyphens, begins with a letter, and is not a line's number.`,
      )
    }
    const { first: line } = linesOf(source, text, where, range)
    if (left && line >= left.first && line <= left.last) {
      throw new Error(
        `${who(where)}: the line "${text}" of ${where.file}, with the key "${key}", is among the lines left out.`,
      )
    }
    if (keys.has(line)) {
      throw new Error(
        `${who(where)}: line ${line} of ${where.file} is given two keys, "${keys.get(line)}" and "${key}". One will do.`,
      )
    }
    keys.set(line, key)
  }

  const rows: Row[] = []
  for (let line = range.first; line <= range.last; line++) {
    if (!left || line < left.first || line > left.last) {
      const key = keys.get(line)
      rows.push(key ? { line, marked: marked.has(line), key } : { line, marked: marked.has(line) })
    } else if (line === left.first) rows.push({ gap: left.last - left.first + 1 })
  }
  return rows
}

/** A node of the highlighter's tree, as much of one as is touched here. */
interface Node {
  properties: Record<string, unknown>
  children: unknown[]
}

/** What the highlighter is handed to cut and number a listing: one of its transformers. */
export interface LineTransformer {
  name: string
  tokens<Token>(lines: Token[][]): Token[][]
  line(node: Node, index: number): void
}

/**
 * Cuts a whole file, already coloured, down to `rows`. The file is coloured first so that a
 * listing which starts inside a comment is still coloured as one. Each line gets its number in
 * the file, linked to `href(line)`; a line with a key gets the id `<name>-<key>`, which a term
 * of an equation links to. A line has no id by its number: the number moves when the file does.
 */
export function listingLines(
  rows: readonly Row[],
  to: { name: string; href: (line: number) => string },
): LineTransformer {
  return {
    name: 'listing-lines',
    tokens: (lines) => rows.map((row) => ('gap' in row ? [] : lines[row.line - 1])),
    line(node, index) {
      const row = rows[index - 1]
      if ('gap' in row) {
        node.properties.class = 'line gap'
        node.children = [
          { type: 'text', value: `${row.gap} ${row.gap === 1 ? 'line' : 'lines'} left out` },
        ]
        return
      }
      if (row.key) node.properties.id = `${to.name}-${row.key}`
      if (row.marked) node.properties.class = 'line marked'
      // The number is for the eye and the mouse. The caption's link is the one read out and
      // reached by keyboard, so a listing is not forty stops on the way down a page.
      node.children.unshift({
        type: 'element',
        tagName: 'a',
        properties: {
          class: 'ln',
          href: to.href(row.line),
          tabindex: '-1',
          'aria-hidden': 'true',
        },
        children: [{ type: 'text', value: String(row.line) }],
      })
    },
  }
}

/** What a lesson writes on a listing. */
export interface ListingProps extends Cut {
  /** The file, from the repository's root: "cpp/kit/filters.h". */
  file: string
  /** The start of the ids of its keyed lines. The file's name without its ending when not given. */
  name?: string
}

// The names the listings of each page have taken, by the page's own object.
const taken = new WeakMap<object, Set<string>>()

/**
 * Everything the listing component needs: the file's text, its language, the rows as a
 * transformer, and the link to the lines at the commit built. `page` is an object that lasts as
 * long as the page is being built; two listings of one page may not share a name, because the
 * ids of their lines would collide.
 */
export function listingOf(props: ListingProps, page: object, lesson?: string) {
  const { file } = props
  const where = { lesson, file }
  const source = readSource(file, lesson)
  const lines = rangeOf(source, props.from, props.to, where)
  const rows = rowsOf(source, props, where)

  const name = props.name ?? path.basename(file).replace(/\.[^.]*$/, '')
  const names = taken.get(page) ?? new Set<string>()
  taken.set(page, names)
  if (names.has(name)) {
    throw new Error(
      `${who(where)}: two listings are called "${name}", so their lines would share ids. ` +
        `Give one of them a name of its own: <Listing name="…">.`,
    )
  }
  names.add(name)

  const lang = /\.tsx$/.test(file)
    ? ('tsx' as const)
    : /\.ts$/.test(file)
      ? ('ts' as const)
      : /\.(h|cpp)$/.test(file)
        ? ('cpp' as const)
        : ('plaintext' as const)
  return {
    source,
    lang,
    name,
    lines,
    href: `${sourceUrl(file)}${lineAnchor(lines)}`,
    transformer: listingLines(rows, { name, href: (line) => `${sourceUrl(file)}#L${line}` }),
  }
}
