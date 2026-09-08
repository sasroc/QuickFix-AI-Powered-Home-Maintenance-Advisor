import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../common/Seo';
import AppStoreCta from './AppStoreCta';
import { SITE_URL } from '../../utils/seo';
import { getCategoryBySlug } from '../../content/categories';
import { getRelatedGuides } from '../../content/guides';
import { buildHowToSchema, buildBreadcrumbSchema, buildGraph } from '../../utils/guideSchema';
import './GuidePage.css';

const DIFFICULTY_CLASS = {
  Easy: 'difficulty-easy',
  Moderate: 'difficulty-moderate',
  'Call a pro': 'difficulty-pro',
};

/**
 * The /fix/[slug] guide template. Everything here is derived synchronously
 * from the `guide` prop (a record from src/content/guides) — no fetching,
 * so the build-time prerender step (scripts/prerender.js) can bake it to
 * real static HTML.
 */
function GuidePage({ guide }) {
  if (!guide) return null;

  const category = getCategoryBySlug(guide.category);
  const relatedGuides = getRelatedGuides(guide, 3);
  const ogImageUrl = `${SITE_URL}/og/${guide.slug}.png`;

  const jsonLd = buildGraph([
    buildHowToSchema(guide, { ogImageUrl }),
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Repair Guides', path: '/fix' },
      ...(category ? [{ name: category.title, path: `/fix/${category.slug}` }] : []),
      { name: guide.title, path: `/fix/${guide.slug}` },
    ]),
  ]);

  return (
    <div className="guide-page">
      <Seo title={guide.title} description={guide.metaDescription} image={ogImageUrl} jsonLd={jsonLd} />

      <nav className="guide-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/fix">Repair Guides</Link>
        {category && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/fix/${category.slug}`}>{category.title}</Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span aria-current="page">{guide.title}</span>
      </nav>

      <header className="guide-header">
        <h1 className="guide-title">{guide.title}</h1>
        <p className="guide-symptom">{guide.symptom}</p>
        <div className="guide-meta-row">
          <span className={`guide-badge ${DIFFICULTY_CLASS[guide.difficulty] || ''}`}>{guide.difficulty}</span>
          <span className="guide-meta-item">⏱ {guide.estimatedTime}</span>
          {guide.updatedAt && <span className="guide-meta-item">Updated {guide.updatedAt}</span>}
        </div>
      </header>

      {/* Cost comparison hook — deliberately the first thing after the title. */}
      <section className="guide-cost-block" aria-label="Cost comparison">
        <div className="guide-cost-card guide-cost-diy">
          <p className="guide-cost-label">DIY Cost</p>
          <p className="guide-cost-value">{guide.estimatedDIYCost}</p>
        </div>
        <div className="guide-cost-vs">vs</div>
        <div className="guide-cost-card guide-cost-pro">
          <p className="guide-cost-label">Typical Pro Cost</p>
          <p className="guide-cost-value">{guide.estimatedProCost}</p>
        </div>
      </section>

      <AppStoreCta content={`guide-${guide.slug}-top`} />

      {(guide.toolsNeeded?.length > 0 || guide.partsNeeded?.length > 0) && (
        <section className="guide-lists" aria-label="Tools and parts needed">
          {guide.toolsNeeded?.length > 0 && (
            <div className="guide-list-card">
              <h2>Tools Needed</h2>
              <ul>
                {guide.toolsNeeded.map((tool) => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
            </div>
          )}
          {guide.partsNeeded?.length > 0 && (
            <div className="guide-list-card">
              <h2>Parts Needed</h2>
              <ul>
                {guide.partsNeeded.map((part) => (
                  <li key={part}>{part}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {Array.isArray(guide.safetyWarnings) && guide.safetyWarnings.length > 0 && (
        <section className="guide-safety-callout" role="alert" aria-label="Safety warnings">
          <h2>⚠️ Safety Warnings</h2>
          <ul>
            {guide.safetyWarnings.map((warning, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="guide-steps" aria-label="Repair steps">
        <h2>Step-by-Step Instructions</h2>
        <ol>
          {(guide.steps || []).map((step, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={i} id={`step-${i + 1}`} className="guide-step">
              <h3>{step.heading}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Always rendered, per spec — never omitted even if the field is thin. */}
      <section className="guide-when-to-call-pro" aria-label="When to call a professional">
        <h2>When to Call a Professional</h2>
        <p>
          {guide.whenToCallAPro ||
            "If these steps don't resolve the problem, or you're not comfortable working with the affected part, it's time to call a licensed professional."}
        </p>
      </section>

      <AppStoreCta content={`guide-${guide.slug}-bottom`} />

      {relatedGuides.length > 0 && (
        <section className="guide-related" aria-label="Related guides">
          <h2>Related Guides</h2>
          <div className="guide-related-grid">
            {relatedGuides.map((related) => (
              <Link key={related.slug} to={`/fix/${related.slug}`} className="guide-related-card">
                <span className={`guide-badge ${DIFFICULTY_CLASS[related.difficulty] || ''}`}>{related.difficulty}</span>
                <h3>{related.title}</h3>
                <p>{related.symptom}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default GuidePage;
