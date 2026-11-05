import type { CinePick } from '../types/social'

export const instagramProfileUrl = 'https://www.instagram.com/dr.cinemine/'

// Manually curated images from the public @dr.cinemine profile embed.
// Each is the second image of its original post, saved locally without edits.
// These are real post images, not an automatically updating Instagram feed.
export const cinePicks: CinePick[] = [
  {
    id: 'DfQCM9LkkZE',
    title: 'Oxygen',
    collection: 'Claustrophobic cinema',
    description: 'Small spaces. Impossible odds. Explore stories of isolation, dwindling resources, and the instinct to survive — starting with Oxygen.',
    imageUrl: '/images/cinepicks/pick-1.jpg',
    imageAlt: 'Oxygen artwork from the @dr.cinemine survival film collection: a woman inside a sealed chamber.',
    imageWidth: 776, imageHeight: 1023,
    postUrl: 'https://www.instagram.com/p/DfQCM9LkkZE/',
    theme: 'ocean',
  },
  {
    id: 'DfHLieFkp7c',
    title: 'The Polar Express',
    collection: 'Winter is coming',
    description: 'Snow-covered worlds, a little nostalgia, and a good reason to stay in. Take the scenic route through CineMine’s winter-watch collection.',
    imageUrl: '/images/cinepicks/pick-2.jpg',
    imageAlt: 'The Polar Express artwork from the @dr.cinemine winter collection: a glowing train crossing a snowy bridge.',
    imageWidth: 525, imageHeight: 692,
    postUrl: 'https://www.instagram.com/p/DfHLieFkp7c/',
    theme: 'winter',
  },
  {
    id: 'DfAioWZku_-',
    title: 'Mortal Kombat',
    collection: 'From game to screen',
    description: 'Legendary warriors, digital worlds, and high-stakes quests. Discover a collection where the energy of gaming meets the big screen.',
    imageUrl: '/images/cinepicks/pick-3.jpg',
    imageAlt: 'Mortal Kombat character artwork from the @dr.cinemine game-themed movie collection.',
    imageWidth: 1080, imageHeight: 1421,
    postUrl: 'https://www.instagram.com/p/DfAioWZku_-/',
    theme: 'arena',
  },
  {
    id: 'De7jv_bk_5S',
    title: 'Parasite',
    collection: 'Rich people gone wrong',
    description: 'Behind the picture-perfect lives, something darker is brewing. Explore films about class, power, privilege, and the cost of wanting more.',
    imageUrl: '/images/cinepicks/pick-4.jpg',
    imageAlt: 'Parasite ensemble artwork from the @dr.cinemine Rich People Gone Wrong collection.',
    imageWidth: 773, imageHeight: 1019,
    postUrl: 'https://www.instagram.com/p/De7jv_bk_5S/',
    theme: 'noir',
  },
  {
    id: 'DexAB9ejWZI',
    title: 'Gods of Egypt',
    collection: 'Myths, gods & ancient worlds',
    description: 'Ancient secrets, forgotten civilizations, and larger-than-life adventures. Enter CineMine’s collection inspired by Egyptian mythology.',
    imageUrl: '/images/cinepicks/pick-5.jpg',
    imageAlt: 'Gods of Egypt artwork from the @dr.cinemine Egyptian mythology movie collection.',
    imageWidth: 1080, imageHeight: 1430,
    postUrl: 'https://www.instagram.com/p/DexAB9ejWZI/',
    theme: 'gold',
  },
]
