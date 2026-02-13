#!/usr/bin/env node
/**
 * Generate a 404 -> 301 redirect plan from:
 *  - Current route inventory (App.js + sitemap.xml)
 *  - Optional Search Console export CSV of 404 URLs
 *
 * Outputs:
 *  - frontend/seo/redirect-map.generated.csv
 *  - frontend/seo/vercel-redirects.generated.json
 *  - frontend/seo/current-routes.generated.txt
 */

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const appPath = path.join(projectRoot, "src", "App.js");
const sitemapPath = path.join(projectRoot, "public", "sitemap.xml");

const defaults = {
  input: path.join(projectRoot, "seo", "gsc-404-export.csv"),
  outputCsv: path.join(projectRoot, "seo", "redirect-map.generated.csv"),
  outputJson: path.join(projectRoot, "seo", "vercel-redirects.generated.json"),
  outputRoutes: path.join(projectRoot, "seo", "current-routes.generated.txt"),
};

const LEGACY_REDIRECT_HINTS = {
  "/booking": "/book-now",
  "/book": "/book-now",
  "/bookings": "/book-now",
  "/airport-transfer": "/book-now",
  "/airport-transfers": "/book-now",
  "/airport-transfer-auckland": "/airport-shuttle",
  "/airport-shuttle-auckland": "/airport-shuttle",
  "/contact-us": "/contact",
  "/about-us": "/about",
  "/privacy": "/privacy-policy",
  "/privacy-policy-nz": "/privacy-policy",
  "/terms": "/terms-and-conditions",
  "/terms-conditions": "/terms-and-conditions",
  "/website-policy": "/website-usage-policy",
  "/flight-status": "/flight-tracker",
  "/track-flight": "/flight-tracker",
  "/airport-guide": "/airport-pickup-guide",
  "/travel-guide-auckland": "/travel-guide",
  "/resources": "/travel-guide",
  "/home": "/",
  "/index.php": "/",
  "/wp": "/",
  "/wp-login.php": "/admin/login",
  "/wp-admin": "/admin/login",
  "/admin": "/admin/login",
  "/chauffeur-booking": "/book-now",
  "/shared-transfer": "/shared-shuttle",
};

function parseArgs(argv) {
  const args = { ...defaults };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === "--input" && next) {
      args.input = path.resolve(process.cwd(), next);
      i += 1;
    } else if (token === "--output-csv" && next) {
      args.outputCsv = path.resolve(process.cwd(), next);
      i += 1;
    } else if (token === "--output-json" && next) {
      args.outputJson = path.resolve(process.cwd(), next);
      i += 1;
    } else if (token === "--output-routes" && next) {
      args.outputRoutes = path.resolve(process.cwd(), next);
      i += 1;
    }
  }
  return args;
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function normalizePath(input) {
  if (!input) return "";
  let value = String(input).trim();
  if (!value) return "";

  // Strip surrounding quotes from CSV exports
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1).trim();
  }

  try {
    if (/^https?:\/\//i.test(value)) {
      value = new URL(value).pathname || "/";
    }
  } catch (_error) {
    // Keep raw value if URL parsing fails
  }

  value = decodeURIComponent(value);
  value = value.split("?")[0].split("#")[0];
  value = value.replace(/\/{2,}/g, "/").trim();
  if (!value.startsWith("/")) value = `/${value}`;
  if (value.length > 1 && value.endsWith("/")) value = value.slice(0, -1);
  return value.toLowerCase();
}

function parseCsv(content) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };

  const pushRow = () => {
    // Trim carriage returns from cells
    rows.push(row.map((v) => v.replace(/\r/g, "")));
    row = [];
  };

  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];
    const next = content[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      pushCell();
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i += 1;
      pushCell();
      pushRow();
      continue;
    }

    cell += ch;
  }

  if (cell.length > 0 || row.length > 0) {
    pushCell();
    pushRow();
  }

  return rows.filter((r) => r.length > 0 && r.some((c) => c.trim() !== ""));
}

function toCsv(headers, rows) {
  const encode = (value) => {
    const text = value == null ? "" : String(value);
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  const lines = [headers.map(encode).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => encode(row[h])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function normalizeHeader(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function loadCsvSources(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf8");
  const parsed = parseCsv(content);
  if (parsed.length < 2) return [];

  const headers = parsed[0];
  const normalizedHeaders = headers.map(normalizeHeader);
  const preferred = [
    "url",
    "page",
    "path",
    "source",
    "notfoundurl",
    "notfound",
    "landingpage",
    "address",
  ];
  let sourceIdx = -1;
  for (const key of preferred) {
    const idx = normalizedHeaders.indexOf(key);
    if (idx !== -1) {
      sourceIdx = idx;
      break;
    }
  }
  if (sourceIdx === -1) sourceIdx = 0;

  const sources = [];
  for (let i = 1; i < parsed.length; i += 1) {
    const value = parsed[i][sourceIdx] || "";
    const pathValue = normalizePath(value);
    if (pathValue) sources.push(pathValue);
  }
  return Array.from(new Set(sources));
}

function extractRoutesFromApp(source) {
  const routes = new Set(["/"]);
  const objectPathRegex = /\{\s*path:\s*"([^"]+)"/g;
  const routePathRegex = /<Route\s+path="([^"]+)"/g;

  let match;
  while ((match = objectPathRegex.exec(source)) !== null) {
    routes.add(normalizePath(match[1]));
  }
  while ((match = routePathRegex.exec(source)) !== null) {
    routes.add(normalizePath(match[1]));
  }

  return routes;
}

function extractRoutesFromSitemap(xml) {
  const routes = new Set();
  const locRegex = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    routes.add(normalizePath(match[1]));
  }
  return routes;
}

function getRouteInventory() {
  const routeSet = new Set(["/"]);

  if (fs.existsSync(appPath)) {
    const appSource = fs.readFileSync(appPath, "utf8");
    for (const route of extractRoutesFromApp(appSource)) routeSet.add(route);
  }

  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, "utf8");
    for (const route of extractRoutesFromSitemap(sitemap)) routeSet.add(route);
  }

  const all = Array.from(routeSet).filter(Boolean).sort();
  const staticRoutes = all.filter((r) => !r.includes(":"));
  const dynamicRoutes = all.filter((r) => r.includes(":"));

  return { all, staticRoutes, dynamicRoutes };
}

function tokenize(pathname) {
  return pathname
    .replace(/^\/+|\/+$/g, "")
    .split(/[\/\-_]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function findNearestRoute(sourcePath, staticRoutes) {
  const sourceTokens = new Set(tokenize(sourcePath));
  if (sourceTokens.size === 0) return { route: "/", score: 0 };

  let bestRoute = "/";
  let bestScore = 0;

  for (const route of staticRoutes) {
    const routeTokens = tokenize(route);
    if (routeTokens.length === 0) continue;

    let overlap = 0;
    for (const token of routeTokens) {
      if (sourceTokens.has(token)) overlap += 1;
    }

    const score = overlap / Math.max(routeTokens.length, sourceTokens.size);
    if (score > bestScore) {
      bestScore = score;
      bestRoute = route;
    }
  }

  return { route: bestRoute, score: Number(bestScore.toFixed(2)) };
}

function suggestTarget(sourcePath, staticRoutes) {
  if (staticRoutes.includes(sourcePath)) {
    return {
      action: "keep",
      target: sourcePath,
      confidence: 1,
      reason: "already_exists",
    };
  }

  if (LEGACY_REDIRECT_HINTS[sourcePath]) {
    return {
      action: "redirect",
      target: LEGACY_REDIRECT_HINTS[sourcePath],
      confidence: 0.98,
      reason: "legacy_hint_map",
    };
  }

  if (/book|booking|quote|checkout/.test(sourcePath)) {
    return { action: "redirect", target: "/book-now", confidence: 0.9, reason: "booking_intent" };
  }
  if (/airport.*shuttle|shuttle.*airport/.test(sourcePath)) {
    return { action: "redirect", target: "/airport-shuttle", confidence: 0.9, reason: "airport_shuttle_intent" };
  }
  if (/flight/.test(sourcePath)) {
    return { action: "redirect", target: "/flight-tracker", confidence: 0.88, reason: "flight_intent" };
  }
  if (/contact/.test(sourcePath)) {
    return { action: "redirect", target: "/contact", confidence: 0.9, reason: "contact_intent" };
  }
  if (/about/.test(sourcePath)) {
    return { action: "redirect", target: "/about", confidence: 0.9, reason: "about_intent" };
  }
  if (/service/.test(sourcePath)) {
    return { action: "redirect", target: "/services", confidence: 0.9, reason: "service_intent" };
  }
  if (/privacy/.test(sourcePath)) {
    return { action: "redirect", target: "/privacy-policy", confidence: 0.92, reason: "privacy_intent" };
  }
  if (/term|condition/.test(sourcePath)) {
    return {
      action: "redirect",
      target: "/terms-and-conditions",
      confidence: 0.92,
      reason: "terms_intent",
    };
  }
  if (/hotel|concierge/.test(sourcePath)) {
    return { action: "redirect", target: "/hotel-portal", confidence: 0.86, reason: "hotel_intent" };
  }

  const nearest = findNearestRoute(sourcePath, staticRoutes);
  if (nearest.score >= 0.34) {
    return {
      action: "redirect",
      target: nearest.route,
      confidence: nearest.score,
      reason: "token_similarity",
    };
  }

  return {
    action: "redirect",
    target: "/book-now",
    confidence: 0.45,
    reason: "fallback_booking_page",
  };
}

function main() {
  const args = parseArgs(process.argv);
  const inventory = getRouteInventory();

  const csvSources = loadCsvSources(args.input);
  const sourcePaths = csvSources.length > 0
    ? csvSources
    : Object.keys(LEGACY_REDIRECT_HINTS).map((p) => normalizePath(p));

  const rows = [];
  for (const source of sourcePaths) {
    const suggestion = suggestTarget(source, inventory.staticRoutes);
    rows.push({
      source_path: source,
      target_path: suggestion.target,
      http_status: suggestion.action === "redirect" ? "301" : "200",
      action: suggestion.action,
      confidence: suggestion.confidence,
      reason: suggestion.reason,
    });
  }

  // Dedupe and stable sort
  const dedupedMap = new Map();
  for (const row of rows) {
    if (!dedupedMap.has(row.source_path)) dedupedMap.set(row.source_path, row);
  }
  const deduped = Array.from(dedupedMap.values()).sort((a, b) => a.source_path.localeCompare(b.source_path));

  const redirects = deduped
    .filter((r) => r.action === "redirect" && r.source_path !== r.target_path)
    .map((r) => ({ source: r.source_path, destination: r.target_path, permanent: true }));

  ensureParentDir(args.outputCsv);
  ensureParentDir(args.outputJson);
  ensureParentDir(args.outputRoutes);

  fs.writeFileSync(
    args.outputCsv,
    toCsv(["source_path", "target_path", "http_status", "action", "confidence", "reason"], deduped),
    "utf8"
  );

  fs.writeFileSync(
    args.outputJson,
    `${JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        source_count: sourcePaths.length,
        redirect_count: redirects.length,
        redirects,
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  fs.writeFileSync(
    args.outputRoutes,
    `${inventory.staticRoutes.join("\n")}\n`,
    "utf8"
  );

  console.log(`Routes discovered: ${inventory.all.length} (${inventory.staticRoutes.length} static)`);
  console.log(`Input 404 sources: ${sourcePaths.length}${csvSources.length ? ` from ${args.input}` : " (legacy seed map)"}`);
  console.log(`Redirects generated: ${redirects.length}`);
  console.log(`CSV: ${args.outputCsv}`);
  console.log(`Vercel JSON: ${args.outputJson}`);
  console.log(`Route inventory: ${args.outputRoutes}`);
}

main();
