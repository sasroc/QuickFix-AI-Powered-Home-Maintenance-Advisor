#!/usr/bin/env node
/**
 * Scaffolds a new guide record: src/content/guides/<slug>.json, pre-filled
 * with every field the schema requires (see README.md in that directory)
 * so the only work left is replacing the TODOs and running
 * `npm run validate:guides`.
 *
 * Usage:
 *   node scripts/new-guide.js <slug> [category]
 *
 * Example:
 *   node scripts/new-guide.js maytag-washer-f5-e2-error appliances
 */
const fs = require('fs');
const path = require('path');

const GUIDES_DIR = path.join(__dirname, '..', 'src', 'content', 'guides');
const CATEGORIES_PATH = path.join(__dirname, '..', 'src', 'content', 'categories.json');
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function main() {
  const [, , slugArg, categoryArg] = process.argv;

  if (!slugArg) {
    console.error('Usage: node scripts/new-guide.js <slug> [category]');
    console.error('Example: node scripts/new-guide.js maytag-washer-f5-e2-error appliances');
    process.exit(1);
  }

  if (!SLUG_RE.test(slugArg)) {
    console.error(`Invalid slug "${slugArg}" — must be lowercase kebab-case (a-z, 0-9, hyphens).`);
    process.exit(1);
  }

  const categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf8'));
  const categorySlugs = categories.map((c) => c.slug);
  const category = categoryArg || 'appliances';

  if (!categorySlugs.includes(category)) {
    console.error(`Unknown category "${category}". Valid categories: ${categorySlugs.join(', ')}`);
    process.exit(1);
  }

  const outPath = path.join(GUIDES_DIR, `${slugArg}.json`);
  if (fs.existsSync(outPath)) {
    console.error(`${slugArg}.json already exists — aborting.`);
    process.exit(1);
  }

  const skeleton = {
    slug: slugArg,
    title: 'TODO: exact search phrase, e.g. "Brand Model X1 Error: How to Fix It"',
    metaDescription: 'TODO: 1-2 sentence summary for search results, under ~155 characters.',
    category,
    symptom: 'TODO: one sentence describing what the user sees or hears.',
    difficulty: 'Moderate',
    estimatedTime: 'TODO: e.g. "20-40 minutes"',
    toolsNeeded: [],
    partsNeeded: [],
    estimatedDIYCost: 'TODO: e.g. "$0–$30"',
    estimatedProCost: 'TODO: e.g. "$150–$300"',
    steps: [{ heading: 'TODO: step 1 heading', body: 'TODO: step 1 instructions.' }],
    whenToCallAPro: 'TODO: when this stops being a safe/reasonable DIY job.',
    safetyWarnings: [],
    relatedSlugs: [],
    updatedAt: new Date().toISOString().slice(0, 10),
  };

  fs.writeFileSync(outPath, `${JSON.stringify(skeleton, null, 2)}\n`);
  console.log(`Created src/content/guides/${slugArg}.json — fill in the TODOs, then run:`);
  console.log('  npm run validate:guides');
}

main();
