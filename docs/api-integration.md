# Authenticated TMDB integration

The backend uses TMDB only. `server/env.mjs` reads the root `.env` with Node's native environment parser. `TMDB_READ_ACCESS_TOKEN` is sent in a server-side Bearer header; alternatively `TMDB_API_KEY` is sent as the v3 server-side query parameter. No credential is returned in JSON, client configuration, browser image URLs, or frontend bundles. `.env` is Git-ignored; `.env.example` contains blank configuration names only.

## Endpoints

- `GET /api/health`: provider name and configured boolean only.
- `GET /api/movies/featured`: daily trending films in `movies` and a separate five-film now-playing selection in `spotlights`, enriched with details, credits, and trailers.
- `GET /api/movies/search?q=Inception`: title matches with poster, year, and normalized facts.
- `GET /api/movies/discover?genres=35&languages=hi&runtime=120&moods=Funny`: live structured discovery. Optional `withoutGenres`, `page`, and `exclude` parameters support exclusions and unique pagination.
- `GET /api/movies/recommendations?id=27205&aspects=genres,director`: film-specific recommendations or discovery, enforcing every selected similarity aspect. Supports `page` and `exclude`.
- `GET /api/movies/27205`: one film's normalized details.
- `GET /api/releases?from=2026-11-01&to=2026-11-30&country=IN&genre=18&language=hi&type=Theatrical`: country-specific release events and separate movie records. Genre, language, and type are optional.

## Calendar normalization

The backend calls `/3/discover/movie` with region, release-date range, release type, and selected genre/original-language filters. It retrieves discovery pages with bounded concurrency, up to a reported 20-page cap. Candidate films are resolved to movie records; `/3/movie/{id}/release_dates` supplies the exact selected-country events. Only in-range dates of the chosen release type are returned. Distinct format/date events are retained, exact identities deduplicated, and primary/global dates are never used as a substitute for a missing regional entry. Failed pages or records and capped pagination are returned as a partial-data warning.

Date strings preserve the provider's calendar-date component without timezone conversion. Films and events remain separate. Premiere, limited theatrical, theatrical, digital, physical, and TV types are distinct. Missing dates, subscription streaming availability, and dubbed languages are not invented.

## Images and facts

The image configuration supplies the secure CDN base. Missing primary posters trigger a lookup of `/3/movie/{id}/images` across languages. Poster and backdrop paths are normalized to image URLs; the frontend displays actual movie posters and an accessible fallback when missing. Overviews, runtime, genres, director/cast IDs, and supplied YouTube trailer URLs come from TMDB details. Original-language filters use original language, not inferred dubbing from spoken languages.

## Search and reliability

Title autocomplete and all submitted searches cancel stale requests and ignore late results after changing filters or tabs. Structured mood and keyword description filters query live discovery rather than the homepage list. Multiple moods and explicit genres use AND matching; selected original languages use OR matching. Runtime filters exclude unknown durations and enforce a strict upper bound. Film-specific recommendations exclude the reference ID; cast and director preferences use discovery and verify actual credits.

Each search request scans at most three source pages and returns `nextPage` or null. Results retain all matching films from scanned pages so the cursor does not skip unseen matches. Duplicate IDs are removed, and the client sends already displayed IDs in `exclude`; no instance-local recommendation history is required. “Show more films” appends unique results, retaining previous results on failure. Daily trends retain real rank; the carousel rotates a separate now-playing pool daily and excludes trending IDs. There is no claim of AI plot understanding.

Backend requests use bounded concurrency, timeouts, cache/deduplication, and rate limiting. Configuration/authorization errors are safe and actionable without echoing credentials. No Wikidata, keyless, or mock fallback exists in production.

References: [authentication](https://developer.themoviedb.org/docs/authentication-application), [image URLs](https://developer.themoviedb.org/docs/image-basics), [discovery](https://developer.themoviedb.org/reference/discover-movie), [regional releases](https://developer.themoviedb.org/reference/movie-release-dates).

## Vercel

The root `api/health.js`, `api/movies/featured.js`, `api/movies/search.js`, `api/movies/discover.js`, `api/movies/recommendations.js`, `api/movies/[id].js`, and `api/releases.js` files export `server/vercel-handler.mjs`, which invokes the same API handler as the local servers. No listening server runs inside a function. `vercel.json` defines the Vite build, a 60-second function duration, and frontend-only rewrites.

Set `TMDB_READ_ACCESS_TOKEN` in Vercel’s Production/Preview environment settings and redeploy. The Git-ignored local `.env` is not part of a GitHub deployment. `/api/health` reports configuration without exposing the secret. Deployment-handler tests exercise every entry point without a local `.env`, using environment-only credentials and isolated upstream fixtures. These are local handler checks, not a verification of a hosted deployment.

## Netlify

`netlify/functions/movie-api.mjs` adapts the web Request/Response interface to the same API handler, preserving the original `/api/*` path, encoded query parameters, JSON statuses, and response headers. Its custom path routes the API independently from the frontend page rewrites. `netlify.toml` sets Node 22, the Vite build and `dist/` publish directory, and esbuild bundling. The Vercel entry points and configuration remain available in the same repository.

Set `TMDB_READ_ACCESS_TOKEN` in Netlify’s project environment settings with Functions scope and the relevant deployment contexts, then redeploy. Variables in `netlify.toml` do not supply function runtime secrets, and Vercel’s environment values are not shared with Netlify. Local tests verify both adapters with environment-only credentials; the Netlify function also passes an esbuild bundle and health-handler smoke check. Hosted deployments have not been verified from this workspace.
