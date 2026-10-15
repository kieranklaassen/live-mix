/** One rule for a doc's id, used by the loader (generateId) and by the link rewriter. */
export const EXCLUDED_DIRS = ['plans', 'solutions', 'api']

/** 'concepts/Time Line.md' -> 'concepts/time-line' */
export function docId(relPath: string): string {
  return relPath
    .replace(/\\/g, '/')
    .replace(/\.md$/i, '')
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

export function isExcluded(relPath: string): boolean {
  return EXCLUDED_DIRS.includes(relPath.replace(/\\/g, '/').split('/')[0] ?? '')
}
