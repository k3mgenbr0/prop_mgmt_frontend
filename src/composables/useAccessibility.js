import { reactive, watch } from 'vue'

const STORAGE_KEY = 'pm-accessibility'
const settings = reactive({
  fontScale: 'default',
  reducedMotion: false,
  highContrast: false,
  readableFont: false,
  underlineLinks: false,
  comfortableSpacing: false
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
  document.documentElement.setAttribute('data-readable-font', settings.readableFont ? 'enabled' : 'default')
  document.documentElement.setAttribute('data-underlines', settings.underlineLinks ? 'enabled' : 'default')
  document.documentElement.setAttribute('data-spacing', settings.comfortableSpacing ? 'comfortable' : 'default')
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
