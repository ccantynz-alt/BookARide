/**
 * api/_lib/seo-pages.js
 *
 * Pure data module: every public page on the site (static routes +
 * dynamic-slug pages). NO requires on db/email/network modules so the
 * frontend prerender script (frontend/scripts/prerender.mjs) can load it
 * during the Vercel build, where api/node_modules is not installed.
 *
 * seo-agent.js re-exports TRACKED_PAGES from here — the rule in CLAUDE.md
 * ('the list lives in api/_lib/seo-agent.js') still holds via that export.
 */


// All pages we want indexed. MUST stay in sync with frontend/src/App.jsx
// commonRoutes. Excludes: admin/*, driver/*, track/*, transactional pages
// (payment-success, pay/:bookingId), and dynamic-slug routes (suburbs/:slug,
// hotels/:slug, blog/:postSlug, routes/:routeSlug, airport-transfer/:slug,
// visitors/:countrySlug — these are covered by their static-slug siblings).
const TRACKED_PAGES = [
  // Top-priority — daily change
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/book-now', priority: '1.0', changefreq: 'daily' },
  { path: '/airport-shuttle', priority: '1.0', changefreq: 'daily' },
  { path: '/airport-shuttle-service', priority: '1.0', changefreq: 'daily' },
  { path: '/auckland-airport-shuttle', priority: '1.0', changefreq: 'daily' },
  { path: '/auckland-cbd-to-airport', priority: '1.0', changefreq: 'daily' },
  { path: '/auckland-airport-to-city', priority: '1.0', changefreq: 'daily' },
  { path: '/shared-ride', priority: '0.9', changefreq: 'weekly' },
  { path: '/north-shore-airport-shuttle', priority: '0.9', changefreq: 'weekly' },
  { path: '/hibiscus-coast-airport-shuttle', priority: '0.9', changefreq: 'weekly' },

  // Standard pages
  { path: '/services', priority: '0.9', changefreq: 'weekly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/hobbiton-transfers', priority: '0.8', changefreq: 'weekly' },
  { path: '/cruise-transfers', priority: '0.8', changefreq: 'weekly' },
  { path: '/airport-pickup-guide', priority: '0.7', changefreq: 'monthly' },
  { path: '/auckland-airport-arrivals-guide', priority: '0.8', changefreq: 'weekly' },
  { path: '/new-zealand-travel-checklist', priority: '0.8', changefreq: 'weekly' },
  { path: '/travel-guide', priority: '0.7', changefreq: 'weekly' },
  { path: '/international-visitors', priority: '0.8', changefreq: 'weekly' },
  { path: '/hibiscus-coast', priority: '0.8', changefreq: 'weekly' },
  { path: '/suburbs', priority: '0.8', changefreq: 'weekly' },
  { path: '/hotels', priority: '0.8', changefreq: 'weekly' },
  { path: '/routes', priority: '0.8', changefreq: 'weekly' },
  { path: '/blog', priority: '0.7', changefreq: 'daily' },
  { path: '/compare', priority: '0.7', changefreq: 'weekly' },
  { path: '/referral', priority: '0.6', changefreq: 'monthly' },

  // Travel-agent / B2B
  { path: '/travel-agents', priority: '0.7', changefreq: 'monthly' },

  // International landing pages (visitors/<country>)
  { path: '/visitors', priority: '0.8', changefreq: 'weekly' },
  { path: '/visitors/usa', priority: '0.8', changefreq: 'weekly' },
  { path: '/visitors/canada', priority: '0.8', changefreq: 'weekly' },
  { path: '/visitors/uk', priority: '0.8', changefreq: 'weekly' },
  { path: '/visitors/germany', priority: '0.8', changefreq: 'weekly' },
  { path: '/visitors/france', priority: '0.8', changefreq: 'weekly' },
  { path: '/visitors/china', priority: '0.8', changefreq: 'weekly' },
  { path: '/visitors/japan', priority: '0.8', changefreq: 'weekly' },
  { path: '/visitors/korea', priority: '0.8', changefreq: 'weekly' },
  { path: '/visitors/singapore', priority: '0.8', changefreq: 'weekly' },
  { path: '/visitors/australia', priority: '0.8', changefreq: 'weekly' },
  { path: '/visitors/india', priority: '0.8', changefreq: 'weekly' },
  { path: '/visitors/uae', priority: '0.8', changefreq: 'weekly' },

  // International airport pages
  { path: '/international/auckland-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/international/hamilton-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/international/corporate-transfers', priority: '0.7', changefreq: 'monthly' },
  { path: '/international/group-bookings', priority: '0.7', changefreq: 'monthly' },

  // Auckland airport-to-X SEO route pages
  { path: '/auckland-airport-to-whangaparaoa', priority: '0.8', changefreq: 'weekly' },
  { path: '/auckland-airport-to-orewa', priority: '0.8', changefreq: 'weekly' },
  { path: '/auckland-airport-to-north-shore', priority: '0.8', changefreq: 'weekly' },
  { path: '/auckland-airport-to-hibiscus-coast', priority: '0.8', changefreq: 'weekly' },
  { path: '/auckland-airport-to-silverdale', priority: '0.8', changefreq: 'weekly' },
  { path: '/auckland-airport-to-gulf-harbour', priority: '0.8', changefreq: 'weekly' },
  { path: '/auckland-airport-to-albany', priority: '0.8', changefreq: 'weekly' },
  { path: '/auckland-airport-to-takapuna', priority: '0.8', changefreq: 'weekly' },
  { path: '/auckland-airport-to-devonport', priority: '0.8', changefreq: 'weekly' },
  { path: '/auckland-airport-to-matakana', priority: '0.8', changefreq: 'weekly' },
  { path: '/auckland-cruise-terminal-transfer', priority: '0.8', changefreq: 'weekly' },

  // Comparison pages
  { path: '/bookaride-vs-supershuttle', priority: '0.8', changefreq: 'weekly' },
  { path: '/bookaride-vs-uber', priority: '0.8', changefreq: 'weekly' },
  { path: '/bookaride-vs-taxi', priority: '0.8', changefreq: 'weekly' },
  { path: '/bookaride-vs-hibiscus-shuttles', priority: '0.8', changefreq: 'weekly' },
  { path: '/best-hibiscus-coast-shuttle-service', priority: '0.8', changefreq: 'weekly' },

  // Suburb landing pages — Hibiscus Coast / North Shore
  { path: '/orewa-to-auckland-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/whangaparoa-airport-transfer', priority: '0.8', changefreq: 'weekly' },
  { path: '/takapuna-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/albany-to-airport', priority: '0.8', changefreq: 'weekly' },

  // Auckland CBD suburbs (legacy slugs)
  { path: '/auckland-cbd-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/ponsonby-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/parnell-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/newmarket-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/remuera-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/mt-eden-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/grey-lynn-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/epsom-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/mission-bay-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/viaduct-to-airport', priority: '0.8', changefreq: 'weekly' },

  // Mount Roskill Corridor (airport-shuttle-X)
  { path: '/airport-shuttle-mount-roskill', priority: '0.8', changefreq: 'weekly' },
  { path: '/airport-shuttle-sandringham', priority: '0.8', changefreq: 'weekly' },
  { path: '/airport-shuttle-mount-eden', priority: '0.8', changefreq: 'weekly' },
  { path: '/airport-shuttle-mount-albert', priority: '0.8', changefreq: 'weekly' },
  { path: '/airport-shuttle-epsom', priority: '0.8', changefreq: 'weekly' },
  { path: '/airport-shuttle-newmarket', priority: '0.8', changefreq: 'weekly' },
  { path: '/airport-shuttle-parnell', priority: '0.8', changefreq: 'weekly' },
  { path: '/airport-shuttle-remuera', priority: '0.8', changefreq: 'weekly' },
  { path: '/airport-shuttle-grey-lynn', priority: '0.8', changefreq: 'weekly' },
  { path: '/airport-shuttle-ponsonby', priority: '0.8', changefreq: 'weekly' },

  // CBD & Inner Suburb Pages
  { path: '/britomart-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/freemans-bay-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/herne-bay-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/grafton-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/kingsland-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/sandringham-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },

  // Eastern Suburbs
  { path: '/st-heliers-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/kohimarama-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/orakei-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/meadowbank-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/glen-innes-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/panmure-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/ellerslie-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/mt-wellington-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },

  // South Auckland
  { path: '/mangere-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/otahuhu-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/papatoetoe-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/manukau-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/botany-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/howick-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/pakuranga-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },

  // West Auckland
  { path: '/henderson-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/new-lynn-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/titirangi-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/glen-eden-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/avondale-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/mt-albert-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/pt-chevalier-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/blockhouse-bay-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },

  // North Shore Additional
  { path: '/devonport-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/northcote-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/birkenhead-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/glenfield-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/milford-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/browns-bay-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/mairangi-bay-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/murrays-bay-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/torbay-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/long-bay-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },

  // Expansion Suburbs
  { path: '/pukekohe-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/drury-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/flat-bush-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/te-atatu-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/massey-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/papakura-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/onehunga-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/mount-roskill-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/royal-oak-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },
  { path: '/beachlands-to-auckland-airport', priority: '0.7', changefreq: 'weekly' },

  // Legal pages (low priority but should be indexable)
  { path: '/terms-and-conditions', priority: '0.3', changefreq: 'yearly' },
  { path: '/website-usage-policy', priority: '0.3', changefreq: 'yearly' },
  { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
];

// Dynamic-slug pages (/suburbs/:slug, /hotels/:slug, /blog/:postSlug).
// Generated from the frontend data files by
// frontend/scripts/generate-seo-pages.mjs (runs on every `npm run build`).
// Without these the sitemap was missing 100+ live landing pages.
let DYNAMIC_PAGES = [];
try {
  const dyn = require('./seo-dynamic-pages.json');
  DYNAMIC_PAGES = [
    ...(dyn.suburbs || []).map(s => ({ path: `/suburbs/${s}`, priority: '0.7', changefreq: 'weekly' })),
    ...(dyn.hotels || []).map(s => ({ path: `/hotels/${s}`, priority: '0.7', changefreq: 'weekly' })),
    ...(dyn.blog || []).map(s => ({ path: `/blog/${s}`, priority: '0.6', changefreq: 'monthly' })),
  ];
} catch (err) {
  console.error('CRITICAL: seo-dynamic-pages.json missing/invalid — sitemap will only contain static pages:', err.message);
}

const ALL_PAGES = [...TRACKED_PAGES, ...DYNAMIC_PAGES];

module.exports = { TRACKED_PAGES, DYNAMIC_PAGES, ALL_PAGES };
