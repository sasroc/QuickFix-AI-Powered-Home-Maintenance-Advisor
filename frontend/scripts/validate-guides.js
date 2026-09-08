/**
 * Validates every guide record in src/content/guides/*.json against the
 * schema documented in src/content/guides/README.md. Runs automatically as
 * part of `npm run build` (see package.json) so a malformed record never
 * reaches production — this is the safety net for bulk-adding guides.
 *
 * Usage: node scripts/validate-guides.js
 * Exits non-zero (failing the build) on any hard error. Soft issues
 * (empty safety warnings, a relatedSlugs entry pointing at a slug that
 * doesn't exist yet) are printed as warnings but don't fail the build,
 * since content is often added in batches where cross-links land before
 * every referenced guide does.
 */
const fs = require('fs');
const path = require('path');

const GUIDES_DIR = path.join(__dirname, '..', 'src', 'content', 'guides');
const CATEGORIES_PATH = path.join(__dirname, '..', 'src', 'content', 'categories.json');

const REQUIRED_STRING_FIELDS = [
  'slug',
  'title',
  'metaDescription',
  'category',
  'symptom',
  'difficulty',
  'estimatedTime',
  'estimatedDIYCost',
  'estimatedProCost',
  'whenToCallAPro',
];
const REQUIRED_ARRAY_FIELDS = ['toolsNeeded', 'partsNeeded', 'steps', 'safetyWarnings', 'relatedSlugs'];
const VALID_DIFFICULTIES = ['Easy', 'Moderate', 'Call a pro'];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function loadCategorySlugs() {
  return JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf8')).map((c) => c.slug);
}

function run() {
  const categorySlugs = loadCategorySlugs();
  const files = fs.readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.json'));

  const errors = [];
  const warnings = [];
  const seenSlugs = new Map();

  const guides = files
    .map((file) => {
      const filePath = path.join(GUIDES_DIR, file);
      let guide;
      try {
        guide = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (err) {
        errors.push(`${file}: invalid JSON — ${err.message}`);
        return null;
      }

      REQUIRED_STRING_FIELDS.forEach((field) => {
        if (typeof guide[field] !== 'string' || guide[field].trim() === '') {
          errors.push(`${file}: missing or empty required string field "${field}"`);
        }
      });

      REQUIRED_ARRAY_FIELDS.forEach((field) => {
        if (!Array.isArray(guide[field])) {
          errors.push(`${file}: missing or invalid required array field "${field}"`);
        }
      });

      if (guide.slug && !SLUG_RE.test(guide.slug)) {
        errors.push(`${file}: slug "${guide.slug}" must be lowercase kebab-case (a-z, 0-9, hyphens)`);
      }

      if (guide.slug && `${guide.slug}.json` !== file) {
        errors.push(`${file}: filename must match slug — expected "${guide.slug}.json"`);
      }

      if (guide.difficulty && !VALID_DIFFICULTIES.includes(guide.difficulty)) {
        errors.push(`${file}: difficulty "${guide.difficulty}" must be one of ${VALID_DIFFICULTIES.join(', ')}`);
      }

      if (guide.category && !categorySlugs.includes(guide.category)) {
        errors.push(`${file}: category "${guide.category}" is not a known category (${categorySlugs.join(', ')})`);
      }

      if (Array.isArray(guide.steps)) {
        if (guide.steps.length === 0) {
          errors.push(`${file}: steps[] must not be empty`);
        }
        guide.steps.forEach((step, i) => {
          if (!step || typeof step.heading !== 'string' || !step.heading.trim()) {
            errors.push(`${file}: steps[${i}] missing "heading"`);
          }
          if (!step || typeof step.body !== 'string' || !step.body.trim()) {
            errors.push(`${file}: steps[${i}] missing "body"`);
          }
        });
      }

      if (Array.isArray(guide.safetyWarnings) && guide.safetyWarnings.length === 0) {
        warnings.push(`${file}: safetyWarnings[] is empty — double check this repair really has none`);
      }

      if (guide.slug) {
        if (seenSlugs.has(guide.slug)) {
          errors.push(`${file}: duplicate slug "${guide.slug}" also used by ${seenSlugs.get(guide.slug)}`);
        } else {
          seenSlugs.set(guide.slug, file);
        }
      }

      return guide;
    })
    .filter(Boolean);

  // Second pass: relatedSlugs should point at real guides once the batch
  // is complete. Warn, don't fail — a batch add can land cross-links
  // before every referenced file exists.
  guides.forEach((guide) => {
    (guide.relatedSlugs || []).forEach((slug) => {
      if (!seenSlugs.has(slug)) {
        warnings.push(`${guide.slug}.json: relatedSlugs references unknown slug "${slug}"`);
      }
    });
  });

  if (warnings.length > 0) {
    console.warn(`[validate-guides] ${warnings.length} warning(s):`);
    warnings.forEach((w) => console.warn(`  - ${w}`));
  }

  if (errors.length > 0) {
    console.error(`[validate-guides] ${errors.length} error(s):`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log(`[validate-guides] OK — ${guides.length} guide(s) validated, 0 errors${warnings.length ? `, ${warnings.length} warning(s)` : ''}.`);
}

run();
