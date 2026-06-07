// API base URL for JSON requests — uses Vite proxy in dev, direct URL in prod
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// For file uploads (multipart/form-data), bypass the Vite proxy and go directly to backend
// In production (Vercel), we just use the relative URL
export const API_UPLOAD_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || '') 
  : (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000');
