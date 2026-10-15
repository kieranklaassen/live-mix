import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineHastPlugin, type HastPluginEntry } from 'satteri'
import { docId, docSlug, isExcluded } from './doc-routes.ts'

interface DocLinksOptions {
  /** Astro's `base`, with or without a trailing slash. */
  base: string
  /** Absolute path of the repository root. */
  repoRoot: string
  /** Where a link to a file that is not a page goes, ending in a slash. */
  sourceUrl: string
}

const posix = (p: string) => p.split(path.sep).join('/')
const isExternal = (url: string) => /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')

/**
 * hast plugin, so it sees inline links and reference-style links alike.
 * A relative link to a doc becomes its route under `base`; any other relative link goes to the
 * source on GitHub; a root-relative link or image (/img/x.jpg, a file in public/) gets `base` in front.
 */
export function docLinks({ base, repoRoot, sourceUrl }: DocLinksOptions): HastPluginEntry {
  const docsRoot = path.join(repoRoot, 'docs')
  const root = base.replace(/\/+$/, '')
  return (doc) => {
    if (!doc.fileURL) return null
    const file = fileURLToPath(doc.fileURL)
    return defineHastPlugin({
      name: 'doc-links',
      element: [
        {
          filter: ['a'],
          visit(node, ctx) {
            const url = node.properties.href
            if (typeof url !== 'string' || !url || url.startsWith('#') || isExternal(url)) return
            if (url.startsWith('/')) {
              ctx.setProperty(node, 'href', root + url)
              return
            }
            const [rel = '', hash] = url.split('#')
            const anchor = hash ? `#${hash}` : ''
            const target = path.resolve(path.dirname(file), decodeURI(rel))
            const inDocs = posix(path.relative(docsRoot, target))
            if (!inDocs.startsWith('..') && /\.md$/i.test(inDocs) && !isExcluded(inDocs)) {
              const slug = docSlug(docId(inDocs))
              ctx.setProperty(node, 'href', `${root}/docs/${slug ? `${slug}/` : ''}${anchor}`)
            } else {
              ctx.setProperty(
                node,
                'href',
                sourceUrl + posix(path.relative(repoRoot, target)) + anchor,
              )
            }
          },
        },
        {
          filter: ['img'],
          visit(node, ctx) {
            const src = node.properties.src
            // Relative images are left alone: Astro's own image step takes them after this plugin.
            if (typeof src === 'string' && src.startsWith('/') && !src.startsWith('//')) {
              ctx.setProperty(node, 'src', root + src)
            }
          },
        },
      ],
    })
  }
}

/** hast plugin: a ```mermaid fence becomes <pre class="mermaid">, which the page's script draws. */
export function mermaidBlocks(): HastPluginEntry {
  return defineHastPlugin({
    name: 'mermaid-blocks',
    element: {
      filter: ['pre'],
      visit(node, ctx) {
        const code = node.children.find((c) => c.type === 'element' && c.tagName === 'code')
        if (!code || code.type !== 'element') return
        const classes = code.properties?.className
        if (!Array.isArray(classes) || !classes.includes('language-mermaid')) return
        return {
          type: 'element',
          tagName: 'pre',
          properties: { className: ['mermaid'] },
          children: [{ type: 'text', value: ctx.textContent(code) }],
        }
      },
    },
  })
}
