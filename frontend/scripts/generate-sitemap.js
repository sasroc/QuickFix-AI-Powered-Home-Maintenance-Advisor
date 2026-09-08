/**
 * Regenerates public/sitemap.xml from the static route list plus every
 * category hub and guide record under src/content/. Runs before `craco
 * build` (see package.json) so CRA copies the freshly-written file into
 * build/ like any other public/ asset, and the result is also committed to
 * source control like the rest of public/ — re-run this any time content
 * changes and commit the diff.
 */
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://quickfixai.net';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const GUIDES_DIR = path.join(__dirname, '..', 'src', 'content', 'guides');
const CATEGORIES_PATH = path.join(__dirname, '..', 'src', 'content', 'categories.json');

const today = new Date().toISOString().slice(0, 10);

// Mirrors the hand-maintained routes that were already in sitemap.xml.
// Update this list alongside App.js if a top-level public route is
// added/removed — it's intentionally not auto-derived from the router so a
// route that's meant to stay unindexed (e.g. /repair, /settings) can't
// silently end up here.
const STATIC_ROUTES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/pricing', changefreq: 'monthly', priority: '0.9' },
  { loc: '/faq', changefreq: 'monthly', priority: '0.8' },
  { loc: '/community', changefreq: 'weekly', priority: '0.7' },
  { loc: '/auth', changefreq: 'monthly', priority: '0.5' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
];

function loadCategories() {
  return JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf8'));
}

function loadGuides() {
  return fs
    .readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(GUIDES_DIR, f), 'utf8')));
}

function xmlEscape(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${xmlEscape(SITE_URL + loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

function run() {
  const categories = loadCategories();
  const guides = loadGuides();

  const entries = [];
  STATIC_ROUTES.forEach((r) => entries.push(urlEntry({ ...r, lastmod: today })));
  entries.push(urlEntry({ loc: '/fix', lastmod: today, changefreq: 'weekly', priority: '0.8' }));
  categories.forEach((c) => entries.push(urlEntry({ loc: `/fix/${c.slug}`, lastmod: today, changefreq: 'weekly', priority: '0.7' })));
  guides.forEach((g) => entries.push(urlEntry({ loc: `/fix/${g.slug}`, lastmod: g.updatedAt || today, changefreq: 'monthly', priority: '0.6' })));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), xml);
  console.log(`[sitemap] wrote ${entries.length} URLs (${guides.length} guides, ${categories.length} categories) to public/sitemap.xml`);
}

run();
