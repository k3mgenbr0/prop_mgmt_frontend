<template>
  <article class="card stat-card">
    <p class="mini-label">{{ label }}</p>
    <strong class="stat-card-value">{{ value }}</strong>
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
