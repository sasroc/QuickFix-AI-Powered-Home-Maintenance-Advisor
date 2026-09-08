# Guide content — schema & bulk-add process

Every file in this directory (except this README) is one repair guide,
rendered at `/fix/<slug>`. Content is plain JSON so it's diffable in PRs,
readable by both the webpack-bundled React app (`index.js`, via
`require.context`) and plain Node build scripts (sitemap, OG images,
prerender, validation) without any extra tooling.

**A file is picked up automatically the moment it exists here** — nothing
else needs to be registered or imported by hand.

## Schema

| Field | Type | Notes |
|---|---|---|
| `slug` | string | Kebab-case, must match the filename (`whirlpool-dishwasher-f8-e4-error.json` → `"whirlpool-dishwasher-f8-e4-error"`). Becomes the URL. |
| `title` | string | The H1. Should be the exact phrase a user would type into search — e.g. `"Whirlpool Dishwasher F8 E4 Error: How to Fix It"`. |
| `metaDescription` | string | `<meta name="description">` and the fallback OG/Twitter description. Keep it under ~155 characters. |
| `category` | string | One of the slugs in `../categories.json` (`appliances`, `plumbing`, `electrical`, `hvac`, `drywall`). |
| `symptom` | string | One sentence describing what the user sees/hears — shown under the H1 and on card previews. |
| `difficulty` | `"Easy"` \| `"Moderate"` \| `"Call a pro"` | Drives the colored badge. |
| `estimatedTime` | string | Free text, e.g. `"15-30 minutes"`. Also best-effort parsed into the HowTo schema's `totalTime` (see `src/utils/guideSchema.js`) — a range like `"X-Y minutes"`/`"X-Y hours"` parses cleanly; odd phrasing just omits `totalTime` rather than guessing. |
| `toolsNeeded` | string[] | Can be empty. |
| `partsNeeded` | string[] | Can be empty. |
| `estimatedDIYCost` | string | e.g. `"$0–$35"`. Rendered in the cost-comparison hook near the top of the page and best-effort parsed into `estimatedCost` in the HowTo schema. |
| `estimatedProCost` | string | e.g. `"$150–$300"`. Same block, other side. |
| `steps` | `{heading, body}[]` | Must have at least one entry. Rendered as numbered steps and as `HowToStep` in the schema. |
| `whenToCallAPro` | string | Always rendered, on every guide — this section is never omitted, so don't leave it thin. |
| `safetyWarnings` | string[] | Rendered in a visually distinct red callout. Can be empty, but `validate:guides` will warn (not fail) if it is — most repairs involving water, mains power, or heat have at least one. |
| `relatedSlugs` | string[] | Slugs of other guides to cross-link in the "Related Guides" section. A slug that doesn't resolve is silently dropped at render time (see `getRelatedGuides` in `index.js`), but `validate:guides` warns about it so it doesn't go unnoticed. |
| `updatedAt` | string (optional) | `YYYY-MM-DD`. Used as `<lastmod>` in sitemap.xml; falls back to the sitemap build date if omitted. |

## Adding one guide

```bash
cd frontend
npm run new:guide -- whirlpool-dishwasher-f8-e4-error appliances
# fill in the TODOs in the generated file, then:
npm run validate:guides
```

## Bulk-adding guides (scaling past the first 5)

There's no CSV importer — nested repeating fields (steps, tools, safety
warnings) don't fit a spreadsheet cell cleanly, and a bad silent
CSV-parsing edge case is worse than just writing JSON. Instead, the
intended bulk workflow is:

1. **Make a list of targets.** For the appliance-error-code priority (see
   root `CLAUDE.md`), that's a brand + model family + code, e.g.
   `Maytag Washer F5 E2`, `Samsung Dryer dE`, `LG Refrigerator Er FF`.
2. **Scaffold each one:**
   ```bash
   npm run new:guide -- maytag-washer-f5-e2-error appliances
   npm run new:guide -- samsung-dryer-de-error-code appliances
   # ...
   ```
3. **Fill in the content.** If you're doing this with an AI coding
   assistant (e.g. Claude Code), hand it the list of targets and this
   README — it can run `new:guide` for each, write accurate, safety-
   conscious content into the TODOs (see the 5 seed guides for the tone/
   depth to match), and cross-link `relatedSlugs` between guides that
   share a brand or appliance type.
4. **Validate before committing:**
   ```bash
   npm run validate:guides
   ```
   This fails the build on missing/malformed required fields, a slug/
   filename mismatch, an unknown `category`, or a duplicate slug — and
   warns (without failing) about empty `safetyWarnings` or a
   `relatedSlugs` entry that doesn't resolve yet.
5. **Regenerate the sitemap** (also runs automatically as part of `npm run
   build`, but useful to preview locally):
   ```bash
   npm run generate:sitemap
   ```
6. **Build.** `npm run build` runs, in order: `validate:guides` →
   `generate:sitemap` → `craco build` → `prerender` (bakes every `/fix/*`
   route to static HTML, same mechanism as the rest of the site — see
   `scripts/prerender.js`) → `generate:og` (renders each guide/category's
   Open Graph image).

## Adding a 6th category

Category hub pages (`/fix/[category]`) come from `../categories.json`, not
from this directory. Add an entry there (`slug`, `title`, `shortTitle`,
`description`, `metaDescription`) and it picks up automatically — no route
changes needed, since `/fix/:slug` resolves categories and guides from the
same content at render time (see `src/components/guides/FixRouteResolver.js`).
