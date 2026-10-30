import { API_BASE } from './config'
import { apiFetch } from './client'

export async function fetchSalesApi({
  date,
  startDate,
  endDate,
  allDates = false,
  mealType,
  cashier,
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

  if (mealType && mealType !== 'All') {
    params.set('meal_type', mealType)
  }
  if (cashier && cashier !== 'All') {
    params.set('cashier', cashier)
  }

  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await apiFetch(`${API_BASE}/sales${query}`, {
    method: 'GET',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to fetch sales')
  }

  return response.json()
}

export async function fetchSalesSummaryApi({
  date,
  startDate,
  endDate,
  allDates = false,
  mealType,
  cashier,
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

  if (mealType && mealType !== 'All') {
    params.set('meal_type', mealType)
  }
  if (cashier && cashier !== 'All') {
    params.set('cashier', cashier)
  }

  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await apiFetch(`${API_BASE}/sales/summary${query}`, {
    method: 'GET',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to fetch sales summary')
  }

  return response.json()
}

export async function fetchOverviewStatsApi() {
  const response = await apiFetch(`${API_BASE}/sales/overview-stats`, {
    method: 'GET',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to fetch overview stats')
  }

  return response.json()
}

export async function createSaleApi({
  customer_name,
  customer_phone,
  ward_number,
  patient_id,
  meal_type,
  items,
}) {
  const response = await apiFetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer_name,
      customer_phone,
      ward_number,
      patient_id,
      meal_type,
      items,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to create sale')
  }

  return response.json()
}

export async function updateSaleApi(
  id,
  { customer_name, customer_phone, ward_number, patient_id, meal_type, items }
) {
  const response = await apiFetch(`${API_BASE}/sales/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer_name,
      customer_phone,
      ward_number,
      patient_id,
      meal_type,
      items,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to update sale')
  }

  return response.json()
}

export async function deleteSaleApi(id) {
  const response = await apiFetch(`${API_BASE}/sales/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to delete sale')
  }

  return response.json()
}
