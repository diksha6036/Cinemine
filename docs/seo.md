# Search visibility and sharing

Cinemine serves the same HTML to people and crawlers. The homepage and individual film pages render live movie information on the server, then React hydrates that content. The calendar renders its page structure on the server and loads regional events in the browser. API resources remain crawlable for JavaScript rendering and send an `X-Robots-Tag: noindex` header so JSON endpoints are not search landing pages.

## Permanent domain

When the domain is ready, set the server environment variable `SITE_URL` to its full HTTPS origin, without a path, on **both Vercel and Netlify**, then redeploy both. For example, use your actual `https://...` address. On Netlify, include Functions scope. This value is public configuration, not a token.

Until `SITE_URL` is configured, canonical URLs, sitemap entries, and social metadata use the incoming host. The application does not invent a domain. Once configured, alternate hosting domains point their canonicals to the permanent domain. Preview/branch deployments and localhost pages carry `noindex` metadata. Setting up the custom domain and DNS remains a hosting-account step.

After deploying the permanent domain:

1. Check `/robots.txt` and `/sitemap.xml` on that domain. Sitemap URLs must use the permanent host.
2. Check a movie page's original HTML for its title, synopsis, canonical URL, Open Graph tags, and JSON-LD.
3. Verify the domain in Google Search Console and submit its `/sitemap.xml`. Use URL Inspection to request indexing for the homepage and representative film pages.
4. Check the structured data using Google's Rich Results Test and monitor real Core Web Vitals once traffic is available.

## Metadata and indexing

Each route has a descriptive title and description. Film pages use real title/year/overview/artwork, with `Movie` structured data for recorded genres, directors, and duration. The homepage includes a `WebSite`, publisher, and a movie `ItemList`; film pages include breadcrumbs. Ratings, reviews, release dates, and streaming availability are never invented for rich results. The metadata updates during client navigation as well as in initial HTML.

Open Graph and Twitter cards use a film's artwork or the original `public/images/cinemine-share.png` brand card. Homepage film cards are ordinary links, so discovery does not depend on clicking JavaScript buttons. Search dialogs and filter state do not create duplicate indexable URLs. The sitemap lists the homepage, calendar, and unique movie URLs from the current homepage feeds; it is a live discovery sitemap, not an export of every movie in the provider's catalogue.

Missing routes return HTTP 404 with `noindex`, not a soft-success SPA shell. Provider outages return retryable HTTP 503 responses with `noindex`, `Retry-After`, and no-store caching. Source text and serialized page data are escaped before embedding in HTML. Only explicit public movie data and public SEO configuration are serialized; server credentials stay private.

## Runtime and build

`npm run build` creates browser assets in `dist/` and a self-contained ES module in `dist-ssr/entry-server.mjs`. The SSR artifact lives outside the public asset directory and includes its React rendering dependencies, so isolated serverless deployments do not need a second install or a package-type assumption.

- `server/html.mjs` loads live page data, metadata, the HTML template, and the renderer. It also serves robots and sitemap responses.
- `src/entry-server.tsx` renders the actual React routes. `src/main.tsx` hydrates the same data on the client.
- `shared/seo.mjs` is shared between server HTML and metadata updates after navigation.
- Vercel's `api/pages.js` serves document routes. Its function configuration includes the HTML template and private SSR artifact. API functions remain separate.
- Netlify's `site` function serves document routes, excluding API and asset paths. Its included files contain the template and SSR artifact. The `movie-api` function continues to serve `/api/*`.
- Local `npm run dev`, `npm run preview`, and `npm start` use the same page rendering behavior.

## Popcorn buddy

The mascot is an original inline SVG using the existing cream/orange palette. It waves on arrival, blinks gently, and respects reduced-motion settings. The first click requests real, released films through the discovery API. Subsequent picks draw without replacement, exclude the current film page, and can open normal movie pages. It can be dismissed for the browser session; session storage is optional. It does not change search indexing or create a separate search URL.

References: [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [movie structured data](https://developers.google.com/search/docs/appearance/structured-data/movie).

## Small interface additions

The existing page layout is preserved. Cmd/Ctrl+K opens navigation search without replacing an unrelated open dialog. A 2px progress line follows page scroll; an adaptive back-to-top control appears after a meaningful portion of scrollable content. Poster hover/focus hints identify normal film links and preview buttons without changing their actions.

Film pages can share the canonical movie URL through the browser share sheet, fall back to copying the link, or display a selected manual-copy field if clipboard permission is denied. Cancellation is silent. The mascot remains a code-native SVG with individually shaded kernels and scoped gradient IDs, and the social preview uses the same refined character. No accounts, fabricated social statistics, extra homepage sections, or dependencies are added.
