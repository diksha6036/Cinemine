import { App } from './App'
import { HomePage } from '../pages/home/HomePage'
import { MoviePage } from '../pages/movie/MoviePage'
import { CalendarPage } from '../features/calendar/CalendarPage'
import { SitemapPage } from '../pages/SitemapPage'
import { WhereToWatchPage } from '../pages/WhereToWatchPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { CreditsPage } from '../pages/CreditsPage'
export const routes = [{ element: <App />, children: [{ path: '/', element: <HomePage /> }, { path: '/calendar', element: <CalendarPage /> }, { path: '/where-to-watch', element: <WhereToWatchPage /> }, { path: '/sitemap', element: <SitemapPage /> }, { path: '/credits', element: <CreditsPage /> }, { path: '/movie/:id', element: <MoviePage /> }, { path: '*', element: <NotFoundPage /> }] }]
