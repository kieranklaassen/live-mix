// A static server over the repository root for the browser tests: /dist for
// the built package, /browser-tests for the harness page and bundle, and
// /playground/dist for the built playground. Correct MIME types for ES
// modules, worklets and WASM; no caching; nothing else.

import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const port = Number(process.env.LIVE_MIX_BROWSER_PORT ?? 4173)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.map': 'application/json',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${port}`)
  let pathname = decodeURIComponent(url.pathname)
  if (pathname === '/') pathname = '/browser-tests/harness/index.html'
  if (pathname === '/playground' || pathname === '/playground/')
    pathname = '/playground/dist/index.html'
  // The playground is built with base '/', so its hashed assets resolve from the site root.
  if (pathname.startsWith('/assets/')) pathname = `/playground/dist${pathname}`
  const target = normalize(join(root, pathname))
  if (!target.startsWith(root.endsWith(sep) ? root : root + sep)) {
    response.writeHead(403).end()
    return
  }
  try {
    let file = target
    let info = await stat(file)
    if (info.isDirectory()) {
      file = join(file, 'index.html')
      info = await stat(file)
    }
    response.writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'content-length': info.size,
      'cache-control': 'no-store',
    })
    createReadStream(file).pipe(response)
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain' }).end(`not found: ${pathname}`)
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`live-mix browser-tests serving ${root} at http://127.0.0.1:${port}`)
})
