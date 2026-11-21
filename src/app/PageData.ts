import { createContext } from 'react'
import type { SearchMovie } from '../features/search/types/search'
export interface HomeData { movies: SearchMovie[]; spotlights: SearchMovie[]; spotlightError: string; refreshedAt: string }
export interface PageData { pathname: string; origin: string; status: number; noIndex?: boolean; today?: string; home?: HomeData; movie?: SearchMovie | null; error?: string }
export const PageDataContext = createContext<PageData>({ pathname: '/', origin: '', status: 200 })
declare global { interface Window { __CINEMINE_PAGE__?: PageData } }
