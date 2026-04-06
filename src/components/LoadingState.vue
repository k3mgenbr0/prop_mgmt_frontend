<template>
  <div class="loading-state">
    <div class="spinner" />
    <p>{{ label }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: 'Loading...'
  }
})
</script>
