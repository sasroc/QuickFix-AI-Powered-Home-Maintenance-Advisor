/**
 * Build-time prerenderer for the CRA/craco SPA.
 *
 * Runs after `craco build`. Spins up a static server for the build/ output,
 * then uses headless Chrome to visit each public route, waits for React to
 * paint real content, and writes the resulting DOM back to
 * build/<route>/index.html. That gives crawlers (and `curl`) real headings,
 * body copy, links, and meta tags in the raw HTML response instead of the
 * bare "You need to enable JavaScript" shell — without migrating off CRA.
 *
 * Routes here intentionally match public/sitemap.xml and the `Allow`d
 * portion of public/robots.txt: only routes crawlers should index get a
 * prerendered snapshot. Auth-gated routes (/repair, /settings, /admin/*)
 * are excluded on purpose. The /fix/* guide routes are the exception to
 * "match sitemap.xml" being a hand-maintained list — see loadFixRoutes()
 * below, which derives them from src/content/ the same way
 * scripts/generate-sitemap.js does.
 *
 * Failure handling: this step is best-effort and NEVER fails the overall
 * `npm run build`. If headless Chrome can't launch in a given CI
 * environment (e.g. missing system libs), or a specific route times out,
 * we log a loud warning and leave the plain CRA output for that route
 * in place rather than blocking deployment of everything else (canonical
 * URLs, robots.txt/sitemap.xml, per-page meta tags, JSON-LD) that doesn't
 * depend on this step.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

const PORT = 4568;
const BUILD_DIR = path.join(__dirname, '..', 'build');
const SERVE_BIN = path.join(__dirname, '..', 'node_modules', '.bin', process.platform === 'win32' ? 'serve.cmd' : 'serve');
const GUIDES_DIR = path.join(__dirname, '..', 'src', 'content', 'guides');
const CATEGORIES_PATH = path.join(__dirname, '..', 'src', 'content', 'categories.json');

// Derives every /fix/* route from the same content records the React app
// itself reads (src/content/) — a new guide or category picked up there is
// prerendered automatically, no route list to maintain by hand. Falls back
// to no /fix routes (rather than failing the whole build) if content can't
// be read.
function loadFixRoutes() {
  try {
    const categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf8'));
    const guideFiles = fs.readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.json'));
    const guideRoutes = guideFiles.map((f) => {
      const guide = JSON.parse(fs.readFileSync(path.join(GUIDES_DIR, f), 'utf8'));
      return `/fix/${guide.slug}`;
    });
    const categoryRoutes = categories.map((c) => `/fix/${c.slug}`);
    return ['/fix', ...categoryRoutes, ...guideRoutes];
  } catch (err) {
    console.warn('[prerender] WARNING: could not load /fix routes from content, skipping them:', err.message);
    return [];
  }
}

// "/" is rendered LAST on purpose. serve's SPA fallback serves build/index.html
// for any route that doesn't yet have a physical file on disk. If we wrote "/"
// first, every other route's initial (pre-hydration) HTML would be the
// homepage's already-baked snapshot instead of the pristine template — and
// since that snapshot's <title>/<link rel="canonical"> aren't tags Helmet
// rendered, Helmet would append its own alongside them instead of replacing
// them, duplicating both on every other page.
const ROUTES = ['/pricing', '/faq', '/community', '/auth', '/terms', '/privacy', ...loadFixRoutes(), '/'];

function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function check() {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Static server did not come up at ${url}`));
          return;
        }
        setTimeout(check, 300);
      });
    })();
  });
}

async function run() {
  if (!fs.existsSync(BUILD_DIR)) {
    throw new Error(`build/ not found at ${BUILD_DIR} — run "craco build" first.`);
  }

  console.log(`[prerender] starting static server for ${BUILD_DIR} on port ${PORT}...`);
  const server = spawn(SERVE_BIN, ['-s', BUILD_DIR, '-l', String(PORT)], { stdio: 'ignore' });

  let browser;
  const failedRoutes = [];
  try {
    await waitForServer(`http://localhost:${PORT}/`);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    for (const route of ROUTES) {
      try {
        const page = await browser.newPage();

        // Keep the snapshot deterministic and offline-safe: allow only
        // requests back to our own static server (the JS bundle, CSS, etc).
        // Cross-origin calls (Firebase/Firestore/Analytics/Sentry/fonts) are
        // blocked so prerendering never depends on live services or pollutes
        // real analytics with bot pageviews — real visitors still make these
        // calls normally once the client bundle hydrates in their browser.
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          if (req.url().startsWith(`http://localhost:${PORT}`)) {
            req.continue();
          } else {
            req.abort();
          }
        });

        const url = `http://localhost:${PORT}${route}`;
        console.log(`[prerender] rendering ${url}`);
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

        // Let React finish its initial mount/paint pass.
        await page.waitForSelector('#root', { timeout: 10000 });
        await new Promise((resolve) => setTimeout(resolve, 500));

        const html = await page.content();

        const outDir = route === '/' ? BUILD_DIR : path.join(BUILD_DIR, route);
        fs.mkdirSync(outDir, { recursive: true });
        const outFile = path.join(outDir, 'index.html');
        fs.writeFileSync(outFile, html);
        console.log(`[prerender]   -> wrote ${path.relative(BUILD_DIR, outFile)}`);

        await page.close();
      } catch (routeErr) {
        failedRoutes.push(route);
        console.warn(`[prerender] WARNING: failed to prerender ${route}, leaving CRA output as-is:`, routeErr.message);
      }
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }

  if (failedRoutes.length > 0) {
    console.warn(`[prerender] done with ${failedRoutes.length} route(s) not prerendered: ${failedRoutes.join(', ')}`);
  } else {
    console.log('[prerender] done, all routes prerendered successfully.');
  }
}

run().catch((err) => {
  // Never fail the overall build over this step: canonical URLs, meta tags,
  // robots.txt/sitemap.xml and JSON-LD all still ship correctly without it —
  // only the raw-HTML crawler content falls back to the plain CRA shell.
  console.warn('====================================================================');
  console.warn('[prerender] SKIPPED — could not prerender routes in this environment.');
  console.warn('[prerender] The rest of the SEO fixes (canonical URLs, meta tags,');
  console.warn('[prerender] robots.txt/sitemap.xml, JSON-LD) are unaffected. Routes');
  console.warn('[prerender] will render client-side as before until this is fixed.');
  console.warn('[prerender] Reason:', err && err.message ? err.message : err);
  console.warn('====================================================================');
  process.exit(0);
});
