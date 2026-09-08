import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { getCategoryBySlug } from '../../content/categories';
import { getGuideBySlug, getGuidesByCategory } from '../../content/guides';
import GuidePage from './GuidePage';
import CategoryHubPage from './CategoryHubPage';

/**
 * /fix/:slug is shared by both category hubs (/fix/plumbing) and individual
 * guides (/fix/whirlpool-dishwasher-f8-e4-error). Resolve which one the
 * slug means at render time — content lookups only, no fetch — and render
 * the matching template. An unknown slug sends both users and crawlers to
 * the guide index instead of a dead end.
 */
function FixRouteResolver() {
  const { slug } = useParams();

  const category = getCategoryBySlug(slug);
  if (category) {
    return <CategoryHubPage category={category} guides={getGuidesByCategory(category.slug)} />;
  }

  const guide = getGuideBySlug(slug);
  if (guide) {
    return <GuidePage guide={guide} />;
  }

  return <Navigate to="/fix" replace />;
}

export default FixRouteResolver;
