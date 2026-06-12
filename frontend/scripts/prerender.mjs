/**
 * frontend/scripts/prerender.mjs — build-time pre-rendering.
 *
 * Runs AFTER `vite build`. For every public page (static routes + dynamic
 * slugs from api/_lib/seo-pages.js) it renders the React app to HTML via
 * src/entry-server.jsx and writes build/<path>/index.html.
 *
 * WHY: the site was a pure client-side SPA — Google can render JS, but AI
 * search crawlers (GPTBot, PerplexityBot, ClaudeBot) mostly cannot, so they
 * saw an empty <div id="root">. Prerendered HTML makes every landing page
 * readable by every crawler.
 *
 * Vercel serves static files before the SPA rewrite in vercel.json, so
 * build/suburbs/orewa/index.html is automatically served at /suburbs/orewa.
 * Non-prerendered routes (admin, driver, track, pay) still fall through to
 * the SPA shell exactly as before.
 *
 * The browser still mounts the SPA with createRoot (replace, not hydrate) —
 * see src/entry-server.jsx for why that is deliberate.
 *
 * FAILS THE BUILD if any page errors or renders empty — a page that cannot
 * prerender is a page crawlers cannot read, and silent regressions are how
 * SEO dies. Fix the page, don't bypass the check.
 */
import { build } from 'vite';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, '..');
const buildDir = path.join(frontendDir, 'build');

// Pure data module — no api/node_modules dependencies
const { ALL_PAGES } = require('../../api/_lib/seo-pages.js');

const DEFAULT_SEO_START = '<!-- default-seo-start';
const DEFAULT_SEO_END = '<!-- default-seo-end -->';

function injectHead(template, helmet) {
  const title = helmet?.title?.toString() || '';
  // Only swap the default SEO block when the page sets its own title —
  // otherwise keep the template defaults.
  if (!title || title.includes('></title>')) return template;

  const headTags = [
    title,
    helmet.meta?.toString() || '',
    helmet.link?.toString() || '',
    helmet.script?.toString() || '',
  ].filter(Boolean).join('\n        ');

  const start = template.indexOf(DEFAULT_SEO_START);
  const endMarker = template.indexOf(DEFAULT_SEO_END);
  if (start === -1 || endMarker === -1) {
    throw new Error('default-seo markers missing from index.html — prerender cannot inject page meta');
  }
  const end = endMarker + DEFAULT_SEO_END.length;
  return template.slice(0, start) + headTags + template.slice(end);
}

async function main() {
  const template = readFileSync(path.join(buildDir, 'index.html'), 'utf8');

  // SSR-build the server entry into one ESM bundle. Rollup bundles every
  // dependency (ssr.noExternal: true) with proper CJS interop — the same
  // pipeline the client build uses, so what builds for the browser builds
  // for prerender.
  const ssrOutDir = path.join(frontendDir, 'build-ssr');
  await build({
    root: frontendDir,
    configFile: path.join(frontendDir, 'vite.config.js'),
    logLevel: 'error',
    ssr: { noExternal: true },
    build: {
      ssr: 'src/entry-server.jsx',
      outDir: 'build-ssr',
      emptyOutDir: true,
    },
  });

  const failures = [];
  let done = 0;

  try {
    const { render } = await import(pathToFileURL(path.join(ssrOutDir, 'entry-server.js')).href);

    for (const page of ALL_PAGES) {
      try {
        const { html, helmet } = await render(page.path);

        // A prerendered page with no real content is a regression — fail loud.
        if (!html || html.length < 2000) {
          throw new Error(`rendered only ${html?.length ?? 0} bytes — page is empty or stuck on the Suspense fallback`);
        }

        let pageHtml = injectHead(template, helmet);
        pageHtml = pageHtml.replace('<div id="root"></div>', `<div id="root">${html}</div>`);

        const outDir = page.path === '/'
          ? buildDir
          : path.join(buildDir, page.path.replace(/^\//, ''));
        mkdirSync(outDir, { recursive: true });
        writeFileSync(path.join(outDir, 'index.html'), pageHtml);
        done++;
      } catch (err) {
        failures.push({ path: page.path, error: err.message });
      }
    }
  } finally {
    // The SSR bundle is a build intermediate — never deploy it.
    rmSync(ssrOutDir, { recursive: true, force: true });
  }

  if (failures.length > 0) {
    console.error(`PRERENDER FAILED for ${failures.length} page(s):`);
    for (const f of failures) console.error(`  ${f.path}: ${f.error}`);
    process.exit(1);
  }

  console.error(`Prerendered ${done}/${ALL_PAGES.length} pages into ${path.relative(process.cwd(), buildDir)}/`);
}

main().catch((err) => {
  console.error('PRERENDER CRASHED:', err);
  process.exit(1);
});
