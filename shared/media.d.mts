interface Identity { id: string | number; mediaType?: 'movie' | 'tv'; media_type?: 'movie' | 'tv' }
export function mediaKey(title: Identity): string
export function titlePath(title: Identity): string
export function mediaLabel(title: Identity): 'Series' | 'Movie'
