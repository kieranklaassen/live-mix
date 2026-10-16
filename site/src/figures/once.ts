// What the parts of one page share while the page is built. A page's `Astro.locals` is one
// object for every component on it, so it stands for the page here: a count kept against it is
// that page's own and is gone with it.

const counts = new WeakMap<object, Map<string, number>>()

/** How many times `name` has been counted on this page, this time included: 1 the first time. */
export function countOnPage(page: object, name: string): number {
  let mine = counts.get(page)
  if (!mine) counts.set(page, (mine = new Map()))
  const count = (mine.get(name) ?? 0) + 1
  mine.set(name, count)
  return count
}

/** How many times `name` has been counted on this page so far. */
export const countedOnPage = (page: object, name: string): number =>
  counts.get(page)?.get(name) ?? 0

const starts = new WeakMap<object, Map<string, number>>()

/** A part that numbers what it holds says so before it renders them: `name` is counted from here. */
export function startOnPage(page: object, name: string): void {
  let mine = starts.get(page)
  if (!mine) starts.set(page, (mine = new Map()))
  mine.set(name, countedOnPage(page, name))
}

/** How many times `name` has been counted on this page since the last start, or since the first. */
export const sinceStartOnPage = (page: object, name: string): number =>
  countedOnPage(page, name) - (starts.get(page)?.get(name) ?? 0)
