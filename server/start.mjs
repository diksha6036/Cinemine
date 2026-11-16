import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleApi } from './api.mjs'

const root = resolve(fileURLToPath(new URL('../dist/', import.meta.url)))
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json' }
const port = Number(process.env.PORT ?? 3000)
const server = createServer(async (request, response) => {
  if (await handleApi(request, response)) return
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405); response.end(); return }
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
    const candidate = resolve(root, `.${pathname}`)
    if (candidate !== root && !candidate.startsWith(root.endsWith(sep) ? root : root + sep)) { response.writeHead(403); response.end(); return }
    const isFile = await stat(candidate).then(info => info.isFile()).catch(() => false)
    if (!isFile && extname(pathname)) { response.writeHead(404); response.end('File not found.'); return }
    const file = isFile ? candidate : resolve(root, 'index.html')
    const body = await readFile(file)
    response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': file.endsWith('.html') ? 'no-cache' : 'public, max-age=3600' })
    response.end(request.method === 'HEAD' ? undefined : body)
  } catch { response.writeHead(404); response.end('Build the frontend with npm run build first.') }
})
server.listen(port, '127.0.0.1', () => console.log(`Cinemine is running at http://localhost:${port}`))
