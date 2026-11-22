import type { Plugin } from 'vite'
import { readFile } from 'node:fs/promises'
import { handleApi } from './api.mjs'
import { handlePage } from './html.mjs'
import { isCrawlerPath } from './sitemaps.mjs'

export function movieApiPlugin(): Plugin {
  return {
    name: 'cinemine-movie-api',
    configureServer(server) {
      server.middlewares.use((request, response, next) => { if (request.url?.startsWith('/api/')) void handleApi(request, response); else next() })
      return () => server.middlewares.use(async (request, response, next) => {
        request.url = request.originalUrl ?? request.url
        const path = new URL(request.url ?? '/', 'http://localhost').pathname
        if (path.startsWith('/@') || path.startsWith('/src/') || path.startsWith('/node_modules/') || path.startsWith('/images/') || path.startsWith('/assets/') || (/\.[a-z0-9]+$/i.test(path) && !isCrawlerPath(path) && path !== '/index.html')) { next(); return }
        const template = await server.transformIndexHtml(request.url ?? '/', await readFile('index.html', 'utf8'))
        await handlePage(request, response, { template, render: async page => { const module = await server.ssrLoadModule('/src/entry-server.tsx'); return module.render(page) } })
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = new URL(request.url ?? '/', 'http://localhost').pathname
        if (path.startsWith('/api/')) void handleApi(request, response)
        else if (path.startsWith('/assets/') || path.startsWith('/images/') || path === '/favicon.svg') next()
        else void handlePage(request, response)
      })
    },
  }
}
