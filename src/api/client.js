const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://prop-mgmt-api-129124698283.us-central1.run.app'

if (!API_BASE_URL) {
  console.warn('VITE_API_BASE_URL is not set. API requests will fail until it is configured.')
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const error = new Error(extractErrorMessage(data, response.statusText))
    error.status = response.status
    error.payload = data
    throw error
  }

  return data
}

function extractErrorMessage(data, fallback) {
  if (!data) {
    return fallback || 'Request failed.'
  }

  if (typeof data === 'string') {
    return data
  }

  if (Array.isArray(data.details) && data.details.length > 0) {
    return data.details.map((detail) => `${detail.field}: ${detail.message}`).join(' ')
  }

  return data.message || fallback || 'Request failed.'
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  return parseResponse(response)
}
