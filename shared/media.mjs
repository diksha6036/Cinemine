export function mediaKey(title) { return `${title.mediaType ?? title.media_type ?? 'movie'}:${title.id}` }
export function titlePath(title) { return `/${(title.mediaType ?? title.media_type) === 'tv' ? 'series' : 'movie'}/${title.id}` }
export function mediaLabel(title) { return (title.mediaType ?? title.media_type) === 'tv' ? 'Series' : 'Movie' }
