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
        <span class="mini-label">Rent Status</span>
        <strong :class="['rent-status', `rent-status-${property.rentStatus}`]">
          {{ getRentStatusLabel(property.rentStatus) }}
        </strong>
      </div>
      <div>
        <span class="mini-label">Collected This Month</span>
        <strong>{{ formatCurrency(property.currentMonthIncomeValue) }}</strong>
      </div>
      <div>
        <span class="mini-label">Rent Gap This Month</span>
        <strong :class="property.paymentGapValue > 0 ? 'amount-negative' : 'amount-positive'">
          {{ formatCurrency(property.paymentGapValue) }}
        </strong>
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
      <button
        :class="['button', selected ? 'button-primary' : 'button-secondary']"
        @click="$emit('toggle-compare', property.property_id)"
      >
        {{ selected ? 'Remove Compare' : 'Compare' }}
      </button>
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
import { formatCurrency } from '../utils/formatters'

defineEmits(['toggle-compare'])

defineProps({
  property: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

function getRentStatusLabel(status) {
  if (status === 'paid') return 'Paid'
  if (status === 'partial') return 'Partial'
  if (status === 'late') return 'Late'
  return 'Vacant'
}
</script>
