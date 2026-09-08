// Central source of truth for the site's production origin.
// Used to build absolute canonical / og:url values per route.
export const SITE_URL = 'https://quickfixai.net';

/**
 * Builds an absolute canonical URL for a given route pathname.
 * Strips any trailing slash (except for the root) and drops query
 * strings/hashes, since canonical URLs should ignore those.
 *
 * @param {string} pathname - e.g. location.pathname from react-router
 * @returns {string} e.g. "https://quickfixai.net/pricing"
 */
export function getCanonicalUrl(pathname = '/') {
  const cleanPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return `${SITE_URL}${cleanPath}`;
}
