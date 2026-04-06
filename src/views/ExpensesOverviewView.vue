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
        <StatCard label="Expense Records" :value="String(filteredExpenseRows.length)" />
        <StatCard label="Total Expenses" :value="formatCurrency(filteredExpenseTotal)" />
      </div>

      <section class="card filters-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Filters</p>
            <h3>Refine live expense records</h3>
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
            Category
            <select v-model="filters.category">
              <option value="">All categories</option>
              <option v-for="category in categoryOptions" :key="category" :value="category">{{ category }}</option>
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
            Search Vendor / Description
            <input v-model.trim="filters.search" placeholder="Mortgage, Allstate, repair..." />
          </label>
        </div>
      </section>

      <div class="detail-grid">
        <SimpleLineChart
          eyebrow="Trend"
          title="Expenses by month"
          :points="monthlyExpenseTrend"
          primary-label="Expenses"
          :primary-formatter="formatCurrency"
        />

        <SimpleBarChart
          eyebrow="Categories"
          title="Expenses by category"
          :items="expenseByCategory"
          :value-formatter="formatCurrency"
        />
      </div>

      <EmptyState
        v-if="allExpenseRows.length === 0"
        title="No expense records returned"
        description="The frontend reached the backend, but there are no expense rows to display."
      />

      <EmptyState
        v-else-if="filteredExpenseRows.length === 0"
        title="No expense records match these filters"
        description="Try clearing one or more filters to show more live expense records."
      />

      <div v-else class="record-list">
        <article v-for="row in filteredExpenseRows" :key="row.key" class="card record-card">
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
const snapshot = ref({ properties: [], summary: { totalProperties: 0, totalExpenseRecords: 0, totalExpenseAmount: 0 } })
const filters = reactive({
  property: '',
  category: '',
  year: '',
  search: ''
})

const allExpenseRows = computed(() =>
  snapshot.value.properties
    .flatMap((property) =>
      property.expenseRecords.map((expense) => ({
        ...expense,
        key: `${property.property_id}-${expense.expense_id}`,
        propertyName: property.name,
        amountValue: parseCurrencyString(expense.amount),
        year: expense.date.slice(0, 4)
      }))
    )
    .sort((left, right) => `${right.date}-${right.expense_id}`.localeCompare(`${left.date}-${left.expense_id}`))
)

const filteredExpenseRows = computed(() =>
  allExpenseRows.value.filter((row) => {
    const matchesProperty = !filters.property || row.propertyName === filters.property
    const matchesCategory = !filters.category || row.category === filters.category
    const matchesYear = !filters.year || row.year === filters.year
    const search = filters.search.toLowerCase()
    const matchesSearch =
      !filters.search ||
      row.propertyName.toLowerCase().includes(search) ||
      (row.vendor || '').toLowerCase().includes(search) ||
      (row.description || '').toLowerCase().includes(search)

    return matchesProperty && matchesCategory && matchesYear && matchesSearch
  })
)

const propertyOptions = computed(() =>
  [...new Set(allExpenseRows.value.map((row) => row.propertyName))].sort((left, right) => left.localeCompare(right))
)

const categoryOptions = computed(() =>
  [...new Set(allExpenseRows.value.map((row) => row.category))].sort((left, right) => left.localeCompare(right))
)

const yearOptions = computed(() =>
  [...new Set(allExpenseRows.value.map((row) => row.year))].sort((left, right) => right.localeCompare(left))
)

const filteredExpenseTotal = computed(() =>
  filteredExpenseRows.value.reduce((sum, row) => sum + row.amountValue, 0)
)

const expenseByCategory = computed(() =>
  categoryOptions.value
    .map((category) => ({
      label: category,
      value: filteredExpenseRows.value
        .filter((row) => row.category === category)
        .reduce((sum, row) => sum + row.amountValue, 0)
    }))
    .filter((item) => item.value > 0)
)

const monthlyExpenseTrend = computed(() => {
  const buckets = new Map()

  filteredExpenseRows.value.forEach((row) => {
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
