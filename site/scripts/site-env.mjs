// Where the site is served and which browser looks at it: what the environment says, and what
// holds when it says nothing. The build, the server, the checks and the browser tests all read
// it here.
//
//   SITE_BASE       the path the site is served under ('/live-mix')
//   SITE_PORT       the port the built site is served on here (4321)
//   SITE_CHROMIUM   a Chromium to use in place of Playwright's own
import fs from 'node:fs'

export const DEFAULT_BASE = '/live-mix'

/** The base path as the build is given it. `??`, not `||`: SITE_BASE='/' is a real answer. */
export const siteBase = process.env.SITE_BASE ?? DEFAULT_BASE

/** The base path with no slash at its end: '' at a domain's root, '/live-mix' under a prefix. */
export const basePath = siteBase.replace(/\/+$/, '')

export const sitePort = Number(process.env.SITE_PORT ?? 4321)

/** The Chromium of a machine that ships its own; undefined where Playwright is to use its own. */
export function findChromium() {
  return [process.env.SITE_CHROMIUM, '/opt/pw-browsers/chromium'].find(
    (file) => file && fs.existsSync(file),
  )
}

/** Sound starts only on a click in the page; with this a click made by a script counts as one. */
export const CHROMIUM_ARGS = ['--autoplay-policy=no-user-gesture-required']
