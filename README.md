# Cinemine

A local, responsive movie-discovery homepage built from the supplied Cinemine screenshot. React 19, strict TypeScript, Vite, Tailwind CSS 4, React Router, Lucide icons, and ESLint. No backend, credentials, environment variables, or movie services are required.

## Run locally

Install Node.js 20.18+ (20.x) or 22.12+ and npm. This project uses the Node-20-compatible Vite 6 line; keep `package-lock.json` and use npm consistently.

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite, normally http://localhost:5173. Keep the terminal running while editing; changes update automatically. To stop the server, press Ctrl+C.

```sh
npm run lint
npm run build
npm run preview
```

`build` checks TypeScript and writes the production site to `dist/`. `preview` normally serves it at http://localhost:4173. Use `npm ci` for a clean install from the existing lockfile.

## Where to edit

- `src/styles/globals.css`: shared colours, fonts, spacing, responsive layouts, and interaction styles. Tailwind 4 is configured with `@tailwindcss/vite` and `@theme` tokens in this file ([installation reference](https://tailwindcss.com/docs/installation/using-vite)).
- `src/pages/home/sections/HeroSection.tsx`: headline, supporting copy, and mood selection.
- `src/components/discovery/CinePickCarousel.tsx`: the first homepage highlight, navigation, and swipe behaviour.
- `src/data/instagramPosts.ts`: featured post images, film titles, collection summaries, original post links, and the Instagram profile URL.
- `src/data/movies.ts`: typed, fictional sample movie records from the screenshot.
- `src/data/moods.ts`: mood labels.
- `src/components/layout/Navbar.tsx`: local logo and navigation.
- `src/components/movies/MovieCard.tsx`: reusable movie presentation and missing-image fallback.
- `public/images/`: local imagery.
- `src/app/router.tsx`: the single home route and the place to add real future routes.

The homepage assembles sections under `src/pages/home/`; `src/components/` contains reusable UI, navigation, search, mood chips, and movie cards. Domain types live in `src/types/`; mock content lives in `src/data/`.

## Current interactions

- The search field accepts text. Submitting keeps you on the homepage and explains that search is coming soon; it does not pretend to produce recommendations.
- Mood chips toggle their selected state and explain that mood discovery is coming soon.
- Mobile navigation opens, closes, and closes on Escape or selecting a section. Escape returns focus to the toggle.
- The first homepage section is a CinePick carousel using five real images from public `@dr.cinemine` posts. Previous/next buttons wrap through the picks, dots select a pick, left/right arrows and Home/End work while the carousel is focused, and horizontal swipes navigate on touch screens. It does not autoplay, so readers can take their time.
- Explore and My Picks scroll to the existing sample picks; Find My Movie focuses the search field. Instagram links open the supplied `@dr.cinemine` profile in a new tab. Each featured image and its collection link open the original post.
- View all, Watchlist, and Sign in are visibly disabled, with accessible coming-soon labels and explanatory titles. No extra pages, authentication, saved lists, or automatically updating Instagram feed are implemented.
- A skip link, visible keyboard focus, labelled fields and icon buttons, reduced-motion support, and image fallbacks are included.

## Assets and design notes

The logo is a local copy of the exact supplied Instagram CDN image (`cinemine-logo.jpg`), so it does not rely on an expiring CDN URL. Instagram controls link to the supplied profile: https://www.instagram.com/dr.cinemine/. No engagement counts are displayed.

### CinePick carousel

`public/images/cinepicks/pick-1.jpg` through `pick-5.jpg` are unmodified, locally saved images from the second slide of five public posts visible in Instagram's profile embed. The page displays them with `object-fit: contain` so the full artwork remains visible. The supplied Godzilla example was used as a design reference; its exact image was not present in the local attachments or the accessible profile posts.

These manually curated highlights link to their original collections:

- Oxygen — Claustrophobic cinema: https://www.instagram.com/p/DfQCM9LkkZE/
- The Polar Express — Winter is coming: https://www.instagram.com/p/DfHLieFkp7c/
- Mortal Kombat — From game to screen: https://www.instagram.com/p/DfAioWZku_-/
- Parasite — Rich people gone wrong: https://www.instagram.com/p/De7jv_bk_5S/
- Gods of Egypt — Egyptian mythology: https://www.instagram.com/p/DexAB9ejWZI/

Collection descriptions are concise editorial summaries. These images are real post content; the separate five-card movie section still uses fictional sample records. There is no runtime scraping, Instagram script, iframe, access token, or login requirement. The carousel works locally, while its original-post links require internet access. It does not claim to be a live or complete feed.

To add a post, save its supplied image in `public/images/cinepicks/` and add a typed record to `src/data/instagramPosts.ts` with the correct original post URL and image dimensions. Put a record first to make it the initial highlight. Navigation and the slide count adjust to the data length. The image fallback keeps the original post link usable if a local image is missing.

The five poster artworks use image-only CSS viewports into the provided `design-reference.png`, preserving the supplied artwork without re-creating its interface as an image. Movie titles and metadata are real HTML. Replace a record's `posterUrl` with a standalone image and remove `referenceCrop` to use normal cover images. All five movie records are fictional sample content; no ratings or streaming availability are asserted.

The clean mountain background is an AI-generated substitute because a separate original hero asset was not provided. It is saved at `public/images/hero-mountains.png`. Built-in image generation was used with this prompt:

> Use case: photorealistic-natural. Asset type: wide cinematic website hero background, 1536x864 landscape. Create a cinematic photograph of dramatic Alpine mountains at sunset, layered dark teal forest valleys, a slender lake below, jagged snow-covered mountain summits across the center, glowing burnt orange sky on the right, moody overcast dark sky at left. One lone adult hiker with a dark backpack, seen from behind, standing on a rocky promontory at the far right edge, looking into the mountains, full body visible. Person only occupies rightmost 15 percent, sunset on upper right. Very dark near-black left third with subdued detail to allow cream website heading overlaid by frontend. Rich subtle film grain, atmospheric fog, realistic photography, quiet sense of adventure. No text, no typography, no logos, no borders or UI.

The display type uses local Iowan/Palatino/Georgia and the interface uses Avenir/Segoe UI/sans-serif, avoiding external font requests. The logo, hero artwork, small coming-soon labels, and subtle footer are the main differences from the reference. Desktop uses five columns; tablet uses three and mobile uses two, with a stacked search control and collapsible navigation.

## Future roadmap

1. **Phase 1 — Current:** Homepage, responsive components, typed mock data.
2. **Phase 2:** Node.js/Express backend and TMDB title search, then movie detail pages.
3. **Phase 3:** Explore filters and similar-movie recommendations.
4. **Phase 4:** Authentication, persistent watchlists, and feedback.
5. **Phase 5:** Mood-based recommendations and natural-language query interpretation.
6. **Phase 6:** Instagram integration and an admin interface for curated collections.

Map future API responses into the frontend's typed `Movie` model in a data adapter so presentation components need minimal changes. Keep API credentials on the future backend. None of these later phases is implemented here.

## Validation

The production build (including strict TypeScript) and ESLint passed. Headless Google Chrome checks passed at 1440, 1024, 768, and 390 pixels: no horizontal page overflow, all images loaded, all five cards rendered, search retained input without a reload, mood chips toggled, mobile navigation closed on selection and Escape, and the skip link was keyboard accessible. The missing-poster fallback was checked by blocking its image request. No browser console errors were observed. Desktop and mobile screenshots were inspected against the supplied design.

The CinePick update was checked in Chrome at the same four widths: all five original post images loaded, next/previous wraparound and direct dot selection worked, keyboard arrows/Home/End worked, horizontal touch events changed slides, vertical touch gestures left the slide unchanged, and there was no page overflow for any pick. The original-post link remained available when its image was deliberately blocked. Existing search, mood, and mobile-menu controls passed, with no console errors. Lint and the production build passed after the final layout changes.

The dependency audit reported seven moderate development-tool advisories in the TypeScript ESLint dependency chain, originating in `minimatch`. They do not ship in the built frontend. No forced cross-major dependency override has been applied; review with `npm audit` when updating the lint tooling. The lint tooling is pinned to a version compatible with the installed Node.js 20.18 runtime.
