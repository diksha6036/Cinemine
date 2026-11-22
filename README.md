# cinemine

A cinematic movie-discovery website with a featured-film slider, real movie posters, title search, mood and preference filters, film details, and a regional release calendar. The original cream-and-orange design is preserved. No account, sign-in, or sign-up is required for visitors.

The backend uses TMDB with credentials from a local `.env` file. Wikidata and other unauthenticated movie-data fallbacks have been removed. A small footer Credits link opens `/credits`, with the official TMDB logo, its required API notice, and JustWatch streaming-data attribution.

## Local setup

Use Node.js 20.18+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite, normally http://localhost:5173. The same command serves the frontend and backend `/api` routes.

### TMDB credential

A local `.env` file is prepared in the project root. Put your own TMDB API Read Access Token in it:

```dotenv
TMDB_READ_ACCESS_TOKEN=your_tmdb_api_read_access_token
```

Get the token from [your TMDB API settings](https://www.themoviedb.org/settings/api). This is an application credential, not a visitor login. A v3 API key is also supported via `TMDB_API_KEY` instead. Use `.env.example` as the template for another checkout.

The backend reads `.env` directly, so the credential stays server-side. Do not rename it to a `VITE_` variable, copy it into `public/`, or commit it. `.env` is ignored by Git. Native Node environment parsing is used; no dotenv dependency is needed. Deployment environment variables can supply the same credential instead of a local file.

If the credential is missing or rejected, the app explains the configuration error and never silently switches to public data or fictional films. The health endpoint reports only whether configuration exists, never its value.

## Commands

```sh
npm run lint
npm run test:dates
npm run test:api
npm run test:seo
npm run build
npm run preview
```

The build checks strict TypeScript and produces browser assets in `dist/` plus a private, self-contained renderer in `dist-ssr/entry-server.mjs`. Preview serves the backend and server-rendered document routes. To run the production build with the Node server:

```sh
npm run build
npm start
```

The production server defaults to http://localhost:3000; set the process `PORT` variable to change it. Deploy the Node server and frontend together; a static-only host cannot execute authenticated API requests.

## Vercel deployment

The root `api/` directory exposes the backend as Vercel Node functions. `api/pages.js` renders HTML, robots, and sitemap routes; the other functions serve JSON APIs. `vercel.json` places HTML routes before filesystem handling, includes the private SSR artifact in the page function, and keeps static assets and API routes separate. Vercel does not need to run `npm start`.

1. Push the `api/` directory, `server/` directory, and `vercel.json` along with the frontend to GitHub. Use this repository's root as the Vercel project root.
2. In **Vercel → Project → Settings → Environment Variables**, add `TMDB_READ_ACCESS_TOKEN` with the value from your local `.env`. Enable **Production** and **Preview** if you use preview deployments. Use the raw token without `Bearer` or surrounding quotes. Do not use a `VITE_` prefix or commit `.env`.
3. Redeploy after saving the variable. Environment changes apply to new deployments, not existing ones.
4. Open `/api/health` on the deployed domain. It must return JSON with `configured: true`. Then open `/api/movies/featured`; it should return movie records.

If `/api/health` is 404 or returns HTML, check that the deployment includes the `api/` directory and has the correct project root. If `configured` is false, check the variable name and its deployment environment, then redeploy. If health is configured but movie requests return 502, check the response's error and Vercel function logs for a rejected credential or upstream connection failure.

The local `.env` file is intentionally ignored by Git and is not uploaded through GitHub. Adding credentials to Vercel is a separate step. Warm functions may cache data briefly; their in-memory cache and rate limiter are not shared across function instances.

References: [Vite functions on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vercel environment variables](https://vercel.com/docs/environment-variables).

## Netlify deployment

The same repository supports Vercel and Netlify simultaneously; keep both hosting configurations committed. Credentials must be configured separately on each platform.

Netlify uses `netlify.toml` for the Vite build (`npm run build`, publish `dist/`, Node 22) and bundles `netlify/functions/movie-api.mjs` as a serverless function. The function's custom `/api/*` route preserves the browser's existing API URLs. The `site` function renders documents at `/*`, excluding API and static-asset paths; its bundle includes the HTML template and private SSR module. Vercel configuration can stay in the same repository.

1. Push `netlify.toml`, `netlify/functions/`, and the shared `server/` directory to GitHub, then import the repository into Netlify. Use the repository root as the base directory.
2. In **Netlify → Project configuration → Environment variables**, add `TMDB_READ_ACCESS_TOKEN` using your token. Its scope must include **Functions** (or all scopes), with values enabled for Production and any Deploy Previews you use. Use the raw value, without `Bearer`, quotes, or a `VITE_` prefix.
3. Trigger a new deploy after setting or changing the variable. Netlify does not inherit Vercel's settings or the Git-ignored local `.env`.
4. Check `/api/health` on the Netlify domain for JSON with `configured: true`, then check `/api/movies/featured` for live film records.

Use a Git-connected deployment or a Netlify CLI deployment that builds and uploads functions. Dragging only the `dist/` folder into Netlify uploads the static frontend and omits the backend.

Runtime credentials belong in Netlify's environment settings, not `[build.environment]` in `netlify.toml`. The Node version there is a nonsecret build setting. See [Netlify function environment variables](https://docs.netlify.com/build/functions/environment-variables/) and [function routing](https://docs.netlify.com/build/functions/configuration/).

## Permanent domain and SEO

Once the domain is ready, set `SITE_URL` to its full HTTPS origin in both hosting projects and redeploy. Until then the current host is used; no domain is hardcoded. SEO includes server-rendered home/movie content, per-route titles and descriptions, canonical links, social cards, factual structured data, crawlable film links, live `/sitemap.xml` and `/robots.txt`, and real HTTP 404/503 responses. Preview deployments are not indexed. See [the SEO and domain guide](docs/seo.md) for Search Console setup and deployment checks.

The popcorn buddy offers real surprise films, another pick without repeats in its current pool, direct film navigation, session dismissal, and reduced-motion support. Its vector character matches the site palette.

## What works

- The Cinemine homepage: Cinemine logo and lowercase wordmark on the left, navigation at the top, a large upright CinePick poster slider, and trending movie cards.
- On phones (up to 760 px), the homepage is one scrolling page with CinePicks, trending films, the full movie finder, Where to watch, and the release calendar. A visible sticky section navigation replaces the mobile menu. Search tabs, country selection, date filters, previews, and pagination work inline; the calendar loads dates when approached. Desktop retains its separate pages. There is one main landmark and one footer, and mobile section links work from film pages and on direct hash URLs.
- Cream typography, burnt-orange accents, charcoal backgrounds, and restrained cool tones in the slider. No sidebar, rotating gradient poster substitutes, account buttons, or work-in-progress controls.
- The provided `public/images/cinemine-logo.jpg` is used in the header, browser favicon, and Apple touch icon.
- Slider arrows, selection dots, horizontal swipe, and keyboard arrows/Home/End. Artwork stays upright and uncropped. Slides do not autoplay, so visitors can read the synopsis.
- Real poster and backdrop URLs mapped from TMDB. When a primary poster is missing, the server checks TMDB’s alternate posters across languages. Missing/broken posters have an accessible fallback without inventing artwork or hiding real releases. Posters below the fold lazy-load with reserved aspect ratios.
- Trending today uses TMDB's daily movie trends, keeping the source rank and up to 20 unique films. View all expands the collection. The carousel uses a separate India now-playing pool, excludes all trending IDs, and rotates its five-film selection each day in India.
- Small additions: keyboard search with Cmd/Ctrl+K, movie-sharing with native share/copy/manual-link fallbacks, a reading-progress line and adaptive back-to-top control, and poster hover/focus hints.
- One shared search dialog, opened from navigation. Title autocomplete queries TMDB, supports keyboard selection, and cancels stale requests.
- Mood and description searches query the live discovery API across the catalogue, with genre, excluded genre, original-language, and strict runtime filters. All selected moods must match; moods remain genre-derived and description input uses explicit keywords. Similar-film searches use movie-specific recommendations or discovery for shared cast/directors, then verify selected facts and exclude the reference film. Show more films follows source pages and excludes already shown IDs. No requirements are silently relaxed.
- Search state is retained per tab while open. Movie previews replace the dialog contents, with Back to results. Focus trapping, Escape, visible close controls, and trigger restoration are supported.
- Film pages include posters, overview, runtime, original language, genres, directors, and a supplied trailer when present. Otherwise visitors can search for trailers.
- The dedicated `/where-to-watch` page lets visitors search a movie title, choose a match, and see a simple box of unique platform logos and names. The same box appears in movie details and previews. Availability comes from JustWatch through TMDB. Country selectors use the complete live list of supported streaming regions, default to India, and start with the selected release country in calendar previews. The box shows platform logos and names without an attribution caption, external watch button, or category labels. Missing listings and failed requests have separate states, with retry on failure.
- `/calendar` opens to the current month and India. Previous/next, Today, month/list views, country, genre, original-language, release-type, local title filtering, and clearing filters work. Mobile defaults to a readable date-grouped list.
- Calendar cells show at most two entries with a `+N more` day-details action. Clicking a film opens its regional release preview.

## Data accuracy and API behaviour

Movie records and release events are separate. The calendar paginates TMDB discovery, then retrieves each movie's regional release-date records with bounded concurrency. It matches the selected country's entries and release types instead of relabelling a global primary date. Exact duplicates are removed by movie/country/type/date, while separate theatrical and digital releases remain distinct.

Supported formats preserve TMDB's distinctions: Premiere, Limited theatrical, Theatrical, Digital, Physical, and TV. Premiere is not automatically called a festival showing. Digital does not establish subscription-platform availability, and original language does not establish dubbed audio.

Backend validation bounds the date range to 62 days and supports dates in 1900–2100. Discovery is capped at 20 pages per request; a visible partial-data warning reports that cap or failed pages/details. Source dates can still change. Missing dates are not invented as TBA events.

Visible pages refresh live movie trends and release dates every five minutes and recheck when returning to an older browser tab. Requests use timeouts, short-lived caches, in-flight deduplication, and local rate limits. Authentication and source requests stay in the backend. Browser image requests use TMDB's image CDN without embedding the API credential. Review [TMDB's terms and branding requirements](https://developer.themoviedb.org/docs/faq) before publishing commercially.

## Main files

- `server/env.mjs`: local `.env` loading and credential selection.
- `server/provider.mjs`: authenticated TMDB requests, poster mapping, films, pagination, and regional releases.
- `server/api.mjs`: validated JSON endpoints, safe errors, and rate limits.
- `server/start.mjs` and `server/vite-plugin.ts`: production and development/preview servers.
- `src/components/layout/Navbar.tsx`: original-style navigation without account controls.
- `src/components/discovery/CinePickCarousel.tsx`: the restored upright poster slider.
- `src/components/movies/MovieArtwork.tsx`: real posters and fallback rendering.
- `src/styles/globals.css`: original Cinemine colour, typography, spacing, and slider styles.
- `src/styles/design.css`: focused adjustments for real posters and restored page layout.
- `src/styles/features.css`: calendar, search, and movie-preview components.
- `src/features/search/`, `src/features/calendar/`, and `src/pages/movie/`: working discovery features.

See [the backend integration notes](docs/api-integration.md) for the API contract and credential boundary.

## Validation

The production client/SSR builds, 14 provider/deployment-handler tests, eight SEO tests, and five calendar/date tests pass. New regressions cover combined filters, exact runtime boundaries, duplicate IDs across source pages, reference-film exclusion, shared cast/director constraints, distinct homepage pools, and both hosting adapters.

Live checks verified 20 unique trending films, five separate carousel films with no overlap, 29 Hindi comedies matching the runtime filter plus 35 additional unique results, and reference-specific recommendations. Chrome checks at 390 and 1440 px verified mood/description/similar-film searches, pagination, slider navigation, focus restoration, and no horizontal overflow or JavaScript errors. Delayed-response and pagination-error checks verify stale requests are ignored, existing results remain visible, and retries add only unique films. Counts will change with the source. Hosted Vercel/Netlify deployments require redeployment and have not been verified from this workspace.

SEO and mascot verification also covers initial HTML without JavaScript, hydration, metadata updates during navigation, canonical/JSON-LD serialization, 404 and outage responses, unique picks, session dismissal, and desktop/mobile behavior. Both HTML hosting adapters are checked as isolated bundles with runtime environment credentials and a configured canonical origin. Actual hosted deployment and domain ownership verification remain account-side steps.

The refined mascot uses layered vector kernels, restrained shading, highlights, and unique gradient IDs that remain stable during server rendering. Extra controls respect reduced motion and preserve the two-section homepage. Desktop/mobile browser checks cover keyboard search, poster hints, adaptive scrolling, native sharing, clipboard confirmation, cancellation, and manually copying links when browser permissions are unavailable.
