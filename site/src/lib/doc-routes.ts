/** One rule for a doc's id, used by the loader (generateId) and by the link rewriter. */
export const EXCLUDED_DIRS = ['plans', 'solutions', 'api']

/**
 * 'concepts/Time Line.md' -> 'concepts/time-line', 'README.md' -> 'index'.
 * A README is its folder's page, as it is where the docs are read as files.
 */
export function docId(relPath: string): string {
  return relPath
    .replace(/\\/g, '/')
    .replace(/\.md$/i, '')
    .replace(/(^|\/)readme$/i, '$1index')
    .split('/')
    .map((part) =>
      part
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    )
    .join('/')
}

/** 'index' -> '', 'concepts/index' -> 'concepts', 'concepts/time' -> 'concepts/time' */
export function docSlug(id: string): string {
  return id.replace(/(^|\/)index$/, '')
}

/** The path of a doc's page under the site's root, for `href()`: 'docs/', 'docs/concepts/time/'. */
export function docPath(id: string): string {
  const slug = docSlug(id)
  return slug ? `docs/${slug}/` : 'docs/'
}

export function isExcluded(relPath: string): boolean {
  return EXCLUDED_DIRS.includes(relPath.replace(/\\/g, '/').split('/')[0] ?? '')
}
