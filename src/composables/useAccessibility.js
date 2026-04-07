import { reactive, watch } from 'vue'

const STORAGE_KEY = 'pm-accessibility'
const settings = reactive({
  fontScale: 'default',
  reducedMotion: false,
  highContrast: false
})
let initialized = false

function readStoredSettings() {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function applySettings() {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.setAttribute('data-font-scale', settings.fontScale)
  document.documentElement.setAttribute('data-motion', settings.reducedMotion ? 'reduced' : 'default')
  document.documentElement.setAttribute('data-contrast', settings.highContrast ? 'high' : 'default')
}

export function useAccessibility() {
  if (!initialized) {
    Object.assign(settings, readStoredSettings())
    applySettings()

    watch(
      settings,
      (nextSettings) => {
        applySettings()
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings))
      },
      { deep: true }
    )

    initialized = true
  }

  return {
    settings
  }
}
