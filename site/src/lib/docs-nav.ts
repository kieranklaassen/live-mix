import path from 'node:path'
import { docId, isExcluded } from './doc-routes.ts'

export interface DocPage {
  id: string
  title: string
}

export interface NavGroup {
  title: string
  items: { id: string; label: string }[]
}

/** Emphasis, code marks and links taken off a line of Markdown, leaving what a reader sees. */
function plain(markdown: string): string {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * The sidebar's groups, read from the docs' own index (docs/README.md): its second-level headings
 * are the groups, and the docs each one links to are its items, in the order written. A page is
 * listed once, where it is first named; pages the index does not name come last, under "More".
 */
export function docsNav(index: string, pages: DocPage[]): NavGroup[] {
  const titles = new Map(pages.map((page) => [page.id, page.title]))
  const placed = new Set(['index'])
  const groups: NavGroup[] = []
  let group: NavGroup | undefined

  for (const line of index.split('\n')) {
    const heading = /^##\s+(.+)$/.exec(line)
    if (heading) {
      group = { title: plain(heading[1] ?? ''), items: [] }
      groups.push(group)
      continue
    }
    if (!group) continue
    for (const [, text = '', url = ''] of line.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
      // The index sits at the root of docs/, so a link in it is a path from there.
      const file = path.posix.normalize(url.replace(/#.*$/, ''))
      if (!/\.md$/i.test(file) || file.startsWith('..') || isExcluded(file)) continue
      const id = docId(file)
      const title = titles.get(id)
      if (title === undefined || placed.has(id)) continue
      placed.add(id)
      // Where the index links by file name, the page's own title says more.
      group.items.push({ id, label: /\.md$/i.test(text) ? title : plain(text) })
    }
  }

  const rest = pages
    .filter((page) => !placed.has(page.id))
    .map((page) => ({ id: page.id, label: page.title }))
    .sort((a, b) => a.label.localeCompare(b.label))
  if (rest.length > 0) groups.push({ title: 'More', items: rest })
  return groups.filter((each) => each.items.length > 0)
}

/** The first paragraph under a doc's title, as plain text short enough for a search result. */
export function docDescription(body: string): string | undefined {
  const blocks = body.split(/\n\s*\n/).map((block) => block.trim())
  const first = blocks.find((block) => block && !/^(#|>)/.test(block))
  // A doc that opens with a table, a list, code or markup has no sentence to offer.
  if (!first || /^([|<`~]|[-*+]\s|\d+\.\s)/.test(first)) return undefined
  const text = plain(first)
  if (text.length <= 160) return text
  return `${text.slice(0, 160).replace(/\s+\S*$/, '')}…`
}
