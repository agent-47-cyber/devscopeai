// API base URL for JSON requests — uses Vite proxy in dev, direct URL in prod
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// For file uploads (multipart/form-data), bypass the Vite proxy and go directly to backend
// This avoids proxy buffering issues with large binary files
export const API_UPLOAD_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
