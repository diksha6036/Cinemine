import { handleApi } from '../../server/api.mjs'

// Adapt Netlify's web Request/Response API to the shared Node API handler.
export default async function handler(request, context = {}) {
  const url = new URL(request.url)
  let status = 200
  let headers = {}
  let body = ''
  const handled = await handleApi({
    url: `${url.pathname}${url.search}`,
    method: request.method,
    socket: { remoteAddress: context.ip ?? 'netlify' },
  }, {
    writeHead(code, values) { status = code; headers = values },
    end(value) { body = value },
  })
  if (!handled) return Response.json({ error: 'This API endpoint does not exist.' }, { status: 404 })
  return new Response(body, { status, headers })
}

// Keep the browser's existing /api URLs, including movie IDs and queries.
export const config = { path: '/api/*' }
