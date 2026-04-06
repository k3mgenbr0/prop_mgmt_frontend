<template>
  <section class="stack-lg">
    <div class="hero card">
      <div>
        <p class="eyebrow">Income</p>
        <h2>Income Activity</h2>
        <p class="muted">This view aggregates live income records fetched property by property from the backend.</p>
      </div>
      <button class="button button-secondary" :disabled="loading" @click="loadIncomeOverview">
        {{ loading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    <AlertMessage :message="errorMessage" variant="error" />
    <LoadingState v-if="loading" label="Loading income records..." />

    <template v-else>
      <div class="stats-grid">
        <StatCard label="Properties Loaded" :value="String(snapshot.summary.totalProperties)" />
        <StatCard label="Income Records" :value="String(snapshot.summary.totalIncomeRecords)" />
        <StatCard label="Total Income" :value="formatCurrency(snapshot.summary.totalIncomeAmount)" />
      </div>

      <EmptyState
        v-if="incomeRows.length === 0"
        title="No income records returned"
        description="The frontend reached the backend, but there are no income rows to display."
      />

      <div v-else class="record-list">
        <article v-for="row in incomeRows" :key="row.key" class="card record-card">
          <div class="card-header">
            <div>
              <strong>{{ row.amount }}</strong>
              <p class="muted">{{ row.propertyName }}</p>
            </div>
            <span class="muted">{{ formatDate(row.date) }}</span>
          </div>
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
const snapshot = ref({ properties: [], summary: { totalProperties: 0, totalIncomeRecords: 0, totalIncomeAmount: 0 } })

const incomeRows = computed(() =>
  snapshot.value.properties
    .flatMap((property) =>
      property.incomeRecords.map((income) => ({
        ...income,
        key: `${property.property_id}-${income.income_id}`,
        propertyName: property.name
      }))
    )
    .sort((left, right) => `${right.date}-${right.income_id}`.localeCompare(`${left.date}-${left.income_id}`))
)

async function loadIncomeOverview() {
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

onMounted(loadIncomeOverview)
</script>
