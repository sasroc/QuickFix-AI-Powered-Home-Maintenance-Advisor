// Get the backend URL from environment variable or use the current host
const getBackendUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // If running locally, use the current host
  const host = window.location.hostname;
  // If we're on the same machine as the backend, use localhost
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:4000/api/ai/analyze';
  }
  // Otherwise, use the host machine's IP address
  return `http://${host}:4000/api/ai/analyze`;
};

export async function analyzeRepairIssue({ description, image, uid, authToken }) {
  try {
    const body = { description };
    if (image) {
      body.image = image;
    }
    if (uid) {
      body.uid = uid;
    }

    const API_URL = getBackendUrl();

    // Create headers with optional authentication
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to analyze repair issue: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response format
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from server');
    }

    // Ensure all required fields are present
    const requiredFields = ['steps', 'tools', 'materials', 'estimatedTime', 'confidenceScore'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Ensure steps is an array
    if (!Array.isArray(data.steps)) {
      throw new Error('Invalid steps format');
    }

    // Ensure tools is an array
    if (!Array.isArray(data.tools)) {
      throw new Error('Invalid tools format');
    }

    // Ensure materials is an array
    if (!Array.isArray(data.materials)) {
      throw new Error('Invalid materials format');
    }

    // Ensure estimatedTime is a number
    if (typeof data.estimatedTime !== 'number') {
      throw new Error('Invalid estimated time format');
    }

    // Ensure confidenceScore is a number
    if (typeof data.confidenceScore !== 'number') {
      throw new Error('Invalid confidence score format');
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again with a smaller image or shorter description.');
    }
    throw error;
  }
} 