/** The site's base path without a trailing slash: '' at a domain's root, '/live-mix' under a prefix. */
export const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '')

/** A link to a page or a file of the site: `href('lessons/')` is right under any base. */
export function href(path = ''): string {
  return `${BASE}/${path.replace(/^\/+/, '')}`
}
