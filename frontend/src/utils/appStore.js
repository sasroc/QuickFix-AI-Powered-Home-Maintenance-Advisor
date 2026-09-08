// Canonical App Store listing URL. Keep in sync with the badge link in
// LandingPage.js if that one changes.
export const APP_STORE_URL = 'https://apps.apple.com/us/app/quickfixai-home-repair-guide/id6759504103';

/**
 * Builds an App Store link tagged with UTM parameters so web analytics can
 * attribute outbound clicks back to a specific guide/hub page and CTA
 * placement. Note: Apple's App Store product pages don't natively consume
 * UTM params for *install* attribution the way Apple Search Ads or a link
 * service (e.g. AppsFlyer/Branch) would — these are for click-side
 * analytics on quickfixai.net, not App Store Connect reporting.
 *
 * @param {{source?: string, medium?: string, campaign?: string, content?: string}} params
 */
export function buildAppStoreUrl({ source = 'quickfixai_web', medium = 'guide_cta', campaign = 'seo_guides', content } = {}) {
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
  });
  if (content) params.set('utm_content', content);
  return `${APP_STORE_URL}?${params.toString()}`;
}
