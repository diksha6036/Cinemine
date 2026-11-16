import { handleApi } from './api.mjs'

// Vercel invokes this handler per request; no listening HTTP server is needed.
export default async function handler(request, response) {
  if (await handleApi(request, response)) return
  response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify({ error: 'This API endpoint does not exist.' }))
}
