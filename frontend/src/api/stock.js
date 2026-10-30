import { API_BASE } from './config'
import { apiFetch } from './client'

export async function fetchStockExpensesApi({
  date,
  startDate,
  endDate,
  allDates = false,
  category,
} = {}) {
  const params = new URLSearchParams()
  if (allDates) {
    params.set('all_dates', 'true')
  } else if (startDate && endDate) {
    params.set('start_date', startDate)
    params.set('end_date', endDate)
  } else if (date) {
    params.set('date', date)
  }

  if (category && category !== 'All') {
    params.set('category', category)
  }

  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await apiFetch(`${API_BASE}/stock-expenses${query}`, {
    method: 'GET',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to fetch stock expenses')
  }

  return response.json()
}

export async function fetchStockSummaryApi({
  date,
  startDate,
  endDate,
  allDates = false,
} = {}) {
  const params = new URLSearchParams()
  if (allDates) {
    params.set('all_dates', 'true')
  } else if (startDate && endDate) {
    params.set('start_date', startDate)
    params.set('end_date', endDate)
  } else if (date) {
    params.set('date', date)
  }

  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await apiFetch(`${API_BASE}/stock-expenses/summary${query}`, {
    method: 'GET',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to fetch stock expenses summary')
  }

  return response.json()
}

export async function createStockExpenseApi(payload) {
  const response = await apiFetch(`${API_BASE}/stock-expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to record stock expenditure')
  }

  return response.json()
}

export async function updateStockExpenseApi(id, payload) {
  const response = await apiFetch(`${API_BASE}/stock-expenses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to update stock expenditure')
  }

  return response.json()
}

export async function deleteStockExpenseApi(id) {
  const response = await apiFetch(`${API_BASE}/stock-expenses/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to delete stock expenditure')
  }

  return response.json()
}
