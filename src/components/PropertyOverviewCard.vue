<template>
  <article class="card property-card property-card-rich">
    <div class="card-header">
      <div>
        <h3>{{ property.name }}</h3>
        <p class="muted">{{ property.property_type }} · {{ property.city }}, {{ property.state }}</p>
      </div>
      <span :class="['pill', property.occupied ? 'pill-occupied' : 'pill-vacant']">
        {{ property.occupied ? 'Occupied' : 'Vacant' }}
      </span>
    </div>

    <div class="stack-sm">
      <p>{{ property.address }}</p>
      <p class="muted">Tenant: {{ property.tenant_name || 'No tenant on file' }}</p>
    </div>

    <div class="mini-stats">
      <div>
        <span class="mini-label">Monthly Rent</span>
        <strong>{{ property.monthly_rent }}</strong>
      </div>
      <div>
        <span class="mini-label">Income Records</span>
        <strong>{{ property.incomeRecordCount }}</strong>
      </div>
      <div>
        <span class="mini-label">Expense Records</span>
        <strong>{{ property.expenseRecordCount }}</strong>
      </div>
      <div>
        <span class="mini-label">Net Cash Flow</span>
        <strong>{{ property.totals.net_cash_flow }}</strong>
      </div>
    </div>

    <div class="card-actions">
      <RouterLink class="button button-secondary" :to="`/properties/${property.property_id}`">
        View Details
      </RouterLink>
      <RouterLink class="button button-secondary" :to="`/properties/${property.property_id}/edit`">
        Edit
      </RouterLink>
    </div>
  </article>
</template>

<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  property: {
    type: Object,
    required: true
  }
})
</script>
