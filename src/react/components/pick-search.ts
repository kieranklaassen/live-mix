// Searching a picker: a list of effects, of presets or of chains matches the
// same way in every app that draws one, so a word finds the same things
// wherever it is typed. Moved here from Ambient Live. Nothing in this file
// needs React or a document.

/** The words of a query, lower case; an empty query has none and matches everything. */
export function queryWords(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean)
}

/** A stretch of a name a query word was found in: [start, end), for drawing it in the accent. */
export type MatchRange = readonly [start: number, end: number]

/** For each character of a text's lower case, the character of the text it came from. */
function origins(text: string): number[] {
  const from: number[] = []
  for (let at = 0; at < text.length; at++) {
    for (let count = text[at].toLowerCase().length; count > 0; count--) from.push(at)
  }
  return from
}

/** Where the query's words are found in a text, in order and without overlaps. */
export function matchRanges(text: string, query: string): MatchRange[] {
  const lower = text.toLowerCase()
  // A letter can be longer in lower case (the dotted capital I is two characters there), and all that follows it stands further on.
  const from = lower.length === text.length ? null : origins(text)
  const found: [number, number][] = []
  for (const word of queryWords(query)) {
    const at = lower.indexOf(word)
    if (at < 0) continue
    const end = at + word.length
    found.push(from ? [from[at], from[end - 1] + 1] : [at, end])
  }
  found.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const range of found) {
    const last = merged[merged.length - 1]
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1])
    else merged.push([...range])
  }
  return merged
}

/** What a row can be found by: its name first, then whatever else describes it. */
export interface Searchable {
  name: string
  /** Kind, maker, the instrument a preset belongs to, control names: found, but ranked under a name. */
  more?: readonly string[]
  /** It stands under another row (a preset under its effect): where two answer a query alike, the one that stands alone leads. */
  nested?: boolean
}

/**
 * How well a row answers a query, or null when it does not: 0 when every word
 * is in the name and the name starts with the first, 1 when every word is in
 * the name, 2 when some word is only in the rest. An empty query scores 0.
 */
export function searchScore(row: Searchable, query: string): 0 | 1 | 2 | null {
  const words = queryWords(query)
  if (words.length === 0) return 0
  const name = row.name.toLowerCase()
  const more = (row.more ?? []).join(' \u0000 ').toLowerCase()
  let inName = true
  for (const word of words) {
    if (name.includes(word)) continue
    if (!more.includes(word)) return null
    inName = false
  }
  if (!inName) return 2
  return name.startsWith(words[0]) ? 0 : 1
}

/**
 * The rows a query finds, best first. Among rows that score alike, a name
 * that is the query word for word leads ("chorus" finds Chorus before
 * Chorused), then a row that stands alone leads one that stands under
 * another (an effect before a preset of some effect); the rest keep their order.
 */
export function searchRows<T extends Searchable>(rows: readonly T[], query: string): T[] {
  const words = queryWords(query)
  if (words.length === 0) return [...rows]
  const whole = words.join(' ')
  return rows
    .map((row, index) => ({ row, index, score: searchScore(row, query) }))
    .filter((entry): entry is { row: T; index: number; score: 0 | 1 | 2 } => entry.score !== null)
    .map((entry) => ({
      ...entry,
      inexact: queryWords(entry.row.name).join(' ') === whole ? 0 : 1,
      nested: entry.row.nested ? 1 : 0,
    }))
    .sort(
      (a, b) =>
        a.score - b.score || a.inexact - b.inexact || a.nested - b.nested || a.index - b.index,
    )
    .map((entry) => entry.row)
}
