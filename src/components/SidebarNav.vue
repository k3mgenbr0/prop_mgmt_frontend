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

    <section class="sidebar-accessibility">
      <p class="eyebrow">Accessibility</p>

      <label class="sidebar-setting">
        <span>Larger text</span>
        <select v-model="settings.fontScale">
          <option value="default">Default</option>
          <option value="large">Large</option>
        </select>
      </label>

      <label class="sidebar-toggle">
        <span>Readable font</span>
        <input v-model="settings.readableFont" type="checkbox" />
      </label>

      <label class="sidebar-toggle">
        <span>Underline links</span>
        <input v-model="settings.underlineLinks" type="checkbox" />
      </label>

      <label class="sidebar-toggle">
        <span>Comfortable spacing</span>
        <input v-model="settings.comfortableSpacing" type="checkbox" />
      </label>

      <label class="sidebar-toggle">
        <span>Reduced motion</span>
        <input v-model="settings.reducedMotion" type="checkbox" />
      </label>

      <label class="sidebar-toggle">
        <span>High contrast</span>
        <input v-model="settings.highContrast" type="checkbox" />
      </label>
    </section>
  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useAccessibility } from '../composables/useAccessibility'

const items = [
  { to: '/', label: 'Home', caption: 'Start here and choose a workflow' },
  { to: '/dashboard', label: 'Dashboard', caption: 'Live metrics and portfolio summary' },
  { to: '/properties', label: 'Properties', caption: 'All property records from the API' },
  { to: '/properties/new', label: 'Add Property', caption: 'Create a new property record' },
  { to: '/income', label: 'Income', caption: 'Income activity across the portfolio' },
  { to: '/expenses', label: 'Expenses', caption: 'Expense activity across the portfolio' },
  { to: '/reports', label: 'Reports', caption: 'Printable summaries and rankings' },
  { to: '/api-status', label: 'API Status', caption: 'Connectivity and environment details' }
]

const { settings } = useAccessibility()
</script>
