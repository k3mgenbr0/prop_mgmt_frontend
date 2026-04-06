<template>
  <article class="stat-card">
    <p>{{ label }}</p>
    <strong>{{ value }}</strong>
  </article>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  }
})
</script>
