import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'pm-theme'
const theme = ref('light')
let initialized = false

function resolveInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') {
    return saved
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(value) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.setAttribute('data-theme', value)
}

export function useTheme() {
  if (!initialized) {
    theme.value = resolveInitialTheme()
    applyTheme(theme.value)

    watch(theme, (nextTheme) => {
      applyTheme(nextTheme)
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    })

    initialized = true
  }

  const isDark = computed(() => theme.value === 'dark')

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return {
    theme,
    isDark,
    toggleTheme
  }
}
