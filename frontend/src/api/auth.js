const API_BASE = '/api'

export async function loginApi({ username, password, saveUser = false, quickLogin = false }) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
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

  return response.json()
}

export async function fetchCurrentUserApi() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Not authenticated')
  }

  return response.json()
}

export async function logoutApi() {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Logout failed')
  }

  return response.json()
}
