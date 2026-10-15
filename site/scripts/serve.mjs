// Serves the built site (site/dist) under its base path, for the browser tests and for a look
// at the build as it will be published:
//
//   node scripts/serve.mjs [port]        # http://localhost:4321/live-mix/
//
// The base path is SITE_BASE, '/live-mix' when unset: the same variable the build reads.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const base = (process.env.SITE_BASE ?? '/live-mix').replace(/\/+$/, '')
const port = Number(process.argv[2] ?? process.env.SITE_PORT ?? 4321)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.xml': 'application/xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
}

const server = http.createServer((request, response) => {
  const url = decodeURIComponent((request.url ?? '/').split('?')[0])
  if (url !== base && !url.startsWith(`${base}/`)) {
    response.writeHead(404, { 'content-type': 'text/plain' })
    response.end(`Nothing is served outside ${base}/`)
    return
  }
  let file = path.join(root, url.slice(base.length))
  // Never out of the build's folder, whatever the address says.
  if (!file.startsWith(root)) file = root
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
  if (!fs.existsSync(file)) {
    const missing = path.join(root, '404.html')
    response.writeHead(404, { 'content-type': TYPES['.html'] })
    response.end(fs.existsSync(missing) ? fs.readFileSync(missing) : 'Not found')
    return
  }
  response.writeHead(200, {
    'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
  })
  fs.createReadStream(file).pipe(response)
})

server.listen(port, () => console.log(`site/dist at http://localhost:${port}${base}/`))
