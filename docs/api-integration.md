# Authenticated TMDB integration

The backend uses TMDB only. `server/env.mjs` reads the root `.env` with Node's native environment parser. `TMDB_READ_ACCESS_TOKEN` is sent in a server-side Bearer header; alternatively `TMDB_API_KEY` is sent as the v3 server-side query parameter. No credential is returned in JSON, client configuration, browser image URLs, or frontend bundles. `.env` is Git-ignored; `.env.example` contains blank configuration names only.

## Endpoints

- `GET /api/health`: provider name and configured boolean only.
- `GET /api/movies/featured`: weekly trending films, enriched with details, credits, and trailers.
- `GET /api/movies/search?q=Inception`: title matches with poster, year, and normalized facts.
- `GET /api/movies/27205`: one film's normalized details.
- `GET /api/releases?from=2026-11-01&to=2026-11-30&country=IN&genre=18&language=hi&type=Theatrical`: country-specific release events and separate movie records. Genre, language, and type are optional.

## Calendar normalization

The backend calls `/3/discover/movie` with region, release-date range, release type, and selected genre/original-language filters. It retrieves discovery pages with bounded concurrency, up to a reported 20-page cap. Candidate films are resolved to movie records; `/3/movie/{id}/release_dates` supplies the exact selected-country events. Only in-range dates of the chosen release type are returned. Distinct format/date events are retained, exact identities deduplicated, and primary/global dates are never used as a substitute for a missing regional entry. Failed pages or records and capped pagination are returned as a partial-data warning.

Date strings preserve the provider's calendar-date component without timezone conversion. Films and events remain separate. Premiere, limited theatrical, theatrical, digital, physical, and TV types are distinct. Missing dates, subscription streaming availability, and dubbed languages are not invented.

## Images and facts

The image configuration supplies the secure CDN base. Missing primary posters trigger a lookup of `/3/movie/{id}/images` across languages. Poster and backdrop paths are normalized to image URLs; the frontend displays actual movie posters and an accessible fallback when missing. Overviews, runtime, genres, director/cast IDs, and supplied YouTube trailer URLs come from TMDB details. Original-language filters use original language, not inferred dubbing from spoken languages.

## Search and reliability

Title autocomplete cancels old requests and ignores late results. Structured mood and keyword description filters apply to the fetched collection and explain their metadata basis. There is no claim of AI plot understanding. Similarity compares genres, cast, and directors; unsupported plot-twist controls are omitted.

Backend requests use bounded concurrency, timeouts, cache/deduplication, and rate limiting. Configuration/authorization errors are safe and actionable without echoing credentials. No Wikidata, keyless, or mock fallback exists in production.

References: [authentication](https://developer.themoviedb.org/docs/authentication-application), [image URLs](https://developer.themoviedb.org/docs/image-basics), [discovery](https://developer.themoviedb.org/reference/discover-movie), [regional releases](https://developer.themoviedb.org/reference/movie-release-dates).

## Vercel

The root `api/health.js`, `api/movies/featured.js`, `api/movies/search.js`, `api/movies/[id].js`, and `api/releases.js` files export `server/vercel-handler.mjs`, which invokes the same API handler as the local servers. No listening server runs inside a function. `vercel.json` defines the Vite build, a 60-second function duration, and frontend-only rewrites.

Set `TMDB_READ_ACCESS_TOKEN` in Vercel’s Production/Preview environment settings and redeploy. The Git-ignored local `.env` is not part of a GitHub deployment. `/api/health` reports configuration without exposing the secret. Deployment-handler tests exercise every entry point without a local `.env`, using environment-only credentials and isolated upstream fixtures. These are local handler checks, not a verification of a hosted deployment.
