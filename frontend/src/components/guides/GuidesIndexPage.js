import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../common/Seo';
import { CATEGORIES } from '../../content/categories';
import { getAllGuides, getGuidesByCategory } from '../../content/guides';
import './CategoryHubPage.css';

/**
 * /fix — the top of the guide system. Not explicitly required by the spec,
 * but every hub page's breadcrumb links to it, so it needs to exist as the
 * one place that links out to all 5 category hubs (and, transitively, to
 * every guide) for both crawlers and users.
 */
function GuidesIndexPage() {
  const allGuides = getAllGuides();

  return (
    <div className="category-hub-page">
      <Seo
        title="Home Repair Guides | QuickFix AI"
        description="Free, step-by-step DIY repair guides for plumbing, electrical, HVAC, appliances, and drywall — including appliance error codes by brand."
      />

      <header className="category-hub-header">
        <h1>Home Repair Guides</h1>
        <p>
          Browse {allGuides.length} free, step-by-step repair guide{allGuides.length === 1 ? '' : 's'} by category — or snap a photo in
          the app for a guide tailored to your exact problem.
        </p>
      </header>

      <div className="category-index-grid">
        {CATEGORIES.map((category) => {
          const count = getGuidesByCategory(category.slug).length;
          return (
            <Link key={category.slug} to={`/fix/${category.slug}`} className="category-index-card">
              <h2>{category.title}</h2>
              <p>{category.description}</p>
              <span className="category-index-count">
                {count} guide{count === 1 ? '' : 's'}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default GuidesIndexPage;
