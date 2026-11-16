import { createContext } from 'react'
import type { SearchMovie } from '../search/types/search'

export const CalendarMoviesContext = createContext<Map<string, SearchMovie>>(new Map())
