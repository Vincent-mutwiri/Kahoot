// Determine the base URL for API requests
const getBaseUrl = () => {
  // In development, use the local server
  if (process.env.NODE_ENV === 'development') {
    return ''; // Vite proxy will handle this in development
  }
  // In production, use the current host with /_api prefix
  return ''; // Use relative URL in production
};

export const apiClient = {
  get: async (endpoint: string) => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`);
    return handleResponse(response);
  },
  
  post: async (endpoint: string, data: any) => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  
  // Add other HTTP methods as needed
};

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.text().catch(() => response.statusText);
    throw new Error(error || 'Something went wrong');
  }
  return response.json().catch(() => ({})); // Return empty object if no JSON body
}
