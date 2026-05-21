const rawApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '/api'

// Keep URL composition stable regardless of trailing slash in env value.
export const API_BASE_URL = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase
