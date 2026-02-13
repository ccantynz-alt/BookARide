# Phase 3 SEO Redirect Tooling

This project now includes a redirect planner script:

- `scripts/generate-redirect-map.js`

It generates a **404 -> 301 map** using:

1. Current routes from `src/App.js`
2. Current URLs in `public/sitemap.xml`
3. Optional Search Console export CSV of 404 pages

---

## 1) Prepare Search Console input (optional but recommended)

Export 404 URLs from GSC into a CSV and place it at:

- `frontend/seo/gsc-404-export.csv`

Use `frontend/seo/gsc-404-export.template.csv` as an example.

If no CSV is found, the script still runs using a built-in legacy seed map.

---

## 2) Generate redirect outputs

From `frontend/`:

```bash
npm run seo:redirect-map
```

Or with custom files:

```bash
node scripts/generate-redirect-map.js \
  --input seo/gsc-404-export.csv \
  --output-csv seo/redirect-map.generated.csv \
  --output-json seo/vercel-redirects.generated.json
```

Generated files:

- `seo/redirect-map.generated.csv`
- `seo/vercel-redirects.generated.json`
- `seo/current-routes.generated.txt`

---

## 3) Apply redirects in Vercel

Current `vercel.json` only has a rewrite to SPA fallback.  
Add generated redirects **before** rewrites, for example:

```json
{
  "redirects": [
    { "source": "/booking", "destination": "/book-now", "permanent": true }
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Important: keep the rewrite as the last routing rule.

---

## 4) QA after deploy

- Test top 20 redirected URLs from the CSV.
- Confirm 301 response and correct destination.
- Re-submit GSC validation for "Not Found" issues after deploy.
