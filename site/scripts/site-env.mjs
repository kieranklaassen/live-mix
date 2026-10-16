// Where the site is served and which browser looks at it: what the environment says, and what
// holds when it says nothing. The build, the server, the checks and the browser tests all read
// it here.
//
//   SITE_BASE          the path the site is served under ('/live-mix')
//   SITE_PORT          the port the built site is served on here (4321)
//   SITE_CHROMIUM      a Chromium to use in place of Playwright's own
//   SITE_ONLY_LESSON   a lesson's id: the build holds that lesson and the home page and nothing
//                      else, in a folder and at a port of its own (scripts/lesson.sh, which
//                      names in SITE_PORT a free port for each of its runs)
//   SITE_OWN_SERVER    set by scripts/lesson.sh: the browser tests start their own server and
//                      take none that already answers at the port (playwright.config.ts)
//   SITE_FOLDER        the folder to serve in place of the build's own, from site/. Set by
//                      scripts/lesson.sh for its browser steps: the run's own copy of its
//                      build, which another run's build of the same lesson cannot write over
//   SITE_SHARD         '1/2' or '2/2': the half of the browser tests to run (the Site workflow
//                      runs the two on two machines)
import fs from 'node:fs'

export const DEFAULT_BASE = '/live-mix'

/** The base path as the build is given it. `??`, not `||`: SITE_BASE='/' is a real answer. */
export const siteBase = process.env.SITE_BASE ?? DEFAULT_BASE

/** The base path with no slash at its end: '' at a domain's root, '/live-mix' under a prefix. */
export const basePath = siteBase.replace(/\/+$/, '')

/** The lesson a one-lesson build holds, by its id; undefined for the whole site. */
export const onlyLesson = process.env.SITE_ONLY_LESSON || undefined

/**
 * The folder the site is built into and served from, from site/, as an environment says it:
 * `dist`, or a one-lesson build's own, so that such a build never writes over the whole
 * site's; or the folder named in SITE_FOLDER.
 */
export const folderOf = (env) =>
  env.SITE_FOLDER || (env.SITE_ONLY_LESSON ? `.lesson/${env.SITE_ONLY_LESSON}` : 'dist')

export const siteFolder = folderOf(process.env)

/** A lesson's number in the map (src/content/families.json), from 1; 0 for an id not in it. */
function numberInMap(lesson) {
  const map = JSON.parse(
    fs.readFileSync(new URL('../src/content/families.json', import.meta.url), 'utf8'),
  )
  return map.flatMap((family) => family.lessons).findIndex((one) => one.id === lesson) + 1
}

/**
 * The port the built site is served on. A one-lesson build served by hand is at 4321 and the
 * lesson's number, so two lessons looked at at once do not meet each other or the whole site.
 * A run of scripts/lesson.sh names its own port in SITE_PORT (scripts/free-port.mjs): two runs
 * of one lesson would meet at the lesson's number.
 */
export const sitePort = Number(
  process.env.SITE_PORT ?? 4321 + (onlyLesson ? numberInMap(onlyLesson) : 0),
)

/** The part of the browser tests to run, as Playwright takes it; undefined for all of them. */
export function siteShard() {
  const [current, total] = (process.env.SITE_SHARD ?? '').split('/').map(Number)
  return current && total ? { current, total } : undefined
}

/** The Chromium of a machine that ships its own; undefined where Playwright is to use its own. */
export function findChromium() {
  return [process.env.SITE_CHROMIUM, '/opt/pw-browsers/chromium'].find(
    (file) => file && fs.existsSync(file),
  )
}

/** Sound starts only on a click in the page; with this a click made by a script counts as one. */
export const CHROMIUM_ARGS = ['--autoplay-policy=no-user-gesture-required']
