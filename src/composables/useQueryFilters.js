import { reactive, watch } from 'vue'

export function useQueryFilters(route, router, defaults) {
  const filters = reactive({
    ...defaults,
    ...readQuery(route.query, defaults)
  })

  watch(
    () => route.query,
    (query) => {
      Object.assign(filters, {
        ...filters,
        ...readQuery(query, defaults)
      })
    }
  )

  watch(
    filters,
    (nextFilters) => {
      const nextQuery = { ...route.query }

      Object.entries(defaults).forEach(([key, defaultValue]) => {
        const value = nextFilters[key]

        if (value === defaultValue || value === '' || value == null) {
          delete nextQuery[key]
        } else {
          nextQuery[key] = String(value)
        }
      })

      router.replace({ query: nextQuery })
    },
    { deep: true }
  )

  return filters
}

function readQuery(query, defaults) {
  return Object.fromEntries(
    Object.entries(defaults).map(([key, defaultValue]) => [key, query[key] ?? defaultValue])
  )
}
