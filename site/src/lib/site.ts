// What the build knows about itself: where the site lives and which commit it was built from.
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'

export const REPO = 'kieranklaassen/live-mix'
export const REPO_URL = `https://github.com/${REPO}`
// The repository is where the linked library is. Asked of Node, not worked out from this file's
// own address: inside a built page this code runs from a bundle in another folder.
export const REPO_ROOT = path.dirname(
  createRequire(import.meta.url).resolve('@kieranklaassen/live-mix/package.json'),
)

function commit(): string {
  if (process.env.SITE_COMMIT) return process.env.SITE_COMMIT
  try {
    return execSync('git rev-parse HEAD', { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'main'
  }
}

/** The commit the site was built from, so a link to a source file never drifts from the text. */
export const COMMIT = commit()

/** A file or folder of the repository on GitHub, at the commit the site was built from. */
export function sourceUrl(path: string): string {
  const clean = path.replace(/^\/+/, '')
  return `${REPO_URL}/${clean.endsWith('/') ? 'tree' : 'blob'}/${COMMIT}/${clean}`
}
