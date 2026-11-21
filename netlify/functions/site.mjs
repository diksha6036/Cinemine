import { renderDocument } from '../../server/html.mjs'
export default async function handler(request) {
  const result = await renderDocument(request)
  return new Response(request.method === 'HEAD' ? null : result.body, { status: result.status, headers: result.headers })
}
export const config = { path: '/*', excludedPath: ['/api/*', '/assets/*', '/images/*', '/favicon.svg'] }
