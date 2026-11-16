import type { Plugin } from 'vite'
import { handleApi } from './api.mjs'

export function movieApiPlugin(): Plugin {
  return { name: 'cinemine-movie-api', configureServer(server) { server.middlewares.use((request, response, next) => { if (request.url?.startsWith('/api/')) void handleApi(request, response); else next() }) }, configurePreviewServer(server) { server.middlewares.use((request, response, next) => { if (request.url?.startsWith('/api/')) void handleApi(request, response); else next() }) } }
}
