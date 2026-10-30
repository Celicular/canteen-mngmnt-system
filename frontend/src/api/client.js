import { API_BASE } from './config'

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('canteen_access_token')
  const headers = { ...(options.headers || {}) }

  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const finalUrl = url.startsWith('http')
    ? url
    : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`

  return fetch(finalUrl, {
    ...options,
    headers,
    credentials: 'include',
  })
}

