import React from 'react';
import { buildAppStoreUrl } from '../../utils/appStore';
import './AppStoreCta.css';

/**
 * The repeated conversion CTA on every guide/hub page: "snap a photo, get a
 * guide tailored to your exact problem" -> App Store, tagged with a
 * placement-specific utm_content so we can tell which CTA position/page
 * actually drives clicks.
 */
function AppStoreCta({ content }) {
  const href = buildAppStoreUrl({ content });

  return (
    <div className="guide-cta-banner">
      <div className="guide-cta-text">
        <span className="guide-cta-emoji" aria-hidden="true">📸</span>
        <div>
          <p className="guide-cta-title">Snap a photo of your specific problem</p>
          <p className="guide-cta-subtitle">Get a repair guide tailored to your exact issue — powered by AI.</p>
        </div>
      </div>
      <a href={href} target="_blank" rel="noopener noreferrer" className="guide-cta-button">
        Get the App
      </a>
    </div>
  );
}

export default AppStoreCta;
