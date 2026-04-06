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
        <StatCard label="Income Records" :value="String(filteredIncomeRows.length)" />
        <StatCard label="Total Income" :value="formatCurrency(filteredIncomeTotal)" />
      </div>

      <section class="card filters-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Filters</p>
            <h3>Refine live income records</h3>
          </div>
        </div>

        <div class="filter-grid">
          <label>
            Property
            <select v-model="filters.property">
              <option value="">All properties</option>
              <option v-for="property in propertyOptions" :key="property" :value="property">{{ property }}</option>
            </select>
          </label>

          <label>
            Year
            <select v-model="filters.year">
              <option value="">All years</option>
              <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
            </select>
          </label>

          <label>
            Search Description
            <input v-model.trim="filters.search" placeholder="Rent, back payment, April..." />
          </label>
        </div>
      </section>

      <div class="detail-grid">
        <SimpleLineChart
          eyebrow="Trend"
          title="Income by month"
          :points="monthlyIncomeTrend"
          primary-label="Income"
          :primary-formatter="formatCurrency"
        />

        <SimpleBarChart
          eyebrow="Top Properties"
          title="Income by property"
          :items="incomeByProperty"
          :value-formatter="formatCurrency"
        />
      </div>

      <EmptyState
        v-if="allIncomeRows.length === 0"
        title="No income records returned"
        description="The frontend reached the backend, but there are no income rows to display."
      />

      <EmptyState
        v-else-if="filteredIncomeRows.length === 0"
        title="No income records match these filters"
        description="Try clearing one or more filters to show more live income records."
      />

      <div v-else class="record-list">
        <article v-for="row in filteredIncomeRows" :key="row.key" class="card record-card">
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
import { computed, onMounted, reactive, ref } from 'vue'
import { getPortfolioSnapshot } from '../api/dashboardService'
import AlertMessage from '../components/AlertMessage.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingState from '../components/LoadingState.vue'
import SimpleBarChart from '../components/SimpleBarChart.vue'
import SimpleLineChart from '../components/SimpleLineChart.vue'
import StatCard from '../components/StatCard.vue'
import { formatCurrency, formatDate, parseCurrencyString } from '../utils/formatters'

const loading = ref(true)
const errorMessage = ref('')
const snapshot = ref({ properties: [], summary: { totalProperties: 0, totalIncomeRecords: 0, totalIncomeAmount: 0 } })
const filters = reactive({
  property: '',
  year: '',
  search: ''
})

const allIncomeRows = computed(() =>
  snapshot.value.properties
    .flatMap((property) =>
      property.incomeRecords.map((income) => ({
        ...income,
        key: `${property.property_id}-${income.income_id}`,
        propertyName: property.name,
        amountValue: parseCurrencyString(income.amount),
        year: income.date.slice(0, 4)
      }))
    )
    .sort((left, right) => `${right.date}-${right.income_id}`.localeCompare(`${left.date}-${left.income_id}`))
)

const filteredIncomeRows = computed(() =>
  allIncomeRows.value.filter((row) => {
    const matchesProperty = !filters.property || row.propertyName === filters.property
    const matchesYear = !filters.year || row.year === filters.year
    const matchesSearch =
      !filters.search ||
      row.propertyName.toLowerCase().includes(filters.search.toLowerCase()) ||
      (row.description || '').toLowerCase().includes(filters.search.toLowerCase())

    return matchesProperty && matchesYear && matchesSearch
  })
)

const propertyOptions = computed(() =>
  [...new Set(allIncomeRows.value.map((row) => row.propertyName))].sort((left, right) => left.localeCompare(right))
)

const yearOptions = computed(() =>
  [...new Set(allIncomeRows.value.map((row) => row.year))].sort((left, right) => right.localeCompare(left))
)

const filteredIncomeTotal = computed(() =>
  filteredIncomeRows.value.reduce((sum, row) => sum + row.amountValue, 0)
)

const incomeByProperty = computed(() =>
  propertyOptions.value
    .map((propertyName) => ({
      label: propertyName,
      value: filteredIncomeRows.value
        .filter((row) => row.propertyName === propertyName)
        .reduce((sum, row) => sum + row.amountValue, 0)
    }))
    .filter((item) => item.value > 0)
)

const monthlyIncomeTrend = computed(() => {
  const buckets = new Map()

  filteredIncomeRows.value.forEach((row) => {
    const key = row.date.slice(0, 7)
    buckets.set(key, (buckets.get(key) || 0) + row.amountValue)
  })

  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-8)
    .map(([key, total]) => ({
      label: key.slice(5),
      primary: total
    }))
})

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
