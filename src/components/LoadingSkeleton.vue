<template>
  <section class="skeleton-grid">
    <div v-for="index in count" :key="index" class="skeleton-card">
      <div class="skeleton-line skeleton-line-title"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line skeleton-line-short"></div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 3
  }
})
</script>
