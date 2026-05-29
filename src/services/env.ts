// VITE_DIRECTUS_URL is baked in at build time via docker-compose build args.
// Falls back to localhost for local dev.
const rawDirectus = (import.meta.env.VITE_DIRECTUS_URL as string | undefined)?.trim() || 'http://localhost:8055'
export const DIRECTUS_URL = rawDirectus.endsWith('/') ? rawDirectus.slice(0, -1) : rawDirectus

// API_BASE_URL points to Flask backend on port 5000
// All API calls will be made to /api/* which Vite dev server proxies to http://localhost:5000/*
export const API_BASE_URL = '/api'
