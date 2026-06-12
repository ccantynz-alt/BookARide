/**
 * frontend/scripts/generate-seo-pages.mjs
 *
 * Generates api/_lib/seo-dynamic-pages.json from the frontend SEO data files
 * so the sitemap (api/sitemap.xml.js via api/_lib/seo-agent.js) and the
 * prerender step include every dynamic-slug page (/suburbs/:slug,
 * /hotels/:slug, /blog/:postSlug).
 *
 * Runs automatically as part of `npm run build` — the JSON is also committed
 * so the api/ serverless functions always have it at runtime.
 *
 * The data files are browser ESM; they are pure data with no imports, so we
 * transform them to CJS with esbuild and evaluate them in-process.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'src');
const outFile = path.join(__dirname, '..', '..', 'api', '_lib', 'seo-dynamic-pages.json');

function loadDataModule(relPath) {
  const code = readFileSync(path.join(srcDir, relPath), 'utf8');
  const { code: cjs } = transformSync(code, { format: 'cjs', loader: 'js' });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', cjs)(mod, mod.exports, () => {
    throw new Error(`${relPath} must stay a pure data file with no imports`);
  });
  return mod.exports;
}

const { aucklandSuburbs } = loadDataModule('data/aucklandSuburbs.js');
const { hibiscusCoastSuburbs } = loadDataModule('data/hibiscusCoastSuburbs.js');
const { hamiltonAreas } = loadDataModule('data/hamiltonAreas.js');
const { whangareiAreas } = loadDataModule('data/whangareiAreas.js');
const { allHotels } = loadDataModule('data/aucklandHotels.js');
const { blogPosts } = loadDataModule('data/blogPosts.js');

const slugsOf = (list, label) => {
  const slugs = (list || []).map((item) => item.slug).filter(Boolean);
  if (slugs.length === 0) throw new Error(`No slugs found for ${label} — data file changed shape?`);
  return slugs;
};

// /suburbs/:slug is served by SuburbPageSEO.jsx which merges all four regions
const suburbs = [...new Set([
  ...slugsOf(aucklandSuburbs, 'aucklandSuburbs'),
  ...slugsOf(hibiscusCoastSuburbs, 'hibiscusCoastSuburbs'),
  ...slugsOf(hamiltonAreas, 'hamiltonAreas'),
  ...slugsOf(whangareiAreas, 'whangareiAreas'),
])];

// No timestamp field: output must be deterministic so rebuilding without a
// data change leaves the committed JSON untouched (git history records when
// the slugs actually changed).
const payload = {
  suburbs,
  hotels: [...new Set(slugsOf(allHotels, 'allHotels'))],
  blog: [...new Set(slugsOf(blogPosts, 'blogPosts'))],
};

mkdirSync(path.dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`);

const total = payload.suburbs.length + payload.hotels.length + payload.blog.length;
console.error(`seo-dynamic-pages.json written: ${payload.suburbs.length} suburbs, ${payload.hotels.length} hotels, ${payload.blog.length} blog posts (${total} dynamic pages)`);
