# Weekly SEO Recovery Checklist (Search Console + GBP)

Use this template every week during recovery (minimum 12 weeks).

---

## Week Of: `YYYY-MM-DD`

### Owner
- SEO lead: `__________`
- Dev lead: `__________`
- Ops/Content: `__________`

---

## 1) KPI Snapshot (Week-over-Week)

### Google Search Console
- [ ] Total clicks: `_____` (last week: `_____`)
- [ ] Total impressions: `_____` (last week: `_____`)
- [ ] Avg CTR: `_____` (last week: `_____`)
- [ ] Avg position: `_____` (last week: `_____`)
- [ ] Pages with errors (indexing): `_____`
- [ ] Pages excluded (new spikes?): `Yes / No`
- [ ] 404 URLs found this week: `_____`

### Google Business Profile (GBP)
- [ ] Calls from profile: `_____` (last week: `_____`)
- [ ] Website clicks: `_____` (last week: `_____`)
- [ ] Direction requests: `_____` (last week: `_____`)
- [ ] New reviews: `_____`
- [ ] Average rating: `_____`
- [ ] GBP posts published this week: `_____` (target: `1+`)

---

## 2) Technical SEO Checks

- [ ] Run PageSpeed Insights for:
  - [ ] `/`
  - [ ] `/book-now`
  - [ ] `/airport-shuttle`
- [ ] Mobile performance >= `70` for key pages
- [ ] LCP under `2.5s` on core booking pages
- [ ] No new JS/CSS regressions in latest deploy
- [ ] Sitemap reachable: `/sitemap.xml`
- [ ] Robots + canonical checks pass

---

## 3) 404 -> 301 Recovery Workflow

- [ ] Export latest 404 list from Search Console
- [ ] Save as `frontend/seo/gsc-404-export.csv`
- [ ] Run:

```bash
cd frontend
npm run seo:redirect-map
```

- [ ] Review `seo/redirect-map.generated.csv`
- [ ] Apply approved redirects into `frontend/vercel.json` (redirects before rewrites)
- [ ] Deploy
- [ ] Validate top 20 redirected URLs (must return 301 -> correct target)
- [ ] Submit GSC validation for fixed 404 set

---

## 4) Local SEO / GBP Activity

- [ ] Publish 1 GBP post (offer/update/seasonal note)
- [ ] Add 1 new photo (vehicle, driver, pickup area, customer-safe content)
- [ ] Respond to all new reviews within 48 hours
- [ ] Verify opening hours + contact details are current
- [ ] Confirm main service area still matches business focus

---

## 5) Content + Search Intent Improvements

- [ ] Identify top 5 dropping queries in GSC
- [ ] For each dropped query, assign a target page:
  - Query: `__________` -> URL: `__________` -> Owner: `__________`
  - Query: `__________` -> URL: `__________` -> Owner: `__________`
  - Query: `__________` -> URL: `__________` -> Owner: `__________`
- [ ] Update page intro to answer user intent within first 2-3 sentences
- [ ] Ensure booking CTA appears above the fold on mobile

---

## 6) Conversion UX Checks (Booking Funnel)

- [ ] Booking form completion rate this week: `_____`
- [ ] Most common drop-off step: `_____`
- [ ] Confirm return-flight-number validation still works
- [ ] Confirm confirmation emails include:
  - [ ] Date/time/location at top
  - [ ] Calendar links (Google + Outlook)
  - [ ] Plain text fallback

---

## 7) Risks / Blockers

- Risk 1: `________________________________`
- Risk 2: `________________________________`
- Needed support: `_________________________`

---

## 8) Commitments for Next Week

- [ ] Technical: `_________________________`
- [ ] Content: `___________________________`
- [ ] GBP: `_______________________________`
- [ ] Redirect/Indexing: `__________________`
