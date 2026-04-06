<template>
  <div class="toast-stack">
    <article v-for="toast in toasts" :key="toast.id" :class="['toast-card', `toast-${toast.variant}`]">
      <strong>{{ toast.title }}</strong>
      <p>{{ toast.message }}</p>
    </article>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { listenForToasts } from '../utils/toasts'

const toasts = ref([])
let stopListening = null

onMounted(() => {
  stopListening = listenForToasts((event) => {
    const toast = {
      id: crypto.randomUUID(),
      title: event.detail.title || 'Notice',
      message: event.detail.message || '',
      variant: event.detail.variant || 'info'
    }

    toasts.value = [...toasts.value, toast]

    window.setTimeout(() => {
      toasts.value = toasts.value.filter((item) => item.id !== toast.id)
    }, 3200)
  })
})

onUnmounted(() => {
  stopListening?.()
})
</script>
