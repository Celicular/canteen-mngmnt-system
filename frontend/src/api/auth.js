import { API_BASE } from './config'
import { apiFetch } from './client'

export async function loginApi({ username, password, saveUser = false, quickLogin = false }) {
  const response = await apiFetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
      save_user: saveUser,
      quick_login: quickLogin,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Login failed')
  }

  const data = await response.json()
  if (data.access_token) {
    localStorage.setItem('canteen_access_token', data.access_token)
  }
  return data
}

export async function fetchCurrentUserApi() {
  const response = await apiFetch(`${API_BASE}/auth/me`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error('Not authenticated')
  }

  return response.json()
}

export async function logoutApi() {
  try {
    const response = await apiFetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error('Logout failed')
    }
    return response.json()
  } finally {
    localStorage.removeItem('canteen_access_token')
  }
}
