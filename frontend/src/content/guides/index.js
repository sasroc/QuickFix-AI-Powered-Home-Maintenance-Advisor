/**
 * Auto-loads every guide record JSON file in this directory at build time
 * via webpack's require.context — no manual registration needed. Drop a
 * new `<slug>.json` file here (see README.md for the schema, or run
 * `npm run new:guide -- <slug>`) and it's automatically included in the
 * next build. This is plain synchronous bundling, not a network fetch, so
 * it satisfies "no client-side data fetching for page content".
 */
const context = require.context('./', false, /\.json$/);

const GUIDES = context.keys().map((key) => {
  const mod = context(key);
  return mod && mod.default ? mod.default : mod;
});

const GUIDES_BY_SLUG = new Map(GUIDES.map((g) => [g.slug, g]));

export function getAllGuides() {
  return GUIDES;
}

export function getGuideBySlug(slug) {
  return GUIDES_BY_SLUG.get(slug) || null;
}

export function getGuidesByCategory(categorySlug) {
  return GUIDES.filter((g) => g.category === categorySlug);
}

/**
 * Resolves a guide's relatedSlugs into full guide records, silently
 * dropping any slug that doesn't (or no longer) exists rather than
 * throwing — content records are edited independently of each other.
 */
export function getRelatedGuides(guide, limit = 3) {
  if (!guide || !Array.isArray(guide.relatedSlugs)) return [];
  return guide.relatedSlugs
    .map((slug) => GUIDES_BY_SLUG.get(slug))
    .filter(Boolean)
    .slice(0, limit);
}
