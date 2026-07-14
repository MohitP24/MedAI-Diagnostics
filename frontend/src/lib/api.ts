/**
 * Centralized API Client Configuration
 * 
 * In development, VITE_API_URL is empty, so requests go to the relative path (/api)
 * which is then proxied by Vite's dev server to localhost:3001.
 * 
 * In production, VITE_API_URL points to the live backend URL (e.g. Render),
 * bypassing Vercel's proxy entirely to avoid 10s timeouts and header stripping.
 */

const API_URL = (import.meta as any).env.VITE_API_URL || '';

/**
 * Helper to construct full API URLs
 * @param path - API path starting with slash (e.g. '/api/v1/auth/login')
 */
export const api = (path: string): string => {
    return `${API_URL}${path}`;
};
