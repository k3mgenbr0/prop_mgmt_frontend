<template>
  <section class="stack-lg">
    <div class="hero card">
      <div>
        <p class="eyebrow">Live Dashboard</p>
        <h2>Portfolio Snapshot</h2>
        <p class="muted">
          Every widget and chart on this page is derived from live property, income, and expense responses from your backend API.
        </p>
      </div>
      <div class="card-actions">
        <button class="button button-secondary" :disabled="loading" @click="loadDashboard">
          {{ loading ? 'Refreshing...' : 'Refresh Data' }}
        </button>
        <RouterLink class="button button-primary" to="/properties/new">Add Property</RouterLink>
      </div>
    </div>

    <AlertMessage :message="flashMessage" variant="success" />
    <AlertMessage :message="errorMessage" variant="error" />

    <section class="card filters-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Date Range</p>
          <h3>Focus on a reporting window</h3>
        </div>
      </div>

      <div class="filter-grid">
        <label>
          Start Date
          <input v-model="filters.start" type="date" />
        </label>

        <label>
          End Date
          <input v-model="filters.end" type="date" />
        </label>

        <div class="quick-filter-group">
          <button class="button button-secondary" @click="setQuickRange(30)">Last 30 days</button>
          <button class="button button-secondary" @click="setQuickRange(90)">Last 90 days</button>
          <button class="button button-secondary" @click="clearRange">All time</button>
        </div>
      </div>
    </section>

    <LoadingSkeleton v-if="loading" :count="6" />

    <template v-else>
      <div class="stats-grid">
        <StatCard label="Total Properties" :value="String(snapshot.summary.totalProperties)" />
        <StatCard label="Occupied" :value="String(snapshot.summary.occupiedProperties)" />
        <StatCard label="Vacant" :value="String(snapshot.summary.vacantProperties)" />
        <StatCard label="Expected Monthly Rent" :value="formatCurrency(snapshot.summary.estimatedMonthlyRentTotal)" />
        <StatCard label="Income In Range" :value="formatCurrency(filteredSummary.incomeTotal)" />
        <StatCard label="Expenses In Range" :value="formatCurrency(filteredSummary.expenseTotal)" />
      </div>

      <div class="kpi-strip">
        <section class="card delta-card">
          <span class="mini-label">Income change vs previous period</span>
          <strong>{{ signedCurrency(deltas.income) }}</strong>
        </section>
        <section class="card delta-card">
          <span class="mini-label">Expense change vs previous period</span>
          <strong>{{ signedCurrency(deltas.expense) }}</strong>
        </section>
        <section class="card delta-card">
          <span class="mini-label">Net cash flow change</span>
          <strong>{{ signedCurrency(deltas.net) }}</strong>
        </section>
      </div>

      <div class="detail-grid dashboard-grid">
        <div class="stack-lg">
          <ConnectionPanel
            :api-base-url="apiBaseUrl"
            :api-status="snapshot.apiStatus"
            :last-refreshed="snapshot.lastRefreshed"
            :property-count="snapshot.summary.totalProperties"
          />

          <section class="card">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Rent Snapshot</p>
                <h3>Upcoming rent collection</h3>
              </div>
            </div>

            <div class="mini-stats mini-stats-wide">
              <div>
                <span class="mini-label">Expected this month</span>
                <strong>{{ formatCurrency(upcomingRent.expected) }}</strong>
              </div>
              <div>
                <span class="mini-label">Received this month</span>
                <strong>{{ formatCurrency(upcomingRent.received) }}</strong>
              </div>
              <div>
                <span class="mini-label">Remaining gap</span>
                <strong>{{ formatCurrency(upcomingRent.remaining) }}</strong>
              </div>
            </div>
          </section>

          <SimpleLineChart
            eyebrow="Cash Flow"
            title="Monthly income vs expenses"
            :points="monthlyTrend"
            primary-label="Income"
            secondary-label="Expenses"
            :primary-formatter="formatCurrency"
          />
        </div>

        <div class="stack-lg">
          <SimpleBarChart
            eyebrow="Rent Roll"
            title="Monthly rent by property"
            :items="propertyRentBars"
            :value-formatter="formatCurrency"
          />

          <section class="card">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Activity</p>
                <h3>Recent portfolio activity</h3>
              </div>
            </div>

            <EmptyState
              v-if="recentActivity.length === 0"
              title="No recent activity"
              description="Income and expense responses were empty for the current portfolio snapshot."
            />

            <div v-else class="record-list">
              <article v-for="item in recentActivity" :key="item.key" class="card record-card activity-card">
                <div class="card-header">
                  <div>
                    <strong>{{ item.title }}</strong>
                    <p class="muted">{{ item.propertyName }} · {{ item.description }}</p>
                  </div>
                  <div class="stack-sm activity-amount">
                    <strong :class="item.type === 'income' ? 'amount-positive' : 'amount-negative'">
                      {{ item.amount }}
                    </strong>
                    <span class="muted">{{ item.date }}</span>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getPortfolioSnapshot } from '../api/dashboardService'
import { useQueryFilters } from '../composables/useQueryFilters'
import AlertMessage from '../components/AlertMessage.vue'
import ConnectionPanel from '../components/ConnectionPanel.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import SimpleBarChart from '../components/SimpleBarChart.vue'
import SimpleLineChart from '../components/SimpleLineChart.vue'
import StatCard from '../components/StatCard.vue'
import { formatCurrency, inDateRange, parseCurrencyString } from '../utils/formatters'

const route = useRoute()
const router = useRouter()
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  'https://prop-mgmt-api-129124698283.us-central1.run.app'

const loading = ref(true)
const errorMessage = ref('')
const flashMessage = ref('')
const filters = useQueryFilters(route, router, {
  start: '',
  end: ''
})
const snapshot = ref({
  apiStatus: null,
  properties: [],
  summary: {
    totalProperties: 0,
    occupiedProperties: 0,
    vacantProperties: 0,
    totalIncomeRecords: 0,
    totalExpenseRecords: 0,
    estimatedMonthlyRentTotal: 0,
    totalIncomeAmount: 0,
    totalExpenseAmount: 0,
    netCashFlowAmount: 0
  },
  lastRefreshed: ''
})

const filteredSummary = computed(() => {
  const incomeTotal = snapshot.value.properties.reduce(
    (sum, property) =>
      sum +
      property.incomeRecords
        .filter((record) => inDateRange(record.date, filters.start, filters.end))
        .reduce((inner, record) => inner + parseCurrencyString(record.amount), 0),
    0
  )

  const expenseTotal = snapshot.value.properties.reduce(
    (sum, property) =>
      sum +
      property.expenseRecords
        .filter((record) => inDateRange(record.date, filters.start, filters.end))
        .reduce((inner, record) => inner + parseCurrencyString(record.amount), 0),
    0
  )

  return {
    incomeTotal,
    expenseTotal,
    netTotal: incomeTotal - expenseTotal
  }
})

const propertyRentBars = computed(() =>
  snapshot.value.properties.map((property) => ({
    label: property.name,
    value: parseCurrencyString(property.monthly_rent)
  }))
)

const monthlyTrend = computed(() => {
  const buckets = new Map()

  snapshot.value.properties.forEach((property) => {
    property.incomeRecords
      .filter((record) => inDateRange(record.date, filters.start, filters.end))
      .forEach((record) => {
        const key = record.date.slice(0, 7)
        const current = buckets.get(key) || { label: key.slice(5), primary: 0, secondary: 0 }
        current.primary += parseCurrencyString(record.amount)
        buckets.set(key, current)
      })

    property.expenseRecords
      .filter((record) => inDateRange(record.date, filters.start, filters.end))
      .forEach((record) => {
        const key = record.date.slice(0, 7)
        const current = buckets.get(key) || { label: key.slice(5), primary: 0, secondary: 0 }
        current.secondary += parseCurrencyString(record.amount)
        buckets.set(key, current)
      })
  })

  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-8)
    .map(([, value]) => value)
})

const recentActivity = computed(() =>
  snapshot.value.properties
    .flatMap((property) => [
      ...property.incomeRecords
        .filter((record) => inDateRange(record.date, filters.start, filters.end))
        .map((record) => ({
          key: `income-${property.property_id}-${record.income_id}`,
          type: 'income',
          title: 'Income received',
          propertyName: property.name,
          description: record.description || 'No description provided.',
          amount: record.amount,
          date: record.date
        })),
      ...property.expenseRecords
        .filter((record) => inDateRange(record.date, filters.start, filters.end))
        .map((record) => ({
          key: `expense-${property.property_id}-${record.expense_id}`,
          type: 'expense',
          title: record.category,
          propertyName: property.name,
          description: record.description || record.vendor || 'No description provided.',
          amount: record.amount,
          date: record.date
        }))
    ])
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 6)
)

const upcomingRent = computed(() => {
  const today = new Date()
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const expected = snapshot.value.summary.estimatedMonthlyRentTotal
  const received = snapshot.value.properties.reduce(
    (sum, property) =>
      sum +
      property.incomeRecords
        .filter((record) => record.date.startsWith(monthKey))
        .reduce((inner, record) => inner + parseCurrencyString(record.amount), 0),
    0
  )

  return {
    expected,
    received,
    remaining: Math.max(expected - received, 0)
  }
})

const deltas = computed(() => {
  if (!(filters.start && filters.end)) {
    const now = new Date()
    const currentStart = new Date(now)
    currentStart.setDate(now.getDate() - 29)
    const previousEnd = new Date(currentStart)
    previousEnd.setDate(currentStart.getDate() - 1)
    const previousStart = new Date(previousEnd)
    previousStart.setDate(previousEnd.getDate() - 29)

    return computeDelta(windowRange(currentStart, now), windowRange(previousStart, previousEnd))
  }

  const start = new Date(filters.start)
  const end = new Date(filters.end)
  const diffDays = Math.max(1, Math.round((end - start) / 86400000) + 1)
  const previousEnd = new Date(start)
  previousEnd.setDate(start.getDate() - 1)
  const previousStart = new Date(previousEnd)
  previousStart.setDate(previousEnd.getDate() - (diffDays - 1))

  return computeDelta(windowRange(start, end), windowRange(previousStart, previousEnd))
})

function windowRange(start, end) {
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  }
}

function computePeriodTotals(range) {
  let income = 0
  let expense = 0

  snapshot.value.properties.forEach((property) => {
    property.incomeRecords
      .filter((record) => inDateRange(record.date, range.start, range.end))
      .forEach((record) => {
        income += parseCurrencyString(record.amount)
      })

    property.expenseRecords
      .filter((record) => inDateRange(record.date, range.start, range.end))
      .forEach((record) => {
        expense += parseCurrencyString(record.amount)
      })
  })

  return {
    income,
    expense,
    net: income - expense
  }
}

function computeDelta(currentRange, previousRange) {
  const current = computePeriodTotals(currentRange)
  const previous = computePeriodTotals(previousRange)

  return {
    income: current.income - previous.income,
    expense: current.expense - previous.expense,
    net: current.net - previous.net
  }
}

function signedCurrency(value) {
  const sign = value >= 0 ? '+' : '-'
  return `${sign}${formatCurrency(Math.abs(value))}`
}

function setQuickRange(days) {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  filters.start = start.toISOString().slice(0, 10)
  filters.end = end.toISOString().slice(0, 10)
}

function clearRange() {
  filters.start = ''
  filters.end = ''
}

async function loadDashboard() {
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

onMounted(() => {
  flashMessage.value = route.query.message || ''
  loadDashboard()
})
</script>
