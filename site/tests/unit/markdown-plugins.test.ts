import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { satteri } from '@astrojs/markdown-satteri'
import { describe, expect, it } from 'vitest'
import config from '../../astro.config.mjs'
import { docLinks } from '../../src/lib/markdown-plugins.ts'
import { COMMIT, REPO_ROOT, REPO_URL } from '../../src/lib/site.ts'

// The processor is the one the site's config makes, so the plugins run in their real place:
// after the highlighter, before Astro's image and heading steps.
const markdown = config.markdown!
const shared = { syntaxHighlight: markdown.syntaxHighlight, shikiConfig: markdown.shikiConfig }
const site = await markdown.processor!.createRenderer(shared as never)

const base = (config.base ?? '').replace(/\/+$/, '')
const source = `${REPO_URL}/blob/${COMMIT}/`
const doc = (rel: string) => pathToFileURL(path.join(REPO_ROOT, 'docs', rel))

async function html(text: string, from = 'getting-started.md', renderer = site): Promise<string> {
  return (await renderer.render(text, { fileURL: doc(from) })).code
}

describe('links between docs', () => {
  it('sends a relative link to a doc to its page, keeping the anchor', async () => {
    const out = await html('See [devices](./concepts/devices.md#the-c-abi).')
    expect(out).toContain(`<a href="${base}/docs/concepts/devices/#the-c-abi">devices</a>`)
  })

  it('rewrites a reference-style link the same way', async () => {
    const out = await html('See [devices][d].\n\n[d]: ./concepts/devices.md#the-c-abi\n')
    expect(out).toContain(`<a href="${base}/docs/concepts/devices/#the-c-abi">devices</a>`)
  })

  it('resolves a link from the folder of the doc it is in', async () => {
    const out = await html(
      '[Time](./time.md) and [the catalogue](../devices.md)',
      'concepts/mixer.md',
    )
    expect(out).toContain(`href="${base}/docs/concepts/time/"`)
    expect(out).toContain(`href="${base}/docs/devices/"`)
  })

  it('sends a link to the docs README to the docs index', async () => {
    const out = await html('[All docs](../README.md#recipes)', 'concepts/mixer.md')
    expect(out).toContain(`href="${base}/docs/#recipes"`)
  })

  it('leaves a link within the page and a link to another site as they are', async () => {
    const out = await html('[down](#layout) and [out](https://example.com/a.md)')
    expect(out).toContain('href="#layout"')
    expect(out).toContain('href="https://example.com/a.md"')
  })

  it('works at a domain root, where the base is a slash', async () => {
    const root = await satteri({
      hastPlugins: [docLinks({ base: '/', repoRoot: REPO_ROOT, sourceUrl: source })],
    }).createRenderer(shared as never)
    const out = await html('[devices](./concepts/devices.md#the-c-abi)', 'getting-started.md', root)
    expect(out).toContain('href="/docs/concepts/devices/#the-c-abi"')
  })
})

describe('links to files that are not pages', () => {
  it('sends a source file to GitHub at the commit the site was built from', async () => {
    const out = await html('[the engine](../src/core/engine.ts#L10)')
    expect(out).toContain(`href="${source}src/core/engine.ts#L10"`)
  })

  it('sends a plan, which has no page, to GitHub', async () => {
    const out = await html('[the plan](./plans/x.md)')
    expect(out).toContain(`href="${source}docs/plans/x.md"`)
  })

  it('sends the README of the repository to GitHub', async () => {
    const out = await html('[README](../README.md#quick-start)')
    expect(out).toContain(`href="${source}README.md#quick-start"`)
  })
})

describe('mermaid blocks', () => {
  const fence = '```mermaid\nflowchart LR\n  A["Audio<br/>clips"] --> B[strip]\n```\n'

  // The source is escaped as any text is; the script that draws it reads it back unescaped.
  it('become a pre.mermaid that holds the source, not highlighted', async () => {
    const out = await html(fence)
    expect(out).toContain(
      '<pre class="mermaid">flowchart LR\n  A["Audio&lt;br/&gt;clips"] --&gt; B[strip]\n</pre>',
    )
    expect(out).not.toContain('astro-code')
    expect(out).not.toContain('<code')
  })

  it('leave other code blocks to the highlighter', async () => {
    const out = await html('```ts\nconst a = 1\n```\n')
    expect(out).toContain('astro-code')
    expect(out).not.toContain('class="mermaid"')
  })
})

describe('heading anchors', () => {
  // GitHub's rule: lower case, punctuation dropped, each space a hyphen, a repeat numbered.
  it.each([
    ['## The C ABI', 'the-c-abi'],
    ['## What `render()` returns', 'what-render-returns'],
    ['## Why `docs/api` is generated, not committed', 'why-docsapi-is-generated-not-committed'],
    ['## Node, WASM & worklet', 'node-wasm--worklet'],
    ["## The engine's clock", 'the-engines-clock'],
  ])('%s -> #%s', async (heading, id) => {
    expect(await html(`${heading}\n`)).toContain(`id="${id}"`)
  })

  it('numbers a heading that repeats', async () => {
    const out = await html('## Layout\n\n## Layout\n')
    expect(out).toContain('id="layout"')
    expect(out).toContain('id="layout-1"')
  })
})

describe('images', () => {
  it('leaves a relative image to Astro, which copies the file and sizes it', async () => {
    const result = await site.render('![Plates](./images/plates.jpg)', { fileURL: doc('react.md') })
    expect(result.metadata.localImagePaths).toEqual(['./images/plates.jpg'])
    expect(result.code).toContain('__ASTRO_IMAGE_')
  })
})
