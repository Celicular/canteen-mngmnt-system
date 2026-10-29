const API_BASE = '/api'

export async function fetchUsersApi() {
  const response = await fetch(`${API_BASE}/users`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to fetch users')
  }

  return response.json()
}

export async function createUserApi({ username, password, full_name, user_type, avatar }) {
  const response = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      username,
      password,
      full_name,
      user_type,
      avatar,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to create user')
  }

  return response.json()
}

export async function deleteUserApi(username) {
  const response = await fetch(`${API_BASE}/users/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to delete user')
  }

  return response.json()
}
