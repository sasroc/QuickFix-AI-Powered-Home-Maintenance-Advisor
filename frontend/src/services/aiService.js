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

export async function analyzeRepairIssue({ description, image }) {
  try {
    const body = { description };
    if (image) {
      body.image = image;
    }

    const API_URL = getBackendUrl();
    console.log('Sending request to:', API_URL);
    console.log('Request body:', body);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to analyze repair issue: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received response:', data);

    // Validate response format
    if (!data || typeof data !== 'object') {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from server');
    }

    // Ensure all required fields are present
    const requiredFields = ['steps', 'tools', 'materials', 'estimatedTime', 'confidenceScore'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Ensure steps is an array
    if (!Array.isArray(data.steps)) {
      console.error('Steps is not an array:', data.steps);
      throw new Error('Invalid steps format');
    }

    // Ensure tools is an array
    if (!Array.isArray(data.tools)) {
      console.error('Tools is not an array:', data.tools);
      throw new Error('Invalid tools format');
    }

    // Ensure materials is an array
    if (!Array.isArray(data.materials)) {
      console.error('Materials is not an array:', data.materials);
      throw new Error('Invalid materials format');
    }

    // Ensure estimatedTime is a number
    if (typeof data.estimatedTime !== 'number') {
      console.error('Estimated time is not a number:', data.estimatedTime);
      throw new Error('Invalid estimated time format');
    }

    // Ensure confidenceScore is a number
    if (typeof data.confidenceScore !== 'number') {
      console.error('Confidence score is not a number:', data.confidenceScore);
      throw new Error('Invalid confidence score format');
    }

    return data;
  } catch (error) {
    console.error('Error in analyzeRepairIssue:', error);
    throw error;
  }
} 