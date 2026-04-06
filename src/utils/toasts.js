const TOAST_EVENT = 'prop-mgmt-toast'

export function pushToast(payload) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: payload }))
}

export function listenForToasts(handler) {
  window.addEventListener(TOAST_EVENT, handler)

  return () => window.removeEventListener(TOAST_EVENT, handler)
}
