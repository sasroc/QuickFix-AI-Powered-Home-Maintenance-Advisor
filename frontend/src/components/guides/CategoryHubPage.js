import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../common/Seo';
import AppStoreCta from './AppStoreCta';
import { SITE_URL } from '../../utils/seo';
import { buildBreadcrumbSchema, buildGraph } from '../../utils/guideSchema';
import './CategoryHubPage.css';

const DIFFICULTY_CLASS = {
  Easy: 'difficulty-easy',
  Moderate: 'difficulty-moderate',
  'Call a pro': 'difficulty-pro',
};

/**
 * The /fix/[category] hub template — lists every guide in the category so
 * crawlers (and users) can reach child guides in one hop, per the internal
 * linking requirement.
 */
function CategoryHubPage({ category, guides }) {
  if (!category) return null;

  const ogImageUrl = `${SITE_URL}/og/category-${category.slug}.png`;
  const jsonLd = buildGraph([
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Repair Guides', path: '/fix' },
      { name: category.title, path: `/fix/${category.slug}` },
    ]),
  ]);

  return (
    <div className="category-hub-page">
      <Seo title={`${category.title} | QuickFix AI`} description={category.metaDescription} image={ogImageUrl} jsonLd={jsonLd} />

      <nav className="guide-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/fix">Repair Guides</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{category.title}</span>
      </nav>

      <header className="category-hub-header">
        <h1>{category.title}</h1>
        <p>{category.description}</p>
      </header>

      <AppStoreCta content={`category-${category.slug}-top`} />

      {guides.length > 0 ? (
        <div className="category-guide-grid">
          {guides.map((guide) => (
            <Link key={guide.slug} to={`/fix/${guide.slug}`} className="category-guide-card">
              <span className={`guide-badge ${DIFFICULTY_CLASS[guide.difficulty] || ''}`}>{guide.difficulty}</span>
              <h2>{guide.title}</h2>
              <p>{guide.symptom}</p>
              <div className="category-guide-card-meta">
                <span>⏱ {guide.estimatedTime}</span>
                <span>{guide.estimatedDIYCost} DIY</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="category-empty-state">New {category.shortTitle.toLowerCase()} guides are on the way — check back soon.</p>
      )}
    </div>
  );
}

export default CategoryHubPage;
