export const API_BASE = (
  import.meta.env.api_base_url ||
  import.meta.env.API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api'
).replace(/\/+$/, '')
