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

    <LoadingState v-if="loading" label="Loading dashboard from the live API..." />

    <template v-else>
      <div class="stats-grid">
        <StatCard label="Total Properties" :value="String(snapshot.summary.totalProperties)" />
        <StatCard label="Occupied" :value="String(snapshot.summary.occupiedProperties)" />
        <StatCard label="Vacant" :value="String(snapshot.summary.vacantProperties)" />
        <StatCard label="Monthly Rent Total" :value="formatCurrency(snapshot.summary.estimatedMonthlyRentTotal)" />
        <StatCard label="Income Records" :value="String(snapshot.summary.totalIncomeRecords)" />
        <StatCard label="Expense Records" :value="String(snapshot.summary.totalExpenseRecords)" />
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
                <p class="eyebrow">Portfolio Metrics</p>
                <h3>Live totals derived from the database</h3>
              </div>
            </div>

            <div class="mini-stats mini-stats-wide">
              <div>
                <span class="mini-label">Total Income</span>
                <strong>{{ formatCurrency(snapshot.summary.totalIncomeAmount) }}</strong>
              </div>
              <div>
                <span class="mini-label">Total Expenses</span>
                <strong>{{ formatCurrency(snapshot.summary.totalExpenseAmount) }}</strong>
              </div>
              <div>
                <span class="mini-label">Net Cash Flow</span>
                <strong>{{ formatCurrency(snapshot.summary.netCashFlowAmount) }}</strong>
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

          <section class="card">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Properties</p>
                <h3>Live property feed</h3>
              </div>
              <RouterLink class="button button-secondary" to="/properties">Open full list</RouterLink>
            </div>

            <EmptyState
              v-if="snapshot.properties.length === 0"
              title="No properties returned by the API"
              description="The frontend is connected, but the backend returned an empty property list."
            />

            <div v-else class="record-list">
              <PropertyOverviewCard
                v-for="property in snapshot.properties.slice(0, 3)"
                :key="property.property_id"
                :property="property"
              />
            </div>
          </section>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getPortfolioSnapshot } from '../api/dashboardService'
import AlertMessage from '../components/AlertMessage.vue'
import ConnectionPanel from '../components/ConnectionPanel.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingState from '../components/LoadingState.vue'
import PropertyOverviewCard from '../components/PropertyOverviewCard.vue'
import SimpleBarChart from '../components/SimpleBarChart.vue'
import SimpleLineChart from '../components/SimpleLineChart.vue'
import StatCard from '../components/StatCard.vue'
import { formatCurrency, parseCurrencyString } from '../utils/formatters'

const route = useRoute()
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  'https://prop-mgmt-api-129124698283.us-central1.run.app'

const loading = ref(true)
const errorMessage = ref('')
const flashMessage = ref('')
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

const propertyRentBars = computed(() =>
  snapshot.value.properties.map((property) => ({
    label: property.name,
    value: parseCurrencyString(property.monthly_rent)
  }))
)

const monthlyTrend = computed(() => {
  const buckets = new Map()

  snapshot.value.properties.forEach((property) => {
    property.incomeRecords.forEach((record) => {
      const key = record.date.slice(0, 7)
      const current = buckets.get(key) || { label: key.slice(5), primary: 0, secondary: 0 }
      current.primary += parseCurrencyString(record.amount)
      buckets.set(key, current)
    })

    property.expenseRecords.forEach((record) => {
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
      ...property.incomeRecords.map((record) => ({
        key: `income-${property.property_id}-${record.income_id}`,
        type: 'income',
        title: 'Income received',
        propertyName: property.name,
        description: record.description || 'No description provided.',
        amount: record.amount,
        date: record.date
      })),
      ...property.expenseRecords.map((record) => ({
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
