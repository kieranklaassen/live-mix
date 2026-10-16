// @ts-check
import { fileURLToPath } from 'node:url'
import { defineConfig, fontProviders } from 'astro/config'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import { satteri } from '@astrojs/markdown-satteri'
import { codeTheme } from './src/lib/code-theme.ts'
import { docLinks, mermaidBlocks } from './src/lib/markdown-plugins.ts'
import { COMMIT, REPO_ROOT, REPO_URL } from './src/lib/site.ts'
import { onlyLesson, siteBase, siteFolder } from './scripts/site-env.mjs'

// The address comes from the environment so one build serves a path prefix or a domain's root.
const site = process.env.SITE_URL ?? 'https://kieranklaassen.github.io'

// The typefaces are packages in package.json, read from node_modules: no request for a font
// leaves the build or the page.
const installed = fontProviders.npm({ remote: false })
/**
 * Two things the provider leaves undone for a package of this kind, as astro 7.4.0 reads it. It
 * names an installed file by a `file://` address, and the build reads a file only when it is
 * given a path. And it hands back every alphabet the package has, whatever `subsets` asks for:
 * which one a file holds is in its name, `<package>/files/<package>-<alphabet>-wght-normal.woff2`.
 * @type {typeof installed}
 */
const packaged = {
  ...installed,
  async resolveFont(options) {
    const found = await installed.resolveFont(options)
    if (!found) return found
    const asked = found.fonts.filter((font) =>
      font.src.every((source) => {
        if (!('url' in source) || !source.url.startsWith('file:')) return true
        source.url = fileURLToPath(source.url)
        const subset = /\/([^/]+)\/files\/\1-(.+)-wght-/.exec(source.url)?.[2]
        return !subset || options.subsets.includes(subset)
      }),
    )
    return { ...found, fonts: asked }
  },
}

/**
 * A one-lesson build (scripts/lesson.sh) holds the home page and that lesson's page. Every other
 * page of src/pages is read as one that has no paths and answers with nothing: no file is
 * written for it and nothing it imports is built.
 * @type {import('vite').Plugin}
 */
const homeAndLessonOnly = {
  name: 'site:one-lesson',
  enforce: 'pre',
  load(id) {
    const pages = fileURLToPath(new URL('./src/pages/', import.meta.url))
    if (!id.startsWith(pages) || id.includes('?')) return
    if (['index.astro', 'lessons/[slug].astro'].includes(id.slice(pages.length))) return
    return '---\nexport const getStaticPaths = () => []\nreturn new Response(null)\n---\n'
  },
}

export default defineConfig({
  site,
  base: siteBase,
  // The whole site is built into dist; a one-lesson build into a folder of its own.
  outDir: siteFolder,
  trailingSlash: 'always',
  // Left off: with it on, the space between two links in running text is removed.
  compressHTML: false,
  integrations: [react(), mdx(), sitemap()],
  // The provider finds the package by the family's name: each is the family its package declares.
  fonts: [
    {
      provider: packaged,
      name: 'Jost Variable',
      cssVariable: '--font-sans',
      weights: ['100 900'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: packaged,
      name: 'JetBrains Mono Variable',
      cssVariable: '--font-mono',
      weights: ['100 800'],
      styles: ['normal'],
      // Greek too: a caption or a listing may hold a letter of an equation.
      subsets: ['latin', 'greek'],
      fallbacks: ['monospace'],
    },
  ],
  markdown: {
    processor: satteri({
      hastPlugins: [
        docLinks({ base: siteBase, repoRoot: REPO_ROOT, sourceUrl: `${REPO_URL}/blob/${COMMIT}/` }),
        mermaidBlocks(),
      ],
    }),
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    // Fenced code in the docs takes the colours a lesson's listing does.
    shikiConfig: { theme: codeTheme },
  },
  vite: {
    plugins: onlyLesson ? [homeAndLessonOnly] : [],
    resolve: {
      // The library is linked from the repository's root and brings its own node_modules.
      dedupe: ['react', 'react-dom'],
    },
    server: { fs: { allow: [REPO_ROOT] } },
    worker: { format: 'es' },
  },
})
