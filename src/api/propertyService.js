import { apiRequest } from './client'

export function getApiStatus() {
  return apiRequest('/')
}

export function getProperties() {
  return apiRequest('/properties')
}

export function getProperty(propertyId) {
  return apiRequest(`/properties/${propertyId}`)
}

export function getPropertySummary(propertyId) {
  return apiRequest(`/properties/${propertyId}/summary`)
}

export function getPropertyTotals(propertyId) {
  return apiRequest(`/totals/${propertyId}`)
}

export function createProperty(payload) {
  return apiRequest('/properties', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function updateProperty(propertyId, payload) {
  return apiRequest(`/properties/${propertyId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export function deleteProperty(propertyId) {
  return apiRequest(`/properties/${propertyId}`, {
    method: 'DELETE'
  })
}

export function getIncome(propertyId) {
  return apiRequest(`/income/${propertyId}`)
}

export function createIncome(propertyId, payload) {
  return apiRequest(`/income/${propertyId}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function getExpenses(propertyId) {
  return apiRequest(`/expenses/${propertyId}`)
}

export function createExpense(propertyId, payload) {
  return apiRequest(`/expenses/${propertyId}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
