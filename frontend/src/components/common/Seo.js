import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { getCanonicalUrl, SITE_URL } from '../../utils/seo';

const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

/**
 * Single source of truth for per-page <head> tags (title, description,
 * canonical, Open Graph, Twitter Card). Rendered once per routed page.
 *
 * Deliberately NOT duplicated with static tags in public/index.html — that
 * static template only carries global, page-invariant tags (viewport,
 * favicons, JSON-LD, etc). If a page-specific tag existed in both places,
 * react-helmet-async would append its version next to the static one
 * instead of replacing it (it only manages tags it rendered itself),
 * leaving two <title>/<link rel="canonical"> elements in the DOM.
 */
function Seo({ title, description, image = DEFAULT_IMAGE, jsonLd }) {
  const location = useLocation();
  const canonicalUrl = getCanonicalUrl(location.pathname);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="QuickFix AI" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:image" content={image} />

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}

export default Seo;
