export interface CinePick {
  id: string
  title: string
  collection: string
  description: string
  imageUrl: string
  imageAlt: string
  imageWidth: number
  imageHeight: number
  postUrl: string
  theme: 'ocean' | 'winter' | 'arena' | 'noir' | 'gold'
}
