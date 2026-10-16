// The port a one-lesson run serves its build at (scripts/free-port.mjs): its own, and free.
import fs from 'node:fs'
import net from 'node:net'
import { afterAll, describe, expect, it } from 'vitest'
import { freePort, PORTS, portFor } from '../../scripts/free-port.mjs'
import { folderOf } from '../../scripts/site-env.mjs'

const open: net.Server[] = []
afterAll(() => open.forEach((server) => server.close()))

/** A server holding a port, as another run's would. */
const holding = (port: number) =>
  new Promise<net.Server>((resolve, reject) => {
    const server = net.createServer()
    open.push(server)
    server.once('error', reject)
    server.listen(port, () => resolve(server))
  })

const read = (file: string) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8')

describe('the port of a one-lesson run', () => {
  it('comes from the lesson and the process, so two runs of one lesson start apart', () => {
    const first = portFor('compression', 4000)
    expect(portFor('compression', 4000)).toBe(first)
    expect(portFor('compression', 4001)).not.toBe(first)
    expect(portFor('limiting', 4000)).not.toBe(first)
    // A lesson the map does not list yet still gets a port.
    expect(portFor('no-such-lesson', 4000)).not.toBe(portFor('no-such-lesson', 4001))
  })

  it('stays within its range, clear of the whole site’s port and of the ports a system hands out', () => {
    for (const lesson of ['compression', 'wavetables', 'no-such-lesson']) {
      for (const process of [1, 77, 4_194_304, 32_768, 99_999]) {
        const port = portFor(lesson, process)
        expect(port).toBeGreaterThanOrEqual(PORTS.first)
        expect(port).toBeLessThan(PORTS.first + PORTS.count)
      }
    }
    expect(PORTS.first).toBeGreaterThan(4321 + 64)
    expect(PORTS.first + PORTS.count).toBeLessThanOrEqual(32_768)
  })

  it('is one nobody holds: a port in use is passed over for the next that is free', async () => {
    const taken = await freePort(portFor('compression', process.pid))
    await holding(taken)
    const next = await freePort(taken)
    expect(next).not.toBe(taken)
    // It can be listened on.
    await holding(next)
  })

  it('is what the browser step of lesson.sh serves at, and that step starts its own server', () => {
    const script = read('scripts/lesson.sh')
    // A port the caller names is kept; otherwise it is found as the step starts.
    expect(script).toContain('port="${SITE_PORT:-$(node scripts/free-port.mjs "$id" $$)}"')
    expect(script).toContain(
      'env SITE_PORT="$port" SITE_OWN_SERVER=1 SITE_ONLY_LESSON="$id" SITE_FOLDER="$kept" "$@"',
    )
    const steps = script.split('\n').filter((line) => /^step (browser|map) /.test(line))
    expect(steps.map((line) => line.split(' ').slice(0, 4).join(' '))).toEqual([
      'step browser heavy browse',
      'step map light browse',
    ])
    // No step that looks at pages sets the lesson's fixed port aside any more, or goes round `browse`.
    expect(script.match(/playwright test/g)).toHaveLength(2)
    // A server that answers at that port is never taken for the run's own.
    expect(read('playwright.config.ts')).toMatch(
      /reuseExistingServer: !process\.env\.CI && !process\.env\.SITE_OWN_SERVER/,
    )
  })
})

describe('the build a one-lesson run looks at', () => {
  it('is the whole site in dist, one lesson in its own folder, or the folder a run names', () => {
    expect(folderOf({})).toBe('dist')
    expect(folderOf({ SITE_ONLY_LESSON: 'compression' })).toBe('.lesson/compression')
    expect(
      folderOf({ SITE_ONLY_LESSON: 'compression', SITE_FOLDER: '.lesson/.runs/compression.77' }),
    ).toBe('.lesson/.runs/compression.77')
    expect(folderOf({ SITE_FOLDER: '' })).toBe('dist')
  })

  it('is a copy that is the run’s own, made while the run still holds the build’s slot', () => {
    const script = read('scripts/lesson.sh')
    expect(script).toContain('kept=".lesson/.runs/$id.$$"')
    // The build never writes into a copy: it is given no folder, and writes the lesson's own.
    expect(script).toContain(
      'env -u SITE_PORT -u SITE_FOLDER SITE_ONLY_LESSON="$id" pnpm exec astro build',
    )
    expect(script).toContain('step build build build_site')
    // What is checked and what is looked at is the copy, which no other run's build writes over.
    expect(script).toContain('step wording light node scripts/check-wording.mjs "$id" "$kept"')
    expect(script).toContain('step shape light node scripts/check-lessons.mjs "$id" "$kept"')
    // The copy goes when the run ends.
    expect(script).toMatch(/trap '[^']*rm -rf "\$kept"[^']*' EXIT/)
  })
})
