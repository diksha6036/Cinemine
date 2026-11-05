import type { Movie } from '../types/movie'

// Fictional sample records from the supplied design, not a live movie catalogue.
export const movies: Movie[] = [
  { id: 'the-last-light', title: 'The Last Light', releaseYear: 2023, genres: ['Drama'], posterUrl: '/images/design-reference.png', referenceCrop: { x: 92, y: 577, width: 262, height: 261 }, shortDescription: 'On a remote coast, a lighthouse keeper finds a reason to keep the light burning.' },
  { id: 'wildflower', title: 'Wildflower', releaseYear: 2022, genres: ['Romance'], posterUrl: '/images/design-reference.png', referenceCrop: { x: 373, y: 577, width: 251, height: 261 }, shortDescription: 'One summer, an unexpected connection, and the courage to begin again.' },
  { id: 'after-midnight', title: 'After Midnight', releaseYear: 2024, genres: ['Thriller'], posterUrl: '/images/design-reference.png', referenceCrop: { x: 643, y: 577, width: 254, height: 261 }, shortDescription: 'A stranger disappears into the city. Following him might change everything.' },
  { id: 'the-long-way-home', title: 'The Long Way Home', releaseYear: 2021, genres: ['Adventure'], posterUrl: '/images/design-reference.png', referenceCrop: { x: 917, y: 577, width: 252, height: 261 }, shortDescription: 'Two old friends take the scenic route and discover what home really means.' },
  { id: 'beyond-the-blue', title: 'Beyond the Blue', releaseYear: 2024, genres: ['Sci-fi'], posterUrl: '/images/design-reference.png', referenceCrop: { x: 1189, y: 577, width: 258, height: 261 }, shortDescription: 'Beneath the surface, a diver discovers a world that should not exist.' },
]
