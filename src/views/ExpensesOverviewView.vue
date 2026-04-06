<template>
  <section class="stack-lg">
    <div class="hero card">
      <div>
        <p class="eyebrow">Expenses</p>
        <h2>Expense Activity</h2>
        <p class="muted">This view aggregates live expense records fetched property by property from the backend.</p>
      </div>
      <button class="button button-secondary" :disabled="loading" @click="loadExpenseOverview">
        {{ loading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    <AlertMessage :message="errorMessage" variant="error" />
    <LoadingState v-if="loading" label="Loading expense records..." />

    <template v-else>
      <div class="stats-grid">
        <StatCard label="Properties Loaded" :value="String(snapshot.summary.totalProperties)" />
        <StatCard label="Expense Records" :value="String(snapshot.summary.totalExpenseRecords)" />
        <StatCard label="Total Expenses" :value="formatCurrency(snapshot.summary.totalExpenseAmount)" />
      </div>

      <EmptyState
        v-if="expenseRows.length === 0"
        title="No expense records returned"
        description="The frontend reached the backend, but there are no expense rows to display."
      />

      <div v-else class="record-list">
        <article v-for="row in expenseRows" :key="row.key" class="card record-card">
          <div class="card-header">
            <div>
              <strong>{{ row.amount }}</strong>
              <p class="muted">{{ row.propertyName }}</p>
            </div>
            <span class="muted">{{ formatDate(row.date) }}</span>
          </div>
          <p>{{ row.category }}<span v-if="row.vendor"> · {{ row.vendor }}</span></p>
          <p class="muted">{{ row.description || 'No description provided.' }}</p>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getPortfolioSnapshot } from '../api/dashboardService'
import AlertMessage from '../components/AlertMessage.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingState from '../components/LoadingState.vue'
import StatCard from '../components/StatCard.vue'
import { formatCurrency, formatDate } from '../utils/formatters'

const loading = ref(true)
const errorMessage = ref('')
const snapshot = ref({ properties: [], summary: { totalProperties: 0, totalExpenseRecords: 0, totalExpenseAmount: 0 } })

const expenseRows = computed(() =>
  snapshot.value.properties
    .flatMap((property) =>
      property.expenseRecords.map((expense) => ({
        ...expense,
        key: `${property.property_id}-${expense.expense_id}`,
        propertyName: property.name
      }))
    )
    .sort((left, right) => `${right.date}-${right.expense_id}`.localeCompare(`${left.date}-${left.expense_id}`))
)

async function loadExpenseOverview() {
  loading.value = true
  errorMessage.value = ''

  try {
    snapshot.value = await getPortfolioSnapshot()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

onMounted(loadExpenseOverview)
</script>
