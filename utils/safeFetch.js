import React from 'react'; // if needed later, but this is a pure utility

/**
 * A safe fetch wrapper that prevents "Unexpected end of JSON input" errors.
 * 
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options (method, headers, body, etc)
 * @returns {Promise<{data: any, error: string | null, status: number}>}
 */
export async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    // If response is OK
    if (response.ok) {
      if (isJson) {
        const data = await response.json().catch(() => null);
        return { data, error: null, status: response.status };
      }
      // Not JSON but OK
      const text = await response.text().catch(() => '');
      return { data: text, error: null, status: response.status };
    }

    // Response is NOT OK
    let errorMessage = `Server error: ${response.status}`;
    
    if (isJson) {
      const errorData = await response.json().catch(() => null);
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } else {
      // Try to read as text if it's not JSON (like an HTML error page)
      const text = await response.text().catch(() => '');
      if (text) {
        // Truncate HTML error pages so they don't blow up the UI
        errorMessage = text.substring(0, 150) + (text.length > 150 ? '...' : '');
      }
    }

    console.error(`[API ERROR] ${options.method || 'GET'} ${url} - Status: ${response.status} - ${errorMessage}`);
    return { data: null, error: errorMessage, status: response.status };

  } catch (error) {
    // Network errors (CORS, offline, server down completely)
    console.error(`[API ERROR] Network/Fetch failed for ${url}:`, error.message);
    return { data: null, error: 'Network error or server is unreachable. ' + error.message, status: 0 };
  }
}
