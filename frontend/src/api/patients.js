import { API_BASE } from './config'
import { apiFetch } from './client'

export async function fetchPatientsApi(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  const response = await apiFetch(`${API_BASE}/patients${query}`, {
    method: 'GET',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to fetch patients')
  }

  return response.json()
}

export async function createPatientApi({ name, mobile_number, ward_number }) {
  const response = await apiFetch(`${API_BASE}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mobile_number,
      ward_number,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to create patient')
  }

  return response.json()
}
