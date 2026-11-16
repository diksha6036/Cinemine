import { createContext } from 'react'
import type { SearchRequest } from './types/search'

export const SearchContext = createContext<{ openSearch: (request?: SearchRequest) => void } | null>(null)
