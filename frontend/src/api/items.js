import { API_BASE } from './config'

export async function fetchItemsApi() {
  const response = await fetch(`${API_BASE}/items`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to fetch items')
  }

  return response.json()
}

export async function createItemApi({ name, description = '', price, category = 'General', is_available = true }) {
  const response = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      name,
      description,
      price: parseFloat(price),
      category,
      is_available,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to create item')
  }

  return response.json()
}

export async function updateItemApi(id, { name, description = '', price, category = 'General', is_available = true }) {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      name,
      description,
      price: parseFloat(price),
      category,
      is_available,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to update item')
  }

  return response.json()
}

export async function deleteItemApi(id) {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to delete item')
  }

  return response.json()
}
