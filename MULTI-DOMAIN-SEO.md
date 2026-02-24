# How each multi-domain option affects SEO

---

## Option A: Same app on every domain

**What it is:** The same React app (and same pages/content) is deployed on bookaride.co.nz, airportshuttleservice.co.nz, hibiscustoairport.co.nz, etc.

**SEO impact:**

- **Duplicate content risk:** If each domain has identical pages (same text, same structure), Google may treat them as duplicates. That can:
  - Split “signals” across domains so no single URL gets as strong a ranking.
  - Lead Google to pick one version and show it in search, or filter others out.

**What to do:**

1. **Use a single canonical domain**  
   Choose one primary domain (e.g. **bookaride.co.nz**) and have every page on the other domains use a canonical tag pointing to the matching URL on that primary domain.  
   Example on `https://airportshuttleservice.co.nz/book-now`:  
   `<link rel="canonical" href="https://bookaride.co.nz/book-now" />`  
   Then search engines treat bookaride.co.nz as the “main” version and consolidate signals there.

2. **Or make each domain clearly different**  
   If each domain has its own branding, audience, and unique copy (not the same text everywhere), duplicate content is less of an issue and each site can rank for its own terms.

**Summary:** Option A can work for SEO if you either canonicalise to one domain or differentiate content per domain.

---

## Option B: “Book now” redirects to the main site

**What it is:** Other domains are their own sites (their own content, branding). Only the “Book now” button/link sends users to **bookaride.co.nz/book-now**.

**SEO impact:**

- **Generally good for SEO:**
  - No duplicate booking-form content; the form exists only on bookaride.co.nz.
  - Each domain (airportshuttleservice.co.nz, hibiscustoairport.co.nz, etc.) keeps its own content and can rank for its own topics and keywords.
  - Link equity and relevance stay on each site; you’re not diluting one set of pages across many domains.
- **Conversion flow:** Users land on the partner domain from search, then go to bookaride.co.nz only when they want to book. The main site gets the conversions; partner sites support discovery and trust.

**Summary:** Option B is usually the cleanest for SEO: clear ownership of content per domain, no duplicate-form issues.

---

## Option C: Embed the form in an iframe

**What it is:** Partner sites embed **bookaride.co.nz/book-now** in an iframe on their own page.

**SEO impact:**

- **Partner page:** The page on e.g. airportshuttleservice.co.nz has its own URL, title, and content around the iframe. That’s what search engines mainly associate with that URL. So the partner domain can still rank for its own content.
- **Form content:** Content inside the iframe is loaded from bookaride.co.nz. Google may index the source URL (bookaride.co.nz/book-now) separately. The iframe content often doesn’t add much **extra** SEO value to the partner URL, and some crawlers don’t deeply execute iframes, so the main “booking” page in search is usually bookaride.co.nz/book-now.
- **Duplicate content:** Typically not a big issue, because the partner page is mostly unique (their copy + an embed), and the form is clearly one shared experience on one canonical URL.

**Summary:** Option C is fine for SEO: partner sites keep their own identity and can rank; the main booking URL stays bookaride.co.nz. It’s a middle ground between A and B.

---

## Quick comparison

| Option | Duplicate content risk | Each domain can rank? | Best for SEO when… |
|--------|------------------------|------------------------|----------------------|
| **A** – Same app on all domains | Yes, if pages are identical | Only if you use canonicals or unique content | You canonicalise to one domain or fully differentiate each site. |
| **B** – Redirect to main site | No | Yes | You want each domain to have its own content and rankings; form lives in one place. |
| **C** – Iframe embed | Low | Yes (for the page’s own content) | You want the form on the partner page but are fine with the main booking URL being bookaride.co.nz. |

**Practical takeaway:** For the cleanest SEO, **Option B** (redirect to bookaride.co.nz/book-now) is usually best. If you want the form visible on partner sites without duplicate-content risk, **Option C** (iframe) is a good compromise. **Option A** is fine if you either canonicalise all booking (and duplicate) pages to one domain or make each domain’s content clearly unique.
