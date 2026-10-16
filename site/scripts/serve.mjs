// Serves the built site (site/dist) under its base path, for the browser tests and for a look
// at the build as it will be published:
//
//   node scripts/serve.mjs [port]        # http://localhost:4321/live-mix/
//
// The base path is SITE_BASE, '/live-mix' when unset: the same variable the build reads. With
// SITE_ONLY_LESSON set it serves that lesson's own build (site/.lesson/<id>) at that lesson's port.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { basePath as base, siteFolder, sitePort } from './site-env.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', siteFolder)
const port = Number(process.argv[2] ?? sitePort)

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

server.listen(port, () => console.log(`site/${siteFolder} at http://localhost:${port}${base}/`))
