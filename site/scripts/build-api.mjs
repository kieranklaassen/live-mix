// Puts the API reference into the built site, under api/, between `astro build` and Pagefind.
//
//   node scripts/build-api.mjs            writes site/dist/api
//   node scripts/build-api.mjs <folder>   writes <folder>/api, for a site built somewhere else
//   SITE_API_REUSE=1                      uses docs/api as it is, without running TypeDoc again
//
// TypeDoc is the repository's own (`docs:api` in the root, typedoc.json): it writes docs/api,
// which git ignores, and that folder is copied here.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { htmlFiles } from './shared.mjs'

const site = fileURLToPath(new URL('..', import.meta.url))
const repo = path.resolve(site, '..')
const source = path.join(repo, 'docs/api')
const target = path.join(path.resolve(process.argv[2] ?? path.join(site, 'dist')), 'api')

if (process.env.SITE_API_REUSE !== '1') {
  execFileSync('pnpm', ['-C', repo, 'docs:api'], { stdio: 'inherit' })
}

// Emptied first: a page of a class that is gone must not stay in the site or in the search.
fs.rmSync(target, { recursive: true, force: true })
fs.cpSync(source, target, { recursive: true })

// The site's pages mark what Pagefind reads with data-pagefind-body, and once any page of a site
// does, Pagefind leaves out every page that does not. So TypeDoc's pages get the mark too, on
// the column that holds the text: its menus and its own search box stay out of the index.
// The filter is what the search page tells the reference from the rest of the site by.
const COLUMN = '<div class="col-content">'
const MARKED_COLUMN =
  '<div class="col-content" data-pagefind-body data-pagefind-filter="section:API">'
// A tag is set against the name it follows with no space between ("Variable DECAYConst"), and
// that is how the search would print it. Left out of the index, the name stands alone.
const TAG = '<code class="tsd-tag">'
const IGNORED_TAG = '<code class="tsd-tag" data-pagefind-ignore>'
let pages = 0
let marked = 0
for (const file of htmlFiles(target)) {
  const html = fs.readFileSync(file, 'utf8')
  pages += 1
  if (!html.includes(COLUMN)) continue
  fs.writeFileSync(file, html.replace(COLUMN, MARKED_COLUMN).replaceAll(TAG, IGNORED_TAG))
  marked += 1
}

// None marked means TypeDoc's markup changed, and the whole reference would drop out of the search
// without a word.
if (marked === 0) {
  throw new Error(`build-api: none of the ${pages} pages in ${target} has ${COLUMN} to mark`)
}
console.log(`build-api: ${pages} pages in ${target}, ${marked} marked for the search`)
