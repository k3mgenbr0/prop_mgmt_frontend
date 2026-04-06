const STORAGE_PREFIX = 'prop_mgmt_notes_'

export function getPropertyNote(propertyId) {
  return localStorage.getItem(`${STORAGE_PREFIX}${propertyId}`) || ''
}

export function savePropertyNote(propertyId, note) {
  localStorage.setItem(`${STORAGE_PREFIX}${propertyId}`, note)
}
