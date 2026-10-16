// Follows every link of the built site that points into the site and fails on one that leads
// nowhere: a page that is not there, a file that is not there, a heading that is not on the
// page. Links out to other sites are counted and not fetched.
//
//   node scripts/check-links.mjs [folder]     # site/dist, served under SITE_BASE ('/live-mix')
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { htmlFiles } from './shared.mjs'
import { DEFAULT_BASE, siteBase } from './site-env.mjs'

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const ATTRIBUTE = /\s(?:href|src)=(?:"([^"]*)"|'([^']*)')/g
const ID = /\sid=(?:"([^"]*)"|'([^']*)')/g
const TAG_WITH_LINK = /<(a|link|script|img|source|iframe)\b[^>]*>/gi

/** The file a path of the site is answered with, or undefined when there is none. */
function fileFor(dist, pathname) {
  const file = path.join(dist, decodeURIComponent(pathname))
  if (!file.startsWith(dist)) return undefined
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return file
  const index = path.join(file, 'index.html')
  if (fs.existsSync(index)) return index
  return undefined
}

/**
 * What is wrong with the links of the site built in `dist` and served under `base`, one line
 * each. `skipAnchors` names folders whose pages' headings are not looked for (the API
 * reference: thousands of pages another tool writes).
 */
export function checkLinks(dist, base = DEFAULT_BASE, { skipAnchors = ['api'] } = {}) {
  const root = base.replace(/\/+$/, '')
  const targets = new Map()
  const targetOf = (pathname) => {
    if (!targets.has(pathname)) targets.set(pathname, fileFor(dist, pathname))
    return targets.get(pathname)
  }
  const ids = new Map()
  const idsOf = (file) => {
    if (!ids.has(file)) {
      const html = fs.readFileSync(file, 'utf8')
      ids.set(file, new Set([...html.matchAll(ID)].map((match) => match[1] ?? match[2])))
    }
    return ids.get(file)
  }
  const problems = []
  let internal = 0
  let external = 0
  for (const file of htmlFiles(dist)) {
    const page = path.relative(dist, file)
    // Pagefind's own fragments are not pages.
    if (page.startsWith('pagefind')) continue
    const html = fs.readFileSync(file, 'utf8')
    const here = `${root}/${page.split(path.sep).join('/')}`.replace(/index\.html$/, '')
    for (const tag of html.match(TAG_WITH_LINK) ?? []) {
      for (const match of tag.matchAll(ATTRIBUTE)) {
        const link = (match[1] ?? match[2]).replaceAll('&amp;', '&')
        if (link === '' || /^(data|mailto|tel|javascript|blob):/i.test(link)) continue
        if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(link)) {
          external += 1
          continue
        }
        internal += 1
        const url = new URL(link, `http://site${here}`)
        if (url.pathname !== root && !url.pathname.startsWith(`${root}/`)) {
          problems.push(`${page}: ${link} leaves the site's base path ${root}/`)
          continue
        }
        const target = targetOf(url.pathname.slice(root.length))
        if (!target) {
          problems.push(`${page}: ${link} leads to nothing`)
          continue
        }
        const anchor = decodeURIComponent(url.hash.slice(1))
        const skipped = skipAnchors.some((folder) =>
          path.relative(dist, target).startsWith(`${folder}${path.sep}`),
        )
        if (anchor && target.endsWith('.html') && !skipped && !idsOf(target).has(anchor)) {
          problems.push(`${page}: ${link} names #${anchor}, which is not on that page`)
        }
      }
    }
  }
  return { problems, internal, external }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = path.resolve(process.argv[2] ?? path.join(SITE, 'dist'))
  if (!fs.existsSync(dist)) {
    console.error(`${dist} is not there. Build the site first: pnpm build`)
    process.exit(1)
  }
  const { problems, internal, external } = checkLinks(dist, siteBase)
  for (const problem of problems) console.error(problem)
  console.log(
    problems.length
      ? `${problems.length} dead links among ${internal} inside the site.`
      : `${internal} links inside the site, none dead. ${external} lead out of it and were not followed.`,
  )
  process.exit(problems.length ? 1 : 0)
}
