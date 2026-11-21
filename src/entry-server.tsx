import { renderToString } from 'react-dom/server'
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router-dom'
import { routes } from './app/routes'
import { PageDataContext } from './app/PageData'
import type { PageData } from './app/PageData'
const handler = createStaticHandler(routes)
export async function render(page: PageData) {
  const context = await handler.query(new Request(`https://cinemine.internal${page.pathname}`))
  if (context instanceof Response) throw new Error('Unexpected page redirect')
  const router = createStaticRouter(routes, context)
  return renderToString(<PageDataContext.Provider value={page}><StaticRouterProvider router={router} context={context} hydrate={false} /></PageDataContext.Provider>)
}
