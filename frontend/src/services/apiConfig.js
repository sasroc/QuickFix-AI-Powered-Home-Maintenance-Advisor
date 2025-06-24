// Centralized API configuration for both development and production

// Get the base API URL
export const getApiBaseUrl = () => {
  // Use environment variable if available (production)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Development fallback
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:4000';
  }
  
  // This should not be used in production, but keeping as fallback
  return `http://${host}:4000`;
};

// Get full API endpoint URL
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  // Remove leading slash from endpoint if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

// Common fetch wrapper with error handling
export const apiRequest = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  return response;
}; 