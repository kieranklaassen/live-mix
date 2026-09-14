#!/usr/bin/env node
// Playground smoke test in headless Chromium, with nothing but Node and a
// Chrome binary: builds playground/, serves the build, drives the page over
// the DevTools protocol (Node 22's built-in WebSocket), and fails on any
// console error, page exception or failed resource load.
//
// What it drives, in order — the same path a person takes:
//   1. load the page (demo engine on the recording mock context);
//   2. click "Use real audio" with a synthesised mouse gesture → a real
//      AudioContext, the WASM plate on the hall return (worklet + .wasm loaded
//      from the served build);
//   3. press play, wait for the transport to run and the master meter to move;
//   4. select the hall strip so its device panel shows;
//   5. press "Render offline" and wait for the U33 bounce to finish;
//   6. screenshot the page, the mixer and the device chain into
//      playground/screenshots/.
//
// Usage: node playground/smoke.mjs [--no-build] [--keep-server]
//   CHROME_BIN=/path/to/chrome   (default: google-chrome / chromium on PATH)
//   PLAYGROUND_SCREENSHOTS=dir   (default: playground/screenshots)

import { spawn } from 'node:child_process'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const dist = join(here, 'dist')
const screenshotsDir = process.env.PLAYGROUND_SCREENSHOTS
  ? resolve(process.env.PLAYGROUND_SCREENSHOTS)
  : join(here, 'screenshots')
const args = new Set(process.argv.slice(2))

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
}

const log = (message) => console.log(`smoke: ${message}`)

function fail(message) {
  console.error(`smoke: FAIL — ${message}`)
  process.exitCode = 1
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function run(command, commandArgs, options = {}) {
  return new Promise((done, reject) => {
    const child = spawn(command, commandArgs, { cwd: root, stdio: 'inherit', ...options })
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0 ? done() : reject(new Error(`${command} exited ${code}`)),
    )
  })
}

// --- Chrome -------------------------------------------------------------------

function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN
  const candidates =
    process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome']
  return candidates[0]
}

function launchChrome(binary, userDataDir) {
  const flags = [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-background-timer-throttling',
    '--autoplay-policy=no-user-gesture-required',
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
    '--window-size=1440,2200',
    '--hide-scrollbars',
    'about:blank',
  ]
  if (process.env.CI || process.getuid?.() === 0) flags.unshift('--no-sandbox')
  const child = spawn(binary, flags, { stdio: ['ignore', 'pipe', 'pipe'] })
  const endpoint = new Promise((done, reject) => {
    let stderr = ''
    const onData = (chunk) => {
      stderr += chunk.toString()
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)
      if (match) {
        child.stderr.off('data', onData)
        done(match[1])
      }
    }
    child.stderr.on('data', onData)
    child.on('error', reject)
    child.on('exit', (code) =>
      reject(new Error(`Chrome exited before DevTools was ready (${code})\n${stderr}`)),
    )
    setTimeout(() => reject(new Error(`Chrome did not expose DevTools in time\n${stderr}`)), 20_000)
  })
  return { child, endpoint }
}

// --- Minimal CDP client -----------------------------------------------------

class Cdp {
  constructor(socket) {
    this.socket = socket
    this.nextId = 1
    this.pending = new Map()
    this.listeners = new Map()
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(typeof event.data === 'string' ? event.data : String(event.data))
      if (message.id !== undefined) {
        const pending = this.pending.get(message.id)
        if (!pending) return
        this.pending.delete(message.id)
        if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`))
        else pending.resolve(message.result)
        return
      }
      const key = `${message.sessionId ?? ''}:${message.method}`
      for (const listener of this.listeners.get(key) ?? []) listener(message.params)
      for (const listener of this.listeners.get(`*:${message.method}`) ?? [])
        listener(message.params)
    })
  }

  static connect(url) {
    return new Promise((done, reject) => {
      const socket = new WebSocket(url)
      socket.addEventListener('open', () => done(new Cdp(socket)))
      socket.addEventListener('error', () => reject(new Error(`cannot connect to ${url}`)))
    })
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++
    const message = { id, method, params }
    if (sessionId) message.sessionId = sessionId
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method })
      this.socket.send(JSON.stringify(message))
    })
  }

  on(method, listener, sessionId = '*') {
    const key = `${sessionId}:${method}`
    const list = this.listeners.get(key) ?? []
    list.push(listener)
    this.listeners.set(key, list)
  }

  close() {
    this.socket.close()
  }
}

class Page {
  constructor(cdp, sessionId) {
    this.cdp = cdp
    this.sessionId = sessionId
    this.problems = []
  }

  send(method, params) {
    return this.cdp.send(method, params, this.sessionId)
  }

  async init() {
    await this.send('Page.enable')
    await this.send('Runtime.enable')
    await this.send('Log.enable')
    await this.send('Network.enable')
    await this.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 2200,
      deviceScaleFactor: 1,
      mobile: false,
    })
    const record = (kind, text) => {
      this.problems.push(`${kind}: ${text}`)
    }
    this.cdp.on(
      'Runtime.exceptionThrown',
      ({ exceptionDetails }) =>
        record(
          'exception',
          exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown',
        ),
      this.sessionId,
    )
    this.cdp.on(
      'Runtime.consoleAPICalled',
      ({ type, args: consoleArgs }) => {
        if (type !== 'error' && type !== 'assert') return
        record(
          `console.${type}`,
          consoleArgs.map((arg) => arg.description ?? String(arg.value)).join(' '),
        )
      },
      this.sessionId,
    )
    this.cdp.on(
      'Log.entryAdded',
      ({ entry }) => {
        if (entry.level === 'error')
          record(`log.${entry.source}`, `${entry.text} ${entry.url ?? ''}`)
      },
      this.sessionId,
    )
    this.cdp.on(
      'Network.loadingFailed',
      ({ errorText, type }) => {
        if (errorText !== 'net::ERR_ABORTED') record('network', `${type} ${errorText}`)
      },
      this.sessionId,
    )
    this.cdp.on(
      'Network.responseReceived',
      ({ response }) => {
        if (response.status >= 400) record('http', `${response.status} ${response.url}`)
      },
      this.sessionId,
    )
  }

  async evaluate(expression, { awaitPromise = false } = {}) {
    const { result, exceptionDetails } = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise,
    })
    if (exceptionDetails) {
      throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text)
    }
    return result.value
  }

  async waitFor(description, expression, { timeoutMs = 15_000, intervalMs = 100 } = {}) {
    const deadline = Date.now() + timeoutMs
    let last
    while (Date.now() < deadline) {
      last = await this.evaluate(expression)
      if (last) return last
      await sleep(intervalMs)
    }
    throw new Error(`timed out waiting for ${description} (last value: ${JSON.stringify(last)})`)
  }

  async navigate(url) {
    const loaded = new Promise((done) => this.cdp.on('Page.loadEventFired', done, this.sessionId))
    await this.send('Page.navigate', { url })
    await loaded
  }

  /** A real pointer press/release at the element's centre: counts as a user gesture. */
  async click(selector) {
    const box = await this.evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)})
      if (!el) return null
      el.scrollIntoView({ block: 'center' })
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    })()`)
    if (!box) throw new Error(`click: ${selector} not found`)
    const base = { x: box.x, y: box.y, button: 'left', clickCount: 1 }
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...base, button: 'none' })
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...base })
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...base })
  }

  async screenshot(file, selector) {
    let clip
    if (selector) {
      const rect = await this.evaluate(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)})
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height }
      })()`)
      if (!rect) throw new Error(`screenshot: ${selector} not found`)
      clip = { ...rect, x: Math.max(0, rect.x - 8), y: Math.max(0, rect.y - 8), scale: 1 }
      clip.width = Math.ceil(rect.width + 16)
      clip.height = Math.ceil(rect.height + 16)
    }
    const { data } = await this.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      ...(clip ? { clip } : {}),
    })
    await writeFile(file, Buffer.from(data, 'base64'))
    log(`screenshot → ${file}`)
  }
}

// --- Static server for the build -------------------------------------------

function serve(directory) {
  const server = createServer(async (request, response) => {
    const path = normalize(decodeURIComponent(new URL(request.url, 'http://x').pathname))
    let file = join(directory, path)
    if (!file.startsWith(directory)) {
      response.writeHead(403).end()
      return
    }
    if (!(await exists(file)) || path === '/') file = join(directory, 'index.html')
    try {
      const body = await readFile(file)
      response.writeHead(200, {
        'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      })
      response.end(body)
    } catch {
      response.writeHead(404).end('not found')
    }
  })
  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () => done({ server, port: server.address().port }))
  })
}

// --- The flow ---------------------------------------------------------------

async function main() {
  if (!(await exists(join(root, 'dist', 'worklets', 'wasm-device.js')))) {
    throw new Error('dist/worklets is missing — run `pnpm build` first')
  }
  if (!args.has('--no-build')) {
    log('building playground/')
    await run('pnpm', [
      'exec',
      'vite',
      'build',
      '--config',
      'playground/vite.config.ts',
      '--logLevel',
      'warn',
    ])
  }
  await mkdir(screenshotsDir, { recursive: true })

  const { server, port } = await serve(dist)
  const url = `http://127.0.0.1:${port}/`
  log(`serving ${dist} at ${url}`)

  const chromeBin = findChrome()
  const userDataDir = join(tmpdir(), `live-mix-smoke-${process.pid}`)
  const { child: chrome, endpoint } = launchChrome(chromeBin, userDataDir)
  let cdp
  try {
    const browserUrl = await endpoint
    log(`chrome ready (${chromeBin})`)
    cdp = await Cdp.connect(browserUrl)
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
    const page = new Page(cdp, sessionId)
    await page.init()

    // 1. Load on the mock demo.
    await page.navigate(url)
    await page.waitFor('the mixer', `!!document.querySelector('[data-testid="mixer"]')`)
    const strips = await page.evaluate(
      `document.querySelectorAll('[data-testid="mixer"] .lm-strip').length`,
    )
    log(`page loaded; ${strips} strips on the mock demo`)
    if (strips < 5) fail(`expected at least 5 strips (4 tracks + return), saw ${strips}`)

    // 2. Real audio from a synthesised gesture.
    await page.click('[data-testid="mode-toggle"]')
    await page.waitFor(
      'the real AudioContext demo',
      `window.playground?.demo?.mode === 'live' && !!document.querySelector('[data-testid="mixer"]')`,
      { timeoutMs: 30_000 },
    )
    const live = await page.evaluate(`(() => {
      const demo = window.playground.demo
      return {
        state: demo.engine.context.state,
        sampleRate: demo.engine.context.sampleRate,
        hallDevice: demo.returns[0].device.id,
        devices: demo.engine.devices.list().length,
      }
    })()`)
    log(
      `real audio: context ${live.state} @ ${live.sampleRate} Hz, hall = ${live.hallDevice}, ${live.devices} devices registered`,
    )
    if (live.state !== 'running') fail(`AudioContext is ${live.state}, expected running`)
    if (live.hallDevice !== 'dattorro') {
      fail(`hall return is ${live.hallDevice}, expected the WASM plate`)
    }

    // 3. Play, and see the master meter move.
    await page.click('[data-testid="transport-play"]')
    await page.waitFor(
      'the transport to play',
      `document.querySelector('[data-testid="transport-state"]')?.textContent?.startsWith('playing')`,
    )
    const level = await page.waitFor(
      'signal at the master meter',
      `(() => { const l = window.playground.demo.engine.master.level(); return l > 0.001 ? l : 0 })()`,
      { timeoutMs: 10_000 },
    )
    const position = await page.evaluate(
      `window.playground.demo.engine.transport.position().positionSec`,
    )
    log(`playing: position ${position.toFixed(2)} s, master peak ${level.toFixed(3)}`)
    await sleep(1200)
    await page.screenshot(join(screenshotsDir, 'mixer.png'), '[data-testid="mixer"]')

    // 4. The keys chain: a node device (eq3) and a WASM device (stereo-widener).
    await page.click('[data-testid="mixer-keys"] .lm-strip__name')
    const panels = await page.waitFor(
      'the keys device chain',
      `document.querySelector('[data-testid="devices"] h2')?.textContent?.includes('keys') ? document.querySelectorAll('[data-testid="chain"] .lm-device').length : 0`,
    )
    log(`keys chain: ${panels} device panels`)
    if (panels < 2) fail(`expected eq3 + stereo-widener on keys, saw ${panels} panels`)
    await page.screenshot(join(screenshotsDir, 'devices.png'), '[data-testid="devices"]')

    // 5. Offline bounce (U33).
    await page.click('[data-testid="render-button"]')
    await page.waitFor(
      'the offline render',
      `document.querySelector('[data-testid="render"]')?.dataset.status === 'done' || document.querySelector('[data-testid="render"]')?.dataset.status === 'failed'`,
      { timeoutMs: 90_000, intervalMs: 250 },
    )
    const render = await page.evaluate(`({
      status: document.querySelector('[data-testid="render"]').dataset.status,
      text: document.querySelector('[data-testid="render-status"]').textContent,
    })`)
    log(`render: ${render.status} — ${render.text}`)
    if (render.status !== 'done') fail(`offline render ${render.status}: ${render.text}`)
    const peak = /peak (-?[\d.]+) dBFS/.exec(render.text)
    if (!peak) fail('offline render reported no peak (silent bounce?)')
    else if (Number(peak[1]) < -40) fail(`offline render peaked at ${peak[1]} dBFS — near silence`)

    // 6. Whole page.
    await page.screenshot(join(screenshotsDir, 'page.png'))

    await page.evaluate(`window.playground.demo.engine.transport.stop()`)
    if (page.problems.length > 0) {
      for (const problem of page.problems) console.error(`smoke:   ${problem}`)
      fail(`${page.problems.length} console/page problem(s)`)
    } else {
      log('no console errors, exceptions or failed loads')
    }
  } finally {
    cdp?.close()
    chrome.kill('SIGTERM')
    await sleep(200)
    if (chrome.exitCode === null) chrome.kill('SIGKILL')
    if (!args.has('--keep-server')) server.close()
  }
  if (process.exitCode) {
    console.error('smoke: FAILED')
  } else {
    log('PASS')
  }
}

main().catch((error) => {
  console.error(`smoke: ${error.stack ?? error.message}`)
  process.exitCode = 1
})
