import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import './styles/globals.css'
import './styles/features.css'
import './styles/design.css'
import './styles/buddy.css'
import './styles/polish.css'
import { PageDataContext } from './app/PageData'

const page = window.__CINEMINE_PAGE__
const application = <StrictMode><PageDataContext.Provider value={page ?? { pathname: location.pathname, origin: location.origin, status: 200 }}><RouterProvider router={router} /></PageDataContext.Provider></StrictMode>
const root = document.getElementById('root')!
if (page) hydrateRoot(root, application)
else createRoot(root).render(application)
