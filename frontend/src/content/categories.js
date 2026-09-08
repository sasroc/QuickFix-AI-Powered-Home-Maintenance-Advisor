import categoriesData from './categories.json';

// Fixed set of top-level /fix/[category] hub pages. Source of truth is
// categories.json so build-time Node scripts (sitemap, OG images,
// prerender) and the webpack-bundled React app read the exact same data.
export const CATEGORIES = categoriesData;

const CATEGORIES_BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategoryBySlug(slug) {
  return CATEGORIES_BY_SLUG.get(slug) || null;
}

export function isCategorySlug(slug) {
  return CATEGORIES_BY_SLUG.has(slug);
}
