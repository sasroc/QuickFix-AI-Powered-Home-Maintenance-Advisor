import { useCallback } from 'react';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../config/firebase';

const useAnalytics = () => {
  const trackEvent = useCallback(async (eventName, eventParams = {}) => {
    try {
      const analyticsInstance = await analytics;
      if (analyticsInstance) {
        logEvent(analyticsInstance, eventName, eventParams);
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }, []);

  const trackPageView = useCallback(async (pageName) => {
    try {
      const analyticsInstance = await analytics;
      if (analyticsInstance) {
        logEvent(analyticsInstance, 'page_view', {
          page_title: pageName,
          page_location: window.location.href,
          page_path: window.location.pathname
        });
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }, []);

  return { trackEvent, trackPageView };
};

export default useAnalytics; 