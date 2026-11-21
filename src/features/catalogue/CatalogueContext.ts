import { createContext } from 'react'
import type { SearchMovie } from '../search/types/search'

export const CatalogueContext = createContext<{ movies: SearchMovie[]; spotlights: SearchMovie[]; spotlightError: string; loading: boolean; error: string; refreshedAt: string; reload: () => void } | null>(null)
