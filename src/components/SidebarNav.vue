<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <p class="eyebrow">Property Management</p>
      <h2>Operations</h2>
      <p class="muted">Live portfolio view powered by your Cloud Run API.</p>
    </div>

    <nav class="sidebar-nav">
      <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="sidebar-link">
        <span class="sidebar-link-title">{{ item.label }}</span>
        <span class="sidebar-link-subtitle">{{ item.caption }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router'

const items = [
  { to: '/', label: 'Dashboard', caption: 'Live metrics and portfolio summary' },
  { to: '/properties', label: 'Properties', caption: 'All property records from the API' },
  { to: '/properties/new', label: 'Add Property', caption: 'Create a new property record' },
  { to: '/income', label: 'Income', caption: 'Income activity across the portfolio' },
  { to: '/expenses', label: 'Expenses', caption: 'Expense activity across the portfolio' },
  { to: '/api-status', label: 'API Status', caption: 'Connectivity and environment details' }
]
</script>
