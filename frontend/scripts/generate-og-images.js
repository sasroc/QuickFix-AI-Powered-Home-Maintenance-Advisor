/**
 * Build-time Open Graph image generator for the /fix guide system.
 *
 * Runs after `craco build` (see package.json), using headless Chrome
 * (already a devDependency via prerender.js) to screenshot a small branded
 * HTML template — guide/category title over a QuickFix AI gradient — at
 * the standard 1200x630 OG size, for every guide and category. No server
 * is needed since the template is static markup rendered in-memory via
 * page.setContent().
 *
 * Output goes to build/og/*.png (a build artifact, not committed —
 * frontend/build/ is gitignored) so it's regenerated fresh from whatever
 * guide titles exist at deploy time, the same way scripts/prerender.js
 * writes its snapshots into build/.
 *
 * Failure handling: best-effort, like prerender.js. If Chrome can't launch
 * in a given CI environment, we log a warning and leave pages falling back
 * to Seo.js's site-wide default OG image rather than failing the build.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const OUT_DIR = path.join(BUILD_DIR, 'og');
const GUIDES_DIR = path.join(__dirname, '..', 'src', 'content', 'guides');
const CATEGORIES_PATH = path.join(__dirname, '..', 'src', 'content', 'categories.json');

function loadCategories() {
  return JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf8'));
}

function loadGuides() {
  return fs
    .readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(GUIDES_DIR, f), 'utf8')));
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function template({ eyebrow, title }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px;
    height: 630px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 80px;
    background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #ffffff;
  }
  .eyebrow { font-size: 28px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; opacity: 0.85; margin-bottom: 24px; }
  .title { font-size: 56px; font-weight: 800; line-height: 1.15; max-width: 1000px; text-shadow: 0 2px 8px rgba(0,0,0,0.15); }
  .brand { position: absolute; bottom: 56px; left: 80px; font-size: 32px; font-weight: 800; }
</style>
</head>
<body>
  <div class="eyebrow">${escapeHtml(eyebrow)}</div>
  <div class="title">${escapeHtml(title)}</div>
  <div class="brand">🛠️ QuickFix AI</div>
</body>
</html>`;
}

async function run() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.warn('[og] build/ not found — run this after "craco build". Skipping.');
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const guides = loadGuides();
  const categories = loadCategories();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630 });

    let failures = 0;

    // waitUntil: 'load' rather than 'networkidle0' — the template is fully
    // self-contained inline HTML/CSS with zero external requests, so
    // networkidle0's "500ms of no in-flight requests" wait buys nothing
    // and has proven flaky (hangs to its own timeout) across repeated
    // setContent() calls on the same page/tab.
    for (const guide of guides) {
      try {
        const category = categoryBySlug.get(guide.category);
        const html = template({ eyebrow: category ? category.title : 'Repair Guide', title: guide.title });
        await page.setContent(html, { waitUntil: 'load', timeout: 15000 });
        await page.screenshot({ path: path.join(OUT_DIR, `${guide.slug}.png`) });
        console.log(`[og]   wrote og/${guide.slug}.png`);
      } catch (err) {
        failures += 1;
        console.warn(`[og] WARNING: failed to render og/${guide.slug}.png, that page falls back to the default og-image.png:`, err.message);
      }
    }

    for (const category of categories) {
      try {
        const html = template({ eyebrow: 'QuickFix AI Repair Guides', title: category.title });
        await page.setContent(html, { waitUntil: 'load', timeout: 15000 });
        await page.screenshot({ path: path.join(OUT_DIR, `category-${category.slug}.png`) });
        console.log(`[og]   wrote og/category-${category.slug}.png`);
      } catch (err) {
        failures += 1;
        console.warn(`[og] WARNING: failed to render og/category-${category.slug}.png, that page falls back to the default og-image.png:`, err.message);
      }
    }

    console.log(`[og] done — ${guides.length + categories.length - failures} image(s) written, ${failures} failure(s).`);
  } catch (err) {
    console.warn('[og] WARNING: OG image generation failed — pages will fall back to the default og-image.png:', err.message);
  } finally {
    if (browser) await browser.close();
  }
}

run().catch((err) => {
  console.warn('[og] SKIPPED — unexpected error, build continues:', err.message);
  process.exit(0);
});
