# SEO Agent – Continuous monitoring and global visibility

This doc describes the in-house **SEO health agent** and how to extend it for **rank tracking** and **multi-country** visibility.

## What’s implemented (in-house agent)

- **Scheduled SEO health check** (weekly, same pattern as the daily error check):
  - **Sitemap**: `GET {base}/sitemap.xml` – must return 200 and contain `<url>` entries.
  - **Key pages**: Homepage, Book Now, Services (and optionally more) – must return 200.
  - **Report stored** in `seo_health_reports`; latest available via `GET /admin/seo-health`.
- **Manual trigger**: `POST /admin/run-seo-check` (admin auth).
- **Cockpit**: “SEO Health” section shows last run, status (healthy/warning/critical), and issues (e.g. sitemap unreachable, key URL 4xx/5xx).

**Purpose**: Catch technical SEO regressions (sitemap down, key pages broken) so the site stays indexable and crawlable. This does **not** track search rankings or positions.

**Env**: Uses `PUBLIC_DOMAIN` (e.g. `https://bookaride.co.nz`) for checks. If the sitemap is on the backend only, set `SITEMAP_BASE_URL` to the backend base (e.g. `https://bookaride-backend.onrender.com`).

---

## Ranking #1 and “all countries” – what’s needed

To actually **monitor rankings** and be **found in all countries**, you need data that only external services or Google provide.

### 1. Keyword rank tracking

- **What**: Position (e.g. 1–10) for target keywords (e.g. “auckland airport shuttle”, “orewa to airport”) by country/locale.
- **How**: Use a **third-party API** (no reliable, ToS‑compliant way to scrape Google yourself):
  - [SerpAPI](https://serpapi.com/) – Google search results API; per-query cost; multi-country.
  - [DataForSEO](https://dataforseo.com/) – Search, backlinks, etc.; pay‑per-task.
  - [SEMrush](https://www.semrush.com/) / [Ahrefs](https://ahrefs.com/) – Rank tracking + backlinks; subscription; API available.
- **Integration**: Backend calls the chosen API on a schedule (e.g. weekly), stores positions in DB, and the admin/Cockpit or SEO dashboard shows trends and alerts (e.g. “Keyword X dropped below top 5 in NZ”).

### 2. Google Search Console (GSC)

- **What**: Queries, impressions, clicks, average position, indexation status, by country/page.
- **How**: [Search Console API](https://developers.google.com/webmaster-tools/search-console-api-original) with OAuth (same style as your existing Google OAuth).
- **Use**: Replace or complement rank APIs with real GSC data; run weekly sync, store in DB, show in dashboard and optionally alert on big drops.

### 3. Multi-country and hreflang

- **What**: Be “searchable and found” in many countries.
- **Already in place**: Sitemap with hreflang, multi-language and visitor pages (e.g. `/visitors/usa`, `/visitors/japan`).
- **Extra**: Per-country rank tracking (via SerpAPI/DataForSEO with `gl`/`hl`) and/or GSC filtered by country; optional hreflang validation in the SEO health check (e.g. all alternate URLs return 200).

---

## Optional next steps

1. **Integrate one rank-tracking provider** (e.g. SerpAPI or DataForSEO): env vars for API key, backend job to fetch positions for a configurable keyword list and countries, store in `seo_rank_snapshots`, surface in admin.
2. **Add Google Search Console OAuth**: Sync queries/impressions/clicks/position and indexation; store and show in same dashboard.
3. **Alerts**: If SEO health check fails (sitemap or key URL down) or a key ranking drops below a threshold, send email/SMS (reuse existing admin alert flow).

The current **SEO agent** keeps technical SEO health under continuous monitoring; adding one of the above gets you toward “ranking #1 and found in all countries” with real data.
