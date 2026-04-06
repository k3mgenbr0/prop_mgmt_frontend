<template>
  <p v-if="message" :class="['alert', variantClass]">
    {{ message }}
  </p>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'info'
  }
})

const variantClass = computed(() => `alert-${props.variant}`)
</script>
