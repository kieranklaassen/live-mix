// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import { satteri } from '@astrojs/markdown-satteri'
import { docLinks, mermaidBlocks } from './src/lib/markdown-plugins.ts'
import { COMMIT, REPO_ROOT, REPO_URL } from './src/lib/site.ts'
import { siteBase } from './scripts/site-env.mjs'

// The address comes from the environment so one build serves a path prefix or a domain's root.
const site = process.env.SITE_URL ?? 'https://kieranklaassen.github.io'

export default defineConfig({
  site,
  base: siteBase,
  trailingSlash: 'always',
  // Left off: with it on, the space between two links in running text is removed.
  compressHTML: false,
  integrations: [react(), mdx(), sitemap()],
  markdown: {
    processor: satteri({
      hastPlugins: [
        docLinks({ base: siteBase, repoRoot: REPO_ROOT, sourceUrl: `${REPO_URL}/blob/${COMMIT}/` }),
        mermaidBlocks(),
      ],
    }),
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false },
  },
  vite: {
    resolve: {
      // The library is linked from the repository's root and brings its own node_modules.
      dedupe: ['react', 'react-dom'],
    },
    server: { fs: { allow: [REPO_ROOT] } },
    worker: { format: 'es' },
  },
})
