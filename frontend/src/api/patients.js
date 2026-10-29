const API_BASE = '/api'

export async function fetchPatientsApi(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  const response = await fetch(`${API_BASE}/patients${query}`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to fetch patients')
  }

  return response.json()
}

export async function createPatientApi({ name, mobile_number, ward_number }) {
  const response = await fetch(`${API_BASE}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
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
