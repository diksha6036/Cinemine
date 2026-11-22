# Authenticated TMDB integration

The backend uses TMDB only. `server/env.mjs` reads the root `.env` with Node's native environment parser. `TMDB_READ_ACCESS_TOKEN` is sent in a server-side Bearer header; alternatively `TMDB_API_KEY` is sent as the v3 server-side query parameter. No credential is returned in JSON, client configuration, browser image URLs, or frontend bundles. `.env` is Git-ignored; `.env.example` contains blank configuration names only.

## Endpoints

The current UI uses the generic catalogue endpoints below. The original `/api/movies/*` routes remain movie-only for compatibility. A single Vercel function, `api/titles/[action].js`, serves all generic actions; Netlify and local servers use the same shared API handler.

- `GET /api/titles/search?q=Panchayat&mediaType=all&page=1`: movies and/or series (`all`, `movie`, `tv`), with `titles` and `nextPage`. People and adult records are excluded. Autocomplete supplies `limit=10`; result pages use up to 20 source records.
- `GET /api/titles/details?id=101352&mediaType=tv`: the correct typed title details in `movie` (the existing client record field).
- `GET /api/titles/discover?mediaType=tv&genres=35&languages=hi&runtime=60`: preference discovery, with `titles` and `nextPage`. Runtime is a movie duration or a series episode duration; unknown runtimes are excluded from runtime-filtered searches.
- `GET /api/titles/recommendations?id=101352&referenceType=tv&mediaType=all&aspects=genres`: recommendations with typed reference exclusion. Shared cast/director/creator constraints use person combined credits and then verify enriched title facts.
- `GET /api/titles/watch-providers?id=101352&mediaType=tv&country=IN`: country-specific provider logos and names for the correct source namespace.
- `GET /api/titles/featured`: mixed trending titles in `movies`, plus a separate movie spotlight pool in `spotlights`.
- `GET /api/titles/trending?mediaType=tv`: type-specific trending records in `titles`.

Movie and series IDs occupy separate namespaces. Use `movie:123` and `tv:123` in discovery/recommendation exclusions. Pagination uses the earliest unfinished source page and client-supplied typed exclusions, so one catalogue does not skip the other catalogue's results. TV uses native source genres and aggregate cast; Romance, Horror, and Thriller series preferences use exact source keywords when there is no corresponding TV genre. Description searches expose mapped TV genre families, including Action & Adventure and Sci-Fi & Fantasy. No director is inferred from a series creator. The regional release calendar remains specifically a movie calendar; movie digital dates do not establish streaming availability or series episode air dates.

- `GET /api/health`: provider name and configured boolean only.
- `GET /api/movies/featured`: daily trending films in `movies` and a separate five-film now-playing selection in `spotlights`, enriched with details, credits, and trailers.
- `GET /api/movies/search?q=Inception`: title matches with poster, year, and normalized facts.
- `GET /api/movies/discover?genres=35&languages=hi&runtime=120&moods=Funny`: live structured discovery. Optional `withoutGenres`, `page`, and `exclude` parameters support exclusions and unique pagination.
- `GET /api/movies/recommendations?id=27205&aspects=genres,director`: film-specific recommendations or discovery, enforcing every selected similarity aspect. Supports `page` and `exclude`.
- `GET /api/movies/27205`: one film's normalized details.
- `GET /api/watch-regions`: the complete source-backed list of supported streaming countries, sorted by English name.
- `GET /api/movies/watch-providers?id=27205&country=IN`: JustWatch streaming, rental, and purchase availability from TMDB for any supported streaming country (India by default). Country codes are validated against the live region list.
- `GET /api/releases?from=2026-11-01&to=2026-11-30&country=IN&genre=18&language=hi&type=Theatrical`: country-specific release events and separate movie records. Genre, language, and type are optional.

## Calendar normalization

The backend calls `/3/discover/movie` with region, release-date range, release type, and selected genre/original-language filters. It retrieves discovery pages with bounded concurrency, up to a reported 20-page cap. Candidate films are resolved to movie records; `/3/movie/{id}/release_dates` supplies the exact selected-country events. Only in-range dates of the chosen release type are returned. Distinct format/date events are retained, exact identities deduplicated, and primary/global dates are never used as a substitute for a missing regional entry. Failed pages or records and capped pagination are returned as a partial-data warning.

Date strings preserve the provider's calendar-date component without timezone conversion. Films and events remain separate. Premiere, limited theatrical, theatrical, digital, physical, and TV types are distinct. Missing dates, subscription streaming availability, and dubbed languages are not invented.

## Images and facts

The `/where-to-watch` search page, movie/series pages, and previews use `/3/movie/{id}/watch/providers` or `/3/tv/{id}/watch/providers` according to the selected title type. The frontend merges subscription, free, ad-supported, rental, and purchase providers into one deduplicated list of logos and names. Only the requested country is shown. The standalone search page and movie availability boxes have country selectors populated from TMDB's `/3/watch/providers/regions`, using the complete source-backed country list rather than the calendar's five-country list. Movie and series availability pages default to India; calendar previews start with the release's selected country. Country changes cancel and disregard stale requests. Country-list loading failures have an independent retry and never substitute a made-up list. No category labels, external watch buttons, or attribution captions are displayed in the availability interface. TMDB and JustWatch are credited on the dedicated `/credits` page, linked from every footer. It includes an unmodified approved TMDB logo and the required non-endorsement notice. An empty country result means no availability is listed, not proof that a movie cannot be watched. Failed requests show an independent retry control without blocking movie details. Availability is never inferred from digital release dates. The backend keeps the source categories and TMDB watch URL in its API response and uses the existing server-only credential, five-minute cache, request deduplication, and rate limits. `api/titles/[action].js` and `api/watch-regions.js` expose the current endpoints on Vercel; Netlify uses the shared handler. The standalone search page renders on the server without an upstream request and uses the existing cancellable, debounced title autocomplete to choose a film.

The image configuration supplies the secure CDN base. Missing primary posters trigger a lookup of `/3/movie/{id}/images` across languages. Poster and backdrop paths are normalized to image URLs; the frontend displays actual movie posters and an accessible fallback when missing. Overviews, runtime, genres, director/cast IDs, and supplied YouTube trailer URLs come from TMDB details. Original-language filters use original language, not inferred dubbing from spoken languages.

## Search and reliability

Title autocomplete and all submitted searches cancel stale requests and ignore late results after changing filters or tabs. Structured mood and keyword description filters query live discovery rather than the homepage list. Multiple moods and explicit genres use AND matching; selected original languages use OR matching. Runtime filters exclude unknown durations and enforce a strict upper bound. Film-specific recommendations exclude the reference ID; cast and director preferences use discovery and verify actual credits.

Each search request scans at most three source pages and returns `nextPage` or null. Results retain all matching films from scanned pages so the cursor does not skip unseen matches. Duplicate IDs are removed, and the client sends already displayed IDs in `exclude`; no instance-local recommendation history is required. “Show more films” appends unique results, retaining previous results on failure. Daily trends retain real rank; the carousel rotates a separate now-playing pool daily and excludes trending IDs. There is no claim of AI plot understanding.

Backend requests use bounded concurrency, timeouts, cache/deduplication, and rate limiting. Configuration/authorization errors are safe and actionable without echoing credentials. No Wikidata, keyless, or mock fallback exists in production.

References: [authentication](https://developer.themoviedb.org/docs/authentication-application), [image URLs](https://developer.themoviedb.org/docs/image-basics), [discovery](https://developer.themoviedb.org/reference/discover-movie), [regional releases](https://developer.themoviedb.org/reference/movie-release-dates).

## Vercel

The root `api/health.js`, `api/movies/featured.js`, `api/movies/search.js`, `api/movies/discover.js`, `api/movies/recommendations.js`, `api/movies/[id].js`, and `api/releases.js` files export `server/vercel-handler.mjs`, which invokes the same API handler as the local servers. No listening server runs inside a function. `vercel.json` defines the Vite build, a 60-second function duration, and document routes backed by the separate `api/pages.js` HTML renderer.

Set `TMDB_READ_ACCESS_TOKEN` in Vercel’s Production/Preview environment settings and redeploy. The Git-ignored local `.env` is not part of a GitHub deployment. `/api/health` reports configuration without exposing the secret. Deployment-handler tests exercise every entry point without a local `.env`, using environment-only credentials and isolated upstream fixtures. These are local handler checks, not a verification of a hosted deployment.

## Netlify

`netlify/functions/movie-api.mjs` adapts the web Request/Response interface to the same API handler, preserving the original `/api/*` path, encoded query parameters, JSON statuses, and response headers. Its custom path routes the API independently from the `site` HTML-rendering function. `netlify.toml` sets Node 22, the Vite build and `dist/` publish directory, and esbuild bundling. The Vercel entry points and configuration remain available in the same repository.

Set `TMDB_READ_ACCESS_TOKEN` in Netlify’s project environment settings with Functions scope and the relevant deployment contexts, then redeploy. Variables in `netlify.toml` do not supply function runtime secrets, and Vercel’s environment values are not shared with Netlify. Local tests verify both adapters with environment-only credentials; the Netlify function also passes an esbuild bundle and health-handler smoke check. Hosted deployments have not been verified from this workspace.

Document HTML, metadata, robots, sitemap, and permanent-domain configuration are described in [the SEO guide](seo.md). The API adds `X-Robots-Tag: noindex` to JSON responses while allowing crawlers to fetch them as rendering resources.
