export function parseCurrencyString(value) {
  if (!value) {
    return 0
  }

  const normalized = String(value).replace(/[$,()]/g, '')
  const amount = Number.parseFloat(normalized)

  if (Number.isNaN(amount)) {
    return 0
  }

  return value.includes('(') ? amount * -1 : amount
}

export function formatCurrency(value) {
  const amount = typeof value === 'string' ? parseCurrencyString(value) : Number(value || 0)

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function formatDate(value) {
  if (!value) {
    return 'No date'
  }

  const date = new Date(`${value}T00:00:00`)

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

export function formatDateTime(value) {
  if (!value) {
    return 'No timestamp'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value))
}

export function inDateRange(value, start, end) {
  if (!value) {
    return false
  }

  const date = value.slice(0, 10)

  if (start && date < start) {
    return false
  }

  if (end && date > end) {
    return false
  }

  return true
}
