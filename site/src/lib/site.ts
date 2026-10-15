// What the build knows about itself: where the site lives and which commit it was built from.
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const REPO = 'kieranklaassen/live-mix'
export const REPO_URL = `https://github.com/${REPO}`
export const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url))

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
