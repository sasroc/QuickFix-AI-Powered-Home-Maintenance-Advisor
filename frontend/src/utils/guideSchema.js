import { SITE_URL, getCanonicalUrl } from './seo';

/**
 * Best-effort parse of a human-written duration string ("15-30 minutes",
 * "1-2 hours") into an ISO 8601 duration for schema.org HowTo's
 * `totalTime`. Takes the upper bound of a range. Returns null (omit the
 * field rather than guess) if nothing recognizable is found.
 */
export function parseDurationToISO8601(text) {
  if (!text) return null;
  const match = String(text).match(/(\d+(?:\.\d+)?)(?:\s*[-–to]+\s*(\d+(?:\.\d+)?))?\s*(hour|hr|minute|min)/i);
  if (!match) return null;
  const values = [parseFloat(match[1]), match[2] ? parseFloat(match[2]) : null].filter((n) => n !== null && !Number.isNaN(n));
  if (values.length === 0) return null;
  const value = Math.max(...values);
  const unit = /h/i.test(match[3]) ? 'H' : 'M';
  return `PT${value}${unit}`;
}

/**
 * Best-effort parse of a cost string ("$0–$35", "$150-$300", "$20") into a
 * schema.org MonetaryAmount. Returns null if nothing recognizable is found
 * rather than fabricating a number.
 */
export function parseCostToMonetaryAmount(text) {
  if (!text) return null;
  const numbers = String(text).match(/\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length === 0) return null;
  const values = numbers.map(Number);
  if (values.length === 1) {
    return { '@type': 'MonetaryAmount', currency: 'USD', value: values[0] };
  }
  return {
    '@type': 'MonetaryAmount',
    currency: 'USD',
    minValue: Math.min(...values),
    maxValue: Math.max(...values),
  };
}

/**
 * Builds the schema.org HowTo structured data for a guide page, populated
 * from steps/tools/time exactly as the guide record has them. Safety
 * warnings don't have a dedicated HowTo property in schema.org, so they're
 * carried as `additionalProperty` PropertyValue entries — a generic,
 * spec-legal way to attach extra facts without inventing a nonstandard type.
 */
export function buildHowToSchema(guide, { ogImageUrl } = {}) {
  const canonicalUrl = getCanonicalUrl(`/fix/${guide.slug}`);
  const totalTime = parseDurationToISO8601(guide.estimatedTime);
  const estimatedCost = parseCostToMonetaryAmount(guide.estimatedDIYCost);

  const howTo = {
    '@type': 'HowTo',
    name: guide.title,
    description: guide.metaDescription,
    ...(ogImageUrl ? { image: ogImageUrl } : {}),
    ...(totalTime ? { totalTime } : {}),
    ...(estimatedCost ? { estimatedCost } : {}),
    step: (guide.steps || []).map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.heading,
      text: step.body,
      url: `${canonicalUrl}#step-${i + 1}`,
    })),
    tool: (guide.toolsNeeded || []).map((name) => ({ '@type': 'HowToTool', name })),
    supply: (guide.partsNeeded || []).map((name) => ({ '@type': 'HowToSupply', name })),
  };

  if (Array.isArray(guide.safetyWarnings) && guide.safetyWarnings.length > 0) {
    howTo.additionalProperty = guide.safetyWarnings.map((warning) => ({
      '@type': 'PropertyValue',
      name: 'Safety Warning',
      value: warning,
    }));
  }

  return howTo;
}

/**
 * Builds a schema.org BreadcrumbList from an ordered list of
 * { name, path? } crumbs. `path` is a site-relative pathname; omit it on
 * the final (current-page) crumb only if you don't want a self-URL.
 */
export function buildBreadcrumbSchema(crumbs) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      ...(crumb.path ? { item: `${SITE_URL}${crumb.path}` } : {}),
    })),
  };
}

/**
 * Wraps multiple schema.org node objects in a single @graph so a page can
 * emit one <script type="application/ld+json"> (via <Seo jsonLd={...}>)
 * carrying both its HowTo and BreadcrumbList data.
 */
export function buildGraph(schemas) {
  return { '@context': 'https://schema.org', '@graph': schemas.filter(Boolean) };
}
